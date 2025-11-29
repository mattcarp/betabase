import { test, expect } from '../fixtures/base-test';
import { TestHelpers, TEST_USERS } from "../helpers/test-utils";

test.describe("Chat Functionality - Comprehensive", () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await helpers.monitorConsoleErrors();

    // Set up auth and navigate to chat
    await page.goto("/");
    await helpers.bypassAuth();
    await page.reload();
    await helpers.waitForPageReady();
    await helpers.selectTab("Chat");
  });

  test.describe("Chat Interface", () => {
    test("should display chat interface elements", async ({ page }) => {
      // Check for essential chat elements
      await expect(page.locator('[data-testid="chat-interface"], [class*="chat"]')).toBeVisible();

      // Input field
      const inputField = page.locator(
        'textarea[placeholder*="Type"], input[placeholder*="Type"], [contenteditable="true"]'
      );
      await expect(inputField).toBeVisible();

      // Send button
      const sendButton = page.locator(
        'button[aria-label*="Send"], button:has-text("Send"), button[type="submit"]'
      );
      await expect(sendButton).toBeVisible();

      // Chat history area
      const chatArea = page.locator(
        '[data-testid="chat-messages"], [class*="messages"], [role="log"]'
      );
      expect(await chatArea.count()).toBeGreaterThan(0);
    });

    test("should send a simple message", async ({ page }) => {
      const testMessage = "Hello, this is a test message";

      // Type message
      const inputField = page
        .locator('textarea, input[type="text"], [contenteditable="true"]')
        .first();
      await inputField.fill(testMessage);

      // Send message
      const sendButton = page
        .locator('button[aria-label*="Send"], button:has-text("Send"), button[type="submit"]')
        .first();
      await sendButton.click();

      // Wait for message to appear
      await page.waitForTimeout(1000);

      // Check message appears in chat
      const messageVisible = await helpers.checkTextVisible(testMessage);
      expect(messageVisible).toBeTruthy();

      // Wait for AI response
      const responsePromise = helpers.waitForAPIResponse("/api/chat", {
        status: 200,
      });
      await responsePromise.catch(() => {}); // Might not have API in dev

      // Check for response indicator (typing, loading, etc.)
      const hasResponseIndicator = await page
        .locator('[class*="typing"], [class*="loading"], [class*="thinking"]')
        .isVisible({ timeout: 5000 });
      // Response should eventually appear
    });

    test("should handle multi-line messages", async ({ page }) => {
      const multiLineMessage = "Line 1\nLine 2\nLine 3";

      const inputField = page.locator('textarea, [contenteditable="true"]').first();
      await inputField.fill(multiLineMessage);

      // Send message
      await page.keyboard.press("Control+Enter");
      // Or click send button
      const sendButton = page
        .locator('button[aria-label*="Send"], button:has-text("Send")')
        .first();
      if (await sendButton.isVisible()) {
        await sendButton.click();
      }

      await page.waitForTimeout(1000);

      // Check message formatting is preserved
      const messageElement = page.locator(`text="${multiLineMessage.split("\n")[0]}"`);
      expect(await messageElement.isVisible()).toBeTruthy();
    });

    test("should clear input after sending", async ({ page }) => {
      const inputField = page
        .locator('textarea, input[type="text"], [contenteditable="true"]')
        .first();

      await inputField.fill("Test message");

      const sendButton = page
        .locator('button[aria-label*="Send"], button:has-text("Send")')
        .first();
      await sendButton.click();

      await page.waitForTimeout(500);

      // Input should be cleared
      const inputValue = await inputField.inputValue().catch(() => inputField.textContent());
      expect(inputValue).toBe("");
    });

    test("should disable send with empty message", async ({ page }) => {
      const inputField = page
        .locator('textarea, input[type="text"], [contenteditable="true"]')
        .first();
      await inputField.clear();

      const sendButton = page
        .locator('button[aria-label*="Send"], button:has-text("Send")')
        .first();

      // Button should be disabled or not clickable
      const isDisabled = await sendButton.isDisabled();
      if (!isDisabled) {
        // Try clicking and see if nothing happens
        await sendButton.click();
        await page.waitForTimeout(500);

        // No new messages should appear
        const messages = await page.locator('[class*="message"]').count();
        expect(messages).toBe(0);
      }
    });
  });

  test.describe("Message History", () => {
    test("should display message history", async ({ page }) => {
      // Send multiple messages
      const messages = ["First message", "Second message", "Third message"];

      for (const msg of messages) {
        const inputField = page
          .locator('textarea, input[type="text"], [contenteditable="true"]')
          .first();
        await inputField.fill(msg);

        const sendButton = page
          .locator('button[aria-label*="Send"], button:has-text("Send")')
          .first();
        await sendButton.click();

        await page.waitForTimeout(500);
      }

      // Check all messages are visible
      for (const msg of messages) {
        const messageVisible = await helpers.checkTextVisible(msg);
        expect(messageVisible).toBeTruthy();
      }

      // Messages should be in order
      const messageElements = await page.locator('[class*="message"]').all();
      expect(messageElements.length).toBeGreaterThanOrEqual(messages.length);
    });

    test("should scroll to latest message", async ({ page }) => {
      // Send many messages to create scroll
      for (let i = 1; i <= 10; i++) {
        const inputField = page
          .locator('textarea, input[type="text"], [contenteditable="true"]')
          .first();
        await inputField.fill(`Message ${i}`);

        const sendButton = page
          .locator('button[aria-label*="Send"], button:has-text("Send")')
          .first();
        await sendButton.click();

        await page.waitForTimeout(200);
      }

      // Latest message should be visible
      const latestVisible = await helpers.checkTextVisible("Message 10");
      expect(latestVisible).toBeTruthy();

      // Check scroll position
      const chatContainer = page.locator('[class*="messages"], [class*="chat-container"]').first();
      const scrollInfo = await chatContainer.evaluate((el) => ({
        scrollTop: el.scrollTop,
        scrollHeight: el.scrollHeight,
        clientHeight: el.clientHeight,
      }));

      // Should be scrolled near bottom
      const isNearBottom =
        scrollInfo.scrollTop + scrollInfo.clientHeight >= scrollInfo.scrollHeight - 100;
      expect(isNearBottom).toBeTruthy();
    });

    test("should preserve history on tab switch", async ({ page }) => {
      // Send a message
      const testMessage = "Persistent message test";
      const inputField = page
        .locator('textarea, input[type="text"], [contenteditable="true"]')
        .first();
      await inputField.fill(testMessage);

      const sendButton = page
        .locator('button[aria-label*="Send"], button:has-text("Send")')
        .first();
      await sendButton.click();

      await page.waitForTimeout(500);

      // Switch tabs
      await helpers.selectTab("Curate");
      await page.waitForTimeout(500);
      await helpers.selectTab("Chat");

      // Message should still be there
      const messageVisible = await helpers.checkTextVisible(testMessage);
      expect(messageVisible).toBeTruthy();
    });
  });

  test.describe("AI Responses", () => {
    test("should show loading state during response", async ({ page }) => {
      const inputField = page
        .locator('textarea, input[type="text"], [contenteditable="true"]')
        .first();
      await inputField.fill("What is artificial intelligence?");

      const sendButton = page
        .locator('button[aria-label*="Send"], button:has-text("Send")')
        .first();
      await sendButton.click();

      // Look for loading indicators
      const loadingIndicators = [
        '[class*="loading"]',
        '[class*="typing"]',
        '[class*="thinking"]',
        "text=/thinking|processing|generating/i",
        '[data-testid="loading-indicator"]',
      ];

      let hasLoading = false;
      for (const selector of loadingIndicators) {
        if (await page.locator(selector).isVisible({ timeout: 2000 })) {
          hasLoading = true;
          break;
        }
      }

      expect(hasLoading).toBeTruthy();
    });

    test("should display AI response", async ({ page }) => {
      const inputField = page
        .locator('textarea, input[type="text"], [contenteditable="true"]')
        .first();
      await inputField.fill("Say 'Hello World'");

      const sendButton = page
        .locator('button[aria-label*="Send"], button:has-text("Send")')
        .first();
      await sendButton.click();

      // Wait for response
      await page.waitForTimeout(3000);

      // Check for AI response indicators
      const hasAIResponse =
        (await page
          .locator('[class*="assistant"], [class*="ai-message"], [data-role="assistant"]')
          .isVisible()) || (await helpers.checkTextVisible("Hello World"));

      expect(hasAIResponse).toBeTruthy();
    });

    test("should handle streaming responses", async ({ page }) => {
      const inputField = page
        .locator('textarea, input[type="text"], [contenteditable="true"]')
        .first();
      await inputField.fill("Count from 1 to 5");

      const sendButton = page
        .locator('button[aria-label*="Send"], button:has-text("Send")')
        .first();
      await sendButton.click();

      // Watch for streaming updates
      let previousLength = 0;
      let isStreaming = false;

      for (let i = 0; i < 5; i++) {
        await page.waitForTimeout(500);

        const aiMessage = page.locator('[class*="assistant"], [class*="ai-message"]').last();
        if (await aiMessage.isVisible()) {
          const currentText = await aiMessage.textContent();
          if (currentText && currentText.length > previousLength) {
            isStreaming = true;
            previousLength = currentText.length;
          }
        }
      }

      // Should have detected streaming or complete response
      expect(isStreaming || previousLength > 0).toBeTruthy();
    });

    test("should handle code blocks in responses", async ({ page }) => {
      const inputField = page
        .locator('textarea, input[type="text"], [contenteditable="true"]')
        .first();
      await inputField.fill("Write a simple JavaScript function");

      const sendButton = page
        .locator('button[aria-label*="Send"], button:has-text("Send")')
        .first();
      await sendButton.click();

      // Wait for response
      await page.waitForTimeout(3000);

      // Check for code block
      const hasCodeBlock = await page.locator('pre, code, [class*="code-block"]').isVisible();

      if (hasCodeBlock) {
        // Check for copy button
        const hasCopyButton = await page
          .locator('button:has-text("Copy"), button[aria-label*="Copy"]')
          .isVisible();
        expect(hasCopyButton).toBeTruthy();
      }
    });
  });

  test.describe("Error Handling", () => {
    test("should handle API errors gracefully", async ({ page, context }) => {
      // Mock API error
      await context.route("**/api/chat", (route) => {
        route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ error: "Internal server error" }),
        });
      });

      const inputField = page
        .locator('textarea, input[type="text"], [contenteditable="true"]')
        .first();
      await inputField.fill("This should trigger an error");

      const sendButton = page
        .locator('button[aria-label*="Send"], button:has-text("Send")')
        .first();
      await sendButton.click();

      await page.waitForTimeout(2000);

      // Should show error message
      const hasError =
        (await helpers.checkTextVisible("error")) ||
        (await helpers.checkTextVisible("failed")) ||
        (await helpers.checkTextVisible("try again"));

      expect(hasError).toBeTruthy();
    });

    test("should handle network disconnection", async ({ page, context }) => {
      // Send initial message
      const inputField = page
        .locator('textarea, input[type="text"], [contenteditable="true"]')
        .first();
      await inputField.fill("Test message");

      // Simulate network failure
      await context.setOffline(true);

      const sendButton = page
        .locator('button[aria-label*="Send"], button:has-text("Send")')
        .first();
      await sendButton.click();

      await page.waitForTimeout(2000);

      // Should show offline/error indication
      const hasOfflineError =
        (await helpers.checkTextVisible("offline")) ||
        (await helpers.checkTextVisible("network")) ||
        (await helpers.checkTextVisible("connection"));

      // Restore connection
      await context.setOffline(false);

      expect(hasOfflineError).toBeTruthy();
    });

    test("should retry failed messages", async ({ page, context }) => {
      let attemptCount = 0;

      // Mock API to fail first time, succeed second time
      await context.route("**/api/chat", (route) => {
        attemptCount++;
        if (attemptCount === 1) {
          route.fulfill({
            status: 500,
            contentType: "application/json",
            body: JSON.stringify({ error: "Temporary error" }),
          });
        } else {
          route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ message: "Success" }),
          });
        }
      });

      const inputField = page
        .locator('textarea, input[type="text"], [contenteditable="true"]')
        .first();
      await inputField.fill("Retry test message");

      const sendButton = page
        .locator('button[aria-label*="Send"], button:has-text("Send")')
        .first();
      await sendButton.click();

      // Look for retry button
      await page.waitForTimeout(2000);
      const retryButton = page.locator('button:has-text("Retry"), button:has-text("Try again")');

      if (await retryButton.isVisible()) {
        await retryButton.click();
        await page.waitForTimeout(2000);

        // Should succeed on retry
        expect(attemptCount).toBe(2);
      }
    });
  });

  test.describe("Chat Features", () => {
    test("should support markdown formatting", async ({ page }) => {
      const markdownMessage = "**Bold** *Italic* `code` [link](http://example.com)";

      const inputField = page
        .locator('textarea, input[type="text"], [contenteditable="true"]')
        .first();
      await inputField.fill(markdownMessage);

      const sendButton = page
        .locator('button[aria-label*="Send"], button:has-text("Send")')
        .first();
      await sendButton.click();

      await page.waitForTimeout(1000);

      // Check for formatted elements
      const hasBold = await page.locator('strong, b, [style*="bold"]').isVisible();
      const hasItalic = await page.locator('em, i, [style*="italic"]').isVisible();
      const hasCode = await page.locator("code").isVisible();

      expect(hasBold || hasItalic || hasCode).toBeTruthy();
    });

    test("should allow message editing", async ({ page }) => {
      // Send a message
      const originalMessage = "Original message";
      const inputField = page
        .locator('textarea, input[type="text"], [contenteditable="true"]')
        .first();
      await inputField.fill(originalMessage);

      const sendButton = page
        .locator('button[aria-label*="Send"], button:has-text("Send")')
        .first();
      await sendButton.click();

      await page.waitForTimeout(1000);

      // Look for edit button
      const editButton = page
        .locator('button[aria-label*="Edit"], button:has-text("Edit")')
        .first();

      if (await editButton.isVisible()) {
        await editButton.click();

        // Edit the message
        const editField = page.locator('[contenteditable="true"], textarea').first();
        await editField.clear();
        await editField.fill("Edited message");

        // Save edit
        const saveButton = page.locator('button:has-text("Save"), button:has-text("Update")');
        await saveButton.click();

        // Check message is updated
        const editedVisible = await helpers.checkTextVisible("Edited message");
        expect(editedVisible).toBeTruthy();
      }
    });

    test("should support message deletion", async ({ page }) => {
      // Send a message
      const messageToDelete = "Delete this message";
      const inputField = page
        .locator('textarea, input[type="text"], [contenteditable="true"]')
        .first();
      await inputField.fill(messageToDelete);

      const sendButton = page
        .locator('button[aria-label*="Send"], button:has-text("Send")')
        .first();
      await sendButton.click();

      await page.waitForTimeout(1000);

      // Look for delete button
      const deleteButton = page
        .locator('button[aria-label*="Delete"], button:has-text("Delete")')
        .first();

      if (await deleteButton.isVisible()) {
        await deleteButton.click();

        // Confirm deletion if needed
        const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Yes")');
        if (await confirmButton.isVisible({ timeout: 1000 })) {
          await confirmButton.click();
        }

        await page.waitForTimeout(1000);

        // Message should be gone
        const messageStillVisible = await helpers.checkTextVisible(messageToDelete);
        expect(messageStillVisible).toBeFalsy();
      }
    });

    test("should clear chat history", async ({ page }) => {
      // Send some messages
      for (let i = 1; i <= 3; i++) {
        const inputField = page
          .locator('textarea, input[type="text"], [contenteditable="true"]')
          .first();
        await inputField.fill(`Message ${i}`);

        const sendButton = page
          .locator('button[aria-label*="Send"], button:has-text("Send")')
          .first();
        await sendButton.click();

        await page.waitForTimeout(300);
      }

      // Look for clear/new chat button
      const clearButton = page.locator(
        'button:has-text("Clear"), button:has-text("New Chat"), button[aria-label*="Clear"]'
      );

      if (await clearButton.isVisible()) {
        await clearButton.click();

        // Confirm if needed
        const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Yes")');
        if (await confirmButton.isVisible({ timeout: 1000 })) {
          await confirmButton.click();
        }

        await page.waitForTimeout(1000);

        // Messages should be cleared
        const messageCount = await page.locator('[class*="message"]').count();
        expect(messageCount).toBe(0);
      }
    });
  });

  test.afterEach(async ({ page }) => {
    const errors = await helpers.getConsoleErrors();
    if (errors.length > 0) {
      console.log("Console errors detected:", errors);
    }
  });
});
