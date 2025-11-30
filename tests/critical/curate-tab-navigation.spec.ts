/**
 * CRITICAL: Curate Tab Navigation Test
 *
 * Tests that clicking the Curate navigation button doesn't cause console errors.
 * This test was created because automated UI tests weren't actually clicking the buttons.
 */

import { test, expect } from '../fixtures/base-test';
import { setupConsoleMonitoring, getConsoleMonitor } from "../helpers/console-monitor";

test.describe("Curate Tab Navigation - CRITICAL @smoke", () => {
  test.beforeEach(async ({ page }) => {
    setupConsoleMonitoring(page, {
      ignoreWarnings: true,
      ignoreNetworkErrors: false,
      useDefaultFilters: true,
    });

    // Use production URL with auth bypass for testing
    const testUrl = process.env.BASE_URL || "http://localhost:3000";

    // Set bypass auth cookie if on localhost
    if (testUrl.includes("localhost")) {
      await page.context().addCookies([
        {
          name: "bypass_auth",
          value: "true",
          domain: "localhost",
          path: "/",
        },
      ]);
    }

    await page.goto(testUrl);
    await page.waitForLoadState("domcontentloaded");

    // Wait for app to be ready (sidebar should be visible)
    await page
      .waitForSelector('button:has-text("Chat"), [data-sidebar="trigger"]', { timeout: 10000 })
      .catch(() => {
        console.log("⚠️  App sidebar not ready - may need authentication");
      });
  });

  test("CRITICAL: Clicking Curate button should not cause React errors", async ({ page }) => {
    console.log("🎯 Testing Curate tab navigation...\\n");

    const monitor = getConsoleMonitor();
    monitor.reset();

    // Wait for page to be fully loaded
    await page.waitForTimeout(1000);

    // Try to find and click the Curate button in the sidebar
    const curateButton = page.locator("button").filter({ hasText: "Curate" }).first();

    const isVisible = await curateButton.isVisible().catch(() => false);

    if (!isVisible) {
      console.log("⚠️  Curate button not visible - trying alternative selectors...");

      // Try alternative selectors
      const alternatives = [
        page.locator('[data-tab="curate"]'),
        page.locator('button:has-text("Curate")'),
        page.getByRole("button", { name: /curate/i }),
      ];

      let found = false;
      for (const alt of alternatives) {
        const visible = await alt.isVisible().catch(() => false);
        if (visible) {
          console.log("✅ Found Curate button with alternative selector");
          await alt.click();
          found = true;
          break;
        }
      }

      if (!found) {
        throw new Error("Could not find Curate button - test cannot proceed");
      }
    } else {
      console.log("✅ Found Curate button");
      await curateButton.click();
    }

    // Wait for the tab to load
    await page.waitForTimeout(2000);

    // Check for console errors
    const errors = monitor.getErrors();

    console.log(`\\n📊 Console errors after clicking Curate: ${errors.length}`);

    if (errors.length > 0) {
      console.log("\\n❌ ERRORS FOUND:");
      errors.forEach((err, i) => console.log(`  ${i + 1}. ${err}`));
    }

    // CRITICAL: No React errors should occur
    expect(errors).toHaveLength(0);

    // Verify the Curate content is visible
    const curateContent = page
      .locator("text=Knowledge Curation")
      .or(page.locator("text=Curation").or(page.locator("text=Files")));

    const contentVisible = await curateContent.isVisible({ timeout: 5000 }).catch(() => false);

    console.log(`\\n📄 Curate content visible: ${contentVisible ? "YES ✅" : "NO ❌"}`);

    expect(contentVisible).toBe(true);
  });

  test("CRITICAL: All navigation tabs should load without errors", async ({ page }) => {
    console.log("🎯 Testing ALL tab navigation...\\n");

    const tabs = [
      { name: "Chat", selector: 'button:has-text("Chat")' },
      { name: "HUD", selector: 'button:has-text("HUD")' },
      { name: "Test", selector: 'button:has-text("Test")' },
      { name: "Fix", selector: 'button:has-text("Fix")' },
      { name: "Curate", selector: 'button:has-text("Curate")' },
    ];

    for (const tab of tabs) {
      const monitor = getConsoleMonitor();
      monitor.reset();

      console.log(`  🖱️  Clicking: ${tab.name}`);

      const button = page.locator(tab.selector).first();

      // CRITICAL: Do NOT skip invisible buttons - FAIL the test instead!
      // If a button isn't visible, that's a bug that needs to be fixed
      await expect(button).toBeVisible({ timeout: 5000 });

      await button.click();
      await page.waitForTimeout(1500);

      const errors = monitor.getErrors();

      if (errors.length > 0) {
        console.log(`    ❌ ${tab.name} has ${errors.length} console errors:`);
        errors.forEach((err, i) => console.log(`       ${i + 1}. ${err.substring(0, 100)}...`));
      } else {
        console.log(`    ✅ ${tab.name} loaded with 0 errors`);
      }

      expect(errors).toHaveLength(0);
    }

    console.log("\\n✅ All navigation tabs passed");
  });
});
