import { test, expect } from "@playwright/test";

test.describe("Quick Validation Test", () => {
  test("should load the main app", async ({ page }) => {
    // Navigate to the app
    await page.goto("http://localhost:3000");

    // Wait for the page to load
    await page.waitForLoadState("networkidle");

    // Check for SIAM text
    await expect(page.locator("text=SIAM")).toBeVisible();

    // Check for tabs (indicates app loaded)
    const chatTab = page.locator('button[role="tab"]:has-text("Chat")');
    await expect(chatTab).toBeVisible();

    // Take a screenshot for debugging
    await page.screenshot({ path: "test-screenshot.png", fullPage: true });

    console.log("✅ App loaded successfully!");
  });

  test("should navigate between tabs", async ({ page }) => {
    await page.goto("http://localhost:3000");
    await page.waitForLoadState("networkidle");

    // Click on Curate tab
    await page.click('button[role="tab"]:has-text("Curate")');
    await page.waitForTimeout(500);

    // Check for Curate content
    const curateContent = await page
      .locator("text=/Upload|Curate/i")
      .isVisible();
    expect(curateContent).toBeTruthy();

    // Click on Chat tab
    await page.click('button[role="tab"]:has-text("Chat")');
    await page.waitForTimeout(500);

    console.log("✅ Tab navigation works!");
  });
});
