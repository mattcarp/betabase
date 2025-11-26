import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function findAllVectorColumns() {
  console.log("\n=== Finding ALL Vector Columns in Database ===\n");

  // Query pg_catalog to find all vector type columns
  const { data, error } = await supabase.rpc('exec_sql', {
    query: `
      SELECT 
        c.table_schema,
        c.table_name, 
        c.column_name,
        c.udt_name,
        c.data_type,
        CASE 
          WHEN c.character_maximum_length IS NOT NULL THEN c.character_maximum_length::text
          ELSE (
            SELECT regexp_replace(format_type(a.atttypid, a.atttypmod), '[^0-9]', '', 'g')
            FROM pg_attribute a
            JOIN pg_class cl ON a.attrelid = cl.oid
            JOIN pg_namespace n ON cl.relnamespace = n.oid
            WHERE n.nspname = c.table_schema
              AND cl.relname = c.table_name
              AND a.attname = c.column_name
          )
        END as dimensions
      FROM information_schema.columns c
      WHERE c.udt_name = 'vector'
        AND c.table_schema = 'public'
      ORDER BY c.table_name, c.column_name;
    `
  });

  if (error) {
    console.log("RPC not available, trying direct query approach...\n");
    
    // Alternative: query all tables and check for vector columns
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.columns')
      .select('table_name, column_name, udt_name, data_type')
      .eq('table_schema', 'public')
      .eq('udt_name', 'vector');
    
    if (tablesError) {
      console.log("Direct query also failed:", tablesError.message);
      console.log("\nTrying to list all tables and check each one...\n");
      
      // Fallback: Get all tables and try to detect vector columns
      await checkAllTablesManually();
      return;
    }
    
    console.log("Vector columns found:", tables);
    return;
  }

  console.log("Vector columns found:");
  console.table(data);
}

async function checkAllTablesManually() {
  // List of potential tables to check (expanded list)
  const potentialTables = [
    // From migration file
    "wiki_documents",
    "crawled_pages", 
    "app_pages",
    "code_files",
    "jira_tickets",
    "siam_vectors",
    "beta_base_scenarios",
    "test_results",
    "git_commits",
    // Additional potential tables
    "documents",
    "embeddings",
    "vectors",
    "knowledge_base",
    "aoma_content",
    "aoma_vectors",
    "aoma_documents",
    "confluence_pages",
    "confluence_docs",
    "outlook_emails",
    "emails",
    "chat_history",
    "conversations",
    "messages",
    "rlhf_feedback",
    "feedback",
    "curated_content",
    "curated_documents",
    "search_history",
    "user_queries",
    "file_uploads",
    "uploaded_documents",
    "transcriptions",
    "audio_transcripts",
    "meeting_notes",
    "notes",
    "snippets",
    "code_snippets",
    "pr_reviews",
    "pull_requests",
    "issues",
    "bugs",
    "features",
    "requirements",
    "specs",
    "documentation",
    "api_docs",
    "changelogs",
    "releases",
    "deployments",
    "metrics",
    "analytics",
    "logs",
    "audit_logs",
    "sessions",
    "chat_sessions",
    "voice_sessions",
  ];

  console.log("Checking tables for embedding/vector columns...\n");
  
  const foundTables: any[] = [];

  for (const tableName of potentialTables) {
    try {
      // Try to select just 1 row to see the structure
      const { data, error } = await supabase
        .from(tableName)
        .select("*")
        .limit(1);

      if (!error && data) {
        // Check if any column looks like an embedding
        if (data.length > 0) {
          const row = data[0];
          const embeddingColumns = Object.keys(row).filter(col => 
            col.includes('embedding') || 
            col.includes('vector') ||
            (Array.isArray(row[col]) && row[col].length > 100)
          );
          
          if (embeddingColumns.length > 0) {
            // Get row count
            const { count } = await supabase
              .from(tableName)
              .select("*", { count: "exact", head: true });
            
            foundTables.push({
              table: tableName,
              embeddingColumns: embeddingColumns.join(", "),
              rowCount: count || 0,
              sampleDimensions: Array.isArray(row[embeddingColumns[0]]) 
                ? row[embeddingColumns[0]].length 
                : "N/A"
            });
          }
        } else {
          // Table exists but is empty - check column names
          const { count } = await supabase
            .from(tableName)
            .select("*", { count: "exact", head: true });
            
          // We found the table, note it
          foundTables.push({
            table: tableName,
            embeddingColumns: "(table empty - cannot detect)",
            rowCount: count || 0,
            sampleDimensions: "N/A"
          });
        }
      }
    } catch (e) {
      // Table doesn't exist, skip
    }
  }

  console.log("\n=== Tables with Embedding/Vector Columns ===\n");
  console.table(foundTables);
  
  console.log("\n=== Summary ===");
  console.log(`Found ${foundTables.length} tables with potential embedding columns`);
  
  const totalRows = foundTables.reduce((sum, t) => sum + (t.rowCount || 0), 0);
  console.log(`Total rows across all tables: ${totalRows}`);
}

findAllVectorColumns().catch(console.error);
