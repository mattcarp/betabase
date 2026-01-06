import { test } from "@playwright/test";

test("Capture error after 3 second delay", async ({ page, context }) => {
  console.log("\n🔍 Loading page and waiting for delayed error...\n");

  const errors: string[] = [];
  const pageErrors: Array<{ message: string; stack?: string }> = [];

  // Capture console errors
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      const text = msg.text();
      errors.push(text);
      console.log(`[CONSOLE ERROR]: ${text}`);
    }
  });

  // Capture page errors (uncaught exceptions)
  page.on("pageerror", (error) => {
    pageErrors.push({
      message: error.message,
      stack: error.stack,
    });
    console.log(`\n❌ [PAGE ERROR]: ${error.message}`);
    if (error.stack) {
      console.log(`Stack trace:\n${error.stack}\n`);
    }
  });

  // Navigate to page
  await page.goto("http://localhost:3000", {
    timeout: 120000,
    waitUntil: "domcontentloaded",
  });

  console.log("✅ Initial page loaded\n");
  await page.screenshot({ path: "test-results/delayed-0sec.png", fullPage: true });

  // Wait and take screenshots every second for 5 seconds
  for (let i = 1; i <= 5; i++) {
    await page.waitForTimeout(1000);
    await page.screenshot({
      path: `test-results/delayed-${i}sec.png`,
      fullPage: true,
    });
    console.log(`📸 ${i}s - screenshot taken`);

    // Check if error page is visible
    const errorVisible = await page.locator('text="Something went wrong"').count();
    if (errorVisible > 0) {
      console.log(`\n❌ ERROR PAGE APPEARED AT ${i} SECONDS!`);

      // Try to get error details from the page
      const errorText = await page.locator('text="An unexpected error occurred"').textContent();
      console.log(`Error message: ${errorText}`);

      // Check Next.js error overlay
      const overlay = await page.locator("nextjs-portal").count();
      if (overlay > 0) {
        const overlayText = await page.locator("nextjs-portal").allTextContents();
        console.log(`\nNext.js overlay content:`, overlayText);
      }

      break;
    }
  }

  console.log("\n📊 Error Summary:");
  console.log(`   Console errors: ${errors.length}`);
  console.log(`   Page errors: ${pageErrors.length}`);

  if (errors.length > 0) {
    console.log("\n❌ Console Errors:");
    errors.forEach((err, i) => console.log(`   ${i + 1}. ${err}`));
  }

  if (pageErrors.length > 0) {
    console.log("\n❌ Page Errors:");
    pageErrors.forEach((err, i) => {
      console.log(`   ${i + 1}. ${err.message}`);
      if (err.stack) console.log(`      ${err.stack.split("\n")[1]}`);
    });
  }

  if (errors.length === 0 && pageErrors.length === 0) {
    console.log("   No errors captured in browser console");
    console.log("   Error must be server-side or in error boundary");
  }

  console.log("\n");
});
