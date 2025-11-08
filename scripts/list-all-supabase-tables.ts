#!/usr/bin/env tsx

/**
 * List ALL tables in the Supabase database
 * This will show us what tables actually exist
 */

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

// Load environment variables from .env.local
config({ path: ".env.local" });

async function listAllTables() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Missing Supabase credentials");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log("🔍 Discovering ALL Tables in Supabase Database...\n");
  console.log("=".repeat(60));

  try {
    // Query the information schema to get all tables
    const { data: tables, error } = await supabase
      .from("information_schema.tables")
      .select("table_schema, table_name")
      .in("table_schema", ["public", "storage", "auth"])
      .eq("table_type", "BASE TABLE")
      .order("table_schema", { ascending: true })
      .order("table_name", { ascending: true });

    if (error) {
      // Fallback: Try to query pg_tables directly
      console.log("⚠️  Cannot query information_schema, trying alternative method...\n");

      // Try known table names that might contain vectors
      const knownTables = [
        "documents",
        "embeddings",
        "vectors",
        "vector_store",
        "knowledge_base",
        "aoma_vectors",
        "siam_vectors",
        "openai_vectors",
        "firecrawl_analysis",
        "test_results",
        "test_knowledge_base",
        "cache_entries",
        "cached_responses",
      ];

      console.log("Checking known table names for vector data:\n");

      for (const tableName of knownTables) {
        try {
          const { count, error: tableError } = await supabase
            .from(tableName)
            .select("*", { count: "exact", head: true });

          if (!tableError) {
            console.log(`✅ ${tableName}: ${count?.toLocaleString() || 0} rows`);

            // Try to get column info
            const { data: sample, error: sampleError } = await supabase
              .from(tableName)
              .select("*")
              .limit(1);

            if (!sampleError && sample && sample.length > 0) {
              const columns = Object.keys(sample[0]);
              const vectorColumns = columns.filter(
                (col) => col.includes("embedding") || col.includes("vector") || col === "vec"
              );

              if (vectorColumns.length > 0) {
                console.log(`   📌 Vector columns found: ${vectorColumns.join(", ")}`);
              }
            }
          }
        } catch (e) {
          // Table doesn't exist, skip silently
        }
      }
    } else if (tables) {
      console.log(`Found ${tables.length} tables:\n`);

      let currentSchema = "";
      for (const table of tables) {
        if (table.table_schema !== currentSchema) {
          currentSchema = table.table_schema;
          console.log(`\n📂 Schema: ${currentSchema}`);
          console.log("-".repeat(40));
        }
        console.log(`  ${table.table_name}`);
      }
    }

    // Now check each public table for row counts and vector columns
    console.log("\n" + "=".repeat(60));
    console.log("📊 Checking Tables for Vector Data...\n");

    // More comprehensive list of tables to check
    const tablesToCheck = [
      "documents",
      "embeddings",
      "vectors",
      "vector_store",
      "knowledge_base",
      "aoma_vectors",
      "siam_vectors",
      "openai_vectors",
      "firecrawl_analysis",
      "test_results",
      "test_knowledge_base",
      "cache_entries",
      "cached_responses",
      "messages",
      "conversations",
      "content",
      "files",
      "uploads",
    ];

    let vectorTablesFound = [];

    for (const tableName of tablesToCheck) {
      try {
        const {
          data: sample,
          count,
          error,
        } = await supabase.from(tableName).select("*", { count: "exact" }).limit(1);

        if (!error && count !== null) {
          console.log(`\n📋 Table: ${tableName}`);
          console.log(`   Rows: ${count.toLocaleString()}`);

          if (sample && sample.length > 0) {
            const columns = Object.keys(sample[0]);
            console.log(
              `   Columns: ${columns.slice(0, 5).join(", ")}${columns.length > 5 ? "..." : ""}`
            );

            // Check for vector/embedding columns
            const vectorColumns = columns.filter((col) => {
              const colLower = col.toLowerCase();
              return (
                colLower.includes("embedding") ||
                colLower.includes("vector") ||
                colLower === "vec" ||
                colLower.includes("embed")
              );
            });

            if (vectorColumns.length > 0) {
              console.log(`   🎯 VECTOR COLUMNS FOUND: ${vectorColumns.join(", ")}`);
              vectorTablesFound.push({ table: tableName, count, columns: vectorColumns });

              // Check if it's actually a vector
              const vecCol = vectorColumns[0];
              if (sample[0][vecCol] && Array.isArray(sample[0][vecCol])) {
                console.log(`   📏 Vector dimension: ${sample[0][vecCol].length}`);
              }
            }
          }
        }
      } catch (e) {
        // Table doesn't exist, continue
      }
    }

    // Summary
    console.log("\n" + "=".repeat(60));
    console.log("📈 VECTOR STORAGE SUMMARY\n");

    if (vectorTablesFound.length > 0) {
      console.log("✅ Found vector data in these tables:");
      let totalVectors = 0;

      vectorTablesFound.forEach((vt) => {
        console.log(`   • ${vt.table}: ${vt.count.toLocaleString()} vectors`);
        console.log(`     Columns: ${vt.columns.join(", ")}`);
        totalVectors += vt.count;
      });

      console.log(`\n   📊 TOTAL VECTORS: ${totalVectors.toLocaleString()}`);
    } else {
      console.log("❌ No vector tables found with data");
    }
  } catch (error) {
    console.error("❌ Error listing tables:", error);
  }
}

// Run the check
listAllTables()
  .then(() => {
    console.log("\n✨ Discovery complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });
