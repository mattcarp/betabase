import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function findAllVectorColumns() {
  console.log("\n=== Finding ALL Vector Columns in Schema ===\n");

  // Query the information_schema to find all vector columns
  const { data, error } = await supabase.rpc('get_vector_columns');

  if (error) {
    console.log("RPC not found, trying raw SQL via REST...");
    
    // Alternative: query pg_catalog directly
    const { data: columns, error: colError } = await supabase
      .from('pg_catalog.pg_attribute')
      .select('*')
      .limit(1);
    
    if (colError) {
      console.log("Can't query pg_catalog directly. Using workaround...");
    }
  }

  // Workaround: Check each table that might have vectors based on size/name
  const suspectTables = [
    "aqm_audio_knowledge",
    "siam_meeting_transcriptions", 
    "siam_web_crawl_results",
    "aoma_dom_structures",
    "aoma_ui_elements",
    "beta_base_scenarios",
    "pages",
    "curation_items",
    "test_knowledge_base",
    "generated_tests",
    "firecrawl_analysis",
    // Already confirmed tables
    "jira_ticket_embeddings",
    "siam_vectors",
    "git_file_embeddings",
    "jira_tickets",
    "crawled_pages",
    "code_files",
    "wiki_documents",
    "app_pages",
    "git_commits",
    "test_results",
    "siam_git_files",
    "siam_jira_tickets",
    "crawler_documents",
  ];

  const results: any[] = [];

  for (const table of suspectTables) {
    try {
      // Get one row to see column structure
      const { data: sample, error } = await supabase
        .from(table)
        .select("*")
        .limit(1);

      if (error) continue;

      // Get total count
      const { count } = await supabase
        .from(table)
        .select("*", { count: "exact", head: true });

      // Check columns for vector-like names or data
      if (sample && sample.length > 0) {
        const row = sample[0];
        const columns = Object.keys(row);
        
        for (const col of columns) {
          if (col.toLowerCase().includes("embedding") || 
              col.toLowerCase().includes("vector") ||
              col.toLowerCase().includes("content_embedding")) {
            
            const value = row[col];
            let dims = "empty/null";
            
            if (value) {
              if (typeof value === "string" && value.startsWith("[")) {
                dims = (value.match(/,/g) || []).length + 1;
              }
            }

            results.push({
              table,
              column: col,
              rows: count || 0,
              sampleDims: dims,
              hasData: value !== null,
            });
          }
        }
      } else {
        // Empty table - we need to check schema another way
        // Try inserting a dummy and catching the error to see column types
        results.push({
          table,
          column: "(need schema check)",
          rows: 0,
          sampleDims: "unknown",
          hasData: false,
        });
      }
    } catch (err) {
      // Skip
    }
  }

  console.log("Vector columns found:\n");
  console.table(results);

  // Identify empty tables that likely have vector columns
  const emptyWithVectors = results.filter(r => r.rows === 0 && r.column !== "(need schema check)");
  const needsSchemaCheck = results.filter(r => r.column === "(need schema check)");

  console.log("\n=== Empty tables with vector columns ===");
  emptyWithVectors.forEach(r => console.log(`  ${r.table}.${r.column}`));

  console.log("\n=== Empty tables needing schema inspection ===");
  needsSchemaCheck.forEach(r => console.log(`  ${r.table}`));

  return results;
}

findAllVectorColumns().catch(console.error);
