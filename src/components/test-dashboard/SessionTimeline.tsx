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
  className,
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
        return <MousePointer className="h-4 w-4" />;
      case "type":
        return <Type className="h-4 w-4" />;
      case "navigate":
        return <Navigation className="h-4 w-4" />;
      case "scroll":
        return <ScrollText className="h-4 w-4" />;
      case "hover":
        return <Hand className="h-4 w-4" />;
      case "select":
        return <ChevronDown className="h-4 w-4" />;
      case "screenshot":
        return <Camera className="h-4 w-4" />;
      case "network":
        return <Network className="h-4 w-4" />;
      case "error":
        return <XCircle className="h-4 w-4" />;
      case "assertion":
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  // Get status icon
  const getStatusIcon = (status: InteractionStatus) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-3 w-3 text-emerald-500" />;
      case "error":
        return <XCircle className="h-3 w-3 text-rose-500" />;
      case "warning":
        return <AlertCircle className="h-3 w-3 text-amber-500" />;
      case "info":
        return <Info className="h-3 w-3 text-blue-500" />;
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
        className={cn(
          "mac-surface-elevated border-r border-mac-utility-border flex flex-col items-center py-4",
          className
        )}
        style={{ width: "48px" }}
      >
        <Button variant="ghost" size="icon" onClick={onToggleCollapse} className="mb-4">
          <ChevronRight className="h-4 w-4" />
        </Button>
        <div className="writing-mode-vertical-rl text-sm text-mac-text-secondary font-light tracking-wide">
          Timeline
        </div>
      </div>
    );
  }

  return (
    <div
      ref={timelineRef}
      className={cn(
        "mac-surface-elevated border-r border-mac-utility-border flex flex-col relative",
        className
      )}
      style={{ width: `${width}px` }}
    >
      {/* Resize handle */}
      <div
        className={cn(
          "absolute right-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-mac-primary-blue-400/50 transition-colors",
          isDragging && "bg-mac-primary-blue-400"
        )}
        onMouseDown={handleDragStart}
      />

      {/* Header */}
      <div className="border-b border-mac-utility-border p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-mac-primary-blue-400" />
            <h3 className="text-base font-light text-mac-text-primary mac-title">
              Session Timeline
            </h3>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCollapseAll}
              className="h-7 w-7"
              title={isExpanded ? "Collapse all" : "Expand all"}
            >
              {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleCollapse}
              className="h-7 w-7"
              title="Collapse timeline"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-mac-text-muted" />
          <Input
            type="text"
            placeholder="Search interactions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-9 h-9 bg-mac-surface-card border-mac-utility-border text-sm"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSearchQuery("")}
              className="absolute right-1 top-1 h-7 w-7"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Filter Toggle */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="h-8 text-xs gap-2"
          >
            <Filter className="h-3 w-3" />
            Filters
            {showFilters ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </Button>
          <div className="flex items-center gap-2 text-xs text-mac-text-muted">
            <span>
              {filteredInteractions.length} of {interactions.length}
            </span>
            {(searchQuery || filter.types || filter.statuses) && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-6 text-xs">
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="mt-3 space-y-3 p-3 bg-mac-surface-card rounded-lg border border-mac-utility-border">
            <div>
              <label className="text-xs text-mac-text-secondary mb-1.5 block">
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
                <SelectTrigger className="h-8 text-xs">
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
              <label className="text-xs text-mac-text-secondary mb-1.5 block">Status</label>
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
                <SelectTrigger className="h-8 text-xs">
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
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {filteredInteractions.length === 0 ? (
            <div className="text-center py-8 text-mac-text-muted text-sm">
              {interactions.length === 0
                ? "No interactions captured yet"
                : "No interactions match your filters"}
            </div>
          ) : (
            filteredInteractions.map((interaction, _index) => (
              <Card
                key={interaction.id}
                className={cn(
                  "cursor-pointer transition-all hover:border-mac-primary-blue-400/50 mac-card",
                  currentInteractionId === interaction.id &&
                    "ring-2 ring-mac-primary-blue-400 bg-mac-primary-blue-400/5 border-mac-primary-blue-400",
                  interaction.status === "error" && "border-rose-500/20 hover:border-rose-500/40",
                  interaction.status === "warning" &&
                    "border-amber-500/20 hover:border-amber-500/40"
                )}
                onClick={() => handleInteractionClick(interaction)}
              >
                <CardContent className={cn("p-3", !isExpanded && "py-2")}>
                  <div className="flex items-start gap-2">
                    {/* Icon */}
                    <div
                      className={cn(
                        "p-1.5 rounded-md flex-shrink-0",
                        interaction.status === "success" && "bg-emerald-500/10 text-emerald-500",
                        interaction.status === "error" && "bg-rose-500/10 text-rose-500",
                        interaction.status === "warning" && "bg-amber-500/10 text-amber-500",
                        interaction.status === "info" && "bg-blue-500/10 text-blue-500"
                      )}
                    >
                      {getInteractionIcon(interaction.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="text-sm font-medium text-mac-text-primary leading-tight">
                          {interaction.description}
                        </p>
                        {getStatusIcon(interaction.status)}
                      </div>

                      {isExpanded && (
                        <>
                          {interaction.elementDescription && (
                            <p className="text-xs text-mac-text-secondary mb-1 truncate">
                              {interaction.elementDescription}
                            </p>
                          )}

                          {interaction.value && (
                            <p className="text-xs text-mac-text-muted italic truncate">
                              "{interaction.value}"
                            </p>
                          )}

                          {/* Thumbnail */}
                          {interaction.thumbnail && (
                            <div className="mt-2 rounded overflow-hidden border border-mac-utility-border">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={interaction.thumbnail}
                                alt="Interaction screenshot"
                                className="w-full h-auto"
                              />
                            </div>
                          )}
                        </>
                      )}

                      {/* Timestamp and duration */}
                      <div className="flex items-center gap-2 mt-1.5">
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1.5 py-0 h-4 bg-mac-surface-card"
                        >
                          {formatRelativeTime(interaction.timestamp)}
                        </Badge>
                        {interaction.duration && (
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0 h-4 bg-mac-surface-card"
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
      <div className="border-t border-mac-utility-border p-3">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-mac-text-muted">Total:</span>
            <span className="text-mac-text-primary font-medium">{interactions.length}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-mac-text-muted">Filtered:</span>
            <span className="text-mac-text-primary font-medium">{filteredInteractions.length}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-mac-text-muted">Errors:</span>
            <span className="text-rose-500 font-medium">
              {interactions.filter((i) => i.status === "error").length}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-mac-text-muted">Duration:</span>
            <span className="text-mac-text-primary font-medium">
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
