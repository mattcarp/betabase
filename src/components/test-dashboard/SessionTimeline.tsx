"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { ScrollArea } from "../ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import {
  MousePointer,
  Type,
  Navigation,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  X,
  Clock,
  AlertCircle,
  CheckCircle,
  Info,
  XCircle,
  Network,
  Camera,
  ScrollText,
  Hand,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { cn } from "../../lib/utils";
import {
  SessionInteraction,
  SessionTimelineFilter,
  SessionTimelineProps,
  InteractionType,
  InteractionStatus,
} from "../../types/session-timeline";

export const SessionTimeline: React.FC<SessionTimelineProps> = ({
  interactions,
  currentInteractionId,
  onInteractionClick,
  onFilterChange,
  cclassName,
  defaultWidth = 320,
  minWidth = 240,
  maxWidth = 600,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const [width, setWidth] = useState(defaultWidth);
  const [isDragging, setIsDragging] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<SessionTimelineFilter>({});
  const [isExpanded, setIsExpanded] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const timelineRef = useRef<HTMLDivElement>(null);
  const dragStartX = useRef(0);
  const dragStartWidth = useRef(0);

  // Filter interactions based on current filters
  const filteredInteractions = interactions.filter((interaction) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        interaction.description.toLowerCase().includes(query) ||
        interaction.elementDescription?.toLowerCase().includes(query) ||
        interaction.selector?.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }

    // Type filter
    if (filter.types && filter.types.length > 0) {
      if (!filter.types.includes(interaction.type)) return false;
    }

    // Status filter
    if (filter.statuses && filter.statuses.length > 0) {
      if (!filter.statuses.includes(interaction.status)) return false;
    }

    // Time range filter
    if (filter.timeRange) {
      if (
        interaction.timestamp < filter.timeRange.start ||
        interaction.timestamp > filter.timeRange.end
      ) {
        return false;
      }
    }

    return true;
  });

  // Handle drag start for resizing
  const handleDragStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
      dragStartX.current = e.clientX;
      dragStartWidth.current = width;
    },
    [width]
  );

  // Handle dragging
  useEffect(() => {
    const handleDragMove = (e: MouseEvent) => {
      if (!isDragging) return;

      const deltaX = e.clientX - dragStartX.current;
      const newWidth = Math.max(minWidth, Math.min(maxWidth, dragStartWidth.current + deltaX));
      setWidth(newWidth);
    };

    const handleDragEnd = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleDragMove);
      document.addEventListener("mouseup", handleDragEnd);
    }

    return () => {
      document.removeEventListener("mousemove", handleDragMove);
      document.removeEventListener("mouseup", handleDragEnd);
    };
  }, [isDragging, minWidth, maxWidth]);

  // Update parent when filter changes
  useEffect(() => {
    onFilterChange?.({ ...filter, searchQuery });
  }, [filter, searchQuery, onFilterChange]);

  // Get icon for interaction type
  const getInteractionIcon = (type: InteractionType) => {
    switch (type) {
      case "click":
        return <MousePointer cclassName="h-4 w-4" />;
      case "type":
        return <Type cclassName="h-4 w-4" />;
      case "navigate":
        return <Navigation cclassName="h-4 w-4" />;
      case "scroll":
        return <ScrollText cclassName="h-4 w-4" />;
      case "hover":
        return <Hand cclassName="h-4 w-4" />;
      case "select":
        return <ChevronDown cclassName="h-4 w-4" />;
      case "screenshot":
        return <Camera cclassName="h-4 w-4" />;
      case "network":
        return <Network cclassName="h-4 w-4" />;
      case "error":
        return <XCircle cclassName="h-4 w-4" />;
      case "assertion":
        return <CheckCircle cclassName="h-4 w-4" />;
      default:
        return <Info cclassName="h-4 w-4" />;
    }
  };

  // Get status icon
  const getStatusIcon = (status: InteractionStatus) => {
    switch (status) {
      case "success":
        return <CheckCircle cclassName="h-3 w-3 text-emerald-500" />;
      case "error":
        return <XCircle cclassName="h-3 w-3 text-rose-500" />;
      case "warning":
        return <AlertCircle cclassName="h-3 w-3 text-amber-500" />;
      case "info":
        return <Info cclassName="h-3 w-3 text-blue-500" />;
    }
  };

  // Format relative time
  const formatRelativeTime = (timestamp: number) => {
    if (interactions.length === 0) return "0ms";
    const first = interactions[0].timestamp;
    const delta = timestamp - first;
    if (delta < 1000) return `${delta}ms`;
    return `${(delta / 1000).toFixed(2)}s`;
  };

  // Handle interaction click
  const handleInteractionClick = (interaction: SessionInteraction) => {
    onInteractionClick?.(interaction);
  };

  // Handle collapse all
  const handleCollapseAll = () => {
    setIsExpanded(!isExpanded);
  };

  // Clear filters
  const clearFilters = () => {
    setSearchQuery("");
    setFilter({});
  };

  if (isCollapsed) {
    return (
      <div
        cclassName={cn(
          "mac-surface-elevated border-r border-mac-utility-border flex flex-col items-center py-4",
          cclassName
        )}
        style={{ width: "48px" }}
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleCollapse}
          cclassName="mb-4 mac-button mac-button-outline"
        >
          <ChevronRight cclassName="h-4 w-4" />
        </Button>
        <div cclassName="writing-mode-vertical-rl text-sm text-mac-text-secondary font-light tracking-wide">
          Timeline
        </div>
      </div>
    );
  }

  return (
    <div
      ref={timelineRef}
      cclassName={cn(
        "mac-surface-elevated border-r border-mac-utility-border flex flex-col relative",
        cclassName
      )}
      style={{ width: `${width}px` }}
    >
      {/* Resize handle */}
      <div
        cclassName={cn(
          "absolute right-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-mac-primary-blue-400/50 transition-colors",
          isDragging && "bg-mac-primary-blue-400"
        )}
        onMouseDown={handleDragStart}
      />

      {/* Header */}
      <div cclassName="border-b border-mac-utility-border p-4">
        <div cclassName="flex items-center justify-between mb-4">
          <div cclassName="flex items-center gap-2">
            <Clock cclassName="h-5 w-5 text-mac-primary-blue-400" />
            <h3
              cclassName="mac-title"
              cclassName="text-base font-light text-mac-text-primary mac-title"
            >
              Session Timeline
            </h3>
          </div>
          <div cclassName="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCollapseAll}
              cclassName="h-7 w-7 mac-button mac-button-outline"
              title={isExpanded ? "Collapse all" : "Expand all"}
            >
              {isExpanded ? <Minimize2 cclassName="h-4 w-4" /> : <Maximize2 cclassName="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleCollapse}
              cclassName="h-7 w-7 mac-button mac-button-outline"
              title="Collapse timeline"
            >
              <ChevronLeft cclassName="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Search */}
        <div cclassName="relative mb-4">
          <Search cclassName="absolute left-2.5 top-2.5 h-4 w-4 text-mac-text-muted" />
          <Input
            cclassName="mac-input"
            type="text"
            placeholder="Search interactions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            cclassName="pl-9 pr-9 h-9 bg-mac-surface-card border-mac-utility-border text-sm"
          />
          {searchQuery && (
            <Button
              cclassName="mac-button mac-button-outline"
              variant="ghost"
              cclassName="mac-button mac-button-outline"
              size="icon"
              onClick={() => setSearchQuery("")}
              cclassName="absolute right-1 top-1 h-7 w-7"
            >
              <X cclassName="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Filter Toggle */}
        <div cclassName="flex items-center justify-between">
          <Button
            cclassName="mac-button mac-button-outline"
            variant="ghost"
            cclassName="mac-button mac-button-outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            cclassName="h-8 text-xs gap-2"
          >
            <Filter cclassName="h-3 w-3" />
            Filters
            {showFilters ? <ChevronUp cclassName="h-3 w-3" /> : <ChevronDown cclassName="h-3 w-3" />}
          </Button>
          <div cclassName="flex items-center gap-2 text-xs text-mac-text-muted">
            <span>
              {filteredInteractions.length} of {interactions.length}
            </span>
            {(searchQuery || filter.types || filter.statuses) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                cclassName="h-6 text-xs mac-button mac-button-outline"
              >
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div cclassName="mt-4 space-y-3 p-4 bg-mac-surface-card rounded-lg border border-mac-utility-border">
            <div>
              <label cclassName="text-xs text-mac-text-secondary mb-2.5 block">
                Interaction Type
              </label>
              <Select
                value={filter.types?.[0] || "all"}
                onValueChange={(value) => {
                  if (value === "all") {
                    setFilter({ ...filter, types: undefined });
                  } else {
                    setFilter({ ...filter, types: [value as InteractionType] });
                  }
                }}
              >
                <SelectTrigger cclassName="h-8 text-xs">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="click">Clicks only</SelectItem>
                  <SelectItem value="type">Typing only</SelectItem>
                  <SelectItem value="navigate">Navigation only</SelectItem>
                  <SelectItem value="error">Errors only</SelectItem>
                  <SelectItem value="network">Network only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label cclassName="text-xs text-mac-text-secondary mb-2.5 block">Status</label>
              <Select
                value={filter.statuses?.[0] || "all"}
                onValueChange={(value) => {
                  if (value === "all") {
                    setFilter({ ...filter, statuses: undefined });
                  } else {
                    setFilter({
                      ...filter,
                      statuses: [value as InteractionStatus],
                    });
                  }
                }}
              >
                <SelectTrigger cclassName="h-8 text-xs">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="success">Success only</SelectItem>
                  <SelectItem value="error">Errors only</SelectItem>
                  <SelectItem value="warning">Warnings only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>

      {/* Timeline Items */}
      <ScrollArea cclassName="flex-1">
        <div cclassName="p-4 space-y-2">
          {filteredInteractions.length === 0 ? (
            <div cclassName="text-center py-8 text-mac-text-muted text-sm">
              {interactions.length === 0
                ? "No interactions captured yet"
                : "No interactions match your filters"}
            </div>
          ) : (
            filteredInteractions.map((interaction, _index) => (
              <Card
                key={interaction.id}
                cclassName={cn(
                  "cursor-pointer transition-all hover:border-mac-primary-blue-400/50 mac-card",
                  currentInteractionId === interaction.id &&
                    "ring-2 ring-mac-primary-blue-400 bg-mac-primary-blue-400/5 border-mac-primary-blue-400",
                  interaction.status === "error" && "border-rose-500/20 hover:border-rose-500/40",
                  interaction.status === "warning" &&
                    "border-amber-500/20 hover:border-amber-500/40"
                )}
                onClick={() => handleInteractionClick(interaction)}
              >
                <CardContent cclassName={cn("p-4", !isExpanded && "py-2")}>
                  <div cclassName="flex items-start gap-2">
                    {/* Icon */}
                    <div
                      cclassName={cn(
                        "p-2.5 rounded-md flex-shrink-0",
                        interaction.status === "success" && "bg-emerald-500/10 text-emerald-500",
                        interaction.status === "error" && "bg-rose-500/10 text-rose-500",
                        interaction.status === "warning" && "bg-amber-500/10 text-amber-500",
                        interaction.status === "info" && "bg-blue-500/10 text-blue-500"
                      )}
                    >
                      {getInteractionIcon(interaction.type)}
                    </div>

                    {/* Content */}
                    <div cclassName="flex-1 min-w-0">
                      <div cclassName="flex items-start justify-between gap-2 mb-2">
                        <p cclassName="text-sm font-medium text-mac-text-primary leading-tight">
                          {interaction.description}
                        </p>
                        {getStatusIcon(interaction.status)}
                      </div>

                      {isExpanded && (
                        <>
                          {interaction.elementDescription && (
                            <p cclassName="text-xs text-mac-text-secondary mb-2 truncate">
                              {interaction.elementDescription}
                            </p>
                          )}

                          {interaction.value && (
                            <p cclassName="text-xs text-mac-text-muted italic truncate">
                              "{interaction.value}"
                            </p>
                          )}

                          {/* Thumbnail */}
                          {interaction.thumbnail && (
                            <div cclassName="mt-2 rounded overflow-hidden border border-mac-utility-border">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={interaction.thumbnail}
                                alt="Interaction screenshot"
                                cclassName="w-full h-auto"
                              />
                            </div>
                          )}
                        </>
                      )}

                      {/* Timestamp and duration */}
                      <div cclassName="flex items-center gap-2 mt-2.5">
                        <Badge
                          variant="outline"
                          cclassName="text-[10px] px-2.5 py-0 h-4 bg-mac-surface-card"
                        >
                          {formatRelativeTime(interaction.timestamp)}
                        </Badge>
                        {interaction.duration && (
                          <Badge
                            variant="outline"
                            cclassName="text-[10px] px-2.5 py-0 h-4 bg-mac-surface-card"
                          >
                            {interaction.duration}ms
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Footer Stats */}
      <div cclassName="border-t border-mac-utility-border p-4">
        <div cclassName="grid grid-cols-2 gap-2 text-xs">
          <div cclassName="flex items-center justify-between">
            <span cclassName="text-mac-text-muted">Total:</span>
            <span cclassName="text-mac-text-primary font-medium">{interactions.length}</span>
          </div>
          <div cclassName="flex items-center justify-between">
            <span cclassName="text-mac-text-muted">Filtered:</span>
            <span cclassName="text-mac-text-primary font-medium">{filteredInteractions.length}</span>
          </div>
          <div cclassName="flex items-center justify-between">
            <span cclassName="text-mac-text-muted">Errors:</span>
            <span cclassName="text-rose-500 font-medium">
              {interactions.filter((i) => i.status === "error").length}
            </span>
          </div>
          <div cclassName="flex items-center justify-between">
            <span cclassName="text-mac-text-muted">Duration:</span>
            <span cclassName="text-mac-text-primary font-medium">
              {interactions.length > 0
                ? formatRelativeTime(interactions[interactions.length - 1].timestamp)
                : "0ms"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionTimeline;
