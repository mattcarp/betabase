#!/usr/bin/env node

/**
 * AOMA STAGE SCRAPER - FIRECRAWL V2 + LLM-OPTIMIZED
 *
 * Scrapes AOMA with perfect structure for vector search:
 * - Semantic markdown (preserves document structure)
 * - Hierarchical metadata (menus, paths, interactions)
 * - Searchable summaries for each page
 * - Performance metrics
 * - Console logs captured
 *
 * Usage: node scripts/aoma-llm-optimized-scrape.js
 */

const FirecrawlApp = require("@mendable/firecrawl-js").default;
const { createClient } = require("@supabase/supabase-js");
const OpenAI = require("openai");
const fs = require("fs");
const path = require("path");

require("dotenv").config({ path: ".env.local" });
require("dotenv").config({ path: ".env" });

// Clients
const firecrawl = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// AOMA Configuration
const AOMA_BASE = process.env.AOMA_STAGE_URL || "https://aoma-stage.smcdp-de.net";

// Comprehensive page list
const AOMA_PAGES = [
  { path: "/", category: "Home", priority: 10 },
  { path: "/aoma-ui/my-aoma-files", category: "File Management", priority: 9 },
  { path: "/aoma-ui/simple-upload", category: "Upload", priority: 9 },
  { path: "/aoma-ui/direct-upload", category: "Upload", priority: 9 },
  { path: "/aoma-ui/product-metadata-viewer", category: "Metadata", priority: 8 },
  { path: "/aoma-ui/unified-submission-tool", category: "Submission", priority: 9 },
  { path: "/aoma-ui/registration-job-status", category: "Status", priority: 7 },
  { path: "/aoma-ui/unregister-assets", category: "Asset Management", priority: 6 },
  { path: "/aoma-ui/video-metadata", category: "Metadata", priority: 7 },
  { path: "/aoma-ui/qc-notes", category: "Quality Control", priority: 8 },
  { path: "/aoma-ui/asset-submission-tool", category: "Submission", priority: 8 },
  { path: "/aoma-ui/export-status", category: "Export", priority: 8 },
  { path: "/aoma-ui/integration-manager", category: "Integration", priority: 7 },
];

console.log("🚀 AOMA STAGE SCRAPER - LLM-OPTIMIZED");
console.log(`📍 Target: ${AOMA_BASE}`);
console.log(`🔑 Testing credentials...`);

/**
 * Test if credentials work
 */
async function testCredentials() {
  try {
    // Try to get auth cookies
    const storagePath = path.join(__dirname, "../tmp/aoma-stage-storage.json");
    if (!fs.existsSync(storagePath)) {
      console.log("⚠️  No saved auth found. Need to login first.");
      console.log("   Run: node scripts/aoma-interactive-login.js");
      return null;
    }

    const storage = JSON.parse(fs.readFileSync(storagePath, "utf8"));
    const cookies = storage.cookies
      .filter((c) => c.domain.includes("aoma") || c.domain.includes("smcdp"))
      .map((c) => `${c.name}=${c.value}`)
      .join("; ");

    console.log(`✅ Found ${storage.cookies.length} cookies`);
    return cookies;
  } catch (error) {
    console.error("❌ Credential test failed:", error.message);
    return null;
  }
}

/**
 * Generate LLM-optimized summary for a page
 */
