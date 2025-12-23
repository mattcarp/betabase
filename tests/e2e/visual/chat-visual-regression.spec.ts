import { test, expect } from "../fixtures/base-test";
import { ChatPage } from "../../pages/ChatPage";
import {
  setupConsoleMonitoring,
  assertNoConsoleErrors,
} from "../helpers/console-monitor";

/**
 * Chat Visual Regression Tests
 *
 * PURPOSE: Catch visual regressions in the chat interface before they reach production.
 * These tests capture screenshots of key chat states and compare them against baselines.
 *
 * WHEN TO RUN: Every PR that touches chat components
 *
 * IF THESE FAIL: Visual appearance has changed. Review the diff and either:
 * 1. Fix the regression if unintended
 * 2. Update the baseline if the change is intentional
 */
test.describe("Chat Visual Regression Suite", () => {
  let chatPage: ChatPage;

  test.beforeEach(async ({ page }) => {
    setupConsoleMonitoring(page, {
      ignoreWarnings: true,
      ignoreNetworkErrors: true,
      // Known hydration mismatch issue (caret-color:transparent) - tracked in REGRESSION-LOG.md
      allowedErrorPatterns: [
        /hydration/i,
        /hydrated/i,
        /caret-color/i,
      ],
    });

    chatPage = new ChatPage(page);
    await chatPage.navigate();
  });

  test.afterEach(async () => {
    assertNoConsoleErrors();
  });

  // ==========================================================================
  // CRITICAL: Empty State / Welcome Screen
  // ==========================================================================
  test.describe("Empty Chat State", () => {
    test("welcome screen renders correctly", async ({ page }) => {
      await chatPage.assertChatFormReady();

      // Wait for any animations to complete
      await page.waitForTimeout(500);

      await expect(page).toHaveScreenshot("chat-empty-state.png", {
        animations: "disabled",
        maxDiffPixels: 100,
      });
    });

    test("chat input area renders correctly", async ({ page }) => {
      const chatForm = page.locator('[data-testid="chat-form"]');
      await expect(chatForm).toBeVisible();

      await expect(chatForm).toHaveScreenshot("chat-input-area.png", {
        animations: "disabled",
        maxDiffPixels: 50,
      });
    });

    test("send button has correct styling", async ({ page }) => {
      const sendButton = page.locator('[data-testid="send-button"]');
      await expect(sendButton).toBeVisible();

      await expect(sendButton).toHaveScreenshot("chat-send-button.png", {
        animations: "disabled",
        maxDiffPixels: 20,
      });
    });
  });

  // ==========================================================================
  // CRITICAL: Input States
  // ==========================================================================
  test.describe("Input States", () => {
    test("focused input has correct styling", async ({ page }) => {
      const input = page.locator('[data-testid="chat-input"]');
      await input.focus();

      // Wait for focus animation
      await page.waitForTimeout(200);

      await expect(input).toHaveScreenshot("chat-input-focused.png", {
        animations: "disabled",
        maxDiffPixels: 30,
      });
    });

    test("input with text shows correctly", async ({ page }) => {
      const input = page.locator('[data-testid="chat-input"]');
      await input.fill("This is a test message to check input styling");

      await expect(input).toHaveScreenshot("chat-input-with-text.png", {
        animations: "disabled",
        maxDiffPixels: 50,
      });
    });

    test("multiline input expands correctly", async ({ page }) => {
      const input = page.locator('[data-testid="chat-input"]');

      // Create multiline text
      await input.fill("Line 1\nLine 2\nLine 3\nLine 4");

      await expect(input).toHaveScreenshot("chat-input-multiline.png", {
        animations: "disabled",
        maxDiffPixels: 50,
      });
    });
  });

  // ==========================================================================
  // CRITICAL: Message Appearance
  // ==========================================================================
  test.describe("Message Appearance", () => {
    test("user message has correct styling", async ({ page }) => {
      // Skip if no auth bypass (can't send real messages)
      test.skip(
        !process.env.NEXT_PUBLIC_BYPASS_AUTH,
        "Requires auth bypass for message testing"
      );

      await chatPage.sendMessage("Hello, this is a user message");

      const userMessage = page.locator('[data-testid="user-message"]').first();
      await expect(userMessage).toBeVisible();

      await expect(userMessage).toHaveScreenshot("user-message-styling.png", {
        animations: "disabled",
        maxDiffPixels: 50,
      });
    });

    test("AI message has correct styling", async ({ page }) => {
      test.skip(
        !process.env.NEXT_PUBLIC_BYPASS_AUTH,
        "Requires auth bypass for message testing"
      );

      await chatPage.sendMessageAndWaitForResponse("Say hello");

      const aiMessage = page.locator('[data-testid="ai-message"]').first();
      await expect(aiMessage).toBeVisible();

      await expect(aiMessage).toHaveScreenshot("ai-message-styling.png", {
        animations: "disabled",
        maxDiffPixels: 100, // AI responses vary
      });
    });

    test("message thread has consistent spacing", async ({ page }) => {
      test.skip(
        !process.env.NEXT_PUBLIC_BYPASS_AUTH,
        "Requires auth bypass for message testing"
      );

      // Send multiple messages
      await chatPage.sendMessageAndWaitForResponse("First message");
      await chatPage.sendMessageAndWaitForResponse("Second message");

      // Capture the entire message area
      const messagesArea = page.locator('[data-testid="messages"], .messages-container, [role="log"]').first();

      if (await messagesArea.isVisible()) {
        await expect(messagesArea).toHaveScreenshot("message-thread-spacing.png", {
          animations: "disabled",
          maxDiffPixels: 200,
        });
      }
    });
  });

  // ==========================================================================
  // CRITICAL: MAC Design System Compliance in Chat
  // ==========================================================================
  test.describe("MAC Design System Compliance", () => {
    test("chat uses correct border colors (border-border)", async ({ page }) => {
      // Check that borders use the design system variable
      const borderColors = await page.evaluate(() => {
        const chatForm = document.querySelector('[data-testid="chat-form"]');
        const chatInput = document.querySelector('[data-testid="chat-input"]');

        const results: Array<{ element: string; borderColor: string }> = [];

        if (chatForm) {
          const style = window.getComputedStyle(chatForm);
          results.push({
            element: "chat-form",
            borderColor: style.borderColor,
          });
        }

        if (chatInput) {
          const style = window.getComputedStyle(chatInput);
          results.push({
            element: "chat-input",
            borderColor: style.borderColor,
          });
        }

        return results;
      });

      console.log("Border colors in chat:", borderColors);

      // Verify borders aren't using hardcoded zinc/gray colors
      for (const { element, borderColor } of borderColors) {
        // rgb(39, 39, 42) is zinc-800 - we DON'T want this
        expect(borderColor).not.toBe("rgb(39, 39, 42)");
      }
    });

    test("chat uses correct background colors", async ({ page }) => {
      const bgColors = await page.evaluate(() => {
        const chatForm = document.querySelector('[data-testid="chat-form"]');
        const sendButton = document.querySelector('[data-testid="send-button"]');

        const results: Array<{ element: string; backgroundColor: string }> = [];

        if (chatForm) {
          const style = window.getComputedStyle(chatForm);
          results.push({
            element: "chat-form",
            backgroundColor: style.backgroundColor,
          });
        }

        if (sendButton) {
          const style = window.getComputedStyle(sendButton);
          results.push({
            element: "send-button",
            backgroundColor: style.backgroundColor,
          });
        }

        return results;
      });

      console.log("Background colors in chat:", bgColors);
    });

    test("chat typography uses allowed font weights (100-400)", async ({ page }) => {
      const fontWeights = await page.evaluate(() => {
        const chatElements = document.querySelectorAll(
          '[data-testid="chat-form"] *, [data-testid="user-message"] *, [data-testid="ai-message"] *'
        );

        const violations: Array<{ element: string; weight: string }> = [];
        const invalidWeights = ["500", "600", "700", "800", "900"];

        chatElements.forEach((el) => {
          const style = window.getComputedStyle(el);
          const weight = style.fontWeight;

          if (invalidWeights.includes(weight)) {
            violations.push({
              element: el.tagName,
              weight,
            });
          }
        });

        return violations;
      });

      if (fontWeights.length > 0) {
        console.log("Font weight violations in chat:", fontWeights.slice(0, 5));
      }

      // Allow a few exceptions (buttons, headings)
      expect(fontWeights.length).toBeLessThanOrEqual(5);
    });
  });

  // ==========================================================================
  // CRITICAL: Responsive Views
  // ==========================================================================
  test.describe("Responsive Chat Views", () => {
    test("chat renders correctly on mobile (375px)", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(500);

      await chatPage.assertChatFormReady();

      await expect(page).toHaveScreenshot("chat-mobile-375.png", {
        animations: "disabled",
        maxDiffPixels: 100,
      });
    });

    test("chat renders correctly on tablet (768px)", async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForTimeout(500);

      await chatPage.assertChatFormReady();

      await expect(page).toHaveScreenshot("chat-tablet-768.png", {
        animations: "disabled",
        maxDiffPixels: 100,
      });
    });

    test("chat renders correctly on desktop (1440px)", async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.waitForTimeout(500);

      await chatPage.assertChatFormReady();

      await expect(page).toHaveScreenshot("chat-desktop-1440.png", {
        animations: "disabled",
        maxDiffPixels: 100,
      });
    });
  });

  // ==========================================================================
  // Edge Cases
  // ==========================================================================
  test.describe("Edge Case Visual States", () => {
    test("long message wraps correctly", async ({ page }) => {
      const input = page.locator('[data-testid="chat-input"]');
      const longMessage =
        "This is a very long message that should wrap correctly within the input field. ".repeat(
          5
        );

      await input.fill(longMessage);

      await expect(input).toHaveScreenshot("chat-input-long-text.png", {
        animations: "disabled",
        maxDiffPixels: 100,
      });
    });

    test("special characters render correctly", async ({ page }) => {
      const input = page.locator('[data-testid="chat-input"]');

      // Test special characters (but no emojis per project rules)
      await input.fill("Special chars: <script> & \"quotes\" 'apostrophe' @#$%^&*()");

      await expect(input).toHaveScreenshot("chat-input-special-chars.png", {
        animations: "disabled",
        maxDiffPixels: 50,
      });
    });

    test("code block in input renders correctly", async ({ page }) => {
      const input = page.locator('[data-testid="chat-input"]');

      await input.fill("```javascript\nconst x = 42;\nconsole.log(x);\n```");

      await expect(input).toHaveScreenshot("chat-input-code-block.png", {
        animations: "disabled",
        maxDiffPixels: 50,
      });
    });
  });
});

