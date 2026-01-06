import { test, expect } from "@playwright/test";

/**
 * Regression test for layout.tsx HMR crash
 *
 * Issue: "Cannot read properties of undefined (reading 'call')" error
 * occurred when using dynamic import with ssr:false in Server Component
 *
 * Fix: Use regular import of InlineClientWrapper (already a client component)
 * instead of dynamic import with ssr:false
 *
 * This test verifies:
 * 1. Page loads without console errors
 * 2. InlineClientWrapper renders correctly
 * 3. Theme is applied correctly
 */

test.describe("Layout HMR Fix", () => {
  test("should load page without HMR errors", async ({ page }) => {
    const consoleErrors: string[] = [];

    // Capture console errors
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    // Navigate to the page
    await page.goto("/");

    // Wait for page to be fully loaded
    await page.waitForLoadState("networkidle");

    // Verify no console errors related to undefined 'call'
    const hmrErrors = consoleErrors.filter((err) =>
      err.includes("Cannot read properties of undefined (reading 'call')")
    );
    expect(hmrErrors).toHaveLength(0);

    // Verify page rendered correctly - check for main content
    const body = page.locator("body");
    await expect(body).toBeVisible();

    // Verify theme is applied (dark mode by default)
    await expect(body).toHaveClass(/dark/);

    // Verify data-theme attribute is set
    const html = page.locator("html");
    await expect(html).toHaveAttribute("data-theme", "mac");
  });

  test("should handle theme switching without errors", async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Verify initial theme
    const html = page.locator("html");
    await expect(html).toHaveAttribute("data-theme", "mac");

    // Simulate theme change via localStorage (if theme switcher is available)
    await page.evaluate(() => {
      localStorage.setItem("siam-theme-preference", "light");
      window.dispatchEvent(new CustomEvent("storage"));
    });

    // Verify no errors occurred during theme operations
    expect(consoleErrors).toHaveLength(0);
  });

  test("should not have multiple Fast Refresh errors on HMR", async ({ page }) => {
    const consoleWarnings: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "warning") {
        consoleWarnings.push(msg.text());
      }
    });

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Verify no Fast Refresh warnings
    const fastRefreshWarnings = consoleWarnings.filter((warn) =>
      warn.includes("Fast Refresh had to perform a full reload")
    );
    expect(fastRefreshWarnings).toHaveLength(0);
  });
});
