#!/usr/bin/env node

/**
 * Unified Hybrid Crawler
 * Uses Firecrawl for public sites, Playwright for enterprise apps
 * Stores everything in Supabase with deduplication
 */

import FirecrawlApp from "@mendable/firecrawl-js";
import { chromium } from "playwright";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local" });

// Initialize services
const firecrawl = new FirecrawlApp({
  apiKey: process.env.FIRECRAWL_API_KEY,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Site configurations
const SITE_CONFIGS = {
  // Public sites that work with Firecrawl
  public: [
    { url: "https://www.sonymusic.com", type: "public_docs" },
    { url: "https://www.sonymusic.co.uk", type: "public_docs" },
    { url: "https://support.sonymusic.com", type: "public_docs" },
  ],

  // Enterprise apps that need Playwright
  enterprise: [
    {
      url: "https://aoma-stage.smcdp-de.net",
      type: "aoma",
      pages: [
        "/aoma-ui/my-aoma-files",
        "/aoma-ui/simple-upload",
        "/aoma-ui/direct-upload",
        "/aoma-ui/product-metadata-viewer",
        "/aoma-ui/unified-submission-tool",
        "/aoma-ui/registration-job-status",
      ],
    },
    {
      url: "https://sonymusic.atlassian.net",
      type: "confluence",
      requiresAuth: true,
    },
  ],
};

/**
 * Try Firecrawl first, fall back to Playwright
 */
async function crawlWithFallback(url, metadata = {}) {
  console.log(`\n🔍 Attempting to crawl: ${url}`);

  // Try Firecrawl first (it's faster and cleaner)
  try {
    console.log("  📡 Trying Firecrawl...");
    const result = await firecrawl.scrapeUrl(url, {
      formats: ["markdown", "html"],
      onlyMainContent: true,
      waitFor: 2000,
      timeout: 30000,
    });

    if (result.success && result.markdown) {
      console.log("  ✅ Firecrawl succeeded!");
      return {
        url,
        content: result.markdown,
        title: result.metadata?.title || "Untitled",
        source_type: metadata.type || "public_docs",
        crawler: "firecrawl",
        metadata: {
          ...metadata,
          ...result.metadata,
          links: result.links || [],
          images: result.images || [],
        },
      };
    }
  } catch (error) {
    console.log(`  ⚠️ Firecrawl failed: ${error.message}`);
  }

  // Fall back to Playwright
  console.log("  🎭 Falling back to Playwright...");
  return await crawlWithPlaywright(url, metadata);
}

/**
 * Crawl with Playwright (works everywhere)
 */
async function crawlWithPlaywright(url, metadata = {}) {
  const browser = await chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      viewport: { width: 1920, height: 1080 },
    });

    // Load auth cookies if available
    const authFile = `tmp/${metadata.type}-auth.json`;
    try {
      const authState = JSON.parse(await fs.readFile(authFile, "utf8"));
      await context.addCookies(authState.cookies);
      console.log("  🔐 Loaded authentication");
    } catch {
      // No auth available
    }

    const page = await context.newPage();
    await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(2000); // Let dynamic content load

    // Extract content
    const content = await page.evaluate(() => {
      // Remove noise
      document.querySelectorAll("script, style, nav, footer, header").forEach((el) => el.remove());

      // Get clean content
      return {
        title: document.title,
        text: document.body.innerText || "",
        html: document.documentElement.outerHTML,
        links: Array.from(document.querySelectorAll("a[href]")).map((a) => a.href),
      };
    });

    console.log("  ✅ Playwright succeeded!");

    return {
      url,
      content: content.text,
      title: content.title,
      source_type: metadata.type || "unknown",
      crawler: "playwright",
      metadata: {
        ...metadata,
        links: content.links,
        html_length: content.html.length,
      },
    };
  } finally {
    await browser.close();
  }
}

/**
 * Store in Supabase with deduplication
 */
