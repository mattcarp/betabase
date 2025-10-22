#!/usr/bin/env node

/**
 * Process crawled AOMA HTML files and push to Supabase
 */

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

async function processAOMAFiles() {
  // Find the latest crawl directory
  const tmpDir = "tmp";
  const dirs = await fs.readdir(tmpDir);
  const crawlDirs = dirs.filter((d) => d.startsWith("aoma-crawl-")).sort();

  if (crawlDirs.length === 0) {
    console.error("❌ No crawl directories found");
    return;
  }

  const latestCrawl = crawlDirs[crawlDirs.length - 1];
  const crawlDir = path.join(tmpDir, latestCrawl);

  console.log(`📁 Processing: ${crawlDir}\n`);

  // Get all JSON files
  const files = await fs.readdir(crawlDir);
  const jsonFiles = files.filter((f) => f.endsWith(".json"));

  console.log(`Found ${jsonFiles.length} pages to process\n`);

  let savedCount = 0;
  let skippedCount = 0;

  for (const jsonFile of jsonFiles) {
    const baseName = jsonFile.replace(".json", "");
    console.log(`📄 Processing: ${baseName}`);

    try {
      // Read the metadata
      const metadata = JSON.parse(await fs.readFile(path.join(crawlDir, jsonFile), "utf8"));

      // Read the text content
      const textContent = await fs.readFile(path.join(crawlDir, `${baseName}.txt`), "utf8");

      // Skip login pages
      if (textContent.includes("Employee Login") && textContent.length < 2000) {
        console.log("   ⏭️ Skipping login page");
        skippedCount++;
        continue;
      }

      // Create content hash
      const contentHash = crypto.createHash("md5").update(textContent).digest("hex");

      // Prepare record
      const record = {
        url: metadata.url,
        path: metadata.url.replace("https://aoma-stage.smcdp-de.net", ""),
        title: metadata.title || "AOMA Page",
        content: textContent,
        content_hash: contentHash,
        metadata: {
          crawled_at: metadata.crawled_at,
          text_length: metadata.text_length,
          links_count: metadata.links_count,
          forms_count: metadata.forms_count,
          links: metadata.links || [],
          forms: metadata.forms || [],
        },
        updated_at: new Date().toISOString(),
      };

      // Upsert to Supabase
      const { data, error } = await supabase.from("aoma_content").upsert(record, {
        onConflict: "url",
      });

      if (error) {
        console.error(`   ❌ Error: ${error.message}`);
      } else {
        console.log(`   ✅ Saved to Supabase (${textContent.length} chars)`);
        savedCount++;
      }
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log(`✅ PROCESSING COMPLETE!`);
  console.log(`📊 Saved: ${savedCount} pages`);
  console.log(`⏭️ Skipped: ${skippedCount} login pages`);
  console.log("=".repeat(60));

  if (savedCount === 0) {
    console.log("\n⚠️ No pages were saved to Supabase.");
    console.log("Make sure you have created the table using:");
    console.log("  sql/create-aoma-content-table.sql");
  }
}

processAOMAFiles().catch(console.error);
