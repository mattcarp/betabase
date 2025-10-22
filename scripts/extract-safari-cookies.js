#!/usr/bin/env node

/**
 * Extract cookies from Safari and create Playwright storage state
 */

const { webkit } = require("playwright");
const fs = require("fs").promises;
const path = require("path");

const AOMA_URL = "https://aoma-stage.smcdp-de.net";
const OUT_FILE = path.join(__dirname, "../tmp/aoma-stage-storage.json");

(async () => {
  console.log("🔍 Extracting cookies from Safari session...\n");

  // Launch webkit (Safari engine) and connect to existing session
  const browser = await webkit.launch({
    headless: false,
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  console.log("📱 Opening AOMA in webkit...");
  await page.goto(AOMA_URL, { waitUntil: "networkidle", timeout: 30000 });

  // Wait a bit for any redirects
  await page.waitForTimeout(3000);

  const currentUrl = page.url();
  console.log(`Current URL: ${currentUrl}`);

  if (currentUrl.includes("login") || currentUrl.includes("microsoft")) {
    console.log("⚠️ Not logged in - session not found");
    await browser.close();
    process.exit(1);
  }

  console.log("✅ Logged in! Extracting session...");

  // Save storage state (includes cookies, localStorage, etc)
  const storageState = await context.storageState();

  await fs.mkdir(path.dirname(OUT_FILE), { recursive: true });
  await fs.writeFile(OUT_FILE, JSON.stringify(storageState, null, 2));

  console.log(`✅ Saved session to: ${OUT_FILE}`);
  console.log(`\nCookies extracted: ${storageState.cookies?.length || 0}`);

  await browser.close();

  console.log("\n🚀 Ready to crawl!");
})();
