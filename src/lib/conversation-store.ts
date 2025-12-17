"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  citations?: Citation[];
  reasoning?: string;
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
function generateTitleFromMessage(content: string): string {
  if (!content || typeof content !== "string") return "New Conversation";
  
  // Clean up the content
  let title = content
    .trim()
    .replace(/\s+/g, " ") // Normalize whitespace
    .replace(/^(hey|hi|hello|please|can you|could you|i need|i want)\s+/i, "") // Remove common prefixes
    .replace(/[?!.]+$/, ""); // Remove trailing punctuation
  
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
      title = title.substring(0, truncateAt) + "...";
    } else {
      title = title.substring(0, maxLength) + "...";
    }
  }
  
  return title;
}

/**
 * Check if a title needs auto-generation (is a default/placeholder title)
 */
function isDefaultTitle(title: string): boolean {
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
 * Extract message content from AI SDK v4 or v5 format
 * AI SDK v5 uses parts[0].text, v4 uses content
 */
function getMessageContent(m: any): string | undefined {
  // AI SDK v5: parts[0].text
  if (m.parts && m.parts[0]?.text) {
    return m.parts[0].text;
  }
  // AI SDK v4 / fallback: content
  if (m.content && typeof m.content === "string") {
    return m.content;
  }
  return undefined;
}

interface ConversationStore {
  conversations: Conversation[];
  activeConversationId: string | null;

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
}

export const useConversationStore = create<ConversationStore>()(
  persist(
    (set, get) => ({
      conversations: [],
      activeConversationId: null,

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
        // #region agent log
        if (typeof window !== 'undefined') {
          fetch('http://127.0.0.1:7243/ingest/d8722888-9008-4d43-a867-1323ebab5570',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'conversation-store.ts:updateConversation',message:'Updating conversation',data:{id,updatesHasMessages:!!updates.messages,updatesMessageCount:updates.messages?.length,lastMsgContent:updates.messages?.[updates.messages?.length-1]?.content?.substring?.(0,50),lastMsgParts:updates.messages?.[updates.messages?.length-1]?.parts?.[0]?.text?.substring?.(0,50)},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H2,H3,H5'})}).catch(()=>{});
        }
        // #endregion
        set((state) => ({
          conversations: state.conversations.map((c) => {
            if (c.id !== id) return c;

            const updatedConversation = { ...c, ...updates, updatedAt: new Date() };

            // Auto-generate title from first user message if still default/empty
            // Works with both our Message type and Vercel AI SDK v4/v5 message format
            if (isDefaultTitle(c.title) && updates.messages && updates.messages.length > 0) {
              // AI SDK v5 uses parts[0].text, v4 uses content - use helper to extract
              const firstUserMessage = updates.messages.find(
                (m: any) => m.role === "user" && getMessageContent(m)
              );
              
              const messageContent = firstUserMessage ? getMessageContent(firstUserMessage) : undefined;
              if (messageContent) {
                updatedConversation.title = generateTitleFromMessage(messageContent);
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
      version: 1,
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
                messages:
                  conv.messages?.map((msg: any) => ({
                    ...msg,
                    timestamp: parseDate(msg.timestamp, now),
                  })) || [],
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
