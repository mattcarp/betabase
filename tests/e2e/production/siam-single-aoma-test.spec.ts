import { Page, BrowserContext } from '@playwright/test';
import { test } from '../fixtures/base-test';

const TEST_EMAIL = "siam-test-x7j9k2p4@mailinator.com";
const MAILINATOR_INBOX = "https://www.mailinator.com/v4/public/inboxes.jsp?to=siam-test-x7j9k2p4";
const SIAM_URL = "http://localhost:3000";

async function loginToSIAM(page: Page, context: BrowserContext): Promise<void> {
  await page.goto(SIAM_URL, { waitUntil: "networkidle" });
  await page.fill('input[type="email"]', TEST_EMAIL);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);

  const mailPage = await context.newPage();
  await mailPage.goto(MAILINATOR_INBOX, { waitUntil: "networkidle" });
  await mailPage.waitForTimeout(3000);

  const emails = await mailPage.locator('tr[ng-repeat*="email in emails"]').count();
  if (emails > 0) {
    await mailPage.locator('tr[ng-repeat*="email in emails"]').first().click();
    await mailPage.waitForTimeout(3000);

    let code = null;
    const iframe = await mailPage.$("iframe#html_msg_body");
    if (iframe) {
      const frame = await iframe.contentFrame();
      if (frame) {
        const frameText = await frame.$eval("body", (el) => el.textContent || "");
        const match = frameText.match(/\b(\d{6})\b/);
        if (match) code = match[1];
      }
    }

    await mailPage.close();

    if (code) {
      await page.fill('input[type="text"]', code);
      await page.click('button[type="submit"]');
      await page.waitForTimeout(5000);
    }
  }
}

test("Single AOMA question test", async ({ page, context }) => {
  await loginToSIAM(page, context);

  console.log("\n=== ASKING: What is AOMA? ===");

  const input = page.locator('textarea[placeholder*="Ask"], input[placeholder*="Ask"]').first();
  await input.fill("What is AOMA?");
  await page.keyboard.press("Enter");

  console.log("⏳ Waiting for response (up to 120 seconds)...");

  await page.waitForTimeout(120000); // Wait 2 minutes for full response

  const messages = await page.locator('div[role="log"] > div').all();
  const lastMessage = messages[messages.length - 1];
  const response = await lastMessage.textContent();

  console.log("\n=== FULL RESPONSE ===");
  console.log(response);
  console.log("=== END RESPONSE ===\n");
});
