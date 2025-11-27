import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Tables from the migration file that have embedding columns
const VECTOR_TABLES = [
  { table: "wiki_documents", column: "embedding" },
  { table: "crawled_pages", column: "content_embedding" },
  { table: "app_pages", column: "embedding" },
  { table: "code_files", column: "embedding" },
  { table: "jira_tickets", column: "embedding" },
  { table: "siam_vectors", column: "embedding" },
  { table: "beta_base_scenarios", column: "embedding" },
  { table: "test_results", column: "embedding" },
  { table: "git_commits", column: "embedding" },
];

async function checkTable(tableName: string, embeddingColumn: string) {
  try {
    // Get total count
    const { count: totalCount, error: countError } = await supabase
      .from(tableName)
      .select("*", { count: "exact", head: true });

    if (countError) {
      return { table: tableName, error: countError.message };
    }

    // Get count of rows with non-null embeddings
    const { count: embeddedCount, error: embeddedError } = await supabase
      .from(tableName)
      .select("*", { count: "exact", head: true })
      .not(embeddingColumn, "is", null);

    return {
      table: tableName,
      embeddingColumn,
      totalRows: totalCount || 0,
      withEmbeddings: embeddedError ? "N/A" : (embeddedCount || 0),
      needsReembedding: embeddedError ? totalCount : (totalCount || 0),
    };
  } catch (err) {
    return { table: tableName, error: String(err) };
  }
}

async function main() {
  console.log("\n=== SIAM Vector Tables Analysis ===\n");
  console.log("Supabase URL:", supabaseUrl);
  console.log("");

  const results = [];
  
  for (const { table, column } of VECTOR_TABLES) {
    const result = await checkTable(table, column);
    results.push(result);
    
    if ("error" in result) {
      console.log(`❌ ${table}: ${result.error}`);
    } else {
      console.log(`✅ ${table}: ${result.totalRows} rows (${result.withEmbeddings} with embeddings)`);
    }
  }

  console.log("\n=== Summary ===\n");
  
  let totalRows = 0;
  let totalWithEmbeddings = 0;
  
  for (const r of results) {
    if (!("error" in r)) {
      totalRows += r.totalRows;
      if (typeof r.withEmbeddings === "number") {
        totalWithEmbeddings += r.withEmbeddings;
      }
    }
  }
  
  console.log(`Total rows across all tables: ${totalRows}`);
  console.log(`Total rows with embeddings: ${totalWithEmbeddings}`);
  console.log(`Rows needing re-embedding after migration: ${totalWithEmbeddings}`);
}

main().catch(console.error);
