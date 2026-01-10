/**
 * E2E tests for role-based tab visibility
 * Tests FEAT-018: Role-Based Contextual Chat System
 */

import { test, expect } from "@playwright/test";

test.describe("Role-Based Tab Visibility", () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage to ensure clean state
    await page.goto("http://localhost:3000");
    await page.evaluate(() => {
      localStorage.clear();
    });
    // Reload to apply clean state
    await page.reload();
    await page.waitForLoadState("networkidle");
  });

  test("default state shows only Chat tab (Tech Support Staff default ON)", async ({ page }) => {
    // Wait for the page to fully load
    await page.waitForSelector('[data-testid="mode-tabs"], nav', { timeout: 10000 });

    // With default settings (Tech Support ON, Tester OFF, Programmer OFF),
    // only Chat and Curate tabs should be visible
    // Chat tab should be visible
    const chatTab = page.locator('button:has-text("Chat"), a:has-text("Chat")').first();
    await expect(chatTab).toBeVisible();

    // Curate tab should always be visible
    const curateTab = page.locator('button:has-text("Curate"), a:has-text("Curate")').first();
    await expect(curateTab).toBeVisible();

    // Test and Fix tabs should NOT be visible (roles disabled by default)
    const testTab = page.locator('button:has-text("Test"), a:has-text("Test")').first();
    const fixTab = page.locator('button:has-text("Fix"), a:has-text("Fix")').first();

    // These should not be visible when their roles are disabled
    await expect(testTab).toHaveCount(0).catch(() => {
      // If it exists, it should be hidden
      return expect(testTab).not.toBeVisible();
    });
    await expect(fixTab).toHaveCount(0).catch(() => {
      return expect(fixTab).not.toBeVisible();
    });
  });

  test("settings menu shows all three role toggles", async ({ page }) => {
    // Find and click settings button (gear icon)
    const settingsButton = page.locator('button[aria-label="Open settings menu"], button:has(svg.lucide-settings)').first();
    await settingsButton.click();

    // Wait for dropdown
    await page.waitForSelector('[role="menuitem"], .mac-dropdown-item, [class*="DropdownMenuContent"]');

    // Verify all three roles are present
    await expect(page.getByText("Tech Support Staff")).toBeVisible();
    await expect(page.getByText("Tester")).toBeVisible();
    await expect(page.getByText("Programmer")).toBeVisible();
  });

  test("enabling Tester role shows Test tab", async ({ page }) => {
    // Open settings
    const settingsButton = page.locator('button[aria-label="Open settings menu"], button:has(svg.lucide-settings)').first();
    await settingsButton.click();

    // Wait for dropdown to open
    await page.waitForTimeout(500);

    // Find and click the Tester toggle
    const testerSwitch = page.locator('[role="switch"]').nth(1); // Second switch (0=Tech Support, 1=Tester, 2=Programmer)
    await testerSwitch.click();

    // Close dropdown by clicking elsewhere
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);

    // Now Test tab should be visible
    const testTab = page.locator('button:has-text("Test"), a:has-text("Test")').first();
    await expect(testTab).toBeVisible();
  });

  test("enabling Programmer role shows Fix tab", async ({ page }) => {
    // Open settings
    const settingsButton = page.locator('button[aria-label="Open settings menu"], button:has(svg.lucide-settings)').first();
    await settingsButton.click();
    await page.waitForTimeout(500);

    // Find and click the Programmer toggle (third switch)
    const programmerSwitch = page.locator('[role="switch"]').nth(2);
    await programmerSwitch.click();

    // Close dropdown
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);

    // Now Fix tab should be visible
    const fixTab = page.locator('button:has-text("Fix"), a:has-text("Fix")').first();
    await expect(fixTab).toBeVisible();
  });

  test("disabling Tech Support hides Chat tab", async ({ page }) => {
    // Enable Tester first so we have another tab to fall back to
    const settingsButton = page.locator('button[aria-label="Open settings menu"], button:has(svg.lucide-settings)').first();
    await settingsButton.click();
    await page.waitForTimeout(500);

    // Enable Tester
    const testerSwitch = page.locator('[role="switch"]').nth(1);
    await testerSwitch.click();
    await page.waitForTimeout(200);

    // Disable Tech Support (first switch)
    const techSupportSwitch = page.locator('[role="switch"]').nth(0);
    await techSupportSwitch.click();

    // Close dropdown
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);

    // Chat tab should now be hidden
    const chatTab = page.locator('button:has-text("Chat"), a:has-text("Chat")');
    await expect(chatTab).toHaveCount(0).catch(() => {
      return expect(chatTab).not.toBeVisible();
    });

    // Test tab should be visible
    const testTab = page.locator('button:has-text("Test"), a:has-text("Test")').first();
    await expect(testTab).toBeVisible();
  });

  test("role states persist after page reload", async ({ page }) => {
    // Enable Tester role
    const settingsButton = page.locator('button[aria-label="Open settings menu"], button:has(svg.lucide-settings)').first();
    await settingsButton.click();
    await page.waitForTimeout(500);

    const testerSwitch = page.locator('[role="switch"]').nth(1);
    await testerSwitch.click();
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);

    // Verify Test tab is visible before reload
    let testTab = page.locator('button:has-text("Test"), a:has-text("Test")').first();
    await expect(testTab).toBeVisible();

    // Reload page
    await page.reload();
    await page.waitForLoadState("networkidle");

    // Test tab should still be visible after reload
    testTab = page.locator('button:has-text("Test"), a:has-text("Test")').first();
    await expect(testTab).toBeVisible();
  });
});
