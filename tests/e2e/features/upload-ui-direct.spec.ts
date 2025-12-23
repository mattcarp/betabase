import { test, expect } from "@playwright/test";

test.describe("SIAM File Upload UI Direct Access", () => {
  test("examine file upload interface with auth bypass", async ({ page }) => {
    console.log("🚀 Accessing SIAM with auth bypass...");

    // Navigate to SIAM with auth bypass
    await page.goto("http://localhost:3000");
    await page.waitForLoadState("networkidle");

    // Take initial screenshot
    await page.screenshot({
      path: "siam-bypassed-auth.png",
      fullPage: true,
    });
    console.log("📸 Screenshot: siam-bypassed-auth.png");

    // Look for main navigation or tabs
    console.log("🔍 Looking for navigation elements...");

    // Check for any tabs, buttons, or navigation
    const navElements = await page
      .locator('button, [role="tab"], nav a, .tab, .nav-item')
      .allTextContents();
    console.log("Navigation elements found:", navElements);

    // Look specifically for Curate tab
    const curateElements = page.locator('*:has-text("Curate"), *:has-text("curate")');
    const curateCount = await curateElements.count();
    console.log(`Found ${curateCount} elements containing "Curate"`);

    if (curateCount > 0) {
      console.log("✅ Found Curate element, clicking...");
      await curateElements.first().click();
      await page.waitForTimeout(2000);

      await page.screenshot({
        path: "siam-curate-tab-bypassed.png",
        fullPage: true,
      });
      console.log("📸 Screenshot: siam-curate-tab-bypassed.png");
    }

    // Search for file upload elements
    console.log("🔍 Searching for file upload elements...");

    // File inputs
    const fileInputs = await page.locator('input[type="file"]').count();
    console.log(`File inputs found: ${fileInputs}`);

    // Upload buttons
    const uploadButtons = await page
      .locator(
        'button:has-text("Upload"), button:has-text("upload"), button:has-text("Choose"), button:has-text("Select"), button:has-text("Browse"), button:has-text("Add"), button:has-text("Import")'
      )
      .count();
    console.log(`Upload buttons found: ${uploadButtons}`);

    // AOMA specific
    const aomaElements = await page
      .locator('*:has-text("AOMA"), *:has-text("knowledge base"), *:has-text("Knowledge Base")')
      .count();
    console.log(`AOMA/Knowledge base elements found: ${aomaElements}`);

    // Get all visible text to search for upload-related content
    const pageText = await page.textContent("body");
    const hasUploadText = pageText?.toLowerCase().includes("upload") || false;
    const hasFileText = pageText?.toLowerCase().includes("file") || false;
    const hasCurateText = pageText?.toLowerCase().includes("curate") || false;

    console.log(`Page contains "upload": ${hasUploadText}`);
    console.log(`Page contains "file": ${hasFileText}`);
    console.log(`Page contains "curate": ${hasCurateText}`);

    // Take final screenshot
    await page.screenshot({
      path: "siam-final-upload-check.png",
      fullPage: true,
    });
    console.log("📸 Final screenshot: siam-final-upload-check.png");

    // Summary
    console.log("\n📋 UPLOAD FUNCTIONALITY SUMMARY:");
    console.log(`- File input elements: ${fileInputs}`);
    console.log(`- Upload button elements: ${uploadButtons}`);
    console.log(`- AOMA/Knowledge base elements: ${aomaElements}`);
    console.log(`- Contains upload text: ${hasUploadText}`);
    console.log(`- Contains file text: ${hasFileText}`);
    console.log(`- Contains curate text: ${hasCurateText}`);

    const hasAnyUploadFeature =
      fileInputs > 0 || uploadButtons > 0 || aomaElements > 0 || hasUploadText;
    console.log(`- ANY upload functionality detected: ${hasAnyUploadFeature}`);
  });
});
