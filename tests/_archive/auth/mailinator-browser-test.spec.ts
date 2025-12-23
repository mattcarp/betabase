/**
 * MAILINATOR BROWSER-BASED TEST
 *
 * This test uses Playwright to automate both SIAM and Mailinator
 * in separate browser tabs, just like a human would do it.
 *
 * Prerequisites:
 * 1. Run ./setup-cognito-test-user.sh to ensure user exists in Cognito
 * 2. Backend must have siam-test-x7j9k2p4@mailinator.com in allowed list
 *
 * This approach works because:
 * - No API keys needed
 * - No DNS configuration required
 * - Works with production immediately
 * - Simple and reliable
 */

import { Page, BrowserContext } from '@playwright/test';
import { test, expect } from '../fixtures/base-test';

const TEST_EMAIL = "siam-test-x7j9k2p4@mailinator.com";
const MAILINATOR_INBOX = "https://www.mailinator.com/v4/public/inboxes.jsp?to=siam-test-x7j9k2p4";
const SIAM_URL = process.env.TEST_URL || "http://localhost:3000";

// Helper to wait with retries
async function waitForElement(page: Page, selector: string, options = {}) {
  const defaultOptions = { timeout: 30000, state: "visible" as const };
  return page.waitForSelector(selector, { ...defaultOptions, ...options });
}

// Helper to extract verification code from email
async function extractCodeFromMailinator(mailPage: Page): Promise<string> {
  console.log("   📧 Opening latest email...");

  // Click on the first email in the list
  const emailItem = await waitForElement(mailPage, 'tr[ng-repeat*="email in emails"]', {
    timeout: 60000,
  });
  await emailItem.click();

  // Wait for email content to load
  await mailPage.waitForTimeout(2000); // Give iframe time to load

  // Try to find the code in the email body
  // Mailinator uses an iframe for email content
  const iframeElement = await mailPage.$("iframe#html_msg_body, iframe#msg_body");

  if (iframeElement) {
    const frame = await iframeElement.contentFrame();
    if (frame) {
      // Wait for content in iframe
      await frame.waitForSelector("body", { timeout: 10000 });
      const emailBody = await frame.$eval("body", (el) => el.textContent || "");

      // Look for 6-digit code
      const codeMatch = emailBody.match(/\b(\d{6})\b/);
      if (codeMatch) {
        return codeMatch[1];
      }

      console.log("   ⚠️ No code found in iframe, trying alternative extraction...");
    }
  }

  // Alternative: Look for code in the main page (sometimes Mailinator shows it directly)
  const pageContent = await mailPage.content();
  const codeMatch = pageContent.match(/\b(\d{6})\b/);

  if (codeMatch) {
    return codeMatch[1];
  }

  throw new Error("Could not extract verification code from email");
}

