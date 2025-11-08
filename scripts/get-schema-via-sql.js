#!/usr/bin/env node

/**
 * Get actual schema via SQL query using Supabase REST API
 */

const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function getSchemaViaSQL() {
  console.log("🔍 GETTING SCHEMA VIA SQL QUERY\n");
  console.log("Database URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log("\n" + "═".repeat(80) + "\n");

  // Query 1: Get all tables and their column counts
  console.log("Query 1: All tables and column counts\n");

  try {
    const { data, error } = await supabase.rpc("exec_sql", {
      query: `
          SELECT
            table_name,
            COUNT(*) as column_count
          FROM information_schema.columns
          WHERE table_schema = 'public'
          GROUP BY table_name
          ORDER BY table_name;
        `,
    });

    if (error) {
      console.log("❌ RPC exec_sql not available, trying alternative method...\n");

      // Alternative: Use PostgREST to query pg_tables
      const { data: tablesData, error: tablesError } = await supabase
        .from("pg_tables")
        .select("*")
        .eq("schemaname", "public");

      if (tablesError) {
        console.log("❌ Cannot query pg_tables:", tablesError.message);
        console.log("\n⚠️  You need to run this SQL directly in Supabase Dashboard:\n");
        console.log("Go to: https://supabase.com/dashboard/project/kfxetwuuzljhybfgmpuc/sql");
        console.log("\nRun this query:");
        console.log("─".repeat(80));
        console.log(`
SELECT
  table_name,
  COUNT(*) as column_count
FROM information_schema.columns
WHERE table_schema = 'public'
GROUP BY table_name
ORDER BY table_name;
        `);
        console.log("─".repeat(80));

        console.log("\nThen run this for full schema details:");
        console.log("─".repeat(80));
        console.log(`
SELECT
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;
        `);
        console.log("─".repeat(80));
      }
    } else {
      console.log("✅ Tables found:");
      console.table(data);
    }
  } catch (e) {
    console.log("❌ Exception:", e.message);
    console.log("\n📋 MANUAL QUERY NEEDED:\n");
    console.log("Visit: https://supabase.com/dashboard/project/kfxetwuuzljhybfgmpuc/sql\n");
    console.log("Run these queries to see your schema:\n");
    console.log("1. All tables and column counts:");
    console.log("─".repeat(80));
    console.log(`
SELECT
  table_name,
  COUNT(*) as column_count
FROM information_schema.columns
WHERE table_schema = 'public'
GROUP BY table_name
ORDER BY table_name;
    `);
    console.log("─".repeat(80));

    console.log("\n2. Full schema for crawler-related tables:");
    console.log("─".repeat(80));
    console.log(`
SELECT
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN (
    'siam_vectors',
    'aoma_knowledge',
    'confluence_knowledge',
    'alexandria_knowledge',
    'jira_issues',
    'firecrawl_analysis',
    'test_knowledge_base'
  )
ORDER BY table_name, ordinal_position;
    `);
    console.log("─".repeat(80));

    console.log("\n3. Check for RPC functions:");
    console.log("─".repeat(80));
    console.log(`
SELECT
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name LIKE '%aoma%'
ORDER BY routine_name;
    `);
    console.log("─".repeat(80));
  }
}

getSchemaViaSQL()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("\n❌ Fatal error:", err);
    process.exit(1);
  });
