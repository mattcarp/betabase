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
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === id ? { ...c, ...updates, updatedAt: new Date() } : c
          ),
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
              if (
                c.title === "New Conversation" &&
                message.role === "user" &&
                c.messages.length === 0
              ) {
                updatedConversation.title =
                  message.content.slice(0, 50) + (message.content.length > 50 ? "..." : "");
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
            c.messages.some((m) => m.content.toLowerCase().includes(lowerQuery)) ||
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
          if (parsed.state?.conversations) {
            parsed.state.conversations = parsed.state.conversations.map((conv: any) => ({
              ...conv,
              createdAt: new Date(conv.createdAt),
              updatedAt: new Date(conv.updatedAt),
              messages:
                conv.messages?.map((msg: any) => ({
                  ...msg,
                  timestamp: new Date(msg.timestamp),
                })) || [],
            }));
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
