"use client";

import { useState, useCallback } from "react";
import { cn } from "../../../lib/utils";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "../../ui/popover";
import { Play, Pause, SkipForward, Presentation, MessageSquare, X } from "lucide-react";

interface DemoQuery {
  id: string;
  label: string;
  query: string;
  category: "auth" | "lifecycle" | "api" | "diagram";
  description?: string;
}

const DEMO_QUERIES: DemoQuery[] = [
  {
    id: "auth-flow",
    label: "Authentication",
    query: "What's the AOMA 2 API authentication flow?",
    category: "auth",
    description: "Core domain question - shows RAG with technical content",
  },
  {
    id: "offering-lifecycle",
    label: "Offering Lifecycle",
    query: "How does the Offering lifecycle work in AOMA?",
    category: "lifecycle",
    description: "Business logic - shows domain understanding",
  },
  {
    id: "asset-api",
    label: "Asset Endpoints",
    query: "What are the main API endpoints for Asset management?",
    category: "api",
    description: "API reference - shows technical doc indexing",
  },
  {
    id: "auth-diagram",
    label: "Auth Diagram",
    query: "Show me the authentication flow as a diagram",
    category: "diagram",
    description: "Generates Nano Banana workflow visualization",
  },
];

interface DemoModeProps {
  onQuerySelect: (query: string) => void;
  isActive?: boolean;
  onToggle?: () => void;
  className?: string;
}

/**
 * Demo Mode - pre-loaded queries for smooth screen recording
 * Provides quick access to cached demo queries
 */
export function DemoMode({ onQuerySelect, isActive = false, onToggle, className }: DemoModeProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const handleNext = useCallback(() => {
    const nextIndex = (currentIndex + 1) % DEMO_QUERIES.length;
    setCurrentIndex(nextIndex);
    onQuerySelect(DEMO_QUERIES[nextIndex].query);
  }, [currentIndex, onQuerySelect]);

  const handleSelect = useCallback(
    (query: DemoQuery) => {
      const index = DEMO_QUERIES.findIndex((q) => q.id === query.id);
      setCurrentIndex(index);
      onQuerySelect(query.query);
      setIsOpen(false);
    },
    [onQuerySelect]
  );

  const categoryColors = {
    auth: "bg-blue-500/10 border-blue-500/30 text-blue-400",
    lifecycle: "bg-green-500/10 border-green-500/30 text-green-400",
    api: "bg-primary-500/10 border-primary-500/30 text-primary-400",
    diagram: "bg-orange-500/10 border-orange-500/30 text-orange-400",
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Demo Mode Toggle */}
      <Button
        variant={isActive ? "default" : "outline"}
        size="sm"
        onClick={onToggle}
        className={cn(
          "gap-2 transition-all duration-200",
          isActive
            ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 shadow-lg shadow-amber-500/20"
            : "border-border text-muted-foreground hover:text-foreground hover:border-border"
        )}
      >
        <Presentation className="h-4 w-4" />
        <span className="text-xs font-normal">Demo Mode</span>
        {isActive && (
          <Badge variant="secondary" className="ml-1 bg-white/20 text-white text-[10px]">
            ON
          </Badge>
        )}
      </Button>

      {/* Quick Query Selector */}
      {isActive && (
        <>
          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="mac-button gap-2 border-border text-foreground">
                <MessageSquare className="h-3.5 w-3.5" />
                <span className="text-xs">Queries</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 bg-card border-border" align="start">
              <div className="p-3 border-b border-border">
                <div className="text-sm font-normal text-foreground">Demo Queries</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Pre-cached queries for smooth recording
                </p>
              </div>
              <div className="p-2 space-y-1 max-h-64 overflow-y-auto">
                {DEMO_QUERIES.map((query, idx) => (
                  <button
                    key={query.id}
                    onClick={() => handleSelect(query)}
                    className={cn(
                      "w-full text-left p-3 rounded-lg transition-all duration-200",
                      "hover:bg-muted/50",
                      currentIndex === idx && "bg-muted ring-1 ring-border"
                    )}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Badge
                        variant="outline"
                        className={cn("text-[10px]", categoryColors[query.category])}
                      >
                        {query.label}
                      </Badge>
                      {currentIndex === idx && (
                        <Badge className="bg-amber-500/20 text-amber-400 text-[10px]">
                          Current
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-foreground line-clamp-1">{query.query}</p>
                    {query.description && (
                      <p className="text-xs text-muted-foreground mt-1">{query.description}</p>
                    )}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* Quick Next Button */}
          <Button variant="ghost"
            size="sm"
            onClick={handleNext}
            className="mac-button mac-button-outline h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
            title="Next demo query"
          >
            <SkipForward className="h-4 w-4" />
          </Button>
        </>
      )}
    </div>
  );
}

/**
 * Hook for managing demo mode state
 */
export function useDemoMode() {
  const [isActive, setIsActive] = useState(false);
  const [currentQuery, setCurrentQuery] = useState<string | null>(null);

  const toggle = useCallback(() => {
    setIsActive((prev) => !prev);
  }, []);

  const selectQuery = useCallback((query: string) => {
    setCurrentQuery(query);
  }, []);

  const reset = useCallback(() => {
    setCurrentQuery(null);
  }, []);

  return {
    isActive,
    currentQuery,
    toggle,
    selectQuery,
    reset,
    queries: DEMO_QUERIES,
  };
}

export default DemoMode;
