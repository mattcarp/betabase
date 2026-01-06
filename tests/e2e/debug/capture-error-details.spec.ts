import { test } from "@playwright/test";

test("Capture detailed error information", async ({ page }) => {
  const errors: Array<{ timestamp: number; message: string; stack?: string }> = [];
  const pageErrors: Array<{ timestamp: number; error: Error }> = [];

  // Capture console errors with timestamps
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      errors.push({
        timestamp: Date.now(),
        message: msg.text(),
      });
      console.log(`[CONSOLE ERROR at ${new Date().toISOString()}]:`, msg.text());
    }
  });

  // Capture page errors (uncaught exceptions)
  page.on("pageerror", (error) => {
    pageErrors.push({
      timestamp: Date.now(),
      error: error,
    });
    console.log(`[PAGE ERROR at ${new Date().toISOString()}]:`, error.message);
    console.log("Stack:", error.stack);
  });

  console.log("\n🔍 Starting page load...");
  await page.goto("http://localhost:3000", {
    timeout: 120000,
    waitUntil: "domcontentloaded"
  });

  console.log("✅ Initial load complete, waiting 1 second...");
  await page.waitForTimeout(1000);
  await page.screenshot({ path: "test-results/error-step-1-after-1sec.png", fullPage: true });

  console.log("⏳ Waiting another second (2 sec total)...");
  await page.waitForTimeout(1000);
  await page.screenshot({ path: "test-results/error-step-2-after-2sec.png", fullPage: true });

  console.log("⏳ Waiting another second (3 sec total)...");
  await page.waitForTimeout(1000);
  await page.screenshot({ path: "test-results/error-step-3-after-3sec.png", fullPage: true });

  console.log("⏳ Waiting 2 more seconds (5 sec total)...");
  await page.waitForTimeout(2000);
  await page.screenshot({ path: "test-results/error-step-4-after-5sec.png", fullPage: true });

  // Check for Next.js error overlay
  const overlay = page.locator("nextjs-portal");
  const overlayCount = await overlay.count();

  if (overlayCount > 0) {
    console.log("\n❌ Next.js error overlay found!");

    // Try to get all text from the overlay
    const overlayText = await overlay.allTextContents();
    console.log("Overlay content:", overlayText);

    // Look for specific error elements
    const errorTitle = await page.locator('[data-nextjs-dialog-header]').textContent().catch(() => null);
    const errorBody = await page.locator('[data-nextjs-dialog-body]').textContent().catch(() => null);

    if (errorTitle) console.log("Error title:", errorTitle);
    if (errorBody) console.log("Error body:", errorBody);

    // Take a screenshot of the error
    await page.screenshot({ path: "test-results/error-overlay-detected.png", fullPage: true });
  } else {
    console.log("\n✅ No Next.js error overlay visible");
  }

  // Summary
  console.log("\n📊 Summary:");
  console.log(`   Console errors: ${errors.length}`);
  console.log(`   Page errors: ${pageErrors.length}`);
  console.log(`   Error overlay: ${overlayCount > 0 ? "YES" : "NO"}`);

  if (errors.length > 0) {
    console.log("\n❌ Console errors found:");
    errors.forEach((err, i) => {
      console.log(`   ${i + 1}. ${err.message}`);
    });
  }

  if (pageErrors.length > 0) {
    console.log("\n❌ Page errors found:");
    pageErrors.forEach((err, i) => {
      console.log(`   ${i + 1}. ${err.error.message}`);
      if (err.error.stack) {
        console.log(`      Stack: ${err.error.stack.split('\n')[0]}`);
      }
    });
  }
});
