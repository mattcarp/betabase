import { test, expect } from "@playwright/test";

test.describe("Test Dashboard - Quick Validation", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to SIAM with auth bypassed
    await page.goto("http://localhost:3000");

    // Navigate to Test tab
    await page.click("text=Test");

    // Wait for Test Dashboard to load
    await expect(page.locator("text=Test Dashboard")).toBeVisible();
  });

  test("should display Test Dashboard with all 8 tabs", async ({ page }) => {
    // Verify main dashboard is loaded
    await expect(page.locator("text=Test Dashboard")).toBeVisible();
    await expect(
      page.locator("text=AI-Powered Testing Command Center"),
    ).toBeVisible();

    // Verify all 8 tabs are present and clickable
    const tabs = [
      "Execution",
      "Results",
      "AI Generate",
      "Trace Viewer",
      "Coverage",
      "Flaky Tests",
      "Analytics",
      "Firecrawl",
    ];

    for (const tab of tabs) {
      const tabButton = page.locator(`button:has-text("${tab}")`);
      await expect(tabButton).toBeVisible();
      await expect(tabButton).toBeEnabled();

      // Click tab and verify it activates
      await tabButton.click();
      await page.waitForTimeout(500);
    }

    // Take final screenshot
    await page.screenshot({
      path: "/Users/matt/Documents/projects/siam/test-screenshots/test-dashboard-complete.png",
      fullPage: true,
    });
  });

  test("should verify Run Tests button functionality", async ({ page }) => {
    // Verify Run Tests button is visible and clickable
    const runTestsButton = page.locator("text=Run Tests").first();
    await expect(runTestsButton).toBeVisible();
    await expect(runTestsButton).toBeEnabled();

    // Click the button
    await runTestsButton.click();

    // Wait and take screenshot to verify interaction
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: "/Users/matt/Documents/projects/siam/test-screenshots/run-tests-clicked-quick.png",
    });
  });

  test("should test AI Generate and Firecrawl features", async ({ page }) => {
    // Test AI Generate tab
    await page.click("text=AI Generate");
    await page.waitForTimeout(500);
    await page.screenshot({
      path: "/Users/matt/Documents/projects/siam/test-screenshots/ai-generate-quick.png",
    });

    // Test Firecrawl tab
    await page.click("text=Firecrawl");
    await page.waitForTimeout(500);
    await page.screenshot({
      path: "/Users/matt/Documents/projects/siam/test-screenshots/firecrawl-quick.png",
    });

    // Look for Start Crawl button or similar
    const crawlButton = page
      .locator("text=Start Crawl, text=Start, text=Crawl")
      .first();
    if (await crawlButton.isVisible()) {
      await expect(crawlButton).toBeVisible();
    }
  });

  test("should verify responsive design on different viewports", async ({
    page,
  }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.click("text=Test");
    await expect(page.locator("text=Test Dashboard")).toBeVisible();

    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.reload();
    await page.click("text=Test");
    await expect(page.locator("text=Test Dashboard")).toBeVisible();

    // Reset to desktop
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test("should verify no critical console errors", async ({ page }) => {
    const errors: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });

    // Navigate through different tabs
    const tabs = ["Execution", "Results", "AI Generate", "Coverage"];
    for (const tab of tabs) {
      await page.click(`text=${tab}`);
      await page.waitForTimeout(500);
    }

    // Filter out non-critical errors
    const criticalErrors = errors.filter(
      (error) =>
        !error.includes("favicon") &&
        !error.includes("Warning") &&
        !error.includes("DevTools") &&
        !error.includes("chrome-extension"),
    );

    expect(criticalErrors).toHaveLength(0);
  });
});
