/**
 * Console Monitoring Verification Test
 *
 * This test verifies that the base-test fixture correctly
 * catches and fails on console errors.
 *
 * Run with: npx playwright test verify-console-monitoring.spec.ts
 */
import { test, expect } from "./fixtures/base-test";

test.describe("Console Error Monitoring", () => {
  test("should detect page load without errors on production", async ({ page }) => {
    // Navigate to production site
    await page.goto("https://thebetabase.com");
    await page.waitForLoadState("networkidle");

    // Give time for any async errors to surface
    await page.waitForTimeout(3000);

    // If we get here without the afterEach throwing, no console errors occurred
    expect(true).toBe(true);
  });

  test("should catch errors when they occur", async ({ page, consoleErrors }) => {
    // Navigate to production
    await page.goto("https://thebetabase.com");
    await page.waitForLoadState("domcontentloaded");

    // Intentionally trigger a console error via page.evaluate
    await page.evaluate(() => {
      console.error("TEST ERROR: This is an intentional test error");
    });

    // Wait a moment for the error to be captured
    await page.waitForTimeout(500);

    // The consoleErrors array should contain our test error
    const testError = consoleErrors.find(e => e.text.includes("TEST ERROR"));
    expect(testError).toBeDefined();
    expect(testError?.text).toContain("intentional test error");

    // Note: This test will FAIL in afterEach because of the console error
    // That's expected behavior - proving the monitoring works
  });
});

test.describe("Console Error Monitoring - Disabled", () => {
  // Disable console error checking for this group
  test.use({ failOnConsoleError: false });

  test("should allow errors when failOnConsoleError is false", async ({ page, consoleErrors }) => {
    await page.goto("https://thebetabase.com");
    await page.waitForLoadState("domcontentloaded");

    // Trigger an error
    await page.evaluate(() => {
      console.error("TEST ERROR: This error should be captured but not fail the test");
    });

    // Error is captured
    expect(consoleErrors.length).toBeGreaterThan(0);

    // But test should pass because failOnConsoleError is false
  });
});
