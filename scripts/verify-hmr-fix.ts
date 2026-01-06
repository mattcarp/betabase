/**
 * Quick verification script for HMR fix
 * Checks browser console for the specific error that was fixed
 */

import { chromium } from "@playwright/test";

async function verifyHMRFix() {
  console.log("🔍 Verifying HMR fix...\n");

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const consoleErrors: string[] = [];
  const consoleWarnings: string[] = [];

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      consoleErrors.push(msg.text());
    }
    if (msg.type() === "warning") {
      consoleWarnings.push(msg.text());
    }
  });

  page.on("pageerror", (error) => {
    consoleErrors.push(error.message);
  });

  try {
    console.log("📄 Loading http://localhost:3000 ...");
    await page.goto("http://localhost:3000", {
      timeout: 120000, // 2 minutes for initial compile
      waitUntil: "domcontentloaded",
    });

    // Wait a bit for any async errors
    await page.waitForTimeout(3000);

    console.log("\n✅ Page loaded successfully!\n");

    // Check for the specific HMR error
    const hmrErrors = consoleErrors.filter(
      (err) =>
        err.includes("Cannot read properties of undefined") &&
        err.includes("reading 'call'")
    );

    const fastRefreshWarnings = consoleWarnings.filter((warn) =>
      warn.includes("Fast Refresh had to perform a full reload")
    );

    console.log("📊 Results:");
    console.log(`   Total console errors: ${consoleErrors.length}`);
    console.log(`   HMR 'call' errors: ${hmrErrors.length}`);
    console.log(`   Fast Refresh warnings: ${fastRefreshWarnings.length}\n`);

    if (hmrErrors.length > 0) {
      console.log("❌ HMR ERROR STILL PRESENT:");
      hmrErrors.forEach((err) => console.log(`   ${err}`));
      console.log("");
    }

    if (consoleErrors.length > 0) {
      console.log("⚠️  Other console errors:");
      consoleErrors.forEach((err) => console.log(`   ${err}`));
      console.log("");
    }

    // Check that page rendered
    const bodyText = await page.locator("body").textContent();
    const hasContent = bodyText && bodyText.length > 100;

    console.log("📋 Page verification:");
    console.log(`   Page has content: ${hasContent ? "✅" : "❌"}`);
    console.log(`   Theme applied: ${(await page.getAttribute("html", "data-theme")) || "N/A"}`);

    if (hmrErrors.length === 0 && hasContent) {
      console.log("\n🎉 SUCCESS! HMR fix is working correctly.\n");
      await browser.close();
      process.exit(0);
    } else {
      console.log("\n❌ FAILED! HMR error is still occurring or page failed to render.\n");
      await browser.close();
      process.exit(1);
    }
  } catch (error) {
    console.error(`\n❌ Error during verification: ${error}`);
    await browser.close();
    process.exit(1);
  }
}

verifyHMRFix();
