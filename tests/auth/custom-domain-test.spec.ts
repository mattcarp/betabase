/**
 * FLEXIBLE MAILGUN TEST FOR SIAM
 *
 * This test can work with either:
 * 1. Mailgun sandbox domain (if Cognito is configured to send to it)
 * 2. Custom domain with MX records pointing to Mailgun
 *
 * The key is that emails must be retrievable via Mailgun API
 */

import { test, expect } from "@playwright/test";
import axios from "axios";
import * as dotenv from "dotenv";

// Load test environment
dotenv.config({ path: ".env.test" });

// Configuration - prioritize custom domain if available
const MAILGUN_API_KEY =
  process.env.MAILGUN_API_KEY || "49b4045e0b9738de459452c1f45c88ee-97129d72-5def87c6";
const MAILGUN_DOMAIN =
  process.env.MAILGUN_CUSTOM_DOMAIN ||
  process.env.MAILGUN_TEST_DOMAIN ||
  "sandbox49c351db5fa3448da004612643bf99d3.mailgun.org";
const TEST_EMAIL = process.env.MAILGUN_CUSTOM_TEST_EMAIL || `test@${MAILGUN_DOMAIN}`;
const BASE_URL = process.env.TEST_URL || "https://thebetabase.com";

console.log("📧 Test Configuration:");
console.log(`   Domain: ${MAILGUN_DOMAIN}`);
console.log(`   Email: ${TEST_EMAIL}`);
console.log(`   URL: ${BASE_URL}`);

/**
 * Retrieves the latest email from Mailgun storage
 */
async function getLatestEmail(toEmail: string, sinceTimestamp?: number): Promise<any> {
  const timestamp = sinceTimestamp || Math.floor(Date.now() / 1000) - 600; // Last 10 minutes

  console.log(`⏳ Polling Mailgun for emails to ${toEmail}...`);

  try {
    // First, get stored email events
    const eventsResponse = await axios.get(`https://api.mailgun.net/v3/${MAILGUN_DOMAIN}/events`, {
      auth: {
        username: "api",
        password: MAILGUN_API_KEY,
      },
      params: {
        event: "stored",
        recipient: toEmail,
        begin: timestamp,
        ascending: "no",
        limit: 5,
      },
    });

    console.log(`   Found ${eventsResponse.data.items?.length || 0} stored email events`);

    if (!eventsResponse.data.items || eventsResponse.data.items.length === 0) {
      // Also check for accepted/delivered events (might not be stored yet)
      const acceptedResponse = await axios.get(
        `https://api.mailgun.net/v3/${MAILGUN_DOMAIN}/events`,
        {
          auth: {
            username: "api",
            password: MAILGUN_API_KEY,
          },
          params: {
            event: "accepted",
            recipient: toEmail,
            begin: timestamp,
            ascending: "no",
            limit: 5,
          },
        }
      );

      if (acceptedResponse.data.items?.length > 0) {
        console.log(`   Email accepted but not stored yet. Waiting...`);
        return null;
      }
    }

    const event = eventsResponse.data.items?.[0];
    if (!event) {
      console.log("   No emails found");
      return null;
    }

    // If we have a storage URL, retrieve the content
    if (event.storage?.url) {
      console.log("✅ Email found! Retrieving content...");
      const messageResponse = await axios.get(event.storage.url, {
        auth: {
          username: "api",
          password: MAILGUN_API_KEY,
        },
      });

      return messageResponse.data;
    } else if (event.message) {
      // Sometimes the message is inline
      console.log("✅ Email found (inline message)");
      return event.message;
    }

    console.log("   Email event found but no content available");
    return null;
  } catch (error: any) {
    console.error("❌ Mailgun API error:", error.response?.data || error.message);
    return null;
  }
}

/**
 * Extracts the 6-digit verification code from email content
 */
function extractMagicCode(emailData: any): string | null {
  // Try different fields where the body might be
  const bodyText =
    emailData["body-plain"] ||
    emailData["stripped-text"] ||
    emailData["body-html"] ||
    emailData.body ||
    JSON.stringify(emailData);

  if (!bodyText) {
    console.log("❌ No email body found");
    return null;
  }

  // Patterns to find 6-digit codes
  const patterns = [
    /verification code[:\s]+(\d{6})/i,
    /code[:\s]+(\d{6})/i,
    /magic link[:\s]+(\d{6})/i,
    /\b(\d{6})\b/g, // Any standalone 6-digit number
  ];

  for (const pattern of patterns) {
    const matches = bodyText.match(pattern);
    if (matches) {
      // Extract just the digits
      const code = matches[0].match(/\d{6}/)?.[0];
      if (code) {
        console.log(`🔑 Found verification code: ${code}`);
        return code;
      }
    }
  }

  console.log("❌ No verification code found in email");
  console.log("Email body preview:", bodyText.substring(0, 200));
  return null;
}