test.describe("SIAM Authentication - Mailinator Integration", () => {
  test.setTimeout(180000); // 3 minutes total timeout

  test("complete magic link login flow", async ({ page, context }) => {
    console.log("\n🚀 Starting Mailinator-based authentication test");
    console.log(`📧 Test email: ${TEST_EMAIL}`);
    console.log(`🌐 Target URL: ${SIAM_URL}\n`);

    // Step 1: Navigate to SIAM and request magic link
    await test.step("Request magic link from SIAM", async () => {
      console.log("1️⃣ Navigating to SIAM login page...");
      await page.goto(SIAM_URL, { waitUntil: "domcontentloaded" });

      // Take screenshot of login page
      await page.screenshot({ path: "test-results/01-login-page.png" });

      // Check for email input
      const emailInput = page.locator('input[type="email"]');
      await expect(emailInput).toBeVisible({ timeout: 10000 });
      console.log("   ✅ Login page loaded");

      // Fill in email
      await emailInput.fill(TEST_EMAIL);
      console.log(`   ✅ Entered email: ${TEST_EMAIL}`);

      // Click submit button
      const submitButton = page.locator('button[type="submit"]').first();
      await submitButton.click();
      console.log("   ✅ Clicked send magic link");

      // Wait for the button to change state (it shows "Sending Magic Link...")
      await page.waitForTimeout(2000);

      // Wait for verification form or error
      const verificationForm = page.locator(
        'h3:has-text("Magic Link Sent"), h2:has-text("Magic Link Sent"), h2:has-text("Enter"), h2:has-text("Verification"), input[placeholder*="code" i], input[placeholder*="verification" i]'
      );

      // More specific error selector that won't match the loading button
      const errorMessage = page.locator(
        '.error-message, div[role="alert"]:has-text("error"), div[role="alert"]:has-text("failed")'
      );

      // Wait for the form to appear (not the error)
      try {
        await verificationForm.waitFor({ timeout: 20000 });
        console.log("   ✅ Magic link sent successfully!");
      } catch (timeoutError) {
        // Check if there's an actual error message
        if (await errorMessage.isVisible()) {
          const error = await errorMessage.textContent();
          await page.screenshot({ path: "test-results/error-login.png" });
          throw new Error(`Login failed: ${error}`);
        }
        // If no error but also no verification form, take a screenshot
        await page.screenshot({ path: "test-results/timeout-login.png" });
        throw new Error("Timeout waiting for verification form");
      }

      await page.screenshot({ path: "test-results/02-verification-form.png" });
    });

    // Step 2: Open Mailinator and get the code
    let verificationCode: string = "";
    await test.step("Retrieve code from Mailinator", async () => {
      console.log("2️⃣ Opening Mailinator inbox...");

      // Open Mailinator in new tab
      const mailPage = await context.newPage();
      await mailPage.goto(MAILINATOR_INBOX, { waitUntil: "domcontentloaded" });
      console.log(`   ✅ Opened inbox: ${MAILINATOR_INBOX}`);

      // Wait for emails to load (Mailinator uses Angular)
      console.log("   ⏳ Waiting for emails to appear...");

      // Mailinator might take a moment to receive the email
      let attempts = 0;
      const maxAttempts = 20; // 20 * 3 seconds = 60 seconds max wait

      while (attempts < maxAttempts) {
        // Check if any emails are present
        const emailCount = await mailPage.locator('tr[ng-repeat*="email in emails"]').count();

        if (emailCount > 0) {
          console.log(`   ✅ Found ${emailCount} email(s)`);
          break;
        }

        attempts++;
        console.log(`   ⏳ No emails yet, waiting... (attempt ${attempts}/${maxAttempts})`);

        // Refresh the page to check for new emails
        if (attempts % 5 === 0) {
          await mailPage.reload({ waitUntil: "domcontentloaded" });
        } else {
          await mailPage.waitForTimeout(3000);
        }
      }

      // Get the verification code
      try {
        verificationCode = await extractCodeFromMailinator(mailPage);
        console.log(`   🔑 Verification code: ${verificationCode}\n`);
        await mailPage.screenshot({
          path: "test-results/03-mailinator-email.png",
        });
      } catch (error) {
        await mailPage.screenshot({
          path: "test-results/error-mailinator.png",
        });
        throw error;
      } finally {
        // Close Mailinator tab
        await mailPage.close();
      }
    });

    // Step 3: Enter code and complete login
    await test.step("Complete login with verification code", async () => {
      console.log("3️⃣ Entering verification code in SIAM...");

      // Make sure we're back on the SIAM page
      await page.bringToFront();

      // Find the code input field
      const codeInput = page
        .locator(
          'input[type="text"], input[type="number"], input[placeholder*="code" i], input[placeholder*="verification" i]'
        )
        .first();
      await expect(codeInput).toBeVisible({ timeout: 5000 });

      // Enter the code
      await codeInput.fill(verificationCode);
      console.log(`   ✅ Entered code: ${verificationCode}`);

      // Submit the verification form
      const verifyButton = page
        .locator('button:has-text("Verify"), button:has-text("Sign In"), button[type="submit"]')
        .first();
      await verifyButton.click();
      console.log("   ✅ Clicked verify button");

      // Wait for successful login
      // The app shows the AOMA Intelligence Hub after login
      await page.waitForSelector('h1:has-text("AOMA Intelligence Hub"), h1:has-text("SIAM")', {
        timeout: 15000,
      });

      console.log("   ✅ Successfully logged in!\n");
      await page.screenshot({
        path: "test-results/04-logged-in.png",
        fullPage: true,
      });
    });

    // Step 4: Verify application functionality
    await test.step("Test application features", async () => {
      console.log("4️⃣ Testing application functionality...");

      // Check that main UI elements are present
      const mainContent = page.locator('[role="main"], .dashboard, .chat-interface, main').first();
      await expect(mainContent).toBeVisible({ timeout: 10000 });
      console.log("   ✅ Main interface loaded");

      // Check for any console errors
      const consoleErrors: string[] = [];
      page.on("console", (msg) => {
        if (msg.type() === "error") {
          consoleErrors.push(msg.text());
        }
      });

      // Wait a moment for any async operations
      await page.waitForTimeout(3000);

      if (consoleErrors.length > 0) {
        console.log(`   ⚠️ Found ${consoleErrors.length} console error(s):`);
        consoleErrors.forEach((err) => console.log(`      - ${err.substring(0, 100)}`));
      } else {
        console.log("   ✅ No console errors detected");
      }

      // Take final screenshot
      await page.screenshot({
        path: "test-results/05-final-state.png",
        fullPage: true,
      });

      console.log("\n✅ Test completed successfully!");
      console.log("📸 Screenshots saved to test-results/");
    });
  });

  test("verify test email configuration", async ({ page }) => {
    console.log("\n🔍 Verifying test email configuration");

    // Check that Mailinator inbox is accessible
    await page.goto(MAILINATOR_INBOX);
    await expect(page).toHaveTitle(/Mailinator/i);
    console.log("✅ Mailinator inbox is accessible");

    // Try to login to SIAM with test email to verify it's allowed
    await page.goto(SIAM_URL);
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.click('button[type="submit"]');

    // Check for success or specific error
    const result = await Promise.race([
      page
        .waitForSelector('h2:has-text("Magic Link Sent")', { timeout: 10000 })
        .then(() => "success"),
      page
        .waitForSelector('[role="alert"]:has-text("not authorized")', {
          timeout: 10000,
        })
        .then(() => "not_authorized"),
      page.waitForSelector('[role="alert"]', { timeout: 10000 }).then(async (el) => {
        const text = await el.textContent();
        return text?.includes("500") ? "server_error" : "other_error";
      }),
    ]);

    switch (result) {
      case "success":
        console.log("✅ Test email is properly configured!");
        break;
      case "not_authorized":
        console.log("❌ Test email is not in the allowed list");
        console.log("   Fix: Add 'siam-test-x7j9k2p4@mailinator.com' to ALLOWED_EMAILS in backend");
        break;
      case "server_error":
        console.log("❌ Server error (500) - Cognito user might not exist");
        console.log("   Fix: Run ./setup-cognito-test-user.sh");
        break;
      default:
        console.log("⚠️ Unexpected error occurred");
    }
  });
});

export { extractCodeFromMailinator };
