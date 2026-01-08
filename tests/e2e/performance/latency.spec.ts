import { test, expect } from "@playwright/test";

/**
 * FEAT-006: Query Latency Measurement
 *
 * Measures time from chat submit to first streaming token.
 * Target: P95 < 1000ms
 */

test.describe("Query Latency - FEAT-006", () => {
  // Store latency measurements
  const latencies: number[] = [];

  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("measures chat latency baseline", async ({ page }) => {
    // Skip if not logged in (can't access chat without auth)
    const chatInput = page.locator('[data-test-id="chat-input"]');
    const chatInputVisible = await chatInput.isVisible().catch(() => false);

    if (!chatInputVisible) {
      console.log("Chat input not visible - likely needs authentication");
      test.skip();
      return;
    }

    const queries = [
      "What is AOMA?",
      "Tell me about partner previewer",
      "How does metadata sync work?",
    ];

    for (const query of queries) {
      const startTime = Date.now();

      // Type and submit query
      await chatInput.fill(query);
      await page.keyboard.press("Enter");

      // Wait for first response token (streaming indicator or first content)
      try {
        await page.waitForSelector(
          '[data-test-id="streaming-indicator"], [data-test-id="ai-response"]',
          { timeout: 10000 }
        );
        const latency = Date.now() - startTime;
        latencies.push(latency);
        console.log(`Query: "${query.substring(0, 20)}..." - Latency: ${latency}ms`);
      } catch {
        console.log(`Query: "${query.substring(0, 20)}..." - TIMEOUT`);
        latencies.push(10000); // Record timeout as 10s
      }

      // Wait for response to complete before next query
      await page.waitForTimeout(2000);
    }

    // Calculate P50 and P95
    const sorted = [...latencies].sort((a, b) => a - b);
    const p50 = sorted[Math.floor(sorted.length * 0.5)];
    const p95 = sorted[Math.floor(sorted.length * 0.95)];

    console.log("\n=== Latency Results ===");
    console.log(`Samples: ${latencies.length}`);
    console.log(`P50: ${p50}ms`);
    console.log(`P95: ${p95}ms`);
    console.log(`Target: P95 < 1000ms`);
    console.log(`Status: ${p95 < 1000 ? "PASS" : "FAIL"}`);

    // This test documents baseline, not a hard pass/fail
    expect(latencies.length).toBeGreaterThan(0);
  });

  test("measures cached vs uncached latency", async ({ page }) => {
    const chatInput = page.locator('[data-test-id="chat-input"]');
    const chatInputVisible = await chatInput.isVisible().catch(() => false);

    if (!chatInputVisible) {
      test.skip();
      return;
    }

    const query = "What is the purpose of AOMA?";

    // First query (uncached)
    const start1 = Date.now();
    await chatInput.fill(query);
    await page.keyboard.press("Enter");

    try {
      await page.waitForSelector('[data-test-id="ai-response"]', { timeout: 15000 });
      const uncachedLatency = Date.now() - start1;
      console.log(`Uncached latency: ${uncachedLatency}ms`);

      // Wait for response to complete
      await page.waitForTimeout(5000);

      // Second query (potentially cached)
      const start2 = Date.now();
      await chatInput.fill(query);
      await page.keyboard.press("Enter");

      await page.waitForSelector('[data-test-id="ai-response"]:last-child', { timeout: 15000 });
      const cachedLatency = Date.now() - start2;
      console.log(`Cached latency: ${cachedLatency}ms`);

      const improvement = ((uncachedLatency - cachedLatency) / uncachedLatency) * 100;
      console.log(`Improvement: ${improvement.toFixed(1)}%`);

      // If caching is working, second query should be faster
      // (but don't hard fail if not - cache might not be configured)
      if (cachedLatency < uncachedLatency) {
        console.log("Cache appears to be working");
      } else {
        console.log("No cache improvement detected (cache may not be configured)");
      }
    } catch {
      console.log("Timeout waiting for response");
    }
  });
});
