import { test, expect } from './fixtures/base-test';

test.describe("Voice Features Integration", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the chat page with auth bypass
    await page.goto("http://localhost:3000");

    // Wait for the page to load completely
    await page.waitForLoadState("networkidle");
  });

  test("should display microphone button in chat input", async ({ page }) => {
    // Screenshot for debugging
    await page.screenshot({ path: "test-results/before-mic-check.png" });

    // Look for microphone button with various selectors
    const micButtonByTitle = page.locator('button[title*="record"]');
    const micButtonByAriaLabel = page.locator('button[aria-label*="microphone"]');
    const micButtonByClass = page.locator('button:has-text("🎤")');
    const micIconByClass = page.locator('.lucide-mic, [data-lucide="mic"]');

    // Check if any microphone button exists
    const micExists =
      (await micButtonByTitle.isVisible()) ||
      (await micButtonByAriaLabel.isVisible()) ||
      (await micButtonByClass.isVisible()) ||
      (await micIconByClass.isVisible());

    // Log what we found
    console.log("Microphone button visible:", micExists);
    console.log("Page URL:", page.url());

    // Take screenshot for analysis
    await page.screenshot({ path: "test-results/mic-button-check.png" });

    expect(micExists, "Microphone button should be visible in chat input").toBe(true);
  });

  test("should display speaker button in chat input", async ({ page }) => {
    // Screenshot for debugging
    await page.screenshot({ path: "test-results/before-speaker-check.png" });

    // Look for speaker button with various selectors
    const speakerButtonByTitle = page.locator('button[title*="speak"], button[title*="audio"]');
    const speakerButtonByAriaLabel = page.locator('button[aria-label*="speaker"]');
    const speakerIconByClass = page.locator('.lucide-volume-2, [data-lucide="volume-2"]');

    // Check if any speaker button exists
    const speakerExists =
      (await speakerButtonByTitle.isVisible()) ||
      (await speakerButtonByAriaLabel.isVisible()) ||
      (await speakerIconByClass.isVisible());

    // Log what we found
    console.log("Speaker button visible:", speakerExists);

    // Take screenshot for analysis
    await page.screenshot({ path: "test-results/speaker-button-check.png" });

    expect(speakerExists, "Speaker button should be visible in chat input").toBe(true);
  });

  test("should have voice buttons in the correct location", async ({ page }) => {
    // Take full page screenshot
    await page.screenshot({ path: "test-results/full-page-voice-check.png", fullPage: true });

    // Look for the chat input area
    const chatInput = page.locator('textarea, input[type="text"]').first();
    const inputExists = await chatInput.isVisible();

    console.log("Chat input exists:", inputExists);

    if (inputExists) {
      // Get the bounding box of the input
      const inputBox = await chatInput.boundingBox();
      console.log("Input position:", inputBox);

      // Look for buttons near the input
      const nearbyButtons = page.locator("button").locator(":near(textarea, input)");
      const buttonCount = await nearbyButtons.count();

      console.log("Buttons near input:", buttonCount);

      // List all buttons and their titles
      for (let i = 0; i < buttonCount; i++) {
        const button = nearbyButtons.nth(i);
        const title = await button.getAttribute("title");
        const ariaLabel = await button.getAttribute("aria-label");
        const textContent = await button.textContent();
        console.log(`Button ${i}:`, { title, ariaLabel, textContent });
      }
    }

    expect(inputExists, "Chat input should be visible").toBe(true);
  });

  test("should inspect DOM structure for voice components", async ({ page }) => {
    // Execute JavaScript to inspect the DOM structure
    const domInfo = await page.evaluate(() => {
      const results = {
        chatInputs: [],
        buttons: [],
        voiceRelated: [],
        components: [],
      };

      // Find all input/textarea elements
      const inputs = document.querySelectorAll("input, textarea");
      inputs.forEach((input, i) => {
        results.chatInputs.push({
          index: i,
          type: input.tagName,
          placeholder: input.placeholder,
          id: input.id,
          className: input.className,
        });
      });

      // Find all buttons
      const buttons = document.querySelectorAll("button");
      buttons.forEach((button, i) => {
        results.buttons.push({
          index: i,
          title: button.title,
          ariaLabel: button.getAttribute("aria-label"),
          textContent: button.textContent?.trim(),
          className: button.className,
          hasIcon: button.querySelector("svg") !== null,
        });
      });

      // Look for voice-related elements
      const voiceElements = document.querySelectorAll(
        '[title*="record"], [title*="voice"], [title*="speak"], [title*="audio"], .lucide-mic, .lucide-volume-2'
      );
      voiceElements.forEach((element, i) => {
        results.voiceRelated.push({
          index: i,
          tagName: element.tagName,
          title: element.title,
          className: element.className,
          textContent: element.textContent?.trim(),
        });
      });

      // Look for React component hints
      const reactComponents = document.querySelectorAll("[data-reactroot], [data-react-component]");
      reactComponents.forEach((component, i) => {
        results.components.push({
          index: i,
          tagName: component.tagName,
          className: component.className,
        });
      });

      return results;
    });

    console.log("DOM Analysis:", JSON.stringify(domInfo, null, 2));

    // Take final screenshot
    await page.screenshot({ path: "test-results/dom-analysis.png" });

    // We expect to find voice-related elements
    expect(domInfo.voiceRelated.length, "Should find voice-related DOM elements").toBeGreaterThan(
      0
    );
  });

  test("should check for JavaScript errors preventing rendering", async ({ page }) => {
    const errors = [];

    // Listen for console errors
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });

    // Listen for page errors
    page.on("pageerror", (error) => {
      errors.push(error.message);
    });

    // Reload the page to capture any initialization errors
    await page.reload();
    await page.waitForLoadState("networkidle");

    // Wait a bit for any async errors
    await page.waitForTimeout(2000);

    console.log("JavaScript errors found:", errors);

    // Take screenshot after error check
    await page.screenshot({ path: "test-results/after-error-check.png" });

    // We want to know about errors but not necessarily fail the test
    if (errors.length > 0) {
      console.warn(
        "Found JavaScript errors that may prevent voice buttons from rendering:",
        errors
      );
    }
  });
});
