/**
 * E2E tests for role-based tab visibility
 * Tests FEAT-018: Role-Based Contextual Chat System
 *
 * Tech Support Staff is always-on (non-toggleable) - Chat tab always visible
 * Tester and Programmer are toggleable additive roles
 *
 * These tests use localStorage manipulation for role enabling to avoid
 * flaky dropdown interactions. The UI tests for settings are separate.
 */

import { test, expect } from "@playwright/test";

// Increase timeout for E2E tests
test.setTimeout(120000);

// Helper to enable tester role via localStorage
// Must include all state fields that Zustand persist middleware expects
async function enableTesterRole(page: import("@playwright/test").Page) {
  await page.evaluate(() => {
    const testerState = {
      state: {
        isTesterModeEnabled: true,
        ladybugPosition: { x: 50, y: 50 }
      },
      version: 0
    };
    localStorage.setItem("tester-mode-storage", JSON.stringify(testerState));
  });
}

// Helper to enable programmer role via localStorage
async function enableProgrammerRole(page: import("@playwright/test").Page) {
  await page.evaluate(() => {
    const programmerState = {
      state: { isProgrammerModeEnabled: true },
      version: 0
    };
    localStorage.setItem("programmer-mode-storage", JSON.stringify(programmerState));
  });
}

// Helper to disable tester role via localStorage
async function disableTesterRole(page: import("@playwright/test").Page) {
  await page.evaluate(() => {
    const testerState = {
      state: {
        isTesterModeEnabled: false,
        ladybugPosition: { x: 50, y: 50 }
      },
      version: 0
    };
    localStorage.setItem("tester-mode-storage", JSON.stringify(testerState));
  });
}