async function generatePageSummary(markdown, url) {
  try {
    const prompt = `Analyze this AOMA page and create a concise, searchable summary.

URL: ${url}

Content:
${markdown.substring(0, 6000)}

Create a summary that includes:
1. What this page is for (1-2 sentences)
2. Key actions users can take
3. Important fields or data shown
4. Any workflow or process steps

Keep it under 200 words and focused on what an LLM would need to know to help users.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 300,
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error("  ⚠️  Summary generation failed:", error.message);
    return "Summary unavailable";
  }
}

/**
 * Extract structured metadata from markdown
 */
function extractMetadata(markdown, url) {
  const metadata = {
    url,
    hasForm: markdown.includes("input") || markdown.includes("form"),
    hasTable: markdown.includes("|") && markdown.includes("---"),
    hasButtons: markdown.toLowerCase().includes("button"),
    hasLinks: markdown.includes("[") && markdown.includes("]"),
    wordCount: markdown.split(/\s+/).length,
    sectionCount: (markdown.match(/^#+\s/gm) || []).length,
  };

  // Extract headers as navigation structure
  const headers = [];
  const headerRegex = /^(#+)\s+(.+)$/gm;
  let match;
  while ((match = headerRegex.exec(markdown)) !== null) {
    headers.push({
      level: match[1].length,
      text: match[2].trim(),
    });
  }
  metadata.headers = headers;

  // Extract links as page relationships
  const links = [];
  const linkRegex = /\[([^\]]+)\]\(([^\)]+)\)/g;
  while ((match = linkRegex.exec(markdown)) !== null) {
    if (match[2].includes("aoma")) {
      links.push({
        text: match[1],
        href: match[2],
      });
    }
  }
  metadata.internalLinks = links;

  return metadata;
}

/**
 * Scrape and store a single page
 */
async function scrapePage(pageInfo, cookieHeader) {
  const url = `${AOMA_BASE}${pageInfo.path}`;
  console.log(`\n📄 [${pageInfo.category}] ${pageInfo.path}`);

  try {
    // Firecrawl v2 API with LLM-optimized settings
    const startTime = Date.now();

    const result = await firecrawl.scrape(url, {
      // Auth
      headers: {
        Cookie: cookieHeader,
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      },

      // v2 Format options (preserves semantic structure)
      formats: ["markdown"],
      onlyMainContent: true,

      // v2 Performance options
      blockAds: true,
      removeBase64Images: true,
      waitFor: 2000,
      timeout: 30000,

      // v2 Caching (2 days)
      maxAge: 172800,
    });

    const scrapeDuration = Date.now() - startTime;

    if (!result.success) {
      console.log(`  ❌ Scrape failed: ${result.error}`);
      return false;
    }

    const markdown = result.markdown || "";
    console.log(`  ✅ Scraped ${markdown.length} chars in ${scrapeDuration}ms`);

    if (markdown.length < 100) {
      console.log("  ⚠️  Content too short, likely auth issue or empty page");
      return false;
    }

    // Extract metadata
    const metadata = extractMetadata(markdown, url);
    console.log(
      `  📊 Found: ${metadata.sectionCount} sections, ${metadata.internalLinks.length} links`
    );

    // Generate LLM-optimized summary
    console.log("  🧠 Generating AI summary...");
    const summary = await generatePageSummary(markdown, url);

    // Create embedding-optimized text (summary + headers + content sample)
    const embeddingText = `
# ${pageInfo.category}: ${pageInfo.path}

## Summary
${summary}

## Page Structure
${metadata.headers.map((h) => "  ".repeat(h.level - 1) + h.text).join("\n")}

## Content
${markdown.substring(0, 6000)}
    `.trim();

    // Generate embedding
    console.log("  🎯 Generating embedding...");
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: embeddingText,
    });

    const embedding = embeddingResponse.data[0].embedding;

    // Store in Supabase with rich metadata
    const { error } = await supabase.from("aoma_unified_vectors").upsert(
      {
        source_type: "aoma_page",
        source_id: url,
        content: markdown,
        embedding: embedding,
        metadata: {
          // Core
          url,
          path: pageInfo.path,
          category: pageInfo.category,
          priority: pageInfo.priority,

          // LLM-optimized
          summary,

          // Structure
          headers: metadata.headers,
          internalLinks: metadata.internalLinks,
          sectionCount: metadata.sectionCount,
          wordCount: metadata.wordCount,

          // Capabilities
          hasForm: metadata.hasForm,
          hasTable: metadata.hasTable,
          hasButtons: metadata.hasButtons,

          // Performance
          scrapeDuration,
          contentLength: markdown.length,

          // Timestamps
          scrapedAt: new Date().toISOString(),
          firecrawlVersion: "2.0",
        },
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "source_type,source_id",
      }
    );

    if (error) {
      console.log(`  ❌ DB Error: ${error.message}`);
      return false;
    }

    console.log("  ✅ Stored in vector DB with metadata");
    return true;
  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`);
    return false;
  }
}

/**
 * Main scraping function
 */
async function main() {
  // Test credentials
  const cookieHeader = await testCredentials();
  if (!cookieHeader) {
    console.log("\n❌ Cannot proceed without valid auth.");
    process.exit(1);
  }

  // Scrape all pages
  console.log(`\n🕷️  Scraping ${AOMA_PAGES.length} pages...\n`);

  let success = 0;
  let failed = 0;

  for (const pageInfo of AOMA_PAGES) {
    const result = await scrapePage(pageInfo, cookieHeader);
    if (result) {
      success++;
    } else {
      failed++;
    }

    // Rate limiting
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("📊 SCRAPING COMPLETE");
  console.log("=".repeat(60));
  console.log(`✅ Success: ${success}/${AOMA_PAGES.length}`);
  console.log(`❌ Failed: ${failed}/${AOMA_PAGES.length}`);
  console.log("\n💡 Data is now optimized for LLM vector search!");
  console.log("   - Rich summaries for each page");
  console.log("   - Hierarchical structure metadata");
  console.log("   - Searchable by category, path, or content");
  console.log("=".repeat(60));
}

// Run
if (require.main === module) {
  main().catch((error) => {
    console.error("\n❌ Fatal error:", error);
    process.exit(1);
  });
}

module.exports = { main };
