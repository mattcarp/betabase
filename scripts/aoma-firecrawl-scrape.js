#!/usr/bin/env node

/**
 * Use Firecrawl to scrape AOMA with auth cookies
 */

const fs = require("fs");
const path = require("path");
const FirecrawlApp = require("@mendable/firecrawl-js").default;
const { createClient } = require("@supabase/supabase-js");
const OpenAI = require("openai");

require("dotenv").config({ path: ".env.local" });
require("dotenv").config({ path: ".env" });

const firecrawl = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function getCookieHeader() {
  const storage = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../tmp/aoma-stage-storage.json"), "utf8")
  );

  const cookies = storage.cookies
    .filter((c) => c.domain.includes("aoma-stage") || c.domain.includes("smcdp"))
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  return cookies;
}

async function scrapeAOMAPages() {
  const pages = [
    "https://aoma-stage.smcdp-de.net/",
    "https://aoma-stage.smcdp-de.net/aoma-ui/my-aoma-files",
    "https://aoma-stage.smcdp-de.net/aoma-ui/simple-upload",
    "https://aoma-stage.smcdp-de.net/aoma-ui/direct-upload",
    "https://aoma-stage.smcdp-de.net/aoma-ui/product-metadata-viewer",
  ];

  const cookieHeader = await getCookieHeader();
  console.log(`🍪 Using cookies: ${cookieHeader.substring(0, 100)}...`);

  for (const url of pages) {
    console.log(`\n📄 Scraping: ${url}`);

    try {
      const result = await firecrawl.scrape(url, {
        headers: {
          Cookie: cookieHeader,
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        },
        formats: ["markdown"],
        onlyMainContent: true,
        waitFor: 2000,
      });

      if (!result.success) {
        console.log(`  ❌ Failed: ${result.error}`);
        continue;
      }

      const markdown = result.markdown || "";
      console.log(`  ✅ Scraped ${markdown.length} chars`);

      // Generate embedding
      const embeddingResponse = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: markdown.substring(0, 8000),
      });

      const embedding = embeddingResponse.data[0].embedding;

      // Store in Supabase
      const { error } = await supabase.from("siam_vectors").upsert(
        {
          content: markdown,
          embedding: embedding,
          source_type: "knowledge",
          source_id: url,
          metadata: {
            url: url,
            title: result.metadata?.title || "AOMA Page",
            crawledAt: new Date().toISOString(),
            contentLength: markdown.length,
          },
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "source_type,source_id",
        }
      );

      if (error) {
        console.log(`  ❌ DB Error: ${error.message}`);
      } else {
        console.log(`  ✅ Stored in vector DB`);
      }

      // Save locally
      const filename = url.replace(/[^a-z0-9]/gi, "_") + ".md";
      const outPath = path.join(__dirname, "../tmp/crawled-content", filename);
      fs.writeFileSync(outPath, markdown);
      console.log(`  ✅ Saved to ${filename}`);
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
    }
  }

  console.log("\n🎉 Scraping complete!");
}

scrapeAOMAPages().catch(console.error);