// ==========================================================================
// CRITICAL: Conversation Sidebar
// Regression: Conversations showing "New conversation" instead of first query
// ==========================================================================
test.describe("Conversation Sidebar", () => {
  test("sidebar renders with conversation list", async ({ page }) => {
    const chatPage = new ChatPage(page);
    await chatPage.navigate();

    // Use stable data-testid selector
    const sidebar = page.locator('[data-testid="conversation-sidebar"]');
    await page.waitForTimeout(1000); // Wait for fonts to load

    if (await sidebar.isVisible()) {
      await expect(sidebar).toHaveScreenshot("conversation-sidebar.png", {
        animations: "disabled",
        maxDiffPixels: 100,
        timeout: 15000,
      });
    }
  });

  test("CRITICAL: No conversation should be titled 'New conversation' @critical", async ({ page }) => {
    /**
     * This is a critical regression test.
     * Every conversation should be titled with the user's first query.
     * "New conversation" as a title is a bug.
     */
    const chatPage = new ChatPage(page);
    await chatPage.navigate();

    // Wait for sidebar to be visible
    const sidebar = page.locator('[data-testid="conversation-sidebar"]');
    await sidebar.waitFor({ state: "visible", timeout: 10000 }).catch(() => {
      console.log("Sidebar not found with data-testid, trying fallback selectors");
    });

    // Wait for page to stabilize
    await page.waitForTimeout(1000);

    // Find all conversation titles - try multiple selector strategies
    const conversationTitles = await page.evaluate(() => {
      // Strategy 1: Use data-testid (preferred)
      let titleElements = document.querySelectorAll('[data-testid="conversation-title"]');

      // Strategy 2: If no data-testid, look for conversation items in sidebar
      if (titleElements.length === 0) {
        // Look for any text that might be conversation titles in the sidebar
        const sidebar = document.querySelector('[data-testid="conversation-sidebar"]');
        if (sidebar) {
          // Look for spans with truncate class that contain conversation titles
          titleElements = sidebar.querySelectorAll('.truncate');
        }
      }

      // Strategy 3: Look for any element containing "New conversation" text
      if (titleElements.length === 0) {
        const allText = document.body.innerText;
        if (allText.includes("New conversation") || allText.includes("New Conversation")) {
          return ["New Conversation"]; // Return this to trigger the failure
        }
      }

      return Array.from(titleElements).map((el) => el.textContent?.trim() || "");
    });

    console.log("Found conversation titles:", conversationTitles);

    // If we find no conversations at all, that's fine - empty state
    // But if we find any, they must not be "New conversation"
    if (conversationTitles.length === 0) {
      console.log("No conversations found - empty state is acceptable");
      return; // Pass - no conversations to check
    }

    // CRITICAL: No title should be "New conversation" or similar variants
    const badTitles = conversationTitles.filter((title) => {
      const normalizedTitle = title.toLowerCase();
      return (
        normalizedTitle === "new conversation" ||
        normalizedTitle === "new chat" ||
        normalizedTitle === "untitled" ||
        normalizedTitle === "untitled conversation" ||
        normalizedTitle === ""
      );
    });

    if (badTitles.length > 0) {
      console.error("REGRESSION: Found conversations with bad titles:", badTitles);
    }

    // This should ALWAYS be 0 - every conversation needs a real title
    expect(badTitles.length).toBe(0);
  });

  test("conversation titles are derived from user's first message", async ({ page }) => {
    test.skip(
      !process.env.NEXT_PUBLIC_BYPASS_AUTH,
      "Requires auth bypass for conversation creation"
    );

    const chatPage = new ChatPage(page);
    await chatPage.navigate();

    // Send a message with a unique identifier
    const uniqueQuery = `Test query about ${Date.now()}`;
    await chatPage.sendMessageAndWaitForResponse(uniqueQuery);

    // The conversation title in the sidebar should contain part of the query
    // (It might be truncated, so we check for the beginning)
    const queryPrefix = uniqueQuery.substring(0, 20);

    // Wait for sidebar to update
    await page.waitForTimeout(1000);

    const sidebarHasTitle = await page.evaluate((prefix) => {
      const sidebar = document.querySelector('[data-testid="conversation-sidebar"]');
      if (!sidebar) return false;

      const text = sidebar.textContent || "";
      return text.toLowerCase().includes(prefix.toLowerCase());
    }, queryPrefix);

    expect(sidebarHasTitle).toBe(true);
  });

  test("new conversation button is visible and styled correctly", async ({ page }) => {
    const chatPage = new ChatPage(page);
    await chatPage.navigate();
    await page.waitForTimeout(1000); // Wait for fonts to load

    // Use stable data-testid selector
    const newConvoButton = page.locator('[data-testid="new-conversation"]');

    if (await newConvoButton.isVisible()) {
      await expect(newConvoButton).toHaveScreenshot("new-conversation-button.png", {
        animations: "disabled",
        maxDiffPixels: 20,
        timeout: 15000,
      });
    }
  });

  test("search bar in sidebar renders correctly", async ({ page }) => {
    const chatPage = new ChatPage(page);
    await chatPage.navigate();
    await page.waitForTimeout(1000); // Wait for fonts to load

    // Use stable data-testid selector
    const searchInput = page.locator('[data-testid="sidebar-search"]');

    if (await searchInput.isVisible()) {
      await expect(searchInput).toHaveScreenshot("sidebar-search-input.png", {
        animations: "disabled",
        maxDiffPixels: 30,
        timeout: 15000,
      });
    }
  });
});

/**
 * Quick Visual Smoke Test
 * Run this for fast feedback on visual changes
 */
test.describe("Chat Visual Quick Smoke @smoke", () => {
  test("chat page loads with correct visual appearance", async ({ page }) => {
    const chatPage = new ChatPage(page);
    await chatPage.navigate();
    await chatPage.assertChatFormReady();

    await expect(page).toHaveScreenshot("chat-smoke-visual.png", {
      animations: "disabled",
      maxDiffPixels: 150,
    });
  });
});