async function storeInSupabase(data) {
  // Generate content hash for deduplication
  const contentHash = crypto.createHash("md5").update(data.content).digest("hex");

  // Check if content already exists
  const { data: existing } = await supabase
    .from("aoma_unified_vectors")
    .select("id, content_hash")
    .eq("url", data.url)
    .single();

  if (existing?.content_hash === contentHash) {
    console.log("  ⏭️ Content unchanged, skipping");
    return false;
  }

  // Upsert new content
  const { error } = await supabase.from("aoma_unified_vectors").upsert(
    {
      url: data.url,
      content: data.content,
      content_hash: contentHash,
      source_type: data.source_type,
      metadata: {
        ...data.metadata,
        title: data.title,
        crawler: data.crawler,
        crawled_at: new Date().toISOString(),
      },
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "url",
    }
  );

  if (error) {
    console.error("  ❌ Storage failed:", error.message);
    return false;
  }

  console.log("  💾 Stored in Supabase");
  return true;
}

/**
 * Main crawl orchestrator
 */
async function main() {
  console.log("🚀 Unified Hybrid Crawler Starting...\n");
  console.log("📊 Database: aoma_unified_vectors");
  console.log("🔄 Strategy: Try Firecrawl → Fall back to Playwright\n");

  const stats = {
    total: 0,
    firecrawl: 0,
    playwright: 0,
    stored: 0,
    skipped: 0,
    failed: 0,
  };

  // Test public sites with Firecrawl
  console.log("═══════════════════════════════════════");
  console.log("📰 CRAWLING PUBLIC SITES");
  console.log("═══════════════════════════════════════");

  for (const site of SITE_CONFIGS.public) {
    stats.total++;
    try {
      const result = await crawlWithFallback(site.url, { type: site.type });

      if (result.crawler === "firecrawl") stats.firecrawl++;
      else stats.playwright++;

      const stored = await storeInSupabase(result);
      if (stored) stats.stored++;
      else stats.skipped++;
    } catch (error) {
      console.error(`  ❌ Failed: ${error.message}`);
      stats.failed++;
    }
  }

  // Test enterprise sites (will use Playwright)
  console.log("\n═══════════════════════════════════════");
  console.log("🏢 CRAWLING ENTERPRISE APPS");
  console.log("═══════════════════════════════════════");

  for (const site of SITE_CONFIGS.enterprise) {
    // For sites with specific pages
    if (site.pages) {
      for (const page of site.pages.slice(0, 3)) {
        // Limit to 3 for testing
        stats.total++;
        const fullUrl = site.url + page;

        try {
          const result = await crawlWithFallback(fullUrl, { type: site.type });

          if (result.crawler === "firecrawl") stats.firecrawl++;
          else stats.playwright++;

          const stored = await storeInSupabase(result);
          if (stored) stats.stored++;
          else stats.skipped++;
        } catch (error) {
          console.error(`  ❌ Failed: ${error.message}`);
          stats.failed++;
        }
      }
    }
  }

  // Print summary
  console.log("\n═══════════════════════════════════════");
  console.log("📊 CRAWL COMPLETE - SUMMARY");
  console.log("═══════════════════════════════════════\n");
  console.log(`Total Pages Attempted: ${stats.total}`);
  console.log(`✅ Stored: ${stats.stored}`);
  console.log(`⏭️ Skipped (unchanged): ${stats.skipped}`);
  console.log(`❌ Failed: ${stats.failed}`);
  console.log(`\nCrawler Usage:`);
  console.log(`🔥 Firecrawl: ${stats.firecrawl}`);
  console.log(`🎭 Playwright: ${stats.playwright}`);
  console.log(`\n💡 Firecrawl Success Rate: ${Math.round((stats.firecrawl / stats.total) * 100)}%`);

  // Check database
  const { count } = await supabase
    .from("aoma_unified_vectors")
    .select("*", { count: "exact", head: true });

  console.log(`\n📦 Total documents in database: ${count}`);
}

// Run the crawler
main().catch(console.error);
