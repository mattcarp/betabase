#!/usr/bin/env node

/**
 * List ALL tables in Supabase and try to get their schemas
 */

const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function listAllTables() {
  console.log("🔍 LISTING ALL TABLES IN SUPABASE\n");

  // Try to query common table names
  const tablesToCheck = [
    "siam_vectors",
    "aoma_knowledge",
    "confluence_knowledge",
    "alexandria_knowledge",
    "jira_issues",
    "firecrawl_analysis",
    "betabase_documents",
    "documents",
    "document_sections",
    "test_results",
    "test_knowledge_base",
    "profiles",
    "users",
  ];

  for (const table of tablesToCheck) {
    console.log(`\nChecking table: ${table}`);
    try {
      // Try to get schema by selecting with limit 0
      const { data, error } = await supabase.from(table).select("*").limit(1);

      if (error) {
        console.log(`  ❌ Error: ${error.message} (code: ${error.code})`);
      } else {
        const { count } = await supabase.from(table).select("*", { count: "exact", head: true });

        console.log(`  ✅ EXISTS - ${count || 0} rows`);

        if (data && data.length > 0) {
          console.log(`  Columns: ${Object.keys(data[0]).join(", ")}`);
          console.log(`  Sample data:`, data[0]);
        } else {
          console.log(`  Table is empty - trying to infer structure...`);
          // For empty tables, we can't get column info via JS client
          console.log(`  ⚠️  Cannot determine columns from empty table via Supabase JS client`);
        }
      }
    } catch (e) {
      console.log(`  ❌ Exception: ${e.message}`);
    }
  }

  console.log("\n\n" + "═".repeat(80));
  console.log("\n💡 NOTE: Supabase JS client cannot introspect empty table schemas.");
  console.log("To see column definitions for empty tables, you need to:");
  console.log("1. Use SQL Editor in Supabase Dashboard");
  console.log(
    "2. Run: SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'siam_vectors';"
  );
  console.log("\nOr check the table structure directly in Supabase Dashboard > Table Editor\n");
}

listAllTables()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("\n❌ Fatal error:", err);
    process.exit(1);
  });
