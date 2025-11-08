#!/usr/bin/env node

/**
 * Confluence Hybrid Scraper
 * 
 * Uses REST API to discover pages, Playwright to scrape content
 * Best of both worlds!
 */

require("dotenv").config({ path: ".env.local" });

const { chromium } = require("playwright");
const fs = require("fs").promises;
const path = require("path");
const { createClient } = require("@supabase/supabase-js");
const { generateEmbeddingsBatch } = require("../../utils/embeddings/openai");
const crypto = require("crypto");

// Configuration  
const CONFLUENCE_BASE_URL = "https://wiki.smedigitalapps.com";
const CONFLUENCE_USERNAME = process.env.CONFLUENCE_USERNAME;
const CONFLUENCE_API_TOKEN = process.env.CONFLUENCE_API_TOKEN;

const SPACES = ["AOMA", "USM", "GMP"];
const MAX_PAGES_PER_SPACE = 100;
const AUTH_STORAGE_PATH = path.join(__dirname, "../../tmp/confluence-auth.json");
const LOG_FILE = path.join(__dirname, "../../logs/confluence-scrape.log");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  console.log(message);
  try {
    await fs.mkdir(path.dirname(LOG_FILE), { recursive: true });
    await fs.appendFile(LOG_FILE, logMessage + "\n");
  } catch {}
}

/**
 * Use REST API to discover all pages in a space
 */
async function discoverPagesAPI(spaceKey) {
  await log(`  🔍 Using REST API to discover ${spaceKey} pages...`);
  
  const auth = Buffer.from(`${CONFLUENCE_USERNAME}:${CONFLUENCE_API_TOKEN}`).toString('base64');
  const url = `${CONFLUENCE_BASE_URL}/wiki/rest/api/content?spaceKey=${spaceKey}&type=page&limit=100&expand=version,metadata.labels`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      await log(`    ⚠️  API returned ${response.status} - will try manual navigation`);
      return [];
    }
    
    const data = await response.json();
    const pages = data.results || [];
    
    const pageUrls = pages.map(page => {
      const webui = page._links?.webui;
      return webui ? `${CONFLUENCE_BASE_URL}${webui}` : null;
    }).filter(Boolean);
    
    await log(`    ✅ API found ${pageUrls.length} pages`);
    return pageUrls;
    
  } catch (error) {
    await log(`    ⚠️  API error: ${error.message}`);
    return [];
  }
}

/**
 * Extract content from page
 */
async function extractPageContent(page) {
  return await page.evaluate(() => {
    const mainContent = document.querySelector('#main-content, .wiki-content');
    if (!mainContent) return null;
    
    const content = mainContent.cloneNode(true);
    const toRemove = content.querySelectorAll(
      'script, style, .page-metadata, nav, .breadcrumbs, button, .aui-toolbar'
    );
    toRemove.forEach(el => el.remove());
    
    const title = document.querySelector('#title-text')?.textContent?.trim() || document.title;
    const text = (content.innerText || content.textContent || '').trim();
    
    const spaceKey = window.location.pathname.match(/\/display\/([^\/]+)/)?.[1] || 
                    new URLSearchParams(window.location.search).get('spaceKey');
    const pageId = new URLSearchParams(window.location.search).get('pageId');
    
    return { title, content: text, url: window.location.href, spaceKey, pageId };
  });
}

/**
 * Main function
 */
