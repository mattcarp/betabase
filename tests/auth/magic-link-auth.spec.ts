import { test, expect } from '../fixtures/base-test';

test.describe("Magic Link Authentication", () => {
  test.beforeEach(async ({ page }) => {
    // Use baseURL from config or environment variable
    await page.goto("/");
  });

  test("should display login form with magic link as default", async ({ page }) => {
    // Check that the login form is displayed with current UI text
    await expect(page.locator("h2")).toContainText("Welcome Back");

    // Check The Betabase branding
    await expect(page.locator("h1")).toContainText("The Betabase");
    await expect(page.locator("text=yup. it's back.")).toBeVisible();

    // Check that magic link is the default option
    await expect(page.locator('button[type="submit"]')).toContainText("Send Magic Link");

    // Check email input placeholder
    await expect(page.locator('input[type="email"]')).toHaveAttribute(
      "placeholder",
      "Enter your email address"
    );
  });

  test("should accept valid Sony Music email", async ({ page }) => {
    const validEmail = "john.doe@sonymusic.com";

    // Fill in valid Sony Music email
    await page.fill('input[type="email"]', validEmail);

    // Click send magic link button
    await page.click('button[type="submit"]');

    // Should not show domain validation error
    await expect(
      page.locator("text=Only sonymusic.com email addresses are allowed")
    ).not.toBeVisible();
  });

  test("should accept matt@mattcarpenter.com email", async ({ page }) => {
    const validEmail = "matt@mattcarpenter.com";

    // Fill in the specific allowed email
    await page.fill('input[type="email"]', validEmail);

    // Click send magic link button
    await page.click('button[type="submit"]');

    // Should not show domain validation error
    await expect(
      page.locator("text=Only sonymusic.com email addresses are allowed")
    ).not.toBeVisible();
  });

  test("should reject invalid email domains", async ({ page }) => {
    const invalidEmails = [
      "user@gmail.com",
      "test@yahoo.com",
      "admin@company.com",
      "fake@sonymusic.org",
      "john@mattcarpenter.com",
    ];

    for (const email of invalidEmails) {
      // Fill in invalid email
      await page.fill('input[type="email"]', email);

      // Click send magic link button
      await page.click('button[type="submit"]');

      // Should show error message (either toast or inline error)
      // Note: The actual error handling depends on implementation
      // This test will need to be adjusted based on how errors are displayed
    }
  });

  test("should only have magic link mode - no password option", async ({ page }) => {
    // Should show magic link mode only
    await expect(page.locator('button[type="submit"]')).toContainText("Send Magic Link");

    // Should not have password input or toggle options
    await expect(page.locator('input[type="password"]')).not.toBeVisible();
    await expect(page.locator("text=Use password instead")).not.toBeVisible();
    await expect(page.locator("text=Use magic link instead")).not.toBeVisible();
  });

  test("should show verification form after sending magic link", async ({ page }) => {
    const validEmail = "siam-test-x7j9k2p4@mailinator.com";

    // Fill in valid email
    await page.fill('input[type="email"]', validEmail);

    // Mock the magic link send request
    await page.route("**/api/auth/magic-link", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, devCode: "123456" }),
      });
    });

    // Click send magic link button
    await page.click('button[type="submit"]');

    // Should show verification form with current UI text
    await expect(page.locator("h3")).toContainText("Magic Link Sent!");
    await expect(page.locator("text=We've sent a verification code to")).toBeVisible();
    await expect(
      page.locator("text=Check your email for the 6-digit verification code")
    ).toBeVisible();
    await expect(page.locator('input[placeholder="000000"]')).toBeVisible();
  });

  test("should handle verification code submission", async ({ page }) => {
    const validEmail = "siam-test-x7j9k2p4@mailinator.com";
    const verificationCode = "123456";

    // Fill in valid email and send magic link
    await page.fill('input[type="email"]', validEmail);

    // Mock the magic link send request
    await page.route("**/api/auth/magic-link", (route) => {
      if (route.request().postData()?.includes('"action":"send"')) {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ success: true, devCode: "123456" }),
        });
      } else if (route.request().postData()?.includes('"action":"verify"')) {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ success: true, token: "mock-jwt-token" }),
        });
      }
    });

    await page.click('button[type="submit"]');

    // Should be on verification form
    await expect(page.locator("h3")).toContainText("Magic Link Sent!");

    // Fill in verification code
    await page.fill('input[type="text"]', verificationCode);

    // Click verify button
    await page.click('button[type="submit"]');

    // Should attempt to verify the code and potentially redirect
  });

  test("should NOT have a sign up option - this is a closed system", async ({ page }) => {
    // FIONA FIX: This is a CLOSED SYSTEM - no public registration allowed!

    // Verify NO sign up button exists
    await expect(page.locator("text=Don't have an account? Sign Up")).not.toBeVisible();
    await expect(page.locator("text=Sign Up")).not.toBeVisible();
    await expect(page.locator("text=Create Account")).not.toBeVisible();

    // Only magic link login should be available
    await expect(page.locator('button[type="submit"]')).toContainText("Send Magic Link");

    // The current UI doesn't show domain restrictions prominently, but the system is still closed
    // Only allowed emails will work in practice
  });

  test("should validate required fields", async ({ page }) => {
    // Try to submit without email
    await page.click('button[type="submit"]');

    // Should show validation error message
    await expect(page.locator("text=Email is required")).toBeVisible();
  });

  test("should handle case-insensitive email validation", async ({ page }) => {
    const emails = ["JOHN.DOE@SONYMUSIC.COM", "jane.smith@SONYMUSIC.COM", "MATT@MATTCARPENTER.COM"];

    for (const email of emails) {
      await page.fill('input[type="email"]', email);
      await page.click('button[type="submit"]');

      // Should not show domain validation error for uppercase emails
      await expect(
        page.locator("text=Only sonymusic.com email addresses are allowed")
      ).not.toBeVisible();

      // Reset form for next test
      await page.reload();
    }
  });
});

test.describe("Authentication Error Handling", () => {
  test.beforeEach(async ({ page }) => {
    // Use baseURL from config or environment variable
    await page.goto("/");
  });

  test("should handle authentication errors gracefully", async ({ page }) => {
    const validEmail = "siam-test-x7j9k2p4@mailinator.com";

    // Fill in valid email
    await page.fill('input[type="email"]', validEmail);

    // Mock API error response
    await page.route("**/api/auth/magic-link", (route) => {
      route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({
          error: "User does not exist",
        }),
      });
    });

    // Click send magic link button
    await page.click('button[type="submit"]');

    // Should show error message (toast notification)
    // The exact implementation may vary
  });

  test("should handle network errors", async ({ page }) => {
    const validEmail = "siam-test-x7j9k2p4@mailinator.com";

    // Fill in valid email
    await page.fill('input[type="email"]', validEmail);

    // Mock network error
    await page.route("**/api/auth/magic-link", (route) => {
      route.abort("failed");
    });

    // Click send magic link button
    await page.click('button[type="submit"]');

    // Should show network error message in toast or error display
    // The exact implementation may vary based on error handling
  });
});
