#!/usr/bin/env node

/**
 * AGGRESSIVE AOMA CRAWLER
 * Crawls everything we can find and pushes to Supabase
 */

const { chromium } = require("playwright");
const fs = require("fs").promises;
const path = require("path");
const crypto = require("crypto");
const dotenv = require("dotenv");
const { createClient } = require("@supabase/supabase-js");

// Load environment
dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local" });

// Supabase setup
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log("🚀 AGGRESSIVE AOMA CRAWLER");
console.log("📊 Target: Supabase aoma_content table\n");

// All known AOMA pages to crawl
const AOMA_PAGES = [
  "/aoma-ui/my-aoma-files",
  "/aoma-ui/simple-upload",
  "/aoma-ui/direct-upload",
  "/aoma-ui/product-metadata-viewer",
  "/aoma-ui/unified-submission-tool",
  "/aoma-ui/registration-job-status",
  "/aoma-ui/unregister-assets",
  "/aoma-ui/video-metadata",
  "/aoma-ui/qc-notes",
  "/servlet/com.sonymusic.aoma.AOMADispatcherServlet?chain=CustomHomePageViewAction",
  "/servlet/com.sonymusic.aoma.AOMADispatcherServlet?chain=MyHomeGetInitialPageDataAction",
  "/servlet/com.sonymusic.aoma.AOMADispatcherServlet?chain=ProductSearchDisplayChain",
  "/servlet/com.sonymusic.aoma.AOMADispatcherServlet?chain=AdminHomeAction",
];

async function extractPageContent(page) {
  // Wait for Angular to render
  await page.waitForTimeout(3000);

  // Extract all meaningful text content
  const content = await page.evaluate(() => {
    // Remove script and style elements
    const scripts = document.querySelectorAll("script, style, noscript");
    scripts.forEach((el) => el.remove());

    // Get all text content
    const textContent = document.body.innerText || document.body.textContent || "";

    // Get page metadata
    const metadata = {
      title: document.title,
      url: window.location.href,
      path: window.location.pathname,
      timestamp: new Date().toISOString(),
    };

    // Get all form fields
    const forms = Array.from(document.querySelectorAll("form")).map((form) => ({
      action: form.action,
      method: form.method,
      fields: Array.from(form.querySelectorAll("input, select, textarea")).map((field) => ({
        name: field.name,
        type: field.type || field.tagName.toLowerCase(),
        label: field.labels?.[0]?.textContent || field.placeholder || field.name,
      })),
    }));

    // Get all links
    const links = Array.from(document.querySelectorAll("a[href]"))
      .map((a) => ({
        text: a.textContent.trim(),
        href: a.href,
      }))
      .filter((l) => l.text && l.href.includes("aoma"));

    // Get all buttons
    const buttons = Array.from(
      document.querySelectorAll('button, input[type="submit"], input[type="button"]')
    )
      .map((btn) => btn.textContent?.trim() || btn.value || btn.getAttribute("aria-label"))
      .filter(Boolean);

    // Get table data if present
    const tables = Array.from(document.querySelectorAll("table")).map((table) => {
      const headers = Array.from(table.querySelectorAll("th")).map((th) => th.textContent.trim());
      const rows = Array.from(table.querySelectorAll("tr"))
        .map((tr) => Array.from(tr.querySelectorAll("td")).map((td) => td.textContent.trim()))
        .filter((row) => row.length > 0);
      return { headers, rows };
    });

    return {
      content: textContent,
      metadata,
      forms,
      links,
      buttons,
      tables,
      hasData: textContent.length > 500, // Consider it has data if more than 500 chars
    };
  });

  return content;
}

