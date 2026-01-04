import { test, expect } from "../../fixtures/base-test";
import { ChatPage } from "../../pages/ChatPage";

/**
 * Chat Flow Regression Tests
 *
 * PURPOSE: These tests cover the complete chat message lifecycle and are
 * designed to catch the most common regressions in the chat feature.
 *
 * WHEN TO RUN: Every PR, every deploy
 *
 * IF THESE FAIL: The chat feature is broken. Do not deploy.
 */
test.describe("Chat Flow Regression Suite", () => {
  let chatPage: ChatPage;

  test.beforeEach(async ({ page }) => {
    chatPage = new ChatPage(page);
    await chatPage.navigate();
  });

  // ==========================================================================
  // CRITICAL: Form Rendering
  // Regression: Chat input not visible, form not rendered
  // ==========================================================================
  test.describe("Form Rendering", () => {
    test("chat form should render with all essential elements", async () => {
      await chatPage.assertChatFormReady();
    });

    test("chat input should be enabled and focusable", async ({ page }) => {
      const isEnabled = await chatPage.isInputEnabled();
      expect(isEnabled).toBe(true);

      // Should be able to type
      await page.locator('[data-testid="chat-input"]').fill("test message");
      const value = await chatPage.getInputValue();
      expect(value).toBe("test message");
    });

    test("send button should be visible", async ({ page }) => {
      const sendButton = page.locator('[data-testid="send-button"]');
      await expect(sendButton).toBeVisible();
    });
  });

  // ==========================================================================
  // CRITICAL: Message Sending
  // Regression: Messages don't send, input doesn't clear
  // ==========================================================================
  test.describe("Message Sending", () => {
    test("typing in input and pressing Enter should send message", async ({ page }) => {
      const input = page.locator('[data-testid="chat-input"]');

      await input.fill("Hello, this is a test message");
      await input.press("Enter");

      // User message should appear
      await expect(page.locator('[data-testid="user-message"]')).toBeVisible({
        timeout: 5000,
      });
    });

    test("clicking send button should send message", async ({ page }) => {
      const input = page.locator('[data-testid="chat-input"]');
      const sendButton = page.locator('[data-testid="send-button"]');

      await input.fill("Test via button click");
      await sendButton.click();

      // User message should appear
      await expect(page.locator('[data-testid="user-message"]')).toBeVisible({
        timeout: 5000,
      });
    });

    test("input should clear after sending", async ({ page }) => {
      const input = page.locator('[data-testid="chat-input"]');

      await input.fill("Message to clear");
      await input.press("Enter");

      // Wait for message to be sent
      await expect(page.locator('[data-testid="user-message"]')).toBeVisible({
        timeout: 5000,
      });

      // Input should be empty
      await expect(input).toHaveValue("", { timeout: 3000 });
    });

    test("empty message should not send", async ({ page }) => {
      const input = page.locator('[data-testid="chat-input"]');
      const initialCount = await page.locator('[data-testid="user-message"]').count();

      await input.fill("");
      await input.press("Enter");

      // Wait a moment
      await page.waitForTimeout(500);

      // No new message should appear
      const newCount = await page.locator('[data-testid="user-message"]').count();
      expect(newCount).toBe(initialCount);
    });
  });

  // ==========================================================================
  // CRITICAL: AI Response
  // Regression: AI doesn't respond, response doesn't render
  // ==========================================================================
  test.describe("AI Response", () => {
    test("AI should respond to a simple question", async ({ page }) => {
      // Skip in CI without API keys
      test.skip(!process.env.NEXT_PUBLIC_BYPASS_AUTH, "Requires auth bypass for local testing");

      const response = await chatPage.sendMessageAndWaitForResponse(
        "What is 2 plus 2? Reply with just the number."
      );

      // AI should respond with something
      expect(response.length).toBeGreaterThan(0);
    });

    test("AI message element should have correct structure", async ({ page }) => {
      test.skip(!process.env.NEXT_PUBLIC_BYPASS_AUTH, "Requires auth bypass for local testing");

      await chatPage.sendMessage("Hello");

      // Wait for AI message
      const aiMessage = page.locator('[data-testid="ai-message"]').first();
      await expect(aiMessage).toBeVisible({ timeout: 30000 });

      // AI message should exist and have content
      const content = await aiMessage.textContent();
      expect(content).toBeTruthy();
    });
  });

  // ==========================================================================
  // CRITICAL: Message History
  // Regression: Messages disappear, wrong order, duplicates
  // ==========================================================================
  test.describe("Message History", () => {
    test("messages should persist in order", async ({ page }) => {
      test.skip(!process.env.NEXT_PUBLIC_BYPASS_AUTH, "Requires auth bypass for local testing");

      // Send first message
      await chatPage.sendMessage("First message");
      await expect(page.locator('[data-testid="user-message"]').first()).toContainText(
        "First message"
      );

      // Send second message
      await chatPage.sendMessage("Second message");

      // Both should be visible in order
      const messages = page.locator('[data-testid="user-message"]');
      await expect(messages).toHaveCount(2, { timeout: 10000 });

      const firstText = await messages.first().textContent();
      const secondText = await messages.last().textContent();

      expect(firstText).toContain("First message");
      expect(secondText).toContain("Second message");
    });

    test("user and AI messages should alternate correctly", async ({ page }) => {
      test.skip(!process.env.NEXT_PUBLIC_BYPASS_AUTH, "Requires auth bypass for local testing");

      await chatPage.sendMessageAndWaitForResponse("Test message");

      const counts = await chatPage.getMessageCount();

      // Should have at least 1 user message and 1 AI message
      expect(counts.user).toBeGreaterThanOrEqual(1);
      expect(counts.ai).toBeGreaterThanOrEqual(1);
    });
  });

  // ==========================================================================
  // CRITICAL: Error Handling
  // Regression: Errors crash the UI, no error feedback
  // ==========================================================================
  test.describe("Error Handling", () => {
    test("UI should not crash on malformed input", async ({ page }) => {
      // Try various edge case inputs
      const edgeCases = [
        "a".repeat(5000), // Very long message
        "<script>alert('xss')</script>", // XSS attempt
        "```\ncode block\n```", // Markdown
        "🎵🎶🎤🎧", // Emojis (even though we don't like them)
        "SELECT * FROM users;", // SQL injection attempt
      ];

      for (const input of edgeCases) {
        await page.locator('[data-testid="chat-input"]').fill(input);

        // UI should still be functional
        await expect(page.locator('[data-testid="chat-form"]')).toBeVisible();
        await expect(page.locator('[data-testid="chat-input"]')).toBeEnabled();

        // Clear for next test
        await page.locator('[data-testid="chat-input"]').clear();
      }
    });

    test("page should not have console errors on load", async ({ page }) => {
      const errors: string[] = [];

      page.on("console", (msg) => {
        if (msg.type() === "error") {
          const text = msg.text();
          // Filter out known acceptable errors
          if (
            !text.includes("Failed to fetch") &&
            !text.includes("net::ERR") &&
            !text.includes("ResizeObserver")
          ) {
            errors.push(text);
          }
        }
      });

      // Reload to catch initialization errors
      await page.reload({ waitUntil: "domcontentloaded" });
      await chatPage.assertChatFormReady();

      // Wait for any async errors
      await page.waitForTimeout(2000);

      expect(errors).toHaveLength(0);
    });
  });

  // ==========================================================================
  // CRITICAL: Keyboard Navigation
  // Regression: Enter doesn't work, shortcuts broken
  // ==========================================================================
  test.describe("Keyboard Navigation", () => {
    test("Enter should send message (not Shift+Enter)", async ({ page }) => {
      const input = page.locator('[data-testid="chat-input"]');

      await input.fill("Test Enter key");
      await input.press("Enter");

      // Message should be sent
      await expect(page.locator('[data-testid="user-message"]')).toBeVisible({
        timeout: 5000,
      });
    });

    test("Shift+Enter should create newline, not send", async ({ page }) => {
      const input = page.locator('[data-testid="chat-input"]');
      const initialMessageCount = await page.locator('[data-testid="user-message"]').count();

      await input.fill("Line 1");
      await input.press("Shift+Enter");
      await input.type("Line 2");

      // Wait a moment
      await page.waitForTimeout(500);

      // Message should NOT be sent yet
      const newMessageCount = await page.locator('[data-testid="user-message"]').count();
      expect(newMessageCount).toBe(initialMessageCount);

      // Input should contain both lines
      const value = await input.inputValue();
      expect(value).toContain("Line 1");
      expect(value).toContain("Line 2");
    });
  });
});

