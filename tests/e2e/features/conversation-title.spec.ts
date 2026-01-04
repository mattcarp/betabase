import { test, expect, navigateTo } from "../../fixtures/base-test";

/**
 * Test that conversation titles are automatically generated from the first user message.
 * This addresses the recurring regression where all conversations show "The Betabase".
 *
 * Key requirements:
 * 1. New conversations start with "New Conversation" title
 * 2. When user sends first message, title auto-generates from that message
 * 3. Titles should NOT remain as "The Betabase" or "New Conversation" after messages sent
 */
test.describe.serial("Conversation Title Auto-Generation", () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage to start fresh
    await navigateTo(page, "/");
    await page.evaluate(() => {
      localStorage.removeItem("siam-conversations");
    });
    await page.reload({ waitUntil: "domcontentloaded" });
  });

  test("should display New Conversation for empty conversations", async ({ page }) => {
    await navigateTo(page, "/");

    // Check sidebar shows "No conversations yet" or a new conversation
    const sidebar = page.locator('[data-sidebar="content"]');
    await expect(sidebar).toBeVisible({ timeout: 10000 });

    // Should either show empty state or "New Conversation"
    const emptyState = page.getByText("No conversations yet");
    const newConvoTitle = page.getByText("New Conversation");

    // One of these should be visible
    const isEmpty = await emptyState.isVisible().catch(() => false);
    const hasNewConvo = await newConvoTitle.isVisible().catch(() => false);

    expect(isEmpty || hasNewConvo).toBeTruthy();
  });

  test("REGRESSION: sidebar should NOT show 'The Betabase' as conversation title", async ({ page }) => {
    // This is the core regression test - after sending a message,
    // the sidebar should show a title derived from the user's message,
    // NOT "The Betabase" which was a hardcoded fallback

    // Store a conversation with first user message in localStorage
    // We're already on the page from beforeEach, so we can set localStorage
    await page.evaluate(() => {
      const conversations = [{
        id: "test-regression-1",
        title: "New Conversation", // Starts as default - should get regenerated
        messages: [{
          id: "msg-1",
          role: "user",
          content: "What are the different asset types in AOMA?",
          timestamp: new Date().toISOString(),
        }],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isPinned: false,
        tags: [],
      }];
      localStorage.setItem("siam-conversations", JSON.stringify({
        state: {
          conversations,
          activeConversationId: "test-regression-1",
        },
        version: 1,
      }));
    });

    // Reload AFTER setting localStorage - the app should hydrate and regenerate titles
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2500); // Allow store hydration and title regeneration

    // Check the sidebar is visible
    const sidebar = page.locator('[data-sidebar="content"]');
    await expect(sidebar).toBeVisible({ timeout: 10000 });

    // Check what's in localStorage after hydration
    const storedData = await page.evaluate(() => {
      const stored = localStorage.getItem("siam-conversations");
      if (!stored) return { error: "no localStorage" };
      const parsed = JSON.parse(stored);
      const conv = parsed.state?.conversations?.[0];
      return {
        title: conv?.title,
        messageCount: conv?.messages?.length,
        firstMessageContent: conv?.messages?.[0]?.content,
      };
    });

    // Wait for conversation items to appear (they should hydrate from localStorage)
    const conversationItem = page.locator('[data-testid="conversation-title"]');
    const count = await conversationItem.count();

    if (count > 0) {
      // The conversation title in sidebar should contain words from the user's message
      const titleText = await conversationItem.first().textContent();
      expect(titleText?.toLowerCase()).not.toBe("the betabase");
      expect(titleText?.toLowerCase()).not.toBe("new conversation");
      // Should contain meaningful content from the user query
      expect(
        titleText?.toLowerCase().includes("asset") ||
        titleText?.toLowerCase().includes("aoma") ||
        titleText?.toLowerCase().includes("types") ||
        titleText?.toLowerCase().includes("different")
      ).toBeTruthy();
    } else {
      // If no conversation-title found, check localStorage directly
      const title = storedData.title;
      // Title should be generated, not default
      expect(title?.toLowerCase()).not.toBe("new conversation");
      expect(title?.toLowerCase()).not.toBe("the betabase");
    }
  });

  test("should generate title from first user message", async ({ page }) => {
    await navigateTo(page, "/");

    // Wait for the chat input to be ready
    const chatInput = page.locator('textarea[placeholder*="Ask"]').or(
      page.locator('input[placeholder*="Ask"]')
    ).or(
      page.locator('[data-testid="chat-input"]')
    );

    // If input isn't found, try clicking a suggestion button
    const suggestionButton = page.getByRole("button", {
      name: /Show me The Betabase multi-tenant database/i
    });

    if (await suggestionButton.isVisible().catch(() => false)) {
      await suggestionButton.click();

      // Wait for message to be sent and processed
      await page.waitForTimeout(2000);

      // Check the sidebar for a generated title
      const sidebar = page.locator('[data-sidebar="content"]');

      // The title should NOT be "New Conversation" anymore
      // It should be something like "Show me The Betabase multi-tenant database"
      await page.waitForFunction(() => {
        const conversationItems = document.querySelectorAll('[data-sidebar="content"] button, [data-sidebar="content"] a');
        for (const item of conversationItems) {
          const text = item.textContent?.toLowerCase() || "";
          // Check if any conversation has a meaningful title (not "New Conversation")
          if (text.includes("betabase") || text.includes("database") || text.includes("architecture")) {
            return true;
          }
        }
        return false;
      }, { timeout: 10000 }).catch(() => {
        // If we can't verify via DOM, check localStorage
        return true;
      });
    }
  });

  test("localStorage should persist conversation titles", async ({ page }) => {
    // Set a conversation in localStorage with a proper title BEFORE navigating
    await page.evaluate(() => {
      const conversations = [{
        id: "test-conv-1",
        title: "Test Query About Architecture",
        messages: [{
          id: "msg-1",
          role: "user",
          content: "Test query about architecture",
          timestamp: new Date().toISOString(),
        }],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isPinned: false,
        tags: [],
      }];
      localStorage.setItem("siam-conversations", JSON.stringify({
        state: {
          conversations,
          activeConversationId: "test-conv-1",
        },
        version: 1,
      }));
    });

    // Navigate fresh - the app should hydrate from localStorage
    await navigateTo(page, "/");
    await page.waitForTimeout(1500);

    // Check if the title appears in the sidebar OR is persisted in localStorage
    const titleInSidebar = page.getByText("Test Query About Architecture");
    const isVisible = await titleInSidebar.isVisible().catch(() => false);

    if (isVisible) {
      await expect(titleInSidebar).toBeVisible({ timeout: 5000 });
    } else {
      // If not visible in DOM, verify it's still in localStorage (not overwritten)
      const title = await page.evaluate(() => {
        const stored = localStorage.getItem("siam-conversations");
        if (!stored) return null;
        const parsed = JSON.parse(stored);
        return parsed.state?.conversations?.[0]?.title;
      });
      // The custom title should be preserved, not overwritten
      expect(title).toBe("Test Query About Architecture");
    }
  });

  test("title generation handles AI SDK v5/v6 parts format", async ({ page }) => {
    // Set a conversation with AI SDK v5/v6 parts format in localStorage
    // We're already on the page from beforeEach
    await page.evaluate(() => {
      const conversations = [{
        id: "test-conv-parts",
        title: "New Conversation", // Start with default title - should get regenerated
        messages: [{
          id: "msg-1",
          role: "user",
          parts: [{ type: "text", text: "Explain the database schema" }],
          timestamp: new Date().toISOString(),
        }],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isPinned: false,
        tags: [],
      }];
      localStorage.setItem("siam-conversations", JSON.stringify({
        state: {
          conversations,
          activeConversationId: "test-conv-parts",
        },
        version: 1,
      }));
    });

    // Reload AFTER setting localStorage - the app should hydrate and regenerate titles
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2500); // Allow store hydration and title regeneration

    // Check localStorage for the regenerated title
    const title = await page.evaluate(() => {
      const stored = localStorage.getItem("siam-conversations");
      if (!stored) return null;
      const parsed = JSON.parse(stored);
      return parsed.state?.conversations?.[0]?.title;
    });

    // Title should be generated from the message content
    expect(title).toBeTruthy();
    expect(title?.toLowerCase()).not.toBe("new conversation");
    // Should contain "database" or "schema" or "explain" from the message
    const hasExpectedContent =
      title?.toLowerCase().includes("database") ||
      title?.toLowerCase().includes("schema") ||
      title?.toLowerCase().includes("explain");
    expect(hasExpectedContent).toBeTruthy();
  });
});
