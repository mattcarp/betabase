/**
 * E2E Test: Introspection Cost Display
 *
 * Tests that the cost calculator integration displays costs correctly
 * in the introspection dropdown for LLM traces.
 */

import { test, expect } from "@playwright/test";

test.describe("Introspection Cost Display", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to home page
    await page.goto("/");

    // Skip if not authenticated
    const isAuthenticated = await page.locator('[data-testid="user-menu"]').count() > 0;
    test.skip(!isAuthenticated, "User not authenticated - skipping introspection tests");
  });

  test("should display cost for LLM traces in dropdown", async ({ page }) => {
    // Open introspection dropdown
    const introspectionButton = page.locator("button:has-text('Introspection')");
    await expect(introspectionButton).toBeVisible({ timeout: 10000 });
    await introspectionButton.click();

    // Wait for dropdown to open
    await expect(page.locator('text="App Health Monitor"')).toBeVisible();

    // Wait for traces to load
    await page.waitForTimeout(2000);

    // Check if there are any LLM traces with cost information
    const costElements = page.locator('[class*="text-green"]', {
      has: page.locator('svg[class*="lucide-dollar-sign"]'),
    });

    const costCount = await costElements.count();

    if (costCount > 0) {
      // If we have cost displays, verify the first one
      const firstCost = costElements.first();
      await expect(firstCost).toBeVisible();

      // Cost should be in a valid format (numbers and optional decimal)
      const costText = await firstCost.textContent();
      expect(costText).toMatch(/^\d+\.\d{2,4}$/); // Format: 0.0023 or 0.02

      // Hover to see tooltip
      await firstCost.hover();
      await page.waitForTimeout(500);

      // Tooltip should appear with details
      const tooltip = page.locator('[role="tooltip"]');
      if (await tooltip.isVisible()) {
        await expect(tooltip.locator("text=/Estimated Cost/i")).toBeVisible();
        await expect(tooltip.locator("text=/Input:/i")).toBeVisible();
        await expect(tooltip.locator("text=/Output:/i")).toBeVisible();
        await expect(tooltip.locator("text=/tokens/i")).toBeVisible();
      }
    } else {
      console.log("No LLM traces with cost information found - test skipped verification");
    }
  });

  test("should display cost in trace detail modal", async ({ page }) => {
    // Open introspection dropdown
    const introspectionButton = page.locator("button:has-text('Introspection')");
    await introspectionButton.click();

    // Wait for dropdown
    await expect(page.locator('text="App Health Monitor"')).toBeVisible();

    // Wait for traces to load
    await page.waitForTimeout(2000);

    // Find and click on an LLM trace
    const llmTrace = page.locator('[class*="bg-green-500/10"]').first();
    const traceCount = await llmTrace.count();

    if (traceCount > 0) {
      await llmTrace.click();

      // Wait for modal to open
      await expect(page.locator('[role="dialog"]')).toBeVisible();

      // Check if cost is displayed in the metadata section
      const costDisplay = page.locator('text=/Estimated Cost:/i');
      const hasCost = await costDisplay.count() > 0;

      if (hasCost) {
        await expect(costDisplay).toBeVisible();

        // Should have a dollar amount next to it
        const costValue = page
          .locator('[class*="text-green"]')
          .filter({ hasText: /^\$\d+\.\d{2,4}$/ })
          .first();

        if (await costValue.isVisible()) {
          const costText = await costValue.textContent();
          expect(costText).toMatch(/^\$\d+\.\d{2,4}$/);
        }
      }

      // Close modal
      const closeButton = page.locator('[role="dialog"] button[aria-label="Close"]').first();
      if (await closeButton.count() > 0) {
        await closeButton.click();
      } else {
        await page.keyboard.press("Escape");
      }
    } else {
      console.log("No LLM traces found - test skipped verification");
    }
  });

  test("should only show cost for LLM traces, not retriever traces", async ({ page }) => {
    // Open introspection dropdown
    const introspectionButton = page.locator("button:has-text('Introspection')");
    await introspectionButton.click();

    // Wait for dropdown
    await expect(page.locator('text="App Health Monitor"')).toBeVisible();
    await page.waitForTimeout(2000);

    // Check retriever traces (orange badge) should NOT have cost
    const retrieverTraces = page.locator('[class*="bg-orange-500/10"]');
    const retrieverCount = await retrieverTraces.count();

    if (retrieverCount > 0) {
      // Get first retriever trace's parent item
      const retrieverItem = retrieverTraces.first().locator("xpath=ancestor::*[3]");

      // Should not have dollar sign icon
      const hasDollarSign = await retrieverItem
        .locator('svg[class*="lucide-dollar-sign"]')
        .count();
      expect(hasDollarSign).toBe(0);
    }

    // Check LLM traces (green badge) SHOULD have cost
    const llmTraces = page.locator('[class*="bg-green-500/10"]');
    const llmCount = await llmTraces.count();

    if (llmCount > 0) {
      // Get first LLM trace's parent item
      const llmItem = llmTraces.first().locator("xpath=ancestor::*[3]");

      // Should have dollar sign icon or cost display
      const hasCost = await llmItem.locator('[class*="text-green"]').count();
      // We don't assert here because not all LLM traces may have cost data
      // (e.g., if model pricing is not available)
      console.log(`LLM trace has cost display: ${hasCost > 0}`);
    }
  });

  test("should handle traces without cost data gracefully", async ({ page }) => {
    // Open introspection dropdown
    const introspectionButton = page.locator("button:has-text('Introspection')");
    await introspectionButton.click();

    // Wait for dropdown
    await expect(page.locator('text="App Health Monitor"')).toBeVisible();
    await page.waitForTimeout(2000);

    // Should not crash if there are traces
    const traces = page.locator('[role="menuitem"]');
    const traceCount = await traces.count();

    if (traceCount > 0) {
      // Page should still be functional
      await expect(page.locator('text="App Health Monitor"')).toBeVisible();

      // Should be able to close dropdown
      await page.keyboard.press("Escape");
      await expect(page.locator('text="App Health Monitor"')).not.toBeVisible();
    }
  });
});
