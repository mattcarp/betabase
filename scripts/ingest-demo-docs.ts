
import { createClient } from "@supabase/supabase-js";
import { getSupabaseVectorService } from "../src/services/supabaseVectorService";
import { DEFAULT_APP_CONTEXT } from "../src/lib/supabase";
import * as fs from "fs";
import * as path from "path";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function ingestDemoDocs() {
  console.log("🚀 Starting demo doc ingestion...");

  const vectorService = getSupabaseVectorService();
  const docsDir = path.join(process.cwd(), "demo_docs");
  
  if (!fs.existsSync(docsDir)) {
    console.error(`❌ Docs directory not found: ${docsDir}`);
    process.exit(1);
  }

  const files = fs.readdirSync(docsDir).filter(f => f.endsWith(".md"));
  console.log(`Found ${files.length} files to ingest.`);

  for (const file of files) {
    console.log(`Processing ${file}...`);
    const content = fs.readFileSync(path.join(docsDir, file), "utf-8");
    
    // Determine source type based on filename for better filtering/context
    let sourceType: "knowledge" | "jira" = "knowledge";
    let sourceId = file;

    if (file.includes("Jira")) {
        sourceType = "jira";
        sourceId = "AOMA-MIGRATION-REPORT"; // Special ID for retrieval
    }

    try {
      await vectorService.upsertVector(
        DEFAULT_APP_CONTEXT.organization,
        DEFAULT_APP_CONTEXT.division,
        DEFAULT_APP_CONTEXT.app_under_test,
        content,
        sourceType,
        sourceId,
        {
          filename: file,
          ingested_at: new Date().toISOString(),
          demo_tag: "demo-recording-v1"
        }
      );
      console.log(`✅ Successfully ingested ${file} as ${sourceType}`);
    } catch (error) {
      console.error(`❌ Failed to ingest ${file}:`, error);
    }
  }

  console.log("✨ All demo docs ingested!");
}

ingestDemoDocs().catch(console.error);
