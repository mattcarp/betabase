import { test, expect } from '../fixtures/base-test';

/**
 * Simplified Mailgun + Cognito Test
 *
 * This test works with the actual Cognito flow:
 * 1. Use a real email address that Cognito can send to
 * 2. That email should forward to Mailgun or be checked manually
 *
 * For automated testing with Mailgun, you need:
 * - A real domain that can receive emails
 * - MX records pointing to Mailgun
 * - OR use a real email and check it manually
 */

test.describe("Magic Link with Real Email", () => {
  test("manual test - send magic link to authorized email", async ({ page }) => {
    // Use YOUR real email that's authorized in Cognito
    const testEmail = "matt@mattcarpenter.com"; // This is already in ALLOWED_EMAILS

    // Navigate to login page
    await page.goto("http://localhost:3000", { waitUntil: 'domcontentloaded' });

    // Request magic link
    await page.fill('input[type="email"]', testEmail);
    await page.click('button[type="submit"]');

    // Should show verification form
    await expect(page.locator("h2")).toContainText("Enter Magic Link Code");

    console.log("✅ Magic link sent to:", testEmail);
    console.log("📧 Check your email for the 6-digit code");
    console.log("");
    console.log("To complete the test:");
    console.log("1. Check your email inbox");
    console.log("2. Find the magic link email from AWS Cognito");
    console.log("3. Enter the 6-digit code in the form");

    // For manual testing, pause here
    await page.pause(); // This opens Playwright Inspector for manual interaction
  });

  test.skip("automated test with email forwarding", async ({ page }) => {
    // This would require setting up email forwarding from a real domain to Mailgun
    // Skip for now as it requires additional infrastructure
  });
});
