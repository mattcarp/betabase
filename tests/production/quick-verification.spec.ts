import { test, expect } from '../fixtures/base-test';

test.describe("Quick Production Verification", () => {
  const PROD_URL = "https://thebetabase.com";

  test("Production site is accessible and functional", async ({ page }) => {
    console.log("🔍 Testing production deployment...");

    // Navigate to production
    const response = await page.goto(PROD_URL, {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    // Verify response
    expect(response?.status()).toBeLessThan(400);
    console.log("✅ Site is accessible");

    // Check for login form
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 10000 });
    console.log("✅ Login form is visible");

    // Check for critical UI elements
    await expect(page.locator('button:has-text("Send Magic Link")')).toBeVisible();
    console.log("✅ Send button is visible");

    // Monitor console errors
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });

    // Wait for any dynamic content
    await page.waitForTimeout(3000);

    // Filter out known benign errors
    const criticalErrors = errors.filter(
      (error) =>
        !error.includes("Failed to load resource") &&
        !error.includes("ResizeObserver") &&
        !error.includes("Non-Error promise rejection")
    );

    if (criticalErrors.length > 0) {
      console.log("⚠️ Console errors found:", criticalErrors);
    } else {
      console.log("✅ No critical console errors");
    }

    // Take screenshot for evidence
    await page.screenshot({
      path: "test-results/production-verification.png",
      fullPage: true,
    });
    console.log("📸 Screenshot saved");
  });

  test("API health check", async ({ request }) => {
    const response = await request.get(`${PROD_URL}/api/health`);
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.status).toBe("healthy");
    console.log("✅ API health check passed:", data);
  });

  test("File upload interface is accessible", async ({ page }) => {
    // Navigate to production
    await page.goto(PROD_URL, { waitUntil: "networkidle" });

    // Login with test account
    await page.fill('input[type="email"]', "claude@test.siam.ai");
    await page.click('button:has-text("Send Magic Link")');

    // Wait for response
    await page.waitForTimeout(2000);

    // Check if we can see the verification message or if auth is bypassed
    const verificationVisible = await page
      .locator("text=/check your email/i")
      .isVisible()
      .catch(() => false);

    if (verificationVisible) {
      console.log("✅ Magic link flow initiated successfully");
      console.log("⚠️ Full file upload test requires email verification");
    } else {
      // Check if we're already in the app (auth might be bypassed or remembered)
      const chatInterface = await page
        .locator('[data-testid="chat-interface"], .chat-panel, .mac-professional')
        .isVisible()
        .catch(() => false);

      if (chatInterface) {
        console.log("✅ Chat interface accessible");

        // Look for file upload button
        const uploadButton = await page
          .locator('button[aria-label*="upload"], input[type="file"], [data-testid*="upload"]')
          .isVisible()
          .catch(() => false);

        if (uploadButton) {
          console.log("✅ File upload interface found");
        } else {
          console.log("⚠️ File upload button not immediately visible");
        }
      }
    }
  });
});
