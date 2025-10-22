#!/usr/bin/env node

/**
 * AOMA Authenticated Crawl
 * First ensures we're logged in, then navigates to actual AOMA content
 */

const { chromium } = require("playwright");
const fs = require("fs/promises");
const path = require("path");
const dotenv = require("dotenv");
const TurndownService = require("turndown");

// Load env vars
dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local" });

const AOMA_URL = "https://aoma-stage.smcdp-de.net";
const USERNAME = process.env.AAD_USERNAME;
const PASSWORD = process.env.AAD_PASSWORD;

if (!USERNAME || !PASSWORD) {
  console.error("❌ Missing AAD_USERNAME or AAD_PASSWORD");
  process.exit(1);
}

console.log("🚀 AOMA Authenticated Crawl");
console.log("👤 User:", USERNAME);
console.log("");

const turndown = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
});

async function navigateAndCrawl() {
  let browser;
  let context;

  // First check if we have existing auth
  try {
    const storageState = await fs.readFile("tmp/aoma-stage-storage.json", "utf8");
    console.log("📄 Found existing authentication, loading...");

    browser = await chromium.launch({
      headless: false,
      slowMo: 100,
    });

    context = await browser.newContext({
      storageState: JSON.parse(storageState),
    });
  } catch {
    console.log("⚠️ No existing auth, starting fresh...");
    browser = await chromium.launch({
      headless: false,
      slowMo: 100,
    });
    context = await browser.newContext();
  }

  const page = await context.newPage();

  try {
    // Try to go directly to AOMA home
    console.log("📍 Navigating to AOMA home...");
    await page.goto(
      "https://aoma-stage.smcdp-de.net/servlet/com.sonymusic.aoma.AOMADispatcherServlet?chain=CustomHomePageViewAction",
      {
        waitUntil: "networkidle",
        timeout: 60000,
      }
    );

    await page.waitForTimeout(3000);

    // Check if we're on a login page
    const url = page.url();
    if (url.includes("login") || url.includes("microsoftonline")) {
      console.log("🔐 Need to authenticate...\n");

      // Click Employee Login if present
      try {
        const employeeBtn = page.locator('button:has-text("Employee Login"), #aadLoginBtn');
        if (await employeeBtn.isVisible({ timeout: 3000 })) {
          console.log("🔘 Clicking Employee Login...");
          await employeeBtn.click();
          await page.waitForTimeout(2000);
        }
      } catch {}

      // Handle Microsoft login
      if (page.url().includes("microsoftonline")) {
        console.log("📝 Entering credentials...");

        // Username
        await page.fill('input[name="loginfmt"], #i0116', USERNAME);
        await page.click("#idSIButton9");
        await page.waitForTimeout(1500);

        // Password
        await page.fill('input[type="password"], #i0118', PASSWORD);
        await page.click("#idSIButton9");

        console.log("\n⏳ WAITING FOR MFA APPROVAL...");
        console.log("   Please approve on your phone\n");

        // Wait for MFA
        for (let i = 0; i < 120; i++) {
          await page.waitForTimeout(1000);
          if (!page.url().includes("microsoftonline")) break;

          // Handle stay signed in
          try {
            await page.click('#idSIButton9, button:has-text("Yes")', { timeout: 300 });
          } catch {}
        }
      }
    }

    // Now we should be in AOMA
    await page.waitForTimeout(3000);

    // Try to navigate to the actual AOMA content areas
    console.log("\n🕷️ Navigating to AOMA content areas...\n");

    // First try the home page    const homeUrl = 'https://aoma-stage.smcdp-de.net/servlet/com.sonymusic.aoma.AOMADispatcherServlet?chain=CustomHomePageViewAction';
    console.log(`Going to: ${homeUrl}`);
    await page.goto(homeUrl, { waitUntil: "networkidle" });
    await page.waitForTimeout(3000);

    const currentUrl = page.url();
    const title = await page.title();
    console.log(`Current URL: ${currentUrl}`);
    console.log(`Title: ${title}\n`);

    // Look for navigation links on the page
    const links = await page.evaluate(() => {
      const anchors = document.querySelectorAll("a");
      return Array.from(anchors)
        .map((a) => ({
          text: a.innerText?.trim(),
          href: a.href,
        }))
        .filter((l) => l.text && l.href && l.href.includes("aoma"));
    });

    console.log(`Found ${links.length} AOMA links on page:\n`);
    links.slice(0, 10).forEach((link) => {
      console.log(`  - ${link.text}: ${link.href}`);
    });

    // Save the current page
    await fs.mkdir("tmp/aoma-content", { recursive: true });
    const html = await page.content();
    const markdown = turndown.turndown(html);

    await fs.writeFile("tmp/aoma-content/home.html", html);
    await fs.writeFile("tmp/aoma-content/home.md", markdown);
    await page.screenshot({ path: "tmp/aoma-content/home.png", fullPage: true });

    console.log("\n✅ Saved current page content");
    console.log("\n📝 Check tmp/aoma-content/ for the files");

    // Save cookies for next time
    const storage = await context.storageState();
    await fs.writeFile("tmp/aoma-stage-storage.json", JSON.stringify(storage, null, 2));
    console.log("💾 Saved authentication state\n");
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    console.log("Keeping browser open for 15 seconds...");
    await page.waitForTimeout(15000);
    await browser.close();
  }
}

navigateAndCrawl();
