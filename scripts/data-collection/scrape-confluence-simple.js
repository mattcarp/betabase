#!/usr/bin/env node

/**
 * Confluence Wiki Scraper (Simple JavaScript Version)
 *
 * Scrapes AOMA, USM, and GMP Confluence spaces for knowledge content.
 * Extracts text content only (no screenshots, no DOM dumps).
 *
 * Usage:
 *   node scripts/data-collection/scrape-confluence-simple.js
 *   node scripts/data-collection/scrape-confluence-simple.js --headless
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
const CONFLUENCE_PASSWORD = process.env.CONFLUENCE_PASSWORD;

const SPACES = [
  { key: "AOMA", name: "AOMA", url: `${CONFLUENCE_BASE_URL}/wiki/display/AOMA` },
  { key: "USM", name: "USM", url: `${CONFLUENCE_BASE_URL}/wiki/display/USM` },
  { key: "GMP", name: "GMP", url: `${CONFLUENCE_BASE_URL}/wiki/display/GMP` },
];

const AUTH_STORAGE_PATH = path.join(__dirname, "../../tmp/confluence-auth.json");
const OUTPUT_DIR = path.join(__dirname, "../../tmp/confluence-scraped");
const LOG_FILE = path.join(__dirname, "../../logs/confluence-scrape.log");

// Command line arguments
const args = process.argv.slice(2);
const headless = args.includes("--headless");

// Supabase client
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
    const logDir = path.dirname(LOG_FILE);
    await fs.mkdir(logDir, { recursive: true });
    await fs.appendFile(LOG_FILE, logMessage + "\n");
  } catch (error) {
    // Fail silently if logging fails
  }
}

/**
 * Save/Load auth state
 */
async function saveAuth(context) {
  const state = await context.storageState();
  await fs.mkdir(path.dirname(AUTH_STORAGE_PATH), { recursive: true });
  await fs.writeFile(AUTH_STORAGE_PATH, JSON.stringify(state));
  await log("💾 Saved authentication state");
}

async function loadAuth() {
  try {
    const data = await fs.readFile(AUTH_STORAGE_PATH, "utf-8");
    await log("📂 Loaded existing authentication");
    return JSON.parse(data);
  } catch {
    await log("📂 No existing authentication found");
    return null;
  }
}

/**
 * Simple Confluence login
 */
