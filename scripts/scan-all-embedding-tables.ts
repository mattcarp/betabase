import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ALL tables from the Supabase dashboard that might have embeddings
const ALL_TABLES = [
  "accessibility",
  "Account",
  "accounts", 
  "aoma_console_logs",
  "aoma_css_styles",
  "aoma_dom_structures",
  "aoma_navigation_links",
  "aoma_sessions",
  "aoma_test_dependencies",
  "aoma_ui_elements",
  "app_console_logs",
  "app_links",
  "app_pages",
  "app_performance_metrics",
  "app_screenshots",
  "aqm_analyses",
  "aqm_api_usage",
  "aqm_audio_files",
  "aqm_audio_knowledge",
  "aqm_comparisons",
  "aqm_ml_models",
  "aqm_performance_metrics",
  "aqm_processing_jobs",
  "beta_base_executions",
  "beta_base_scenarios",
  "code_files",
  "console_logs",
  "context_source_weights",
  "context_weights",
  "conversations",
  "crawled_pages",
  "crawler_documents",
  "crawler_logs",
  "curation_items",
  "deduplication_scans",
  "dom_snapshots",
  "duplicate_files",
  "embedding_migration_status",
  "file_metadata",
  "firecrawl_analysis",
  "generated_tests",
  "git_commits",
  "git_file_embeddings",
  "jira_ticket_embeddings",
  "jira_tickets",
  "links",
  "logs",
  "messages",
  "navigation_links",
  "network_requests",
  "page_states",
  "pages",
  "performance_metrics",
  "Session",
  "sessions",
  "siam_git_files",
  "siam_jira_tickets",
  "siam_meeting_transcriptions",
  "siam_vectors",
  "siam_web_crawl_results",
  "sync_status",
  "system_metrics_snapshots",
  "test_context_attribution",
  "test_contexts",
  "test_coverage",
  "test_executions",
  "test_feedback",
  "test_generation_patterns",
  "test_knowledge_base",
  "test_quality_dimensions",
  "test_results",
  "test_runs",
  "test_save_events",
  "test_specs",
  "todos",
  "traces",
  "User",
  "user_nicknames",
  "users",
  "vector_query_performance",
  "verification_tokens",
  "VerificationToken",
  "visual_baselines",
  "visual_diffs",
  "visual_snapshots",
  "voice_settings",
  "wiki_documents",
];

async function findAllEmbeddingColumns() {
  console.log("\n=== Complete Embedding Column Scan ===\n");
  
  const results: any[] = [];

  for (const tableName of ALL_TABLES) {
    try {
      // Get one row to check columns
      const { data, error } = await supabase
        .from(tableName)
        .select("*")
        .limit(1);

      if (error) {
        continue; // Table doesn't exist or no access
      }

      if (!data || data.length === 0) {
        // Empty table - try to get column info another way
        const { count } = await supabase
          .from(tableName)
          .select("*", { count: "exact", head: true });
        
        if (count === 0) {
          // Check if table name suggests embeddings
          if (tableName.includes("embedding") || tableName.includes("vector")) {
            results.push({
              table: tableName,
              columns: "(empty table)",
              rowCount: 0,
              dimensions: "N/A",
              note: "Name suggests vectors"
            });
          }
        }
        continue;
      }

      const row = data[0];
      const columns = Object.keys(row);
      
      // Find columns that look like embeddings
      const embeddingColumns = columns.filter(col => {
        const value = row[col];
        return (
          col.toLowerCase().includes("embedding") ||
          col.toLowerCase().includes("vector") ||
          (typeof value === "string" && value.startsWith("[") && value.length > 1000)
        );
      });

      if (embeddingColumns.length > 0) {
        const { count } = await supabase
          .from(tableName)
          .select("*", { count: "exact", head: true });

        for (const col of embeddingColumns) {
          // Check dimensions
          const value = row[col];
          let dims = "Unknown";
          
          if (typeof value === "string" && value.startsWith("[")) {
            dims = (value.match(/,/g) || []).length + 1;
          }

          // Count non-null values for this column
          const { count: nonNullCount } = await supabase
            .from(tableName)
            .select("*", { count: "exact", head: true })
            .not(col, "is", null);

          results.push({
            table: tableName,
            column: col,
            rowCount: count || 0,
            withData: nonNullCount || 0,
            dimensions: dims,
          });
        }
      }
    } catch (err) {
      // Skip errors
    }
  }

  // Sort by row count descending
  results.sort((a, b) => (b.withData || 0) - (a.withData || 0));

  console.log("All tables with embedding/vector columns:\n");
  console.table(results);

  // Summary
  const total1536 = results.filter(r => r.dimensions === 1536).reduce((sum, r) => sum + (r.withData || 0), 0);
  const total768 = results.filter(r => r.dimensions === 768).reduce((sum, r) => sum + (r.withData || 0), 0);
  const totalOther = results.filter(r => r.dimensions !== 1536 && r.dimensions !== 768 && r.withData > 0);

  console.log("\n=== Summary ===");
  console.log(`Total 1536d embeddings (OpenAI): ${total1536.toLocaleString()}`);
  console.log(`Total 768d embeddings (Gemini): ${total768.toLocaleString()}`);
  console.log(`Other dimensions:`, totalOther.length);

  return results;
}

findAllEmbeddingColumns().catch(console.error);
