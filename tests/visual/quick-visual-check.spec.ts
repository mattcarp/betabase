import { test, expect } from '../fixtures/base-test';
import { setupConsoleMonitoring, assertNoConsoleErrors } from "../helpers/console-monitor";

test.describe("Quick Visual Check - Identify Regressions", () => {
  test.beforeEach(async ({ page }) => {
    setupConsoleMonitoring(page, {
      ignoreWarnings: true,
      ignoreNetworkErrors: true,
    });
  });

  test.afterEach(async () => {
    assertNoConsoleErrors();
  });

  test("capture current UI state and console errors", async ({ page }) => {
    // Navigate with a shorter timeout and don't wait for networkidle
    await page.goto("http://localhost:3000/", {
      waitUntil: "domcontentloaded",
      timeout: 10000,
    });

    // Wait a bit for initial render
    await page.waitForTimeout(2000);

    // Take full page screenshot
    await page.screenshot({
      path: "test-results/visual-regression-check.png",
      fullPage: true,
    });

    // Take screenshot of viewport only
    await page.screenshot({
      path: "test-results/visual-regression-viewport.png",
      fullPage: false,
    });

    // Check body background color
    const bodyBg = await page.evaluate(() => {
      return window.getComputedStyle(document.body).backgroundColor;
    });

    // Check main container background
    const mainBg = await page.evaluate(() => {
      const main = document.querySelector("main");
      return main ? window.getComputedStyle(main).backgroundColor : null;
    });

    // Check if we have the app container
    const appContainer = page.locator('[data-testid="app-container"]');
    const appContainerExists = await appContainer.count();

    // Log findings
    console.log("\n=== VISUAL REGRESSION ANALYSIS ===");
    console.log("Body background:", bodyBg);
    console.log("Main background:", mainBg);
    console.log("App container found:", appContainerExists > 0);
    console.log("\n=== Console Errors ===");
    consoleErrors.forEach((err) => console.log("ERROR:", err));
    console.log("\n=== All Console Logs (last 20) ===");
    consoleLogs.slice(-20).forEach((log) => console.log(log));

    // Check for button styling issues
    const buttons = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      return buttons.slice(0, 5).map((btn) => {
        const styles = window.getComputedStyle(btn);
        return {
          text: btn.textContent?.trim().substring(0, 20),
          backgroundColor: styles.backgroundColor,
          color: styles.color,
          border: styles.border,
          classes: btn.className,
        };
      });
    });

    console.log("\n=== Button Styles (first 5) ===");
    buttons.forEach((btn, i) => {
      console.log(`Button ${i}:`, JSON.stringify(btn, null, 2));
    });
  });
});
