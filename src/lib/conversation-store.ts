"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  citations?: Citation[];
  reasoningText?: string;
  tools?: ToolInvocation[];
}

export interface Citation {
  title: string;
  url: string;
  snippet?: string;
}

export interface ToolInvocation {
  name: string;
  args: Record<string, any>;
  result?: any;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  isPinned?: boolean;
  tags?: string[];
  model?: string;
}

/**
 * Generate a concise, meaningful title from user's first message.
 * Extracts the essence of the query for sidebar display.
 */
export function generateTitleFromMessage(content: string): string {
  if (!content || typeof content !== "string") return "New Conversation";

  // Clean up the content
  let title = content
    .trim()
    .replace(/\s+/g, " "); // Normalize whitespace

  // Remove common prefixes - apply repeatedly to handle compound phrases like "Hey can you"
  // Note: Keep meaningful action words like "explain", "help me", "show me", "tell me" as they indicate user intent
  const prefixPattern = /^(hey|hi|hello|please|can you|could you|i need|i want|i'd like to|so|um|uh)\s+/i;
  let prevTitle = "";
  while (prevTitle !== title && prefixPattern.test(title)) {
    prevTitle = title;
    title = title.replace(prefixPattern, "");
  }

  // Remove trailing punctuation
  title = title.replace(/[?!.]+$/, "");
  
  // If empty after cleaning, return default
  if (!title) return "New Conversation";
  
  // Capitalize first letter
  title = title.charAt(0).toUpperCase() + title.slice(1);
  
  // Truncate intelligently - try to break at word boundary
  const maxLength = 45;
  if (title.length > maxLength) {
    // Find the last space before maxLength
    const truncateAt = title.lastIndexOf(" ", maxLength);
    if (truncateAt > 20) {
      title = title.substring(0, truncateAt);
    } else {
      title = title.substring(0, maxLength);
    }
  }
  
  return title;
}

/**
 * Check if a title needs auto-generation (is a default/placeholder title)
 */
export function isDefaultTitle(title: string): boolean {
  const defaultTitles = [
    "new conversation",
    "the betabase",
    "untitled",
    "untitled conversation",
    ""
  ];
  return defaultTitles.includes(title.toLowerCase().trim());
}

/**
 * Extract message content from AI SDK v6 format (parts array)
 * AI SDK v6 uses: parts[].text for text content
 *
 * NOTE: v4 format (content string) is no longer supported as of AI SDK 6.0
 * Use migrateMessageToV6() to convert old messages.
 */
export function getMessageContent(m: any): string | undefined {
  if (!m) return undefined;

  // AI SDK v6: parts array with text
  // Join ALL text parts to support multi-part messages
  if (m.parts && Array.isArray(m.parts) && m.parts.length > 0) {
    const allText = m.parts
      .filter((p: any) => p.type === "text" || p.text)
      .map((p: any) => p.text || "")
      .filter(Boolean)
      .join("");
    if (allText) return allText;
  }

  // Legacy fallback: convert v4 content to parts on-the-fly
  // This allows reading old messages but new messages should use parts
  if (m.content) {
    // String content (most common)
    if (typeof m.content === "string") {
      return m.content;
    }
    // Array content - join strings together
    if (Array.isArray(m.content)) {
      return m.content.filter((c: any) => typeof c === "string").join("");
    }
    // Object content with text property
    if (typeof m.content === "object" && m.content.text) {
      return m.content.text;
    }
  }

  return undefined;
}

/**
 * Convert a v4 message (content string) to v6 format (parts array)
 */
export function migrateMessageToV6(m: any): any {
  if (!m) return m;

  // Already v6 format
  if (m.parts && Array.isArray(m.parts)) {
    return m;
  }

  // Convert v4 content to v6 parts
  if (m.content && typeof m.content === "string") {
    return {
      ...m,
      parts: [{ type: "text", text: m.content }],
      content: undefined, // Remove legacy field
    };
  }

  return m;
}

/**
 * Migrate all messages in a conversation to v6 format
 */
export function migrateConversationToV6(conv: Conversation): Conversation {
  return {
    ...conv,
    messages: conv.messages.map(migrateMessageToV6),
  };
}

interface ConversationStore {
  conversations: Conversation[];
  activeConversationId: string | null;
  _hasHydrated: boolean; // True after store has loaded from localStorage

  // Actions
  createConversation: (title?: string) => Conversation;
  deleteConversation: (id: string) => void;
  updateConversation: (id: string, updates: Partial<Conversation>) => void;
  setActiveConversation: (id: string) => void;
  addMessage: (conversationId: string, message: Message) => void;
  pinConversation: (id: string, pinned: boolean) => void;
  searchConversations: (query: string) => Conversation[];
  getConversation: (id: string) => Conversation | undefined;
  clearAllConversations: () => void;
  removeDuplicateConversations: () => void;
  regenerateDefaultTitles: () => number; // Returns count of updated conversations
  setHasHydrated: (hydrated: boolean) => void;
}

export const useConversationStore = create<ConversationStore>()(
  persist(
    (set, get) => ({
      conversations: [],
      activeConversationId: null,
      _hasHydrated: false,

      setHasHydrated: (hydrated: boolean) => set({ _hasHydrated: hydrated }),

      createConversation: (title = "New Conversation") => {
        const newConversation: Conversation = {
          id: `conv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          title,
          messages: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          isPinned: false,
          tags: [],
        };

        set((state) => ({
          conversations: [newConversation, ...state.conversations],
          activeConversationId: newConversation.id,
        }));

        return newConversation;
      },

      deleteConversation: (id) => {
        set((state) => ({
          conversations: state.conversations.filter((c) => c.id !== id),
          activeConversationId:
            state.activeConversationId === id ? null : state.activeConversationId,
        }));
      },

      updateConversation: (id, updates) => {
        set((state) => ({
          conversations: state.conversations.map((c) => {
            if (c.id !== id) return c;

            const updatedConversation = { ...c, ...updates, updatedAt: new Date() };

            // Auto-generate title from first user message if still default/empty
            const shouldGenerateTitle = isDefaultTitle(c.title);
            const hasMessages = updates.messages && updates.messages.length > 0;

            if (shouldGenerateTitle && hasMessages) {
              const firstUserMessage = updates.messages.find(
                (m: any) => m.role === "user" && getMessageContent(m)
              );

              const messageContent = firstUserMessage ? getMessageContent(firstUserMessage) : undefined;
              if (messageContent) {
                const newTitle = generateTitleFromMessage(messageContent);
                updatedConversation.title = newTitle;
              }
            }

            return updatedConversation;
          }),
        }));
      },

      setActiveConversation: (id) => {
        set({ activeConversationId: id });
      },

      addMessage: (conversationId, message) => {
        set((state) => ({
          conversations: state.conversations.map((c) => {
            if (c.id === conversationId) {
              const updatedConversation = {
                ...c,
                messages: [...c.messages, message],
                updatedAt: new Date(),
              };

              // Auto-generate title from first user message if still default
              // Title is generated as soon as first user message arrives (works with AI SDK v4/v5)
              const messageContent = getMessageContent(message);
              if (
                isDefaultTitle(c.title) &&
                message.role === "user" &&
                messageContent
              ) {
                updatedConversation.title = generateTitleFromMessage(messageContent);
              }

              return updatedConversation;
            }
            return c;
          }),
        }));
      },

      pinConversation: (id, pinned) => {
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === id ? { ...c, isPinned: pinned } : c
          ),
        }));
      },

      searchConversations: (query) => {
        const lowerQuery = query.toLowerCase();
        return get().conversations.filter(
          (c) =>
            c.title.toLowerCase().includes(lowerQuery) ||
            c.messages.some((m) => {
              const content = getMessageContent(m);
              return content?.toLowerCase().includes(lowerQuery);
            }) ||
            c.tags?.some((t) => t.toLowerCase().includes(lowerQuery))
        );
      },

      getConversation: (id) => {
        return get().conversations.find((c) => c.id === id);
      },

      clearAllConversations: () => {
        set({ conversations: [], activeConversationId: null });
      },

      removeDuplicateConversations: () => {
        set((state) => {
          const seenTitles = new Map<string, Conversation>();
          const uniqueConversations: Conversation[] = [];

          // Keep the most recent conversation for each title
          for (const conv of state.conversations) {
            const existing = seenTitles.get(conv.title);
            if (!existing || conv.updatedAt > existing.updatedAt) {
              if (existing) {
                // Remove the older conversation from the array
                const index = uniqueConversations.indexOf(existing);
                if (index > -1) {
                  uniqueConversations.splice(index, 1);
                }
              }
              seenTitles.set(conv.title, conv);
              uniqueConversations.push(conv);
            }
          }

          return {
            conversations: uniqueConversations,
            activeConversationId:
              state.activeConversationId &&
              uniqueConversations.some((c) => c.id === state.activeConversationId)
                ? state.activeConversationId
                : uniqueConversations[0]?.id || null,
          };
        });
      },

      regenerateDefaultTitles: () => {
        let updatedCount = 0;
        set((state) => ({
          conversations: state.conversations.map((c) => {
            // Only process conversations with default titles AND messages
            // Works with AI SDK v4 (content) and v5 (parts[0].text) formats
            if (isDefaultTitle(c.title) && c.messages.length > 0) {
              const firstUserMessage = c.messages.find(
                (m: any) => m.role === "user" && getMessageContent(m)
              );
              const messageContent = firstUserMessage ? getMessageContent(firstUserMessage) : undefined;
              if (messageContent) {
                updatedCount++;
                return {
                  ...c,
                  title: generateTitleFromMessage(messageContent),
                  updatedAt: new Date(),
                };
              }
            }
            return c;
          }),
        }));
        return updatedCount;
      },
    }),
    {
      name: "siam-conversations",
      version: 2, // Bumped for AI SDK v6 migration
      onRehydrateStorage: () => (state) => {
        // After hydration completes, mark as hydrated and regenerate any default titles
        // This ensures titles are generated from message content after loading from localStorage
        if (state) {
          state.setHasHydrated(true);
          state.regenerateDefaultTitles();
        }
      },
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;

          const parsed = JSON.parse(str);

          // Convert date strings back to Date objects
          // Guard against undefined/null dates that would create Invalid Date objects
          if (parsed.state?.conversations) {
            parsed.state.conversations = parsed.state.conversations.map((conv: any) => {
              const now = new Date();
              const parseDate = (dateValue: any, fallback: Date): Date => {
                if (!dateValue) return fallback;
                const parsed = new Date(dateValue);
                return isNaN(parsed.getTime()) ? fallback : parsed;
              };

              return {
                ...conv,
                createdAt: parseDate(conv.createdAt, now),
                updatedAt: parseDate(conv.updatedAt, parseDate(conv.createdAt, now)),
                // Migrate messages from v4 (content) to v6 (parts) format
                messages:
                  conv.messages?.map((msg: any) => {
                    const migratedMsg = {
                      ...msg,
                      timestamp: parseDate(msg.timestamp, now),
                    };
                    // Convert v4 content string to v6 parts array
                    if (msg.content && typeof msg.content === "string" && !msg.parts) {
                      migratedMsg.parts = [{ type: "text", text: msg.content }];
                      delete migratedMsg.content;
                    }
                    return migratedMsg;
                  }) || [],
              };
            });
          }

          return parsed;
        },
        setItem: (name, value) => {
          localStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name) => {
          localStorage.removeItem(name);
        },
      },
    }
  )
);
