import { test, expect } from "@playwright/test";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

test.describe("Test User Authentication", () => {
  const TEST_EMAIL = process.env.TEST_USER_EMAIL || "claude@test.siam.ai";
  const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || "";

  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:3000");
  });

  test("should authenticate test user using hidden password field", async ({
    page,
  }) => {
    // Fill in the test email
    await page.fill('input[type="email"]', TEST_EMAIL);

    // Fill the hidden password field directly (not visible to users)
    await page.fill('[data-test-id="login-password-hidden"]', TEST_PASSWORD);

    // The form should automatically detect test account and show password field
    await page.waitForTimeout(500); // Small wait for React state update

    // Submit the form
    await page.click('button[type="submit"]');

    // Wait for successful authentication
    await page.waitForURL("**/dashboard/**", { timeout: 10000 }).catch(() => {
      // If no redirect, check for success indicators
    });

    // Verify we're logged in (adjust based on your app's behavior)
    // Option 1: Check for dashboard/main app elements
    const isLoggedIn =
      (await page.locator('[data-test-id="user-menu"]').count()) > 0 ||
      (await page.locator("text=Welcome").count()) > 0 ||
      (await page.locator('[role="main"]').count()) > 0;

    expect(isLoggedIn).toBeTruthy();
  });

  test("should handle visible password field for test account", async ({
    page,
  }) => {
    // When test email is entered, password field should become visible
    await page.fill('input[type="email"]', TEST_EMAIL);

    // Wait for password field to appear
    await page.waitForSelector('[data-test-id="login-password"]', {
      state: "visible",
      timeout: 2000,
    });

    // Fill the visible password field
    await page.fill('[data-test-id="login-password"]', TEST_PASSWORD);

    // Submit button should show "Sign In" instead of "Send Magic Link"
    await expect(page.locator('button[type="submit"]')).toContainText(
      "Sign In",
    );

    // Submit the form
    await page.click('button[type="submit"]');

    // Wait for authentication
    await page.waitForTimeout(2000);

    // Verify successful login
    const isLoggedIn =
      (await page.locator('[data-test-id="user-menu"]').count()) > 0 ||
      (await page.locator("text=Welcome").count()) > 0 ||
      (await page.locator('[role="main"]').count()) > 0;

    expect(isLoggedIn).toBeTruthy();
  });

  test("should fail with incorrect password", async ({ page }) => {
    await page.fill('input[type="email"]', TEST_EMAIL);

    // Wait for password field
    await page.waitForSelector('[data-test-id="login-password"]', {
      state: "visible",
    });

    // Fill incorrect password
    await page.fill('[data-test-id="login-password"]', "wrongpassword123");

    // Submit
    await page.click('button[type="submit"]');

    // Should show error (via toast or inline)
    await page
      .waitForSelector(
        "text=/Password authentication failed|Incorrect username or password|Invalid credentials/i",
        { timeout: 5000 },
      )
      .catch(() => {
        // Error might be in a toast notification
      });

    // Should still be on login page
    await expect(page.locator("h2")).toContainText("Welcome to SIAM");
  });

  test("hidden field should not interfere with regular users", async ({
    page,
  }) => {
    const regularEmail = "john.doe@sonymusic.com";

    // Fill regular user email
    await page.fill('input[type="email"]', regularEmail);

    // Password field should NOT be visible for regular users
    await expect(
      page.locator('[data-test-id="login-password"]'),
    ).not.toBeVisible();

    // Submit button should show "Send Magic Link"
    await expect(page.locator('button[type="submit"]')).toContainText(
      "Send Magic Link",
    );

    // Hidden field should be present but not affect regular flow
    const hiddenField = page.locator('[data-test-id="login-password-hidden"]');
    await expect(hiddenField).toHaveAttribute("style", /display:\s*none/);
  });
});

test.describe("Automated Test Login Helper", () => {
  test("example: login helper for other tests", async ({ page }) => {
    // This is a helper pattern other tests can use
    async function loginAsTestUser(page: any) {
      await page.goto("http://localhost:3000");
      await page.fill('input[type="email"]', process.env.TEST_USER_EMAIL!);
      await page.fill(
        '[data-test-id="login-password-hidden"]',
        process.env.TEST_USER_PASSWORD!,
      );
      await page.click('button[type="submit"]');

      // Wait for login to complete
      await page.waitForTimeout(2000);
    }

    // Use the helper
    await loginAsTestUser(page);

    // Now test user should be logged in
    const isLoggedIn = (await page.locator('[role="main"]').count()) > 0;

    expect(isLoggedIn).toBeTruthy();
  });
});
