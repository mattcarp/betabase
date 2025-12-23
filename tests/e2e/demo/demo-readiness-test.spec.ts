import { test, expect } from "@playwright/test";
import { setupConsoleMonitoring, getConsoleMonitor } from "../helpers/console-monitor";

/**
 * DEMO READINESS TEST
 *
 * Comprehensive test for demo scenarios focusing on:
 * 1. Chat UI responsiveness and error-free operation
 * 2. Progress indicator positioning (should be ABOVE response, not below)
 * 3. Curate tab navigation and functionality
 * 4. Overall UX polish and console cleanliness
 */

test.describe("Demo Readiness - Chat & Curate", () => {
  test.beforeEach(async ({ page }) => {
    setupConsoleMonitoring(page, {
      ignoreWarnings: true,
      ignoreNetworkErrors: false,
      useDefaultFilters: true,
    });

    const testUrl = process.env.BASE_URL || "http://localhost:3000";

    // Set bypass auth for localhost
    if (testUrl.includes("localhost")) {
      await page.context().addCookies([
        {
          name: "bypass_auth",
          value: "true",
          domain: "localhost",
          path: "/",
        },
      ]);
    }

    await page.goto(testUrl);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000); // Let animations settle
  });

  test("Chat: Progress indicator should appear ABOVE response, not below", async ({ page }) => {
    console.log("\\n🎯 Testing progress indicator positioning...\\n");

    // Find chat input
    const chatInput = page.locator('textarea, input[placeholder*="Ask"]').first();
    await expect(chatInput).toBeVisible({ timeout: 10000 });

    // Send a test query that will trigger progress indicator
    const testQuery = "What is AOMA used for?";
    await chatInput.fill(testQuery);
    await page.keyboard.press("Enter");

    // Wait for progress indicator to appear
    await page.waitForTimeout(1000);

    // Check if progress indicator is visible
    const progressIndicator = page.locator('[class*="progress"], [class*="loading"], [data-testid="progress"]');
    const progressVisible = await progressIndicator.isVisible({ timeout: 5000 }).catch(() => false);

    if (progressVisible) {
      console.log("✅ Progress indicator is visible");

      // Get bounding box of progress indicator
      const progressBox = await progressIndicator.first().boundingBox();

      if (progressBox) {
        console.log(`Progress indicator position: y=${progressBox.y}`);

        // Wait for response to appear
        await page.waitForTimeout(5000);

        // Get bounding box of AI response (should be below progress indicator)
        const aiResponse = page.locator('[class*="assistant"], [data-role="assistant"], [class*="ai-message"]').last();
        const responseVisible = await aiResponse.isVisible({ timeout: 30000 }).catch(() => false);

        if (responseVisible) {
          const responseBox = await aiResponse.boundingBox();
          if (responseBox) {
            console.log(`AI response position: y=${responseBox.y}`);

            // CRITICAL: Progress indicator should be ABOVE (smaller y value) the response
            if (progressBox.y > responseBox.y) {
              console.log("❌ ISSUE: Progress indicator is BELOW the response!");
              console.log(`   Progress Y: ${progressBox.y}, Response Y: ${responseBox.y}`);
            } else {
              console.log("✅ Progress indicator is correctly positioned ABOVE response");
            }

            // Take screenshot for visual verification
            await page.screenshot({
              path: "test-results/demo-progress-indicator-position.png",
              fullPage: true,
            });

            // Assert that progress is above response
            expect(progressBox.y).toBeLessThan(responseBox.y);
          }
        }
      }
    } else {
      console.log("⚠️  Progress indicator not detected - checking if response appeared");
      const aiResponse = page.locator('[class*="assistant"], [data-role="assistant"]').last();
      const responseVisible = await aiResponse.isVisible({ timeout: 30000 });
      expect(responseVisible).toBeTruthy();
    }

    // Check for console errors
    const monitor = getConsoleMonitor();
    const errors = monitor.getErrors();
    console.log(`\\n📊 Console errors during test: ${errors.length}`);
    expect(errors.length).toBe(0);
  });

  test("Chat: Response should not hang around after completion", async ({ page }) => {
    console.log("\\n🎯 Testing chat response completion...\\n");

    const chatInput = page.locator('textarea, input[placeholder*="Ask"]').first();
    await expect(chatInput).toBeVisible({ timeout: 10000 });

    // Send query
    await chatInput.fill("Tell me about AOMA");
    await page.keyboard.press("Enter");

    // Wait for response to complete (progress should disappear)
    await page.waitForTimeout(35000); // AOMA queries take ~20s

    // Check that progress indicator is gone
    const progressStillVisible = await page
      .locator('[class*="progress"], [class*="loading"]')
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    console.log(`Progress indicator still visible after 35s: ${progressStillVisible}`);

    // Progress should be gone after response completes
    expect(progressStillVisible).toBe(false);

    // Response should be visible
    const responseVisible = await page
      .locator('[class*="assistant"], [data-role="assistant"]')
      .last()
      .isVisible();

    console.log(`AI response visible: ${responseVisible}`);
    expect(responseVisible).toBe(true);

    // Take screenshot
    await page.screenshot({
      path: "test-results/demo-chat-response-complete.png",
      fullPage: true,
    });

    // Check console
    const monitor = getConsoleMonitor();
    const errors = monitor.getErrors();
    expect(errors.length).toBe(0);
  });

  test("Chat: Multiple messages should display cleanly", async ({ page }) => {
    console.log("\\n🎯 Testing multiple chat messages...\\n");

    const chatInput = page.locator('textarea, input[placeholder*="Ask"]').first();
    await expect(chatInput).toBeVisible({ timeout: 10000 });

    // Send 3 quick messages
    const messages = [
      "What is AOMA?",
      "How do I upload files?",
      "What formats are supported?",
    ];

    for (const msg of messages) {
      await chatInput.fill(msg);
      await page.keyboard.press("Enter");
      await page.waitForTimeout(2000); // Wait between messages
    }

    // Wait for responses
    await page.waitForTimeout(40000);

    // Check that all messages are visible
    const messageCount = await page.locator('[data-role="user"], [data-role="assistant"]').count();
    console.log(`Total messages visible: ${messageCount}`);
    expect(messageCount).toBeGreaterThan(3); // At least user messages + some responses

    // Screenshot
    await page.screenshot({
      path: "test-results/demo-multiple-messages.png",
      fullPage: true,
    });

    // Console check
    const monitor = getConsoleMonitor();
    const errors = monitor.getErrors();
    expect(errors.length).toBe(0);
  });

  test("Curate: Tab should be accessible and error-free", async ({ page }) => {
    console.log("\\n🎯 Testing Curate tab navigation...\\n");

    const monitor = getConsoleMonitor();
    monitor.reset();

    // Find Curate button
    const curateButton = page.locator("button").filter({ hasText: "Curate" }).first();
    await expect(curateButton).toBeVisible({ timeout: 5000 });

    console.log("✅ Found Curate button");

    // Click Curate
    await curateButton.click();
    await page.waitForTimeout(2000);

    console.log("✅ Clicked Curate button");

    // Check for Curate content
    const curateContent = page
      .locator("text=Knowledge Curation")
      .or(page.locator("text=Curation"))
      .or(page.locator("text=Upload"));

    const contentVisible = await curateContent.isVisible({ timeout: 5000 }).catch(() => false);
    console.log(`Curate content visible: ${contentVisible}`);
    expect(contentVisible).toBe(true);

    // Check for file upload area
    const uploadArea = page.locator('input[type="file"], [data-upload], .upload-area');
    const uploadCount = await uploadArea.count();
    console.log(`Upload areas found: ${uploadCount}`);

    // Screenshot
    await page.screenshot({
      path: "test-results/demo-curate-tab.png",
      fullPage: true,
    });

    // Console errors
    const errors = monitor.getErrors();
    console.log(`\\nConsole errors after Curate navigation: ${errors.length}`);
    if (errors.length > 0) {
      errors.forEach((err, i) => console.log(`  ${i + 1}. ${err}`));
    }
    expect(errors.length).toBe(0);
  });

  test("Curate: All tabs should navigate without errors", async ({ page }) => {
    console.log("\\n🎯 Testing all tab navigation for demo...\\n");

    const tabs = ["Chat", "HUD", "Test", "Fix", "Curate"];

    for (const tabName of tabs) {
      const monitor = getConsoleMonitor();
      monitor.reset();

      console.log(`\\n  🖱️  Navigating to: ${tabName}`);

      const button = page.locator("button").filter({ hasText: tabName }).first();
      await expect(button).toBeVisible({ timeout: 5000 });

      await button.click();
      await page.waitForTimeout(1500);

      const errors = monitor.getErrors();

      if (errors.length > 0) {
        console.log(`    ❌ ${tabName} has ${errors.length} errors:`);
        errors.forEach((err) => console.log(`       - ${err.substring(0, 100)}`));
      } else {
        console.log(`    ✅ ${tabName} loaded cleanly`);
      }

      expect(errors.length).toBe(0);
    }

    console.log("\\n✅ All tabs passed demo readiness check");
  });

  test("Visual: Take demo screenshots for all key views", async ({ page }) => {
    console.log("\\n📸 Capturing demo screenshots...\\n");

    // Chat view
    await page.screenshot({
      path: "test-results/demo-screenshots/01-chat-initial.png",
      fullPage: true,
    });
    console.log("✅ Chat initial view");

    // Send a message and capture response
    const chatInput = page.locator('textarea, input[placeholder*="Ask"]').first();
    if (await chatInput.isVisible()) {
      await chatInput.fill("What is AOMA?");
      await page.keyboard.press("Enter");
      await page.waitForTimeout(25000); // Wait for response

      await page.screenshot({
        path: "test-results/demo-screenshots/02-chat-with-response.png",
        fullPage: true,
      });
      console.log("✅ Chat with response");
    }

    // Navigate to each tab and screenshot
    const tabs = ["HUD", "Test", "Fix", "Curate"];
    for (let i = 0; i < tabs.length; i++) {
      const tabName = tabs[i];
      const button = page.locator("button").filter({ hasText: tabName }).first();

      if (await button.isVisible({ timeout: 3000 }).catch(() => false)) {
        await button.click();
        await page.waitForTimeout(1500);

        await page.screenshot({
          path: `test-results/demo-screenshots/${String(i + 3).padStart(2, '0')}-${tabName.toLowerCase()}.png`,
          fullPage: true,
        });
        console.log(`✅ ${tabName} tab`);
      }
    }

    console.log("\\n📸 All demo screenshots captured");
  });
});
