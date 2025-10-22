#!/usr/bin/env node

const { chromium } = require("playwright");
const fs = require("fs/promises");
const dotenv = require("dotenv");

// Load env
dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local" });

const USERNAME = process.env.AAD_USERNAME;
const PASSWORD = process.env.AAD_PASSWORD;

console.log("🚀 AOMA Login - FINAL VERSION");
console.log(`👤 ${USERNAME}\n`);

async function loginAndCrawl() {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 100,
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Go to AOMA
    console.log("Going to AOMA...");
    await page.goto("https://aoma-stage.smcdp-de.net", { waitUntil: "networkidle" });

    // CLICK EMPLOYEE LOGIN - IT'S ALWAYS THERE
    console.log("Clicking Employee Login...");
    await page.click("#aadLoginBtn");
    await page.waitForTimeout(2000);

    // Now we're on Microsoft login
    console.log("Filling username...");
    await page.fill("#i0116", USERNAME);
    await page.click("#idSIButton9");
    await page.waitForTimeout(1500);

    // Password
    console.log("Filling password...");
    await page.fill("#i0118", PASSWORD);
    await page.click("#idSIButton9");

    console.log("\n⏳ APPROVE MFA ON YOUR PHONE NOW!\n");

    // Wait for MFA
    for (let i = 0; i < 120; i++) {
      await page.waitForTimeout(1000);

      // Check if back on AOMA
      if (page.url().includes("aoma-stage") && !page.url().includes("login")) {
        console.log("✅ LOGGED IN!");
        break;
      }

      // Handle "Stay signed in?"
      try {
        await page.click('#idSIButton9, button:has-text("Yes")', { timeout: 300 });
      } catch {}
    }

    // Check if we're logged in
    await page.waitForTimeout(3000);
    const url = page.url();
    console.log(`\nCurrent URL: ${url}`);

    if (url.includes("aoma-stage") && !url.includes("login")) {
      console.log("✅ LOGGED IN!");

      // Save cookies
      const storage = await context.storageState();
      await fs.mkdir("tmp", { recursive: true });
      await fs.writeFile("tmp/aoma-stage-storage.json", JSON.stringify(storage, null, 2));
      console.log("💾 Saved auth state");

      // Crawl
      await crawlPages(page);
    }
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    console.log("\nKeeping open for 10 seconds...");
    await page.waitForTimeout(10000);
    await browser.close();
  }
}

async function crawlPages(page) {
  console.log("\n🕷️ CRAWLING...\n");

  const pages = [
    "/aoma-ui/my-aoma-files",
    "/aoma-ui/simple-upload",
    "/aoma-ui/direct-upload",
    "/aoma-ui/product-metadata-viewer",
  ];

  for (const path of pages) {
    try {
      const url = `https://aoma-stage.smcdp-de.net${path}`;
      console.log(`Going to: ${url}`);

      await page.goto(url, { waitUntil: "networkidle" });
      await page.waitForTimeout(2000);

      const title = await page.title();
      const html = await page.content();

      const fileName = `tmp/aoma_${path.replace(/\//g, "_")}.html`;
      await fs.writeFile(fileName, html);
      await page.screenshot({ path: fileName.replace(".html", ".png"), fullPage: true });

      console.log(`  ✅ ${title}`);
    } catch (e) {
      console.error(`  ❌ Failed: ${e.message}`);
    }
  }

  console.log("\n✅ DONE!");
}

loginAndCrawl();
