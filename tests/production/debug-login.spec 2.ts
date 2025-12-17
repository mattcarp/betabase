/**
 * DEBUG TEST - Isolate login timeout issue
 */

import { test, expect } from "@playwright/test";

const PRODUCTION_URL = "https://thebetabase.com";
const TEST_EMAIL = "siam-test-x7j9k2p4@mailinator.com";

test.describe("Debug Login Flow", () => {
  test.setTimeout(60000); // 1 minute timeout

  test("1. Can navigate to production site", async ({ page }) => {
    console.log("🔍 Step 1: Navigate to site");
    await page.goto(PRODUCTION_URL, { waitUntil: "domcontentloaded", timeout: 30000 });

    const title = await page.title();
    console.log(`   ✅ Page title: ${title}`);

    await page.screenshot({ path: "test-results/debug-01-homepage.png" });
  });

  test("2. Can find email input", async ({ page }) => {
    console.log("🔍 Step 2: Find email input");
    await page.goto(PRODUCTION_URL, { waitUntil: "domcontentloaded", timeout: 30000 });

    const emailInput = page.locator('input[type="email"]');
    const isVisible = await emailInput.isVisible({ timeout: 10000 });
    console.log(`   Email input visible: ${isVisible ? "✅" : "❌"}`);

    await page.screenshot({ path: "test-results/debug-02-login-form.png" });
    expect(isVisible).toBe(true);
  });

  test("3. Can fill and submit email", async ({ page }) => {
    console.log("🔍 Step 3: Fill and submit email");
    await page.goto(PRODUCTION_URL, { waitUntil: "domcontentloaded", timeout: 30000 });

    await page.fill('input[type="email"]', TEST_EMAIL);
    console.log(`   ✅ Filled email: ${TEST_EMAIL}`);

    await page.screenshot({ path: "test-results/debug-03-email-filled.png" });

    await page.click('button[type="submit"]');
    console.log("   ✅ Clicked submit button");

    await page.waitForTimeout(5000);
    await page.screenshot({ path: "test-results/debug-04-after-submit.png" });
  });

  test("4. Can reach verification code screen", async ({ page }) => {
    console.log("🔍 Step 4: Reach verification screen");
    await page.goto(PRODUCTION_URL, { waitUntil: "domcontentloaded", timeout: 30000 });

    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.click('button[type="submit"]');

    console.log("   ⏳ Waiting for verification code input...");
    const codeInput = page.locator('input[type="text"]').first();

    const isVisible = await codeInput.isVisible({ timeout: 15000 }).catch(() => false);
    console.log(`   Verification input visible: ${isVisible ? "✅" : "❌"}`);

    await page.screenshot({ path: "test-results/debug-05-verification-screen.png" });

    if (isVisible) {
      const html = await page.content();
      console.log(
        `   Page contains "verification": ${html.includes("verification") || html.includes("code") || html.includes("enter")}`
      );
    }
  });

  test("5. Can navigate to Mailinator", async ({ page, context }) => {
    console.log("🔍 Step 5: Check Mailinator access");

    const mailPage = await context.newPage();
    const mailinatorUrl = "https://www.mailinator.com/v4/public/inboxes.jsp?to=siam-test-x7j9k2p4";

    console.log(`   Navigating to: ${mailinatorUrl}`);
    await mailPage.goto(mailinatorUrl, { waitUntil: "domcontentloaded", timeout: 30000 });

    const title = await mailPage.title();
    console.log(`   ✅ Mailinator title: ${title}`);

    await mailPage.screenshot({ path: "test-results/debug-06-mailinator.png" });

    // Check for emails
    const emailRows = await mailPage.locator('tr[ng-repeat*="email in emails"]').count();
    console.log(`   📧 Email count: ${emailRows}`);

    await mailPage.close();
  });
});
