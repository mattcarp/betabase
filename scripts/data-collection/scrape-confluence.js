/**
 * Confluence Wiki Scraper
 *
 * Scrapes Confluence wiki pages using Playwright with Microsoft SSO authentication.
 * Generates embeddings and stores in Supabase wiki_documents table.
 *
 * Usage:
 *   node scripts/data-collection/scrape-confluence.js
 *   node scripts/data-collection/scrape-confluence.js --headless
 *   node scripts/data-collection/scrape-confluence.js --spaces=AOMA,USM
 *   node scripts/data-collection/scrape-confluence.js --limit=50
 */

const { chromium } = require("playwright");
const { createClient } = require("@supabase/supabase-js");
const { generateEmbeddingsBatch } = require("../../utils/embeddings/openai");
const {
  authenticateWithMicrosoft,
  saveAuthState,
  loadAuthState,
} = require("../../utils/auth/microsoft-sso");
const crypto = require("crypto");
require("dotenv").config({ path: ".env.local" });

// Configuration
const CONFLUENCE_BASE_URL = process.env.CONFLUENCE_BASE_URL || "https://wiki.smedigitalapps.com";
const CONFLUENCE_USERNAME = process.env.CONFLUENCE_USERNAME;
const CONFLUENCE_PASSWORD = process.env.CONFLUENCE_PASSWORD;
const AUTH_STORAGE_PATH = "tmp/confluence-auth.json";

// Parse command line arguments
const args = process.argv.slice(2);
const headless = args.includes("--headless");
const spacesArg = args.find((arg) => arg.startsWith("--spaces="));
const limitArg = args.find((arg) => arg.startsWith("--limit="));

const targetSpaces = spacesArg
  ? spacesArg.split("=")[1].split(",")
  : ["AOMA", "USM", "TECH", "API", "RELEASE"];
const maxPagesPerSpace = limitArg ? parseInt(limitArg.split("=")[1]) : 100;

// Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Logging
const LOG_FILE = "logs/confluence-scrape.log";
const fs = require("fs");
const logStream = fs.createWriteStream(LOG_FILE, { flags: "a" });

async function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  process.stdout.write(logMessage);
  logStream.write(logMessage);
}

/**
 * Get list of pages from a Confluence space
 */
async function getSpacePages(page, spaceKey) {
  await log(`  📚 Fetching pages from ${spaceKey} space...`);

  const spaceUrl = `${CONFLUENCE_BASE_URL}/wiki/spaces/${spaceKey}/pages`;
  await page.goto(spaceUrl, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(2000);

  // Get all page links in the space
  const pageLinks = await page.$$eval(
    'a[href*="/wiki/spaces/"][href*="/pages/"]',
    (links, baseUrl) => {
      const unique = new Set();
      links.forEach((link) => {
        const href = link.href;
        if (href && href.includes("/pages/") && !href.includes("#")) {
          // Normalize URL
          const url = new URL(href, baseUrl);
          unique.add(url.href);
        }
      });
      return Array.from(unique);
    },
    CONFLUENCE_BASE_URL
  );

  await log(`  Found ${pageLinks.length} pages in ${spaceKey}`);
  return pageLinks.slice(0, maxPagesPerSpace);
}

/**
 * Scrape a single Confluence page
 */
async function scrapePage(page, url) {
  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
    await page.waitForTimeout(1000);

    // Get page title
    const title = await page.title().catch(() => "Untitled");

    // Get main content - Confluence uses id="main-content"
    const content = await page
      .$eval("#main-content", (el) => {
        // Remove navigation, footers, etc.
        const toRemove = el.querySelectorAll(
          ".page-metadata, .footer, nav, .navigation, script, style, .page-comments"
        );
        toRemove.forEach((node) => node.remove());

        // Get text content
        return el.innerText || el.textContent;
      })
      .catch(() => "");

    if (!content || content.trim().length < 50) {
      await log(`  ⚠️  Skipping ${title} - insufficient content`);
      return null;
    }

    // Extract metadata
    const metadata = await page
      .evaluate(() => {
        const meta = {};

        // Get space name
        const spaceLink = document.querySelector('a[href*="/wiki/spaces/"]');
        if (spaceLink) {
          const match = spaceLink.href.match(/\/spaces\/([^\/]+)/);
          if (match) meta.space = match[1];
        }

        // Get labels/tags
        const labels = Array.from(document.querySelectorAll(".label")).map((el) =>
          el.textContent.trim()
        );
        if (labels.length > 0) meta.labels = labels;

        // Get author if available
        const authorEl = document.querySelector('[data-username], .author');
        if (authorEl) {
          meta.author = authorEl.textContent.trim() || authorEl.getAttribute("data-username");
        }

        // Get last modified date
        const dateEl = document.querySelector('time[datetime], .last-modified');
        if (dateEl) {
          meta.updated_at = dateEl.getAttribute("datetime") || dateEl.textContent.trim();
        }

        return meta;
      })
      .catch(() => ({}));

    // Get page ID from URL
    const pageIdMatch = url.match(/pageId=(\d+)/);
    const pageId = pageIdMatch ? pageIdMatch[1] : null;

    return {
      url,
      title,
      content,
      metadata: {
        ...metadata,
        page_id: pageId,
        sony_music: true,
        categories: ["wiki", "documentation"],
        priority_content: ["AOMA", "USM"].includes(metadata.space?.toUpperCase()),
      },
    };
  } catch (error) {
    await log(`  ❌ Error scraping ${url}: ${error.message}`);
    return null;
  }
}

