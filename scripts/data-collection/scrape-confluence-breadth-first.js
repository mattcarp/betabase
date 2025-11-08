#!/usr/bin/env node

/**
 * Confluence Wiki Scraper - Breadth-First Crawl
 *
 * Starts from entry pages and follows all links to scrape AOMA, USM, and GMP spaces.
 * Extracts text content only (no screenshots).
 *
 * Usage:
 *   node scripts/data-collection/scrape-confluence-breadth-first.js
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

const SPACES = [
  {
    key: "AOMA",
    name: "AOMA",
    startUrl: `${CONFLUENCE_BASE_URL}/wiki/display/AOMA`,
  },
  {
    key: "USM",
    name: "USM",
    startUrl: `${CONFLUENCE_BASE_URL}/wiki/pages/viewpage.action?pageId=67863500`,
  },
  {
    key: "GMP",
    name: "GMP",
    startUrl: `${CONFLUENCE_BASE_URL}/wiki/display/GMP`,
  },
];

const MAX_PAGES_PER_SPACE = 100;
const AUTH_STORAGE_PATH = path.join(__dirname, "../../tmp/confluence-auth.json");
const LOG_FILE = path.join(__dirname, "../../logs/confluence-scrape.log");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Logging
async function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  console.log(message);
  
  try {
    await fs.mkdir(path.dirname(LOG_FILE), { recursive: true });
    await fs.appendFile(LOG_FILE, logMessage + "\n");
  } catch (error) {
    // Fail silently
  }
}

/**
 * Extract content from current page
 */
async function extractPageContent(page) {
  return await page.evaluate(() => {
    const mainContent = document.querySelector('#main-content, .wiki-content, .page-content');
    if (!mainContent) return null;
    
    const content = mainContent.cloneNode(true);
    
    // Remove unwanted elements
    const toRemove = content.querySelectorAll(
      '.page-metadata, .footer, nav, .navigation, script, style, .page-comments, ' +
      '.likes-section, .share-link, .aui-toolbar, .page-tree, .breadcrumbs, ' +
      '.ia-splitter-handle, button'
    );
    toRemove.forEach(el => el.remove());
    
    const title = document.querySelector('#title-text, h1.page-title')?.textContent?.trim() || 
                  document.title.replace(' - Confluence', '').trim();
    
    let text = content.innerText || content.textContent || '';
    text = text.trim();
    
    const spaceKey = window.location.pathname.match(/\/display\/([^\/]+)/)?.[1] || 
                    new URLSearchParams(window.location.search).get('spaceKey') || 'UNKNOWN';
    const pageId = new URLSearchParams(window.location.search).get('pageId') || null;
    
    return {
      title,
      content: text,
      url: window.location.href,
      spaceKey,
      pageId,
    };
  });
}

/**
 * Find all content links on current page
 */
async function findPageLinks(page, spaceKey) {
  return await page.evaluate((space) => {
    const links = Array.from(document.querySelectorAll('a[href]'));
    const unique = new Set();
    
    const excludePatterns = [
      '/viewpageattachments', '/viewpreviousversions', '/viewinfo', '/viewsource',
      '/pdfpageexport', '/exportword', '/pagebulklabel', '/pagebulkattachment',
      '/diffpages', '/createpage', '/edit/', '#', '/logout', '/admin', '/download/',
      'action=edit', 'decorator=', '/labels/'
    ];
    
    links.forEach(link => {
      const href = link.href;
      if (!href) return;
      
      // Must be wiki page
      if (!href.includes('/wiki/')) return;
      
      // Must be in this space
      const inSpace = href.includes(`/display/${space}/`) || 
                     (href.includes('pageId=') && href.includes(`spaceKey=${space}`));
      if (!inSpace) return;
      
      // Exclude utility pages
      const isUtility = excludePatterns.some(pattern => href.includes(pattern));
      if (isUtility) return;
      
      unique.add(href);
    });
    
    return Array.from(unique);
  }, spaceKey);
}

/**
 * Breadth-first crawl of a Confluence space
 */
async function crawlSpace(page, space) {
  await log(`\n${"=".repeat(70)}`);
  await log(`📖 Crawling ${space.name} Space`);
  await log(`${"=".repeat(70)}\n`);
  
  const visited = new Set();
  const queue = [space.startUrl];
  const pages = [];
  
  while (queue.length > 0 && pages.length < MAX_PAGES_PER_SPACE) {
    const url = queue.shift();
    
    // Skip if already visited
    if (visited.has(url)) continue;
    visited.add(url);
    
    await log(`  [${pages.length + 1}/${MAX_PAGES_PER_SPACE}] ${url.substring(0, 80)}...`);
    
    try {
      await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
      await page.waitForTimeout(1000);
      
      // Extract content
      const pageData = await extractPageContent(page);
      
      if (pageData && pageData.content && pageData.content.length > 100) {
        pages.push({
          ...pageData,
          space: space.key,
        });
        await log(`    ✅ Scraped: ${pageData.title} (${pageData.content.length} chars)`);
        
        // Find more links on this page
        const newLinks = await findPageLinks(page, space.key);
        newLinks.forEach(link => {
          if (!visited.has(link) && !queue.includes(link)) {
            queue.push(link);
          }
        });
        await log(`    Found ${newLinks.length} more links`);
        
      } else {
        await log(`    ⚠️  Skipped - insufficient content`);
      }
      
      // Rate limiting
      await page.waitForTimeout(500);
      
    } catch (error) {
      await log(`    ❌ Error: ${error.message}`);
    }
  }
  
  await log(`\n✅ ${space.name} complete: ${pages.length} pages scraped, ${queue.length} links remaining\n`);
  return pages;
}

