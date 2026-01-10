/**
 * E2E tests for role-based tab visibility
 * Tests FEAT-018: Role-Based Contextual Chat System
 *
 * Tech Support Staff is always-on (non-toggleable) - Chat tab always visible
 * Tester and Programmer are toggleable additive roles
 */

import { test, expect } from "@playwright/test";

test.describe("Role-Based Tab Visibility", () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage to ensure clean state
    await page.goto("http://localhost:3000", { timeout: 60000 });
    await page.evaluate(() => {
      localStorage.clear();
    });
    // Reload to apply clean state with extended timeout
    await page.reload({ timeout: 60000 });
    // Wait for main UI to be visible instead of networkidle (more reliable)
    await page.waitForSelector('button:has-text("Chat"), a:has-text("Chat")', { timeout: 30000 });
  });

  test("Chat tab is always visible (Tech Support Staff always-on)", async ({ page }) => {
    // beforeEach already waits for Chat tab, so page is ready

    // Chat tab should always be visible
    const chatTab = page.locator('button:has-text("Chat"), a:has-text("Chat")').first();
    await expect(chatTab).toBeVisible();

    // Curate tab should always be visible
    const curateTab = page.locator('button:has-text("Curate"), a:has-text("Curate")').first();
    await expect(curateTab).toBeVisible();
  });

  test("default state shows only Chat and Curate tabs", async ({ page }) => {
    // beforeEach already waits for page ready

    // Test and Fix tabs should NOT be visible (roles disabled by default)
    const testTabCount = await page.locator('button:has-text("Test"), a:has-text("Test")').count();
    const fixTabCount = await page.locator('button:has-text("Fix"), a:has-text("Fix")').count();

    expect(testTabCount).toBe(0);
    expect(fixTabCount).toBe(0);
  });

  test("settings menu shows Tech Support Staff as always-on", async ({ page }) => {
    // Find and click settings button (gear icon)
    const settingsButton = page.locator('button[aria-label="Open settings menu"], button:has(svg.lucide-settings)').first();
    await settingsButton.click();

    // Wait for dropdown
    await page.waitForSelector('[role="menuitem"], .mac-dropdown-item, [class*="DropdownMenuContent"]');

    // Tech Support Staff should show as always active (no toggle)
    await expect(page.getByText("Tech Support Staff")).toBeVisible();
    await expect(page.getByText("Always active")).toBeVisible();

    // Should show two toggle switches (Tester and Programmer only)
    const switches = page.locator('[role="switch"]');
    await expect(switches).toHaveCount(2);

    // Tester and Programmer should be visible
    await expect(page.getByText("Tester")).toBeVisible();
    await expect(page.getByText("Programmer")).toBeVisible();
  });

  test("enabling Tester role shows Test tab", async ({ page }) => {
    // Open settings
    const settingsButton = page.locator('button[aria-label="Open settings menu"], button:has(svg.lucide-settings)').first();
    await settingsButton.click();

    // Wait for dropdown to open
    await page.waitForTimeout(500);

    // Find and click the Tester toggle (first switch, since Tech Support has no switch)
    const testerSwitch = page.locator('[role="switch"]').first();
    await testerSwitch.click();

    // Close dropdown by clicking elsewhere
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);

    // Now Test tab should be visible
    const testTab = page.locator('button:has-text("Test"), a:has-text("Test")').first();
    await expect(testTab).toBeVisible();

    // Chat tab should still be visible
    const chatTab = page.locator('button:has-text("Chat"), a:has-text("Chat")').first();
    await expect(chatTab).toBeVisible();
  });

  test("enabling Programmer role shows Fix tab", async ({ page }) => {
    // Open settings
    const settingsButton = page.locator('button[aria-label="Open settings menu"], button:has(svg.lucide-settings)').first();
    await settingsButton.click();
    await page.waitForTimeout(500);

    // Find and click the Programmer toggle (second switch)
    const programmerSwitch = page.locator('[role="switch"]').nth(1);
    await programmerSwitch.click();

    // Close dropdown
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);

    // Now Fix tab should be visible
    const fixTab = page.locator('button:has-text("Fix"), a:has-text("Fix")').first();
    await expect(fixTab).toBeVisible();

    // Chat tab should still be visible
    const chatTab = page.locator('button:has-text("Chat"), a:has-text("Chat")').first();
    await expect(chatTab).toBeVisible();
  });

  test("enabling both Tester and Programmer shows all four tabs", async ({ page }) => {
    // Open settings
    const settingsButton = page.locator('button[aria-label="Open settings menu"], button:has(svg.lucide-settings)').first();
    await settingsButton.click();
    await page.waitForTimeout(500);

    // Enable both Tester and Programmer
    const testerSwitch = page.locator('[role="switch"]').first();
    const programmerSwitch = page.locator('[role="switch"]').nth(1);
    await testerSwitch.click();
    await page.waitForTimeout(200);
    await programmerSwitch.click();

    // Close dropdown
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);

    // All four tabs should be visible
    await expect(page.locator('button:has-text("Chat"), a:has-text("Chat")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Test"), a:has-text("Test")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Fix"), a:has-text("Fix")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Curate"), a:has-text("Curate")').first()).toBeVisible();
  });

  test("role states persist after page reload", async ({ page }) => {
    // Enable Tester role
    const settingsButton = page.locator('button[aria-label="Open settings menu"], button:has(svg.lucide-settings)').first();
    await settingsButton.click();
    await page.waitForTimeout(500);

    const testerSwitch = page.locator('[role="switch"]').first();
    await testerSwitch.click();
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);

    // Verify Test tab is visible before reload
    let testTab = page.locator('button:has-text("Test"), a:has-text("Test")').first();
    await expect(testTab).toBeVisible();

    // Reload page with extended timeout
    await page.reload({ timeout: 60000 });
    await page.waitForSelector('button:has-text("Chat"), a:has-text("Chat")', { timeout: 30000 });

    // Test tab should still be visible after reload
    testTab = page.locator('button:has-text("Test"), a:has-text("Test")').first();
    await expect(testTab).toBeVisible();

    // Chat tab should still be visible (always-on)
    const chatTab = page.locator('button:has-text("Chat"), a:has-text("Chat")').first();
    await expect(chatTab).toBeVisible();
  });

  test("disabling role while on that tab redirects to Chat", async ({ page }) => {
    // Enable Tester and navigate to Test tab
    const settingsButton = page.locator('button[aria-label="Open settings menu"], button:has(svg.lucide-settings)').first();
    await settingsButton.click();
    await page.waitForTimeout(500);

    const testerSwitch = page.locator('[role="switch"]').first();
    await testerSwitch.click();
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);

    // Click on Test tab
    const testTab = page.locator('button:has-text("Test"), a:has-text("Test")').first();
    await testTab.click();
    await page.waitForTimeout(300);

    // Disable Tester role
    await settingsButton.click();
    await page.waitForTimeout(300);
    await testerSwitch.click(); // Toggle off
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);

    // Should redirect to Chat tab (first available)
    // URL hash should change to #chat
    await expect(page).toHaveURL(/#chat/);
  });
});
