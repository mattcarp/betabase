import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TABLES_TO_CHECK = [
  "aqm_audio_knowledge",
  "aoma_dom_structures",
  "generated_tests",
  "firecrawl_analysis",
];

async function checkTableColumns() {
  console.log("\n=== Checking Column Names for Suspect Tables ===\n");

  for (const table of TABLES_TO_CHECK) {
    console.log(`\n--- ${table} ---`);
    
    // Try different possible vector column names
    const possibleColumns = [
      "embedding",
      "content_embedding",
      "vector",
      "embeddings",
      "knowledge_embedding",
      "audio_embedding",
      "dom_embedding",
      "text_embedding",
    ];

    for (const col of possibleColumns) {
      const testVector = [0.1];
      
      const { error } = await supabase
        .from(table)
        .insert({ [col]: testVector })
        .select();

      if (error) {
        if (error.message.includes("expected") && error.message.includes("dimensions")) {
          const dimMatch = error.message.match(/expected (\d+) dimensions/);
          console.log(`  ✓ ${col}: vector(${dimMatch?.[1] || "?"})`);
        } else if (!error.message.includes("schema cache") && !error.message.includes("Could not find")) {
          // Some other error - might indicate column exists
          console.log(`  ? ${col}: ${error.message.slice(0, 60)}...`);
        }
      }
    }
  }
}

checkTableColumns().catch(console.error);