async function main() {
  await log("🚀 Confluence Hybrid Scraper (API Discovery + Browser Scraping)");
  await log(`   Spaces: ${SPACES.join(", ")}`);
  
  const browser = await chromium.launch({ headless: false, slowMo: 100 });
  let allPages = [];
  
  try {
    // Load auth
    let authState = null;
    try {
      const data = await fs.readFile(AUTH_STORAGE_PATH, "utf-8");
      authState = JSON.parse(data);
    } catch {}
    
    const context = authState
      ? await browser.newContext({ storageState: authState })
      : await browser.newContext();
    
    const page = await context.newPage();
    
    // Navigate and check login
    await page.goto(CONFLUENCE_BASE_URL, { waitUntil: "networkidle" });
    const loggedIn = await page.$('.aui-avatar');
    
    if (!loggedIn) {
      await log("\n🔐 Please log in manually in the browser");
      await log("⏱️  Waiting 5 minutes...");
      await page.waitForSelector('.aui-avatar', { timeout: 300000 });
    }
    
    // Save auth
    await fs.writeFile(AUTH_STORAGE_PATH, JSON.stringify(await context.storageState()));
    await log("✅ Authenticated");
    
    // Process each space
    for (const spaceKey of SPACES) {
      await log(`\n${"=".repeat(70)}`);
      await log(`📖 Processing ${spaceKey} Space`);
      await log(`${"=".repeat(70)}\n`);
      
      // Try API first
      let pageUrls = await discoverPagesAPI(spaceKey);
      
      // If API fails, try manual navigation  
      if (pageUrls.length === 0) {
        await log(`  📂 Navigating manually to ${spaceKey} space...`);
        await page.goto(`${CONFLUENCE_BASE_URL}/wiki/display/${spaceKey}`, { waitUntil: "networkidle" });
        await page.waitForTimeout(2000);
        
        // Look for page links
        pageUrls = await page.evaluate((space) => {
          const links = document.querySelectorAll(`a[href*="/display/${space}/"], a[href*="pageId="]`);
          return Array.from(links)
            .map(a => a.href)
            .filter(h => h && !h.includes('edit') && !h.includes('export'));
        }, spaceKey);
        
        await log(`    Found ${pageUrls.length} links manually`);
      }
      
      // Scrape each page
      for (let i = 0; i < Math.min(pageUrls.length, MAX_PAGES_PER_SPACE); i++) {
        const url = pageUrls[i];
        await log(`  [${i + 1}/${pageUrls.length}] ${url.substring(0, 70)}...`);
        
        try {
          await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
          await page.waitForTimeout(500);
          
          const pageData = await extractPageContent(page);
          
          if (pageData && pageData.content && pageData.content.length > 100) {
            allPages.push({ ...pageData, space: spaceKey });
            await log(`    ✅ ${pageData.title.substring(0, 50)} (${pageData.content.length} chars)`);
          } else {
            await log(`    ⚠️  Skipped - no content`);
          }
        } catch (error) {
          await log(`    ❌ ${error.message}`);
        }
      }
    }
    
    await log(`\n✅ Total scraped: ${allPages.length} pages`);
    
    if (allPages.length > 0) {
      // Generate embeddings
      await log("\n🤖 Generating embeddings...");
      const embeddings = await generateEmbeddingsBatch(
        allPages.map(p => p.content),
        { batchSize: 100, delayMs: 1000, onProgress: p => log(`   ${p.processed}/${p.total}`) }
      );
      
      // Store in Supabase
      await log("\n💾 Storing in Supabase...");
      let stored = 0;
      
      for (let i = 0; i < allPages.length; i++) {
        const pageData = allPages[i];
        const contentHash = crypto.createHash('md5').update(pageData.content).digest('hex');
        
        const { error } = await supabase.from('wiki_documents').upsert({
          url: pageData.url,
          app_name: 'confluence',
          title: pageData.title,
          markdown_content: pageData.content,
          embedding: embeddings[i],
          content_hash: contentHash,
          metadata: {
            space: pageData.space,
            page_id: pageData.pageId,
            sony_music: true,
            categories: ['wiki', 'documentation'],
            priority_content: ['AOMA', 'USM', 'GMP'].includes(pageData.space),
          },
          crawled_at: new Date().toISOString(),
        }, { onConflict: 'url,app_name' });
        
        if (!error) stored++;
      }
      
      await log(`✅ Stored ${stored}/${allPages.length} pages`);
    }
    
    await browser.close();
    await log("\n✨ Complete!");
    
  } catch (error) {
    await log(`❌ Fatal: ${error.message}`);
    await browser.close();
    process.exit(1);
  }
}

main();


