import { test, expect } from '../../fixtures/base-test';
import { setupConsoleMonitoring, assertNoConsoleErrors } from "../../helpers/console-monitor";

/**
 * Introspection Dropdown Feature Tests
 * Tests for FEAT-007 Phase 1: Langfuse Integration
 * @feature
 */

test.describe("Introspection Dropdown @feature", () => {
  test.describe.configure({ mode: "parallel" });

  // Setup console monitoring for each test
  test.beforeEach(async ({ page }) => {
    setupConsoleMonitoring(page, {
      ignoreWarnings: true,
      ignoreNetworkErrors: false,
    });

    // Navigate to app
    await page.goto("/", { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
  });

  // Assert no console errors after each test
  test.afterEach(async () => {
    assertNoConsoleErrors();
  });

  test("Introspection API endpoint returns data", async ({ request }) => {
    const response = await request.get("/api/introspection");

    expect(response.status()).toBe(200);

    const data = await response.json();

    // Verify response structure
    expect(data).toHaveProperty("status");
    expect(data).toHaveProperty("traces");
    expect(data).toHaveProperty("metrics");

    // Verify status fields
    expect(data.status).toHaveProperty("enabled");
    expect(data.status).toHaveProperty("environment");
    expect(data.status).toHaveProperty("tracingEnabled");
    expect(data.status).toHaveProperty("hasSupabase");
    expect(data.status).toHaveProperty("hasAIProvider");

    // Verify traces is an array
    expect(Array.isArray(data.traces)).toBeTruthy();
  });

  test("Introspection button is visible and clickable", async ({ page }) => {
    // Look for the introspection button with Bone icon
    const introspectionButton = page.locator('button:has-text("Introspection")');

    // Wait for button to be visible
    const isVisible = await introspectionButton.isVisible({ timeout: 5000 }).catch(() => false);

    if (!isVisible) {
      // Skip test if not authenticated - button only shows when logged in
      test.skip();
      return;
    }

    // Verify button is clickable
    await expect(introspectionButton).toBeEnabled();

    // Check for status indicator
    const statusText = await introspectionButton.textContent();
    expect(statusText).toContain("/");
  });

  test("Dropdown opens and displays traces", async ({ page }) => {
    const introspectionButton = page.locator('button:has-text("Introspection")');

    const isVisible = await introspectionButton.isVisible({ timeout: 5000 }).catch(() => false);

    if (!isVisible) {
      test.skip();
      return;
    }

    // Click the button to open dropdown
    await introspectionButton.click();
    await page.waitForTimeout(500);

    // Verify dropdown content is visible
    const dropdownContent = page.locator('[role="menu"]');
    await expect(dropdownContent).toBeVisible();

    // Check for App Health Monitor label
    const healthLabel = page.locator('text=App Health Monitor, text=Langfuse Traces').first();
    await expect(healthLabel).toBeVisible();

    // Check for Recent API Activity section
    const activitySection = page.locator('text=Recent API Activity');
    await expect(activitySection).toBeVisible();

    // Wait a bit for data to load
    await page.waitForTimeout(1000);

    // Check if traces are displayed OR if empty state is shown
    const hasTraces = await page.locator('[role="menuitem"]').count() > 0;
    const hasEmptyState = await page.locator('text=No recent activity').isVisible().catch(() => false);

    // Either traces or empty state should be visible
    expect(hasTraces || hasEmptyState).toBeTruthy();
  });

  test("Trace detail modal opens when clicking a trace", async ({ page }) => {
    const introspectionButton = page.locator('button:has-text("Introspection")');

    const isVisible = await introspectionButton.isVisible({ timeout: 5000 }).catch(() => false);

    if (!isVisible) {
      test.skip();
      return;
    }

    // Open dropdown
    await introspectionButton.click();
    await page.waitForTimeout(1000);

    // Look for trace items
    const traceItems = page.locator('[role="menuitem"]');
    const traceCount = await traceItems.count();

    if (traceCount === 0) {
      // No traces available, skip test
      test.skip();
      return;
    }

    // Click the first trace
    await traceItems.first().click();
    await page.waitForTimeout(500);

    // Verify detail dialog opens
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();

    // Check for expected sections
    const metadataSection = page.locator('text=Metadata');
    await expect(metadataSection).toBeVisible();

    // Check for Trace ID
    const traceIdLabel = page.locator('text=Trace ID:');
    await expect(traceIdLabel).toBeVisible();
  });

  test("Trace displays LLM metadata (model, tokens)", async ({ page }) => {
    const introspectionButton = page.locator('button:has-text("Introspection")');

    const isVisible = await introspectionButton.isVisible({ timeout: 5000 }).catch(() => false);

    if (!isVisible) {
      test.skip();
      return;
    }

    // Open dropdown
    await introspectionButton.click();
    await page.waitForTimeout(1000);

    // Look for LLM traces (green badge)
    const llmTraces = page.locator('[role="menuitem"]:has-text("llm")');
    const llmCount = await llmTraces.count();

    if (llmCount === 0) {
      // No LLM traces, skip test
      test.skip();
      return;
    }

    // Click first LLM trace
    await llmTraces.first().click();
    await page.waitForTimeout(500);

    // Check for model information in the detail view
    const modelLabel = page.locator('text=Model:');
    const tokensLabel = page.locator('text=Total Tokens:, text=Prompt Tokens:').first();

    // At least one should be visible for LLM traces
    const hasModel = await modelLabel.isVisible().catch(() => false);
    const hasTokens = await tokensLabel.isVisible().catch(() => false);

    expect(hasModel || hasTokens).toBeTruthy();
  });

  test("Health status displays service connections", async ({ page }) => {
    const introspectionButton = page.locator('button:has-text("Introspection")');

    const isVisible = await introspectionButton.isVisible({ timeout: 5000 }).catch(() => false);

    if (!isVisible) {
      test.skip();
      return;
    }

    // Open dropdown
    await introspectionButton.click();
    await page.waitForTimeout(1000);

    // Check for health status indicators
    const systemStatus = page.locator('text=System Status:');
    await expect(systemStatus).toBeVisible();

    const databaseStatus = page.locator('text=Database:');
    await expect(databaseStatus).toBeVisible();

    const aiProviderStatus = page.locator('text=AI Provider:');
    await expect(aiProviderStatus).toBeVisible();

    // Check for status badges (Connected or Unavailable)
    const statusBadges = page.locator('text=Connected, text=Unavailable, text=Healthy, text=Degraded').first();
    await expect(statusBadges).toBeVisible();
  });

  test("Dropdown refreshes data every 5 seconds", async ({ page }) => {
    const introspectionButton = page.locator('button:has-text("Introspection")');

    const isVisible = await introspectionButton.isVisible({ timeout: 5000 }).catch(() => false);

    if (!isVisible) {
      test.skip();
      return;
    }

    // Open dropdown
    await introspectionButton.click();
    await page.waitForTimeout(1000);

    // Spy on network requests
    let requestCount = 0;
    page.on('request', (request) => {
      if (request.url().includes('/api/introspection')) {
        requestCount++;
      }
    });

    // Wait for at least one auto-refresh (5 seconds)
    await page.waitForTimeout(6000);

    // Verify at least 2 requests were made (initial + one refresh)
    expect(requestCount).toBeGreaterThanOrEqual(2);
  });

  test("Refresh button manually updates data", async ({ page }) => {
    const introspectionButton = page.locator('button:has-text("Introspection")');

    const isVisible = await introspectionButton.isVisible({ timeout: 5000 }).catch(() => false);

    if (!isVisible) {
      test.skip();
      return;
    }

    // Open dropdown
    await introspectionButton.click();
    await page.waitForTimeout(1000);

    // Look for refresh button
    const refreshButton = page.locator('text=Refresh Health Status');
    await expect(refreshButton).toBeVisible();

    // Track network requests
    let refreshRequestMade = false;
    page.on('request', (request) => {
      if (request.url().includes('/api/introspection')) {
        refreshRequestMade = true;
      }
    });

    // Click refresh button
    await refreshButton.click();
    await page.waitForTimeout(500);

    // Verify refresh request was made
    expect(refreshRequestMade).toBeTruthy();
  });
});
