/**
 * useConversationManager Hook Unit Tests
 * Tests conversation management logic, filtering, and state operations
 *
 * Note: This tests the logic/algorithms used by the hook without React rendering
 * For full hook integration tests, use @testing-library/react-hooks
 */

import { describe, test, expect } from "vitest";

// Type definitions matching the hook
interface Conversation {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
  messageCount: number;
  isPinned?: boolean;
  isActive?: boolean;
  tags?: string[];
  model: string;
  messages: any[];
}

interface ConversationFilters {
  search?: string;
  showPinned?: boolean;
  tags?: string[];
  dateRange?: { start: Date; end: Date };
}

describe("useConversationManager logic", () => {
  // Sample conversations for testing
  const createConversations = (): Conversation[] => {
    const now = new Date();
    return [
      {
        id: "conv-1",
        title: "AOMA System Architecture",
        lastMessage: "Discussing microservices...",
        timestamp: new Date(now.getTime() - 3600000), // 1 hour ago
        messageCount: 12,
        isPinned: true,
        isActive: false,
        tags: ["architecture", "aoma"],
        model: "gpt-4o-mini",
        messages: [],
      },
      {
        id: "conv-2",
        title: "UI Component Design",
        lastMessage: "Reviewing shadcn components...",
        timestamp: new Date(now.getTime() - 7200000), // 2 hours ago
        messageCount: 8,
        isPinned: false,
        isActive: true,
        tags: ["ui", "design"],
        model: "gpt-4o-mini",
        messages: [],
      },
      {
        id: "conv-3",
        title: "Authentication Flow",
        lastMessage: "Magic link implementation...",
        timestamp: new Date(now.getTime() - 86400000), // 1 day ago
        messageCount: 15,
        isPinned: false,
        isActive: false,
        tags: ["security", "auth"],
        model: "gpt-4o-mini",
        messages: [],
      },
      {
        id: "conv-4",
        title: "Database Migration",
        lastMessage: "PostgreSQL schema changes...",
        timestamp: new Date(now.getTime() - 172800000), // 2 days ago
        messageCount: 6,
        isPinned: true,
        isActive: false,
        tags: ["database", "migration"],
        model: "gpt-4o-mini",
        messages: [],
      },
    ];
  };

  describe("filtering logic", () => {
    test("should filter by search term in title", () => {
      const conversations = createConversations();
      const filters: ConversationFilters = { search: "aoma" };

      const filtered = conversations.filter(
        (conv) =>
          conv.title.toLowerCase().includes(filters.search!.toLowerCase()) ||
          conv.lastMessage.toLowerCase().includes(filters.search!.toLowerCase()) ||
          conv.tags?.some((tag) => tag.toLowerCase().includes(filters.search!.toLowerCase()))
      );

      expect(filtered.length).toBe(1);
      expect(filtered[0].id).toBe("conv-1");
    });

    test("should filter by search term in lastMessage", () => {
      const conversations = createConversations();
      const filters: ConversationFilters = { search: "shadcn" };

      const filtered = conversations.filter(
        (conv) =>
          conv.title.toLowerCase().includes(filters.search!.toLowerCase()) ||
          conv.lastMessage.toLowerCase().includes(filters.search!.toLowerCase())
      );

      expect(filtered.length).toBe(1);
      expect(filtered[0].id).toBe("conv-2");
    });

    test("should filter by search term in tags", () => {
      const conversations = createConversations();
      const filters: ConversationFilters = { search: "security" };

      const filtered = conversations.filter(
        (conv) =>
          conv.title.toLowerCase().includes(filters.search!.toLowerCase()) ||
          conv.lastMessage.toLowerCase().includes(filters.search!.toLowerCase()) ||
          conv.tags?.some((tag) => tag.toLowerCase().includes(filters.search!.toLowerCase()))
      );

      expect(filtered.length).toBe(1);
      expect(filtered[0].id).toBe("conv-3");
    });

    test("should filter to show only pinned conversations", () => {
      const conversations = createConversations();
      const filters: ConversationFilters = { showPinned: true };

      const filtered = conversations.filter((conv) => conv.isPinned);

      expect(filtered.length).toBe(2);
      expect(filtered.map((c) => c.id)).toContain("conv-1");
      expect(filtered.map((c) => c.id)).toContain("conv-4");
    });

    test("should filter by specific tags", () => {
      const conversations = createConversations();
      const filters: ConversationFilters = { tags: ["ui", "design"] };

      const filtered = conversations.filter((conv) =>
        conv.tags?.some((tag) => filters.tags!.includes(tag))
      );

      expect(filtered.length).toBe(1);
      expect(filtered[0].id).toBe("conv-2");
    });

    test("should filter by date range", () => {
      const conversations = createConversations();
      const now = new Date();
      const filters: ConversationFilters = {
        dateRange: {
          start: new Date(now.getTime() - 100000000), // ~1 day ago
          end: now,
        },
      };

      const filtered = conversations.filter(
        (conv) =>
          conv.timestamp >= filters.dateRange!.start &&
          conv.timestamp <= filters.dateRange!.end
      );

      // Should include conversations from last ~1 day
      expect(filtered.length).toBe(3); // conv-1, conv-2, conv-3
    });

    test("should combine multiple filters", () => {
      const conversations = createConversations();
      const filters: ConversationFilters = {
        search: "architecture",
        showPinned: true,
      };

      let filtered = conversations;

      if (filters.search) {
        const search = filters.search.toLowerCase();
        filtered = filtered.filter(
          (conv) =>
            conv.title.toLowerCase().includes(search) ||
            conv.lastMessage.toLowerCase().includes(search) ||
            conv.tags?.some((tag) => tag.toLowerCase().includes(search))
        );
      }

      if (filters.showPinned) {
        filtered = filtered.filter((conv) => conv.isPinned);
      }

      expect(filtered.length).toBe(1);
      expect(filtered[0].id).toBe("conv-1");
    });
  });

  describe("sorting logic", () => {
    test("should sort pinned conversations first", () => {
      const conversations = createConversations();

      const sorted = [...conversations].sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return b.timestamp.getTime() - a.timestamp.getTime();
      });

      // First two should be pinned
      expect(sorted[0].isPinned).toBe(true);
      expect(sorted[1].isPinned).toBe(true);
      // Remaining should be sorted by timestamp (newest first)
      expect(sorted[2].isPinned).toBe(false);
      expect(sorted[3].isPinned).toBe(false);
    });

    test("should sort by timestamp within pinned/unpinned groups", () => {
      const conversations = createConversations();

      const sorted = [...conversations].sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return b.timestamp.getTime() - a.timestamp.getTime();
      });

      // Among pinned: conv-1 is newer than conv-4
      const pinnedConvs = sorted.filter((c) => c.isPinned);
      expect(pinnedConvs[0].id).toBe("conv-1");
      expect(pinnedConvs[1].id).toBe("conv-4");

      // Among unpinned: conv-2 is newer than conv-3
      const unpinnedConvs = sorted.filter((c) => !c.isPinned);
      expect(unpinnedConvs[0].id).toBe("conv-2");
      expect(unpinnedConvs[1].id).toBe("conv-3");
    });
  });

  describe("conversation creation", () => {
    test("should create new conversation with correct defaults", () => {
      const newConversation: Conversation = {
        id: `conv-${Date.now()}`,
        title: "New Conversation",
        lastMessage: "",
        timestamp: new Date(),
        messageCount: 0,
        isActive: false,
        isPinned: false,
        tags: [],
        model: "gpt-4o-mini",
        messages: [],
      };

      expect(newConversation.title).toBe("New Conversation");
      expect(newConversation.messageCount).toBe(0);
      expect(newConversation.isPinned).toBe(false);
      expect(newConversation.tags).toEqual([]);
      expect(newConversation.messages).toEqual([]);
    });

    test("should generate unique IDs", () => {
      const ids = new Set<string>();

      for (let i = 0; i < 100; i++) {
        const id = `conv-${Date.now()}-${i}`;
        ids.add(id);
      }

      expect(ids.size).toBe(100);
    });
  });

  describe("conversation selection", () => {
    test("should set isActive on selected conversation", () => {
      const conversations = createConversations();
      const selectedId = "conv-3";

      const updated = conversations.map((conv) => ({
        ...conv,
        isActive: conv.id === selectedId,
      }));

      const activeConv = updated.find((c) => c.isActive);
      expect(activeConv?.id).toBe("conv-3");

      const inactiveCount = updated.filter((c) => !c.isActive).length;
      expect(inactiveCount).toBe(3);
    });
  });

  describe("conversation deletion", () => {
    test("should remove conversation from list", () => {
      const conversations = createConversations();
      const deleteId = "conv-2";

      const filtered = conversations.filter((conv) => conv.id !== deleteId);

      expect(filtered.length).toBe(3);
      expect(filtered.find((c) => c.id === deleteId)).toBeUndefined();
    });

    test("should select first conversation when active is deleted", () => {
      const conversations = createConversations();
      const activeId = "conv-2";

      const filtered = conversations.filter((conv) => conv.id !== activeId);
      const newActiveId = filtered.length > 0 ? filtered[0].id : null;

      expect(newActiveId).toBe("conv-1");
    });
  });

  describe("pin/unpin operations", () => {
    test("should pin a conversation", () => {
      const conversations = createConversations();
      const pinId = "conv-2";

      const updated = conversations.map((conv) =>
        conv.id === pinId ? { ...conv, isPinned: true } : conv
      );

      const pinnedConv = updated.find((c) => c.id === pinId);
      expect(pinnedConv?.isPinned).toBe(true);
    });

    test("should unpin a conversation", () => {
      const conversations = createConversations();
      const unpinId = "conv-1";

      const updated = conversations.map((conv) =>
        conv.id === unpinId ? { ...conv, isPinned: false } : conv
      );

      const unpinnedConv = updated.find((c) => c.id === unpinId);
      expect(unpinnedConv?.isPinned).toBe(false);
    });
  });

  describe("rename operation", () => {
    test("should rename conversation", () => {
      const conversations = createConversations();
      const renameId = "conv-1";
      const newTitle = "Updated Title";

      const updated = conversations.map((conv) =>
        conv.id === renameId ? { ...conv, title: newTitle } : conv
      );

      const renamedConv = updated.find((c) => c.id === renameId);
      expect(renamedConv?.title).toBe("Updated Title");
    });

    test("should use default title for empty rename", () => {
      const newTitle = "";
      const finalTitle = newTitle.trim() || "Untitled Conversation";

      expect(finalTitle).toBe("Untitled Conversation");
    });

    test("should trim whitespace from title", () => {
      const newTitle = "  Spaced Title  ";
      const finalTitle = newTitle.trim() || "Untitled Conversation";

      expect(finalTitle).toBe("Spaced Title");
    });
  });

  describe("duplicate operation", () => {
    test("should create duplicate with new ID", () => {
      const original: Conversation = {
        id: "conv-original",
        title: "Original Title",
        lastMessage: "Some message",
        timestamp: new Date(),
        messageCount: 5,
        isPinned: true,
        isActive: true,
        tags: ["tag1", "tag2"],
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: "hello" }],
      };

      const duplicated: Conversation = {
        ...original,
        id: `conv-${Date.now()}`,
        title: `${original.title} (Copy)`,
        timestamp: new Date(),
        isActive: false,
        isPinned: false,
      };

      expect(duplicated.id).not.toBe(original.id);
      expect(duplicated.title).toBe("Original Title (Copy)");
      expect(duplicated.isPinned).toBe(false);
      expect(duplicated.isActive).toBe(false);
      expect(duplicated.messages).toEqual(original.messages);
    });
  });

  describe("message update", () => {
    test("should update lastMessage and increment count", () => {
      const conversation: Conversation = {
        id: "conv-1",
        title: "Test",
        lastMessage: "Old message",
        timestamp: new Date("2024-01-01"),
        messageCount: 5,
        isPinned: false,
        tags: [],
        model: "gpt-4o-mini",
        messages: [],
      };

      const newMessage = "New message content";
      const updated = {
        ...conversation,
        lastMessage: newMessage,
        timestamp: new Date(),
        messageCount: conversation.messageCount + 1,
      };

      expect(updated.lastMessage).toBe("New message content");
      expect(updated.messageCount).toBe(6);
      expect(updated.timestamp.getTime()).toBeGreaterThan(
        conversation.timestamp.getTime()
      );
    });
  });

  describe("export/import", () => {
    test("should export conversations to JSON", () => {
      const conversations = createConversations();

      const exported = JSON.stringify(
        {
          conversations,
          exportDate: new Date().toISOString(),
          version: "1.0",
        },
        null,
        2
      );

      const parsed = JSON.parse(exported);

      expect(parsed.conversations.length).toBe(4);
      expect(parsed.version).toBe("1.0");
      expect(parsed.exportDate).toBeDefined();
    });

    test("should import conversations with new IDs", () => {
      const importData = {
        conversations: [
          {
            id: "old-id-1",
            title: "Imported Conversation",
            lastMessage: "Message",
            timestamp: "2024-01-15T10:00:00Z",
            messageCount: 3,
            tags: ["imported"],
            model: "gpt-4o-mini",
            messages: [],
          },
        ],
        exportDate: "2024-01-15T10:00:00Z",
        version: "1.0",
      };

      const imported = importData.conversations.map((conv, index) => ({
        ...conv,
        id: `imported-${Date.now()}-${index}`,
        timestamp: new Date(conv.timestamp),
        isActive: false,
        messages:
          conv.messages?.map((msg: any) => ({
            ...msg,
            timestamp: msg.timestamp ? new Date(msg.timestamp) : undefined,
          })) || [],
      }));

      expect(imported[0].id).not.toBe("old-id-1");
      expect(imported[0].id).toContain("imported-");
      expect(imported[0].timestamp instanceof Date).toBe(true);
      expect(imported[0].isActive).toBe(false);
    });

    test("should reject invalid import data", () => {
      const invalidData = { notConversations: [] };

      const isValid =
        invalidData.conversations && Array.isArray(invalidData.conversations);

      expect(isValid).toBeFalsy();
    });
  });

  describe("state counts", () => {
    test("should track total count", () => {
      const conversations = createConversations();
      expect(conversations.length).toBe(4);
    });

    test("should track filtered count", () => {
      const conversations = createConversations();
      const filters: ConversationFilters = { showPinned: true };

      const filtered = conversations.filter((conv) => conv.isPinned);

      expect(filtered.length).toBe(2);
    });
  });

  describe("date handling", () => {
    test("should parse date strings to Date objects", () => {
      const dateString = "2024-01-15T10:00:00Z";
      const parsed = new Date(dateString);

      expect(parsed instanceof Date).toBe(true);
      expect(parsed.toISOString()).toBe("2024-01-15T10:00:00.000Z");
    });

    test("should handle message timestamps", () => {
      const messages = [
        { role: "user", content: "Hello", timestamp: "2024-01-15T10:00:00Z" },
        { role: "assistant", content: "Hi", timestamp: "2024-01-15T10:00:01Z" },
      ];

      const parsedMessages = messages.map((msg) => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
      }));

      expect(parsedMessages[0].timestamp instanceof Date).toBe(true);
      expect(parsedMessages[1].timestamp instanceof Date).toBe(true);
    });
  });
});
