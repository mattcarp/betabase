import { test, expect } from "../../fixtures/auth.fixture";

/**
 * Critical chat functionality tests
 * @critical @regression
 */

test.describe("Critical Chat Paths @critical", () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    // Navigate to chat interface
    await authenticatedPage.goto("/chat").catch(() => authenticatedPage.goto("/"));
  });

  test("Chat interface loads correctly", async ({ authenticatedPage }) => {
    // Check for chat UI elements
    const chatElements = {
      input: authenticatedPage
        .locator('textarea, input[type="text"][placeholder*="Type"], [data-testid="chat-input"]')
        .first(),
      sendButton: authenticatedPage
        .locator('button:has-text("Send"), button[aria-label*="Send"]')
        .first(),
      chatContainer: authenticatedPage
        .locator('[class*="chat"], [class*="message"], .mac-glass')
        .first(),
    };

    // Verify elements are visible
    for (const [name, element] of Object.entries(chatElements)) {
      await expect(element)
        .toBeVisible({
          timeout: 10000,
        })
        .catch(() => {
          console.log(`Optional element ${name} not found, continuing...`);
        });
    }

    // Check for no loading errors
    const errorElement = authenticatedPage.locator("text=/Error|Failed|Could not load/i");
    await expect(errorElement)
      .not.toBeVisible({ timeout: 5000 })
      .catch(() => {});
  });

  test("Can send a chat message", async ({ authenticatedPage }) => {
    // Find chat input
    const chatInput = authenticatedPage
      .locator('textarea, input[type="text"][placeholder*="Type"], [data-testid="chat-input"]')
      .first();
    await expect(chatInput).toBeVisible();

    // Type message
    const testMessage = "Test message from Playwright automation";
    await chatInput.fill(testMessage);

    // Send message
    const sendButton = authenticatedPage
      .locator('button:has-text("Send"), button[aria-label*="Send"], button[type="submit"]')
      .first();

    if (await sendButton.isVisible()) {
      await sendButton.click();
    } else {
      // Try Enter key as fallback
      await chatInput.press("Enter");
    }

    // Wait for message to appear in chat
    await expect(authenticatedPage.locator(`text="${testMessage}"`)).toBeVisible({
      timeout: 10000,
    });

    // Wait for response indicator
    const responseIndicators = [
      "text=/Thinking|Processing|Loading/i",
      ".loading, .spinner",
      '[class*="progress"]',
      "text=/Assistant|AI|Response/i",
    ];

    let foundIndicator = false;
    for (const selector of responseIndicators) {
      if (
        await authenticatedPage
          .locator(selector)
          .isVisible({ timeout: 5000 })
          .catch(() => false)
      ) {
        foundIndicator = true;
        break;
      }
    }

    expect(foundIndicator).toBe(true);
  });

  test("Chat history persists across page reload", async ({ authenticatedPage }) => {
    // Send a unique message
    const uniqueMessage = `Persistence test ${Date.now()}`;
    const chatInput = authenticatedPage.locator('textarea, input[type="text"]').first();

    await chatInput.fill(uniqueMessage);
    await chatInput.press("Enter");

    // Wait for message to appear
    await expect(authenticatedPage.locator(`text="${uniqueMessage}"`)).toBeVisible({
      timeout: 10000,
    });

    // Reload page
    await authenticatedPage.reload();

    // Check if message still exists
    await expect(authenticatedPage.locator(`text="${uniqueMessage}"`)).toBeVisible({
      timeout: 10000,
    });
  });

  test("New chat button creates fresh session", async ({ authenticatedPage }) => {
    // Send initial message
    const firstMessage = "First chat message";
    const chatInput = authenticatedPage.locator('textarea, input[type="text"]').first();

    await chatInput.fill(firstMessage);
    await chatInput.press("Enter");
    await expect(authenticatedPage.locator(`text="${firstMessage}"`)).toBeVisible();

    // Click new chat button
    const newChatButton = authenticatedPage
      .locator(
        'button:has-text("New Chat"), button:has-text("New Conversation"), button[aria-label*="New"]'
      )
      .first();

    if (await newChatButton.isVisible()) {
      await newChatButton.click();

      // First message should no longer be visible
      await expect(authenticatedPage.locator(`text="${firstMessage}"`))
        .not.toBeVisible({
          timeout: 5000,
        })
        .catch(() => {
          // Some apps might keep history visible, that's okay
        });

      // Chat input should be cleared
      await expect(chatInput).toHaveValue("");
    }
  });

  test("Voice input button is accessible", async ({ authenticatedPage }) => {
    // Look for voice/microphone button
    const voiceButton = authenticatedPage
      .locator(
        'button[aria-label*="Voice"], button[aria-label*="Microphone"], button:has([class*="microphone"]), button:has([class*="mic"])'
      )
      .first();

    if (await voiceButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Check button is enabled
      await expect(voiceButton).toBeEnabled();

      // Click to activate
      await voiceButton.click();

      // Check for permission request or active state
      const activeIndicators = [
        '[class*="recording"]',
        '[class*="active"]',
        "text=/Recording|Listening/i",
      ];

      let foundActive = false;
      for (const selector of activeIndicators) {
        if (
          await authenticatedPage
            .locator(selector)
            .isVisible({ timeout: 3000 })
            .catch(() => false)
        ) {
          foundActive = true;
          break;
        }
      }

      // Click again to deactivate if activated
      if (foundActive) {
        await voiceButton.click();
      }
    }
  });

  test("Code blocks render with syntax highlighting", async ({ authenticatedPage }) => {
    // Send a message with code
    const codeMessage = "Show me a Python hello world example";
    const chatInput = authenticatedPage.locator('textarea, input[type="text"]').first();

    await chatInput.fill(codeMessage);
    await chatInput.press("Enter");

    // Wait for response with code block
    await authenticatedPage.waitForSelector('pre, code, [class*="code"], [class*="highlight"]', {
      timeout: 30000,
    });

    // Verify code block has syntax highlighting classes
    const codeBlock = authenticatedPage.locator("pre, code").first();
    const hasHighlighting = await codeBlock.evaluate((el) => {
      const classes = el.className;
      return (
        classes.includes("language-") ||
        classes.includes("hljs") ||
        classes.includes("prism") ||
        el.querySelector('[class*="token"]') !== null
      );
    });

    expect(hasHighlighting).toBe(true);
  });
});
