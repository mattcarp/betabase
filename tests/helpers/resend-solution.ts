/**
 * The "Fuck Mailgun, Use Resend + Webhook.site" Solution
 *
 * Since Resend doesn't receive emails, we'll use webhook.site
 * or a similar service to catch the magic link emails
 */

import { test, expect } from '../fixtures/base-test';;
import axios from "axios";

// ========================================
// Option 1: Webhook.site (FREE & INSTANT)
// ========================================
// 1. Go to https://webhook.site
// 2. Get your unique URL (like https://webhook.site/abc123)
// 3. Use the email address they give you

async function setupWebhookSite() {
  // Generate a new webhook.site inbox
  const response = await axios.post("https://webhook.site/token");
  const token = response.data.uuid;

  return {
    email: `${token}@email.webhook.site`,
    webhookUrl: `https://webhook.site/${token}`,
    apiUrl: `https://webhook.site/token/${token}/requests`,
  };
}

async function getEmailsFromWebhookSite(token: string) {
  const response = await axios.get(`https://webhook.site/token/${token}/requests?sorting=newest`);
  return response.data.data;
}

// ========================================
// Option 2: Use Resend to FORWARD to a catchable endpoint
// ========================================
// This is clever: Use Resend's domain to receive, then forward via webhook

async function setupResendForwarding() {
  // You'd set up a Resend email that forwards to your webhook
  // Then Cognito sends to: test@your-resend-domain.com
  // Resend forwards to: your webhook endpoint
  // You catch it there!
}

// ========================================
// Option 3: Just Mock It (Fastest for CI/CD)
// ========================================
const MOCK_CODE = "123456";

test.describe("Magic Link Testing (Resend Edition)", () => {
  test("magic link with webhook.site", async ({ page }) => {
    // Set up webhook.site inbox
    const inbox = await setupWebhookSite();
    console.log(`📧 Test email: ${inbox.email}`);
    console.log(`🔗 Check emails at: ${inbox.webhookUrl}`);

    // Request magic link
    await page.goto("http://localhost:3000");
    await page.fill('input[type="email"]', inbox.email);
    await page.click('button[type="submit"]');

    // Wait for email to arrive
    let code = null;
    for (let i = 0; i < 10; i++) {
      console.log(`Checking for email (attempt ${i + 1})...`);

      const emails = await getEmailsFromWebhookSite(inbox.token);
      if (emails.length > 0) {
        const latestEmail = emails[0];
        const emailContent = latestEmail.content || "";

        // Extract 6-digit code
        const match = emailContent.match(/\b(\d{6})\b/);
        if (match) {
          code = match[1];
          break;
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 3000));
    }

    expect(code).toBeTruthy();
    console.log(`✅ Got magic code: ${code}`);

    // Enter code and complete auth
    await page.fill('input[type="text"]', code);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*dashboard.*/);
  });

  test("quick mock test (fuck email services)", async ({ page }) => {
    console.log("🖕 Fuck Mailgun");
    console.log("🖕 Fuck email complexity");
    console.log("✅ Just mock it!");

    // Mock Cognito entirely
    await page.route("**/cognito-idp.**", (route) => {
      const body = route.request().postData() || "";

      if (body.includes("ForgotPassword")) {
        route.fulfill({
          status: 200,
          body: JSON.stringify({
            CodeDeliveryDetails: {
              DeliveryMedium: "EMAIL",
              Destination: "t***@e***.com",
            },
          }),
        });
      } else if (body.includes("ConfirmForgotPassword")) {
        if (body.includes(MOCK_CODE)) {
          route.fulfill({ status: 200, body: "{}" });
        } else {
          route.fulfill({
            status: 400,
            body: JSON.stringify({
              message: "Wrong code, try 123456",
            }),
          });
        }
      } else {
        route.continue();
      }
    });

    // Run test with known code
    await page.goto("http://localhost:3000");
    await page.fill('input[type="email"]', "test@example.com");
    await page.click('button[type="submit"]');

    await page.fill('input[type="text"]', MOCK_CODE);
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/.*dashboard.*/);
    console.log("✅ Mocked test passed! No email services needed!");
  });
});

// ========================================
// For using your existing Resend account
// ========================================
export async function checkResendAccount() {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;

  if (!RESEND_API_KEY) {
    console.log("❌ No Resend API key found");
    console.log("💡 Get it from: https://resend.com/api-keys");
    return false;
  }

  try {
    // Test the API key
    const response = await axios.get("https://api.resend.com/emails", {
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
    });

    console.log("✅ Resend account is working!");
    console.log("📊 Recent emails:", response.data.data.length);
    return true;
  } catch (error) {
    console.log("❌ Resend API key might be invalid");
    return false;
  }
}
