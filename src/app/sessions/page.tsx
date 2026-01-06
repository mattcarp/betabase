"use client";

import React, { useState, useMemo } from "react";
import { Session, SessionStatus } from "@/types/session";
import { mockSessions, getUniqueTesters, getUniqueAUTs } from "@/lib/mockSessions";
import { SessionCard } from "@/components/sessions/SessionCard";
import { EmptyState } from "@/components/sessions/EmptyState";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Grid3x3, List, Filter, X, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

type ViewMode = "grid" | "list";

export default function SessionsPage() {
  const [sessions] = useState<Session[]>(mockSessions);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTester, setSelectedTester] = useState<string>("all");
  const [selectedAUT, setSelectedAUT] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<SessionStatus | "all">("all");
  const [showFilters, setShowFilters] = useState(false);

  // Get filter options
  const testers = getUniqueTesters();
  const auts = getUniqueAUTs();

  // Filter sessions
  const filteredSessions = useMemo(() => {
    return sessions.filter((session) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          session.name.toLowerCase().includes(query) ||
          session.aut.toLowerCase().includes(query) ||
          session.testerName.toLowerCase().includes(query) ||
          session.notes?.toLowerCase().includes(query) ||
          session.tags?.some((tag: string) => tag.toLowerCase().includes(query));

        if (!matchesSearch) return false;
      }

      // Tester filter
      if (selectedTester !== "all" && session.testerName !== selectedTester) {
        return false;
      }

      // AUT filter
      if (selectedAUT !== "all" && session.aut !== selectedAUT) {
        return false;
      }

      // Status filter
      if (selectedStatus !== "all" && session.status !== selectedStatus) {
        return false;
      }

      return true;
    });
  }, [sessions, searchQuery, selectedTester, selectedAUT, selectedStatus]);

  // Count active filters
  const activeFiltersCount = [
    selectedTester !== "all",
    selectedAUT !== "all",
    selectedStatus !== "all",
  ].filter(Boolean).length;

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery("");
    setSelectedTester("all");
    setSelectedAUT("all");
    setSelectedStatus("all");
  };

  // Session actions
  const handlePlay = (session: Session) => {
    console.log("Play session:", session.id);
    // TODO: Navigate to playback viewer
    alert(`Opening playback for: ${session.name}`);
  };

  const handleRename = (session: Session) => {
    const newName = prompt("Enter new session name:", session.name);
    if (newName && newName.trim()) {
      console.log("Rename session:", session.id, "to", newName);
      // TODO: Implement rename functionality
      alert(`Session renamed to: ${newName}`);
    }
  };

  const handleDelete = (session: Session) => {
    if (confirm(`Are you sure you want to delete "${session.name}"?`)) {
      console.log("Delete session:", session.id);
      // TODO: Implement delete functionality
      alert(`Session deleted: ${session.name}`);
    }
  };

  const handleShare = (session: Session) => {
    console.log("Share session:", session.id);
    // TODO: Implement share functionality
    alert(`Share link copied for: ${session.name}`);
  };

  const handleExport = (session: Session) => {
    console.log("Export session:", session.id);
    // TODO: Implement export functionality
    alert(`Exporting session: ${session.name}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 c className="mac-heading"lassName="mac-heading text-3xl mb-2">Test Sessions</h1>
          <p className="mac-body text-muted-foreground">Browse and manage your recorded test sessions</p>
        </div>

        {/* Search and Filters Bar */}
        <div className="mb-6 space-y-4">
          {/* Top Row: Search, View Toggle, Filter Button */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search sessions by name, AUT, tester, or tags..."
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setSearchQuery(e.target.value)
                }
                className="mac-input pl-10"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* View Mode Toggle */}
            <div className="flex gap-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("grid")}
                className={cn(viewMode === "grid" ? "mac-button-primary" : "mac-button-outline")}
              >
                <Grid3x3 className="h-4 w-4" />
                <span className="sr-only">Grid view</span>
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("list")}
                className={cn(viewMode === "list" ? "mac-button-primary" : "mac-button-outline")}
              >
                <List className="h-4 w-4" />
                <span className="sr-only">List view</span>
              </Button>
            </div>

            {/* Filter Toggle */}
            <Button variant="outline" className="mac-button mac-button-outline"
              onClick={() => setShowFilters(!showFilters)}
              className="mac-button-outline gap-2"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </div>

          {/* Filter Row (Collapsible) */}
          {showFilters && (
            <div className="flex flex-col sm:flex-row gap-4 p-4 rounded-lg bg-card/50 border border-white/10">
              <div className="flex-1">
                <label className="text-xs text-muted-foreground mb-2 block">Tester</label>
                <Select value={selectedTester} onValueChange={setSelectedTester}>
                  <SelectTrigger className="mac-input">
                    <SelectValue placeholder="All testers" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-white/10">
                    <SelectItem value="all">All testers</SelectItem>
                    {testers.map((tester: string) => (
                      <SelectItem key={tester} value={tester}>
                        {tester}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1">
                <label className="text-xs text-muted-foreground mb-2 block">Application Under Test</label>
                <Select value={selectedAUT} onValueChange={setSelectedAUT}>
                  <SelectTrigger className="mac-input">
                    <SelectValue placeholder="All applications" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-white/10">
                    <SelectItem value="all">All applications</SelectItem>
                    {auts.map((aut: string) => (
                      <SelectItem key={aut} value={aut}>
                        {aut}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1">
                <label className="text-xs text-muted-foreground mb-2 block">Status</label>
                <Select
                  value={selectedStatus}
                  onValueChange={(value: string) =>
                    setSelectedStatus(value as SessionStatus | "all")
                  }
                >
                  <SelectTrigger className="mac-input">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-white/10">
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="has-issues">Has Issues</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {activeFiltersCount > 0 && (
                <div className="flex items-end">
                  <Button variant="ghost"
                    onClick={clearFilters}
                    className="mac-button mac-button-outline gap-2 text-muted-foreground hover:text-white"
                  >
                    <X className="h-4 w-4" />
                    Clear
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Results Count */}
        {filteredSessions.length > 0 && (
          <div className="mb-4 text-sm text-muted-foreground">
            Showing {filteredSessions.length}{" "}
            {filteredSessions.length === 1 ? "session" : "sessions"}
          </div>
        )}

        {/* Sessions Grid/List */}
        {filteredSessions.length === 0 && sessions.length === 0 ? (
          <EmptyState />
        ) : filteredSessions.length === 0 ? (
          <div className="text-center py-16">
            <Filter className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 c className="mac-title"lassName="mac-title text-lg mb-2">No sessions found</h3>
            <p className="mac-body text-muted-foreground mb-4">Try adjusting your search or filters</p>
            <Button onClick={clearFilters} variant="outline" className="mac-button-outline">
              Clear Filters
            </Button>
          </div>
        ) : (
          <div
            className={cn(
              viewMode === "grid"
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                : "flex flex-col gap-4"
            )}
          >
            {filteredSessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                onPlay={handlePlay}
                onRename={handleRename}
                onDelete={handleDelete}
                onShare={handleShare}
                onExport={handleExport}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
