/**
 * COMPREHENSIVE PERFORMANCE METRICS
 *
 * Measures ALL performance aspects:
 * - Page load timing
 * - API response times
 * - UI responsiveness
 * - Memory usage
 * - Network activity
 */

import { test, expect } from '../fixtures/base-test';

test.describe("Performance Metrics @comprehensive", () => {
  test("Measure complete page load performance", async ({ page }) => {
    console.log("⏱️  Measuring page load performance...\n");

    const startTime = Date.now();

    await page.goto("/", { waitUntil: "domcontentloaded" });
    const domContentLoaded = Date.now() - startTime;

    await page.waitForLoadState("load");
    const loadComplete = Date.now() - startTime;

    await page.waitForLoadState("networkidle");
    const networkIdle = Date.now() - startTime;

    // Get Web Vitals using Performance API
    const metrics = await page.evaluate(() => {
      const perf = performance as any;
      const navigation = perf.getEntriesByType?.("navigation")?.[0] as any;
      const paint = perf.getEntriesByType?.("paint") || [];

      return {
        // Navigation Timing
        dns: navigation?.domainLookupEnd - navigation?.domainLookupStart,
        tcp: navigation?.connectEnd - navigation?.connectStart,
        ttfb: navigation?.responseStart - navigation?.requestStart,
        domInteractive: navigation?.domInteractive,
        domComplete: navigation?.domComplete,

        // Paint Timing
        firstPaint: paint.find((p: any) => p.name === "first-paint")?.startTime,
        firstContentfulPaint: paint.find((p: any) => p.name === "first-contentful-paint")
          ?.startTime,

        // Resource Timing
        resources: perf.getEntriesByType?.("resource")?.length || 0,
      };
    });

    console.log("📊 Page Load Metrics:");
    console.log(`  DOM Content Loaded: ${domContentLoaded}ms`);
    console.log(`  Load Complete: ${loadComplete}ms`);
    console.log(`  Network Idle: ${networkIdle}ms`);
    console.log(`  DNS Lookup: ${metrics.dns?.toFixed(0)}ms`);
    console.log(`  TCP Connect: ${metrics.tcp?.toFixed(0)}ms`);
    console.log(`  TTFB: ${metrics.ttfb?.toFixed(0)}ms`);
    console.log(`  DOM Interactive: ${metrics.domInteractive?.toFixed(0)}ms`);
    console.log(`  First Paint: ${metrics.firstPaint?.toFixed(0)}ms`);
    console.log(`  First Contentful Paint: ${metrics.firstContentfulPaint?.toFixed(0)}ms`);
    console.log(`  Resources Loaded: ${metrics.resources}`);

    // Performance assertions
    expect(domContentLoaded).toBeLessThan(5000); // < 5s
    expect(loadComplete).toBeLessThan(10000); // < 10s
    expect(networkIdle).toBeLessThan(15000); // < 15s

    if (metrics.firstContentfulPaint) {
      expect(metrics.firstContentfulPaint).toBeLessThan(3000); // < 3s
    }
  });

  test("Measure API response times", async ({ page }) => {
    console.log("⏱️  Measuring API response times...\n");

    const apiCalls: Array<{ url: string; duration: number; status: number }> = [];

    // Monitor all API calls
    page.on("response", async (response) => {
      const url = response.url();
      if (url.includes("/api/")) {
        const request = response.request();
        const timing = request.timing();
        const duration = timing.responseEnd - timing.startTime;
        apiCalls.push({
          url,
          duration,
          status: response.status(),
        });
      }
    });

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Trigger some API calls
    const chatInput = page
      .locator('textarea[placeholder*="Ask"], input[placeholder*="Ask"]')
      .first();
    const isVisible = await chatInput.isVisible().catch(() => false);

    if (isVisible) {
      console.log("  🔄 Triggering API calls...");
      await chatInput.fill("Test API performance");
      // Don't submit - just testing input
    }

    await page.waitForTimeout(2000);

    console.log("\n📊 API Response Times:");
    if (apiCalls.length > 0) {
      apiCalls.forEach((call) => {
        const endpoint = call.url.split("/api/")[1]?.split("?")[0] || "unknown";
        console.log(`  ${endpoint}: ${call.duration.toFixed(0)}ms (${call.status})`);
      });

      // Calculate stats
      const durations = apiCalls.map((c) => c.duration);
      const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
      const max = Math.max(...durations);

      console.log(`\n  Average: ${avg.toFixed(0)}ms`);
      console.log(`  Max: ${max.toFixed(0)}ms`);

      // No API call should take more than 10s
      expect(max).toBeLessThan(10000);
    } else {
      console.log("  ℹ️  No API calls detected");
    }
  });

  test("Measure UI interaction responsiveness", async ({ page }) => {
    console.log("⏱️  Measuring UI interaction responsiveness...\n");

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const interactions: Array<{ element: string; duration: number }> = [];

    // Test button click responsiveness
    const testButton = page.locator("button").first();
    const isVisible = await testButton.isVisible().catch(() => false);

    if (isVisible) {
      const startTime = Date.now();
      await testButton.click();
      const duration = Date.now() - startTime;

      interactions.push({ element: "First Button", duration });
      console.log(`  Button click: ${duration}ms`);
    }

    // Test input responsiveness
    const input = page.locator("input, textarea").first();
    const isInputVisible = await input.isVisible().catch(() => false);

    if (isInputVisible) {
      const startTime = Date.now();
      await input.fill("Performance test");
      const duration = Date.now() - startTime;

      interactions.push({ element: "Input Field", duration });
      console.log(`  Input typing: ${duration}ms`);
    }

    console.log("\n📊 Responsiveness Summary:");
    if (interactions.length > 0) {
      const avg = interactions.reduce((sum, i) => sum + i.duration, 0) / interactions.length;
      console.log(`  Average: ${avg.toFixed(0)}ms`);

      // All interactions should feel instant (< 100ms)
      expect(avg).toBeLessThan(100);
    }
  });

  test("Measure memory usage", async ({ page }) => {
    console.log("⏱️  Measuring memory usage...\n");

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Get initial memory
    const initialMemory = await page.evaluate(() => {
      if ("memory" in performance) {
        const mem = (performance as any).memory;
        return {
          used: mem.usedJSHeapSize,
          total: mem.totalJSHeapSize,
          limit: mem.jsHeapSizeLimit,
        };
      }
      return null;
    });

    if (initialMemory) {
      console.log("📊 Memory Usage:");
      console.log(`  Used: ${(initialMemory.used / 1024 / 1024).toFixed(2)} MB`);
      console.log(`  Total: ${(initialMemory.total / 1024 / 1024).toFixed(2)} MB`);
      console.log(`  Limit: ${(initialMemory.limit / 1024 / 1024).toFixed(2)} MB`);

      const usagePercent = (initialMemory.used / initialMemory.limit) * 100;
      console.log(`  Usage: ${usagePercent.toFixed(1)}%`);

      // Memory usage should be reasonable (< 50% of limit)
      expect(usagePercent).toBeLessThan(50);
    } else {
      console.log("  ℹ️  Memory API not available");
    }
  });

  test("Measure network activity", async ({ page }) => {
    console.log("⏱️  Measuring network activity...\n");

    const requests: Array<{ type: string; size: number; time: number }> = [];

    page.on("response", async (response) => {
      const url = response.url();
      const request = response.request();
      const type = request.resourceType();

      try {
        const buffer = await response.body();
        const timing = request.timing();
        const duration = timing.responseEnd - timing.startTime;

        requests.push({
          type,
          size: buffer.length,
          time: duration,
        });
      } catch (err) {
        // Some responses can't be read
      }
    });

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Group by type
    const byType = requests.reduce(
      (acc, req) => {
        if (!acc[req.type]) {
          acc[req.type] = { count: 0, totalSize: 0, totalTime: 0 };
        }
        acc[req.type].count++;
        acc[req.type].totalSize += req.size;
        acc[req.type].totalTime += req.time;
        return acc;
      },
      {} as Record<string, { count: number; totalSize: number; totalTime: number }>
    );

    console.log("📊 Network Activity by Type:");
    Object.entries(byType).forEach(([type, stats]) => {
      console.log(`  ${type}:`);
      console.log(`    Count: ${stats.count}`);
      console.log(`    Size: ${(stats.totalSize / 1024).toFixed(2)} KB`);
      console.log(`    Avg Time: ${(stats.totalTime / stats.count).toFixed(0)}ms`);
    });

    const totalSize = Object.values(byType).reduce((sum, s) => sum + s.totalSize, 0);
    console.log(`\n  Total Transfer: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  Total Requests: ${requests.length}`);

    // Page shouldn't be too heavy (< 10 MB)
    expect(totalSize).toBeLessThan(10 * 1024 * 1024);
  });
});
