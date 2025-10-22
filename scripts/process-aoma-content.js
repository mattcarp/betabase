#!/usr/bin/env node

/**
 * Complete AOMA Content Processing Pipeline
 * Processes your existing HTML files and sets up for future crawling
 */

const fs = require("fs").promises;
const path = require("path");
const TurndownService = require("turndown");
const { createClient } = require("@supabase/supabase-js");

require("dotenv").config({ path: ".env.local" });

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Initialize Turndown for HTML to Markdown conversion
const turndown = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
});

turndown.remove(["script", "style", "nav", "footer", "header"]);

async function processExistingContent() {
  console.log("🚀 AOMA Content Processing Pipeline\n");
  console.log("=" * 60 + "\n");

  // Step 1: Check database connection
  console.log("Step 1: Checking database connection...");
  const dbOk = await checkDatabase();
  if (!dbOk) {
    console.log("\n❌ Database not ready. Please create tables first.");
    console.log("Run the SQL from scripts/create-tables.js in Supabase dashboard\n");
    return;
  }

  // Step 2: Process HTML files
  console.log("\nStep 2: Processing existing HTML files...\n");
  await processHtmlFiles();

  // Step 3: Show summary
  await showSummary();
}

async function checkDatabase() {
  try {
    const { error } = await supabase.from("aoma_unified_vectors").select("count").limit(1);

    if (error) {
      if (error.code === "42P01") {
        // Table doesn't exist
        return false;
      }
      console.log("Database error:", error.message);
      return false;
    }

    console.log("   ✅ Database connection successful");
    return true;
  } catch (error) {
    console.log("   ❌ Database error:", error.message);
    return false;
  }
}

async function processHtmlFiles() {
  const tmpDir = path.join(process.cwd(), "tmp");
  const files = await fs.readdir(tmpDir);

  // Filter for AOMA HTML files
  const htmlFiles = files.filter(
    (f) => f.endsWith(".html") && f.includes("aoma") && !f.includes("login") // Skip login pages
  );

  console.log(`Found ${htmlFiles.length} AOMA content files to process\n`);

  let successCount = 0;
  let errorCount = 0;

  for (const file of htmlFiles) {
    try {
      console.log(`📄 Processing: ${file}`);

      // Read HTML
      const htmlPath = path.join(tmpDir, file);
      const html = await fs.readFile(htmlPath, "utf8");

      // Extract clean title
      let title = file
        .replace(".html", "")
        .replace(/aoma_https_aoma_stage_smcdp_de_net_/i, "")
        .replace(/_/g, " ")
        .replace(/servlet.*$/i, "")
        .replace(/legacy embed.*$/i, "")
        .replace(/aoma ui /i, "")
        .trim();

      // Capitalize words
      title = title
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

      // Convert to markdown
      const markdown = turndown.turndown(html);

      // Clean markdown
      const cleanedMarkdown = markdown
        .replace(/\n{3,}/g, "\n\n")
        .replace(/\[]\(\)/g, "")
        .replace(/[ \t]+/g, " ")
        .replace(/[ \t]+$/gm, "")
        .trim();

      // Skip if too short
      if (cleanedMarkdown.length < 50) {
        console.log("   ⚠️ Skipping - content too short");
        continue;
      }

      // Create proper URL
      let url = file.replace(".html", "");
      if (url.includes("aoma_ui")) {
        // Extract the page name
        const match = url.match(/aoma_ui_(.+)/);
        if (match) {
          url = `https://aoma-stage.smcdp-de.net/aoma-ui/${match[1].replace(/_/g, "-")}`;
        }
      } else {
        url = `https://aoma-stage.smcdp-de.net/${url}`;
      }

      // Prepare record
      const record = {
        content: cleanedMarkdown,
        embedding: null, // No embedding for now (need OpenAI API key)
        source_type: "knowledge",
        source_id: url,
        metadata: {
          title: title,
          originalFile: file,
          contentLength: cleanedMarkdown.length,
          processedAt: new Date().toISOString(),
          needsEmbedding: true,
        },
      };

      // Store in Supabase
      const { error } = await supabase.from("aoma_unified_vectors").upsert(record, {
        onConflict: "source_type,source_id",
      });

      if (error) {
        console.error(`   ❌ Error: ${error.message}`);
        errorCount++;
      } else {
        console.log(`   ✅ Stored: ${title} (${cleanedMarkdown.length} chars)`);
        successCount++;

        // Save markdown locally for reference
        const mdDir = path.join(tmpDir, "processed-markdown");
        await fs.mkdir(mdDir, { recursive: true });
        const mdFile = path.join(mdDir, `${title.replace(/[^a-z0-9]/gi, "-")}.md`);
        await fs.writeFile(mdFile, `# ${title}\n\n${cleanedMarkdown}`);
      }
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
      errorCount++;
    }
  }

  console.log("\n" + "=" * 60);
  console.log(`✅ Successfully processed: ${successCount} files`);
  console.log(`❌ Failed: ${errorCount} files`);
  console.log("=" * 60);

  return { successCount, errorCount };
}

async function showSummary() {
  console.log("\n📊 Database Summary:\n");

  try {
    // Get total count
    const { count } = await supabase
      .from("aoma_unified_vectors")
      .select("*", { count: "exact", head: true })
      .eq("source_type", "knowledge");

    console.log(`Total AOMA documents in database: ${count || 0}`);

    // Get sample records
    const { data } = await supabase
      .from("aoma_unified_vectors")
      .select("source_id, metadata")
      .eq("source_type", "knowledge")
      .order("created_at", { ascending: false })
      .limit(5);

    if (data && data.length > 0) {
      console.log("\nLatest documents:");
      data.forEach((doc, i) => {
        console.log(`${i + 1}. ${doc.metadata?.title || "Untitled"}`);
        console.log(`   ${doc.source_id}`);
      });
    }

    console.log("\n✅ Your AOMA knowledge base is ready!");
    console.log("\n📝 Next steps:");
    console.log("1. Add OpenAI API key to enable vector search");
    console.log("2. Use the content for LLM queries");
    console.log("3. Set up regular crawling for updates");
  } catch (error) {
    console.error("Summary error:", error.message);
  }
}

// Run the pipeline
processExistingContent().catch(console.error);
