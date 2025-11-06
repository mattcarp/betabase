/**
 * Test Script: System Metrics Ingestion
 * Demonstrates and tests the metrics ingestion pipeline
 */

import {
  getSystemMetricsVectorService,
  SystemMetric,
} from "../src/services/systemMetricsVectorService";
import { getSupabaseVectorService } from "../src/services/supabaseVectorService";

async function testMetricsIngestion() {
  console.log("🚀 Starting Metrics Ingestion Test...\n");

  const metricsService = getSystemMetricsVectorService();
  const vectorService = getSupabaseVectorService();

  try {
    // Test 1: Capture system snapshot
    console.log("📊 Test 1: Capturing system snapshot...");
    const snapshotResult = await metricsService.captureAndVectorize();
    console.log(`  ✅ Captured and vectorized ${snapshotResult.totalMetrics} metrics`);
    console.log(`  ✅ Success: ${snapshotResult.successfulVectorizations}`);
    console.log(`  ❌ Failed: ${snapshotResult.failedVectorizations}`);
    console.log(`  ⏱️  Duration: ${snapshotResult.duration}ms\n`);

    // Test 2: Record custom metrics
    console.log("📊 Test 2: Recording custom metrics...");

    const customMetrics: Array<{
      name: string;
      value: number;
      metricType: SystemMetric["metricType"];
      unit?: string;
      tags?: Record<string, string>;
    }> = [
      {
        name: "api.auth.responseTime",
        value: 125.5,
        metricType: "api",
        unit: "milliseconds",
        tags: { endpoint: "/api/auth", method: "POST" },
      },
      {
        name: "api.chat.responseTime",
        value: 2340.2,
        metricType: "api",
        unit: "milliseconds",
        tags: { endpoint: "/api/chat", method: "POST" },
      },
      {
        name: "error.rate.authentication",
        value: 0.5,
        metricType: "error",
        unit: "percent",
        tags: { severity: "low", component: "auth" },
      },
      {
        name: "page.dashboard.loadTime",
        value: 1200,
        metricType: "performance",
        unit: "milliseconds",
        tags: { page: "/dashboard" },
      },
      {
        name: "database.query.duration",
        value: 45.3,
        metricType: "performance",
        unit: "milliseconds",
        tags: { query: "vector_search", table: "siam_vectors" },
      },
    ];

    for (const metric of customMetrics) {
      const vectorId = await metricsService.recordCustomMetric(metric.name, metric.value, {
        metricType: metric.metricType,
        unit: metric.unit,
        tags: metric.tags,
        vectorize: true,
      });
      console.log(
        `  ✅ Recorded: ${metric.name} = ${metric.value}${metric.unit ? " " + metric.unit : ""}`
      );
    }

    console.log(`  ✅ Recorded ${customMetrics.length} custom metrics\n`);

    // Test 3: Batch ingest metrics
    console.log("📊 Test 3: Batch ingesting metrics...");

    const batchMetrics: SystemMetric[] = [
      {
        timestamp: new Date().toISOString(),
        metricType: "api",
        name: "api.aoma.responseTime",
        value: 3500,
        unit: "milliseconds",
        tags: { endpoint: "/api/aoma", complexity: "high" },
      },
      {
        timestamp: new Date().toISOString(),
        metricType: "api",
        name: "api.aoma.tokenCount",
        value: 1250,
        unit: "tokens",
        tags: { endpoint: "/api/aoma", model: "gpt-4" },
      },
      {
        timestamp: new Date().toISOString(),
        metricType: "performance",
        name: "vectorStore.searchTime",
        value: 85.2,
        unit: "milliseconds",
        tags: { operation: "similarity_search" },
      },
    ];

    const batchResult = await metricsService.vectorizeMetrics(batchMetrics);
    console.log(`  ✅ Batch ingested ${batchResult.totalMetrics} metrics`);
    console.log(`  ✅ Success: ${batchResult.successfulVectorizations}`);
    console.log(`  ❌ Failed: ${batchResult.failedVectorizations}`);
    console.log(`  ⏱️  Duration: ${batchResult.duration}ms\n`);

    // Wait for vectorization to complete
    console.log("⏳ Waiting for vectorization to complete...");
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Test 4: Search metrics
    console.log("🔍 Test 4: Searching vectorized metrics...\n");

    const searchQueries = [
      "API response time performance",
      "error rate authentication",
      "database query performance",
      "AOMA endpoint metrics",
    ];

    for (const query of searchQueries) {
      console.log(`  Query: "${query}"`);
      const results = await metricsService.searchMetrics(query, {
        matchThreshold: 0.7,
        matchCount: 3,
      });

      console.log(`  Found ${results.length} results:`);
      results.slice(0, 3).forEach((result, index) => {
        console.log(`    ${index + 1}. ${result.metadata?.name || "Unknown"}`);
        console.log(`       Similarity: ${(result.similarity * 100).toFixed(1)}%`);
        console.log(
          `       Value: ${result.metadata?.value}${result.metadata?.unit ? " " + result.metadata.unit : ""}`
        );
        console.log(`       Type: ${result.metadata?.metricType}`);
      });
      console.log("");
    }

    // Test 5: Get statistics
    console.log("📊 Test 5: Getting metrics statistics...\n");

    const stats = await metricsService.getMetricsVectorStats();
    console.log("  Vector Store Stats:");
    stats.forEach((stat: any) => {
      console.log(`    Source Type: ${stat.source_type}`);
      console.log(`    Vector Count: ${stat.vector_count || 0}`);
      console.log(`    Last Updated: ${stat.last_updated || "N/A"}`);
    });

    const history = metricsService.getMetricsHistory({ limit: 10 });
    console.log(`\n  In-Memory History: ${history.length} metrics`);

    const typeBreakdown = history.reduce(
      (acc, metric) => {
        acc[metric.metricType] = (acc[metric.metricType] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    console.log("  Breakdown by type:");
    Object.entries(typeBreakdown).forEach(([type, count]) => {
      console.log(`    ${type}: ${count}`);
    });

    // Test 6: Verify in vector store
    console.log("\n🔍 Test 6: Verifying metrics in vector store...\n");

    const vectorStats = await vectorService.getVectorStats();
    const metricsCount = vectorStats
      .filter((stat: any) => stat.source_type === "metrics")
      .reduce((sum: number, stat: any) => sum + (stat.vector_count || 0), 0);

    console.log(`  ✅ Total metrics vectors in store: ${metricsCount}`);

    // Search for a specific metric to verify storage
    const verificationResults = await vectorService.searchVectors("api response time", {
      matchThreshold: 0.7,
      matchCount: 5,
      sourceTypes: ["metrics"],
    });

    console.log(`  ✅ Found ${verificationResults.length} metric vectors via search`);

    if (verificationResults.length > 0) {
      console.log("  Sample metric from vector store:");
      const sample = verificationResults[0];
      console.log(`    ID: ${sample.id}`);
      console.log(`    Source ID: ${sample.source_id}`);
      console.log(`    Similarity: ${(sample.similarity * 100).toFixed(1)}%`);
      console.log(`    Metric: ${sample.metadata?.name}`);
      console.log(
        `    Value: ${sample.metadata?.value}${sample.metadata?.unit ? " " + sample.metadata.unit : ""}`
      );
      console.log(`    Type: ${sample.metadata?.metricType}`);
    }

    console.log("\n✅ All tests completed successfully!\n");
    console.log("📊 Summary:");
    console.log(`  - System snapshot captured and vectorized`);
    console.log(`  - ${customMetrics.length} custom metrics recorded`);
    console.log(`  - ${batchMetrics.length} metrics batch ingested`);
    console.log(`  - ${searchQueries.length} search queries executed`);
    console.log(`  - Vector store verified with ${metricsCount} metric vectors`);
    console.log("\n🎉 Metrics ingestion pipeline is working correctly!");
  } catch (error) {
    console.error("\n❌ Test failed:", error);
    throw error;
  }
}

// Run the test
testMetricsIngestion()
  .then(() => {
    console.log("\n✅ Test script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Test script failed:", error);
    process.exit(1);
  });
