const { test, expect } = require("@playwright/test");

test.describe("SIAM Authentication Flow - Fiona's Critical P0 Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:3000", { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState("networkidle");
  });

  test("P0-1: Login form should be visible and functional", async ({ page }) => {
    // Should show login form since not authenticated
    await expect(page.locator("h2")).toContainText("Welcome to SIAM");

    // Check email field exists and accepts input
    const emailField = page.locator('input[type="email"]');
    await expect(emailField).toBeVisible();
    await emailField.fill("claude@test.siam.ai");

    // Should show password field for test account
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator("text=Test account detected")).toBeVisible();
  });

  test("P0-2: Test account authentication works", async ({ page }) => {
    // Fill in test account credentials
    await page.fill('input[type="email"]', "claude@test.siam.ai");
    await page.fill('input[type="password"]', "4@9XMPfE9B$");

    // Submit login
    await page.click('button[type="submit"]');

    // Should redirect to chat interface after successful login
    await expect(page.locator('[data-testid="app-container"]')).toBeVisible({
      timeout: 10000,
    });

    // Should see the chat interface elements
    await expect(page.locator("main")).toBeVisible();
  });

  test("P0-3: Magic link flow for authorized emails", async ({ page }) => {
    // Test with sony music email
    await page.fill('input[type="email"]', "test@sonymusic.com");

    // Should NOT show password field
    await expect(page.locator('input[type="password"]:visible')).toHaveCount(0);

    // Should show "Send Magic Link" button
    await expect(page.locator('button[type="submit"]')).toContainText("Send Magic Link");
  });

  test("P0-4: Email validation works correctly", async ({ page }) => {
    // Test invalid email domain
    await page.fill('input[type="email"]', "invalid@gmail.com");
    await page.click('button[type="submit"]');

    // Should show error message
    await expect(page.locator("text=Only @sonymusic.com emails")).toBeVisible();
  });

  test("P0-5: Dual email support (Fiona's requirement)", async ({ page }) => {
    // Test both required emails work
    const validEmails = [
      "fiona.burgess.ext@sonymusic.com",
      "fiona@fionaburgess.com",
      "matt@mattcarpenter.com",
    ];

    for (const email of validEmails) {
      await page.fill('input[type="email"]', email);
      await page.click('button[type="submit"]');

      if (email === "claude@test.siam.ai") {
        // Should show password field
        await expect(page.locator('input[type="password"]')).toBeVisible();
      } else {
        // Should attempt to send magic link (won't succeed in test but shouldn't error on email validation)
        await expect(page.locator('button[type="submit"]')).toContainText("Send Magic Link");
      }

      await page.reload();
      await page.waitForLoadState("networkidle");
    }
  });
});
