#!/usr/bin/env node

/**
 * Confluence USM Scraper - Targeted Approach
 * 
 * Starts from USM Client App Developer Guide and scrapes it + first-level links
 */

require("dotenv").config({ path: ".env.local" });

const { chromium } = require("playwright");
const fs = require("fs").promises;
const path = require("path");
const { createClient } = require("@supabase/supabase-js");
const { generateEmbeddingsBatch } = require("./utils/embeddings/openai");
const crypto = require("crypto");

// Configuration  
const USM_START_PAGE = "https://wiki.smedigitalapps.com/wiki/pages/viewpage.action?pageId=67863500&spaceKey=USM&title=Client%2BApplication%2BDevelopers%2BGuide%2Bto%2BUSM";
const AUTH_STORAGE_PATH = path.join(__dirname, "../tmp/confluence-auth.json");
const LOG_FILE = path.join(__dirname, "../logs/confluence-usm-scrape.log");

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
 * Extract content from page
 */
async function extractPageContent(page) {
  return await page.evaluate(() => {
    const mainContent = document.querySelector('#main-content, .wiki-content');
    if (!mainContent) return null;
    
    const content = mainContent.cloneNode(true);
    
    // Remove unwanted elements
    const toRemove = content.querySelectorAll(
      'script, style, .page-metadata, .footer, nav, .breadcrumbs, ' +
      'button, .aui-toolbar, .page-comments, .likes-section'
    );
    toRemove.forEach(el => el.remove());
    
    const title = document.querySelector('#title-text, h1')?.textContent?.trim() || document.title;
    const text = (content.innerText || content.textContent || '').trim();
    
    const spaceKey = new URLSearchParams(window.location.search).get('spaceKey') ||
                    window.location.pathname.match(/\/display\/([^\/]+)/)?.[1];
    const pageId = new URLSearchParams(window.location.search).get('pageId');
    
    return { title, content: text, url: window.location.href, spaceKey, pageId };
  });
}

/**
 * Find all first-level content links on current page
 */
async function findFirstLevelLinks(page) {
  return await page.evaluate(() => {
    const mainContent = document.querySelector('#main-content, .wiki-content');
    if (!mainContent) return [];
    
    const links = mainContent.querySelectorAll('a[href]');
    const unique = new Set();
    
    const excludePatterns = [
      'edit', 'export', 'pdf', 'attachment', 'version', 'diff', 
      'label', 'admin', 'logout', '#', 'createpage'
    ];
    
    Array.from(links).forEach(link => {
      const href = link.href;
      if (!href || !href.includes('/wiki/')) return;
      
      // Exclude utility links
      const isUtility = excludePatterns.some(pattern => href.toLowerCase().includes(pattern));
      if (isUtility) return;
      
      // Must be a viewpage or display link
      if (href.includes('viewpage.action?pageId=') || href.includes('/display/USM/')) {
        unique.add(href);
      }
    });
    
    return Array.from(unique);
  });
}

/**
 * Main function
 */
