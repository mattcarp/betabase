import { chromium } from "playwright";

(async () => {
  console.log("🎭 Taking screenshot of local SIAM app...\n");

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });
  const page = await context.newPage();

  try {
    // Load the local page
    console.log("📍 Loading http://localhost:3000...");
    await page.goto("http://localhost:3000", {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });

    // Wait for content to fully load
    await page.waitForTimeout(2000);

    // Get page title
    const title = await page.title();
    console.log(`✅ Page loaded! Title: "${title}"`);

    // Take screenshot
    await page.screenshot({
      path: "siam-local-screenshot.png",
      fullPage: true,
    });
    console.log("✅ Screenshot saved as siam-local-screenshot.png");

    // Check for signup button (should NOT be there in Professional form)
    const hasSignupButton = (await page.locator("text=/Don't have an account/i").count()) > 0;
    console.log(`🔍 Signup button present: ${hasSignupButton ? "YES (old code)" : "NO (correct)"}`);

    // Get build timestamp from footer
    const buildTimestamp = await page.locator("footer").textContent();
    console.log(`⏰ Build timestamp: ${buildTimestamp}`);

    console.log("\n🎯 Local screenshot captured successfully!");
  } catch (error) {
    console.error("❌ Screenshot failed:", error.message);
  } finally {
    await browser.close();
  }
})();
