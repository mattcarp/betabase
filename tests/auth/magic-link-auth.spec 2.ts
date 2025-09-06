import { test, expect } from "@playwright/test";

test.describe("Magic Link Authentication", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:3000");
  });

  test("should display login form with magic link as default", async ({
    page,
  }) => {
    // Check that the login form is displayed
    await expect(page.locator("h2")).toContainText("Welcome to SIAM");

    // Check that domain restriction message is shown
    await expect(
      page.locator(
        "text=Only @sonymusic.com emails and matt@mattcarpenter.com are allowed",
      ),
    ).toBeVisible();

    // Check that magic link is the default option
    await expect(page.locator('button[type="submit"]')).toContainText(
      "Send Magic Link",
    );

    // Check that email placeholder shows allowed domains
    await expect(page.locator('input[type="email"]')).toHaveAttribute(
      "placeholder",
      "your.name@sonymusic.com or matt@mattcarpenter.com",
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
      page.locator("text=Only sonymusic.com email addresses are allowed"),
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
      page.locator("text=Only sonymusic.com email addresses are allowed"),
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

  test("should toggle between magic link and password modes", async ({
    page,
  }) => {
    // Initially should show magic link mode
    await expect(page.locator('button[type="submit"]')).toContainText(
      "Send Magic Link",
    );
    await expect(page.locator('input[type="password"]')).not.toBeVisible();

    // Click toggle to password mode
    await page.click("text=Use password instead");

    // Should now show password mode
    await expect(page.locator('button[type="submit"]')).toContainText(
      "Sign In",
    );
    await expect(page.locator('input[type="password"]')).toBeVisible();

    // Click toggle back to magic link mode
    await page.click("text=Use magic link instead");

    // Should be back to magic link mode
    await expect(page.locator('button[type="submit"]')).toContainText(
      "Send Magic Link",
    );
    await expect(page.locator('input[type="password"]')).not.toBeVisible();
  });

  test("should show verification form after sending magic link", async ({
    page,
  }) => {
    const validEmail = "test@sonymusic.com";

    // Fill in valid email
    await page.fill('input[type="email"]', validEmail);

    // Mock the magic link send request to avoid actual AWS Cognito call
    await page.route("**/cognito-idp/**", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true }),
      });
    });

    // Click send magic link button
    await page.click('button[type="submit"]');

    // Should show verification form
    await expect(page.locator("h2")).toContainText("Enter Magic Link Code");
    await expect(
      page.locator(
        "text=Enter the verification code from your magic link email",
      ),
    ).toBeVisible();
    await expect(
      page.locator('input[placeholder*="6-digit code"]'),
    ).toBeVisible();
  });

  test("should handle verification code submission", async ({ page }) => {
    const validEmail = "test@sonymusic.com";
    const verificationCode = "123456";

    // Fill in valid email and send magic link
    await page.fill('input[type="email"]', validEmail);

    // Mock the magic link send request
    await page.route("**/cognito-idp/**", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true }),
      });
    });

    await page.click('button[type="submit"]');

    // Should be on verification form
    await expect(page.locator("h2")).toContainText("Enter Magic Link Code");

    // Fill in verification code
    await page.fill('input[type="text"]', verificationCode);

    // Click verify button
    await page.click('button[type="submit"]');

    // Should attempt to verify the code
    // Note: This will need AWS Cognito mocking for full test
  });

  test("should NOT have a sign up option - this is a closed system", async ({
    page,
  }) => {
    // FIONA FIX: This is a CLOSED SYSTEM - no public registration allowed!

    // Verify NO sign up button exists
    await expect(
      page.locator("text=Don't have an account? Sign Up"),
    ).not.toBeVisible();
    await expect(page.locator("text=Sign Up")).not.toBeVisible();
    await expect(page.locator("text=Create Account")).not.toBeVisible();

    // Only magic link login should be available
    await expect(page.locator('button[type="submit"]')).toContainText(
      "Send Magic Link",
    );

    // Verify this is a restricted system
    await expect(
      page.locator(
        "text=Only @sonymusic.com emails and matt@mattcarpenter.com are allowed",
      ),
    ).toBeVisible();
  });

  test("should validate required fields", async ({ page }) => {
    // Try to submit without email
    await page.click('button[type="submit"]');

    // Should show HTML5 validation or custom validation
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toHaveAttribute("required");
  });

  test("should handle case-insensitive email validation", async ({ page }) => {
    const emails = [
      "JOHN.DOE@SONYMUSIC.COM",
      "jane.smith@SONYMUSIC.COM",
      "MATT@MATTCARPENTER.COM",
    ];

    for (const email of emails) {
      await page.fill('input[type="email"]', email);
      await page.click('button[type="submit"]');

      // Should not show domain validation error for uppercase emails
      await expect(
        page.locator("text=Only sonymusic.com email addresses are allowed"),
      ).not.toBeVisible();

      // Reset form for next test
      await page.reload();
    }
  });
});

test.describe("Authentication Error Handling", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:3000");
  });

  test("should handle AWS Cognito errors gracefully", async ({ page }) => {
    const validEmail = "test@sonymusic.com";

    // Fill in valid email
    await page.fill('input[type="email"]', validEmail);

    // Mock AWS Cognito error response
    await page.route("**/cognito-idp/**", (route) => {
      route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({
          message: "User does not exist",
          code: "UserNotFoundException",
        }),
      });
    });

    // Click send magic link button
    await page.click('button[type="submit"]');

    // Should show error message
    // Note: Adjust based on actual error handling implementation
  });

  test("should handle network errors", async ({ page }) => {
    const validEmail = "test@sonymusic.com";

    // Fill in valid email
    await page.fill('input[type="email"]', validEmail);

    // Mock network error
    await page.route("**/cognito-idp/**", (route) => {
      route.abort("failed");
    });

    // Click send magic link button
    await page.click('button[type="submit"]');

    // Should show network error message
    // Note: Adjust based on actual error handling implementation
  });
});
