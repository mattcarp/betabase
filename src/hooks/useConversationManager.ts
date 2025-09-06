"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Conversation,
  ConversationFilters,
  ConversationManagerState,
} from "../types/conversation";

const STORAGE_KEY = "siam_conversations";
const ACTIVE_CONVERSATION_KEY = "siam_active_conversation";

export function useConversationManager() {
  const [state, setState] = useState<ConversationManagerState>({
    conversations: [],
    activeConversationId: null,
    isLoading: true,
    filters: {},
    totalCount: 0,
  });

  // Load conversations from localStorage on mount
  useEffect(() => {
    loadConversations();
  }, []);

  // Save conversations to localStorage whenever they change
  useEffect(() => {
    if (!state.isLoading) {
      saveConversations();
    }
  }, [state.conversations, state.isLoading]);

  // Save active conversation ID
  useEffect(() => {
    if (state.activeConversationId) {
      localStorage.setItem(ACTIVE_CONVERSATION_KEY, state.activeConversationId);
    }
  }, [state.activeConversationId]);

  const loadConversations = async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true }));

      const stored = localStorage.getItem(STORAGE_KEY);
      const activeId = localStorage.getItem(ACTIVE_CONVERSATION_KEY);

      let conversations: Conversation[] = [];

      if (stored) {
        const parsed = JSON.parse(stored);
        conversations = parsed.map((conv: any) => ({
          ...conv,
          timestamp: new Date(conv.timestamp),
          messages:
            conv.messages?.map((msg: any) => ({
              ...msg,
              timestamp: new Date(msg.timestamp),
            })) || [],
        }));
      } else {
        // Create sample conversations for first-time users
        conversations = generateSampleConversations();
      }

      setState((prev) => ({
        ...prev,
        conversations,
        activeConversationId: activeId || conversations[0]?.id || null,
        isLoading: false,
        totalCount: conversations.length,
      }));
    } catch (error) {
      console.error("Failed to load conversations:", error);
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const saveConversations = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.conversations));
    } catch (error) {
      console.error("Failed to save conversations:", error);
    }
  };

  const generateSampleConversations = (): Conversation[] => {
    const now = new Date();
    return [
      {
        id: "conv-1",
        title: "AOMA System Architecture",
        lastMessage: "Let's discuss the microservices architecture for AOMA...",
        timestamp: new Date(now.getTime() - 3600000), // 1 hour ago
        messageCount: 12,
        isPinned: true,
        tags: ["architecture", "aoma"],
        model: "gpt-4o-mini",
        messages: [],
      },
      {
        id: "conv-2",
        title: "UI Component Design Review",
        lastMessage:
          "The sidebar components look great with the new shadcn integration...",
        timestamp: new Date(now.getTime() - 7200000), // 2 hours ago
        messageCount: 8,
        isActive: true,
        tags: ["ui", "design"],
        model: "gpt-4o-mini",
        messages: [],
      },
      {
        id: "conv-3",
        title: "Authentication & Security",
        lastMessage: "Implementing magic link authentication with Cognito...",
        timestamp: new Date(now.getTime() - 86400000), // 1 day ago
        messageCount: 15,
        tags: ["security", "auth"],
        model: "gpt-4o-mini",
        messages: [],
      },
      {
        id: "conv-4",
        title: "Database Migration Strategy",
        lastMessage: "Planning the PostgreSQL migration for user data...",
        timestamp: new Date(now.getTime() - 172800000), // 2 days ago
        messageCount: 6,
        tags: ["database", "migration"],
        model: "gpt-4o-mini",
        messages: [],
      },
    ];
  };

  const createNewConversation = useCallback(() => {
    const newConversation: Conversation = {
      id: `conv-${Date.now()}`,
      title: `New Conversation`,
      lastMessage: "",
      timestamp: new Date(),
      messageCount: 0,
      isActive: false,
      isPinned: false,
      tags: [],
      model: "gpt-4o-mini",
      messages: [],
    };

    setState((prev) => {
      // Unset active state from all other conversations
      const updatedConversations = prev.conversations.map((conv) => ({
        ...conv,
        isActive: false,
      }));

      // Add new conversation and set it as active
      const newConversations = [
        { ...newConversation, isActive: true },
        ...updatedConversations,
      ];

      return {
        ...prev,
        conversations: newConversations,
        activeConversationId: newConversation.id,
        totalCount: newConversations.length,
      };
    });

    return newConversation.id;
  }, []);

  const selectConversation = useCallback((conversationId: string) => {
    setState((prev) => ({
      ...prev,
      conversations: prev.conversations.map((conv) => ({
        ...conv,
        isActive: conv.id === conversationId,
      })),
      activeConversationId: conversationId,
    }));
  }, []);

  const deleteConversation = useCallback((conversationId: string) => {
    setState((prev) => {
      const filteredConversations = prev.conversations.filter(
        (conv) => conv.id !== conversationId,
      );
      const wasActive = prev.activeConversationId === conversationId;

      let newActiveId = prev.activeConversationId;
      if (wasActive && filteredConversations.length > 0) {
        // Select the first conversation if the deleted one was active
        newActiveId = filteredConversations[0].id;
        filteredConversations[0].isActive = true;
      }

      return {
        ...prev,
        conversations: filteredConversations,
        activeConversationId: newActiveId,
        totalCount: filteredConversations.length,
      };
    });
  }, []);

  const pinConversation = useCallback((conversationId: string) => {
    setState((prev) => ({
      ...prev,
      conversations: prev.conversations.map((conv) =>
        conv.id === conversationId ? { ...conv, isPinned: true } : conv,
      ),
    }));
  }, []);

  const unpinConversation = useCallback((conversationId: string) => {
    setState((prev) => ({
      ...prev,
      conversations: prev.conversations.map((conv) =>
        conv.id === conversationId ? { ...conv, isPinned: false } : conv,
      ),
    }));
  }, []);

  const renameConversation = useCallback(
    (conversationId: string, newTitle: string) => {
      setState((prev) => ({
        ...prev,
        conversations: prev.conversations.map((conv) =>
          conv.id === conversationId
            ? { ...conv, title: newTitle.trim() || "Untitled Conversation" }
            : conv,
        ),
      }));
    },
    [],
  );

  const duplicateConversation = useCallback(
    (conversationId: string) => {
      const conversation = state.conversations.find(
        (conv) => conv.id === conversationId,
      );
      if (!conversation) return;

      const duplicated: Conversation = {
        ...conversation,
        id: `conv-${Date.now()}`,
        title: `${conversation.title} (Copy)`,
        timestamp: new Date(),
        isActive: false,
        isPinned: false,
      };

      setState((prev) => ({
        ...prev,
        conversations: [duplicated, ...prev.conversations],
        totalCount: prev.totalCount + 1,
      }));
    },
    [state.conversations],
  );

  const setFilters = useCallback((filters: ConversationFilters) => {
    setState((prev) => ({ ...prev, filters }));
  }, []);

  const clearFilters = useCallback(() => {
    setState((prev) => ({ ...prev, filters: {} }));
  }, []);

  // Filtered and sorted conversations
  const filteredConversations = useMemo(() => {
    let filtered = [...state.conversations];

    // Apply search filter
    if (state.filters.search) {
      const search = state.filters.search.toLowerCase();
      filtered = filtered.filter(
        (conv) =>
          conv.title.toLowerCase().includes(search) ||
          conv.lastMessage.toLowerCase().includes(search) ||
          conv.tags?.some((tag) => tag.toLowerCase().includes(search)),
      );
    }

    // Apply pinned filter
    if (state.filters.showPinned) {
      filtered = filtered.filter((conv) => conv.isPinned);
    }

    // Apply tag filters
    if (state.filters.tags?.length) {
      filtered = filtered.filter((conv) =>
        conv.tags?.some((tag) => state.filters.tags!.includes(tag)),
      );
    }

    // Apply date range filter
    if (state.filters.dateRange) {
      const { start, end } = state.filters.dateRange;
      filtered = filtered.filter(
        (conv) => conv.timestamp >= start && conv.timestamp <= end,
      );
    }

    // Sort: pinned first, then by timestamp (newest first)
    return filtered.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return b.timestamp.getTime() - a.timestamp.getTime();
    });
  }, [state.conversations, state.filters]);

  const exportConversations = useCallback(() => {
    const data = {
      conversations: state.conversations,
      exportDate: new Date().toISOString(),
      version: "1.0",
    };
    return JSON.stringify(data, null, 2);
  }, [state.conversations]);

  const importConversations = useCallback((jsonData: string) => {
    try {
      const data = JSON.parse(jsonData);
      if (!data.conversations || !Array.isArray(data.conversations)) {
        throw new Error("Invalid conversation data format");
      }

      const importedConversations: Conversation[] = data.conversations.map(
        (conv: any, index: number) => ({
          ...conv,
          id: `imported-${Date.now()}-${index}`, // Generate new IDs to avoid conflicts
          timestamp: new Date(conv.timestamp),
          isActive: false, // Don't activate imported conversations immediately
          messages:
            conv.messages?.map((msg: any) => ({
              ...msg,
              timestamp: new Date(msg.timestamp),
            })) || [],
        }),
      );

      setState((prev) => ({
        ...prev,
        conversations: [...importedConversations, ...prev.conversations],
        totalCount: prev.totalCount + importedConversations.length,
      }));

      return importedConversations.length;
    } catch (error) {
      console.error("Failed to import conversations:", error);
      throw error;
    }
  }, []);

  const updateConversationMessage = useCallback(
    (conversationId: string, lastMessage: string) => {
      setState((prev) => ({
        ...prev,
        conversations: prev.conversations.map((conv) =>
          conv.id === conversationId
            ? {
                ...conv,
                lastMessage,
                timestamp: new Date(),
                messageCount: conv.messageCount + 1,
              }
            : conv,
        ),
      }));
    },
    [],
  );

  const getActiveConversation = useCallback(() => {
    return (
      state.conversations.find(
        (conv) => conv.id === state.activeConversationId,
      ) || null
    );
  }, [state.conversations, state.activeConversationId]);

  return {
    // State
    conversations: filteredConversations,
    allConversations: state.conversations,
    activeConversationId: state.activeConversationId,
    activeConversation: getActiveConversation(),
    isLoading: state.isLoading,
    totalCount: state.totalCount,
    filteredCount: filteredConversations.length,
    filters: state.filters,

    // Actions
    createNewConversation,
    selectConversation,
    deleteConversation,
    pinConversation,
    unpinConversation,
    renameConversation,
    duplicateConversation,
    updateConversationMessage,

    // Filtering
    setFilters,
    clearFilters,

    // Import/Export
    exportConversations,
    importConversations,

    // Utility
    loadConversations,
  };
}
