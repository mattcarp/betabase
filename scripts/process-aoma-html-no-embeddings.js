#!/usr/bin/env node

/**
 * Process existing AOMA HTML files into vector store
 * This version works WITHOUT OpenAI embeddings - just stores the content
 */

const fs = require("fs").promises;
const path = require("path");
const TurndownService = require("turndown");
const { createClient } = require("@supabase/supabase-js");

// Load environment variables
require("dotenv").config({ path: ".env.local" });
require("dotenv").config({ path: ".env" });

// Initialize services
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const turndown = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
});

// Configure turndown for better markdown
turndown.remove(["script", "style", "nav", "footer", "header"]);

async function processHtmlFiles() {
  console.log("🚀 Processing existing AOMA HTML files (without embeddings)...\n");
  console.log("📝 Note: Embeddings will be NULL - add OpenAI API key to generate them\n");

  const tmpDir = path.join(process.cwd(), "tmp");
  const files = await fs.readdir(tmpDir);
  const htmlFiles = files.filter((f) => f.endsWith(".html") && f.includes("aoma"));

  console.log(`Found ${htmlFiles.length} AOMA HTML files to process\n`);
  console.log("Files found:");
  htmlFiles.forEach((f) => console.log(`  - ${f}`));
  console.log("");

  let successCount = 0;
  let errorCount = 0;
  let skippedCount = 0;

  for (const file of htmlFiles) {
    try {
      console.log(`\n📄 Processing: ${file}`);

      // Read HTML
      const htmlPath = path.join(tmpDir, file);
      const html = await fs.readFile(htmlPath, "utf8");

      // Extract title from filename
      const title = file
        .replace(".html", "")
        .replace(/_/g, " ")
        .replace(/aoma https aoma stage smcdp de net/i, "AOMA")
        .replace(/servlet.*$/i, "")
        .replace(/legacy embed.*$/i, "")
        .trim();

      // Convert to markdown
      const markdown = turndown.turndown(html);

      // Clean markdown
      const cleanedMarkdown = markdown
        .replace(/\n{3,}/g, "\n\n")
        .replace(/\[]\(\)/g, "")
        .replace(/[ \t]+/g, " ")
        .replace(/[ \t]+$/gm, "")
        .trim();

      // Skip if content is too short
      if (cleanedMarkdown.length < 100) {
        console.log("   ⚠️ Skipping - content too short");
        skippedCount++;
        continue;
      }

      // Construct a better URL from filename
      let url = file.replace(".html", "");

      // Clean up the URL
      if (url.includes("aoma_https_aoma_stage_smcdp_de_net")) {
        url = url.replace("aoma_https_aoma_stage_smcdp_de_net", "https://aoma-stage.smcdp-de.net");
        url = url.replace(/_/g, "/");
      } else {
        url = `https://aoma-stage.smcdp-de.net/${url}`;
      }

      // Store in Supabase (without embedding for now)
      const { error } = await supabase.from("aoma_unified_vectors").upsert(
        {
          content: cleanedMarkdown,
          embedding: null, // No embedding for now
          source_type: "knowledge",
          source_id: url,
          metadata: {
            title: title,
            originalFile: file,
            contentLength: cleanedMarkdown.length,
            processedAt: new Date().toISOString(),
            needsEmbedding: true, // Flag for later processing
          },
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "source_type,source_id",
        }
      );

      if (error) {
        console.error(`   ❌ Database error: ${error.message}`);
        errorCount++;
      } else {
        console.log(`   ✅ Stored: ${title}`);
        console.log(`      Content length: ${cleanedMarkdown.length} chars`);
        console.log(`      URL: ${url}`);
        successCount++;

        // Save markdown locally
        const mdDir = path.join(tmpDir, "processed-markdown");
        await fs.mkdir(mdDir, { recursive: true });
        const mdFilename = file.replace(".html", ".md").replace(/[^\w\-\.]/g, "_");
        await fs.writeFile(
          path.join(mdDir, mdFilename),
          `# ${title}\n\nSource: ${url}\n\n---\n\n${cleanedMarkdown}`
        );
        console.log(`      Saved markdown: ${mdFilename}`);
      }
    } catch (error) {
      console.error(`   ❌ Error processing ${file}:`, error.message);
      errorCount++;
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("📊 Processing Summary:");
  console.log(`   ✅ Successfully processed: ${successCount} files`);
  console.log(`   ⚠️ Skipped (too short): ${skippedCount} files`);
  console.log(`   ❌ Failed: ${errorCount} files`);
  console.log("=".repeat(60) + "\n");

  // Check what's in the database
  if (successCount > 0) {
    await checkDatabase();
  }
}

async function checkDatabase() {
  console.log("📊 Checking database contents...\n");

  try {
    // Get count of records
    const { count, error: countError } = await supabase
      .from("aoma_unified_vectors")
      .select("*", { count: "exact", head: true })
      .eq("source_type", "knowledge");

    if (!countError) {
      console.log(`Total AOMA knowledge records in database: ${count}\n`);
    }

    // Get sample records
    const { data, error } = await supabase
      .from("aoma_unified_vectors")
      .select("source_id, metadata")
      .eq("source_type", "knowledge")
      .limit(5);

    if (!error && data) {
      console.log("Sample records:");
      data.forEach((record, i) => {
        console.log(`${i + 1}. ${record.metadata?.title || "Untitled"}`);
        console.log(`   URL: ${record.source_id}`);
        console.log(`   Size: ${record.metadata?.contentLength || 0} chars`);
      });
    }

    console.log("\n✅ Content is now in Supabase!");
    console.log("   Note: Embeddings are NULL - add OpenAI API key to enable vector search");
    console.log("   For now, you can still query by content text or metadata");
  } catch (error) {
    console.error("Database check failed:", error.message);
  }
}

// Run the processor
processHtmlFiles().catch(console.error);
