"use client";

import React, { useState, useEffect } from "react";
import "../../styles/sidebar-mac.css";
import { cn } from "../../lib/utils";
import { useConversationStore } from "../../lib/conversation-store";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarRail,
  SidebarSeparator,
} from "./sidebar";
import {
  MessageCircle,
  Plus,
  Search,
  Clock,
  Star,
  Pin,
  Trash2,
  Hash,
  Sparkles,
  Archive,
  Download,
  Upload,
  Settings,
  ChevronDown,
} from "lucide-react";
import { Badge } from "./badge";
import { Button } from "./button";
import { Actions } from "../ai-elements/actions";
import { InlineCitation } from "../ai-elements/inline-citation";
import { Source } from "../ai-elements/source";
import { ThemeSwitcher } from "./theme-switcher";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu";

interface AppSidebarProps {
  className?: string;
}

export function AppSidebar({ className }: AppSidebarProps) {
  const {
    conversations,
    activeConversationId,
    createConversation,
    deleteConversation,
    setActiveConversation,
    pinConversation,
    searchConversations,
    clearAllConversations,
    removeDuplicateConversations,
  } = useConversationStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [filteredConversations, setFilteredConversations] = useState(conversations);
  const [isLoading, setIsLoading] = useState(false);

  // Filter conversations based on search
  useEffect(() => {
    if (searchQuery) {
      const filtered = searchConversations(searchQuery);
      setFilteredConversations(filtered);
    } else {
      setFilteredConversations(conversations);
    }
  }, [searchQuery, conversations, searchConversations]);

  // Sort conversations: pinned first, then by updated date
  const sortedConversations = [...filteredConversations].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;

    // Ensure dates are valid and convert to Date objects if needed
    const getValidDate = (date: any): Date => {
      if (date instanceof Date) return date;
      if (typeof date === "string" || typeof date === "number") return new Date(date);
      return new Date(); // Fallback to current date if invalid
    };

    const dateA = getValidDate(a.updatedAt);
    const dateB = getValidDate(b.updatedAt);
    return dateB.getTime() - dateA.getTime();
  });

  const formatTimestamp = (date: Date | string | undefined | null) => {
    const now = new Date();

    // Handle null/undefined dates - show "Unknown" for truly missing dates
    // This helps identify data issues rather than masking them as "Just now"
    if (!date) return "Unknown";

    const dateObj = date instanceof Date ? date : new Date(date);

    // Check for invalid dates
    if (isNaN(dateObj.getTime())) return "Unknown";

    const diff = now.getTime() - dateObj.getTime();
    
    // Handle negative diff (future dates) - shouldn't happen but be defensive
    if (diff < 0) return "Just now";
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    // More granular "just now" - only for < 5 minutes
    if (minutes < 5) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days}d ago`;
    return dateObj.toLocaleDateString();
  };

  const handleNewConversation = () => {
    const newConvo = createConversation();
    setActiveConversation(newConvo.id);
  };

  const handleExportConversations = () => {
    const dataStr = JSON.stringify(conversations, null, 2);
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
    const exportFileDefaultName = `siam-conversations-${new Date().toISOString().split("T")[0]}.json`;

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
  };

  const handleImportConversations = () => {
    // TODO: Implement import functionality
    console.log("Import conversations");
  };

  return (
    <Sidebar variant="sidebar" className={cn("mac-sidebar mac-glass", className)}>
      <SidebarHeader className="mac-surface-elevated border-b border-mac-border">
        <div className="flex items-center justify-between px-2 py-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-mac-accent-purple-400" />
            <span className="text-sm font-light text-mac-text-primary">Conversations</span>
          </div>
          <Button
            onClick={handleNewConversation}
            size="icon"
            variant="ghost"
            className="mac-button-ghost h-7 w-7 hover:bg-mac-state-hover"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Search Bar with MAC styling */}
        <div className="px-2 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-[52%] h-4 w-4 -translate-y-1/2 text-mac-text-secondary" />
            <SidebarInput
              placeholder=""
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="mac-input mac-sidebar-search pl-9 h-8 text-sm bg-mac-surface-elevated border border-mac-border/30 text-mac-text-primary"
            />
          </div>
        </div>

        {/* Quick Filters - compact icon buttons */}
        {!searchQuery && conversations.length > 3 && (
          <div className="px-2 pb-2 flex gap-1">
            <button
              onClick={() => setSearchQuery("pinned")}
              title="Show pinned"
              className="p-1.5 text-xs rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/50 transition-colors"
            >
              <Pin className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => {
                const today = new Date().toDateString();
                setFilteredConversations(
                  conversations.filter((c) => new Date(c.updatedAt).toDateString() === today)
                );
              }}
              title="Today only"
              className="p-1.5 text-xs rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/50 transition-colors"
            >
              <Clock className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className="mac-sidebar-scrollbar">
        {isLoading ? (
          <div className="p-2 space-y-2">
            <SidebarMenuSkeleton />
            <SidebarMenuSkeleton />
            <SidebarMenuSkeleton />
          </div>
        ) : sortedConversations.length === 0 ? (
          <div className="p-4 text-center">
            <MessageCircle className="h-8 w-8 mx-auto mb-2 text-mac-text-muted/50" />
            <p className="text-sm text-mac-text-muted">No conversations yet</p>
            <Button
              onClick={handleNewConversation}
              size="sm"
              className="mac-button mac-button-primary mt-4"
            >
              <Plus className="h-3 w-3 mr-2" />
              Start a conversation
            </Button>
          </div>
        ) : (
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {sortedConversations.map((conversation) => (
                  <SidebarMenuItem key={conversation.id}>
                    <SidebarMenuButton
                      onClick={() => setActiveConversation(conversation.id)}
                      isActive={activeConversationId === conversation.id}
                      size="conversation"
                      className={cn(
                        "group relative mac-conversation-item",
                        activeConversationId === conversation.id && "active"
                      )}
                    >
                      <div className="flex items-start gap-3 w-full">
                        <MessageCircle
                          className={cn(
                            "h-4 w-4 mt-0.5 shrink-0",
                            activeConversationId === conversation.id
                              ? "text-mac-primary-blue-400"
                              : "text-mac-text-muted"
                          )}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2.5 mb-0.5">
                            {conversation.isPinned && (
                              <Pin className="h-3 w-3 text-mac-accent-purple-400 shrink-0 mac-pin-indicator" />
                            )}
                            <span className="text-sm font-light text-mac-text-primary truncate">
                              {conversation.title}
                            </span>
                          </div>
                          {conversation.messages.length > 0 && (
                            <p className="text-xs text-mac-text-secondary truncate">
                              {(
                                conversation.messages[conversation.messages.length - 1]?.content ||
                                ""
                              ).slice(0, 50)}
                              ...
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <Clock className="h-3 w-3 text-mac-text-secondary" />
                            <span className="text-xs text-mac-text-secondary">
                              {formatTimestamp(new Date(conversation.updatedAt))}
                            </span>
                            {conversation.tags && conversation.tags.length > 0 && (
                              <>
                                <Hash className="h-3 w-3 text-mac-text-secondary" />
                                <span className="text-xs text-mac-text-secondary">
                                  {conversation.tags.length}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </SidebarMenuButton>

                    {/* Quick Delete Button - Always visible on hover */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete "${conversation.title}"?`)) {
                          deleteConversation(conversation.id);
                        }
                      }}
                      className="absolute right-8 bottom-2.5 opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-red-500/20 text-zinc-500 hover:text-red-400 transition-all duration-150"
                      title="Delete conversation"
                      data-test-id="delete-conversation-btn"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>

                    {/* Conversation Actions Dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <SidebarMenuAction
                          showOnHover
                          className="opacity-0 group-hover:opacity-100"
                        >
                          <ChevronDown className="h-4 w-4" />
                        </SidebarMenuAction>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="mac-glass mac-dropdown w-48">
                        <DropdownMenuItem
                          onClick={() => pinConversation(conversation.id, !conversation.isPinned)}
                          className="mac-dropdown-item"
                        >
                          <Pin className="h-4 w-4 mr-2" />
                          {conversation.isPinned ? "Unpin" : "Pin"}
                        </DropdownMenuItem>
                        <DropdownMenuItem className="mac-dropdown-item">
                          <Archive className="h-4 w-4 mr-2" />
                          Archive
                        </DropdownMenuItem>
                        <DropdownMenuItem className="mac-dropdown-item">
                          <Download className="h-4 w-4 mr-2" />
                          Export
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-mac-border" />
                        <DropdownMenuItem
                          onClick={() => {
                            if (confirm(`Delete "${conversation.title}"?`)) {
                              deleteConversation(conversation.id);
                            }
                          }}
                          className="mac-dropdown-item text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* AI-Powered Actions Section */}
        {conversations.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-mac-text-muted pl-0">
              Quick Actions
            </SidebarGroupLabel>
            <SidebarGroupContent className="px-0">
              <Actions
                actions={[
                  {
                    label: "Export All",
                    onClick: handleExportConversations,
                    icon: <Download className="h-3 w-3" />,
                  },
                  {
                    label: "Import",
                    onClick: handleImportConversations,
                    icon: <Upload className="h-3 w-3" />,
                  },
                  {
                    label: "Clear All",
                    onClick: () => {
                      if (confirm("Are you sure you want to clear all conversations?")) {
                        clearAllConversations();
                      }
                    },
                    icon: <Trash2 className="h-3 w-3" />,
                    variant: "destructive",
                  },
                ]}
              />
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="mac-surface-elevated border-t border-mac-border">
        <div className="px-3 py-2 space-y-2">
          {/* Theme Switcher */}
          <div className="pb-2 border-b border-mac-border">
            <ThemeSwitcher />
          </div>

          <div className="flex items-center justify-between">
            <div className="text-xs text-mac-text-muted">
              {conversations.length} conversation{conversations.length !== 1 ? "s" : ""}
            </div>
            {conversations.filter((c) => c.isPinned).length > 0 && (
              <Badge variant="outline" className="mac-badge text-xs px-2.5 py-0">
                <Pin className="h-3 w-3 mr-2" />
                {conversations.filter((c) => c.isPinned).length}
              </Badge>
            )}
          </div>

          {/* Storage indicator */}
          <div className="mt-2">
            <div className="text-xs text-mac-text-muted mb-2">Local Storage</div>
            <div className="h-1 bg-mac-surface-bg rounded-full overflow-hidden mac-storage-bar">
              <div
                className="h-full bg-gradient-to-r from-mac-primary-blue-400 to-mac-accent-purple-400"
                style={{ width: `${Math.min((conversations.length / 100) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </SidebarFooter>

      <SidebarRail className="mac-sidebar-rail" />
    </Sidebar>
  );
}
