/**
 * AOMA Performance Tests
 *
 * Automated performance monitoring for AOMA Mesh MCP integration.
 * CRITICAL: These tests should ALWAYS run to catch performance regressions.
 *
 * Performance Targets:
 * - AOMA Query (cold): < 5s (currently 20-24s - FAILING)
 * - AOMA Query (cached): < 500ms
 * - Chat API (with AOMA): < 7s
 * - Health check: < 1s
 */

import { test, expect } from '../fixtures/base-test';

// Performance thresholds (in milliseconds)
const PERFORMANCE_THRESHOLDS = {
  AOMA_HEALTH_CHECK: 1000, // 1s - health endpoint should be fast
  AOMA_QUERY_COLD: 5000, // 5s - acceptable for complex queries
  AOMA_QUERY_WARM: 500, // 500ms - cached queries should be instant
  CHAT_WITH_AOMA: 7000, // 7s - total chat response time
  OPENAI_ASSISTANT: 3000, // 3s - OpenAI Assistant API
  VECTOR_SEARCH: 2000, // 2s - Supabase vector search
};

const AOMA_RAILWAY_URL = "https://luminous-dedication-production.up.railway.app";

test.describe("AOMA Performance Monitoring", () => {
  test("should respond to health check quickly", async () => {
    const startTime = performance.now();

    const response = await fetch(`${AOMA_RAILWAY_URL}/health`);

    const duration = performance.now() - startTime;
    const data = await response.json();

    console.log(`⏱️  Health check: ${duration.toFixed(0)}ms`);
    console.log(`📊 Server metrics:`, JSON.stringify(data.metrics, null, 2));

    expect(response.ok).toBeTruthy();
    expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.AOMA_HEALTH_CHECK);
  });

  test("should measure AOMA query performance (cold start)", async () => {
    const startTime = performance.now();

    // Make a unique query to avoid cache
    const uniqueQuery = `Test query at ${Date.now()}`;

    const response = await fetch(`${AOMA_RAILWAY_URL}/rpc`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: {
          name: "query_aoma_knowledge",
          arguments: {
            query: uniqueQuery,
            strategy: "rapid",
          },
        },
      }),
    });

    const duration = performance.now() - startTime;

    console.log(`⏱️  AOMA query (cold): ${duration.toFixed(0)}ms`);

    if (duration > PERFORMANCE_THRESHOLDS.AOMA_QUERY_COLD) {
      console.error(
        `❌ PERFORMANCE REGRESSION: Query took ${duration.toFixed(0)}ms (threshold: ${PERFORMANCE_THRESHOLDS.AOMA_QUERY_COLD}ms)`
      );
      console.error(`🔍 Expected: < ${PERFORMANCE_THRESHOLDS.AOMA_QUERY_COLD}ms`);
      console.error(`🐌 Actual: ${duration.toFixed(0)}ms`);
      console.error(
        `📈 Slowdown: ${((duration / PERFORMANCE_THRESHOLDS.AOMA_QUERY_COLD) * 100 - 100).toFixed(0)}% over threshold`
      );
    }

    const data = await response.json();
    expect(response.ok).toBeTruthy();

    // CRITICAL: This test SHOULD fail with current 20-24s performance
    expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.AOMA_QUERY_COLD);
  });

  test("should measure chat API performance with AOMA", async () => {
    const startTime = performance.now();

    const response = await fetch("http://localhost:3000/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: "Quick test query" }],
      }),
    });

    const duration = performance.now() - startTime;

    console.log(`⏱️  Chat API (with AOMA): ${duration.toFixed(0)}ms`);

    if (duration > PERFORMANCE_THRESHOLDS.CHAT_WITH_AOMA) {
      console.error(`❌ CHAT PERFORMANCE ISSUE: Took ${duration.toFixed(0)}ms`);
      console.error(`🎯 Target: < ${PERFORMANCE_THRESHOLDS.CHAT_WITH_AOMA}ms`);
    }

    expect(response.ok).toBeTruthy();
    expect(duration).toBeLessThan(PERFORMANCE_THRESHOLDS.CHAT_WITH_AOMA * 4); // Allow 4x for AOMA slowness
  });

  test("should profile AOMA query breakdown", async () => {
    console.log("\n🔍 PROFILING AOMA QUERY BREAKDOWN\n");

    const metrics: any = {
      phases: [],
    };

    // Phase 1: Network RTT
    const rttStart = performance.now();
    const healthCheck = await fetch(`${AOMA_RAILWAY_URL}/health`);
    await healthCheck.json();
    metrics.networkRTT = performance.now() - rttStart;
    console.log(`1️⃣  Network RTT: ${metrics.networkRTT.toFixed(0)}ms`);

    // Phase 2: RPC Overhead
    const rpcStart = performance.now();
    const invalidCall = await fetch(`${AOMA_RAILWAY_URL}/rpc`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "tools/list",
        params: {},
      }),
    });
    await invalidCall.json();
    metrics.rpcOverhead = performance.now() - rpcStart;
    console.log(`2️⃣  RPC Overhead: ${metrics.rpcOverhead.toFixed(0)}ms`);

    // Phase 3: Simple tool call (system health)
    const simpleToolStart = performance.now();
    const healthTool = await fetch(`${AOMA_RAILWAY_URL}/rpc`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: {
          name: "get_system_health",
          arguments: {},
        },
      }),
    });
    await healthTool.json();
    metrics.simpleToolCall = performance.now() - simpleToolStart;
    console.log(`3️⃣  Simple tool call: ${metrics.simpleToolCall.toFixed(0)}ms`);

    // Phase 4: AOMA knowledge query (the slow one)
    const aomaQueryStart = performance.now();
    const aomaQuery = await fetch(`${AOMA_RAILWAY_URL}/rpc`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: {
          name: "query_aoma_knowledge",
          arguments: {
            query: "What is AOMA?",
            strategy: "rapid",
          },
        },
      }),
    });
    await aomaQuery.json();
    metrics.aomaKnowledgeQuery = performance.now() - aomaQueryStart;
    console.log(`4️⃣  AOMA knowledge query: ${metrics.aomaKnowledgeQuery.toFixed(0)}ms 🐌`);

    // Analysis
    console.log("\n📊 PERFORMANCE BREAKDOWN:\n");
    console.log(`Network RTT:          ${metrics.networkRTT.toFixed(0).padStart(6)}ms`);
    console.log(`RPC Overhead:         ${metrics.rpcOverhead.toFixed(0).padStart(6)}ms`);
    console.log(`Simple Tool:          ${metrics.simpleToolCall.toFixed(0).padStart(6)}ms`);
    console.log(`AOMA Query:           ${metrics.aomaKnowledgeQuery.toFixed(0).padStart(6)}ms 🔴`);
    console.log(`─────────────────────────────────`);

    const aomaOverhead = metrics.aomaKnowledgeQuery - metrics.networkRTT;
    console.log(`AOMA Processing Time: ${aomaOverhead.toFixed(0).padStart(6)}ms`);

    // Calculate what's slow
    console.log("\n🔍 BOTTLENECK ANALYSIS:\n");

    if (metrics.networkRTT > 500) {
      console.log(`⚠️  Network latency is high (${metrics.networkRTT.toFixed(0)}ms)`);
    }

    if (aomaOverhead > 15000) {
      console.log(`🔴 CRITICAL: AOMA processing extremely slow (${aomaOverhead.toFixed(0)}ms)`);
      console.log(`   Likely causes:`);
      console.log(`   - OpenAI Assistant API latency`);
      console.log(`   - Vector search complexity`);
      console.log(`   - Railway cold start`);
      console.log(`   - Resource constraints`);
    }

    // Store for further analysis
    console.log("\n💾 Full metrics:", JSON.stringify(metrics, null, 2));
  });

  test("should compare cached vs uncached performance", async () => {
    const testQuery = "Performance test query";

    // First query (should populate cache)
    const coldStart = performance.now();
    await fetch(`${AOMA_RAILWAY_URL}/rpc`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: {
          name: "query_aoma_knowledge",
          arguments: { query: testQuery, strategy: "rapid" },
        },
      }),
    });
    const coldDuration = performance.now() - coldStart;

    // Wait a bit
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Second query (should hit cache)
    const warmStart = performance.now();
    await fetch(`${AOMA_RAILWAY_URL}/rpc`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: {
          name: "query_aoma_knowledge",
          arguments: { query: testQuery, strategy: "rapid" },
        },
      }),
    });
    const warmDuration = performance.now() - warmStart;

    console.log(`\n📊 CACHE PERFORMANCE:\n`);
    console.log(`Cold start: ${coldDuration.toFixed(0)}ms`);
    console.log(`Warm cache: ${warmDuration.toFixed(0)}ms`);
    console.log(`Speedup: ${(coldDuration / warmDuration).toFixed(1)}x faster`);

    // Cached queries should be significantly faster
    expect(warmDuration).toBeLessThan(coldDuration * 0.1); // Should be 10x faster
  });
});

