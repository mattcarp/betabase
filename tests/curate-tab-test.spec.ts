import { test, expect } from "@playwright/test";
import { setupConsoleMonitoring, assertNoConsoleErrors } from "./helpers/console-monitor";

test.describe("SIAM Curate Tab File Upload Investigation", () => {
  test("examine Curate tab interface for file upload functionality", async ({ page }) => {
    // Setup console monitoring
    setupConsoleMonitoring(page, {
      ignoreWarnings: true,
      ignoreNetworkErrors: true,
    });

    console.log("🚀 Testing SIAM Curate tab...");

    // Navigate to SIAM
    await page.goto("http://localhost:3000");
    await page.waitForTimeout(3000); // Give it time to load

    // Take screenshot of main interface
    await page.screenshot({
      path: "curate-test-1-main-interface.png",
      fullPage: true,
    });
    console.log("📸 Screenshot: curate-test-1-main-interface.png");

    // Click on the Curate tab
    console.log("🔍 Looking for Curate tab...");
    const curateTab = page.locator("text=Curate");

    if (await curateTab.isVisible()) {
      console.log("✅ Found Curate tab, clicking...");
      await curateTab.click();
      await page.waitForTimeout(2000);

      // Take screenshot of Curate tab
      await page.screenshot({
        path: "curate-test-2-curate-tab.png",
        fullPage: true,
      });
      console.log("📸 Screenshot: curate-test-2-curate-tab.png");

      // Search for file upload elements in Curate tab
      console.log("🔍 Examining Curate tab for upload elements...");

      // Look for file inputs
      const fileInputs = await page.locator('input[type="file"]').count();
      console.log(`File inputs in Curate tab: ${fileInputs}`);

      // Look for upload buttons
      const uploadButtons = page.locator(
        'button:has-text("Upload"), button:has-text("upload"), button:has-text("Choose"), button:has-text("Select"), button:has-text("Browse"), button:has-text("Add")'
      );
      const uploadButtonCount = await uploadButtons.count();
      console.log(`Upload buttons in Curate tab: ${uploadButtonCount}`);

      if (uploadButtonCount > 0) {
        const buttonTexts = await uploadButtons.allTextContents();
        console.log("Upload button texts:", buttonTexts);
      }

      // Look for specific AOMA upload functionality
      const aomaUpload = page.locator(
        '*:has-text("Upload files to AOMA"), *:has-text("knowledge base"), *:has-text("AOMA")'
      );
      const aomaCount = await aomaUpload.count();
      console.log(`AOMA upload elements: ${aomaCount}`);

      // Look for drag and drop areas
      const dropZones = page.locator(
        '[data-testid*="drop"], .drop-zone, .upload-zone, *:has-text("drag"), *:has-text("drop")'
      );
      const dropZoneCount = await dropZones.count();
      console.log(`Drop zones: ${dropZoneCount}`);

      // Check for existing file lists
      const fileLists = page.locator(
        '.file-list, ul li, [data-testid*="file"], *:has-text(".pdf"), *:has-text(".txt"), *:has-text(".doc")'
      );
      const fileListCount = await fileLists.count();
      console.log(`File list elements: ${fileListCount}`);

      // Take focused screenshot of any upload areas found
      if (uploadButtonCount > 0 || fileInputs > 0 || aomaCount > 0) {
        console.log("📸 Taking focused screenshot of upload area...");
        await page.screenshot({
          path: "curate-test-3-upload-area.png",
          fullPage: true,
        });
      }
    } else {
      console.log("❌ Curate tab not found");
    }

    // Also check the Chat tab for upload functionality
    console.log("🔍 Checking Chat tab for upload functionality...");
    const chatTab = page.locator("text=Chat");

    if (await chatTab.isVisible()) {
      await chatTab.click();
      await page.waitForTimeout(2000);

      await page.screenshot({
        path: "curate-test-4-chat-tab.png",
        fullPage: true,
      });
      console.log("📸 Screenshot: curate-test-4-chat-tab.png");

      // Look for upload elements in chat
      const chatFileInputs = await page.locator('input[type="file"]').count();
      const chatUploadButtons = await page
        .locator(
          'button:has-text("Upload"), button:has-text("upload"), [data-testid*="upload"], *:has-text("Paperclip"), *:has-text("Attach")'
        )
        .count();

      console.log(`Chat file inputs: ${chatFileInputs}`);
      console.log(`Chat upload buttons: ${chatUploadButtons}`);
    }

    // Final summary
    console.log("\n🏁 CURATE TAB INVESTIGATION SUMMARY:");
    console.log("- Curate tab accessible: " + (await curateTab.isVisible()));
    console.log("- Screenshots taken: curate-test-1 through curate-test-4");

    // Assert no console errors
    assertNoConsoleErrors();
  });
});
