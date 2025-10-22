#!/usr/bin/env node

/**
 * AOMA PRODUCTION CRAWLER
 * Pushes to the correct aoma_knowledge table structure
 */

const { chromium } = require("playwright");
const fs = require("fs").promises;
const crypto = require("crypto");
const dotenv = require("dotenv");
const { createClient } = require("@supabase/supabase-js");

// Load environment
dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local" });

// Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log("🚀 AOMA PRODUCTION CRAWLER");
console.log("📊 Target: aoma_knowledge table\n");

// All AOMA endpoints
const AOMA_ENDPOINTS = [
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
  "/servlet/com.sonymusic.aoma.AOMADispatcherServlet?chain=ProductSearchDisplayChain",
  "/servlet/com.sonymusic.aoma.AOMADispatcherServlet?chain=GlobalAssetSearch",
  "/servlet/com.sonymusic.aoma.AOMADispatcherServlet?chain=MyFilesDisplayCrit",
];

async function crawlAndSave() {
  // Load auth
  const storageState = JSON.parse(await fs.readFile("tmp/aoma-stage-storage.json", "utf8"));

  const browser = await chromium.launch({
    headless: false,
    slowMo: 50,
  });

  const context = await browser.newContext({
    storageState,
    viewport: { width: 1920, height: 1080 },
  });

  const page = await context.newPage();

  let savedCount = 0;

  for (const endpoint of AOMA_ENDPOINTS) {
    try {
      const url = `https://aoma-stage.smcdp-de.net${endpoint}`;
      console.log(`📄 ${endpoint}`);

      await page.goto(url, {
        waitUntil: "networkidle",
        timeout: 30000,
      });

      await page.waitForTimeout(3000);

      // Extract content
      const content = await page.evaluate(() => {
        document.querySelectorAll("script, style").forEach((el) => el.remove());
        return {
          title: document.title,
          content: document.body.innerText || "",
          url: window.location.href,
        };
      });

      // Skip if it's a login page
      if (content.content.includes("Employee Login") && content.content.length < 2000) {
        console.log("  ⏭️ Login page");
        continue;
      }

      // Save to aoma_knowledge table
      const { error } = await supabase.from("aoma_knowledge").upsert(
        {
          url: content.url,
          title: content.title,
          content: content.content,
          crawled_at: new Date().toISOString(),
          metadata: {
            source: "aoma-stage",
            endpoint,
          },
        },
        {
          onConflict: "url",
        }
      );

      if (error) {
        console.error(`  ❌ ${error.message}`);
      } else {
        console.log(`  ✅ Saved (${content.content.length} chars)`);
        savedCount++;
      }
    } catch (error) {
      console.error(`  ❌ ${error.message}`);
    }
  }

  console.log(`\n✅ Saved ${savedCount} pages to aoma_knowledge`);

  await browser.close();
}

crawlAndSave().catch(console.error);
