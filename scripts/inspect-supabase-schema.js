#!/usr/bin/env node

/**
 * Comprehensive Supabase Schema Inspector
 * Checks for Firecrawl v2 compatibility and all table structures
 */

const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function inspectSchema() {
  console.log("🔍 COMPREHENSIVE SUPABASE SCHEMA INSPECTION\n");
  console.log("═".repeat(80));

  // 1. Check all tables
  console.log("\n📊 CHECKING ALL TABLES:\n");

  const tables = [
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
  ];

  const tableInfo = {};

  for (const table of tables) {
    try {
      // Get count
      const { count, error: countError } = await supabase
        .from(table)
        .select("*", { count: "exact", head: true });

      if (countError) {
        console.log(`   ❌ ${table}: NOT FOUND`);
        tableInfo[table] = { exists: false };
        continue;
      }

      // Get sample row to see structure
      const { data: sample, error: sampleError } = await supabase.from(table).select("*").limit(1);

      const columns = sample && sample[0] ? Object.keys(sample[0]) : [];

      console.log(`   ✅ ${table}:`);
      console.log(`      Rows: ${count || 0}`);
      console.log(`      Columns: ${columns.length}`);
      if (columns.length > 0 && columns.length < 20) {
        console.log(`      Schema: ${columns.join(", ")}`);
      }

      tableInfo[table] = {
        exists: true,
        count: count || 0,
        columns,
        sample: sample?.[0],
      };
    } catch (e) {
      console.log(`   ❌ ${table}: ERROR - ${e.message}`);
      tableInfo[table] = { exists: false, error: e.message };
    }
  }

  // 2. Check for Firecrawl v2 compatibility
  console.log("\n" + "═".repeat(80));
  console.log("\n🔥 FIRECRAWL V2 COMPATIBILITY CHECK:\n");

  if (tableInfo.firecrawl_analysis?.exists) {
    const cols = tableInfo.firecrawl_analysis.columns;
    const firecrawlV2Fields = [
      "url",
      "page_title",
      "ui_elements",
      "selectors",
      "navigation_paths",
      "testable_features",
      "metadata",
    ];

    console.log("   Checking firecrawl_analysis table...");
    firecrawlV2Fields.forEach((field) => {
      const has = cols.includes(field);
      console.log(`   ${has ? "✅" : "❌"} ${field}`);
    });
  }

  if (tableInfo.siam_vectors?.exists) {
    const cols = tableInfo.siam_vectors.columns;
    const requiredFields = [
      "id",
      "content",
      "embedding",
      "source_type",
      "source_id",
      "metadata",
      "created_at",
      "updated_at",
    ];

    console.log("\n   Checking siam_vectors table...");
    requiredFields.forEach((field) => {
      const has = cols.includes(field);
      console.log(`   ${has ? "✅" : "❌"} ${field}`);
    });
  }

  // 3. Check RPC functions
  console.log("\n" + "═".repeat(80));
  console.log("\n🔧 CHECKING RPC FUNCTIONS:\n");

  const rpcFunctions = ["match_aoma_vectors", "match_aoma_vectors_fast", "upsert_aoma_vector"];

  for (const func of rpcFunctions) {
    try {
      const { data, error } = await supabase.rpc(func, {
        query_embedding: new Array(1536).fill(0),
        match_count: 1,
        match_threshold: 0.5,
      });

      if (error) {
        if (error.message.includes("not found") || error.code === "42883") {
          console.log(`   ❌ ${func}: NOT FOUND`);
        } else {
          console.log(`   ⚠️  ${func}: EXISTS (error: ${error.message.substring(0, 50)}...)`);
        }
      } else {
        console.log(`   ✅ ${func}: EXISTS AND WORKING`);
      }
    } catch (e) {
      console.log(`   ❌ ${func}: NOT FOUND`);
    }
  }

  // 4. Check for vector extension
  console.log("\n" + "═".repeat(80));
  console.log("\n🧬 CHECKING PGVECTOR EXTENSION:\n");

  try {
    // Try to query a table with vector column
    const { error } = await supabase.from("siam_vectors").select("embedding").limit(1);

    if (!error) {
      console.log("   ✅ pgvector extension: ENABLED");
      console.log("   ✅ Vector columns: WORKING");
    } else {
      console.log("   ❌ pgvector extension: ISSUE");
      console.log(`      Error: ${error.message}`);
    }
  } catch (e) {
    console.log("   ⚠️  Could not verify pgvector");
  }

  // 5. Summary
  console.log("\n" + "═".repeat(80));
  console.log("\n📋 SUMMARY:\n");

  const existing = Object.entries(tableInfo).filter(([_, info]) => info.exists);
  const withData = existing.filter(([_, info]) => info.count > 0);

  console.log(`   Total tables checked: ${tables.length}`);
  console.log(`   Tables existing: ${existing.length}`);
  console.log(`   Tables with data: ${withData.length}`);
  console.log(`   Total rows: ${existing.reduce((sum, [_, info]) => sum + (info.count || 0), 0)}`);

  if (withData.length > 0) {
    console.log("\n   📦 Tables with content:");
    withData.forEach(([name, info]) => {
      console.log(`      ${name}: ${info.count} rows`);
    });
  }

  // 6. Recommendations
  console.log("\n" + "═".repeat(80));
  console.log("\n💡 RECOMMENDATIONS:\n");

  if (!tableInfo.siam_vectors?.exists) {
    console.log("   ⚠️  Run migration: supabase/migrations/001_aoma_vector_store_optimized.sql");
  }

  if (!tableInfo.firecrawl_analysis?.exists) {
    console.log("   ⚠️  Create firecrawl_analysis table for Firecrawl v2 integration");
  }

  if (tableInfo.siam_vectors?.count === 0) {
    console.log("   📝 Database is empty - ready for first crawl!");
  }

  const missingRPC = [];
  for (const func of rpcFunctions) {
    try {
      await supabase.rpc(func, { query_embedding: [], match_count: 1 });
    } catch {
      missingRPC.push(func);
    }
  }

  if (missingRPC.length > 0) {
    console.log(`   ⚠️  Deploy RPC functions: ${missingRPC.join(", ")}`);
  }

  console.log("\n" + "═".repeat(80));
  console.log("\n✨ Inspection complete!\n");

  return tableInfo;
}

inspectSchema()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("\n❌ Error:", err.message);
    process.exit(1);
  });
