import { test, expect } from '../fixtures/base-test';
import { MailgunTestHelper } from "../helpers/mailgun-helper";

/**
 * Magic Link Authentication Tests using Mailgun
 *
 * Prerequisites:
 * 1. Set up Mailgun domain and API key in .env.test:
 *    MAILGUN_API_KEY=your-private-api-key
 *    MAILGUN_TEST_DOMAIN=mg.your-test-domain.com
 *
 * 2. Configure Mailgun route to catch all test emails:
 *    Expression: match_recipient(".*@mg.your-test-domain.com")
 *    Action: store()
 *
 * 3. Add your Mailgun test domain to ALLOWED_EMAILS in the API route
 */

test.describe("Magic Link Authentication with Mailgun", () => {
  let mailgun: MailgunTestHelper;
  let testEmail: string;

  test.beforeAll(() => {
    // Initialize Mailgun helper
    mailgun = new MailgunTestHelper();
  });

  test.beforeEach(async ({ page }) => {
    // Generate unique test email for each test
    testEmail = mailgun.generateTestEmail();
    console.log(`🧪 Test email: ${testEmail}`);

    await page.goto("http://localhost:3000", { waitUntil: 'domcontentloaded' });
  });

  test("complete magic link flow - send and verify code", async ({ page }) => {
    // Step 1: Request magic link
    await test.step("Request magic link", async () => {
      // Fill in test email
      await page.fill('input[type="email"]', testEmail);

      // Click send magic link button
      await page.click('button[type="submit"]');

      // Should show verification form
      await expect(page.locator("h2")).toContainText("Enter Magic Link Code");
      await expect(
        page.locator("text=Enter the verification code from your magic link email")
      ).toBeVisible();
    });

    // Step 2: Retrieve magic link code from Mailgun
    const magicLinkCode = await test.step("Retrieve magic link code from email", async () => {
      // Wait for email to arrive at Mailgun
      const email = await mailgun.waitForMagicLinkEmail(testEmail, {
        timeout: 15000,
        pollInterval: 1000,
      });

      expect(email).toBeDefined();
      expect(email.subject).toContain("SIAM");

      // Extract the 6-digit code from email body
      const code = mailgun.extractMagicLinkCode(email.bodyHtml || email.bodyPlain);

      expect(code).toBeTruthy();
      expect(code).toMatch(/^\d{6}$/);

      console.log(`✅ Magic link code retrieved: ${code}`);
      return code;
    });

    // Step 3: Enter verification code
    await test.step("Enter and verify code", async () => {
      // Enter the code we retrieved from Mailgun
      await page.fill('input[type="text"]', magicLinkCode!);

      // Click verify button
      await page.click('button[type="submit"]');

      // Should be logged in and redirected
      await page.waitForURL("**/dashboard/**", { timeout: 10000 });

      // Verify we're logged in
      await expect(page.locator('[role="main"]')).toBeVisible();
    });
  });

  test("magic link email contains correct information", async ({ page }) => {
    // Request magic link
    await page.fill('input[type="email"]', testEmail);
    await page.click('button[type="submit"]');

    // Retrieve email from Mailgun
    const email = await mailgun.waitForMagicLinkEmail(testEmail, {
      timeout: 15000,
    });

    // Verify email content
    expect(email.subject).toMatch(/SIAM|Magic Link|Sign In/i);
    expect(email.to).toContain(testEmail);

    // Check email body contains necessary elements
    const emailBody = email.bodyHtml || email.bodyPlain;
    expect(emailBody).toContain("verification code");

    // Verify code is present
    const code = mailgun.extractMagicLinkCode(emailBody);
    expect(code).toBeTruthy();
    expect(code).toHaveLength(6);
  });

  test("expired or invalid code handling", async ({ page }) => {
    // Request magic link
    await page.fill('input[type="email"]', testEmail);
    await page.click('button[type="submit"]');

    // Wait for verification form
    await expect(page.locator("h2")).toContainText("Enter Magic Link Code");

    // Enter an invalid code
    await page.fill('input[type="text"]', "999999");
    await page.click('button[type="submit"]');

    // Should show error message
    await expect(
      page
        .locator("text=Invalid verification code")
        .or(page.locator("text=Code is incorrect"))
        .or(page.locator(".error-message"))
    ).toBeVisible({ timeout: 5000 });
  });

  test("resend magic link functionality", async ({ page }) => {
    // Request initial magic link
    await page.fill('input[type="email"]', testEmail);
    await page.click('button[type="submit"]');

    // Wait for verification form
    await expect(page.locator("h2")).toContainText("Enter Magic Link Code");

    // Click resend link
    const resendLink = page
      .locator("text=Resend code")
      .or(page.locator("text=Send new code"))
      .or(page.locator("button:has-text('Resend')"));

    await resendLink.click();

    // Should show success message
    await expect(
      page
        .locator("text=New code sent")
        .or(page.locator("text=Verification code resent"))
        .or(page.locator(".success-message"))
    ).toBeVisible({ timeout: 5000 });

    // Verify new email was sent
    const email = await mailgun.waitForMagicLinkEmail(testEmail, {
      timeout: 15000,
      sinceTimestamp: Math.floor(Date.now() / 1000) - 10, // Only last 10 seconds
    });

    expect(email).toBeDefined();
  });

  test("multiple login attempts with same email", async ({ page }) => {
    // First attempt
    await page.fill('input[type="email"]', testEmail);
    await page.click('button[type="submit"]');

    // Get first code
    const firstEmail = await mailgun.waitForMagicLinkEmail(testEmail);
    const firstCode = mailgun.extractMagicLinkCode(firstEmail.bodyHtml || firstEmail.bodyPlain);

    // Go back and request another code
    await page.goto("http://localhost:3000", { waitUntil: 'domcontentloaded' });
    await page.fill('input[type="email"]', testEmail);
    await page.click('button[type="submit"]');

    // Get second code (should be different)
    const secondEmail = await mailgun.waitForMagicLinkEmail(testEmail, {
      sinceTimestamp: Math.floor(Date.now() / 1000) - 30,
    });
    const secondCode = mailgun.extractMagicLinkCode(secondEmail.bodyHtml || secondEmail.bodyPlain);

    // Codes should be different
    expect(firstCode).not.toBe(secondCode);

    // Second code should work
    await page.fill('input[type="text"]', secondCode!);
    await page.click('button[type="submit"]');

    // Should be logged in
    await page.waitForURL("**/dashboard/**", { timeout: 10000 });
  });
});

test.describe("Mailgun Integration Health Check", () => {
  test("Mailgun test helper is properly configured", async () => {
    const mailgun = new MailgunTestHelper();

    // Test that we can generate test emails
    const email = mailgun.generateTestEmail();
    expect(email).toMatch(/^test-\d+-\w+@.+$/);

    // Test that domain is set
    expect(email).toContain(process.env.MAILGUN_TEST_DOMAIN);
  });

  test("can retrieve test emails from Mailgun", async ({ page }) => {
    const mailgun = new MailgunTestHelper();
    const testEmail = mailgun.generateTestEmail();

    // Send a test magic link
    await page.goto("http://localhost:3000", { waitUntil: 'domcontentloaded' });
    await page.fill('input[type="email"]', testEmail);
    await page.click('button[type="submit"]');

    // Should be able to retrieve it
    const email = await mailgun.waitForMagicLinkEmail(testEmail, {
      timeout: 20000,
    });

    expect(email).toBeDefined();
    expect(email.to).toContain(testEmail);
  });
});
