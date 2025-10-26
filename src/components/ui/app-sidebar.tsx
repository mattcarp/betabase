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
import { Suggestion } from "../ai-elements/suggestion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu";

interface AppSidebarProps {
  cclassName?: string;
}

export function AppSidebar({ cclassName }: AppSidebarProps) {
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

    // Handle null/undefined dates
    if (!date) return "Just now";

    const dateObj = date instanceof Date ? date : new Date(date);

    // Check for invalid dates
    if (isNaN(dateObj.getTime())) return "Just now";

    const diff = now.getTime() - dateObj.getTime();
    const hours = Math.floor(diff / 3600000);

    if (hours < 1) return "Just now";
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
    <Sidebar variant="sidebar" cclassName={cn("mac-sidebar mac-glass", cclassName)}>
      <SidebarHeader cclassName="mac-surface-elevated border-b border-mac-border">
        <div cclassName="flex items-center justify-between px-2 py-2">
          <div cclassName="flex items-center gap-2">
            <Sparkles cclassName="h-4 w-4 text-mac-accent-purple-400" />
            <span cclassName="text-sm font-light text-mac-text-primary">Conversations</span>
          </div>
          <Button
            onClick={handleNewConversation}
            size="icon"
            variant="ghost"
            cclassName="mac-button-ghost h-7 w-7 hover:bg-mac-state-hover"
          >
            <Plus cclassName="h-4 w-4" />
          </Button>
        </div>

        {/* Search Bar with MAC styling */}
        <div cclassName="px-2 pb-2">
          <div cclassName="relative">
            <Search cclassName="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-mac-text-secondary" />
            <SidebarInput
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              cclassName="mac-input mac-sidebar-search pl-9 h-8 text-sm bg-mac-surface-elevated border border-mac-border/30 text-mac-text-primary placeholder:text-mac-text-muted"
            />
          </div>
        </div>

        {/* AI Suggestions */}
        {!searchQuery && conversations.length > 3 && (
          <div cclassName="px-2 pb-2 flex gap-2">
            <Suggestion label="Recent" onClick={() => setSearchQuery("")} cclassName="text-xs" />
            <Suggestion
              label="Pinned"
              onClick={() => setSearchQuery("pinned")}
              cclassName="text-xs"
            />
            <Suggestion
              label="Today"
              onClick={() => {
                const today = new Date().toDateString();
                setFilteredConversations(
                  conversations.filter((c) => new Date(c.updatedAt).toDateString() === today)
                );
              }}
              cclassName="text-xs"
            />
          </div>
        )}
      </SidebarHeader>

      <SidebarContent cclassName="mac-sidebar-scrollbar">
        {isLoading ? (
          <div cclassName="p-2 space-y-2">
            <SidebarMenuSkeleton />
            <SidebarMenuSkeleton />
            <SidebarMenuSkeleton />
          </div>
        ) : sortedConversations.length === 0 ? (
          <div cclassName="p-4 text-center">
            <MessageCircle cclassName="h-8 w-8 mx-auto mb-2 text-mac-text-muted/50" />
            <p cclassName="text-sm text-mac-text-muted">No conversations yet</p>
            <Button
              onClick={handleNewConversation}
              size="sm"
              cclassName="mac-button mac-button-primary mt-4"
            >
              <Plus cclassName="h-3 w-3 mr-2" />
              Start a conversation
            </Button>
          </div>
        ) : (
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu cclassName="space-y-6">
                {sortedConversations.map((conversation) => (
                  <SidebarMenuItem key={conversation.id}>
                    <SidebarMenuButton
                      onClick={() => setActiveConversation(conversation.id)}
                      isActive={activeConversationId === conversation.id}
                      cclassName={cn(
                        "group relative mac-conversation-item",
                        activeConversationId === conversation.id && "active"
                      )}
                    >
                      <div cclassName="flex items-start gap-4 w-full">
                        <MessageCircle
                          cclassName={cn(
                            "h-4 w-4 mt-0.5 shrink-0",
                            activeConversationId === conversation.id
                              ? "text-mac-primary-blue-400"
                              : "text-mac-text-muted"
                          )}
                        />
                        <div cclassName="flex-1 min-w-0">
                          <div cclassName="flex items-center gap-2.5 mb-0.5">
                            {conversation.isPinned && (
                              <Pin cclassName="h-3 w-3 text-mac-accent-purple-400 shrink-0 mac-pin-indicator" />
                            )}
                            <span cclassName="text-sm font-light text-mac-text-primary truncate">
                              {conversation.title}
                            </span>
                          </div>
                          {conversation.messages.length > 0 && (
                            <p cclassName="text-xs text-mac-text-secondary truncate">
                              {conversation.messages[
                                conversation.messages.length - 1
                              ].content.slice(0, 50)}
                              ...
                            </p>
                          )}
                          <div cclassName="flex items-center gap-2 mt-2">
                            <Clock cclassName="h-3 w-3 text-mac-text-secondary" />
                            <span cclassName="text-xs text-mac-text-secondary">
                              {formatTimestamp(new Date(conversation.updatedAt))}
                            </span>
                            {conversation.tags && conversation.tags.length > 0 && (
                              <>
                                <Hash cclassName="h-3 w-3 text-mac-text-secondary" />
                                <span cclassName="text-xs text-mac-text-secondary">
                                  {conversation.tags.length}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </SidebarMenuButton>

                    {/* Conversation Actions */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <SidebarMenuAction
                          showOnHover
                          cclassName="opacity-0 group-hover:opacity-100"
                        >
                          <ChevronDown cclassName="h-4 w-4" />
                        </SidebarMenuAction>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" cclassName="mac-glass mac-dropdown w-48">
                        <DropdownMenuItem
                          onClick={() => pinConversation(conversation.id, !conversation.isPinned)}
                          cclassName="mac-dropdown-item"
                        >
                          <Pin cclassName="h-4 w-4 mr-2" />
                          {conversation.isPinned ? "Unpin" : "Pin"}
                        </DropdownMenuItem>
                        <DropdownMenuItem cclassName="mac-dropdown-item">
                          <Archive cclassName="h-4 w-4 mr-2" />
                          Archive
                        </DropdownMenuItem>
                        <DropdownMenuItem cclassName="mac-dropdown-item">
                          <Download cclassName="h-4 w-4 mr-2" />
                          Export
                        </DropdownMenuItem>
                        <DropdownMenuSeparator cclassName="bg-mac-border" />
                        <DropdownMenuItem
                          onClick={() => deleteConversation(conversation.id)}
                          cclassName="mac-dropdown-item text-red-400 hover:text-red-300"
                        >
                          <Trash2 cclassName="h-4 w-4 mr-2" />
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
            <SidebarGroupLabel cclassName="text-mac-text-muted">Quick Actions</SidebarGroupLabel>
            <SidebarGroupContent cclassName="px-2">
              <Actions
                actions={[
                  {
                    label: "Export All",
                    onClick: handleExportConversations,
                    icon: <Download cclassName="h-3 w-3" />,
                  },
                  {
                    label: "Import",
                    onClick: handleImportConversations,
                    icon: <Upload cclassName="h-3 w-3" />,
                  },
                  {
                    label: "Clear All",
                    onClick: () => {
                      if (confirm("Are you sure you want to clear all conversations?")) {
                        clearAllConversations();
                      }
                    },
                    icon: <Trash2 cclassName="h-3 w-3" />,
                    variant: "destructive",
                  },
                ]}
              />
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter cclassName="mac-surface-elevated border-t border-mac-border">
        <div cclassName="px-4 py-2">
          <div cclassName="flex items-center justify-between">
            <div cclassName="text-xs text-mac-text-muted">
              {conversations.length} conversation{conversations.length !== 1 ? "s" : ""}
            </div>
            {conversations.filter((c) => c.isPinned).length > 0 && (
              <Badge variant="outline" cclassName="mac-badge text-xs px-2.5 py-0">
                <Pin cclassName="h-3 w-3 mr-2" />
                {conversations.filter((c) => c.isPinned).length}
              </Badge>
            )}
          </div>

          {/* Storage indicator */}
          <div cclassName="mt-2">
            <div cclassName="text-xs text-mac-text-muted mb-2">Local Storage</div>
            <div cclassName="h-1 bg-mac-surface-bg rounded-full overflow-hidden mac-storage-bar">
              <div
                cclassName="h-full bg-gradient-to-r from-mac-primary-blue-400 to-mac-accent-purple-400"
                style={{ width: `${Math.min((conversations.length / 100) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </SidebarFooter>

      <SidebarRail cclassName="mac-sidebar-rail" />
    </Sidebar>
  );
}
