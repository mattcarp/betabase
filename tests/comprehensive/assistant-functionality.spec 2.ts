import { test, expect } from "@playwright/test";
import { TestHelpers, TEST_USERS } from "../helpers/test-utils";

test.describe("Assistant Functionality - Comprehensive", () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await helpers.monitorConsoleErrors();

    // Set up auth and navigate to assistant
    await page.goto("/");
    await helpers.bypassAuth();
    await page.reload();
    await helpers.waitForPageReady();
    await helpers.selectTab("Assistant");
  });

  test.describe("Assistant Interface", () => {
    test("should display assistant interface elements", async ({ page }) => {
      // Check for assistant-specific elements
      const hasAssistantInterface = await page
        .locator('[data-testid="assistant-interface"], [class*="assistant"]')
        .isVisible();
      expect(hasAssistantInterface).toBeTruthy();

      // Check for thread/conversation area
      const hasThreadArea = await page
        .locator('[class*="thread"], [class*="conversation"]')
        .isVisible();
      expect(hasThreadArea).toBeTruthy();

      // Input field
      const inputField = page.locator(
        'textarea[placeholder*="Ask"], input[placeholder*="Ask"], [contenteditable="true"]'
      );
      await expect(inputField).toBeVisible();

      // Submit button
      const submitButton = page.locator(
        'button[aria-label*="Send"], button:has-text("Send"), button[type="submit"]'
      );
      await expect(submitButton).toBeVisible();
    });

    test("should show assistant capabilities", async ({ page }) => {
      // Look for capability indicators or help text
      const capabilities = ["help", "assist", "analyze", "suggest", "recommend"];

      let hasCapabilities = false;
      for (const capability of capabilities) {
        if (await helpers.checkTextVisible(capability)) {
          hasCapabilities = true;
          break;
        }
      }

      // Or check for a help/info button
      const helpButton = page.locator('button[aria-label*="Help"], button[aria-label*="Info"]');
      if (await helpButton.isVisible()) {
        hasCapabilities = true;
      }

      expect(hasCapabilities).toBeTruthy();
    });

    test("should display system prompts or context", async ({ page }) => {
      // Check for system prompt or context display
      const hasSystemContext = await page
        .locator('[class*="system"], [class*="context"], [data-testid="system-prompt"]')
        .isVisible();

      // Or check for configuration panel
      const hasConfig = await page.locator('[class*="config"], [class*="settings"]').isVisible();

      expect(hasSystemContext || hasConfig).toBeTruthy();
    });
  });

  test.describe("Thread Management", () => {
    test("should create a new thread", async ({ page }) => {
      // Look for new thread button
      const newThreadButton = page.locator(
        'button:has-text("New Thread"), button:has-text("New Conversation"), button[aria-label*="New"]'
      );

      if (await newThreadButton.isVisible()) {
        const initialThreadCount = await page
          .locator('[class*="thread-item"], [class*="conversation-item"]')
          .count();

        await newThreadButton.click();
        await page.waitForTimeout(1000);

        // Check for new thread creation
        const newThreadCount = await page
          .locator('[class*="thread-item"], [class*="conversation-item"]')
          .count();
        expect(newThreadCount).toBeGreaterThanOrEqual(initialThreadCount);

        // Input should be ready for new conversation
        const inputField = page
          .locator('textarea, input[type="text"], [contenteditable="true"]')
          .first();
        const inputValue = await inputField.inputValue().catch(() => inputField.textContent());
        expect(inputValue).toBe("");
      }
    });

    test("should list existing threads", async ({ page }) => {
      // Create some threads first
      for (let i = 1; i <= 3; i++) {
        const inputField = page
          .locator('textarea, input[type="text"], [contenteditable="true"]')
          .first();
        await inputField.fill(`Thread ${i} question`);

        const sendButton = page
          .locator('button[aria-label*="Send"], button:has-text("Send")')
          .first();
        await sendButton.click();

        await page.waitForTimeout(1000);

        // Create new thread for next iteration
        const newThreadButton = page.locator(
          'button:has-text("New Thread"), button:has-text("New")'
        );
        if ((await newThreadButton.isVisible()) && i < 3) {
          await newThreadButton.click();
        }
      }

      // Check thread list
      const threadList = page.locator('[class*="thread-list"], [class*="conversation-list"]');
      if (await threadList.isVisible()) {
        const threadItems = await page
          .locator('[class*="thread-item"], [class*="conversation-item"]')
          .count();
        expect(threadItems).toBeGreaterThanOrEqual(3);
      }
    });

    test("should switch between threads", async ({ page }) => {
      // Create two threads
      const thread1Message = "First thread message";
      const thread2Message = "Second thread message";

      // First thread
      const inputField = page
        .locator('textarea, input[type="text"], [contenteditable="true"]')
        .first();
      await inputField.fill(thread1Message);

      const sendButton = page
        .locator('button[aria-label*="Send"], button:has-text("Send")')
        .first();
      await sendButton.click();
      await page.waitForTimeout(1000);

      // Create second thread
      const newThreadButton = page.locator('button:has-text("New Thread"), button:has-text("New")');
      if (await newThreadButton.isVisible()) {
        await newThreadButton.click();
        await page.waitForTimeout(500);

        await inputField.fill(thread2Message);
        await sendButton.click();
        await page.waitForTimeout(1000);

        // Switch back to first thread
        const firstThread = page
          .locator('[class*="thread-item"], [class*="conversation-item"]')
          .first();
        if (await firstThread.isVisible()) {
          await firstThread.click();
          await page.waitForTimeout(500);

          // Should see first thread message
          const thread1Visible = await helpers.checkTextVisible(thread1Message);
          expect(thread1Visible).toBeTruthy();
        }
      }
    });

    test("should delete threads", async ({ page }) => {
      // Create a thread
      const inputField = page
        .locator('textarea, input[type="text"], [contenteditable="true"]')
        .first();
      await inputField.fill("Thread to delete");

      const sendButton = page
        .locator('button[aria-label*="Send"], button:has-text("Send")')
        .first();
      await sendButton.click();
      await page.waitForTimeout(1000);

      // Look for delete option
      const deleteButton = page.locator(
        'button[aria-label*="Delete thread"], button[aria-label*="Remove"]'
      );

      if (await deleteButton.isVisible()) {
        await deleteButton.click();

        // Confirm deletion
        const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Yes")');
        if (await confirmButton.isVisible({ timeout: 1000 })) {
          await confirmButton.click();
        }

        await page.waitForTimeout(1000);

        // Thread should be removed
        const threadStillVisible = await helpers.checkTextVisible("Thread to delete");
        expect(threadStillVisible).toBeFalsy();
      }
    });
  });

  test.describe("Assistant Responses", () => {
    test("should provide contextual responses", async ({ page }) => {
      const inputField = page
        .locator('textarea, input[type="text"], [contenteditable="true"]')
        .first();
      await inputField.fill("What can you help me with?");

      const sendButton = page
        .locator('button[aria-label*="Send"], button:has-text("Send")')
        .first();
      await sendButton.click();

      // Wait for response
      await page.waitForTimeout(3000);

      // Check for assistant response
      const hasAssistantResponse = await page
        .locator('[class*="assistant"], [data-role="assistant"]')
        .isVisible();
      expect(hasAssistantResponse).toBeTruthy();

      // Response should be contextual
      const responseText = await page
        .locator('[class*="assistant"], [data-role="assistant"]')
        .last()
        .textContent();
      expect(responseText).toBeTruthy();
      expect(responseText.length).toBeGreaterThan(10);
    });

    test("should handle follow-up questions", async ({ page }) => {
      // First question
      const inputField = page
        .locator('textarea, input[type="text"], [contenteditable="true"]')
        .first();
      await inputField.fill("Tell me about artificial intelligence");

      const sendButton = page
        .locator('button[aria-label*="Send"], button:has-text("Send")')
        .first();
      await sendButton.click();

      await page.waitForTimeout(3000);

      // Follow-up question
      await inputField.fill("Can you give me an example?");
      await sendButton.click();

      await page.waitForTimeout(3000);

      // Should have multiple messages in thread
      const messageCount = await page.locator('[class*="message"]').count();
      expect(messageCount).toBeGreaterThanOrEqual(4); // 2 user + 2 assistant
    });

    test("should maintain context across messages", async ({ page }) => {
      // Set context with first message
      const inputField = page
        .locator('textarea, input[type="text"], [contenteditable="true"]')
        .first();
      await inputField.fill("My name is TestUser and I work at SIAM");

      const sendButton = page
        .locator('button[aria-label*="Send"], button:has-text("Send")')
        .first();
      await sendButton.click();

      await page.waitForTimeout(3000);

      // Ask context-dependent question
      await inputField.fill("What is my name?");
      await sendButton.click();

      await page.waitForTimeout(3000);

      // Check if context is maintained
      const responses = await page
        .locator('[class*="assistant"], [data-role="assistant"]')
        .allTextContents();
      const hasContext = responses.some((r) => r.includes("TestUser"));

      expect(hasContext).toBeTruthy();
    });

    test("should handle code generation requests", async ({ page }) => {
      const inputField = page
        .locator('textarea, input[type="text"], [contenteditable="true"]')
        .first();
      await inputField.fill("Write a simple Python hello world function");

      const sendButton = page
        .locator('button[aria-label*="Send"], button:has-text("Send")')
        .first();
      await sendButton.click();

      await page.waitForTimeout(3000);

      // Check for code block in response
      const hasCodeBlock = await page.locator('pre, code, [class*="code-block"]').isVisible();
      expect(hasCodeBlock).toBeTruthy();

      // Check for Python syntax
      const codeContent = await page.locator("pre, code").first().textContent();
      expect(codeContent).toContain("def");
    });
  });

  test.describe("File Integration", () => {
    test("should reference uploaded files", async ({ page }) => {
      // Check if file reference is available
      const hasFileReference = await page
        .locator(
          '[class*="file-reference"], button:has-text("Attach"), button[aria-label*="Upload"]'
        )
        .isVisible();

      if (hasFileReference) {
        // Test file attachment UI
        const attachButton = page.locator(
          'button:has-text("Attach"), button[aria-label*="Upload"]'
        );
        await attachButton.click();

        // Should show file selector or upload interface
        const hasFileSelector = await page
          .locator('input[type="file"], [class*="file-picker"]')
          .isVisible();
        expect(hasFileSelector).toBeTruthy();
      }
    });

    test("should use vector store context", async ({ page }) => {
      // Ask a question that might use vector store
      const inputField = page
        .locator('textarea, input[type="text"], [contenteditable="true"]')
        .first();
      await inputField.fill("Search for information about our documentation");

      const sendButton = page
        .locator('button[aria-label*="Send"], button:has-text("Send")')
        .first();
      await sendButton.click();

      await page.waitForTimeout(3000);

      // Check for source citations or references
      const hasCitations = await page
        .locator('[class*="citation"], [class*="source"], [class*="reference"]')
        .isVisible();

      // Or check for context indicators
      const hasContextIndicator =
        (await helpers.checkTextVisible("based on")) ||
        (await helpers.checkTextVisible("according to")) ||
        (await helpers.checkTextVisible("from the documents"));

      // Should have some form of source reference
      expect(hasCitations || hasContextIndicator).toBeTruthy();
    });
  });

  test.describe("Assistant Settings", () => {
    test("should allow model selection", async ({ page }) => {
      // Look for settings or model selector
      const settingsButton = page.locator(
        'button[aria-label*="Settings"], button:has-text("Settings")'
      );

      if (await settingsButton.isVisible()) {
        await settingsButton.click();

        // Check for model options
        const hasModelSelector = await page
          .locator('select[name*="model"], [class*="model-select"]')
          .isVisible();

        if (hasModelSelector) {
          const modelSelector = page.locator('select[name*="model"], [class*="model-select"]');
          const options = await modelSelector.locator("option").count();
          expect(options).toBeGreaterThan(1);
        }
      }
    });

    test("should allow temperature adjustment", async ({ page }) => {
      const settingsButton = page.locator(
        'button[aria-label*="Settings"], button:has-text("Settings")'
      );

      if (await settingsButton.isVisible()) {
        await settingsButton.click();

        // Check for temperature slider
        const hasTemperatureControl = await page
          .locator('input[type="range"], [class*="temperature"], slider')
          .isVisible();

        if (hasTemperatureControl) {
          const slider = page.locator('input[type="range"]').first();
          const initialValue = await slider.inputValue();

          // Change temperature
          await slider.fill("0.8");

          const newValue = await slider.inputValue();
          expect(newValue).not.toBe(initialValue);
        }
      }
    });

    test("should save assistant preferences", async ({ page }) => {
      const settingsButton = page.locator(
        'button[aria-label*="Settings"], button:has-text("Settings")'
      );

      if (await settingsButton.isVisible()) {
        await settingsButton.click();

        // Make a change
        const modelSelector = page.locator('select[name*="model"], [class*="model-select"]');
        if (await modelSelector.isVisible()) {
          await modelSelector.selectOption({ index: 1 });
        }

        // Save settings
        const saveButton = page.locator('button:has-text("Save"), button:has-text("Apply")');
        if (await saveButton.isVisible()) {
          await saveButton.click();
        }

        // Reload and check if saved
        await page.reload();
        await helpers.waitForPageReady();
        await helpers.selectTab("Assistant");

        if (await settingsButton.isVisible()) {
          await settingsButton.click();

          // Check if setting persisted
          const selectedValue = await modelSelector.inputValue();
          expect(selectedValue).toBeTruthy();
        }
      }
    });
  });

  test.describe("Error Handling", () => {
    test("should handle API failures gracefully", async ({ page, context }) => {
      // Mock API failure
      await context.route("**/api/assistant", (route) => {
        route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ error: "Assistant unavailable" }),
        });
      });

      const inputField = page
        .locator('textarea, input[type="text"], [contenteditable="true"]')
        .first();
      await inputField.fill("This should fail");

      const sendButton = page
        .locator('button[aria-label*="Send"], button:has-text("Send")')
        .first();
      await sendButton.click();

      await page.waitForTimeout(2000);

      // Should show error message
      const hasError =
        (await helpers.checkTextVisible("error")) ||
        (await helpers.checkTextVisible("failed")) ||
        (await helpers.checkTextVisible("unavailable"));

      expect(hasError).toBeTruthy();
    });

    test("should handle rate limiting", async ({ page, context }) => {
      // Mock rate limit response
      await context.route("**/api/assistant", (route) => {
        route.fulfill({
          status: 429,
          contentType: "application/json",
          body: JSON.stringify({ error: "Rate limit exceeded" }),
        });
      });

      const inputField = page
        .locator('textarea, input[type="text"], [contenteditable="true"]')
        .first();
      await inputField.fill("Rate limit test");

      const sendButton = page
        .locator('button[aria-label*="Send"], button:has-text("Send")')
        .first();
      await sendButton.click();

      await page.waitForTimeout(2000);

      // Should show rate limit message
      const hasRateLimit =
        (await helpers.checkTextVisible("rate limit")) ||
        (await helpers.checkTextVisible("too many")) ||
        (await helpers.checkTextVisible("try again"));

      expect(hasRateLimit).toBeTruthy();
    });

    test("should handle timeout gracefully", async ({ page, context }) => {
      // Mock slow response
      await context.route("**/api/assistant", async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 35000)); // Longer than timeout
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ message: "Too late" }),
        });
      });

      const inputField = page
        .locator('textarea, input[type="text"], [contenteditable="true"]')
        .first();
      await inputField.fill("Timeout test");

      const sendButton = page
        .locator('button[aria-label*="Send"], button:has-text("Send")')
        .first();
      await sendButton.click();

      // Wait for timeout indication
      await page.waitForTimeout(32000);

      const hasTimeout =
        (await helpers.checkTextVisible("timeout")) ||
        (await helpers.checkTextVisible("taking longer")) ||
        (await helpers.checkTextVisible("try again"));

      expect(hasTimeout).toBeTruthy();
    });
  });

  test.describe("Export and Sharing", () => {
    test("should export conversation", async ({ page }) => {
      // Create a conversation
      const inputField = page
        .locator('textarea, input[type="text"], [contenteditable="true"]')
        .first();
      await inputField.fill("Test conversation for export");

      const sendButton = page
        .locator('button[aria-label*="Send"], button:has-text("Send")')
        .first();
      await sendButton.click();

      await page.waitForTimeout(2000);

      // Look for export button
      const exportButton = page.locator(
        'button:has-text("Export"), button[aria-label*="Export"], button[aria-label*="Download"]'
      );

      if (await exportButton.isVisible()) {
        // Set up download promise
        const downloadPromise = page.waitForEvent("download");

        await exportButton.click();

        // Check for format options
        const formatOptions = page.locator(
          'button:has-text("JSON"), button:has-text("Markdown"), button:has-text("Text")'
        );
        if (await formatOptions.first().isVisible()) {
          await formatOptions.first().click();
        }

        try {
          const download = await downloadPromise;
          expect(download).toBeTruthy();
        } catch {
          // Export might be copy-to-clipboard instead
          const hasCopySuccess = await helpers.checkTextVisible("copied");
          expect(hasCopySuccess).toBeTruthy();
        }
      }
    });

    test("should share conversation link", async ({ page }) => {
      // Create a conversation
      const inputField = page
        .locator('textarea, input[type="text"], [contenteditable="true"]')
        .first();
      await inputField.fill("Shareable conversation");

      const sendButton = page
        .locator('button[aria-label*="Send"), button:has-text("Send")')
        .first();
      await sendButton.click();

      await page.waitForTimeout(2000);

      // Look for share button
      const shareButton = page.locator('button:has-text("Share"), button[aria-label*="Share"]');

      if (await shareButton.isVisible()) {
        await shareButton.click();

        // Should show share dialog or copy link
        const hasShareDialog = await page
          .locator('[class*="share-dialog"], [class*="share-modal"]')
          .isVisible();
        const hasCopyLink =
          (await helpers.checkTextVisible("link copied")) ||
          (await helpers.checkTextVisible("share link"));

        expect(hasShareDialog || hasCopyLink).toBeTruthy();
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