test.describe("Role-Based Tab Visibility", () => {
  // Run tests serially to avoid localStorage state interference
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page }) => {
    // Clear localStorage to ensure clean state
    // Use domcontentloaded - ElevenLabs widget blocks load event
    await page.goto("http://localhost:3000", {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await page.evaluate(() => {
      localStorage.clear();
    });
    // Reload to apply clean state
    await page.reload({ waitUntil: "domcontentloaded", timeout: 30000 });
    // Wait for main UI to be visible
    await page.waitForSelector('button:has-text("Chat"), a:has-text("Chat")', {
      timeout: 30000,
    });
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

  test("enabling Tester role shows Test tab", async ({ page }) => {
    // Enable tester role via localStorage
    await enableTesterRole(page);

    // Verify localStorage was set correctly
    const storedState = await page.evaluate(() => {
      return localStorage.getItem("tester-mode-storage");
    });
    expect(storedState).toContain("isTesterModeEnabled");

    // Force full page reload to pick up localStorage state
    await page.reload({ waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForSelector('button:has-text("Chat"), a:has-text("Chat")', { timeout: 30000 });

    // Now Test tab should be visible
    const testTab = page.locator('button:has-text("Test"), a:has-text("Test")').first();
    await expect(testTab).toBeVisible({ timeout: 10000 });

    // Chat tab should still be visible
    const chatTab = page.locator('button:has-text("Chat"), a:has-text("Chat")').first();
    await expect(chatTab).toBeVisible();
  });

  test("enabling Programmer role shows Fix tab", async ({ page }) => {
    // Enable programmer role via localStorage
    await enableProgrammerRole(page);

    // Verify localStorage was set correctly and parse to check value
    const storedState = await page.evaluate(() => {
      return localStorage.getItem("programmer-mode-storage");
    });
    expect(storedState).toBeTruthy();
    const parsed = JSON.parse(storedState!);
    expect(parsed.state.isProgrammerModeEnabled).toBe(true);

    // Force full page reload to pick up localStorage state
    await page.reload({ waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForSelector('button:has-text("Chat"), a:has-text("Chat")', { timeout: 30000 });

    // Now Fix tab should be visible
    const fixTab = page.locator('button:has-text("Fix"), a:has-text("Fix")').first();
    await expect(fixTab).toBeVisible({ timeout: 10000 });

    // Chat tab should still be visible
    const chatTab = page.locator('button:has-text("Chat"), a:has-text("Chat")').first();
    await expect(chatTab).toBeVisible();
  });

  test("enabling both Tester and Programmer shows all four tabs", async ({ page }) => {
    // Enable both roles via localStorage
    await enableTesterRole(page);
    await enableProgrammerRole(page);

    // Verify localStorage was set correctly
    const testerState = await page.evaluate(() => localStorage.getItem("tester-mode-storage"));
    const programmerState = await page.evaluate(() => localStorage.getItem("programmer-mode-storage"));
    expect(testerState).toContain("isTesterModeEnabled");
    expect(programmerState).toContain("isProgrammerModeEnabled");

    // Force full page reload to pick up localStorage state
    await page.reload({ waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForSelector('button:has-text("Chat"), a:has-text("Chat")', { timeout: 30000 });

    // All four tabs should be visible
    await expect(page.locator('button:has-text("Chat"), a:has-text("Chat")').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('button:has-text("Test"), a:has-text("Test")').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('button:has-text("Fix"), a:has-text("Fix")').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('button:has-text("Curate"), a:has-text("Curate")').first()).toBeVisible({ timeout: 10000 });
  });

  test("role states persist after page reload", async ({ page }) => {
    // Enable Tester role via localStorage
    await enableTesterRole(page);

    // Verify localStorage was set
    const storedState = await page.evaluate(() => localStorage.getItem("tester-mode-storage"));
    expect(storedState).toContain("isTesterModeEnabled");

    // Force full page reload to pick up localStorage state
    await page.reload({ waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForSelector('button:has-text("Chat"), a:has-text("Chat")', { timeout: 30000 });

    // Verify Test tab is visible after initial reload
    let testTab = page.locator('button:has-text("Test"), a:has-text("Test")').first();
    await expect(testTab).toBeVisible({ timeout: 10000 });

    // Reload page again to test persistence
    await page.reload({ waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForSelector('button:has-text("Chat"), a:has-text("Chat")', { timeout: 30000 });

    // Test tab should still be visible after second reload (localStorage persists)
    testTab = page.locator('button:has-text("Test"), a:has-text("Test")').first();
    await expect(testTab).toBeVisible({ timeout: 10000 });

    // Chat tab should still be visible (always-on)
    const chatTab = page.locator('button:has-text("Chat"), a:has-text("Chat")').first();
    await expect(chatTab).toBeVisible();
  });

  test("disabling role while on that tab redirects to Chat", async ({ page }) => {
    // Enable Tester role and navigate to Test tab
    await enableTesterRole(page);

    // Verify localStorage was set
    const storedState = await page.evaluate(() => localStorage.getItem("tester-mode-storage"));
    expect(storedState).toContain("isTesterModeEnabled");

    // Force reload to pick up localStorage
    await page.reload({ waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForSelector('button:has-text("Test"), a:has-text("Test")', { timeout: 30000 });

    // Click on Test tab
    const testTab = page.locator('button:has-text("Test"), a:has-text("Test")').first();
    await testTab.click();
    await page.waitForTimeout(500);

    // Verify we're on Test tab (URL hash)
    await expect(page).toHaveURL(/#test/);

    // Disable Tester role via localStorage
    await disableTesterRole(page);

    // Verify localStorage was updated
    const updatedState = await page.evaluate(() => localStorage.getItem("tester-mode-storage"));
    expect(updatedState).toContain("false");

    // Force reload to pick up localStorage change
    await page.reload({ waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForSelector('button:has-text("Chat"), a:has-text("Chat")', { timeout: 30000 });

    // Test tab should no longer be visible
    const testTabCount = await page.locator('button:has-text("Test"), a:has-text("Test")').count();
    expect(testTabCount).toBe(0);

    // Chat tab should be visible
    const chatTab = page.locator('button:has-text("Chat"), a:has-text("Chat")').first();
    await expect(chatTab).toBeVisible();
  });
});


