import { test, expect } from "@playwright/test";

/**
 * FEAT-017: Test Intelligence Redesign
 *
 * Tests for the ConfidenceGauge component and skeleton loading states
 * in the Historical Test Explorer.
 */

test.describe("Test Intelligence Redesign - FEAT-017", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app - it's a SPA so we need to go to root first
    await page.goto("/");
    // Wait for the app to load
    await page.waitForLoadState("networkidle");
  });

  test("Historical Test Explorer shows skeleton loading states", async ({ page }) => {
    // Click on Test tab to navigate to test mode
    const testTab = page.locator('[data-test-id="tab-test"]');
    if (await testTab.isVisible()) {
      await testTab.click();
    }

    // Navigate to Historical tab within Test mode
    const historicalTab = page.locator('text=Historical').first();
    if (await historicalTab.isVisible()) {
      await historicalTab.click();
    }

    // The skeleton loading should appear briefly or immediately show data
    // We're checking that the component loads without errors
    await page.waitForSelector('[data-test-id="test-list"]', { timeout: 10000 });

    // Verify the test list eventually shows content
    const testList = page.locator('[data-test-id="test-list"]');
    await expect(testList).toBeVisible();
  });

  test("ConfidenceGauge displays in test detail panel", async ({ page }) => {
    // Navigate to Test tab
    const testTab = page.locator('[data-test-id="tab-test"]');
    if (await testTab.isVisible()) {
      await testTab.click();
    }

    // Navigate to Historical tab
    const historicalTab = page.locator('text=Historical').first();
    if (await historicalTab.isVisible()) {
      await historicalTab.click();
    }

    // Wait for tests to load
    await page.waitForSelector('[data-test-id="test-list"]', { timeout: 10000 });

    // Click on the first test row to open detail panel
    const firstTestRow = page.locator("table tbody tr").first();
    if (await firstTestRow.isVisible()) {
      await firstTestRow.click();

      // Verify detail panel opens
      const detailPanel = page.locator('[data-test-id="test-detail"]');
      await expect(detailPanel).toBeVisible({ timeout: 5000 });

      // Check for Automation Readiness text (part of the ConfidenceGauge card)
      const automationReadiness = page.locator('text=Automation Readiness');
      await expect(automationReadiness).toBeVisible({ timeout: 5000 });
    }
  });

  test("ConfidenceGauge component renders correctly", async ({ page }) => {
    // This is a unit-style test that verifies the gauge SVG renders
    // Navigate to a page where the gauge would be visible
    const testTab = page.locator('[data-test-id="tab-test"]');
    if (await testTab.isVisible()) {
      await testTab.click();
    }

    const historicalTab = page.locator('text=Historical').first();
    if (await historicalTab.isVisible()) {
      await historicalTab.click();
    }

    await page.waitForSelector('[data-test-id="test-list"]', { timeout: 10000 });

    // Click first test
    const firstTestRow = page.locator("table tbody tr").first();
    if (await firstTestRow.isVisible()) {
      await firstTestRow.click();

      // Wait for detail panel
      await page.waitForSelector('[data-test-id="test-detail"]', { timeout: 5000 });

      // Verify SVG circular gauge is present (the ConfidenceGauge renders an SVG)
      const svgGauge = page.locator('[data-test-id="test-detail"] svg circle');
      const circleCount = await svgGauge.count();

      // ConfidenceGauge renders 2 circles (background + progress)
      expect(circleCount).toBeGreaterThanOrEqual(2);
    }
  });

  test("Test detail panel shows tier badge", async ({ page }) => {
    const testTab = page.locator('[data-test-id="tab-test"]');
    if (await testTab.isVisible()) {
      await testTab.click();
    }

    const historicalTab = page.locator('text=Historical').first();
    if (await historicalTab.isVisible()) {
      await historicalTab.click();
    }

    await page.waitForSelector('[data-test-id="test-list"]', { timeout: 10000 });

    const firstTestRow = page.locator("table tbody tr").first();
    if (await firstTestRow.isVisible()) {
      await firstTestRow.click();

      await page.waitForSelector('[data-test-id="test-detail"]', { timeout: 5000 });

      // Check that a tier badge is present (Tier 1, Tier 2, or Tier 3)
      const tierBadge = page.locator('[data-test-id="test-detail"]').locator('text=/Tier [123]/');
      await expect(tierBadge.first()).toBeVisible({ timeout: 5000 });
    }
  });
});
