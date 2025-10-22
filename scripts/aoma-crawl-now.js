#!/usr/bin/env node

/**
 * AOMA AGGRESSIVE CRAWLER - DIRECT TO SUPABASE
 * Assumes table exists, just crawls and saves
 */

const { chromium } = require("playwright");
const fs = require("fs").promises;
const crypto = require("crypto");
const dotenv = require("dotenv");

// Load environment
dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local" });

console.log("🚀 AOMA AGGRESSIVE CRAWLER - SIMPLIFIED");
console.log("📊 Saving HTML files locally\n");

// All known AOMA pages
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
  // Servlet pages
  "/servlet/com.sonymusic.aoma.AOMADispatcherServlet?chain=CustomHomePageViewAction",
  "/servlet/com.sonymusic.aoma.AOMADispatcherServlet?chain=MyHomeGetInitialPageDataAction",
  "/servlet/com.sonymusic.aoma.AOMADispatcherServlet?chain=ProductSearchDisplayChain",
  "/servlet/com.sonymusic.aoma.AOMADispatcherServlet?chain=AdminHomeAction",
  "/servlet/com.sonymusic.aoma.AOMADispatcherServlet?chain=MyFilesDisplayCrit",
  "/servlet/com.sonymusic.aoma.AOMADispatcherServlet?chain=MyPendingProducts",
  "/servlet/com.sonymusic.aoma.AOMADispatcherServlet?chain=GlobalAssetSearch",
];

async function crawlEverything() {
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

  // Create output directory
  const timestamp = Date.now();
  const outputDir = `tmp/aoma-crawl-${timestamp}`;
  await fs.mkdir(outputDir, { recursive: true });

  console.log(`📁 Output directory: ${outputDir}\n`);

  let crawledCount = 0;

  for (const pagePath of AOMA_PAGES) {
    try {
      const url = pagePath.startsWith("http")
        ? pagePath
        : `https://aoma-stage.smcdp-de.net${pagePath}`;

      console.log(`📄 [${++crawledCount}/${AOMA_PAGES.length}] ${pagePath}`);

      // Navigate
      await page.goto(url, {
        waitUntil: "networkidle",
        timeout: 30000,
      });

      // Wait for content
      await page.waitForTimeout(3000);

      // Try to interact with the page to trigger loading
      await page.evaluate(() => {
        // Scroll to trigger lazy loading
        window.scrollTo(0, document.body.scrollHeight);

        // Click any tabs or expandable elements
        const expandables = document.querySelectorAll(
          '[aria-expanded="false"], .mat-expansion-panel, .mat-tab-label'
        );
        expandables.forEach((el) => {
          if (el.offsetHeight > 0) el.click();
        });
      });

      await page.waitForTimeout(2000);

      // Extract content
      const pageContent = await page.evaluate(() => {
        // Remove scripts and styles
        document.querySelectorAll("script, style, noscript").forEach((el) => el.remove());

        return {
          title: document.title,
          url: window.location.href,
          text: document.body.innerText || "",
          html: document.documentElement.outerHTML,
          links: Array.from(document.querySelectorAll("a[href]"))
            .map((a) => ({
              text: a.textContent?.trim(),
              href: a.href,
            }))
            .filter((l) => l.text),
          forms: Array.from(document.querySelectorAll("form")).map((form) => ({
            action: form.action,
            inputs: Array.from(form.querySelectorAll("input, select, textarea")).map((input) => ({
              name: input.name,
              type: input.type || input.tagName,
            })),
          })),
        };
      });

      // Save files
      const safeFileName = pagePath.replace(/[^a-z0-9]/gi, "_");

      // Save HTML
      await fs.writeFile(`${outputDir}/${safeFileName}.html`, pageContent.html);

      // Save text content
      await fs.writeFile(`${outputDir}/${safeFileName}.txt`, pageContent.text);

      // Save metadata
      await fs.writeFile(
        `${outputDir}/${safeFileName}.json`,
        JSON.stringify(
          {
            url: pageContent.url,
            title: pageContent.title,
            crawled_at: new Date().toISOString(),
            text_length: pageContent.text.length,
            links_count: pageContent.links.length,
            forms_count: pageContent.forms.length,
            links: pageContent.links,
            forms: pageContent.forms,
          },
          null,
          2
        )
      );

      // Screenshot
      await page.screenshot({
        path: `${outputDir}/${safeFileName}.png`,
        fullPage: true,
      });

      console.log(`   ✅ Saved (${pageContent.text.length} chars)`);
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log(`✅ CRAWL COMPLETE!`);
  console.log(`📊 Crawled: ${crawledCount} pages`);
  console.log(`📁 Files saved to: ${outputDir}`);
  console.log("=".repeat(60));

  console.log("\nNow you can:");
  console.log("1. Run the SQL in sql/create-aoma-content-table.sql in Supabase");
  console.log("2. Process the HTML files with scripts/process-aoma-to-supabase.js");

  await page.waitForTimeout(10000);
  await browser.close();
}

crawlEverything().catch(console.error);
