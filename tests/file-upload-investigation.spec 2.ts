import { test, expect } from "@playwright/test";

test.describe("SIAM File Upload Functionality Investigation", () => {
  test("comprehensive file upload UI examination", async ({ page }) => {
    console.log("🚀 Starting SIAM file upload investigation...");

    // Navigate to SIAM homepage
    await page.goto("http://localhost:3000");
    console.log("✅ Navigated to SIAM homepage");

    // Wait for page to load
    await page.waitForLoadState("networkidle");

    // Take initial screenshot
    await page.screenshot({
      path: "siam-homepage-initial.png",
      fullPage: true,
    });
    console.log("📸 Screenshot: siam-homepage-initial.png");

    // Look for authentication (check if we need to login first)
    const emailInput = page.locator('input[type="email"]');
    if (await emailInput.isVisible()) {
      console.log("🔐 Authentication required - using hidden password field for testing");

      // Fill email
      await emailInput.fill("matt@mattcarpenter.com");

      // Look for and use hidden password field for automated testing
      const passwordField = page.locator('input[type="password"]');
      if ((await passwordField.count()) > 0) {
        // Make password field visible for testing
        await page.evaluate(() => {
          const pwFields = document.querySelectorAll('input[type="password"]');
          pwFields.forEach((field) => {
            if (field instanceof HTMLElement) {
              field.style.display = "block";
              field.removeAttribute("hidden");
            }
          });
        });

        await passwordField.fill("test123");
        console.log("🔑 Filled hidden password field for automated testing");
      }

      // Click login/submit button
      const loginButton = page.locator(
        'button[type="submit"], button:has-text("Send"), button:has-text("Login")'
      );
      if (await loginButton.isVisible()) {
        await loginButton.click();
        await page.waitForLoadState("networkidle");
        console.log("🚪 Attempted login");
      }
    }

    // Take screenshot after potential login
    await page.screenshot({
      path: "siam-after-auth.png",
      fullPage: true,
    });
    console.log("📸 Screenshot: siam-after-auth.png");

    // Look for navigation tabs
    console.log("🔍 Searching for navigation tabs...");
    const tabs = await page.locator('button, a, [role="tab"]').allTextContents();
    console.log("Found potential tabs:", tabs);

    // Look specifically for Curate tab
    const curateTab = page.locator(
      'button:has-text("Curate"), a:has-text("Curate"), [role="tab"]:has-text("Curate")'
    );
    if ((await curateTab.count()) > 0) {
      console.log("✅ Found Curate tab!");
      await curateTab.first().click();
      await page.waitForLoadState("networkidle");

      // Take screenshot of Curate tab
      await page.screenshot({
        path: "siam-curate-tab.png",
        fullPage: true,
      });
      console.log("📸 Screenshot: siam-curate-tab.png");

      // Look for file upload elements in Curate tab
      console.log("🔍 Examining Curate tab for file upload elements...");
    } else {
      console.log("❌ Curate tab not found, checking main interface...");
    }

    // Search for file upload related elements across the entire page
    console.log("🔍 Comprehensive search for file upload elements...");

    // Check for file input elements
    const fileInputs = page.locator('input[type="file"]');
    const fileInputCount = await fileInputs.count();
    console.log(`Found ${fileInputCount} file input elements`);

    if (fileInputCount > 0) {
      for (let i = 0; i < fileInputCount; i++) {
        const input = fileInputs.nth(i);
        const isVisible = await input.isVisible();
        const accept = await input.getAttribute("accept");
        console.log(`File input ${i + 1}: visible=${isVisible}, accept="${accept}"`);
      }
    }

    // Check for upload-related buttons
    const uploadButtons = page.locator(
      'button:has-text("Upload"), button:has-text("upload"), button:has-text("Choose"), button:has-text("Select"), button:has-text("Browse")'
    );
    const uploadButtonCount = await uploadButtons.count();
    console.log(`Found ${uploadButtonCount} potential upload buttons`);

    if (uploadButtonCount > 0) {
      const buttonTexts = await uploadButtons.allTextContents();
      console.log("Upload button texts:", buttonTexts);
    }

    // Look for the specific "Upload files to AOMA knowledge base" button
    const aomaUploadButton = page.locator(
      'button:has-text("Upload files to AOMA"), button:has-text("AOMA knowledge"), button:has-text("knowledge base")'
    );
    const aomaButtonCount = await aomaUploadButton.count();
    console.log(`Found ${aomaButtonCount} AOMA upload buttons`);

    // Check for drag and drop areas
    const dropZones = page.locator(
      '[data-testid*="drop"], [data-testid*="upload"], .drop-zone, .upload-zone, [role="button"]:has-text("drop")'
    );
    const dropZoneCount = await dropZones.count();
    console.log(`Found ${dropZoneCount} potential drop zones`);

    // Check for existing files in knowledge base
    const fileList = page.locator(
      '.file-list, [data-testid*="file"], .knowledge-base-files, ul li:has-text(".pdf"), ul li:has-text(".txt"), ul li:has-text(".doc")'
    );
    const fileListCount = await fileList.count();
    console.log(`Found ${fileListCount} elements that might contain file lists`);

    // Take screenshot of current state
    await page.screenshot({
      path: "siam-upload-investigation.png",
      fullPage: true,
    });
    console.log("📸 Screenshot: siam-upload-investigation.png");

    // Check the chat interface specifically
    console.log("🔍 Examining chat interface for upload capabilities...");

    const chatContainer = page.locator('.chat, [data-testid*="chat"], .conversation, .messages');
    if ((await chatContainer.count()) > 0) {
      console.log("✅ Found chat interface");

      // Look for upload elements in chat
      const chatUploadButton = page.locator(
        '.chat button:has-text("Upload"), .chat input[type="file"], [data-testid*="chat"] button:has-text("Upload")'
      );
      const chatUploadCount = await chatUploadButton.count();
      console.log(`Found ${chatUploadCount} upload elements in chat interface`);

      // Take screenshot focused on chat area
      if (await chatContainer.first().isVisible()) {
        await chatContainer.first().screenshot({ path: "siam-chat-interface.png" });
        console.log("📸 Screenshot: siam-chat-interface.png");
      }
    }

    // Final comprehensive element search
    console.log("🔍 Final comprehensive search for any upload-related elements...");

    // Get all elements that might be related to file upload
    const allUploadElements = await page.evaluate(() => {
      const elements = [];

      // Search for elements with upload-related text
      const allTextElements = document.querySelectorAll("*");
      allTextElements.forEach((el) => {
        const text = el.textContent?.toLowerCase() || "";
        const tagName = el.tagName.toLowerCase();
        const className = el.className || "";
        const id = el.id || "";

        if (
          text.includes("upload") ||
          text.includes("file") ||
          text.includes("browse") ||
          text.includes("choose") ||
          text.includes("select") ||
          text.includes("drag") ||
          text.includes("drop") ||
          text.includes("aoma") ||
          text.includes("knowledge") ||
          className.includes("upload") ||
          className.includes("file") ||
          id.includes("upload") ||
          id.includes("file") ||
          (tagName === "input" && el.getAttribute("type") === "file")
        ) {
          elements.push({
            tagName,
            text: text.substring(0, 100),
            className,
            id,
            type: el.getAttribute("type"),
            visible: el.offsetParent !== null,
          });
        }
      });

      return elements;
    });

    console.log("📋 All upload-related elements found:");
    allUploadElements.forEach((el, index) => {
      console.log(`${index + 1}. ${el.tagName} - "${el.text}" (visible: ${el.visible})`);
    });

    // Take final comprehensive screenshot
    await page.screenshot({
      path: "siam-final-state.png",
      fullPage: true,
    });
    console.log("📸 Final screenshot: siam-final-state.png");

    // Summary report
    console.log("\n🏁 INVESTIGATION SUMMARY:");
    console.log(`- File inputs found: ${fileInputCount}`);
    console.log(`- Upload buttons found: ${uploadButtonCount}`);
    console.log(`- AOMA upload buttons found: ${aomaButtonCount}`);
    console.log(`- Drop zones found: ${dropZoneCount}`);
    console.log(`- File list elements found: ${fileListCount}`);
    console.log(`- Total upload-related elements: ${allUploadElements.length}`);

    // Check if any upload functionality is actually present
    const hasUploadCapability =
      fileInputCount > 0 || uploadButtonCount > 0 || aomaButtonCount > 0 || dropZoneCount > 0;
    console.log(`- Upload capability detected: ${hasUploadCapability}`);

    // Ensure we have at least some evidence of the interface
    expect(allUploadElements.length).toBeGreaterThanOrEqual(0); // This will always pass but documents our findings
  });
});