async function saveToSupabase(pageData, pagePath) {
  try {
    const contentHash = crypto.createHash("md5").update(pageData.content).digest("hex");

    const record = {
      url: pageData.metadata.url,
      path: pagePath,
      title: pageData.metadata.title,
      content: pageData.content,
      content_hash: contentHash,
      metadata: {
        forms: pageData.forms,
        links: pageData.links,
        buttons: pageData.buttons,
        tables: pageData.tables,
        crawled_at: pageData.metadata.timestamp,
        has_meaningful_data: pageData.hasData,
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Upsert to Supabase
    const { data, error } = await supabase.from("aoma_content").upsert(record, {
      onConflict: "url",
      ignoreDuplicates: false,
    });

    if (error) {
      console.error(`   ❌ Supabase error: ${error.message}`);
      return false;
    }

    console.log(`   ✅ Saved to Supabase (${pageData.content.length} chars)`);
    return true;
  } catch (error) {
    console.error(`   ❌ Save error: ${error.message}`);
    return false;
  }
}

async function aggressiveCrawl() {
  // Load existing auth
  const storageState = JSON.parse(await fs.readFile("tmp/aoma-stage-storage.json", "utf8"));

  const browser = await chromium.launch({
    headless: false, // Keep visible so you can see what's happening
    slowMo: 100,
  });

  const context = await browser.newContext({
    storageState,
    viewport: { width: 1920, height: 1080 },
  });

  const page = await context.newPage();
  let crawledCount = 0;
  let savedCount = 0;

  console.log(`\n🕷️ CRAWLING ${AOMA_PAGES.length} PAGES...\n`);

  for (const pagePath of AOMA_PAGES) {
    try {
      const url = pagePath.startsWith("http")
        ? pagePath
        : `https://aoma-stage.smcdp-de.net${pagePath}`;

      console.log(`📄 [${++crawledCount}/${AOMA_PAGES.length}] ${pagePath}`);

      // Navigate to page
      await page.goto(url, {
        waitUntil: "networkidle",
        timeout: 30000,
      });

      // Extract content
      const pageData = await extractPageContent(page);

      // Check if we got meaningful content
      if (!pageData.hasData) {
        console.log("   ⚠️ No meaningful data (might be loading or error page)");

        // Try clicking around to trigger content
        console.log("   🔄 Attempting to trigger content...");

        // Click any visible buttons or links
        const clicked = await page.evaluate(() => {
          const clickables = document.querySelectorAll('button, a[href="#"], .clickable');
          let clicked = false;
          for (let el of clickables) {
            if (el.offsetHeight > 0 && el.offsetWidth > 0) {
              el.click();
              clicked = true;
              break;
            }
          }
          return clicked;
        });

        if (clicked) {
          await page.waitForTimeout(3000);
          pageData = await extractPageContent(page);
        }
      }

      // Save to Supabase
      if (pageData.content && pageData.content.length > 100) {
        const saved = await saveToSupabase(pageData, pagePath);
        if (saved) savedCount++;
      }

      // Also save HTML and screenshot locally
      await fs.mkdir("tmp/crawled", { recursive: true });
      const timestamp = Date.now();
      const safeFileName = pagePath.replace(/[^a-z0-9]/gi, "_");

      const html = await page.content();
      await fs.writeFile(`tmp/crawled/aoma_${safeFileName}_${timestamp}.html`, html);

      await page.screenshot({
        path: `tmp/crawled/aoma_${safeFileName}_${timestamp}.png`,
        fullPage: true,
      });
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
    }

    // Small delay between pages
    await page.waitForTimeout(1000);
  }

  // Now discover and crawl additional pages
  console.log("\n🔍 DISCOVERING ADDITIONAL PAGES...\n");

  // Go to main page and find all AOMA links
  await page.goto(
    "https://aoma-stage.smcdp-de.net/servlet/com.sonymusic.aoma.AOMADispatcherServlet?chain=CustomHomePageViewAction",
    {
      waitUntil: "networkidle",
    }
  );

  const discoveredLinks = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a[href*="aoma"], a[href*="chain="]'));
    return links
      .map((a) => a.href)
      .filter(
        (href) => href.includes("aoma") && !href.includes("Logout") && !href.includes("login")
      );
  });

  console.log(`Found ${discoveredLinks.length} additional links to crawl`);

  // Crawl discovered links
  for (const link of [...new Set(discoveredLinks)]) {
    if (!AOMA_PAGES.some((p) => link.includes(p))) {
      console.log(`📄 Discovered: ${link}`);

      try {
        await page.goto(link, {
          waitUntil: "networkidle",
          timeout: 30000,
        });

        const pageData = await extractPageContent(page);

        if (pageData.content && pageData.content.length > 100) {
          const saved = await saveToSupabase(pageData, new URL(link).pathname);
          if (saved) savedCount++;
        }
      } catch (error) {
        console.error(`   ❌ Error: ${error.message}`);
      }
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log(`✅ CRAWL COMPLETE!`);
  console.log(`📊 Crawled: ${crawledCount + discoveredLinks.length} pages`);
  console.log(`💾 Saved to Supabase: ${savedCount} pages`);
  console.log(`📁 Local files: tmp/crawled/`);
  console.log("=".repeat(60));

  // Keep browser open for inspection
  console.log("\n⏳ Keeping browser open for 15 seconds...");
  await page.waitForTimeout(15000);

  await browser.close();
}

// Create Supabase table if it doesn't exist
async function ensureSupabaseTable() {
  console.log("🔧 Ensuring Supabase table exists...\n");

  // This would normally be done via migrations, but we can check
  const { data, error } = await supabase.from("aoma_content").select("url").limit(1);

  if (error && error.message.includes("does not exist")) {
    console.log("📝 Table does not exist. Please create it with:");
    console.log(`
CREATE TABLE aoma_content (
  id SERIAL PRIMARY KEY,
  url TEXT UNIQUE NOT NULL,
  path TEXT,
  title TEXT,
  content TEXT,
  content_hash TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_aoma_content_url ON aoma_content(url);
CREATE INDEX idx_aoma_content_path ON aoma_content(path);
    `);
    process.exit(1);
  } else {
    console.log("✅ Table ready!\n");
  }
}

// Main
async function main() {
  await ensureSupabaseTable();
  await aggressiveCrawl();
}

main().catch(console.error);
