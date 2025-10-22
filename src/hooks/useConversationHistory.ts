import { useState, useEffect, useCallback } from "react";

export interface ConversationItem {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
  isActive?: boolean;
  isPinned?: boolean;
  messageCount: number;
  preview?: string;
}

export interface ConversationMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ConversationData {
  id: string;
  title: string;
  messages: ConversationMessage[];
  createdAt: Date;
  updatedAt: Date;
  isPinned: boolean;
}

const STORAGE_KEY = "betabase_conversations";
const MAX_CONVERSATIONS = 50;

export const useConversationHistory = () => {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string>("");

  // Load conversations from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const conversationData: ConversationData[] = JSON.parse(stored);
        const conversationItems = conversationData.map((conv) => ({
          id: conv.id,
          title: conv.title,
          lastMessage:
            conv.messages.length > 0
              ? conv.messages[conv.messages.length - 1].content.substring(0, 100) + "..."
              : "New conversation",
          timestamp: new Date(conv.updatedAt),
          isPinned: conv.isPinned,
          messageCount: conv.messages.length,
          preview:
            conv.messages.length > 1
              ? conv.messages[conv.messages.length - 2].content.substring(0, 50) + "..."
              : undefined,
        }));
        setConversations(conversationItems);
      }
    } catch (error) {
      console.error("Failed to load conversation history:", error);
    }
  }, []);

  // Save conversations to localStorage
  const saveConversations = useCallback((conversationData: ConversationData[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(conversationData));
    } catch (error) {
      console.error("Failed to save conversation history:", error);
    }
  }, []);

  // Create a new conversation
  const createConversation = useCallback(
    (title?: string): string => {
      const newId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const newConversation: ConversationData = {
        id: newId,
        title: title || "New Conversation",
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        isPinned: false,
      };

      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        const existingData: ConversationData[] = stored ? JSON.parse(stored) : [];

        // Add new conversation at the beginning
        const updatedData = [newConversation, ...existingData];

        // Limit conversations and remove oldest non-pinned ones
        if (updatedData.length > MAX_CONVERSATIONS) {
          const pinned = updatedData.filter((conv) => conv.isPinned);
          const notPinned = updatedData.filter((conv) => !conv.isPinned);
          const trimmed = [...pinned, ...notPinned.slice(0, MAX_CONVERSATIONS - pinned.length)];
          saveConversations(trimmed);
        } else {
          saveConversations(updatedData);
        }

        // Update state
        const newConversationItem: ConversationItem = {
          id: newId,
          title: newConversation.title,
          lastMessage: "New conversation",
          timestamp: newConversation.createdAt,
          isPinned: false,
          messageCount: 0,
        };

        setConversations((prev) => [newConversationItem, ...prev]);
        setActiveConversationId(newId);

        return newId;
      } catch (error) {
        console.error("Failed to create conversation:", error);
        return "";
      }
    },
    [saveConversations]
  );

  // Update conversation with new messages
  const updateConversation = useCallback(
    (conversationId: string, messages: any[]) => {
      if (!conversationId || messages.length === 0) return;

      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        const conversationData: ConversationData[] = stored ? JSON.parse(stored) : [];

        const conversationIndex = conversationData.findIndex((conv) => conv.id === conversationId);

        if (conversationIndex >= 0) {
          // Update existing conversation
          const conversation = conversationData[conversationIndex];
          conversation.messages = messages.map((msg) => ({
            id: msg.id || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            role: msg.role,
            content: msg.content,
            timestamp: new Date(msg.createdAt || Date.now()),
          }));
          conversation.updatedAt = new Date();

          // Generate title from first user message if it's still "New Conversation"
          if (conversation.title === "New Conversation" && messages.length > 0) {
            const firstUserMessage = messages.find((msg) => msg.role === "user");
            if (firstUserMessage) {
              conversation.title = firstUserMessage.content.substring(0, 50).trim();
              if (conversation.title.length === 50) conversation.title += "...";
            }
          }

          saveConversations(conversationData);

          // Update state
          const updatedItem: ConversationItem = {
            id: conversation.id,
            title: conversation.title,
            lastMessage:
              conversation.messages.length > 0
                ? conversation.messages[conversation.messages.length - 1].content.substring(
                    0,
                    100
                  ) + "..."
                : "New conversation",
            timestamp: conversation.updatedAt,
            isPinned: conversation.isPinned,
            messageCount: conversation.messages.length,
            isActive: conversationId === activeConversationId,
          };

          setConversations((prev) => {
            const updated = [...prev];
            const itemIndex = updated.findIndex((item) => item.id === conversationId);
            if (itemIndex >= 0) {
              updated[itemIndex] = updatedItem;
              // Move updated conversation to top
              updated.splice(itemIndex, 1);
              updated.unshift(updatedItem);
            }
            return updated;
          });
        } else {
          // Create new conversation if it doesn't exist
          const newConversation: ConversationData = {
            id: conversationId,
            title:
              messages.length > 0 && messages[0].role === "user"
                ? messages[0].content.substring(0, 50).trim() +
                  (messages[0].content.length > 50 ? "..." : "")
                : "New Conversation",
            messages: messages.map((msg) => ({
              id: msg.id || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              role: msg.role,
              content: msg.content,
              timestamp: new Date(msg.createdAt || Date.now()),
            })),
            createdAt: new Date(),
            updatedAt: new Date(),
            isPinned: false,
          };

          const updatedData = [newConversation, ...conversationData];
          saveConversations(updatedData);

          const newItem: ConversationItem = {
            id: conversationId,
            title: newConversation.title,
            lastMessage:
              newConversation.messages.length > 0
                ? newConversation.messages[newConversation.messages.length - 1].content.substring(
                    0,
                    100
                  ) + "..."
                : "New conversation",
            timestamp: newConversation.updatedAt,
            isPinned: false,
            messageCount: newConversation.messages.length,
            isActive: conversationId === activeConversationId,
          };

          setConversations((prev) => [newItem, ...prev]);
        }
      } catch (error) {
        console.error("Failed to update conversation:", error);
      }
    },
    [activeConversationId, saveConversations]
  );

  // Pin/unpin conversation
  const togglePin = useCallback(
    (conversationId: string) => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        const conversationData: ConversationData[] = stored ? JSON.parse(stored) : [];

        const conversation = conversationData.find((conv) => conv.id === conversationId);
        if (conversation) {
          conversation.isPinned = !conversation.isPinned;
          saveConversations(conversationData);

          setConversations((prev) =>
            prev.map((item) =>
              item.id === conversationId ? { ...item, isPinned: conversation.isPinned } : item
            )
          );
        }
      } catch (error) {
        console.error("Failed to toggle pin:", error);
      }
    },
    [saveConversations]
  );

  // Delete conversation
  const deleteConversation = useCallback(
    (conversationId: string) => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        const conversationData: ConversationData[] = stored ? JSON.parse(stored) : [];

        const filtered = conversationData.filter((conv) => conv.id !== conversationId);
        saveConversations(filtered);

        setConversations((prev) => prev.filter((item) => item.id !== conversationId));

        if (activeConversationId === conversationId) {
          setActiveConversationId("");
        }
      } catch (error) {
        console.error("Failed to delete conversation:", error);
      }
    },
    [activeConversationId, saveConversations]
  );

  // Load conversation messages
  const loadConversation = useCallback((conversationId: string) => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const conversationData: ConversationData[] = stored ? JSON.parse(stored) : [];

      const conversation = conversationData.find((conv) => conv.id === conversationId);
      return conversation ? conversation.messages : [];
    } catch (error) {
      console.error("Failed to load conversation:", error);
      return [];
    }
  }, []);

  // Set active conversation
  const setActiveConversation = useCallback((conversationId: string) => {
    setActiveConversationId(conversationId);
    setConversations((prev) =>
      prev.map((item) => ({
        ...item,
        isActive: item.id === conversationId,
      }))
    );
  }, []);

  return {
    conversations,
    activeConversationId,
    createConversation,
    updateConversation,
    togglePin,
    deleteConversation,
    loadConversation,
    setActiveConversation,
  };
};