/**
 * Store page in Supabase with embedding
 */
async function storePage(pageData, embedding) {
  const contentHash = crypto.createHash("md5").update(pageData.content).digest("hex");

  const { data, error } = await supabase
    .from("wiki_documents")
    .upsert(
      {
        url: pageData.url,
        app_name: "confluence",
        title: pageData.title,
        markdown_content: pageData.content,
        embedding: embedding,
        content_hash: contentHash,
        metadata: pageData.metadata,
        crawled_at: new Date().toISOString(),
      },
      {
        onConflict: "url,app_name",
      }
    )
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to store page: ${error.message}`);
  }

  return data;
}

/**
 * Main scraping function
 */
async function scrapeConfluence() {
  await log("🚀 Starting Confluence scraper");
  await log(`   Base URL: ${CONFLUENCE_BASE_URL}`);
  await log(`   Spaces: ${targetSpaces.join(", ")}`);
  await log(`   Max pages per space: ${maxPagesPerSpace}`);
  await log(`   Headless: ${headless}`);

  // Validate credentials
  if (!CONFLUENCE_USERNAME || !CONFLUENCE_PASSWORD) {
    await log("❌ Missing CONFLUENCE_USERNAME or CONFLUENCE_PASSWORD");
    process.exit(1);
  }

  const browser = await chromium.launch({
    headless,
    slowMo: headless ? 0 : 100,
  });

  let allPages = [];
  let totalScraped = 0;
  let totalStored = 0;

  try {
    // Load existing authentication or create new context
    const authState = await loadAuthState(AUTH_STORAGE_PATH);
    const context = authState
      ? await browser.newContext({ storageState: authState })
      : await browser.newContext();

    const page = await context.newPage();

    // Authenticate with Microsoft SSO
    const authenticated = await authenticateWithMicrosoft(page, {
      url: CONFLUENCE_BASE_URL,
      username: CONFLUENCE_USERNAME,
      password: CONFLUENCE_PASSWORD,
      mfaTimeout: 180,
      onMFAPrompt: () => {
        console.log("\n🔔 Check your phone for MFA approval!");
      },
    });

    if (!authenticated) {
      throw new Error("Authentication failed!");
    }

    // Save authentication state
    await saveAuthState(context, AUTH_STORAGE_PATH);
    await log("✅ Authentication successful");

    // Scrape each space
    for (const spaceKey of targetSpaces) {
      await log(`\n📚 Processing ${spaceKey} space...`);

      try {
        // Get all pages in the space
        const pageLinks = await getSpacePages(page, spaceKey);

        // Scrape each page
        for (let i = 0; i < pageLinks.length; i++) {
          const url = pageLinks[i];
          await log(`  [${i + 1}/${pageLinks.length}] Scraping: ${url.substring(0, 80)}...`);

          const pageData = await scrapePage(page, url);
          if (pageData) {
            allPages.push(pageData);
            totalScraped++;
          }

          // Rate limiting
          await page.waitForTimeout(500);
        }

        await log(`  ✅ Scraped ${pageLinks.length} pages from ${spaceKey}`);
      } catch (error) {
        await log(`  ❌ Error processing ${spaceKey}: ${error.message}`);
      }
    }

    await log(`\n📊 Total pages scraped: ${totalScraped}`);

    // Generate embeddings in batches
    if (allPages.length > 0) {
      await log("\n🤖 Generating embeddings...");

      const texts = allPages.map((p) => p.content);
      const embeddings = await generateEmbeddingsBatch(texts, {
        batchSize: 100,
        delayMs: 1000,
        onProgress: (progress) => {
          log(`   ${progress.processed}/${progress.total} embeddings generated`);
        },
      });

      await log(`✅ Generated ${embeddings.length} embeddings`);

      // Store in Supabase
      await log("\n💾 Storing pages in Supabase...");

      for (let i = 0; i < allPages.length; i++) {
        try {
          await storePage(allPages[i], embeddings[i]);
          totalStored++;
          if ((i + 1) % 10 === 0) {
            await log(`   Stored ${i + 1}/${allPages.length} pages`);
          }
        } catch (error) {
          await log(`   ❌ Failed to store page ${i + 1}: ${error.message}`);
        }
      }

      await log(`✅ Stored ${totalStored} pages in Supabase`);
    }

    await browser.close();

    // Summary
    await log("\n" + "=".repeat(70));
    await log("📊 SCRAPE SUMMARY");
    await log("=".repeat(70));
    await log(`Spaces processed: ${targetSpaces.join(", ")}`);
    await log(`Pages scraped: ${totalScraped}`);
    await log(`Pages stored: ${totalStored}`);
    await log(`Skipped: ${totalScraped - totalStored}`);
    await log("=".repeat(70));
    await log("\n✨ Confluence scrape complete!");
  } catch (error) {
    await log(`\n❌ Fatal error: ${error.message}`);
    await log(error.stack);
    await browser.close();
    process.exit(1);
  } finally {
    logStream.end();
  }
}

// Run scraper
scrapeConfluence().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});


