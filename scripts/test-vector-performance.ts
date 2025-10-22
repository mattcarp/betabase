#!/usr/bin/env tsx

/**
 * Vector Search Performance Testing Script
 * Compares IVFFlat vs HNSW index performance
 * Run: npx tsx scripts/test-vector-performance.ts
 */

import { config } from "dotenv";
import SupabaseVectorService from "../src/services/supabaseVectorService";
import OptimizedSupabaseVectorService from "../src/services/optimizedSupabaseVectorService";

// Load environment variables
config();

// Test queries representing different use cases
const TEST_QUERIES = [
  "How do I configure authentication in AOMA?",
  "Database connection pooling best practices",
  "Error handling in production systems",
  "Performance optimization techniques",
  "User management and permissions",
  "API rate limiting implementation",
  "Caching strategies for better performance",
  "Security vulnerabilities and fixes",
  "Deployment process documentation",
  "System monitoring and alerting",
];

async function measurePerformance(name: string, searchFn: () => Promise<any>): Promise<number> {
  const start = performance.now();
  await searchFn();
  const end = performance.now();
  const duration = end - start;
  console.log(`${name}: ${duration.toFixed(2)}ms`);
  return duration;
}

async function runPerformanceTests() {
  console.log("🚀 Vector Search Performance Testing\n");
  console.log("=".repeat(50));

  const standardService = new SupabaseVectorService();
  const optimizedService = new OptimizedSupabaseVectorService();

  // Warm up caches
  console.log("⏳ Warming up caches...");
  await optimizedService.warmUpCache();
  console.log("✅ Cache warmed up\n");

  console.log("=".repeat(50));
  console.log("Running performance comparisons...\n");

  const results = {
    standard: [] as number[],
    optimizedFast: [] as number[],
    optimizedSmart: [] as number[],
  };

  for (const query of TEST_QUERIES) {
    console.log(`\n📝 Query: "${query.substring(0, 40)}..."`);
    console.log("-".repeat(40));

    // Test standard implementation
    const standardTime = await measurePerformance("  Standard (IVFFlat)", () =>
      standardService.searchVectors(query, { matchCount: 10 })
    );
    results.standard.push(standardTime);

    // Test optimized fast search
    const fastTime = await measurePerformance("  Optimized Fast (HNSW)", () =>
      optimizedService.searchVectorsFast(query, { matchCount: 10 })
    );
    results.optimizedFast.push(fastTime);

    // Test smart search
    const smartTime = await measurePerformance("  Smart Search (Auto)", () =>
      optimizedService.smartSearch(query, { matchCount: 10, mode: "auto" })
    );
    results.optimizedSmart.push(smartTime);

    // Small delay between queries
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  // Calculate statistics
  console.log("\n" + "=".repeat(50));
  console.log("📊 Performance Summary\n");

  const calculateStats = (times: number[]) => ({
    avg: times.reduce((a, b) => a + b, 0) / times.length,
    min: Math.min(...times),
    max: Math.max(...times),
    median: times.sort((a, b) => a - b)[Math.floor(times.length / 2)],
  });

  const standardStats = calculateStats(results.standard);
  const fastStats = calculateStats(results.optimizedFast);
  const smartStats = calculateStats(results.optimizedSmart);

  console.log("Standard Search (IVFFlat):");
  console.log(`  Average: ${standardStats.avg.toFixed(2)}ms`);
  console.log(`  Median:  ${standardStats.median.toFixed(2)}ms`);
  console.log(`  Range:   ${standardStats.min.toFixed(2)}ms - ${standardStats.max.toFixed(2)}ms`);

  console.log("\nOptimized Fast Search (HNSW):");
  console.log(`  Average: ${fastStats.avg.toFixed(2)}ms`);
  console.log(`  Median:  ${fastStats.median.toFixed(2)}ms`);
  console.log(`  Range:   ${fastStats.min.toFixed(2)}ms - ${fastStats.max.toFixed(2)}ms`);

  console.log("\nSmart Search (Auto-select):");
  console.log(`  Average: ${smartStats.avg.toFixed(2)}ms`);
  console.log(`  Median:  ${smartStats.median.toFixed(2)}ms`);
  console.log(`  Range:   ${smartStats.min.toFixed(2)}ms - ${smartStats.max.toFixed(2)}ms`);

  // Calculate improvement
  const improvement = (((standardStats.avg - fastStats.avg) / standardStats.avg) * 100).toFixed(1);
  console.log("\n" + "=".repeat(50));
  console.log(`🎯 Performance Improvement: ${improvement}% faster with HNSW!`);

  if (fastStats.avg < 20) {
    console.log("✅ Excellent! Sub-20ms average response time achieved!");
  } else if (fastStats.avg < 50) {
    console.log("👍 Good performance! Most queries under 50ms.");
  } else {
    console.log("⚠️  Consider further optimization for better performance.");
  }

  // Test batch search
  console.log("\n" + "=".repeat(50));
  console.log("Testing Batch Search Performance...\n");

  const batchStart = performance.now();
  const batchResults = await optimizedService.batchSearch(TEST_QUERIES.slice(0, 5), {
    matchCount: 5,
    mode: "fast",
  });
  const batchEnd = performance.now();
  const batchTime = batchEnd - batchStart;

  console.log(`Batch search (5 queries): ${batchTime.toFixed(2)}ms`);
  console.log(`Average per query: ${(batchTime / 5).toFixed(2)}ms`);

  // Check index performance
  console.log("\n" + "=".repeat(50));
  console.log("Checking Index Usage Statistics...\n");

  try {
    const indexStats = await optimizedService.checkIndexPerformance();
    if (indexStats && indexStats.length > 0) {
      console.log("Index Performance Metrics:");
      indexStats.forEach((stat: any) => {
        console.log(`  ${stat.index_name}:`);
        console.log(`    Size: ${stat.index_size}`);
        console.log(`    Scans: ${stat.index_scans}`);
        console.log(`    Avg tuples per scan: ${stat.avg_tuples_per_scan}`);
      });
    }
  } catch (error) {
    console.log("Note: Index performance metrics not available (migration may be needed)");
  }

  console.log("\n" + "=".repeat(50));
  console.log("✨ Performance testing complete!");
}

// Run the tests
runPerformanceTests()
  .then(() => {
    console.log("\n👋 Exiting...");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Error during testing:", error);
    process.exit(1);
  });
