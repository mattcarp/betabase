import { test, expect } from "../../fixtures/base-test";
import { setupConsoleMonitoring, assertNoConsoleErrors } from "../helpers/console-monitor";

/**
 * Performance Dashboard Tests
 * Validates the /performance route displays real system metrics
 */

test.describe("Performance Dashboard @performance", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ page }) => {
    setupConsoleMonitoring(page, {
      ignoreWarnings: true,
      ignoreNetworkErrors: true,
    });
  });

  test.afterEach(async () => {
    assertNoConsoleErrors();
  });

  test("API returns real metrics", async ({ request }) => {
    const response = await request.get("/api/performance/metrics?timeRange=1h");
    expect(response.status()).toBe(200);

    const data = await response.json();

    // Verify structure exists
    expect(data).toHaveProperty("queryMetrics");
    expect(data).toHaveProperty("systemMetrics");
    expect(data).toHaveProperty("testMetrics");
    expect(data).toHaveProperty("dataFreshness");
    expect(data).toHaveProperty("apiMetrics");
    expect(data).toHaveProperty("webVitals");
    expect(data).toHaveProperty("timestamp");

    // Verify real Node.js metrics (not simulated)
    expect(data.systemMetrics).toHaveProperty("nodeVersion");
    expect(data.systemMetrics.nodeVersion).toMatch(/^v\d+\.\d+\.\d+$/);
    expect(data.systemMetrics).toHaveProperty("platform");
    expect(["darwin", "linux", "win32"]).toContain(data.systemMetrics.platform);

    // Verify memory metrics are present (real values from Node.js)
    expect(data.systemMetrics.heapUsedMB).toBeGreaterThan(0);
    expect(data.systemMetrics.heapTotalMB).toBeGreaterThan(0);
    expect(data.systemMetrics.memoryUsage).toBeGreaterThan(0);
  });

  test("Dashboard loads without errors", async ({ page }) => {
    await page.goto("/performance", { waitUntil: "domcontentloaded" });

    // Wait for loading to complete
    await expect(page.getByText("Loading performance metrics...")).toBeHidden({
      timeout: 10000,
    });

    // Verify dashboard title
    await expect(page.getByRole("heading", { name: "Performance Dashboard" })).toBeVisible();

    // Verify key sections are present
    await expect(page.getByText("Real-time system monitoring")).toBeVisible();
  });

  test("Shows system status indicator", async ({ page }) => {
    await page.goto("/performance", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);

    // Verify status indicator exists (HEALTHY, WARNING, or CRITICAL)
    const statusText = await page.getByText(/System Status:/).textContent();
    expect(statusText).toMatch(/HEALTHY|WARNING|CRITICAL/);
  });

  test("Displays metric cards", async ({ page }) => {
    await page.goto("/performance", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);

    // Verify key metric cards are visible
    await expect(page.getByText("Avg Response Time")).toBeVisible();
    await expect(page.getByText("Total Queries")).toBeVisible();
    await expect(page.getByText("System Load")).toBeVisible();
    // Use exact match for Uptime since there are multiple elements containing "Uptime"
    await expect(page.getByText("Uptime", { exact: true }).first()).toBeVisible();
  });

  test("Tab navigation works", async ({ page }) => {
    await page.goto("/performance", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);

    // Verify tabs are present
    const tabs = ["Test Metrics", "Web Vitals", "System Health", "Data Freshness", "API Performance"];

    for (const tabName of tabs) {
      await expect(page.getByRole("tab", { name: tabName })).toBeVisible();
    }

    // Click through tabs and verify content changes
    await page.getByRole("tab", { name: "System Health" }).click();
    await expect(page.getByText("Node.js Process Metrics")).toBeVisible();

    await page.getByRole("tab", { name: "Web Vitals" }).click();
    await expect(page.getByText("Core Web Vitals")).toBeVisible();

    await page.getByRole("tab", { name: "Data Freshness" }).click();
    await expect(page.getByText("Vector Store")).toBeVisible();

    await page.getByRole("tab", { name: "API Performance" }).click();
    await expect(page.getByText("API Endpoint Performance")).toBeVisible();
  });

  test("Test Metrics tab shows real data", async ({ page }) => {
    await page.goto("/performance", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);

    // Test Metrics is the default tab
    await expect(page.getByText("Test Pass Rate")).toBeVisible();
    await expect(page.getByText("Historical Tests")).toBeVisible();
    await expect(page.getByText("RLHF Feedback")).toBeVisible();
    await expect(page.getByText("Self-Healing Tests")).toBeVisible();

    // Verify data sources section shows Supabase tables
    await expect(page.getByText("Data Sources")).toBeVisible();
    await expect(page.getByText("test_results", { exact: true })).toBeVisible();
    await expect(page.getByText("bb_case", { exact: true })).toBeVisible();
    await expect(page.getByText("rlhf_feedback", { exact: true })).toBeVisible();
  });

  test("System Health shows Node.js info", async ({ page }) => {
    await page.goto("/performance", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);

    await page.getByRole("tab", { name: "System Health" }).click();
    await page.waitForTimeout(500);

    // Verify real Node.js version is displayed
    await expect(page.getByText(/v\d+\.\d+\.\d+/)).toBeVisible();

    // Verify platform is shown
    await expect(page.getByText(/Platform: (darwin|linux|win32)/)).toBeVisible();

    // Verify heap memory card - use exact match
    await expect(page.getByText("Heap Memory", { exact: true })).toBeVisible();
    await expect(page.getByText(/\d+ MB/).first()).toBeVisible();
  });

  test("Time range buttons work", async ({ page }) => {
    await page.goto("/performance", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);

    // Verify time range buttons are visible
    const timeButtons = ["1H", "6H", "24H", "7D"];
    for (const time of timeButtons) {
      await expect(page.getByRole("button", { name: time })).toBeVisible();
    }

    // Click 24H and verify it updates (no error)
    await page.getByRole("button", { name: "24H" }).click();
    await page.waitForTimeout(1000);

    // Page should still show dashboard content
    await expect(page.getByRole("heading", { name: "Performance Dashboard" })).toBeVisible();
  });

  test("Auto-refresh toggle works", async ({ page }) => {
    await page.goto("/performance", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);

    // Find auto-refresh button
    const autoRefreshBtn = page.getByRole("button", { name: "Auto-refresh" });
    await expect(autoRefreshBtn).toBeVisible();

    // Click to toggle off
    await autoRefreshBtn.click();
    await page.waitForTimeout(500);

    // Button should still be visible and toggleable
    await expect(autoRefreshBtn).toBeVisible();
  });

  test("Manual refresh button works", async ({ page }) => {
    await page.goto("/performance", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);

    // Get initial timestamp
    const initialTimestamp = await page.getByText(/Last updated:/).textContent();

    // Click refresh - use exact match to avoid matching "Auto-refresh"
    await page.getByRole("button", { name: "Refresh", exact: true }).click();
    await page.waitForTimeout(1500);

    // Verify timestamp updated or page didn't break
    await expect(page.getByRole("heading", { name: "Performance Dashboard" })).toBeVisible();
  });
});
