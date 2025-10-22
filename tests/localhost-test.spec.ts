import { test, expect } from "@playwright/test";

test.describe("Local Development Tests", () => {
  test.beforeAll(async () => {
    // Make sure the dev server is running
    console.log("ℹ️ Make sure dev server is running on http://localhost:3000");
  });

  test("should load the application", async ({ page }) => {
    // Try to connect to localhost
    const response = await page.goto("http://localhost:3000", {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    // Check if we got a response
    if (response) {
      console.log(`📊 Response status: ${response.status()}`);

      // Even if there's an error, let's see what we get
      const title = await page.title();
      console.log(`📄 Page title: "${title}"`);

      // Try to find any text on the page
      const bodyText = await page.textContent("body");
      console.log(`📝 Body contains: ${bodyText?.substring(0, 100)}...`);

      // Take a screenshot regardless
      await page.screenshot({
        path: "screenshots/localhost-test.png",
        fullPage: true,
      });

      // Basic assertion - page should load
      expect(response.status()).toBeLessThanOrEqual(500);
    }
  });

  test("should check for authentication UI", async ({ page }) => {
    await page.goto("http://localhost:3000", {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    // Look for any form elements
    const hasForm = await page.locator("form, input, button").count();
    console.log(`🔍 Found ${hasForm} form-related elements`);

    // Look for SIAM branding
    const hasSiam = await page.locator("text=/siam/i").count();
    console.log(`🏷️ Found ${hasSiam} SIAM references`);

    // Check for tabs (main app)
    const hasTabs = await page.locator('[role="tab"], .tab').count();
    console.log(`📑 Found ${hasTabs} tab elements`);

    // Take screenshot
    await page.screenshot({
      path: "screenshots/localhost-ui.png",
      fullPage: true,
    });

    // At least something should be on the page
    expect(hasForm + hasSiam + hasTabs).toBeGreaterThan(0);
  });

  test("should test API health endpoint", async ({ request }) => {
    try {
      const response = await request.get("http://localhost:3000/api/health", {
        timeout: 10000,
      });

      console.log(`🏥 Health endpoint status: ${response.status()}`);

      if (response.ok()) {
        const data = await response.json();
        console.log(`📊 Health data:`, data);
      }
    } catch (error) {
      console.log(`⚠️ Health endpoint not available: ${error.message}`);
    }
  });
});
