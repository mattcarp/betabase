import React, { useState, useRef, useEffect } from "react";
import { cn } from "../../../lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle,
  Plus,
  Search,
  Clock,
  Star,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  MoreVertical,
  Pin,
  Archive,
  Trash2,
  Edit,
  X,
} from "lucide-react";

interface ConversationItem {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
  isActive?: boolean;
  isPinned?: boolean;
  messageCount?: number;
  preview?: string;
}

interface ConversationGroup {
  label: string;
  conversations: ConversationItem[];
  defaultExpanded?: boolean;
}

interface LeftSidebarProps {
  conversations?: ConversationItem[];
  onConversationSelect?: (id: string) => void;
  onNewConversation?: () => void;
  className?: string;
  onToggle?: () => void;
  onConversationAction?: (id: string, action: "rename" | "pin" | "archive" | "delete") => void;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  conversations = [],
  onConversationSelect,
  onNewConversation,
  className,
  onToggle,
  onConversationAction,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(["Today", "Yesterday"])
  );
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    conversationId: string;
  } | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Sample conversations for development - will be replaced with real data
  const sampleConversations: ConversationItem[] =
    conversations.length > 0
      ? conversations
      : [
          {
            id: "1",
            title: "Project Planning Discussion",
            lastMessage: "Let's review the Q4 roadmap and prioritize features...",
            timestamp: new Date(Date.now() - 3600000),
            isPinned: true,
            messageCount: 12,
          },
          {
            id: "2",
            title: "Design System Review",
            lastMessage: "The MAC design system integration looks great! I love the new...",
            timestamp: new Date(Date.now() - 7200000),
            isActive: true,
            messageCount: 8,
          },
          {
            id: "3",
            title: "API Architecture",
            lastMessage: "Regarding the REST endpoints, we should consider GraphQL for...",
            timestamp: new Date(Date.now() - 86400000),
            messageCount: 15,
          },
          {
            id: "4",
            title: "Database Optimization",
            lastMessage: "Query performance improvements are showing great results...",
            timestamp: new Date(Date.now() - 172800000),
            messageCount: 6,
          },
          {
            id: "5",
            title: "UI Components Library",
            lastMessage: "Building reusable components with TypeScript support...",
            timestamp: new Date(Date.now() - 259200000),
            messageCount: 22,
          },
          {
            id: "6",
            title: "Authentication Flow",
            lastMessage: "JWT implementation details and security considerations...",
            timestamp: new Date(Date.now() - 604800000),
            isPinned: true,
            messageCount: 18,
          },
        ];

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / 3600000);

    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const getTimeGroup = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / 3600000);

    if (hours < 24) return "Today";
    if (hours < 48) return "Yesterday";
    if (hours < 168) return "This Week";
    return "Older";
  };

  const groupConversations = (conversations: ConversationItem[]): ConversationGroup[] => {
    const filtered = conversations.filter(
      (conv) =>
        conv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const grouped = filtered.reduce(
      (groups, conv) => {
        const group = getTimeGroup(conv.timestamp);
        if (!groups[group]) groups[group] = [];
        groups[group].push(conv);
        return groups;
      },
      {} as Record<string, ConversationItem[]>
    );

    // Sort conversations within each group by timestamp (newest first)
    Object.keys(grouped).forEach((key) => {
      grouped[key].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    });

    // Convert to array with proper ordering
    const groupOrder = ["Today", "Yesterday", "This Week", "Older"];
    return groupOrder
      .filter((group) => grouped[group]?.length > 0)
      .map((group) => ({
        label: group,
        conversations: grouped[group],
        defaultExpanded: group === "Today" || group === "Yesterday",
      }));
  };

  const toggleGroup = (groupLabel: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupLabel)) {
      newExpanded.delete(groupLabel);
    } else {
      newExpanded.add(groupLabel);
    }
    setExpandedGroups(newExpanded);
  };

  const handleContextMenu = (e: React.MouseEvent, conversationId: string) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      conversationId,
    });
  };

  const handleContextAction = (action: "rename" | "pin" | "archive" | "delete") => {
    if (contextMenu) {
      onConversationAction?.(contextMenu.conversationId, action);
      setContextMenu(null);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K to focus search
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }

      // Escape to close context menu or clear search
      if (e.key === "Escape") {
        if (contextMenu) {
          setContextMenu(null);
        } else if (searchQuery) {
          setSearchQuery("");
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("click", () => setContextMenu(null));

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("click", () => setContextMenu(null));
    };
  }, [contextMenu, searchQuery]);

  const conversationGroups = groupConversations(sampleConversations);

  return (
    <div
      className={cn(
        "h-full bg-mac-surface-elevated/50 backdrop-blur-xl border-r border-mac-border",
        "flex flex-col relative",
        className
      )}
    >
      {/* Collapse Toggle */}
      <button
        onClick={onToggle}
        className="absolute -right-4 top-8 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900 border border-zinc-800/50 hover:bg-zinc-800 transition-colors group"
        aria-label="Toggle sidebar"
      >
        <ChevronLeft className="h-4 w-4 text-zinc-400 group-hover:text-white transition-colors" />
      </button>

      {/* Header with New Conversation Button */}
      <div className="p-4 border-b border-mac-border">
        <button
          onClick={onNewConversation}
          className="w-full mac-button mac-button-primary flex items-center justify-center gap-2 hover:bg-mac-primary-blue-500/20 transition-all duration-200"
        >
          <Plus className="w-4 h-4" />
          <span>New Conversation</span>
        </button>

        {/* Enhanced Search Bar */}
        <div className="mt-4 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-mac-text-muted pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-10 py-2.5 bg-mac-surface-bg border border-mac-border rounded-lg text-sm text-mac-text-primary placeholder-mac-text-muted focus:outline-none focus:ring-2 focus:ring-mac-accent-purple-400/50 focus:border-mac-accent-purple-400/50 transition-all duration-200"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-mac-text-muted hover:text-mac-text-primary transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Conversations List with Groups */}
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-8">
          {conversationGroups.length === 0 ? (
            <div className="p-6 text-center">
              <MessageCircle className="w-8 h-8 text-mac-text-muted mx-auto mb-4" />
              <p className="text-sm text-mac-text-muted mb-2">
                {searchQuery ? "No conversations found" : "No conversations yet"}
              </p>
              <p className="text-xs text-mac-text-muted">
                {searchQuery
                  ? "Try a different search term"
                  : "Start a new conversation to get started"}
              </p>
            </div>
          ) : (
            conversationGroups.map((group) => (
              <div key={group.label} className="py-4">
                {/* Group Header */}
                <button
                  onClick={() => toggleGroup(group.label)}
                  className="flex items-center justify-between w-full px-4 py-2 text-sm font-normal text-mac-text-secondary hover:text-mac-text-primary hover:bg-mac-state-hover transition-all duration-200 group"
                >
                  <span>{group.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-mac-text-muted">
                      {group.conversations.length}
                    </span>
                    {expandedGroups.has(group.label) ? (
                      <ChevronDown className="w-4 h-4 transition-transform duration-200" />
                    ) : (
                      <ChevronRight className="w-4 h-4 transition-transform duration-200" />
                    )}
                  </div>
                </button>

                {/* Group Conversations */}
                <AnimatePresence>
                  {expandedGroups.has(group.label) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-8 pb-2">
                        {group.conversations.map((conversation) => (
                          <div key={conversation.id} className="relative group/conversation">
                            <button
                              onClick={() => onConversationSelect?.(conversation.id)}
                              onContextMenu={(e) => handleContextMenu(e, conversation.id)}
                              className={cn(
                                "w-full text-left px-4 py-6 mx-4 rounded-lg transition-all duration-200 relative",
                                "hover:bg-mac-state-hover group-hover/conversation:bg-mac-state-hover",
                                conversation.isActive &&
                                  "bg-mac-primary-blue-400/10 border-l-2 border-mac-primary-blue-400 shadow-sm pl-6",
                                !conversation.isActive && "hover:bg-mac-surface-bg"
                              )}
                            >
                              <div className="flex items-start gap-4">
                                <div className="mt-2 flex-shrink-0">
                                  <MessageCircle
                                    className={cn(
                                      "w-4 h-4",
                                      conversation.isActive
                                        ? "text-mac-primary-blue-400"
                                        : "text-mac-text-muted"
                                    )}
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-2">
                                    <h4 className="mac-title text-sm font-normal text-mac-text-primary truncate flex-1">
                                      {conversation.title}
                                    </h4>
                                    {conversation.isPinned && (
                                      <Star className="w-3 h-3 text-mac-accent-purple-400 fill-current flex-shrink-0" />
                                    )}
                                  </div>
                                  <p className="text-xs text-mac-text-muted truncate mb-2">
                                    {conversation.lastMessage}
                                  </p>
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <Clock className="w-3 h-3 text-mac-text-muted" />
                                      <span className="text-xs text-mac-text-muted">
                                        {formatTimestamp(conversation.timestamp)}
                                      </span>
                                    </div>
                                    {conversation.messageCount && (
                                      <span className="text-xs text-mac-text-muted bg-mac-surface-bg px-2.5 py-0.5 rounded">
                                        {conversation.messageCount}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </button>

                            {/* Context Menu Button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleContextMenu(e, conversation.id);
                              }}
                              className="absolute right-4 top-3 opacity-0 group-hover/conversation:opacity-100 transition-opacity duration-200 p-2 hover:bg-mac-state-hover rounded"
                            >
                              <MoreVertical className="w-3 h-3 text-mac-text-muted" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Context Menu */}
      <AnimatePresence>
        {contextMenu && (
          <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-40" onClick={() => setContextMenu(null)} />

            {/* Menu */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.1 }}
              className="fixed z-50 bg-mac-surface-elevated border border-mac-border rounded-lg shadow-xl py-2 min-w-[180px]"
              style={{
                left: contextMenu.x,
                top: contextMenu.y,
                transform: "translate(-50%, -10px)",
              }}
            >
              <button
                onClick={() => handleContextAction("rename")}
                className="w-full flex items-center gap-4 px-4 py-2 text-sm text-mac-text-primary hover:bg-mac-state-hover transition-colors"
              >
                <Edit className="w-4 h-4" />
                Rename
              </button>
              <button
                onClick={() => handleContextAction("pin")}
                className="w-full flex items-center gap-4 px-4 py-2 text-sm text-mac-text-primary hover:bg-mac-state-hover transition-colors"
              >
                <Pin className="w-4 h-4" />
                Pin conversation
              </button>
              <button
                onClick={() => handleContextAction("archive")}
                className="w-full flex items-center gap-4 px-4 py-2 text-sm text-mac-text-primary hover:bg-mac-state-hover transition-colors"
              >
                <Archive className="w-4 h-4" />
                Archive
              </button>
              <div className="border-t border-mac-border my-2" />
              <button
                onClick={() => handleContextAction("delete")}
                className="w-full flex items-center gap-4 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Footer */}
      <div className="p-4 border-t border-mac-border">
        <div className="text-xs text-mac-text-muted text-center">
          {sampleConversations.length} conversations
          {searchQuery &&
            ` • ${conversationGroups.reduce((acc, group) => acc + group.conversations.length, 0)} results`}
        </div>
      </div>
    </div>
  );
};
