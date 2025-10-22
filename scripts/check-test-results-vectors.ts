#!/usr/bin/env tsx

/**
 * Check the test_results table and its vector configuration
 */

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

// Load environment variables from .env.local
config({ path: ".env.local" });

async function checkTestResultsVectors() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Missing Supabase credentials");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log("🔍 Analyzing test_results Table Vector Configuration...\n");
  console.log("=".repeat(60));

  try {
    // Get sample data from test_results
    const { data: samples, error } = await supabase.from("test_results").select("*").limit(3);

    if (error) {
      console.error("Error fetching test_results:", error);
      return;
    }

    if (samples && samples.length > 0) {
      console.log(`📊 Found ${samples.length} sample records\n`);

      // Check embedding column
      const firstSample = samples[0];
      if (firstSample.embedding) {
        console.log("✅ Embedding column exists!");

        if (Array.isArray(firstSample.embedding)) {
          console.log(`📏 Vector dimension: ${firstSample.embedding.length}`);
          console.log(
            `📝 Sample vector (first 5 values): [${firstSample.embedding.slice(0, 5).join(", ")}...]`
          );
        } else if (firstSample.embedding === null) {
          console.log("⚠️  Embedding column exists but is NULL");
        } else {
          console.log(`❓ Embedding type: ${typeof firstSample.embedding}`);
        }
      } else {
        console.log("❌ No embedding column found");
      }

      // Count non-null embeddings
      const { count: totalCount } = await supabase
        .from("test_results")
        .select("*", { count: "exact", head: true });

      const { count: embeddingCount } = await supabase
        .from("test_results")
        .select("*", { count: "exact", head: true })
        .not("embedding", "is", null);

      console.log(`\n📈 Vector Statistics:`);
      console.log(`   Total rows: ${totalCount}`);
      console.log(`   Rows with embeddings: ${embeddingCount || 0}`);
      console.log(`   Rows without embeddings: ${(totalCount || 0) - (embeddingCount || 0)}`);
    }

    // Check indexes on this table
    console.log("\n" + "=".repeat(60));
    console.log("🔍 Checking Indexes on test_results...\n");

    // Try to get index information
    const { data: indexes, error: indexError } = await supabase
      .rpc("get_indexes", { table_name: "test_results" })
      .select("*");

    if (!indexError && indexes) {
      console.log("Indexes found:");
      indexes.forEach((idx: any) => {
        console.log(`   • ${idx.indexname}`);
      });
    } else {
      console.log("Could not retrieve index information");
    }

    // Check if pgvector is being used
    console.log("\n" + "=".repeat(60));
    console.log("🔍 Checking Vector Index Type...\n");

    // Look for vector similarity functions
    const similarityFunctions = ["match_test_results", "search_test_results", "similarity_search"];

    for (const funcName of similarityFunctions) {
      try {
        const { data, error } = await supabase.rpc(funcName, {
          query_embedding: new Array(1536).fill(0),
          match_count: 1,
        });

        if (!error) {
          console.log(`✅ Found vector search function: ${funcName}`);
        }
      } catch (e) {
        // Function doesn't exist
      }
    }
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

// Run the check
checkTestResultsVectors()
  .then(() => {
    console.log("\n✨ Analysis complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });
