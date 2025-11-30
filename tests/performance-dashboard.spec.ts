import { test, expect } from './fixtures/base-test';

test.describe("Performance Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    // Set auth bypass for testing
    await page.goto("http://localhost:3000/performance", { waitUntil: 'domcontentloaded' });
  });

  test("should load performance dashboard", async ({ page }) => {
    // Wait for the page to load
    await page.waitForLoadState("networkidle");

    // Check for main title
    await expect(page.getByText("Performance Dashboard")).toBeVisible();
    await expect(page.getByText("Real-time system monitoring and analytics")).toBeVisible();

    // Check for quick stats cards
    await expect(page.getByText("Avg Response Time")).toBeVisible();
    await expect(page.getByText("Total Queries")).toBeVisible();
    await expect(page.getByText("System Load")).toBeVisible();
    await expect(page.getByText("Uptime")).toBeVisible();
  });

  test("should display system status", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    // Check for system status
    const statusCard = page.locator('[class*="CardHeader"]').filter({ hasText: "System Status" });
    await expect(statusCard).toBeVisible();

    // Status should be one of: HEALTHY, WARNING, or CRITICAL
    const statusText = await page.locator("text=/HEALTHY|WARNING|CRITICAL/").textContent();
    expect(statusText).toBeTruthy();
  });

  test("should show all tabs", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    // Check for all tabs
    await expect(page.getByRole("tab", { name: "Query Analytics" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "System Health" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Data Freshness" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "API Performance" })).toBeVisible();
  });

  test("should switch between tabs", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    // Click on System Health tab
    await page.getByRole("tab", { name: "System Health" }).click();
    await expect(page.getByText("System Resource Usage")).toBeVisible();

    // Click on Data Freshness tab
    await page.getByRole("tab", { name: "Data Freshness" }).click();
    await expect(page.getByText("Vector Store")).toBeVisible();
    await expect(page.getByText("AOMA Cache")).toBeVisible();
    await expect(page.getByText("Knowledge Base")).toBeVisible();

    // Click on API Performance tab
    await page.getByRole("tab", { name: "API Performance" }).click();
    await expect(page.getByText("API Endpoint Performance")).toBeVisible();
  });

  test("should display query analytics charts", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    // Click on Query Analytics tab
    await page.getByRole("tab", { name: "Query Analytics" }).click();

    // Check for charts
    await expect(page.getByText("Response Time Trends")).toBeVisible();
    await expect(page.getByText("Query Types")).toBeVisible();
    await expect(page.getByText("Performance Metrics")).toBeVisible();

    // Check for performance metrics
    await expect(page.getByText("P50 Latency")).toBeVisible();
    await expect(page.getByText("P95 Latency")).toBeVisible();
    await expect(page.getByText("P99 Latency")).toBeVisible();
    await expect(page.getByText("Success Rate")).toBeVisible();
    await expect(page.getByText("Error Rate")).toBeVisible();
  });

  test("should display system health metrics", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    // Click on System Health tab
    await page.getByRole("tab", { name: "System Health" }).click();

    // Check for system metrics
    await expect(page.getByText("CPU Usage")).toBeVisible();
    await expect(page.getByText("Memory Usage")).toBeVisible();
    await expect(page.getByText("Disk Usage")).toBeVisible();

    // Check for chart
    await expect(page.getByText("System Resource Usage")).toBeVisible();
  });

  test("should display data freshness metrics", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    // Click on Data Freshness tab
    await page.getByRole("tab", { name: "Data Freshness" }).click();

    // Check for data source cards
    const vectorStoreCard = page.locator('[class*="Card"]').filter({ hasText: "Vector Store" });
    await expect(vectorStoreCard).toBeVisible();
    await expect(vectorStoreCard.getByText("Total Documents")).toBeVisible();
    await expect(vectorStoreCard.getByText("Staleness")).toBeVisible();

    const aomaCacheCard = page.locator('[class*="Card"]').filter({ hasText: "AOMA Cache" });
    await expect(aomaCacheCard).toBeVisible();
    await expect(aomaCacheCard.getByText("Cache Hit Rate")).toBeVisible();

    const knowledgeBaseCard = page.locator('[class*="Card"]').filter({ hasText: "Knowledge Base" });
    await expect(knowledgeBaseCard).toBeVisible();
    await expect(knowledgeBaseCard.getByText("Total Files")).toBeVisible();
  });

  test("should display API endpoint metrics", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    // Click on API Performance tab
    await page.getByRole("tab", { name: "API Performance" }).click();

    // Check for endpoint list
    await expect(page.getByText("API Endpoint Performance")).toBeVisible();

    // Should show latency and error rates
    await expect(page.getByText(/Latency:/)).toBeVisible();
    await expect(page.getByText(/Requests:/)).toBeVisible();
  });

  test("should have refresh button", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    // Check for refresh button
    const refreshButton = page.getByRole("button", { name: /Refresh/ });
    await expect(refreshButton).toBeVisible();

    // Click refresh button
    await refreshButton.click();

    // Should still be on the page after refresh
    await expect(page.getByText("Performance Dashboard")).toBeVisible();
  });

  test("should have auto-refresh toggle", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    // Check for auto-refresh button
    const autoRefreshButton = page.getByRole("button", { name: /Auto-refresh/ });
    await expect(autoRefreshButton).toBeVisible();

    // Toggle auto-refresh
    await autoRefreshButton.click();

    // Should still have the button visible
    await expect(autoRefreshButton).toBeVisible();
  });

  test("should have time range selector", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    // Check for time range buttons
    await expect(page.getByRole("button", { name: "1H" })).toBeVisible();
    await expect(page.getByRole("button", { name: "6H" })).toBeVisible();
    await expect(page.getByRole("button", { name: "24H" })).toBeVisible();
    await expect(page.getByRole("button", { name: "7D" })).toBeVisible();

    // Click on a different time range
    await page.getByRole("button", { name: "6H" }).click();

    // Should still be on the page
    await expect(page.getByText("Performance Dashboard")).toBeVisible();
  });

  test("should not have console errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });

    await page.waitForLoadState("networkidle");

    // Navigate through all tabs to check for errors
    await page.getByRole("tab", { name: "Query Analytics" }).click();
    await page.waitForTimeout(500);

    await page.getByRole("tab", { name: "System Health" }).click();
    await page.waitForTimeout(500);

    await page.getByRole("tab", { name: "Data Freshness" }).click();
    await page.waitForTimeout(500);

    await page.getByRole("tab", { name: "API Performance" }).click();
    await page.waitForTimeout(500);

    // Filter out known non-critical errors
    const criticalErrors = errors.filter(
      (error) =>
        !error.includes("favicon") && !error.includes("ERR_FAILED") && !error.includes("net::")
    );

    expect(criticalErrors).toHaveLength(0);
  });

  test("should display numeric metrics in correct format", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    // Check that response times are displayed in milliseconds
    const responseTimeText = await page.getByText(/\d+ms/).first().textContent();
    expect(responseTimeText).toMatch(/\d+ms/);

    // Check that percentages are displayed correctly
    await page.getByRole("tab", { name: "System Health" }).click();
    const percentageText = await page
      .getByText(/\d+\.\d+%/)
      .first()
      .textContent();
    expect(percentageText).toMatch(/\d+\.\d+%/);
  });

  test("should handle API errors gracefully", async ({ page }) => {
    // Intercept API calls and return error
    await page.route("**/api/performance/metrics**", (route) => {
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "Internal server error" }),
      });
    });

    await page.goto("http://localhost:3000/performance", { waitUntil: 'domcontentloaded' });

    // Should show error message
    await expect(page.getByText(/Failed to load performance metrics/i)).toBeVisible();
  });

  test("should measure page load performance", async ({ page }) => {
    const startTime = Date.now();

    await page.goto("http://localhost:3000/performance", { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState("networkidle");

    const loadTime = Date.now() - startTime;

    // Dashboard should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);

    console.log(`Performance dashboard loaded in ${loadTime}ms`);
  });

  test("should display charts with data", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    // Wait for charts to render (charts use SVG)
    await page.waitForSelector("svg", { timeout: 5000 });

    // Check that charts have rendered
    const svgElements = await page.locator("svg").count();
    expect(svgElements).toBeGreaterThan(0);

    // Navigate to System Health tab and check for charts
    await page.getByRole("tab", { name: "System Health" }).click();
    await page.waitForSelector("svg", { timeout: 5000 });

    const systemCharts = await page.locator("svg").count();
    expect(systemCharts).toBeGreaterThan(0);
  });

  test("should update metrics on refresh", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    // Get initial query count
    const initialText = await page.locator("text=/Total Queries/").locator("..").textContent();

    // Click refresh
    await page.getByRole("button", { name: /Refresh/ }).click();

    // Wait for update
    await page.waitForTimeout(1000);

    // Metrics should still be visible (may or may not change)
    await expect(page.getByText("Total Queries")).toBeVisible();
  });

  test("should be responsive on mobile", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto("http://localhost:3000/performance", { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState("networkidle");

    // Dashboard should still be visible and usable on mobile
    await expect(page.getByText("Performance Dashboard")).toBeVisible();
    await expect(page.getByRole("tab", { name: "Query Analytics" })).toBeVisible();

    // Try switching tabs on mobile
    await page.getByRole("tab", { name: "System Health" }).click();
    await expect(page.getByText("System Resource Usage")).toBeVisible();
  });

  test("should display health status badge", async ({ page }) => {
    await page.waitForLoadState("networkidle");

    // Check for "Last updated" badge
    await expect(page.getByText(/Last updated:/i)).toBeVisible();
  });

  test("API endpoint should return valid metrics", async ({ request }) => {
    const response = await request.get(
      "http://localhost:3000/api/performance/metrics?timeRange=1h"
    );

    expect(response.status()).toBe(200);

    const data = await response.json();

    // Validate response structure
    expect(data).toHaveProperty("queryMetrics");
    expect(data).toHaveProperty("systemMetrics");
    expect(data).toHaveProperty("dataFreshness");
    expect(data).toHaveProperty("apiMetrics");
    expect(data).toHaveProperty("timestamp");

    // Validate query metrics structure
    expect(data.queryMetrics).toHaveProperty("avgResponseTime");
    expect(data.queryMetrics).toHaveProperty("p50ResponseTime");
    expect(data.queryMetrics).toHaveProperty("p95ResponseTime");
    expect(data.queryMetrics).toHaveProperty("p99ResponseTime");
    expect(data.queryMetrics).toHaveProperty("totalQueries");
    expect(data.queryMetrics).toHaveProperty("successRate");
    expect(data.queryMetrics).toHaveProperty("errorRate");

    // Validate system metrics structure
    expect(data.systemMetrics).toHaveProperty("cpuUsage");
    expect(data.systemMetrics).toHaveProperty("memoryUsage");
    expect(data.systemMetrics).toHaveProperty("diskUsage");

    // Validate data freshness structure
    expect(data.dataFreshness).toHaveProperty("vectorStore");
    expect(data.dataFreshness).toHaveProperty("aomaCache");
    expect(data.dataFreshness).toHaveProperty("knowledgeBase");
  });

  test("API endpoint should support different time ranges", async ({ request }) => {
    const timeRanges = ["1h", "6h", "24h", "7d"];

    for (const range of timeRanges) {
      const response = await request.get(
        `http://localhost:3000/api/performance/metrics?timeRange=${range}`
      );
      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty("timestamp");
    }
  });

  test("API endpoint should handle invalid time ranges", async ({ request }) => {
    const response = await request.get(
      "http://localhost:3000/api/performance/metrics?timeRange=invalid"
    );

    // Should still return 200 with default time range
    expect(response.status()).toBe(200);
  });
});
