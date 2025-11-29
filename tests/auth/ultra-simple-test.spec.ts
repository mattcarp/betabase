/**
 * ULTRA SIMPLE TEST - Just Use Browser Automation
 *
 * No APIs. No webhooks. Just Playwright doing what a human would do.
 */

import { test, expect } from '../fixtures/base-test';

const TEST_EMAIL = "siam-test-x7j9k2p4@mailinator.com";
const MAILINATOR_INBOX = "https://www.mailinator.com/v4/public/inboxes.jsp?to=siam-test-x7j9k2p4";

test("dead simple login test", async ({ page, context }) => {
  console.log("🚀 Starting simple test with:", TEST_EMAIL);

  // 1. Request magic link
  await page.goto("https://thebetabase.com");
  await page.fill('input[type="email"]', TEST_EMAIL);
  await page.click('button[type="submit"]');

  // Wait for verification form
  await expect(page.locator("h2")).toContainText(/enter|verification|magic/i, {
    timeout: 15000,
  });

  // 2. Open Mailinator in new tab
  const mailPage = await context.newPage();
  await mailPage.goto(MAILINATOR_INBOX);

  // 3. Wait for and click the latest email
  await mailPage.waitForSelector(".x_email-list .email-item", {
    timeout: 30000,
  });
  await mailPage.click(".x_email-list .email-item:first-child");

  // 4. Get the code from email body
  await mailPage.waitForSelector("iframe#html_msg_body", { timeout: 10000 });
  const frame = mailPage.frameLocator("iframe#html_msg_body");
  const emailBody = await frame.locator("body").textContent();

  const codeMatch = emailBody?.match(/\b(\d{6})\b/);
  if (!codeMatch) {
    throw new Error("No verification code found in email");
  }

  const code = codeMatch[1];
  console.log("🔑 Got code:", code);

  // 5. Go back to SIAM and enter code
  await page.bringToFront();
  await page.fill('input[type="text"]', code);
  await page.click('button[type="submit"]');

  // 6. Verify we're logged in
  await page.waitForURL(/\/(dashboard|chat|app)/, { timeout: 15000 });

  console.log("✅ Successfully logged in!");

  // Close Mailinator tab
  await mailPage.close();
});