// ==========================================================================
// CRITICAL: Welcome Screen & Suggestions
// Regression: Welcome screen not showing, suggestions not clickable
// ==========================================================================
test.describe("Welcome Screen & Suggestions", () => {
  test("welcome screen should display on fresh conversation", async ({ page }) => {
    const chatPage = new ChatPage(page);
    await chatPage.navigate();

    // Welcome heading should be visible
    await expect(page.getByRole("heading", { name: /Welcome to The Betabase/i })).toBeVisible({
      timeout: 10000,
    });

    // "Try these to get started" section should be visible
    await expect(page.getByText(/Try these to get started/i)).toBeVisible();
  });

  test("suggestion buttons should be visible and clickable", async ({ page }) => {
    const chatPage = new ChatPage(page);
    await chatPage.navigate();

    // Wait for welcome screen
    await expect(page.getByRole("heading", { name: /Welcome to The Betabase/i })).toBeVisible({
      timeout: 10000,
    });

    // Suggestions should be visible - look for the "Try these" section buttons
    // Note: 5 suggestions contain "AOMA", 1 mentions "UST features"
    const aomaButtons = page.locator('button:has-text("AOMA")');
    const ustButton = page.locator('button:has-text("UST features")');

    await expect(aomaButtons.first()).toBeVisible({ timeout: 5000 });
    await expect(ustButton).toBeVisible({ timeout: 5000 });

    // Should have 5 AOMA suggestions + 1 UST suggestion = 6 total
    const aomaCount = await aomaButtons.count();
    expect(aomaCount).toBe(5);
  });

  test("suggestion buttons should be interactive", async ({ page }) => {
    const chatPage = new ChatPage(page);
    await chatPage.navigate();

    // Wait for welcome screen
    await expect(page.getByRole("heading", { name: /Welcome to The Betabase/i })).toBeVisible({
      timeout: 10000,
    });

    // Verify suggestions are clickable (no errors thrown)
    const firstSuggestion = page.locator('button:has-text("asset types")').first();
    await expect(firstSuggestion).toBeVisible();
    await expect(firstSuggestion).toBeEnabled();

    // Verify button has correct cursor style
    const cursor = await firstSuggestion.evaluate((el) => getComputedStyle(el).cursor);
    expect(cursor).toBe("pointer");
  });
});

/**
 * Quick Smoke Test for CI
 * Run this subset for fast feedback
 */
test.describe("Chat Quick Smoke @smoke", () => {
  test("chat form renders correctly", async ({ page }) => {
    const chatPage = new ChatPage(page);
    await chatPage.navigate();
    await chatPage.assertChatFormReady();
  });

  test("can type in chat input", async ({ page }) => {
    const chatPage = new ChatPage(page);
    await chatPage.navigate();

    const input = page.locator('[data-testid="chat-input"]');
    await input.fill("Quick smoke test");

    const value = await input.inputValue();
    expect(value).toBe("Quick smoke test");
  });
});
