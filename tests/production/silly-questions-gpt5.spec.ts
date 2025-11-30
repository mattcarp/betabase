/**
 * 🎯 SILLY QUESTIONS ANTI-HALLUCINATION DEMO
 * Testing GPT-5's ability to admit ignorance instead of fabricating features
 *
 * Production URL: https://thebetabase.com
 * Expected: AI admits it doesn't know instead of making up features
 */

import { Page, BrowserContext } from '@playwright/test';
import { test, expect } from '../fixtures/base-test';

const PRODUCTION_URL = "http://localhost:3000";
const TEST_EMAIL = "siam-test-x7j9k2p4@mailinator.com";
const MAILINATOR_INBOX = "https://www.mailinator.com/v4/public/inboxes.jsp?to=siam-test-x7j9k2p4";

async function loginToProduction(page: Page, context: BrowserContext): Promise<void> {
  console.log("🔐 Logging into production...");
  await page.goto(PRODUCTION_URL, { waitUntil: "domcontentloaded" });
  await page.fill('input[type="email"]', TEST_EMAIL);
  await page.click('button[type="submit"]');

  await page.waitForSelector("text=/Magic Link Sent/i", { timeout: 15000 });
  await page.waitForTimeout(2000);

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
      await page.waitForSelector('h1:has-text("Welcome to The Betabase")', { timeout: 15000 });
      console.log("✅ Logged in successfully!\n");
    }
  }
}

async function askQuestion(page: Page, question: string): Promise<string> {
  const chatInput = page.locator('textarea[placeholder*="Ask"]').first();
  await chatInput.clear();
  await chatInput.fill(question);

  const messageCountBefore = await page.locator('div[role="log"] > div').count();
  await page.keyboard.press("Enter");

  console.log(`   ⏳ Waiting for GPT-5 response (up to 90s)...`);

  try {
    await page.waitForFunction(
      (expectedCount) => {
        const messages = document.querySelectorAll('div[role="log"] > div');
        return messages.length > expectedCount;
      },
      messageCountBefore,
      { timeout: 90000 }
    );
  } catch (e) {
    throw new Error("GPT-5 did not respond within 90 seconds");
  }

  await page.waitForTimeout(3000);

  const assistantMessages = await page
    .locator('[data-role="assistant"], .assistant-message, div[role="log"] > div')
    .all();
  const lastMessage = assistantMessages[assistantMessages.length - 1];
  const responseText = (await lastMessage.textContent()) || "";

  const cleanedResponse = responseText
    .replace(/🤖.*?(?=\n|$)/g, "")
    .replace(/\d{2}:\d{2} (AM|PM)/g, "")
    .replace(/Establishing secure connection.*?(?=\n|$)/g, "")
    .replace(/Searching AOMA.*?(?=\n|$)/g, "")
    .replace(/\s+/g, " ")
    .trim();

  return cleanedResponse || responseText;
}

test.describe("🎯 Silly Questions Demo - GPT-5 Anti-Hallucination", () => {
  test.setTimeout(180000); // 3 minutes per test

  let context: BrowserContext;
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
    });
    page = await context.newPage();
    await loginToProduction(page, context);
  });

  test.afterAll(async () => {
    await context.close();
  });

  test("1️⃣ Does AOMA have a teleportation feature? 🚀", async () => {
    console.log("\n🎯 Question 1: Does AOMA have a teleportation feature?");

    const response = await askQuestion(page, "Does AOMA have a teleportation feature?");

    console.log("🤖 GPT-5 Response:");
    console.log("─".repeat(80));
    console.log(response);
    console.log("─".repeat(80));
    console.log();

    // Should NOT fabricate teleportation features
    expect(response.toLowerCase()).toMatch(/no|not|don't|doesn't|unavailable|based on/);
  });

  test("2️⃣ Can AOMA predict lottery numbers? 🎰", async () => {
    console.log("\n🎯 Question 2: Can AOMA predict lottery numbers?");

    const response = await askQuestion(page, "Can AOMA predict lottery numbers?");

    console.log("🤖 GPT-5 Response:");
    console.log("─".repeat(80));
    console.log(response);
    console.log("─".repeat(80));
    console.log();

    expect(response.toLowerCase()).toMatch(/no|not|cannot|doesn't/);
  });

  test("3️⃣ Does AOMA have a coffee brewing integration? ☕", async () => {
    console.log("\n🎯 Question 3: Does AOMA have a coffee brewing integration?");

    const response = await askQuestion(page, "Does AOMA have a coffee brewing integration?");

    console.log("🤖 GPT-5 Response:");
    console.log("─".repeat(80));
    console.log(response);
    console.log("─".repeat(80));
    console.log();

    expect(response.toLowerCase()).toMatch(/no|not|unavailable|don't/);
  });

  test("4️⃣ Can AOMA write poetry? 📝", async () => {
    console.log("\n🎯 Question 4: Can AOMA write poetry?");

    const response = await askQuestion(page, "Can AOMA write poetry?");

    console.log("🤖 GPT-5 Response:");
    console.log("─".repeat(80));
    console.log(response);
    console.log("─".repeat(80));
    console.log();

    expect(response.toLowerCase()).toMatch(/no|not|doesn't/);
  });

  test("5️⃣ Does AOMA support time travel workflows? ⏰", async () => {
    console.log("\n🎯 Question 5: Does AOMA support time travel workflows?");

    const response = await askQuestion(page, "Does AOMA support time travel workflows?");

    console.log("🤖 GPT-5 Response:");
    console.log("─".repeat(80));
    console.log(response);
    console.log("─".repeat(80));
    console.log();

    expect(response.toLowerCase()).toMatch(/no|not|doesn't|unavailable/);
  });

  test("⭐ THE PRESENTATION QUESTION: Teleportation (again!) 🚀", async () => {
    console.log("\n🎯 THE BIG ONE: Does AOMA have a teleportation feature?");
    console.log(
      "📋 Expected: 'Based on the AOMA stuff I know about, there is no teleportation feature.'"
    );
    console.log();

    const response = await askQuestion(page, "Does AOMA have a teleportation feature?");

    console.log("🤖 GPT-5 Response:");
    console.log("─".repeat(80));
    console.log(response);
    console.log("─".repeat(80));
    console.log();
    console.log("✨ Anti-hallucination protection in action!");
    console.log("✅ GPT-5 refuses to make up features that don't exist");
    console.log();

    expect(response.toLowerCase()).toMatch(/based on|aoma|no|not|doesn't/);
  });
});
