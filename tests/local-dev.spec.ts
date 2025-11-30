import { test, expect } from './fixtures/base-test';

test.describe("Local Development Tests", () => {
  // Skip in CI - requires local dev server
  test.skip("should load SIAM application locally @smoke", async ({ page }) => {
    // Test against local development server
    await page.goto("http://localhost:3001", { waitUntil: 'domcontentloaded' });

    // Wait for page to fully load
    await page.waitForLoadState("networkidle");

    // Check for SIAM branding or login form
    const pageContent = await page.content();
    console.log("Page loaded, checking for SIAM elements...");

    // Look for either SIAM text or login elements
    const hasSIAM = pageContent.toLowerCase().includes("siam");
    const hasAuth = pageContent.includes("email") || pageContent.includes("login");

    expect(hasSIAM || hasAuth).toBeTruthy();

    // Take screenshot for verification
    await page.screenshot({
      path: "screenshots/local-dev-test.png",
      fullPage: true,
    });

    console.log("✅ Local development server is working!");
  });

  // Skip in CI - requires local dev server
  test.skip("should check authentication state @smoke", async ({ page }) => {
    await page.goto("http://localhost:3001", { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState("networkidle");

    // Check if we see login form or main app
    const hasLoginForm =
      (await page.locator('input[type="email"], input[placeholder*="email" i]').count()) > 0;
    const hasMainApp = (await page.locator('[role="tab"], nav, .dashboard').count()) > 0;

    console.log(`Authentication state - Login form: ${hasLoginForm}, Main app: ${hasMainApp}`);

    // We should see either login or main app
    expect(hasLoginForm || hasMainApp).toBeTruthy();
  });
});
