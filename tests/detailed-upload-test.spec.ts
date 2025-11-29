import { test, expect } from './fixtures/base-test';

test.describe("SIAM Detailed File Upload Testing", () => {
  test("examine Files tab and test upload functionality", async ({ page }) => {
    console.log("🚀 Testing SIAM file upload functionality in detail...");

    // Navigate to SIAM
    await page.goto("http://localhost:3000");
    await page.waitForTimeout(3000);

    // Click Curate tab
    await page.locator("text=Curate").click();
    await page.waitForTimeout(2000);

    // Take screenshot of Curate overview
    await page.screenshot({
      path: "detailed-1-curate-overview.png",
      fullPage: true,
    });
    console.log("📸 Screenshot: detailed-1-curate-overview.png");

    // Click on the Files tab within Curate
    console.log("🔍 Looking for Files tab in Curate section...");
    const filesTab = page.locator("text=Files");

    if (await filesTab.isVisible()) {
      console.log("✅ Found Files tab, clicking...");
      await filesTab.click();
      await page.waitForTimeout(2000);

      await page.screenshot({
        path: "detailed-2-files-tab.png",
        fullPage: true,
      });
      console.log("📸 Screenshot: detailed-2-files-tab.png");

      // Look for upload functionality in Files tab
      console.log("🔍 Examining Files tab for upload elements...");

      const fileInputs = await page.locator('input[type="file"]').count();
      const uploadButtons = await page
        .locator(
          'button:has-text("Upload"), button:has-text("Add"), button:has-text("Import"), button:has-text("Choose")'
        )
        .count();
      const dropZones = await page
        .locator('[data-testid*="drop"], .drop-zone, *:has-text("drag"), *:has-text("Drop")')
        .count();

      console.log(`Files tab - File inputs: ${fileInputs}`);
      console.log(`Files tab - Upload buttons: ${uploadButtons}`);
      console.log(`Files tab - Drop zones: ${dropZones}`);

      // Get all visible text to analyze
      const filesTabText = await page.textContent(
        '.knowledge-curation, [data-testid="files-content"], .files-section, main'
      );
      console.log(
        "Files tab contains text about upload:",
        filesTabText?.toLowerCase().includes("upload") || false
      );
    } else {
      console.log("❌ Files tab not found in Curate section");
    }

    // Test Chat interface file upload
    console.log("🔍 Testing Chat interface file upload...");
    await page.locator("text=Chat").click();
    await page.waitForTimeout(2000);

    await page.screenshot({
      path: "detailed-3-chat-interface.png",
      fullPage: true,
    });
    console.log("📸 Screenshot: detailed-3-chat-interface.png");

    // Look for the paperclip/attach button
    const paperclipButton = page.locator(
      '[data-testid="file-upload"], button:has([data-testid="paperclip"]), button[aria-label*="attach"], button[aria-label*="file"], .upload-button'
    );
    const paperclipCount = await paperclipButton.count();
    console.log(`Paperclip/attach buttons found: ${paperclipCount}`);

    if (paperclipCount > 0) {
      console.log("✅ Found attachment button in chat, testing click...");
      await paperclipButton.first().hover();
      await page.waitForTimeout(1000);

      await page.screenshot({
        path: "detailed-4-paperclip-hover.png",
        fullPage: true,
      });
      console.log("📸 Screenshot: detailed-4-paperclip-hover.png");

      // Try clicking the paperclip
      await paperclipButton.first().click();
      await page.waitForTimeout(1000);

      await page.screenshot({
        path: "detailed-5-paperclip-clicked.png",
        fullPage: true,
      });
      console.log("📸 Screenshot: detailed-5-paperclip-clicked.png");

      // Check if file dialog or upload interface appeared
      const fileDialog = await page.locator('input[type="file"]').count();
      console.log(`File inputs after paperclip click: ${fileDialog}`);
    }

    // Test for any hidden file inputs that might become visible
    console.log("🔍 Checking for hidden file inputs...");
    const allFileInputs = await page.locator('input[type="file"]').all();
    console.log(`Total file inputs on page: ${allFileInputs.length}`);

    for (let i = 0; i < allFileInputs.length; i++) {
      const input = allFileInputs[i];
      const isVisible = await input.isVisible();
      const accept = (await input.getAttribute("accept")) || "no accept attribute";
      const id = (await input.getAttribute("id")) || "no id";
      const dataTestId = (await input.getAttribute("data-testid")) || "no data-testid";

      console.log(
        `File input ${i + 1}: visible=${isVisible}, accept="${accept}", id="${id}", data-testid="${dataTestId}"`
      );
    }

    // Look for AOMA upload buttons specifically
    console.log("🔍 Searching for AOMA upload functionality...");
    const aomaUploadButton = page.locator(
      'button:has-text("Upload files to AOMA"), button:has-text("AOMA knowledge"), button:has-text("knowledge base")'
    );
    const aomaButtonCount = await aomaUploadButton.count();
    console.log(`AOMA upload buttons found: ${aomaButtonCount}`);

    if (aomaButtonCount > 0) {
      const aomaButtonTexts = await aomaUploadButton.allTextContents();
      console.log("AOMA button texts:", aomaButtonTexts);
    }

    // Final comprehensive screenshot
    await page.screenshot({
      path: "detailed-6-final-state.png",
      fullPage: true,
    });
    console.log("📸 Final screenshot: detailed-6-final-state.png");

    console.log("\n🏁 DETAILED UPLOAD FUNCTIONALITY REPORT:");
    console.log("=".repeat(50));
    console.log("📁 Curate Tab:");
    console.log(`  - Accessible: ${await page.locator("text=Curate").isVisible()}`);
    console.log(`  - Files sub-tab: ${await filesTab.isVisible()}`);
    console.log("");
    console.log("💬 Chat Interface:");
    console.log(`  - File inputs found: ${allFileInputs.length}`);
    console.log(`  - Paperclip buttons: ${paperclipCount}`);
    console.log("");
    console.log("🧠 AOMA Integration:");
    console.log(`  - AOMA upload buttons: ${aomaButtonCount}`);
    console.log("");
    console.log("📸 Screenshots saved:");
    console.log("  - detailed-1-curate-overview.png");
    console.log("  - detailed-2-files-tab.png");
    console.log("  - detailed-3-chat-interface.png");
    console.log("  - detailed-4-paperclip-hover.png");
    console.log("  - detailed-5-paperclip-clicked.png");
    console.log("  - detailed-6-final-state.png");
  });
});
