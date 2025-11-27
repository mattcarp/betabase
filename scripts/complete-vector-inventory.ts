import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Complete list based on all our findings
const ALL_VECTOR_TABLES = [
  // With data - confirmed 1536d
  { table: "jira_ticket_embeddings", column: "embedding", estimatedRows: 16563, hasData: true },
  { table: "siam_vectors", column: "embedding", estimatedRows: 15245, hasData: true },
  { table: "git_file_embeddings", column: "embedding", estimatedRows: 4091, hasData: true },
  { table: "jira_tickets", column: "embedding", estimatedRows: 1406, hasData: true },
  { table: "crawled_pages", column: "content_embedding", estimatedRows: 916, hasData: true },
  { table: "code_files", column: "embedding", estimatedRows: 503, hasData: true },
  { table: "wiki_documents", column: "embedding", estimatedRows: 394, hasData: true },
  { table: "app_pages", column: "embedding", estimatedRows: 128, hasData: true },
  { table: "git_commits", column: "embedding", estimatedRows: 99, hasData: true },
  { table: "test_results", column: "embedding", estimatedRows: 10, hasData: true },
  { table: "siam_git_files", column: "embedding", estimatedRows: 3, hasData: true },
  { table: "siam_jira_tickets", column: "embedding", estimatedRows: 2, hasData: true },
  { table: "crawler_documents", column: "embedding", estimatedRows: 1, hasData: true },
  
  // Empty but have 1536d columns that need schema change
  { table: "beta_base_scenarios", column: "embedding", estimatedRows: 0, hasData: false },
  { table: "siam_meeting_transcriptions", column: "embedding", estimatedRows: 0, hasData: false },
  { table: "siam_web_crawl_results", column: "embedding", estimatedRows: 0, hasData: false },
  { table: "aoma_ui_elements", column: "embedding", estimatedRows: 0, hasData: false },
  { table: "test_knowledge_base", column: "embedding", estimatedRows: 0, hasData: false },
  { table: "aqm_audio_knowledge", column: "content_embedding", estimatedRows: 0, hasData: false },
  { table: "firecrawl_analysis", column: "content_embedding", estimatedRows: 0, hasData: false },
  { table: "pages", column: "embedding", estimatedRows: 0, hasData: false },
  { table: "pages", column: "content_embedding", estimatedRows: 0, hasData: false },
  
  // Need to verify
  { table: "curation_items", column: "original_embedding", estimatedRows: 0, hasData: false },
];

async function verifyAndSummarize() {
  console.log("\n" + "=".repeat(70));
  console.log("COMPLETE VECTOR COLUMN INVENTORY");
  console.log("=".repeat(70) + "\n");

  const results: any[] = [];

  for (const item of ALL_VECTOR_TABLES) {
    try {
      // Verify column exists and check dimensions
      const testVector = [0.1];
      const { error } = await supabase
        .from(item.table)
        .insert({ [item.column]: testVector })
        .select();

      let dimensions = "N/A";
      let status = "unknown";

      if (error) {
        const dimMatch = error.message.match(/expected (\d+) dimensions/);
        if (dimMatch) {
          dimensions = dimMatch[1];
          status = "confirmed";
        } else if (error.message.includes("schema cache") || error.message.includes("Could not find")) {
          status = "column not found";
        } else {
          status = error.message.slice(0, 40);
        }
      }

      // Get actual row count with data
      let rowsWithData = 0;
      if (status === "confirmed") {
        const { count } = await supabase
          .from(item.table)
          .select("*", { count: "exact", head: true })
          .not(item.column, "is", null);
        rowsWithData = count || 0;
      }

      results.push({
        table: item.table,
        column: item.column,
        dimensions,
        rowsWithData,
        status,
        needsMigration: dimensions === "1536",
      });
    } catch (err) {
      results.push({
        table: item.table,
        column: item.column,
        dimensions: "error",
        rowsWithData: 0,
        status: String(err),
        needsMigration: false,
      });
    }
  }

  // Filter and display
  const needsMigration = results.filter(r => r.needsMigration);
  const alreadyOk = results.filter(r => r.dimensions === "768");
  const notFound = results.filter(r => r.status === "column not found");
  const other = results.filter(r => !r.needsMigration && r.dimensions !== "768" && r.status !== "column not found");

  console.log("=== Tables with 1536d embeddings (NEED MIGRATION) ===\n");
  console.table(needsMigration.map(r => ({
    table: r.table,
    column: r.column,
    dims: r.dimensions,
    rows: r.rowsWithData,
  })));

  if (alreadyOk.length > 0) {
    console.log("\n=== Tables already at 768d ===\n");
    console.table(alreadyOk);
  }

  if (notFound.length > 0) {
    console.log("\n=== Columns not found (may have different name) ===\n");
    notFound.forEach(r => console.log(`  ${r.table}.${r.column}`));
  }

  // Summary
  const totalTables = needsMigration.length;
  const totalWithData = needsMigration.filter(r => r.rowsWithData > 0).length;
  const totalEmptySchema = needsMigration.filter(r => r.rowsWithData === 0).length;
  const totalEmbeddings = needsMigration.reduce((sum, r) => sum + r.rowsWithData, 0);

  console.log("\n" + "=".repeat(70));
  console.log("SUMMARY");
  console.log("=".repeat(70));
  console.log(`Total tables with 1536d vectors: ${totalTables}`);
  console.log(`  - Tables with data to re-embed: ${totalWithData}`);
  console.log(`  - Empty tables (schema-only change): ${totalEmptySchema}`);
  console.log(`Total embeddings to migrate: ${totalEmbeddings.toLocaleString()}`);

  return results;
}

verifyAndSummarize().catch(console.error);
