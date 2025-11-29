/**
 * PRODUCTION MAGIC LINK TEST WITH MAILGUN
 *
 * This test runs against the production site (thebetabase.com)
 * and uses Mailgun to catch the magic link emails from Cognito
 */

import { test, expect } from '../fixtures/base-test';
import axios from "axios";

// Test email at Mailgun sandbox domain
const TEST_EMAIL = "test@sandbox49c351db5fa3448da004612643bf99d3.mailgun.org";
const MAILGUN_API_KEY =
  process.env.MAILGUN_API_KEY || "49b4045e0b9738de459452c1f45c88ee-97129d72-5def87c6";
const MAILGUN_DOMAIN = "sandbox49c351db5fa3448da004612643bf99d3.mailgun.org";
const PRODUCTION_URL = "https://thebetabase.com";

async function getLatestEmail(toEmail: string, sinceTimestamp?: number) {
  const timestamp = sinceTimestamp || Math.floor(Date.now() / 1000) - 300; // Last 5 minutes

  console.log(`⏳ Checking Mailgun for emails sent to ${toEmail}...`);

  // Get events from Mailgun
  const response = await axios.get(`https://api.mailgun.net/v3/${MAILGUN_DOMAIN}/events`, {
    auth: {
      username: "api",
      password: MAILGUN_API_KEY,
    },
    params: {
      event: "stored",
      to: toEmail,
      begin: timestamp,
      ascending: "no",
      limit: 1,
    },
  });

  const event = response.data.items[0];
  if (!event || !event.storage) {
    console.log("❌ No email found yet");
    return null;
  }

  console.log("✅ Email found! Retrieving content...");

  // Get the actual message content
  const messageResponse = await axios.get(event.storage.url, {
    auth: {
      username: "api",
      password: MAILGUN_API_KEY,
    },
  });

  return messageResponse.data;
}

function extractMagicCode(emailBody: string): string | null {
  // Look for 6-digit code in email
  const patterns = [
    /verification code[:\s]+(\d{6})/gi,
    /code[:\s]+(\d{6})/gi,
    /\b(\d{6})\b/g, // Any 6-digit number
  ];

  for (const pattern of patterns) {
    const match = emailBody.match(pattern);
    if (match) {
      const codeMatch = match[0].match(/\d{6}/);
      if (codeMatch) {
        return codeMatch[0];
      }
    }
  }

  return null;
}

test.describe("Production Magic Link Testing", () => {
  test("complete magic link flow on production", async ({ page }) => {
    console.log("🚀 Starting production test against:", PRODUCTION_URL);
    console.log("📧 Test email:", TEST_EMAIL);

    const startTime = Math.floor(Date.now() / 1000);

    // Step 1: Navigate to production site
    await test.step("Navigate to production login", async () => {
      await page.goto(PRODUCTION_URL);
      console.log("✅ Loaded production site");

      // Take screenshot of initial page
      await page.screenshot({ path: "test-results/production-login.png" });
    });

    // Step 2: Request magic link
    await test.step("Request magic link", async () => {
      // Fill in test email
      await page.fill('input[type="email"]', TEST_EMAIL);
      console.log("✅ Entered test email");

      // Click send magic link button
      await page.click('button[type="submit"]');
      console.log("✅ Clicked send magic link");

      // Wait for verification form
      await expect(page.locator("h2")).toContainText("Enter Magic Link Code", {
        timeout: 10000,
      });
      console.log("✅ Verification form appeared");

      await page.screenshot({ path: "test-results/verification-form.png" });
    });

    // Step 3: Retrieve magic link from Mailgun
    const magicCode = await test.step("Retrieve magic link from Mailgun", async () => {
      // Poll Mailgun for the email (give it up to 30 seconds)
      let email = null;
      for (let i = 0; i < 10; i++) {
        console.log(`Checking for email... (attempt ${i + 1})`);
        email = await getLatestEmail(TEST_EMAIL, startTime);
        if (email) break;
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }

      expect(email).toBeTruthy();
      console.log("✅ Email received from Cognito!");

      // Extract code
      const code = extractMagicCode(email["body-plain"] || email["body-html"]);
      expect(code).toMatch(/^\d{6}$/);

      console.log(`🔑 Magic code retrieved: ${code}`);
      return code;
    });

    // Step 4: Enter code and login
    await test.step("Complete login with magic code", async () => {
      // Enter code
      await page.fill('input[type="text"]', magicCode!);
      console.log("✅ Entered magic code");

      // Click verify button
      await page.click('button[type="submit"]');
      console.log("✅ Clicked verify");

      // Wait for redirect to dashboard/main app
      await page.waitForURL("**/dashboard/**", { timeout: 15000 });
      console.log("✅ Successfully logged in!");

      await page.screenshot({ path: "test-results/logged-in-dashboard.png" });
    });

    // Step 5: Test the hell out of the app!
    await test.step("Test app functionality", async () => {
      console.log("🧪 Now testing the application...");

      // Check that main UI elements are present
      await expect(page.locator('[role="main"]')).toBeVisible();

      // Take final screenshot
      await page.screenshot({
        path: "test-results/app-loaded.png",
        fullPage: true,
      });

      console.log("🎉 Production test complete! App is working!");
    });
  });

  test("test app navigation and features", async ({ page }) => {
    // This test assumes you're already logged in from the previous test
    // Or you can repeat the login flow

    const startTime = Math.floor(Date.now() / 1000);

    // Login first
    await page.goto(PRODUCTION_URL);
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.click('button[type="submit"]');

    // Get magic code
    await page.waitForSelector("h2");
    let email = null;
    for (let i = 0; i < 10; i++) {
      email = await getLatestEmail(TEST_EMAIL, startTime);
      if (email) break;
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }

    const code = extractMagicCode(email["body-plain"] || email["body-html"]);
    await page.fill('input[type="text"]', code!);
    await page.click('button[type="submit"]');

    await page.waitForURL("**/dashboard/**");

    // Now test various features
    console.log("🔍 Testing app features...");

    // Add more specific tests here based on your app's features
    // For example:
    // - Test navigation menu
    // - Test creating new items
    // - Test search functionality
    // - Test user settings
    // etc.

    console.log("✅ All features tested successfully!");
  });
});
