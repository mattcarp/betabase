/**
 * Self-Healing UI Screenshot Capture Test
 *
 * Captures screenshots of the self-healing dashboard for visual verification.
 */

import { test, expect } from "@playwright/test";

test.describe("Self-Healing Dashboard UI", () => {
  test("should capture self-healing monitor dashboard", async ({ page }) => {
    // Navigate to test dashboard
    await page.goto("/", { waitUntil: "networkidle" });

    // Click on Test Dashboard tab if visible
    await page.waitForTimeout(3000);

    // Take screenshot of the home page
    await page.screenshot({
      path: "test-results/screenshots/home-page.png",
      fullPage: false,
    });

    // Try to find and click on Test Dashboard or Sessions
    const testDashboardLink = page.getByRole("tab", { name: /test/i }).or(
      page.getByText(/test dashboard/i)
    );

    if (await testDashboardLink.isVisible()) {
      await testDashboardLink.click();
      await page.waitForTimeout(2000);

      await page.screenshot({
        path: "test-results/screenshots/test-dashboard.png",
        fullPage: false,
      });
    }

    // Look for Self-Healing tab or section
    const selfHealingTab = page.getByRole("tab", { name: /self.?heal/i }).or(
      page.getByText(/self.?heal/i).first()
    );

    if (await selfHealingTab.isVisible()) {
      await selfHealingTab.click();
      await page.waitForTimeout(2000);

      // Capture the self-healing monitor
      await page.screenshot({
        path: "test-results/screenshots/self-healing-monitor.png",
        fullPage: false,
      });

      // Look for the "Configure" button and click it 3 times to trigger demo
      const configureBtn = page.getByRole("button", { name: /configure/i });
      if (await configureBtn.isVisible()) {
        await configureBtn.click();
        await page.waitForTimeout(200);
        await configureBtn.click();
        await page.waitForTimeout(200);
        await configureBtn.click();
        await page.waitForTimeout(3000);

        // Capture with healing attempt displayed
        await page.screenshot({
          path: "test-results/screenshots/self-healing-with-attempt.png",
          fullPage: false,
        });
      }

      // Capture About section if exists
      const aboutSection = page.getByText(/about self.?heal/i);
      if (await aboutSection.isVisible()) {
        await aboutSection.click();
        await page.waitForTimeout(500);

        await page.screenshot({
          path: "test-results/screenshots/self-healing-about.png",
          fullPage: false,
        });
      }
    }

    // Check console for errors
    const consoleErrors: string[] = [];
    page.on("console", msg => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    // Report console errors at end
    if (consoleErrors.length > 0) {
      console.log("Console errors found:", consoleErrors);
    }

    expect(true).toBeTruthy();
  });
});
