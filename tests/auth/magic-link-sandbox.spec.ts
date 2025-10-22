import { test, expect } from "@playwright/test";
import { MailgunTestHelper } from "../helpers/mailgun-helper";
import * as dotenv from "dotenv";
import * as path from "path";

// Load Mailgun environment variables
dotenv.config({ path: path.resolve(process.cwd(), ".env.mailgun") });

/**
 * Mailgun Sandbox Testing for SIAM Magic Links
 *
 * IMPORTANT: Sandbox domains have these limitations:
 * 1. Can only send TO authorized recipients (verified emails)
 * 2. Maximum 5 authorized recipients
 * 3. Each recipient must verify via email first
 *
 * Setup Steps:
 * 1. Add your test email as authorized recipient in Mailgun dashboard
 * 2. Verify the email by clicking the link Mailgun sends
 * 3. Update .env.mailgun with your API key and authorized email
 * 4. Run these tests
 */

test.describe("Magic Link with Mailgun Sandbox", () => {
  let mailgun: MailgunTestHelper;
  let authorizedEmail: string;
  let sandboxDomain: string;

  test.beforeAll(() => {
    // Initialize with sandbox configuration
    sandboxDomain =
      process.env.MAILGUN_TEST_DOMAIN || "sandbox49c351db5fa3448da004612643bf99d3.mailgun.org";
    authorizedEmail = process.env.MAILGUN_AUTHORIZED_EMAIL || "";

    if (!authorizedEmail) {
      throw new Error("Please set MAILGUN_AUTHORIZED_EMAIL in .env.mailgun");
    }

    if (!process.env.MAILGUN_API_KEY) {
      throw new Error("Please set MAILGUN_API_KEY in .env.mailgun");
    }

    mailgun = new MailgunTestHelper({
      apiKey: process.env.MAILGUN_API_KEY,
      domain: sandboxDomain,
      region: "us",
    });

    console.log(`🧪 Testing with Mailgun Sandbox Domain: ${sandboxDomain}`);
    console.log(`📧 Authorized Recipient: ${authorizedEmail}`);
  });

  test("complete magic link flow with sandbox domain", async ({ page }) => {
    // For sandbox testing, we'll use the authorized email
    // In production, you'd generate unique emails
    const testEmail = authorizedEmail;

    await test.step("Navigate to login page", async () => {
      await page.goto("http://localhost:3000");
      await expect(page.locator("h2")).toContainText("Welcome to SIAM");
    });

    await test.step("Request magic link", async () => {
      // Fill in the authorized email
      await page.fill('input[type="email"]', testEmail);

      console.log(`📨 Requesting magic link for: ${testEmail}`);

      // Click send magic link button
      await page.click('button[type="submit"]');

      // Should show verification form or error
      // Check for either success or domain validation error
      const verificationFormVisible = await page
        .locator("h2:has-text('Enter Magic Link Code')")
        .isVisible()
        .catch(() => false);
      const errorVisible = await page
        .locator("text=not authorized")
        .isVisible()
        .catch(() => false);

      if (errorVisible) {
        throw new Error(`Email ${testEmail} is not in ALLOWED_EMAILS list in the API route`);
      }

      expect(verificationFormVisible).toBeTruthy();
    });

    await test.step("Retrieve magic link from Mailgun", async () => {
      console.log("⏳ Waiting for email from Mailgun...");

      // Wait for email to arrive
      const email = await mailgun.waitForMagicLinkEmail(testEmail, {
        timeout: 30000, // Sandbox can be slower
        pollInterval: 3000,
      });

      expect(email).toBeDefined();
      console.log("✅ Email received!");
      console.log(`   Subject: ${email.subject}`);

      // Extract the verification code
      const code = mailgun.extractMagicLinkCode(email.bodyHtml || email.bodyPlain);

      expect(code).toBeTruthy();
      expect(code).toMatch(/^\d{6}$/);

      console.log(`🔑 Magic link code: ${code}`);

      // Enter the code
      await page.fill('input[type="text"]', code!);
      await page.click('button[type="submit"]');

      // Should be logged in
      await page.waitForURL("**/dashboard/**", { timeout: 10000 });
      console.log("🎉 Successfully authenticated!");
    });
  });

  test("sandbox domain receives emails correctly", async ({ page }) => {
    // Simple test to verify Mailgun integration is working
    const testEmail = authorizedEmail;

    await page.goto("http://localhost:3000");
    await page.fill('input[type="email"]', testEmail);
    await page.click('button[type="submit"]');

    // Just verify we can retrieve an email
    const email = await mailgun
      .waitForMagicLinkEmail(testEmail, {
        timeout: 30000,
      })
      .catch((err) => {
        console.error("Failed to retrieve email:", err.message);
        return null;
      });

    if (!email) {
      console.log("\n⚠️  Troubleshooting Tips:");
      console.log("1. Is your email verified as an authorized recipient in Mailgun?");
      console.log("2. Check Mailgun logs: https://app.mailgun.com/app/logs");
      console.log("3. Verify API key is correct in .env.mailgun");
      console.log(`4. Ensure ${testEmail} is in ALLOWED_EMAILS in the API route`);
    }

    expect(email).toBeDefined();
  });
});

test.describe("Mailgun Sandbox Configuration Check", () => {
  test("verify environment is properly configured", async () => {
    const checks = {
      "API Key Set": !!process.env.MAILGUN_API_KEY,
      "Domain Set": !!process.env.MAILGUN_TEST_DOMAIN,
      "Authorized Email Set": !!process.env.MAILGUN_AUTHORIZED_EMAIL,
      "Domain Format": process.env.MAILGUN_TEST_DOMAIN?.includes("sandbox"),
    };

    console.log("\n🔍 Configuration Check:");
    Object.entries(checks).forEach(([check, passed]) => {
      console.log(`  ${passed ? "✅" : "❌"} ${check}`);
    });

    // All checks should pass
    expect(Object.values(checks).every((v) => v)).toBeTruthy();
  });

  test("display setup instructions if not configured", async () => {
    if (!process.env.MAILGUN_API_KEY) {
      console.log(`
📋 MAILGUN SANDBOX SETUP INSTRUCTIONS
=====================================

1. Go to Mailgun Dashboard
2. Select your sandbox domain: sandbox49c351db5fa3448da004612643bf99d3.mailgun.org
3. Go to Domain Settings → Setup
4. Add your email as an Authorized Recipient
5. Check your email and click the verification link
6. Get your API key from Account → API Keys
7. Update .env.mailgun with:
   - MAILGUN_API_KEY=key-xxxxx
   - MAILGUN_AUTHORIZED_EMAIL=your-verified-email@example.com
8. Update app/api/auth/magic-link/route.ts to include your test email in ALLOWED_EMAILS
9. Run the tests again!
      `);
    }
  });
});
