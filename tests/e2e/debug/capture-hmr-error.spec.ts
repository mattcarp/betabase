import { test, expect } from "@playwright/test";

test("Capture HMR error after delay", async ({ page }) => {
  console.log("🔍 Loading page and waiting 2 seconds to capture error...");

  // Navigate to the page
  await page.goto("http://localhost:3000", {
    timeout: 120000,
    waitUntil: "domcontentloaded"
  });

  console.log("✅ Initial page loaded");

  // Wait 2 seconds for error to appear
  await page.waitForTimeout(2000);

  console.log("📸 Taking screenshot after 2 second delay...");

  // Take screenshot
  await page.screenshot({
    path: "test-results/hmr-error-after-2sec.png",
    fullPage: true
  });

  // Capture console errors
  const consoleErrors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      consoleErrors.push(msg.text());
    }
  });

  // Wait another 3 seconds to catch any delayed errors
  await page.waitForTimeout(3000);

  console.log("📸 Taking second screenshot after 5 seconds total...");
  await page.screenshot({
    path: "test-results/hmr-error-after-5sec.png",
    fullPage: true
  });

  // Get the page HTML to see error details
  const bodyText = await page.locator("body").textContent();
  console.log("📄 Page body text:", bodyText?.substring(0, 500));

  // Check for error boundary or error messages in the DOM
  const errorMessages = await page.locator('[class*="error"], [class*="Error"]').allTextContents();
  if (errorMessages.length > 0) {
    console.log("❌ Error messages found:", errorMessages);
  }

  // Look for Next.js error overlay
  const nextErrorOverlay = await page.locator("nextjs-portal").count();
  if (nextErrorOverlay > 0) {
    console.log("❌ Next.js error overlay detected");
    const overlayText = await page.locator("nextjs-portal").textContent();
    console.log("Error overlay content:", overlayText);
  }

  console.log("✅ Screenshots saved to test-results/");
});
