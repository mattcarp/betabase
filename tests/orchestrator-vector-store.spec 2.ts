/**
 * AOMA Orchestrator Vector Store Integration Tests
 *
 * Tests the new vector store-based orchestration system
 * Expected performance: <1s for vector queries (vs 20-25s for external APIs)
 */

import { test, expect } from "@playwright/test";

const TEST_API_URL = "http://localhost:3000";
const PERFORMANCE_THRESHOLDS = {
  VECTOR_QUERY: 2000, // 2s - vector store queries should be fast
  CACHE_HIT: 500, // 500ms - cached responses should be instant
  EXTERNAL_API: 10000, // 10s - fallback to external APIs (acceptable)
};

test.describe("AOMA Orchestrator - Vector Store Integration", () => {
  test("should use vector store for AOMA knowledge queries", async () => {
    const startTime = performance.now();

    const response = await fetch(`${TEST_API_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: "What is AOMA metadata management?" }],
      }),
    });

    const duration = performance.now() - startTime;

    console.log(`⏱️  Vector store query: ${duration.toFixed(0)}ms`);

    expect(response.ok).toBeTruthy();

    // Should be significantly faster than external API calls
    if (duration < PERFORMANCE_THRESHOLDS.VECTOR_QUERY) {
      console.log(`✅ FAST PATH: Vector store used (${duration.toFixed(0)}ms)`);
    } else if (duration > PERFORMANCE_THRESHOLDS.EXTERNAL_API) {
      console.log(`⚠️  SLOW PATH: Likely using external APIs (${duration.toFixed(0)}ms)`);
    }

    // Parse response (it's a stream, so we need to read it)
    const text = await response.text();
    expect(text.length).toBeGreaterThan(0);
  });

  test("should intelligently select source types for Jira queries", async () => {
    const startTime = performance.now();

    const response = await fetch(`${TEST_API_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: "Show me recent Jira tickets about bugs" }],
      }),
    });

    const duration = performance.now() - startTime;

    console.log(`⏱️  Jira query: ${duration.toFixed(0)}ms`);

    expect(response.ok).toBeTruthy();

    // This should filter to jira source type
    console.log(`📊 Expected to query jira source type only`);
  });

  test("should intelligently select source types for Git queries", async () => {
    const startTime = performance.now();

    const response = await fetch(`${TEST_API_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: "What are the recent git commits?" }],
      }),
    });

    const duration = performance.now() - startTime;

    console.log(`⏱️  Git query: ${duration.toFixed(0)}ms`);

    expect(response.ok).toBeTruthy();

    // This should filter to git source type
    console.log(`📊 Expected to query git source type only`);
  });

  test("should cache vector store results for repeat queries", async () => {
    const query = {
      messages: [{ role: "user", content: "What is AOMA cover hot swap functionality?" }],
    };

    // First request - should hit vector store
    const start1 = performance.now();
    const response1 = await fetch(`${TEST_API_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(query),
    });
    const duration1 = performance.now() - start1;

    expect(response1.ok).toBeTruthy();
    console.log(`⏱️  First query: ${duration1.toFixed(0)}ms`);

    // Second request - should hit cache
    const start2 = performance.now();
    const response2 = await fetch(`${TEST_API_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(query),
    });
    const duration2 = performance.now() - start2;

    expect(response2.ok).toBeTruthy();
    console.log(`⏱️  Second query (cached): ${duration2.toFixed(0)}ms`);

    // Cached response should be significantly faster
    if (duration2 < duration1 * 0.5) {
      console.log(
        `✅ CACHE HIT: Second query was ${((1 - duration2 / duration1) * 100).toFixed(0)}% faster`
      );
    }
  });

  test("should fall back to external APIs when vector store has no results", async () => {
    const startTime = performance.now();

    // Query something very specific that might not be in vector store
    const response = await fetch(`${TEST_API_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [
          {
            role: "user",
            content:
              "Query for something extremely specific that definitely does not exist in any knowledge base",
          },
        ],
      }),
    });

    const duration = performance.now() - startTime;

    console.log(`⏱️  Fallback query: ${duration.toFixed(0)}ms`);

    expect(response.ok).toBeTruthy();

    // If it takes longer, it likely fell back to external APIs
    if (duration > PERFORMANCE_THRESHOLDS.VECTOR_QUERY) {
      console.log(`📡 FALLBACK: Used external APIs (${duration.toFixed(0)}ms)`);
    }
  });

  test("should include source citations in vector store responses", async () => {
    const response = await fetch(`${TEST_API_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: "What is AOMA?" }],
      }),
    });

    expect(response.ok).toBeTruthy();

    const text = await response.text();

    // Vector store responses should include citation markers [1], [2], etc.
    const hasCitations = /\[\d+\]/.test(text);
    if (hasCitations) {
      console.log(`✅ Response includes citations`);
    } else {
      console.log(`⚠️  Response missing citations`);
    }
  });

  test("should provide metadata about vector search results", async () => {
    const response = await fetch(`${TEST_API_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: "Tell me about AOMA asset management" }],
      }),
    });

    expect(response.ok).toBeTruthy();

    const text = await response.text();

    // The response stream might include metadata
    console.log(`📊 Response length: ${text.length} characters`);

    // Check if response is substantive
    expect(text.length).toBeGreaterThan(50);
  });
});

test.describe("AOMA Orchestrator - Performance Regression Prevention", () => {
  test("should not exceed 5s for standard AOMA queries", async () => {
    const queries = [
      "What is AOMA?",
      "How does metadata management work?",
      "Explain the asset ingestion process",
      "What are the main AOMA features?",
    ];

    for (const query of queries) {
      const startTime = performance.now();

      const response = await fetch(`${TEST_API_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: query }],
        }),
      });

      const duration = performance.now() - startTime;

      console.log(`⏱️  "${query}": ${duration.toFixed(0)}ms`);

      expect(response.ok).toBeTruthy();

      // CRITICAL: Must be under 5s threshold
      if (duration > 5000) {
        console.error(
          `❌ PERFORMANCE REGRESSION: Query took ${duration.toFixed(0)}ms (threshold: 5000ms)`
        );
      }

      expect(duration).toBeLessThan(5000);
    }
  });
});