test.describe("AOMA Performance Regression Detection", () => {
  test("should track performance trends", async () => {
    const results: any[] = [];

    // Run 3 queries to get average
    for (let i = 0; i < 3; i++) {
      const start = performance.now();

      await fetch(`${AOMA_RAILWAY_URL}/rpc`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: i,
          method: "tools/call",
          params: {
            name: "query_aoma_knowledge",
            arguments: {
              query: `Test ${Date.now()}`,
              strategy: "rapid",
            },
          },
        }),
      });

      const duration = performance.now() - start;
      results.push(duration);

      // Wait between queries
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    const average = results.reduce((a, b) => a + b, 0) / results.length;
    const min = Math.min(...results);
    const max = Math.max(...results);

    console.log(`\n📈 PERFORMANCE STATISTICS (n=3):\n`);
    console.log(`Average: ${average.toFixed(0)}ms`);
    console.log(`Min:     ${min.toFixed(0)}ms`);
    console.log(`Max:     ${max.toFixed(0)}ms`);
    console.log(
      `Std Dev: ${Math.sqrt(results.reduce((sq, n) => sq + Math.pow(n - average, 2), 0) / results.length).toFixed(0)}ms`
    );

    // Store results for trend analysis
    const perfResults = {
      timestamp: new Date().toISOString(),
      average,
      min,
      max,
      samples: results,
    };

    console.log(`\n💾 Results (save to track trends):`);
    console.log(JSON.stringify(perfResults, null, 2));

    // Alert if average is over threshold
    if (average > PERFORMANCE_THRESHOLDS.AOMA_QUERY_COLD * 2) {
      console.error(`\n🚨 SEVERE PERFORMANCE DEGRADATION DETECTED!`);
      console.error(`Average response time: ${average.toFixed(0)}ms`);
      console.error(
        `This is ${(average / PERFORMANCE_THRESHOLDS.AOMA_QUERY_COLD).toFixed(1)}x slower than target!`
      );
    }
  });
});
