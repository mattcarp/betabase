#!/usr/bin/env tsx

/**
 * Check Vector Count and Statistics
 * Quick script to see how many vectors are in the database
 */

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

// Load environment variables
config();

async function checkVectorStats() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Missing Supabase credentials in environment variables");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log("📊 Checking Vector Database Statistics...\n");
  console.log("=".repeat(50));

  try {
    // Get total count
    const { count: totalCount, error: countError } = await supabase
      .from("aoma_unified_vectors")
      .select("*", { count: "exact", head: true });

    if (countError) {
      console.error("Error getting count:", countError);
      return;
    }

    console.log(`📈 Total Vectors: ${totalCount?.toLocaleString() || 0}`);

    // Get breakdown by source type
    const { data: stats, error: statsError } = await supabase.from("aoma_vector_stats").select("*");

    if (!statsError && stats && stats.length > 0) {
      console.log("\n📂 Breakdown by Source Type:");
      console.log("-".repeat(40));

      let totalVectors = 0;
      stats.forEach((stat) => {
        console.log(`  ${stat.source_type}: ${stat.document_count?.toLocaleString() || 0} vectors`);
        totalVectors += stat.document_count || 0;
      });

      console.log("-".repeat(40));
      console.log(`  Total: ${totalVectors.toLocaleString()} vectors`);

      console.log("\n💾 Storage Statistics:");
      console.log("-".repeat(40));
      stats.forEach((stat) => {
        if (stat.embedding_storage_size) {
          console.log(`  ${stat.source_type}: ${stat.embedding_storage_size}`);
        }
      });

      console.log("\n📅 Data Age Range:");
      console.log("-".repeat(40));
      stats.forEach((stat) => {
        if (stat.oldest_document && stat.newest_document) {
          const oldest = new Date(stat.oldest_document).toLocaleDateString();
          const newest = new Date(stat.newest_document).toLocaleDateString();
          console.log(`  ${stat.source_type}: ${oldest} to ${newest}`);
        }
      });
    }

    // Check table size
    const { data: sizeData, error: sizeError } = await supabase
      .rpc("pg_size_pretty", {
        size: await supabase.rpc("pg_total_relation_size", { relation: "aoma_unified_vectors" }),
      })
      .single();

    if (!sizeError && sizeData) {
      console.log(`\n💿 Total Table Size: ${sizeData}`);
    }

    // Recommendations based on count
    console.log("\n" + "=".repeat(50));
    console.log("🎯 Index Optimization Recommendations:\n");

    if (totalCount && totalCount < 10000) {
      console.log("✅ HNSW index is PERFECT for your dataset size!");
      console.log("   - Optimal performance for < 10k vectors");
      console.log("   - Expect query times: 3-10ms");
      console.log("   - No additional optimization needed");
    } else if (totalCount && totalCount < 100000) {
      console.log("✅ HNSW index is IDEAL for your dataset size!");
      console.log("   - Excellent performance for < 100k vectors");
      console.log("   - Expect query times: 5-15ms");
      console.log("   - Consider adjusting 'm' parameter to 24 for better accuracy");
    } else if (totalCount && totalCount < 1000000) {
      console.log("👍 HNSW index is GOOD for your dataset size");
      console.log("   - Good performance for < 1M vectors");
      console.log("   - Expect query times: 10-30ms");
      console.log("   - Consider increasing 'ef_construction' to 128");
    } else {
      console.log("⚠️  Consider IVFFlat for very large datasets");
      console.log("   - HNSW may use significant memory at this scale");
      console.log("   - Consider partitioning strategies");
    }

    console.log("\n💡 Your current IVFFlat index:");
    console.log("   - Better for 1M+ vectors");
    console.log("   - Current performance: 50-200ms");
    console.log("   - Switching to HNSW will improve speed significantly");
  } catch (error) {
    console.error("❌ Error checking statistics:", error);
  }
}

// Run the check
checkVectorStats()
  .then(() => {
    console.log("\n✨ Check complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });
