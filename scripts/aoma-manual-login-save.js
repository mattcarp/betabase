#!/usr/bin/env node
/**
 * Manual AOMA Login with Cookie Save
 * Opens browser, waits for you to manually login, then saves cookies
 */

const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const STORAGE_FILE = path.join(process.cwd(), "tmp/aoma-stage-storage.json");
const COOKIE_FILE = path.join(process.cwd(), "tmp/aoma-cookie.txt");

(async () => {
  console.log("🚀 Opening browser for manual login...\n");

  const browser = await chromium.launch({
    headless: false,
    slowMo: 100,
    args: ["--use-mock-keychain", "--password-store=basic"],
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  // Set default timeout to 10 minutes for all operations
  page.setDefaultTimeout(600000);

  console.log("🌐 Navigating to AOMA stage...");
  await page.goto("https://aoma-stage.smcdp-de.net", {
    waitUntil: "load",
    timeout: 120000,
  });

  console.log("\n👤 PLEASE LOG IN MANUALLY:");
  console.log('   1. Click "Employee Login"');
  console.log("   2. Enter your credentials");
  console.log("   3. Complete 2FA");
  console.log("   4. Wait until you see the AOMA homepage\n");

  // Wait for user to navigate to AOMA (check for logout of Microsoft)
  console.log("⏳ Waiting for login to complete...");
  console.log("   (Looking for aoma-stage.smcdp-de.net in URL)\n");

  await page.waitForFunction(
    () => {
      return (
        window.location.host === "aoma-stage.smcdp-de.net" &&
        !window.location.href.includes("chain=Login") &&
        !window.location.href.includes("login.microsoftonline.com")
      );
    },
    { timeout: 600000 } // 10 minutes
  );

  console.log("✅ Login detected! Saving authentication...\n");

  // Save storage state
  await context.storageState({ path: STORAGE_FILE });
  console.log(`✅ Saved storage to ${STORAGE_FILE}`);

  // Save cookies
  const cookies = await context.cookies();
  const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join("; ");
  fs.writeFileSync(COOKIE_FILE, cookieHeader);
  console.log(`✅ Saved ${cookies.length} cookies to ${COOKIE_FILE}\n`);

  console.log("🎉 Authentication captured successfully!");
  console.log("   You can now run the crawler: node scripts/aoma-playwright-crawler.js\n");

  await browser.close();
})().catch((err) => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
