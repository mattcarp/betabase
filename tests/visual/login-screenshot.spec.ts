import { test, expect } from '../fixtures/base-test';
import { setupConsoleMonitoring, assertNoConsoleErrors } from "../helpers/console-monitor";

/**
 * SIAM Login Page Screenshot Test
 * Captures the login page to show MAC Design System integration
 */

test.describe("Login Page Screenshot", () => {
  test.beforeEach(async ({ page }) => {
    setupConsoleMonitoring(page, {
      ignoreWarnings: true,
      ignoreNetworkErrors: true,
    });
  });

  test.afterEach(async () => {
    assertNoConsoleErrors();
  });

  test("capture login page with MAC Design System", async ({ page }) => {
    // Navigate to the login page
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Wait for any animations or loading states to complete
    await page.waitForTimeout(2000);

    // Take full page screenshot
    await page.screenshot({
      path: "login-page-screenshot.png",
      fullPage: true,
    });

    // Also take a focused screenshot of the login form if it exists
    const loginForm = page.locator('form, [data-testid="login-form"], .login-form');
    if (await loginForm.isVisible()) {
      await loginForm.screenshot({
        path: "login-form-screenshot.png",
      });
    }

    // Check if we can see MAC Design System elements
    const macElements = page.locator(".mac-surface-bg, .mac-card, .mac-button");
    if (await macElements.first().isVisible()) {
      console.log("✅ MAC Design System elements detected");
    }

    // Check for any obvious errors
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });

    console.log(`Page title: ${await page.title()}`);
    console.log(`Current URL: ${page.url()}`);
  });
});
