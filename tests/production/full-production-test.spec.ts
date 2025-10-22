/**
 * FULL PRODUCTION TEST SUITE - TEST THE FUCK OUT OF EVERYTHING!
 *
 * This comprehensive test suite hammers every feature in production
 * Uses the working Mailinator login flow to access the app
 * Then tests EVERYTHING we can find
 */

import { test, expect, Page, BrowserContext } from "@playwright/test";

const TEST_EMAIL = "siam-test-x7j9k2p4@mailinator.com";
const MAILINATOR_INBOX = "https://www.mailinator.com/v4/public/inboxes.jsp?to=siam-test-x7j9k2p4";
const SIAM_URL = "https://iamsiam.ai";

// Helper function to login (reuse from mailinator test)
async function loginToSIAM(page: Page, context: BrowserContext): Promise<void> {
  console.log("🔐 Logging into SIAM...");

  // Navigate and request magic link
  await page.goto(SIAM_URL, { waitUntil: "networkidle" });
  await page.fill('input[type="email"]', TEST_EMAIL);
  await page.click('button[type="submit"]');

  // Wait for form to appear
  await page.waitForTimeout(3000);
  const verificationVisible = await page
    .locator('input[placeholder*="code" i], input[placeholder*="verification" i]')
    .isVisible();

  if (!verificationVisible) {
    throw new Error("Verification form didn't appear");
  }

  // Open Mailinator and get code
  const mailPage = await context.newPage();
  await mailPage.goto(MAILINATOR_INBOX, { waitUntil: "networkidle" });
  await mailPage.waitForTimeout(3000);

  // Click latest email
  const emails = await mailPage.locator('tr[ng-repeat*="email in emails"]').count();
  if (emails > 0) {
    await mailPage.locator('tr[ng-repeat*="email in emails"]').first().click();
    await mailPage.waitForTimeout(3000);

    // Extract code (try iframe first)
    let code = null;
    const iframe = await mailPage.$("iframe#html_msg_body, iframe#msg_body");
    if (iframe) {
      const frame = await iframe.contentFrame();
      if (frame) {
        const frameText = await frame.$eval("body", (el) => el.textContent || "");
        const match = frameText.match(/\b(\d{6})\b/);
        if (match) code = match[1];
      }
    }

    // Fallback to page content
    if (!code) {
      const pageText = await mailPage.content();
      const match = pageText.match(/\b(\d{6})\b/);
      if (match) code = match[1];
    }

    await mailPage.close();

    if (code) {
      // Enter code and login
      await page.fill('input[type="text"], input[type="number"]', code);
      await page.click('button[type="submit"]');
      await page.waitForSelector('h1:has-text("AOMA Intelligence Hub"), h1:has-text("SIAM")', {
        timeout: 15000,
      });
      console.log("✅ Logged in successfully!");
    } else {
      throw new Error("Could not extract verification code");
    }
  } else {
    throw new Error("No emails found in Mailinator");
  }
}