test.describe("Mailgun Integration Tests", () => {
  test.setTimeout(120000); // 2 minutes timeout

  test("complete magic link flow with Mailgun", async ({ page }) => {
    console.log("\n🚀 Starting Mailgun integration test");
    const startTime = Math.floor(Date.now() / 1000);

    // Step 1: Navigate to login page
    await test.step("Navigate to login", async () => {
      await page.goto(BASE_URL, { waitUntil: "networkidle" });
      console.log("✅ Loaded login page");

      // Check for email input
      const emailInput = page.locator('input[type="email"]');
      await expect(emailInput).toBeVisible({ timeout: 10000 });
    });

    // Step 2: Request magic link
    await test.step("Request magic link", async () => {
      // Fill email
      await page.fill('input[type="email"]', TEST_EMAIL);
      console.log(`✅ Entered email: ${TEST_EMAIL}`);

      // Find and click the submit button
      const submitButton = page
        .locator('button[type="submit"]:has-text("Send"), button:has-text("Send Magic Link")')
        .first();
      await submitButton.click();
      console.log("✅ Clicked send magic link");

      // Wait for either verification form or error
      try {
        await page.waitForSelector(
          'h2:has-text("Enter"), h2:has-text("Verification"), .error-message',
          {
            timeout: 15000,
          }
        );

        // Check if we got an error
        const errorElement = await page.locator('.error-message, [role="alert"]').first();
        if (await errorElement.isVisible()) {
          const errorText = await errorElement.textContent();
          throw new Error(`Login failed: ${errorText}`);
        }

        console.log("✅ Verification form appeared");
      } catch (error) {
        // Take screenshot for debugging
        await page.screenshot({ path: "test-results/login-error.png" });
        throw error;
      }
    });

    // Step 3: Retrieve magic code from Mailgun
    let magicCode: string | null = null;
    await test.step("Retrieve magic code from Mailgun", async () => {
      // Poll for email (up to 60 seconds)
      let email = null;
      const maxAttempts = 20;

      for (let i = 0; i < maxAttempts; i++) {
        console.log(`   Attempt ${i + 1}/${maxAttempts}`);
        email = await getLatestEmail(TEST_EMAIL, startTime);

        if (email) {
          magicCode = extractMagicCode(email);
          if (magicCode) break;
        }

        // Wait 3 seconds before next attempt
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }

      if (!magicCode) {
        // Log debug info
        console.log("\n🔍 Debug Information:");
        console.log("- Check Mailgun logs: https://app.mailgun.com/app/logs");
        console.log("- Check Mailgun routes: https://app.mailgun.com/app/receiving/routes");
        console.log("- Verify domain is active: https://app.mailgun.com/app/domains");
        console.log("- Ensure Cognito has the test email in allowed list");

        throw new Error("Failed to retrieve magic code from Mailgun");
      }

      console.log(`✅ Magic code retrieved: ${magicCode}`);
    });

    // Step 4: Complete login
    await test.step("Complete login with magic code", async () => {
      // Find code input - try different selectors
      const codeInput = await page
        .locator('input[type="text"], input[type="number"], input[inputmode="numeric"]')
        .first();
      await codeInput.fill(magicCode!);
      console.log("✅ Entered magic code");

      // Submit verification
      const verifyButton = page
        .locator('button[type="submit"]:has-text("Verify"), button:has-text("Submit")')
        .first();
      await verifyButton.click();
      console.log("✅ Clicked verify");

      // Wait for successful login (redirect or dashboard)
      try {
        await page.waitForURL(/\/(dashboard|chat|app)/, { timeout: 15000 });
        console.log("✅ Successfully logged in!");
      } catch {
        // Alternative: Check for logged-in indicators
        const mainContent = page.locator('[role="main"], .dashboard, .chat-interface').first();
        await expect(mainContent).toBeVisible({ timeout: 15000 });
        console.log("✅ Successfully logged in!");
      }

      // Take success screenshot
      await page.screenshot({
        path: "test-results/logged-in.png",
        fullPage: true,
      });
    });

    // Step 5: Basic app testing
    await test.step("Test app functionality", async () => {
      console.log("🧪 Testing app features...");

      // Check for main UI elements
      const hasMainUI = await page
        .locator('[role="main"], .chat-interface, .dashboard')
        .first()
        .isVisible();
      expect(hasMainUI).toBeTruthy();

      // Check console for errors
      const consoleErrors: string[] = [];
      page.on("console", (msg) => {
        if (msg.type() === "error") {
          consoleErrors.push(msg.text());
        }
      });

      // Wait a bit for any async operations
      await page.waitForTimeout(2000);

      if (consoleErrors.length > 0) {
        console.log("⚠️ Console errors detected:", consoleErrors);
      }

      console.log("✅ App is functional!");
    });
  });

  test("verify Mailgun API connectivity", async () => {
    console.log("\n🔍 Testing Mailgun API connectivity");

    try {
      // Test API access
      const response = await axios.get(`https://api.mailgun.net/v3/${MAILGUN_DOMAIN}/stats/total`, {
        auth: {
          username: "api",
          password: MAILGUN_API_KEY,
        },
        params: {
          event: "accepted,delivered,failed",
          duration: "1d",
        },
      });

      console.log("✅ Mailgun API is accessible");
      console.log("📊 Domain stats:", response.data.stats?.[0] || "No recent activity");

      // Check domain status
      const domainResponse = await axios.get(
        `https://api.mailgun.net/v3/domains/${MAILGUN_DOMAIN}`,
        {
          auth: {
            username: "api",
            password: MAILGUN_API_KEY,
          },
        }
      );

      console.log("📧 Domain status:", domainResponse.data.domain?.state || "Unknown");
      console.log("✅ Mailgun domain is configured");
    } catch (error: any) {
      console.error("❌ Mailgun API test failed:", error.response?.data || error.message);
      throw error;
    }
  });
});

export { getLatestEmail, extractMagicCode };
