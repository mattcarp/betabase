import { test, expect, Page } from "@playwright/test";

/**
 * PRODUCTION TEST TEMPLATE - ALWAYS USE MAILINATOR
 * This is the standard pattern for ALL production tests requiring authentication
 */

test.describe("Production Tests with Mailinator @production", () => {
  const testEmail = `siam-test-${Date.now()}@mailinator.com`;

  /**
   * Helper to get magic link from Mailinator
   */
  async function getMagicLinkFromMailinator(page: Page, email: string): Promise<string> {
    // Navigate to Mailinator inbox
    const username = email.split("@")[0];
    await page.goto(`https://www.mailinator.com/v4/public/inboxes.jsp?to=${username}`, {
      waitUntil: "networkidle",
    });

    // Wait for email to arrive (Mailinator can be slow)
    await page.waitForTimeout(5000);

    // Click on the most recent email
    await page.locator("tr.ng-scope").first().click();

    // Switch to email content frame
    const frame = page.frameLocator("#html_msg_body");

    // Find and extract magic link
    const magicLink = await frame
      .locator('a:has-text("Sign In"), a:has-text("Verify")')
      .getAttribute("href");

    if (!magicLink) {
      throw new Error("Magic link not found in email");
    }

    return magicLink;
  }

  test("should authenticate via Mailinator magic link", async ({ page, context }) => {
    // Step 1: Request magic link
    await page.goto("/"); // Uses baseURL from config (https://siam.onrender.com)
    await page.fill('[data-testid="email-input"], input[type="email"]', testEmail);
    await page.click('[data-testid="magic-link-button"], button:has-text("Send Magic Link")');

    // Wait for confirmation
    await expect(page.locator("text=/check your email/i")).toBeVisible();

    // Step 2: Get magic link from Mailinator in new tab
    const mailinatorPage = await context.newPage();
    const magicLink = await getMagicLinkFromMailinator(mailinatorPage, testEmail);
    await mailinatorPage.close();

    // Step 3: Use magic link to authenticate
    await page.goto(magicLink);

    // Step 4: Verify authentication succeeded
    await expect(page).toHaveURL(/\/dashboard|\/chat|\/app/); // Should redirect to app
    await expect(
      page.locator('[data-testid="user-menu"], [data-testid="logout-button"]')
    ).toBeVisible();
  });

  test("should access protected routes after Mailinator auth", async ({ page, context }) => {
    // Reuse the auth flow
    await page.goto("/");
    await page.fill('[data-testid="email-input"], input[type="email"]', testEmail);
    await page.click('[data-testid="magic-link-button"], button:has-text("Send Magic Link")');
    await expect(page.locator("text=/check your email/i")).toBeVisible();

    const mailinatorPage = await context.newPage();
    const magicLink = await getMagicLinkFromMailinator(mailinatorPage, testEmail);
    await mailinatorPage.close();

    await page.goto(magicLink);
    await expect(page).toHaveURL(/\/dashboard|\/chat|\/app/);

    // Now test protected routes
    await page.goto("/chat");
    await expect(page.locator('[data-testid="chat-interface"]')).toBeVisible();

    await page.goto("/curate");
    await expect(page.locator('[data-testid="upload-area"]')).toBeVisible();
  });
});

/**
 * IMPORTANT NOTES FOR PRODUCTION TESTING:
 *
 * 1. ALWAYS use Mailinator emails (free, no setup required)
 * 2. NEVER hardcode credentials or bypass authentication
 * 3. Each test should use a unique email (timestamp-based)
 * 4. Allow extra time for email delivery (5-10 seconds)
 * 5. Clean up: Mailinator auto-deletes, no cleanup needed
 *
 * Local tests can mock this flow, but production MUST use real Mailinator
 */