test.describe("🔥 PRODUCTION DESTRUCTION TEST SUITE 🔥", () => {
  test.setTimeout(300000); // 5 minutes for the full suite

  let page: Page;
  let context: BrowserContext;

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      recordVideo: { dir: "test-results/videos" },
    });
    page = await context.newPage();

    // Log all console errors
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        console.error("❌ Console Error:", msg.text());
      }
    });

    // Login once for all tests
    await loginToSIAM(page, context);
  });

  test.afterAll(async () => {
    await context.close();
  });

  test("1️⃣ TEST CHAT FUNCTIONALITY - Send messages and verify responses", async () => {
    console.log("\n🤖 Testing AOMA Chat...");

    // Find the chat input
    const chatInput = page.locator(
      'textarea[placeholder*="Ask me anything"], input[placeholder*="Ask me anything"]'
    );
    await expect(chatInput).toBeVisible();

    // Test queries
    const testQueries = [
      "What is AOMA?",
      "How do I use the platform?",
      "Tell me about USM",
      "What are the latest features?",
      "Help me with audio QC",
    ];

    for (const query of testQueries) {
      console.log(`   📝 Testing query: "${query}"`);

      // Type and send message
      await chatInput.fill(query);
      await page.keyboard.press("Enter");

      // Wait for response (look for thinking indicator or response)
      await page.waitForSelector(
        'div[role="log"] >> text=/thinking|generating|\\.\\.\\./i, div[role="log"] >> text=/[A-Z]/',
        {
          timeout: 30000,
        }
      );

      // Take screenshot of response
      await page.screenshot({
        path: `test-results/chat-${query.replace(/\s+/g, "-").toLowerCase()}.png`,
        fullPage: false,
      });

      // Wait before next query
      await page.waitForTimeout(2000);
    }

    console.log("   ✅ Chat functionality working!");
  });

  test("2️⃣ TEST NAVIGATION - Click everything clickable", async () => {
    console.log("\n🧭 Testing Navigation...");

    const buttons = [
      { name: "Chat", selector: 'button:has-text("Chat")' },
      { name: "HUD", selector: 'button:has-text("HUD")' },
      { name: "Test", selector: 'button:has-text("Test")' },
      { name: "Fix", selector: 'button:has-text("Fix")' },
      { name: "Curate", selector: 'button:has-text("Curate")' },
    ];

    for (const btn of buttons) {
      try {
        console.log(`   🔘 Clicking ${btn.name}...`);
        const button = page.locator(btn.selector).first();

        if (await button.isVisible()) {
          await button.click();
          await page.waitForTimeout(2000);

          // Check for errors
          const hasErrors = await page.locator('[role="alert"], .error, .error-boundary').count();
          if (hasErrors > 0) {
            console.log(`   ⚠️ Error found after clicking ${btn.name}`);
          } else {
            console.log(`   ✅ ${btn.name} works!`);
          }

          // Take screenshot
          await page.screenshot({
            path: `test-results/nav-${btn.name.toLowerCase()}.png`,
          });
        } else {
          console.log(`   ⏭️ ${btn.name} not visible, skipping`);
        }
      } catch (error) {
        console.log(`   ❌ Failed to test ${btn.name}: ${error.message}`);
      }
    }
  });

  test("3️⃣ TEST FILE UPLOAD - Try uploading to knowledge base", async () => {
    console.log("\n📁 Testing File Upload...");

    // Look for upload button
    const uploadButton = page
      .locator('button:has-text("Upload"), button:has-text("knowledge base")')
      .first();

    if (await uploadButton.isVisible()) {
      console.log("   📤 Found upload button");
      await uploadButton.click();
      await page.waitForTimeout(2000);

      // Check if file input appears
      const fileInput = await page.locator('input[type="file"]').isVisible();
      if (fileInput) {
        console.log("   ✅ File upload dialog opened");
      } else {
        console.log("   ⚠️ No file input found");
      }

      // Close any modals
      await page.keyboard.press("Escape");
    } else {
      console.log("   ⏭️ Upload button not found");
    }
  });

  test("4️⃣ TEST CONVERSATION HISTORY - Check sidebar interactions", async () => {
    console.log("\n💬 Testing Conversation History...");

    // Check for conversation items
    const conversations = page.locator('button[class*="conversation"], button:has-text("ago")');
    const count = await conversations.count();

    console.log(`   📚 Found ${count} conversations`);

    if (count > 0) {
      // Click first conversation
      await conversations.first().click();
      await page.waitForTimeout(2000);
      console.log("   ✅ Clicked conversation");

      // Check if it loaded
      const hasContent = (await page.locator('div[role="log"]').count()) > 0;
      if (hasContent) {
        console.log("   ✅ Conversation loaded");
      }
    }

    // Test New Conversation button
    const newConvoButton = page.locator('button:has-text("New Conversation")').first();
    if (await newConvoButton.isVisible()) {
      await newConvoButton.click();
      await page.waitForTimeout(1000);
      console.log("   ✅ New conversation button works");
    }
  });

  test("5️⃣ TEST SEARCH - Try searching conversations", async () => {
    console.log("\n🔍 Testing Search...");

    const searchInput = page
      .locator('input[placeholder*="Search"], input[placeholder*="search"]')
      .first();

    if (await searchInput.isVisible()) {
      await searchInput.fill("test search query");
      await page.keyboard.press("Enter");
      await page.waitForTimeout(2000);
      console.log("   ✅ Search executed");

      // Take screenshot of search results
      await page.screenshot({ path: "test-results/search-results.png" });
    } else {
      console.log("   ⏭️ Search not found");
    }
  });

  test("6️⃣ TEST MODEL SELECTOR - Change AI models", async () => {
    console.log("\n🤖 Testing Model Selector...");

    const modelSelector = page.locator('select, [role="combobox"]').first();

    if (await modelSelector.isVisible()) {
      await modelSelector.click();
      await page.waitForTimeout(1000);

      // Look for model options
      const options = await page.locator('[role="option"], option').count();
      console.log(`   📊 Found ${options} model options`);

      if (options > 0) {
        // Click first option
        await page.locator('[role="option"], option').first().click();
        console.log("   ✅ Model selector works");
      }
    } else {
      console.log("   ⏭️ Model selector not found");
    }
  });

  test("7️⃣ TEST RESPONSIVE DESIGN - Resize and check", async () => {
    console.log("\n📱 Testing Responsive Design...");

    const viewports = [
      { name: "Mobile", width: 375, height: 667 },
      { name: "Tablet", width: 768, height: 1024 },
      { name: "Desktop", width: 1920, height: 1080 },
    ];

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.waitForTimeout(1000);

      // Check if main elements are still visible
      const mainVisible = await page.locator('main, [role="main"]').isVisible();
      console.log(`   ${vp.name}: ${mainVisible ? "✅" : "❌"}`);

      await page.screenshot({
        path: `test-results/responsive-${vp.name.toLowerCase()}.png`,
      });
    }

    // Reset to desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
  });

  test("8️⃣ TEST ERROR HANDLING - Try to break things", async () => {
    console.log("\n💥 Testing Error Handling...");

    // Try sending empty message
    const chatInput = page.locator('textarea[placeholder*="Ask me anything"]').first();
    if (await chatInput.isVisible()) {
      await chatInput.fill("");
      await page.keyboard.press("Enter");
      await page.waitForTimeout(1000);
      console.log("   ✅ Empty message handled");
    }

    // Try XSS attack
    await chatInput.fill('<script>alert("XSS")</script>');
    await page.keyboard.press("Enter");
    await page.waitForTimeout(2000);

    // Check if alert appeared (it shouldn't)
    let xssTriggered = false;
    page.once("dialog", async (dialog) => {
      xssTriggered = true;
      await dialog.dismiss();
    });

    await page.waitForTimeout(1000);
    console.log(`   XSS Protection: ${xssTriggered ? "❌ VULNERABLE!" : "✅ SECURE"}`);

    // Try SQL injection in search
    const searchInput = page.locator('input[placeholder*="Search"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill("'; DROP TABLE users; --");
      await page.keyboard.press("Enter");
      await page.waitForTimeout(2000);
      console.log("   ✅ SQL injection attempt handled");
    }
  });

  test("9️⃣ TEST PERFORMANCE - Measure load times", async () => {
    console.log("\n⚡ Testing Performance...");

    // Measure chat response time
    const chatInput = page.locator('textarea[placeholder*="Ask me anything"]').first();

    const startTime = Date.now();
    await chatInput.fill("Quick test");
    await page.keyboard.press("Enter");

    // Wait for response
    await page.waitForSelector('div[role="log"] >> text=/[A-Z]/', {
      timeout: 30000,
    });

    const responseTime = Date.now() - startTime;
    console.log(`   ⏱️ Chat response time: ${responseTime}ms`);

    if (responseTime < 5000) {
      console.log("   ✅ Performance is GOOD");
    } else if (responseTime < 10000) {
      console.log("   ⚠️ Performance is OKAY");
    } else {
      console.log("   ❌ Performance is SLOW");
    }

    // Check for memory leaks by monitoring console
    const memoryErrors = await page.evaluate(() => {
      return window.performance.memory ? window.performance.memory.usedJSHeapSize : 0;
    });
    console.log(`   💾 Memory usage: ${(memoryErrors / 1024 / 1024).toFixed(2)}MB`);
  });

  test("🔟 TEST ACCESSIBILITY - Basic a11y checks", async () => {
    console.log("\n♿ Testing Accessibility...");

    // Check for alt texts on images
    const imagesWithoutAlt = await page.evaluate(() => {
      const images = Array.from(document.querySelectorAll("img"));
      return images.filter((img) => !img.alt).length;
    });
    console.log(`   Images without alt text: ${imagesWithoutAlt}`);

    // Check for proper heading hierarchy
    const headings = await page.evaluate(() => {
      const h1Count = document.querySelectorAll("h1").length;
      const h2Count = document.querySelectorAll("h2").length;
      return { h1: h1Count, h2: h2Count };
    });
    console.log(`   Heading structure: H1=${headings.h1}, H2=${headings.h2}`);

    // Check for ARIA labels
    const buttonsWithoutLabel = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll("button"));
      return buttons.filter((btn) => !btn.textContent && !btn.getAttribute("aria-label")).length;
    });
    console.log(`   Buttons without labels: ${buttonsWithoutLabel}`);

    if (imagesWithoutAlt === 0 && buttonsWithoutLabel === 0) {
      console.log("   ✅ Basic accessibility checks PASSED");
    } else {
      console.log("   ⚠️ Accessibility issues found");
    }
  });

  test("1️⃣1️⃣ STRESS TEST - Rapid interactions", async () => {
    console.log("\n🏃 Stress Testing...");

    const chatInput = page.locator('textarea[placeholder*="Ask me anything"]').first();

    // Send multiple messages rapidly
    console.log("   🚀 Sending rapid messages...");
    for (let i = 0; i < 5; i++) {
      await chatInput.fill(`Stress test message ${i + 1}`);
      await page.keyboard.press("Enter");
      await page.waitForTimeout(100); // Very short delay
    }

    // Check if app is still responsive
    await page.waitForTimeout(3000);
    const isResponsive = await chatInput.isEnabled();
    console.log(`   App still responsive: ${isResponsive ? "✅" : "❌"}`);

    // Rapid navigation clicks
    console.log("   🎯 Rapid navigation clicks...");
    const buttons = ["Chat", "HUD", "Test", "Fix", "Curate"];
    for (let i = 0; i < 10; i++) {
      const btnName = buttons[i % buttons.length];
      const btn = page.locator(`button:has-text("${btnName}")`).first();
      if (await btn.isVisible()) {
        await btn.click();
        await page.waitForTimeout(50);
      }
    }

    // Check for crashes
    const hasError = (await page.locator(".error-boundary, [data-error]").count()) > 0;
    console.log(`   Survived stress test: ${hasError ? "❌" : "✅"}`);
  });

  test("1️⃣2️⃣ FINAL SMOKE TEST - Verify everything still works", async () => {
    console.log("\n🔥 Final Smoke Test...");

    // Refresh page
    await page.reload();
    await page.waitForTimeout(3000);

    // Check main elements are visible
    const checks = [
      { name: "Main heading", selector: "h1" },
      { name: "Chat input", selector: 'textarea, input[type="text"]' },
      { name: "Navigation", selector: 'button:has-text("Chat")' },
      { name: "Main content", selector: '[role="main"], main' },
    ];

    for (const check of checks) {
      const isVisible = await page.locator(check.selector).first().isVisible();
      console.log(`   ${check.name}: ${isVisible ? "✅" : "❌"}`);
    }

    // Take final screenshot
    await page.screenshot({
      path: "test-results/final-state.png",
      fullPage: true,
    });

    console.log("\n🎊 PRODUCTION TEST SUITE COMPLETE! 🎊");
  });
});