async function main() {
  await log("🚀 Confluence USM Scraper - Targeted Approach");
  await log(`   Start page: ${USM_START_PAGE}`);
  
  const browser = await chromium.launch({ headless: false, slowMo: 100 });
  
  try {
    // Load auth
    let authState = null;
    try {
      const data = await fs.readFile(AUTH_STORAGE_PATH, "utf-8");
      authState = JSON.parse(data);
      await log("📂 Loaded existing authentication");
    } catch {
      await log("📂 No auth found - will need manual login");
    }
    
    const context = authState
      ? await browser.newContext({ storageState: authState })
      : await browser.newContext();
    
    const page = await context.newPage();
    
    // Go to start page
    await log("\n📖 Navigating to USM Client Developer Guide...");
    await page.goto(USM_START_PAGE, { waitUntil: "networkidle", timeout: 60000 });
    await page.waitForTimeout(2000);
    
    // Check if logged in
    const loggedIn = await page.$('.aui-avatar, #user-menu-link');
    if (!loggedIn) {
      await log("\n🔐 NOT LOGGED IN - Please log in manually");
      await log("   (Solve CAPTCHA if needed)");
      await log("⏱️  Waiting for login...\n");
      
      await page.waitForSelector('.aui-avatar, #user-menu-link', { timeout: 300000 });
      await log("✅ Login detected!");
      
      // Save auth for next time
      await fs.writeFile(AUTH_STORAGE_PATH, JSON.stringify(await context.storageState()));
      await log("💾 Saved authentication");
      
      // Re-navigate to start page after login
      await page.goto(USM_START_PAGE, { waitUntil: "networkidle" });
      await page.waitForTimeout(2000);
    }
    
    const allPages = [];
    
    // Extract content from start page
    await log("\n📄 Extracting main page content...");
    const startPageData = await extractPageContent(page);
    
    if (startPageData && startPageData.content && startPageData.content.length > 100) {
      allPages.push(startPageData);
      await log(`✅ Main page: ${startPageData.title} (${startPageData.content.length} chars)`);
    }
    
    // Find all first-level links
    await log("\n🔗 Finding first-level links...");
    const firstLevelLinks = await findFirstLevelLinks(page);
    await log(`Found ${firstLevelLinks.length} first-level links`);
    
    // Scrape each first-level linked page
    for (let i = 0; i < firstLevelLinks.length; i++) {
      const url = firstLevelLinks[i];
      await log(`\n[${i + 1}/${firstLevelLinks.length}] ${url.substring(0, 80)}...`);
      
      try {
        await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
        await page.waitForTimeout(500);
        
        const pageData = await extractPageContent(page);
        
        if (pageData && pageData.content && pageData.content.length > 100) {
          allPages.push(pageData);
          await log(`  ✅ ${pageData.title} (${pageData.content.length} chars)`);
        } else {
          await log(`  ⚠️  Skipped - insufficient content`);
        }
        
        // Rate limit
        await page.waitForTimeout(500);
        
      } catch (error) {
        await log(`  ❌ Error: ${error.message}`);
      }
    }
    
    await log(`\n${"=".repeat(70)}`);
    await log(`📊 Scraping Complete: ${allPages.length} pages extracted`);
    await log(`${"=".repeat(70)}\n`);
    
    if (allPages.length === 0) {
      await log("⚠️  No pages scraped");
      await browser.close();
      return;
    }
    
    // Generate embeddings
    await log("🤖 Generating embeddings...");
    const embeddings = await generateEmbeddingsBatch(
      allPages.map(p => p.content),
      { 
        batchSize: 100, 
        delayMs: 1000, 
        onProgress: p => log(`   ${p.processed}/${p.total} embeddings`)
      }
    );
    await log(`✅ Generated ${embeddings.length} embeddings`);
    
    // Store in Supabase
    await log("\n💾 Storing in Supabase wiki_documents...");
    let stored = 0;
    let updated = 0;
    let errors = 0;
    
    for (let i = 0; i < allPages.length; i++) {
      const pageData = allPages[i];
      const contentHash = crypto.createHash('md5').update(pageData.content).digest('hex');
      
      try {
        const { data, error } = await supabase
          .from('wiki_documents')
          .upsert({
            url: pageData.url,
            app_name: 'confluence',
            title: pageData.title,
            markdown_content: pageData.content,
            embedding: embeddings[i],
            content_hash: contentHash,
            metadata: {
              space: pageData.spaceKey || 'USM',
              page_id: pageData.pageId,
              sony_music: true,
              categories: ['wiki', 'documentation'],
              priority_content: true,
              scraped_from: 'targeted_usm_scrape',
            },
            crawled_at: new Date().toISOString(),
          }, { 
            onConflict: 'url,app_name'
          })
          .select()
          .single();
        
        if (error) {
          await log(`  ❌ Error storing ${pageData.title}: ${error.message}`);
          errors++;
        } else {
          stored++;
          if ((i + 1) % 5 === 0) {
            await log(`  Progress: ${i + 1}/${allPages.length} stored`);
          }
        }
      } catch (error) {
        await log(`  ❌ Error: ${error.message}`);
        errors++;
      }
    }
    
    await browser.close();
    
    // Final summary
    await log(`\n${"=".repeat(70)}`);
    await log("✨ FINAL SUMMARY");
    await log(`${"=".repeat(70)}`);
    await log(`Pages scraped: ${allPages.length}`);
    await log(`Successfully stored: ${stored}`);
    await log(`Errors: ${errors}`);
    await log(`${"=".repeat(70)}`);
    await log(`\n📝 Full log: ${LOG_FILE}`);
    await log("🎉 USM scraping complete!");
    
  } catch (error) {
    await log(`\n❌ Fatal error: ${error.message}`);
    await log(error.stack);
    await browser.close();
    process.exit(1);
  }
}

main().catch(error => {
  console.error("Fatal error:", error);
  process.exit(1);
});


