#!/usr/bin/env node

/**
 * AOMA DEEP CRAWLER - Maximum Data Extraction
 * Gets everything we can while logged in
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

// Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log("🚀 AOMA DEEP CRAWLER - AGGRESSIVE MODE");
console.log("📊 Direct to Supabase with deduplication\n");

// Expanded list of AOMA endpoints to crawl
const AOMA_ENDPOINTS = [
  // Main UI Pages
  "/aoma-ui/my-aoma-files",
  "/aoma-ui/simple-upload",
  "/aoma-ui/direct-upload",
  "/aoma-ui/product-metadata-viewer",
  "/aoma-ui/unified-submission-tool",
  "/aoma-ui/registration-job-status",
  "/aoma-ui/unregister-assets",
  "/aoma-ui/video-metadata",
  "/aoma-ui/qc-notes",
  "/aoma-ui/asset-submission",
  "/aoma-ui/bulk-operations",

  // Servlet Chains - All possible actions
  "/servlet/com.sonymusic.aoma.AOMADispatcherServlet?chain=CustomHomePageViewAction",
  "/servlet/com.sonymusic.aoma.AOMADispatcherServlet?chain=MyHomeGetInitialPageDataAction",
  "/servlet/com.sonymusic.aoma.AOMADispatcherServlet?chain=ProductSearchDisplayChain",
  "/servlet/com.sonymusic.aoma.AOMADispatcherServlet?chain=AdminHomeAction",
  "/servlet/com.sonymusic.aoma.AOMADispatcherServlet?chain=MyFilesDisplayCrit",
  "/servlet/com.sonymusic.aoma.AOMADispatcherServlet?chain=MyPendingProducts",
  "/servlet/com.sonymusic.aoma.AOMADispatcherServlet?chain=GlobalAssetSearch",
  "/servlet/com.sonymusic.aoma.AOMADispatcherServlet?chain=AssetSubmissionWizard",
  "/servlet/com.sonymusic.aoma.AOMADispatcherServlet?chain=BulkMetadataUpdate",
  "/servlet/com.sonymusic.aoma.AOMADispatcherServlet?chain=ReportGeneratorAction",
  "/servlet/com.sonymusic.aoma.AOMADispatcherServlet?chain=WorkflowStatusDisplay",
  "/servlet/com.sonymusic.aoma.AOMADispatcherServlet?chain=AssetHistoryViewAction",
  "/servlet/com.sonymusic.aoma.AOMADispatcherServlet?chain=QualityControlDashboard",
  "/servlet/com.sonymusic.aoma.AOMADispatcherServlet?chain=DeliveryStatusTracking",
];

async function extractMaximalContent(page) {
  await page.waitForTimeout(3000);

  // Try to expand everything on the page
  await page.evaluate(() => {
    // Click all expandable elements
    document
      .querySelectorAll('[aria-expanded="false"], .collapsible, .accordion, .expand-button')
      .forEach((el) => {
        el.click();
      });

    // Scroll to load lazy content
    window.scrollTo(0, document.body.scrollHeight);

    // Click all tabs
    document.querySelectorAll('.mat-tab-label, .tab-button, [role="tab"]').forEach((tab) => {
      tab.click();
    });
  });

  await page.waitForTimeout(2000);

  // Extract everything
  return await page.evaluate(() => {
    // Clean the page
    document.querySelectorAll("script, style, noscript").forEach((el) => el.remove());

    const content = {
      text: document.body.innerText || "",
      title: document.title,
      url: window.location.href,
      path: window.location.pathname + window.location.search,

      // Extract structured data
      tables: Array.from(document.querySelectorAll("table")).map((table) => {
        const headers = Array.from(table.querySelectorAll("th")).map((th) => th.textContent.trim());
        const rows = Array.from(table.querySelectorAll("tbody tr")).map((tr) =>
          Array.from(tr.querySelectorAll("td")).map((td) => td.textContent.trim())
        );
        return { headers, rows, rowCount: rows.length };
      }),

      forms: Array.from(document.querySelectorAll("form")).map((form) => ({
        action: form.action,
        method: form.method,
        fields: Array.from(form.querySelectorAll("input, select, textarea")).map((field) => ({
          name: field.name,
          type: field.type || field.tagName.toLowerCase(),
          label: field.labels?.[0]?.textContent || field.placeholder || field.name,
          required: field.required,
          options:
            field.tagName === "SELECT" ? Array.from(field.options).map((opt) => opt.text) : [],
        })),
      })),

      links: Array.from(
        new Set(
          Array.from(document.querySelectorAll("a[href]"))
            .map((a) => a.href)
            .filter((href) => href.includes("aoma") && !href.includes("logout"))
        )
      ),

      // Extract any JSON data embedded in the page
      jsonData: (() => {
        try {
          const scripts = Array.from(
            document.querySelectorAll(
              'script[type="application/json"], script[type="application/ld+json"]'
            )
          );
          return scripts
            .map((s) => {
              try {
                return JSON.parse(s.textContent);
              } catch {
                return null;
              }
            })
            .filter(Boolean);
        } catch {
          return [];
        }
      })(),

      // Get any API endpoints mentioned
      apiEndpoints: Array.from(
        new Set(
          Array.from(document.querySelectorAll("[data-api], [data-endpoint], [data-url]"))
            .map((el) => el.dataset.api || el.dataset.endpoint || el.dataset.url)
            .filter(Boolean)
        )
      ),
    };

    // Check if this is meaningful content (not just a login page)
    content.isMeaningful =
      (content.text.length > 500 && !content.text.includes("Employee Login")) ||
      content.tables.length > 0 ||
      content.jsonData.length > 0;

    return content;
  });
}

async function saveToSupabase(content, source = "aoma") {
  if (!content.text || content.text.length < 100) {
    return { success: false, reason: "Content too short" };
  }

  const contentHash = crypto.createHash("md5").update(content.text).digest("hex");

  // Check if we already have this exact content
  const { data: existing } = await supabase
    .from("aoma_content")
    .select("id")
    .eq("content_hash", contentHash)
    .single();

  if (existing) {
    return { success: false, reason: "Duplicate content" };
  }

  const record = {
    url: content.url,
    path: content.path,
    title: content.title,
    content: content.text,
    content_hash: contentHash,
    metadata: {
      source,
      crawled_at: new Date().toISOString(),
      tables_count: content.tables?.length || 0,
      forms_count: content.forms?.length || 0,
      links_count: content.links?.length || 0,
      has_data: content.isMeaningful,
      tables: content.tables || [],
      forms: content.forms || [],
      links: content.links || [],
      json_data: content.jsonData || [],
      api_endpoints: content.apiEndpoints || [],
    },
  };

  const { error } = await supabase.from("aoma_content").upsert(record, { onConflict: "url" });

  if (error) {
    return { success: false, reason: error.message };
  }

  return { success: true };
}

async function deepCrawl() {
  // Load existing auth
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

  let crawledCount = 0;
  let savedCount = 0;
  let skippedCount = 0;

  console.log(`🕷️ Crawling ${AOMA_ENDPOINTS.length} endpoints...\n`);

  for (const endpoint of AOMA_ENDPOINTS) {
    try {
      const url = `https://aoma-stage.smcdp-de.net${endpoint}`;
      console.log(`[${++crawledCount}/${AOMA_ENDPOINTS.length}] ${endpoint}`);

      await page.goto(url, {
        waitUntil: "networkidle",
        timeout: 30000,
      });

      const content = await extractMaximalContent(page);

      if (content.isMeaningful) {
        const result = await saveToSupabase(content, "aoma");
        if (result.success) {
          console.log(`  ✅ Saved (${content.text.length} chars, ${content.tables.length} tables)`);
          savedCount++;
        } else {
          console.log(`  ⏭️ Skipped: ${result.reason}`);
          skippedCount++;
        }
      } else {
        console.log(`  ⏭️ Not meaningful content`);
        skippedCount++;
      }
    } catch (error) {
      console.error(`  ❌ Error: ${error.message}`);
    }
  }

  // Now discover and crawl linked pages
  console.log("\n🔍 Discovering linked pages...\n");

  await page.goto(
    "https://aoma-stage.smcdp-de.net/servlet/com.sonymusic.aoma.AOMADispatcherServlet?chain=CustomHomePageViewAction"
  );
  await page.waitForTimeout(3000);

  const discoveredLinks = await page.evaluate(() => {
    return Array.from(
      new Set(
        Array.from(document.querySelectorAll("a[href]"))
          .map((a) => a.href)
          .filter(
            (href) =>
              href.includes("aoma") &&
              href.includes("chain=") &&
              !href.includes("Logout") &&
              !href.includes("login")
          )
      )
    );
  });

  console.log(`Found ${discoveredLinks.length} additional links\n`);

  for (const link of discoveredLinks) {
    if (!AOMA_ENDPOINTS.some((e) => link.includes(e))) {
      try {
        const url = new URL(link);
        console.log(`Discovered: ${url.search}`);

        await page.goto(link, {
          waitUntil: "networkidle",
          timeout: 30000,
        });

        const content = await extractMaximalContent(page);

        if (content.isMeaningful) {
          const result = await saveToSupabase(content, "aoma-discovered");
          if (result.success) {
            console.log(`  ✅ Saved (${content.text.length} chars)`);
            savedCount++;
          } else {
            console.log(`  ⏭️ ${result.reason}`);
            skippedCount++;
          }
        }
      } catch (error) {
        console.error(`  ❌ Error: ${error.message}`);
      }
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("AOMA CRAWL COMPLETE");
  console.log(`✅ Saved: ${savedCount} pages`);
  console.log(`⏭️ Skipped: ${skippedCount} pages`);
  console.log(`📊 Total processed: ${crawledCount + discoveredLinks.length}`);
  console.log("=".repeat(60));

  await browser.close();
}

// Main execution
async function main() {
  console.log("Checking Supabase connection...");

  const { data, error } = await supabase.from("aoma_content").select("count").limit(1);

  if (error && error.message.includes("does not exist")) {
    console.log("\n❌ Table aoma_content does not exist!");
    console.log("Please run the SQL in: sql/create-aoma-content-table.sql");
    process.exit(1);
  }

  console.log("✅ Supabase connected\n");

  await deepCrawl();
}

main().catch(console.error);
