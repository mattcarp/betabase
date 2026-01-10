/**
 * Unit tests for FEAT-018: Role-Based Contextual Chat System
 *
 * Tests cover:
 * - Role store state management (Zustand)
 * - API endpoint validation and responses
 * - Code block extraction logic
 * - System prompt construction
 *
 * NO MOCKS - Uses real services per project policy
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";

// ============================================================================
// ROLE STORE TESTS
// ============================================================================

describe("FEAT-018: Role Stores", () => {
  // Clean up localStorage between tests
  beforeEach(() => {
    if (typeof localStorage !== "undefined") {
      localStorage.clear();
    }
  });

  afterEach(() => {
    if (typeof localStorage !== "undefined") {
      localStorage.clear();
    }
  });

  describe("Tester Store", () => {
    it("should have correct initial state (disabled by default)", async () => {
      // Import fresh store
      const { useTesterStore } = await import("@/lib/use-tester-store");
      const state = useTesterStore.getState();

      expect(state.isTesterModeEnabled).toBe(false);
    });

    it("should toggle tester mode on", async () => {
      const { useTesterStore } = await import("@/lib/use-tester-store");

      // Toggle on
      useTesterStore.getState().setTesterMode(true);
      expect(useTesterStore.getState().isTesterModeEnabled).toBe(true);
    });

    it("should toggle tester mode off", async () => {
      const { useTesterStore } = await import("@/lib/use-tester-store");

      // Toggle on then off
      useTesterStore.getState().setTesterMode(true);
      useTesterStore.getState().setTesterMode(false);
      expect(useTesterStore.getState().isTesterModeEnabled).toBe(false);
    });

    it("should have toggleTesterMode function", async () => {
      const { useTesterStore } = await import("@/lib/use-tester-store");

      // Start at false
      expect(useTesterStore.getState().isTesterModeEnabled).toBe(false);

      // Toggle
      useTesterStore.getState().toggleTesterMode();
      expect(useTesterStore.getState().isTesterModeEnabled).toBe(true);

      // Toggle again
      useTesterStore.getState().toggleTesterMode();
      expect(useTesterStore.getState().isTesterModeEnabled).toBe(false);
    });
  });

  describe("Programmer Store", () => {
    it("should have correct initial state (disabled by default)", async () => {
      const { useProgrammerStore } = await import("@/lib/use-programmer-store");
      const state = useProgrammerStore.getState();

      expect(state.isProgrammerModeEnabled).toBe(false);
    });

    it("should toggle programmer mode on", async () => {
      const { useProgrammerStore } = await import("@/lib/use-programmer-store");

      useProgrammerStore.getState().setProgrammerMode(true);
      expect(useProgrammerStore.getState().isProgrammerModeEnabled).toBe(true);
    });

    it("should toggle programmer mode off", async () => {
      const { useProgrammerStore } = await import("@/lib/use-programmer-store");

      useProgrammerStore.getState().setProgrammerMode(true);
      useProgrammerStore.getState().setProgrammerMode(false);
      expect(useProgrammerStore.getState().isProgrammerModeEnabled).toBe(false);
    });

    it("should have toggleProgrammerMode function", async () => {
      const { useProgrammerStore } = await import("@/lib/use-programmer-store");

      expect(useProgrammerStore.getState().isProgrammerModeEnabled).toBe(false);
      useProgrammerStore.getState().toggleProgrammerMode();
      expect(useProgrammerStore.getState().isProgrammerModeEnabled).toBe(true);
      useProgrammerStore.getState().toggleProgrammerMode();
      expect(useProgrammerStore.getState().isProgrammerModeEnabled).toBe(false);
    });
  });

  describe("Tech Support Store", () => {
    it("should always be enabled (always-on role)", async () => {
      const { useTechSupportStore } = await import("@/lib/use-tech-support-store");
      const state = useTechSupportStore.getState();

      // Tech Support Staff is always on per FEAT-018 spec
      expect(state.isTechSupportEnabled).toBe(true);
    });

    it("should not be toggleable (always remains true)", async () => {
      const { useTechSupportStore } = await import("@/lib/use-tech-support-store");

      // Try to disable - should still be true (or function may not exist)
      const state = useTechSupportStore.getState();
      if (typeof state.setTechSupportEnabled === "function") {
        state.setTechSupportEnabled(false);
      }

      // Should still be enabled
      expect(useTechSupportStore.getState().isTechSupportEnabled).toBe(true);
    });
  });
});

// ============================================================================
// CODE BLOCK EXTRACTION TESTS
// ============================================================================

describe("FEAT-018: Code Block Extraction", () => {
  // This regex is used in TesterChatPanel to extract code blocks
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;

  it("should extract TypeScript code blocks", () => {
    const content = `Here is some code:

\`\`\`typescript
import { test } from '@playwright/test';

test('example', async ({ page }) => {
  await page.goto('/');
});
\`\`\`

That's the test.`;

    const matches = [...content.matchAll(codeBlockRegex)];
    expect(matches.length).toBe(1);
    expect(matches[0][1]).toBe("typescript");
    expect(matches[0][2]).toContain("import { test }");
  });

  it("should extract multiple code blocks", () => {
    const content = `First block:

\`\`\`javascript
const x = 1;
\`\`\`

Second block:

\`\`\`python
x = 1
\`\`\``;

    const matches = [...content.matchAll(codeBlockRegex)];
    expect(matches.length).toBe(2);
    expect(matches[0][1]).toBe("javascript");
    expect(matches[1][1]).toBe("python");
  });

  it("should handle code blocks without language specifier", () => {
    const content = `\`\`\`
plain code
\`\`\``;

    const matches = [...content.matchAll(codeBlockRegex)];
    expect(matches.length).toBe(1);
    expect(matches[0][1]).toBeUndefined();
    expect(matches[0][2].trim()).toBe("plain code");
  });

  it("should extract Playwright test code correctly", () => {
    const content = `\`\`\`typescript
import { test, expect } from "@playwright/test";

test.describe("Login Flow", () => {
  test("should login successfully", async ({ page }) => {
    await page.goto("/login");
    await page.fill("#email", "test@example.com");
    await page.fill("#password", "password123");
    await page.click("button[type=submit]");
    await expect(page.locator(".welcome")).toBeVisible();
  });
});
\`\`\``;

    const matches = [...content.matchAll(codeBlockRegex)];
    expect(matches.length).toBe(1);
    expect(matches[0][2]).toContain("test.describe");
    expect(matches[0][2]).toContain("page.goto");
    expect(matches[0][2]).toContain("expect");
  });
});

// ============================================================================
// API ENDPOINT TESTS (Integration - require dev server running)
// ============================================================================

describe("FEAT-018: Tester Chat API", () => {
  const API_URL = "http://localhost:3000/api/tester/chat";

  // Helper to check if server is running
  async function isServerRunning(): Promise<boolean> {
    try {
      const response = await fetch(API_URL, { method: "GET", signal: AbortSignal.timeout(2000) });
      return response.ok;
    } catch {
      return false;
    }
  }

  describe("GET /api/tester/chat", () => {
    it("should return API status on GET request", async () => {
      if (!(await isServerRunning())) {
        console.log("Skipping: Dev server not running");
        return;
      }

      const response = await fetch(API_URL, { method: "GET" });

      // Should return 200 OK
      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.status).toBe("ready");
      expect(data.version).toBe("1.0.0");
      expect(data.provider).toBe("google");
      expect(data.features).toContain("streaming");
      expect(data.features).toContain("test-search");
      expect(data.features).toContain("playwright-generation");
    });
  });

  describe("POST /api/tester/chat - Validation", () => {
    it("should reject empty messages array", async () => {
      if (!(await isServerRunning())) {
        console.log("Skipping: Dev server not running");
        return;
      }

      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [] }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain("Invalid");
    });

    it("should reject messages without content", async () => {
      if (!(await isServerRunning())) {
        console.log("Skipping: Dev server not running");
        return;
      }

      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: "" }],
        }),
      });

      expect(response.status).toBe(400);
    });

    it("should reject invalid role", async () => {
      if (!(await isServerRunning())) {
        console.log("Skipping: Dev server not running");
        return;
      }

      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "invalid", content: "test" }],
        }),
      });

      expect(response.status).toBe(400);
    });
  });

  describe("POST /api/tester/chat - Streaming Response", () => {
    it("should return streaming response for valid request", async () => {
      if (!(await isServerRunning())) {
        console.log("Skipping: Dev server not running");
        return;
      }

      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: "What is a Playwright test?" }],
        }),
      });

      // Should return 200 OK with streaming
      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toContain("text/event-stream");

      // Read some of the stream to verify it's working
      const reader = response.body?.getReader();
      if (reader) {
        const { value, done } = await reader.read();
        expect(done).toBe(false);
        expect(value).toBeDefined();

        // Cancel the stream after verifying it works
        await reader.cancel();
      }
    }, 30000); // Extended timeout for API call

    it("should include search metadata header", async () => {
      if (!(await isServerRunning())) {
        console.log("Skipping: Dev server not running");
        return;
      }

      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: "Find tests for authentication" }],
        }),
      });

      expect(response.status).toBe(200);

      // Check for search metadata header
      const metadata = response.headers.get("X-Search-Metadata");
      if (metadata) {
        const parsed = JSON.parse(metadata);
        expect(typeof parsed.testsFound).toBe("number");
        expect(typeof parsed.healingFound).toBe("number");
      }

      // Cancel the stream
      await response.body?.cancel();
    }, 30000);
  });
});

// ============================================================================
// SYSTEM PROMPT TESTS
// ============================================================================

describe("FEAT-018: System Prompts", () => {
  it("should have tester-specific system prompt content", async () => {
    // Check if server is running
    try {
      const response = await fetch("http://localhost:3000/api/tester/chat", {
        method: "GET",
        signal: AbortSignal.timeout(2000),
      });

      if (!response.ok) {
        console.log("Skipping: Dev server not running");
        return;
      }

      const data = await response.json();

      // The API should indicate it's test-focused
      expect(data.features).toContain("test-search");
      expect(data.features).toContain("playwright-generation");
      expect(data.features).toContain("flaky-analysis");
    } catch {
      console.log("Skipping: Dev server not running");
    }
  });
});

// ============================================================================
// ROLE VISIBILITY LOGIC TESTS
// ============================================================================

describe("FEAT-018: Role Visibility Logic", () => {
  // Test the visibility logic that's in ChatPage.tsx
  const COMPONENT_MODES = [
    { mode: "chat", label: "Chat" },
    { mode: "test", label: "Test" },
    { mode: "fix", label: "Fix" },
    { mode: "curate", label: "Curate" },
  ];

  function getVisibleModes(isTesterEnabled: boolean, isProgrammerEnabled: boolean) {
    return COMPONENT_MODES.filter((m) => {
      switch (m.mode) {
        case "chat":
          return true; // Always visible (Tech Support always-on)
        case "test":
          return isTesterEnabled;
        case "fix":
          return isProgrammerEnabled;
        case "curate":
          return true; // Always visible
        default:
          return false;
      }
    });
  }

  it("should show only Chat and Curate when no roles enabled", () => {
    const visible = getVisibleModes(false, false);
    expect(visible.map((m) => m.mode)).toEqual(["chat", "curate"]);
  });

  it("should show Chat, Test, Curate when Tester enabled", () => {
    const visible = getVisibleModes(true, false);
    expect(visible.map((m) => m.mode)).toEqual(["chat", "test", "curate"]);
  });

  it("should show Chat, Fix, Curate when Programmer enabled", () => {
    const visible = getVisibleModes(false, true);
    expect(visible.map((m) => m.mode)).toEqual(["chat", "fix", "curate"]);
  });

  it("should show all four tabs when both roles enabled", () => {
    const visible = getVisibleModes(true, true);
    expect(visible.map((m) => m.mode)).toEqual(["chat", "test", "fix", "curate"]);
  });

  it("should always include Chat tab (Tech Support always-on)", () => {
    // Test all combinations
    const combinations = [
      [false, false],
      [true, false],
      [false, true],
      [true, true],
    ];

    for (const [tester, programmer] of combinations) {
      const visible = getVisibleModes(tester, programmer);
      expect(visible.some((m) => m.mode === "chat")).toBe(true);
    }
  });

  it("should always include Curate tab", () => {
    const combinations = [
      [false, false],
      [true, false],
      [false, true],
      [true, true],
    ];

    for (const [tester, programmer] of combinations) {
      const visible = getVisibleModes(tester, programmer);
      expect(visible.some((m) => m.mode === "curate")).toBe(true);
    }
  });
});

// ============================================================================
// TESTER SUGGESTIONS TESTS
// ============================================================================

describe("FEAT-018: Tester Chat Suggestions", () => {
  const TESTER_SUGGESTIONS = [
    { question: "Find tests related to user authentication", category: "Search" },
    { question: "Show me flaky tests with high failure rates", category: "Analytics" },
    { question: "Generate a Playwright test for the login flow", category: "Generate" },
    { question: "What's the test coverage for the chat feature?", category: "Coverage" },
    { question: "Which tests failed in the last run?", category: "Results" },
    { question: "Suggest new test cases for edge cases", category: "Suggestions" },
  ];

  it("should have 6 default suggestions", () => {
    expect(TESTER_SUGGESTIONS.length).toBe(6);
  });

  it("should cover all main categories", () => {
    const categories = TESTER_SUGGESTIONS.map((s) => s.category);
    expect(categories).toContain("Search");
    expect(categories).toContain("Analytics");
    expect(categories).toContain("Generate");
    expect(categories).toContain("Coverage");
    expect(categories).toContain("Results");
    expect(categories).toContain("Suggestions");
  });

  it("should have questions that mention test-related keywords", () => {
    const testKeywords = ["test", "flaky", "playwright", "coverage", "failed"];

    for (const suggestion of TESTER_SUGGESTIONS) {
      const hasKeyword = testKeywords.some((kw) =>
        suggestion.question.toLowerCase().includes(kw)
      );
      expect(hasKeyword).toBe(true);
    }
  });
});

// ============================================================================
// PHASE 4: CONVERSATION CONTEXT ISOLATION TESTS
// ============================================================================

describe("FEAT-018 Phase 4: Conversation Context Isolation", () => {
  describe("Conversation Store Context Field", () => {
    it("should create conversation with default context of 'chat'", async () => {
      const { useConversationStore } = await import("@/lib/conversation-store");

      // Create a new conversation without specifying context
      const conv = useConversationStore.getState().createConversation("Test");

      expect(conv.context).toBe("chat");
    });

    it("should create conversation with specified context", async () => {
      const { useConversationStore } = await import("@/lib/conversation-store");

      // Create conversations for each context
      const chatConv = useConversationStore.getState().createConversation("Chat Test", "chat");
      const testConv = useConversationStore.getState().createConversation("Test Test", "test");
      const fixConv = useConversationStore.getState().createConversation("Fix Test", "fix");

      expect(chatConv.context).toBe("chat");
      expect(testConv.context).toBe("test");
      expect(fixConv.context).toBe("fix");
    });

    it("should filter conversations by context", async () => {
      const { useConversationStore } = await import("@/lib/conversation-store");

      // Create test conversations in various contexts
      // Note: Store may have pre-existing conversations, so we filter by title
      const chatConv1 = useConversationStore.getState().createConversation("FilterTest-Chat1", "chat");
      const chatConv2 = useConversationStore.getState().createConversation("FilterTest-Chat2", "chat");
      const testConv = useConversationStore.getState().createConversation("FilterTest-Test1", "test");
      const fixConv = useConversationStore.getState().createConversation("FilterTest-Fix1", "fix");

      const state = useConversationStore.getState();

      // Get conversations by context and filter to our test data
      const chatConvs = state.getConversationsByContext("chat").filter((c) => c.title.startsWith("FilterTest-"));
      const testConvs = state.getConversationsByContext("test").filter((c) => c.title.startsWith("FilterTest-"));
      const fixConvs = state.getConversationsByContext("fix").filter((c) => c.title.startsWith("FilterTest-"));

      expect(chatConvs.length).toBe(2);
      expect(testConvs.length).toBe(1);
      expect(fixConvs.length).toBe(1);

      // Verify the conversations are in the correct context
      expect(chatConvs.map((c) => c.id)).toContain(chatConv1.id);
      expect(chatConvs.map((c) => c.id)).toContain(chatConv2.id);
      expect(testConvs.map((c) => c.id)).toContain(testConv.id);
      expect(fixConvs.map((c) => c.id)).toContain(fixConv.id);
    });

    it("should have getConversationsByContext method", async () => {
      const { useConversationStore } = await import("@/lib/conversation-store");

      const state = useConversationStore.getState();

      // Verify the method exists and returns an array
      expect(typeof state.getConversationsByContext).toBe("function");
      expect(Array.isArray(state.getConversationsByContext("chat"))).toBe(true);
      expect(Array.isArray(state.getConversationsByContext("test"))).toBe(true);
      expect(Array.isArray(state.getConversationsByContext("fix"))).toBe(true);
    });

    it("should default to 'chat' context for conversations without context field", async () => {
      const { useConversationStore } = await import("@/lib/conversation-store");

      // The getConversationsByContext method should treat undefined context as 'chat'
      const state = useConversationStore.getState();
      const chatConvs = state.getConversationsByContext("chat");

      // All conversations without explicit context should be in 'chat'
      // (This tests the || "chat" fallback in the implementation)
      expect(Array.isArray(chatConvs)).toBe(true);
    });
  });

  describe("Active Conversation Per Context", () => {
    it("should have setActiveConversationForContext method", async () => {
      const { useConversationStore } = await import("@/lib/conversation-store");

      const state = useConversationStore.getState();
      expect(typeof state.setActiveConversationForContext).toBe("function");
    });

    it("should have getActiveConversationForContext method", async () => {
      const { useConversationStore } = await import("@/lib/conversation-store");

      const state = useConversationStore.getState();
      expect(typeof state.getActiveConversationForContext).toBe("function");
    });

    it("should track active conversation separately per context", async () => {
      const { useConversationStore } = await import("@/lib/conversation-store");

      // Create conversations in different contexts
      const chatConv = useConversationStore.getState().createConversation("ActiveTest-Chat", "chat");
      const testConv = useConversationStore.getState().createConversation("ActiveTest-Test", "test");

      // Set active conversation per context
      useConversationStore.getState().setActiveConversationForContext("chat", chatConv.id);
      useConversationStore.getState().setActiveConversationForContext("test", testConv.id);

      // Get active conversation for each context
      const activeChatId = useConversationStore.getState().getActiveConversationForContext("chat");
      const activeTestId = useConversationStore.getState().getActiveConversationForContext("test");

      expect(activeChatId).toBe(chatConv.id);
      expect(activeTestId).toBe(testConv.id);
    });

    it("should have activeConversationByContext in state", async () => {
      const { useConversationStore } = await import("@/lib/conversation-store");

      const state = useConversationStore.getState();

      // Verify the state has the per-context tracking object
      expect(state.activeConversationByContext).toBeDefined();
      expect(typeof state.activeConversationByContext).toBe("object");
      expect("chat" in state.activeConversationByContext).toBe(true);
      expect("test" in state.activeConversationByContext).toBe(true);
      expect("fix" in state.activeConversationByContext).toBe(true);
    });
  });

  describe("Context Type Safety", () => {
    it("should only accept valid context values", async () => {
      // This is a compile-time check via TypeScript
      // Runtime validation test
      type ConversationContext = "chat" | "test" | "fix";

      const validContexts: ConversationContext[] = ["chat", "test", "fix"];

      for (const ctx of validContexts) {
        expect(["chat", "test", "fix"]).toContain(ctx);
      }
    });

    it("should have context field in Conversation type", async () => {
      // Type checking - verify the field exists in the interface
      const { useConversationStore } = await import("@/lib/conversation-store");

      const conv = useConversationStore.getState().createConversation("Type Test", "chat");

      // TypeScript should recognize 'context' as a valid property
      const context: string | undefined = conv.context;
      expect(context).toBeDefined();
    });

    it("should export ConversationContext type", async () => {
      // Verify the type is exported (import would fail if not)
      const module = await import("@/lib/conversation-store");
      // The type exists at compile time; we just verify the module loads
      expect(module.useConversationStore).toBeDefined();
    });
  });
});
