/**
 * WEBHOOK-BASED MAGIC LINK TEST
 *
 * This test uses a webhook endpoint to capture emails
 * instead of requiring MX records or sandbox domains.
 *
 * Setup:
 * 1. Deploy the webhook endpoint (/api/mailgun-webhook)
 * 2. Configure Mailgun to forward emails to the webhook
 * 3. Add test email to Cognito allowed list
 */

import { test, expect } from '../fixtures/base-test';
import axios from "axios";

// Configuration
const BASE_URL = process.env.TEST_URL || "http://localhost:3000";
const WEBHOOK_URL = process.env.MAILGUN_WEBHOOK_URL || `${BASE_URL}/api/mailgun-webhook`;
const TEST_EMAIL = process.env.TEST_EMAIL || "test@mattcarpenter.com";

console.log("🪝 Webhook Test Configuration:");
console.log(`   URL: ${BASE_URL}`);
console.log(`   Webhook: ${WEBHOOK_URL}`);
console.log(`   Email: ${TEST_EMAIL}`);

/**
 * Retrieve email from webhook endpoint
 */
async function getEmailFromWebhook(email: string, maxAttempts = 20): Promise<any> {
  console.log(`⏳ Checking webhook for email to ${email}...`);

  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await axios.get(`${WEBHOOK_URL}?email=${encodeURIComponent(email)}`);

      if (response.data.email) {
        console.log("✅ Email found in webhook!");
        return response.data;
      }
    } catch (error: any) {
      if (error.response?.status !== 404) {
        console.error("Webhook error:", error.response?.data || error.message);
      }
    }

    // Wait 3 seconds before next attempt
    if (i < maxAttempts - 1) {
      console.log(`   Attempt ${i + 1}/${maxAttempts} - Email not yet received`);
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }

  console.log("❌ Email not received at webhook");

  // Check what emails ARE available
  try {
    const allResponse = await axios.get(`${WEBHOOK_URL}?all=true`);
    console.log(`   Available emails: ${allResponse.data.count}`);
    if (allResponse.data.emails?.length > 0) {
      console.log(
        "   Recent recipients:",
        allResponse.data.emails.slice(-3).map((e: any) => e.recipient)
      );
    }
  } catch {}

  return null;
}

/**
 * Clear webhook storage
 */
async function clearWebhook(): Promise<void> {
  try {
    await axios.delete(WEBHOOK_URL);
    console.log("🧹 Cleared webhook storage");
  } catch (error) {
    console.log("⚠️ Could not clear webhook storage");
  }
}

