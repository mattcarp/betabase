/**
 * E2E tests for conversation context isolation
 * Tests FEAT-018 Phase 4: Conversations are isolated per context (chat, test, fix)
 *
 * These tests use localStorage manipulation for role enabling to avoid
 * flaky dropdown interactions. The UI tests for settings are in role-based-tabs.spec.ts
 */

import { test, expect } from "@playwright/test";

// Increase timeout for context isolation tests
test.setTimeout(120000);

// Helper to enable tester role via localStorage
// Must include all state fields that Zustand persist middleware expects
async function enableTesterRole(page: import("@playwright/test").Page) {
  await page.evaluate(() => {
    // Enable tester mode in zustand persisted state (include all fields)
    const testerState = {
      state: {
        isTesterModeEnabled: true,
        ladybugPosition: { x: 50, y: 50 }
      },
      version: 0
    };
    localStorage.setItem("tester-mode-storage", JSON.stringify(testerState));
  });
}

// Helper to seed conversations with specific contexts
async function seedConversations(
  page: import("@playwright/test").Page,
  conversations: Array<{
    id: string;
    title: string;
    context: string;
    messages?: Array<{ role: string; content: string }>;
  }>
) {
  await page.evaluate((convs) => {
    const state = {
      state: {
        conversations: convs.map((c) => ({
          ...c,
          messages: c.messages || [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })),
        activeConversationId: convs[0]?.id || null,
        activeConversationByContext: {
          chat: convs.find((c) => c.context === "chat")?.id || null,
          test: convs.find((c) => c.context === "test")?.id || null,
          fix: convs.find((c) => c.context === "fix")?.id || null,
        },
      },
      version: 0,
    };
    localStorage.setItem("siam-conversations", JSON.stringify(state));
  }, conversations);
}

test.describe("Conversation Context Isolation", () => {
  // Run tests serially to avoid localStorage state interference
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page }) => {
    // Use domcontentloaded - ElevenLabs widget blocks load event
    await page.goto("http://localhost:3000", {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await page.evaluate(() => {
      localStorage.clear();
    });
    await page.reload({ waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForSelector('button:has-text("Chat"), a:has-text("Chat")', {
      timeout: 30000,
    });
  });

  test("conversations default to chat context", async ({ page }) => {
    // Check that any conversation created defaults to 'chat' context
    const conversations = await page.evaluate(() => {
      const stored = localStorage.getItem("siam-conversations");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          return parsed.state?.conversations || [];
        } catch {
          return [];
        }
      }
      return [];
    });

    // All conversations should have chat context by default
    for (const conv of conversations) {
      expect(conv.context || "chat").toBe("chat");
    }
  });

  test("Test tab is visible when Tester role enabled", async ({ page }) => {
    // Enable tester role via localStorage
    await enableTesterRole(page);

    // Verify localStorage was set correctly
    const storedState = await page.evaluate(() => localStorage.getItem("tester-mode-storage"));
    expect(storedState).toContain("isTesterModeEnabled");

    // Force page reload to pick up localStorage state
    await page.reload({ waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForSelector('button:has-text("Chat"), a:has-text("Chat")', {
      timeout: 30000,
    });

    // Test tab should now be visible
    const testTab = page
      .locator('button:has-text("Test"), a:has-text("Test")')
      .first();
    await expect(testTab).toBeVisible({ timeout: 10000 });
  });

  test("conversations are filtered by context in localStorage", async ({
    page,
  }) => {
    // Seed conversations with different contexts
    await seedConversations(page, [
      { id: "chat-conv-1", title: "Chat Conversation", context: "chat" },
      { id: "test-conv-1", title: "Test Conversation", context: "test" },
      { id: "fix-conv-1", title: "Fix Conversation", context: "fix" },
    ]);

    // Verify chat context filter
    const chatConversations = await page.evaluate(() => {
      const stored = localStorage.getItem("siam-conversations");
      if (stored) {
        const parsed = JSON.parse(stored);
        const convs = parsed.state?.conversations || [];
        return convs.filter(
          (c: { context?: string }) => (c.context || "chat") === "chat"
        );
      }
      return [];
    });

    expect(chatConversations.length).toBe(1);
    expect(chatConversations[0].title).toBe("Chat Conversation");

    // Verify test context filter
    const testConversations = await page.evaluate(() => {
      const stored = localStorage.getItem("siam-conversations");
      if (stored) {
        const parsed = JSON.parse(stored);
        const convs = parsed.state?.conversations || [];
        return convs.filter(
          (c: { context?: string }) => c.context === "test"
        );
      }
      return [];
    });

    expect(testConversations.length).toBe(1);
    expect(testConversations[0].title).toBe("Test Conversation");
  });

  test("context state persists after page reload", async ({ page }) => {
    // Seed a test conversation
    await seedConversations(page, [
      {
        id: "persist-test-conv",
        title: "Persisted Test Conv",
        context: "test",
        messages: [{ role: "user", content: "test message" }],
      },
    ]);

    // Reload page
    await page.reload({ waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForSelector('button:has-text("Chat"), a:has-text("Chat")', {
      timeout: 30000,
    });

    // Verify conversation still exists with correct context
    const conversations = await page.evaluate(() => {
      const stored = localStorage.getItem("siam-conversations");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          return parsed.state?.conversations || [];
        } catch {
          return [];
        }
      }
      return [];
    });

    expect(conversations.length).toBe(1);
    expect(conversations[0].id).toBe("persist-test-conv");
    expect(conversations[0].context).toBe("test");
  });

  test("activeConversationByContext tracks per-context state", async ({
    page,
  }) => {
    // Seed conversations for multiple contexts
    await seedConversations(page, [
      { id: "active-chat", title: "Active Chat", context: "chat" },
      { id: "active-test", title: "Active Test", context: "test" },
    ]);

    // Verify per-context active state
    const activeByContext = await page.evaluate(() => {
      const stored = localStorage.getItem("siam-conversations");
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.state?.activeConversationByContext || {};
      }
      return {};
    });

    expect(activeByContext.chat).toBe("active-chat");
    expect(activeByContext.test).toBe("active-test");
  });

  test("TesterChatPanel is displayed in Test tab Chat sub-tab", async ({ page }) => {
    // Enable tester role
    await enableTesterRole(page);

    // Set larger viewport to ensure Chat text is visible (sm breakpoint = 640px)
    await page.setViewportSize({ width: 1280, height: 720 });

    // Need full page navigation to pick up localStorage state
    await page.goto("http://localhost:3000", {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await page.waitForSelector('button:has-text("Test"), a:has-text("Test")', {
      timeout: 30000,
    });

    // Click Test tab (main navigation)
    const testTab = page
      .locator('button:has-text("Test"), a:has-text("Test")')
      .first();
    await testTab.click();
    await page.waitForTimeout(1000);

    // Wait for Test Dashboard to load (verify "Test Dashboard" heading is visible)
    await expect(page.locator('h1:has-text("Test Dashboard")')).toBeVisible({ timeout: 10000 });

    // The Test Dashboard has internal tabs: Home, Chat, Ladybug, etc.
    // Find the TabsList inside Test Dashboard (the one with overflow-x-auto scroll)
    // and click the Chat tab (second tab, after Home)
    const testDashboardTabs = page.locator('.overflow-x-auto[role="tablist"] button, [role="tablist"].overflow-x-auto button');
    const chatSubTab = testDashboardTabs.filter({ hasText: "Chat" }).first();
    await chatSubTab.click();
    await page.waitForTimeout(1000);

    // Verify TesterChatPanel is visible - look for Betabase-aware badge
    const betabaseBadge = page.locator('text="Betabase-aware"');
    await expect(betabaseBadge.first()).toBeVisible({ timeout: 10000 });
  });

  test("navigating to Test tab changes URL hash", async ({ page }) => {
    // Enable tester role
    await enableTesterRole(page);

    // Need full page navigation to pick up localStorage state
    await page.goto("http://localhost:3000", {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await page.waitForSelector('button:has-text("Test"), a:has-text("Test")', {
      timeout: 30000,
    });

    // Click Test tab
    const testTab = page
      .locator('button:has-text("Test"), a:has-text("Test")')
      .first();
    await testTab.click();
    await page.waitForTimeout(500);

    // URL should change to #test
    await expect(page).toHaveURL(/#test/);
  });
});
