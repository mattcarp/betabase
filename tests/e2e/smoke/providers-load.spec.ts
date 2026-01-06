import { test, expect } from "@playwright/test";

/**
 * Smoke test for AppProviders loading
 *
 * This test specifically checks for the "Cannot read properties of undefined (reading 'call')"
 * error that occurs when webpack fails to properly load the AppProviders module.
 *
 * The error typically manifests as:
 * - Runtime TypeError at RootLayout (src/app/layout.tsx)
 * - Application fails to render entirely
 * - Console shows "Cannot read properties of undefined (reading 'call')"
 */
test.describe("AppProviders Module Loading @smoke", () => {
  test("should load AppProviders without webpack module errors", async ({ page }) => {
    const criticalErrors: string[] = [];

    // Listen for console errors - specifically the webpack module error
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        const text = msg.text();
        // Check for the specific webpack module loading error
        if (
          text.includes("Cannot read properties of undefined") ||
          text.includes("reading 'call'") ||
          text.includes("AppProviders") ||
          text.includes("module failed to load")
        ) {
          criticalErrors.push(text);
        }
      }
    });

    // Listen for page errors (uncaught exceptions)
    page.on("pageerror", (error) => {
      if (
        error.message.includes("Cannot read properties of undefined") ||
        error.message.includes("reading 'call'")
      ) {
        criticalErrors.push(error.message);
      }
    });

    // Navigate to the page
    await page.goto("http://localhost:3000", { waitUntil: "domcontentloaded" });

    // Wait for visible content (more reliable than networkidle during dev with HMR)
    await page.waitForSelector("body", { timeout: 15000 });
    await page.waitForTimeout(2000); // Allow time for hydration

    // The page should render without the critical error
    expect(criticalErrors).toHaveLength(0);

    // Verify the page actually rendered (not a blank error page)
    const body = await page.locator("body");
    await expect(body).toBeVisible();

    // Verify we have actual content, not an error message
    const pageContent = await page.textContent("body");
    expect(pageContent).not.toContain("Cannot read properties of undefined");
    expect(pageContent).not.toContain("Application error");

    // The Betabase title should be present (proves the app rendered)
    await expect(page).toHaveTitle(/Betabase/i);
  });

  test("should render page content after providers load", async ({ page }) => {
    await page.goto("http://localhost:3000", { waitUntil: "domcontentloaded" });

    // Wait for the main content to load
    await page.waitForSelector("body", { timeout: 10000 });
    await page.waitForTimeout(1000); // Allow hydration

    // Check that we have visible content (not a white screen)
    const hasContent = await page.evaluate(() => {
      return document.body.innerText.length > 50; // More than just whitespace
    });

    expect(hasContent).toBe(true);
  });

  test("should have theme data attribute applied (proves ThemeProvider loaded)", async ({
    page,
  }) => {
    await page.goto("http://localhost:3000", { waitUntil: "domcontentloaded" });

    // Wait for hydration - theme attribute is set by client-side JS
    await page.waitForSelector("body", { timeout: 10000 });
    await page.waitForTimeout(2000); // Allow time for React hydration and ThemeProvider mount

    // Check that the theme data attribute is set (proves ThemeProvider mounted)
    const themeAttr = await page.evaluate(() => {
      return document.documentElement.getAttribute("data-theme");
    });

    // Should be one of our valid themes
    expect(["light", "mac", "jarvis", "aoma"]).toContain(themeAttr);
  });

  test("should not have any console errors about module loading", async ({ page }) => {
    const moduleErrors: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        const text = msg.text();
        // Check for various module loading error patterns
        if (
          text.includes("module") ||
          text.includes("undefined") ||
          text.includes("Cannot read") ||
          text.includes("is not a function") ||
          text.includes("is not defined")
        ) {
          moduleErrors.push(text);
        }
      }
    });

    await page.goto("http://localhost:3000", { waitUntil: "domcontentloaded" });
    await page.waitForSelector("body", { timeout: 10000 });
    await page.waitForTimeout(3000); // Allow time for any module errors to surface

    // Filter out known acceptable errors
    const criticalModuleErrors = moduleErrors.filter(
      (err) =>
        !err.includes("ResizeObserver") && // Layout observation - benign
        !err.includes("postMessage") && // Cross-origin messaging - benign
        !err.includes("websocket") && // Dev server HMR - benign
        !err.includes("WebSocket") // Dev server HMR - benign
    );

    expect(criticalModuleErrors).toHaveLength(0);
  });
});