test.describe("Webhook Magic Link Tests", () => {
  test.setTimeout(120000); // 2 minutes

  test.beforeEach(async () => {
    // Clear webhook storage before each test
    await clearWebhook();
  });

  test("complete login flow with webhook", async ({ page }) => {
    console.log("\n🚀 Starting webhook-based magic link test");

    // Step 1: Navigate to login
    await test.step("Navigate to login page", async () => {
      await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });
      console.log("✅ Loaded login page");

      // Wait for email input
      const emailInput = page.locator('input[type="email"]');
      await expect(emailInput).toBeVisible({ timeout: 10000 });

      // Take screenshot
      await page.screenshot({ path: "test-results/webhook-login.png" });
    });

    // Step 2: Request magic link
    await test.step("Request magic link", async () => {
      // Fill email
      await page.fill('input[type="email"]', TEST_EMAIL);
      console.log(`✅ Entered email: ${TEST_EMAIL}`);

      // Click send button (handle different button texts)
      const submitButton = page.locator('button[type="submit"], button:has-text("Send")').first();

      // Use a more robust click with retry
      await submitButton.click({ force: true });
      console.log("✅ Clicked send magic link");

      // Wait for verification form or error
      const verificationHeader = page
        .locator('h2:has-text("Enter"), h2:has-text("Verification"), h2:has-text("Magic")')
        .first();
      const errorMessage = page.locator('.error-message, [role="alert"], .text-red-500').first();

      // Wait for either success or error
      await Promise.race([
        verificationHeader.waitFor({ timeout: 15000 }),
        errorMessage.waitFor({ timeout: 15000 }),
      ]).catch(() => {
        // If neither appears, take a debug screenshot
        page.screenshot({ path: "test-results/webhook-after-send.png" });
      });

      // Check for error
      if (await errorMessage.isVisible()) {
        const errorText = await errorMessage.textContent();
        throw new Error(`Login failed: ${errorText}`);
      }

      console.log("✅ Verification form appeared");
      await page.screenshot({ path: "test-results/webhook-verification.png" });
    });

    // Step 3: Get magic code from webhook
    let magicCode: string | null = null;
    await test.step("Retrieve magic code from webhook", async () => {
      const emailData = await getEmailFromWebhook(TEST_EMAIL);

      if (!emailData) {
        throw new Error("Failed to retrieve email from webhook");
      }

      magicCode = emailData.verificationCode;
      if (!magicCode) {
        // Try to extract from email body
        const body = emailData.email?.bodyPlain || emailData.email?.bodyHtml || "";
        const match = body.match(/\b(\d{6})\b/);
        magicCode = match ? match[1] : null;
      }

      if (!magicCode) {
        console.log("Email data:", JSON.stringify(emailData, null, 2));
        throw new Error("No verification code found in email");
      }

      console.log(`🔑 Magic code retrieved: ${magicCode}`);
    });

    // Step 4: Complete login
    await test.step("Complete login with magic code", async () => {
      // Find code input field
      const codeInput = page
        .locator('input[type="text"], input[type="number"], input[placeholder*="code" i]')
        .first();
      await codeInput.fill(magicCode!);
      console.log("✅ Entered magic code");

      // Submit verification
      const verifyButton = page.locator('button[type="submit"], button:has-text("Verify")').first();
      await verifyButton.click();
      console.log("✅ Clicked verify");

      // Wait for successful login
      await page.waitForURL(/\/(dashboard|chat|app)/, { timeout: 15000 }).catch(async () => {
        // Alternative: Check for main content
        const mainContent = page.locator('[role="main"], .dashboard, .chat-interface');
        await expect(mainContent.first()).toBeVisible({ timeout: 5000 });
      });

      console.log("✅ Successfully logged in!");
      await page.screenshot({
        path: "test-results/webhook-success.png",
        fullPage: true,
      });
    });

    // Step 5: Test app
    await test.step("Verify app is functional", async () => {
      console.log("🧪 Testing app functionality...");

      // Check for main UI elements
      const mainUI = await page
        .locator('[role="main"], .chat-interface, .dashboard')
        .first()
        .isVisible();
      expect(mainUI).toBeTruthy();

      // Log any console errors
      page.on("console", (msg) => {
        if (msg.type() === "error") {
          console.log("Console error:", msg.text());
        }
      });

      console.log("✅ App is functional!");
    });
  });

  test("webhook endpoint is accessible", async () => {
    console.log("\n🔍 Testing webhook endpoint");

    try {
      // Send test data to webhook
      const testResponse = await axios.post(
        WEBHOOK_URL,
        new URLSearchParams({
          recipient: "webhook-test@example.com",
          sender: "test@mailgun.org",
          subject: "Webhook Test",
          "body-plain": "Test verification code: 654321",
        }),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      console.log("✅ Webhook accepted test data");

      // Retrieve the test email
      const getResponse = await axios.get(`${WEBHOOK_URL}?email=webhook-test@example.com`);

      expect(getResponse.data.verificationCode).toBe("654321");
      console.log("✅ Webhook storage and retrieval working");

      // Check all emails
      const allResponse = await axios.get(`${WEBHOOK_URL}?all=true`);
      console.log(`📊 Total emails in webhook: ${allResponse.data.count}`);
    } catch (error: any) {
      console.error("❌ Webhook test failed:", error.response?.data || error.message);
      throw error;
    }
  });
});

export { getEmailFromWebhook, clearWebhook };