/**
 * Main function
 */
async function main() {
  await log("🚀 Starting Confluence knowledge scraper (Breadth-First)");
  await log(`   Spaces: ${SPACES.map(s => s.key).join(", ")}`);
  await log(`   Max pages per space: ${MAX_PAGES_PER_SPACE}`);
  
  const browser = await chromium.launch({
    headless: false,
    slowMo: 100,
  });
  
  let allPages = [];
  let stats = { scraped: 0, stored: 0, errors: 0 };
  
  try {
    // Load auth or create new context
    let authState = null;
    try {
      const data = await fs.readFile(AUTH_STORAGE_PATH, "utf-8");
      authState = JSON.parse(data);
      await log("📂 Loaded existing authentication");
    } catch {
      await log("📂 No existing authentication found - you'll need to login");
    }
    
    const context = authState
      ? await browser.newContext({ storageState: authState })
      : await browser.newContext();
    
    const page = await context.newPage();
    
    // Navigate to Confluence and check login status
    await page.goto(CONFLUENCE_BASE_URL, { waitUntil: "networkidle" });
    await page.waitForTimeout(2000);
    
    // Check if logged in
    const loggedIn = await page.$('.aui-avatar, #user-menu-link');
    if (!loggedIn) {
      await log("\n🔐 NOT LOGGED IN");
      await log("👉 Please log in to Confluence in the browser window");
      await log("   (Solve CAPTCHA if needed)");
      await log("⏱️  Waiting up to 5 minutes for you to login...\n");
      
      // Wait for login (check for user avatar)
      try {
        await page.waitForSelector('.aui-avatar, #user-menu-link', { timeout: 300000 });
        await log("✅ Login detected!");
      } catch (e) {
        throw new Error("Login timeout - please try again");
      }
    } else {
      await log("✅ Already logged in!");
    }
    
    // Save auth state
    const state = await context.storageState();
    await fs.mkdir(path.dirname(AUTH_STORAGE_PATH), { recursive: true });
    await fs.writeFile(AUTH_STORAGE_PATH, JSON.stringify(state));
    await log("💾 Saved authentication state");
    
    // Crawl each space
    for (const space of SPACES) {
      const pages = await crawlSpace(page, space);
      allPages.push(...pages);
      stats.scraped += pages.length;
    }
    
    await log(`\n${"=".repeat(70)}`);
    await log(`📊 Scraping Complete: ${stats.scraped} total pages`);
    await log(`${"=".repeat(70)}\n`);
    
    if (allPages.length === 0) {
      await log("⚠️  No pages scraped - exiting");
      await browser.close();
      return;
    }
    
    // Generate embeddings
    await log(`🤖 Generating embeddings for ${allPages.length} pages...`);
    const texts = allPages.map(p => p.content);
    const embeddings = await generateEmbeddingsBatch(texts, {
      batchSize: 100,
      delayMs: 1000,
      onProgress: (progress) => {
        log(`   ${progress.processed}/${progress.total} embeddings`);
      },
    });
    
    await log(`✅ Generated ${embeddings.length} embeddings`);
    
    // Store in Supabase
    await log(`\n💾 Storing in Supabase...`);
    
    for (let i = 0; i < allPages.length; i++) {
      const pageData = allPages[i];
      const embedding = embeddings[i];
      
      try {
        const contentHash = crypto.createHash('md5').update(pageData.content).digest('hex');
        
        const { error } = await supabase
          .from('wiki_documents')
          .upsert({
            url: pageData.url,
            app_name: 'confluence',
            title: pageData.title,
            markdown_content: pageData.content,
            embedding: embedding,
            content_hash: contentHash,
            metadata: {
              space: pageData.space,
              page_id: pageData.pageId,
              sony_music: true,
              categories: ['wiki', 'documentation'],
              priority_content: ['AOMA', 'USM', 'GMP'].includes(pageData.space),
            },
            crawled_at: new Date().toISOString(),
          }, {
            onConflict: 'url,app_name',
          });
        
        if (error) {
          await log(`  ❌ Error storing: ${error.message}`);
          stats.errors++;
        } else {
          stats.stored++;
        }
      } catch (error) {
        await log(`  ❌ Error: ${error.message}`);
        stats.errors++;
      }
    }
    
    await browser.close();
    
    // Final summary
    await log(`\n${"=".repeat(70)}`);
    await log("📊 FINAL SUMMARY");
    await log(`${"=".repeat(70)}`);
    for (const space of SPACES) {
      const count = allPages.filter(p => p.space === space.key).length;
      await log(`${space.key}: ${count} pages`);
    }
    await log(`\nTotal scraped: ${stats.scraped}`);
    await log(`Total stored: ${stats.stored}`);
    await log(`Errors: ${stats.errors}`);
    await log(`${"=".repeat(70)}`);
    await log("\n✨ Done! Check logs at: " + LOG_FILE);
    
  } catch (error) {
    await log(`\n❌ Fatal error: ${error.message}`);
    await browser.close();
    process.exit(1);
  }
}

main().catch(error => {
  console.error("Fatal error:", error);
  process.exit(1);
});

