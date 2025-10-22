const { chromium } = require("playwright");
require("dotenv").config({ path: ".env.local" });

async function loginToAoma() {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 500, // Slow down for 2FA visibility
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  console.log("🌐 Navigating to AOMA stage...");
  await page.goto("https://aoma-stage.smcdp-de.net");

  // Wait a bit to see what appears
  await page.waitForTimeout(3000);

  console.log("📸 Taking screenshot of login page...");
  await page.screenshot({ path: "tmp/aoma-login-page.png" });

  console.log("Current URL:", page.url());

  // Click "Employee Login" button to trigger Microsoft OAuth
  console.log("🔘 Clicking Employee Login button...");
  await page.click("#aadLoginBtn");

  // Wait for redirect to Microsoft login
  await page.waitForTimeout(3000);

  console.log("📸 After clicking Employee Login...");
  await page.screenshot({ path: "tmp/aoma-after-employee-click.png" });
  console.log("Current URL:", page.url());

  // Check if Microsoft login redirect happened
  if (page.url().includes("login.microsoftonline.com")) {
    console.log("📧 Microsoft login detected - entering username...");
    await page.fill('input[type="email"]', process.env.AOMA_STAGE_USERNAME);
    await page.click('input[type="submit"]');

    console.log("🔑 Entering password...");
    await page.waitForSelector('input[type="password"]', { timeout: 10000 });
    await page.fill('input[type="password"]', process.env.AOMA_STAGE_PASSWORD);
    await page.click('input[type="submit"]');

    console.log("📱 Waiting for 2FA (HITL - please complete on your device)...");
  } else {
    console.log("⏸️  No automatic redirect - manual login required");
    console.log("Browser will stay open for manual login and 2FA");
  }

  // Wait for successful login (either automated or manual)
  console.log("⏳ Waiting for login to complete...");
  await page.waitForURL("**/aoma-stage.smcdp-de.net/**", { timeout: 300000 }).catch(() => {
    console.log("⚠️  Still waiting or timeout - check browser");
  });

  console.log("✅ Login complete! Getting cookies...");
  const cookies = await context.cookies();

  console.log("\n🍪 Auth Cookies:");
  console.log(JSON.stringify(cookies, null, 2));

  console.log("\n✨ Browser will stay open for inspection. Close when done.");

  // Keep browser open
  await page.waitForTimeout(600000); // 10 minutes

  await browser.close();
}

loginToAoma().catch(console.error);