async function loginToConfluence(page) {
  await log("🔐 Logging in to Confluence...");
  
  // Navigate to Confluence
  await page.goto(CONFLUENCE_BASE_URL, { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  
  // Check if already logged in
  const alreadyLoggedIn = await page.$(".aui-avatar, #user-menu-link");
  if (alreadyLoggedIn) {
    await log("✅ Already logged in!");
    return true;
  }
  
  // Click "Log In" button if present
  try {
    await log("Clicking Log In button...");
    await page.click('a[href*="login"], button:has-text("Log In"), a:has-text("Log In")');
    await page.waitForTimeout(2000);
  } catch (e) {
    await log("No Log In button found, assuming already on login page");
  }
  
  // Fill username
  await log("Entering username...");
  await page.fill('#os_username, #login-form-username, input[name="os_username"]', CONFLUENCE_USERNAME);
  await page.waitForTimeout(500);
  
  // Fill password
  await log("Entering password...");
  await page.fill('#os_password, #login-form-password, input[name="os_password"]', CONFLUENCE_PASSWORD);
  await page.waitForTimeout(500);
  
  // Click login button
  await log("Clicking Log In...");
  await page.click('#loginButton, button[type="submit"], input[type="submit"]');
  
  // Wait for manual CAPTCHA if present
  await log("\n🔔 If CAPTCHA appears, please solve it manually in the browser!");
  await log("⏱️  Waiting up to 3 minutes for login to complete...\n");
  
  // Wait for successful login (check for user menu or avatar)
  try {
    await page.waitForSelector('.aui-avatar, #user-menu-link, .user-profile', { timeout: 180000 });
    await log("✅ Login successful!");
    return true;
  } catch (e) {
    await log("❌ Login failed or timed out");
    return false;
  }
}

/**
 * Extract text content from a Confluence page
 */
async function extractPageContent(page) {
  return await page.evaluate(() => {
    // Find main content area
    const mainContent = document.querySelector('#main-content, .wiki-content, .page-content');
    if (!mainContent) return null;
    
    // Clone to avoid modifying the DOM
    const content = mainContent.cloneNode(true);
    
    // Remove unwanted elements
    const toRemove = content.querySelectorAll(
      '.page-metadata, .footer, nav, .navigation, script, style, .page-comments, ' +
      '.likes-section, .share-link, .aui-toolbar, .page-tree, .breadcrumbs'
    );
    toRemove.forEach(el => el.remove());
    
    // Get title
    const title = document.querySelector('#title-text, h1.page-title')?.textContent?.trim() || 
                  document.title.replace(' - Confluence', '').trim();
    
    // Convert to simple markdown-like text
    let text = content.innerText || content.textContent || '';
    text = text.trim();
    
    // Get metadata
    const spaceKey = window.location.pathname.match(/\/display\/([^\/]+)/)?.[1] || 'UNKNOWN';
    const pageId = window.location.search.match(/pageId=(\d+)/)?.[1] || null;
    
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
 * Find all page links in a space
 */
async function findSpacePages(page, spaceUrl, spaceKey) {
  await log(`  📚 Finding all pages in ${spaceKey} space...`);
  
  // Go to space overview page
  const overviewUrl = `${CONFLUENCE_BASE_URL}/wiki/spaces/${spaceKey}/overview`;
  await page.goto(overviewUrl, { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(2000);
  
  // Get all content page links (exclude utility links)
  const pageLinks = await page.evaluate((space) => {
    const links = Array.from(document.querySelectorAll('a[href]'));
    const unique = new Set();
    
    // Filters for CONTENT pages only
    const excludePatterns = [
      '/viewpageattachments.action',
      '/viewpreviousversions.action',
      '/viewinfo.action',
      '/viewsource/',
      '/pdfpageexport',
      '/exportword',
      '/pagebulklabel',
      '/pagebulkattachment',
      '/diffpages',
      '/createpage',
      '/edit/',
      '#',
      '/logout',
      '/admin'
    ];
    
    links.forEach(link => {
      const href = link.href;
      if (!href) return;
      
      // Must be in this space
      const inSpace = href.includes(`/display/${space}/`) || 
                     (href.includes('pageId=') && href.includes('/wiki/'));
      
      if (!inSpace) return;
      
      // Exclude utility pages
      const isUtility = excludePatterns.some(pattern => href.includes(pattern));
      if (isUtility) return;
      
      // Include viewpage.action and /display/ pages
      if (href.includes('viewpage.action?pageId=') || href.includes(`/display/${space}/`)) {
        unique.add(href);
      }
    });
    
    return Array.from(unique);
  }, spaceKey);
  
  await log(`  Found ${pageLinks.length} pages in ${spaceKey}`);
  
  // If we didn't find many pages, also try the page tree/navigation
  if (pageLinks.length < 5) {
    await log(`  🔍 Checking page tree for more pages...`);
    
    // Click to expand page tree if it exists
    try {
      await page.click('.space-pages-section button, .page-tree-toggle, [aria-label="Pages"]', { timeout: 2000 });
      await page.waitForTimeout(1000);
    } catch (e) {
      // Page tree might not exist or already expanded
    }
    
    // Get links from navigation/sidebar
    const navLinks = await page.evaluate((space) => {
      const navElements = document.querySelectorAll('.ia-fixed-sidebar a, .page-tree a, nav a');
      const links = new Set();
      
      Array.from(navElements).forEach(link => {
        const href = link.href;
        if (href && href.includes(`/display/${space}/`) && !href.includes('#')) {
          links.add(href);
        }
      });
      
      return Array.from(links);
    }, spaceKey);
    
    navLinks.forEach(link => pageLinks.add ? pageLinks.add(link) : null);
    await log(`  Total after navigation check: ${pageLinks.length || navLinks.length} pages`);
  }
  
  return Array.from(pageLinks);
}

/**
 * Main scraping function
 */
async function scrapeConfluence() {
  await log("🚀 Starting Confluence knowledge scraper");
  await log(`   Spaces: ${SPACES.map(s => s.key).join(", ")}`);
  await log(`   Headless: ${headless}`);
  
  if (!CONFLUENCE_USERNAME || !CONFLUENCE_PASSWORD) {
    await log("❌ Missing CONFLUENCE_USERNAME or CONFLUENCE_PASSWORD");
    process.exit(1);
  }
  
  const browser = await chromium.launch({
    headless,
    slowMo: headless ? 0 : 100,
  });
  
  let allPages = [];
  let stats = { scraped: 0, stored: 0, errors: 0 };
  
  try {
    // Load auth or create new context
    const authState = await loadAuth();
    const context = authState
      ? await browser.newContext({ storageState: authState })
      : await browser.newContext();
    
    const page = await context.newPage();
    
    // Login
    const loggedIn = await loginToConfluence(page);
    if (!loggedIn) {
      throw new Error("Authentication failed");
    }
    
    // Save auth state
    await saveAuth(context);
    
    // Scrape each space
    for (const space of SPACES) {
      await log(`\n${"=".repeat(70)}`);
      await log(`📖 Scraping ${space.name} Space`);
      await log(`${"=".repeat(70)}\n`);
      
      try {
        // Find all pages in this space
        const pageLinks = await findSpacePages(page, space.url, space.key);
        
        // Scrape each page
        for (let i = 0; i < pageLinks.length; i++) {
          const url = pageLinks[i];
          await log(`  [${i + 1}/${pageLinks.length}] ${url.substring(0, 80)}...`);
          
          try {
            await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
            await page.waitForTimeout(1000);
            
            const pageData = await extractPageContent(page);
            
            if (pageData && pageData.content && pageData.content.length > 50) {
              allPages.push({
                ...pageData,
                space: space.key,
              });
              stats.scraped++;
            } else {
              await log(`    ⚠️  Skipped - insufficient content`);
            }
            
            // Rate limiting
            await page.waitForTimeout(500);
            
          } catch (error) {
            await log(`    ❌ Error: ${error.message}`);
            stats.errors++;
          }
        }
        
        await log(`\n✅ ${space.name} complete: ${pageLinks.length} pages processed`);
        
      } catch (error) {
        await log(`❌ Error processing ${space.name}: ${error.message}`);
        stats.errors++;
      }
    }
    
    await log(`\n${"=".repeat(70)}`);
    await log(`📊 Scraping Complete`);
    await log(`${"=".repeat(70)}`);
    await log(`Pages scraped: ${stats.scraped}`);
    await log(`Errors: ${stats.errors}`);
    
    if (allPages.length === 0) {
      await log("\n⚠️  No pages scraped - exiting");
      await browser.close();
      return;
    }
    
    // Generate embeddings
    await log(`\n🤖 Generating embeddings for ${allPages.length} pages...`);
    const texts = allPages.map(p => p.content);
    const embeddings = await generateEmbeddingsBatch(texts, {
      batchSize: 100,
      delayMs: 1000,
      onProgress: (progress) => {
        log(`   ${progress.processed}/${progress.total} embeddings generated`);
      },
    });
    
    await log(`✅ Generated ${embeddings.length} embeddings`);
    
    // Store in Supabase
    await log(`\n💾 Storing in Supabase wiki_documents table...`);
    
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
          await log(`  ❌ Error storing ${pageData.title}: ${error.message}`);
          stats.errors++;
        } else {
          stats.stored++;
          if ((i + 1) % 10 === 0) {
            await log(`  Stored ${i + 1}/${allPages.length} pages`);
          }
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
    await log(`Spaces: ${SPACES.map(s => s.key).join(", ")}`);
    await log(`Pages scraped: ${stats.scraped}`);
    await log(`Pages stored: ${stats.stored}`);
    await log(`Errors: ${stats.errors}`);
    await log(`${"=".repeat(70)}`);
    await log("\n✨ Confluence scrape complete!");
    
  } catch (error) {
    await log(`\n❌ Fatal error: ${error.message}`);
    await log(error.stack);
    await browser.close();
    process.exit(1);
  }
}

// Run scraper
scrapeConfluence().catch(error => {
  console.error("Fatal error:", error);
  process.exit(1);
});

