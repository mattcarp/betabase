/**
 * Historical Test Explorer Component
 * 
 * ULTRA-COMPACT one-line table view with infinite scroll
 * First 100 tests cached on load for instant display
 * Left sidebar (40%) + right detail panel (60%)
 * Part of SOTA Testing - RLHF, HITL, Self-Healing
 */

"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { ScrollArea } from "../ui/scroll-area";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { 
  Artifact, 
  ArtifactHeader, 
  ArtifactTitle, 
  ArtifactContent, 
  ArtifactAction, 
  ArtifactActions 
} from "../ai-elements/artifact";
import { 
  Archive, 
  Search, 
  RefreshCw,
  Copy,
  FileText,
  FileSearch,
  Sparkles,
  CheckCircle,
  TrendingUp,
  ChevronRight,
  Activity,
  Zap,
  ArrowUp,
  ArrowDown,
  Edit3
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "../../lib/utils";
import { sanitizeHtml } from "../../lib/dom-purify";

interface HistoricalTest {
  id: number;
  original_id: number;
  test_name: string;
  description: string;
  preconditions: string;
  test_script: string;
  app_under_test: string;
  tags: string;
  category: string;
  coverage: string;
  client_priority: number;
  is_security: boolean | null;
  execution_count: number;
  pass_count: number;
  fail_count: number;
  first_executed_at: string | null;
  last_executed_at: string | null;
  jira_ticket_count: number;
  created_at: string;
  updated_at: string;
  base_confidence: number;
  automation_confidence?: number; // Calculated heuristic (0-1)
}

/**
 * Tufte-Inspired Automation Confidence Heuristic
 * Evaluates the script's readiness for reliable automation.
 */
const calculateAutomationConfidence = (test: HistoricalTest): number => {
  let score = 50; // Base score

  // 1. Logic Depth: Presence of assertions or explicit steps (+20)
  if (test.test_script?.toLowerCase().includes("expect") || 
      test.test_script?.toLowerCase().includes("assert") ||
      test.test_script?.toLowerCase().includes("verify")) {
    score += 20;
  }

  // 2. Context Richness: Detailed prerequisites (+15)
  if (test.preconditions && test.preconditions.length > 50) {
    score += 15;
  }

  // 3. Execution History: Proven stability (+10)
  const passRate = test.execution_count > 0 ? (test.pass_count / test.execution_count) : 0;
  if (test.execution_count > 5 && passRate > 0.8) {
    score += 10;
  }

  // 4. Complexity Penalty: Purely visual/layout checks (-15)
  const isVisual = /\b(ui|layout|font|color|alignment|looks|look|feel)\b/i.test(test.test_name);
  if (isVisual) {
    score -= 15;
  }

  return Math.min(Math.max(score, 0), 100) / 100;
};

interface Filters {
  categories: string[];
  apps: string[];
}

interface HistoricalTestExplorerProps {
  prefetchedData?: any; // Prefetched data from parent (non-blocking background fetch)
}

export function HistoricalTestExplorer({ prefetchedData }: HistoricalTestExplorerProps = {}) {
  // Data state
  const [tests, setTests] = useState<HistoricalTest[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  
  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedApp, setSelectedApp] = useState<string>("");
  const [hasExecutions, setHasExecutions] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("updated_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  
  // Infinite scroll state
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Selection state
  const [selectedTest, setSelectedTest] = useState<HistoricalTest | null>(null);
  const [filters, setFilters] = useState<Filters>({ categories: [], apps: [] });
  
  // AI features state
  const [generatingPlaywright, setGeneratingPlaywright] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [calculatingConfidence, setCalculatingConfidence] = useState(false);
  const [aiConfidence, setAiConfidence] = useState<{ 
    score: number; 
    rationale: string;
    recommendations?: string[];
    automationFeasibility?: "high" | "medium" | "low";
  } | null>(null);
  const [artifactMode, setArtifactMode] = useState<"code" | "human">("code");
  const [showCritique, setShowCritique] = useState(false);
  const [critiqueText, setCritiqueText] = useState("");

  // Load initial batch (first 100 tests for cache)
  const loadInitialTests = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: "1",
        limit: "100", // Cache first 100
      });

      if (searchQuery) params.set("search", searchQuery);
      if (selectedApp) params.set("app", selectedApp);
      if (hasExecutions) params.set("hasExecutions", hasExecutions);
      if (sortBy) params.set("sortBy", sortBy);
      if (sortOrder) params.set("sortOrder", sortOrder);

      const response = await fetch(`/api/tests/historical?${params}`);
      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.details 
          ? `${data.error}: ${data.details}` 
          : (data.error || "Failed to fetch tests");
        throw new Error(errorMessage);
      }

      setTests(data.tests);
      setTotal(data.pagination.total);
      setHasMore(data.pagination.hasMore);
      setFilters(data.filters);
      setInitialLoadComplete(true);
      setPage(1);
    } catch (error: any) {
      console.error("Error loading initial tests:", error);
      toast.error(error.message || "Failed to load historical tests");
    } finally {
      setLoading(false);
    }
  }, [selectedApp, hasExecutions, searchQuery, sortBy, sortOrder]);

  // Load more tests for infinite scroll
  const loadMoreTests = useCallback(async () => {
    if (loading || !hasMore) return;
    
    setLoading(true);
    try {
      const nextPage = page + 1;
      const params = new URLSearchParams({
        page: nextPage.toString(),
        limit: "50", // Load 50 at a time after initial 100
      });

      if (searchQuery) params.set("search", searchQuery);
      if (selectedApp) params.set("app", selectedApp);
      if (hasExecutions) params.set("hasExecutions", hasExecutions);
      if (sortBy) params.set("sortBy", sortBy);
      if (sortOrder) params.set("sortOrder", sortOrder);

      const response = await fetch(`/api/tests/historical?${params}`);
      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.details 
          ? `${data.error}: ${data.details}` 
          : (data.error || "Failed to fetch tests");
        throw new Error(errorMessage);
      }

      setTests(prev => [...prev, ...data.tests]);
      setHasMore(data.pagination.hasMore);
      setPage(nextPage);
    } catch (error: any) {
      console.error("Error loading more tests:", error);
      toast.error(error.message || "Failed to load more tests");
    } finally {
      setLoading(false);
    }
  }, [page, loading, hasMore, searchQuery, selectedApp, hasExecutions, sortBy, sortOrder]);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
    setTests([]);
    setPage(1);
  };

  // Initial load on mount - use prefetched data if available
  useEffect(() => {
    if (prefetchedData && !initialLoadComplete) {
      // Use prefetched data (instant load!)
      console.log("⚡ Using prefetched historical tests");
      setTests(prefetchedData.tests || []);
      setTotal(prefetchedData.pagination?.total || 0);
      setHasMore(prefetchedData.pagination?.hasMore || false);
      setFilters(prefetchedData.filters || { categories: [], apps: [] });
      setInitialLoadComplete(true);
      setPage(1);
    } else if (!initialLoadComplete) {
      // No prefetched data, load normally
      loadInitialTests();
    }
  }, [prefetchedData, initialLoadComplete, loadInitialTests]);

  // Handle search with debounce - only trigger on actual search changes
  // Using a ref to track the previous search query to avoid false triggers
  const prevSearchRef = useRef(searchQuery);

  useEffect(() => {
    // Skip if search hasn't actually changed
    if (prevSearchRef.current === searchQuery) {
      return;
    }
    prevSearchRef.current = searchQuery;

    // Skip the initial mount - let the initial load effect handle that
    if (!initialLoadComplete) {
      return;
    }

    const timer = setTimeout(() => {
      setTests([]);
      setPage(1);
      loadInitialTests();
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery, loadInitialTests, initialLoadComplete]);

  // Handle scroll for infinite loading
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const scrollPercentage = (target.scrollTop + target.clientHeight) / target.scrollHeight;
    
    // Load more when scrolled 80% down
    if (scrollPercentage > 0.8 && hasMore && !loading) {
      loadMoreTests();
    }
  }, [hasMore, loading, loadMoreTests]);

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.8) {
      return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/40 font-light">High ({Math.round(confidence * 100)}%)</Badge>;
    } else if (confidence >= 0.5) {
      return <Badge className="bg-[var(--mac-primary-blue-400)]/20 text-[var(--mac-primary-blue-400)] border-[var(--mac-primary-blue-400)]/40 font-light">Medium ({Math.round(confidence * 100)}%)</Badge>;
    } else {
      return <Badge className="bg-[var(--mac-border)] text-[var(--mac-text-muted)] border-[var(--mac-utility-border-elevated)] font-light">Low ({Math.round(confidence * 100)}%)</Badge>;
    }
  };

  const getPassRate = (test: HistoricalTest) => {
    if (test.execution_count === 0) return null;
    const rate = (test.pass_count / test.execution_count) * 100;
    return rate.toFixed(0);
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortBy !== field) return null;
    return sortOrder === "asc" ? (
      <ArrowUp className="ml-1 h-3 w-3 text-[var(--mac-primary-blue-400)]" />
    ) : (
      <ArrowDown className="ml-1 h-3 w-3 text-[var(--mac-primary-blue-400)]" />
    );
  };

  return (
    <div className="flex h-full w-full gap-4 overflow-hidden" data-test-id="historical-test-explorer">
      {/* LEFT SIDEBAR - Compact One-Line Table - Fixed 40% width */}
      <div className="w-[40%] min-w-[420px] flex flex-col mac-card rounded-xl border border-[var(--mac-border)] overflow-hidden flex-shrink-0 shadow-lg bg-[var(--mac-surface-elevated)]">
        {/* Header Section */}
        <div className="p-4 border-b border-[var(--mac-border)]/50 bg-[var(--mac-surface-elevated)] backdrop-blur-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-[var(--mac-primary-blue-400)]/10 text-[var(--mac-primary-blue-400)]">
                <Archive className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-semibold text-white tracking-tight">
                Historical Tests
              </h3>
            </div>
            <Badge variant="outline" className="text-[10px] px-2 py-0 border-border text-muted-foreground font-mono">
              {total.toLocaleString()}
            </Badge>
          </div>
          
          {/* Compact Search */}
          <div className="relative group">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground group-focus-within:text-[var(--mac-primary-blue-400)] transition-colors" />
            <Input
              placeholder="Filter by name, script..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 pl-9 text-xs bg-card/50 border-border focus:border-[var(--mac-primary-blue-400)] text-foreground placeholder:text-muted-foreground transition-all rounded-lg"
              data-test-id="search-input"
            />
          </div>
          
          {/* Compact Filters Row */}
          <div className="flex gap-2 mt-3">
            <div className="flex-1 relative">
              <select
                value={selectedApp}
                onChange={(e) => setSelectedApp(e.target.value)}
                className="w-full h-8 pl-2 pr-8 text-[11px] bg-card/30 border border-border rounded-md text-foreground font-medium appearance-none focus:outline-none focus:border-[var(--mac-primary-blue-400)] cursor-pointer transition-colors"
                data-test-id="app-filter"
              >
                <option value="">All Applications</option>
                {filters.apps.map(app => (
                  <option key={app} value={app}>{app}</option>
                ))}
              </select>
              <ChevronRight className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground rotate-90 pointer-events-none" />
            </div>
            
            <div className="flex-1 relative">
              <select
                value={hasExecutions}
                onChange={(e) => setHasExecutions(e.target.value)}
                className="w-full h-8 pl-2 pr-8 text-[11px] bg-card/30 border border-border rounded-md text-foreground font-medium appearance-none focus:outline-none focus:border-[var(--mac-primary-blue-400)] cursor-pointer transition-colors"
                data-test-id="execution-filter"
              >
                <option value="">Status: All</option>
                <option value="true">Executed Only</option>
                <option value="false">Never Run</option>
              </select>
              <ChevronRight className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground rotate-90 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Scrollable Table Container */}
        <div 
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto bg-background/20 custom-scrollbar"
          data-test-id="test-list"
        >
          {!initialLoadComplete ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3">
              <RefreshCw className="h-5 w-5 text-[var(--mac-primary-blue-400)] animate-spin" />
              <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-widest">Warming cache...</span>
            </div>
          ) : tests.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 opacity-40 grayscale">
              <Archive className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-xs font-medium text-muted-foreground">Zero matches found</p>
            </div>
          ) : (
            <div className="min-w-full relative">
              <Table className="border-collapse">
                <TableHeader className="sticky top-0 bg-card/90 backdrop-blur-md z-30 shadow-sm border-b border-border">
                  <TableRow className="hover:bg-transparent border-none">
                    <TableHead 
                      className="w-[60px] h-10 px-4 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em] cursor-pointer hover:text-foreground transition-colors"
                      onClick={() => handleSort("id")}
                    >
                      <div className="flex items-center">
                        ID <SortIcon field="id" />
                      </div>
                    </TableHead>
                    <TableHead 
                      className="h-10 px-2 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em] cursor-pointer hover:text-foreground transition-colors"
                      onClick={() => handleSort("name")}
                    >
                      <div className="flex items-center">
                        Scenario Name <SortIcon field="name" />
                      </div>
                    </TableHead>
                    <TableHead 
                      className="w-[100px] h-10 px-2 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em] text-center cursor-pointer hover:text-foreground transition-colors"
                      onClick={() => handleSort("app_under_test")}
                    >
                      <div className="flex items-center justify-center">
                        App <SortIcon field="app_under_test" />
                      </div>
                    </TableHead>
                    <TableHead 
                      className="w-[60px] h-10 px-2 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em] text-center"
                    >
                      Conf.
                    </TableHead>
                    <TableHead 
                      className="w-[70px] h-10 px-4 text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em] text-right cursor-pointer hover:text-foreground transition-colors"
                      onClick={() => handleSort("pass_count")}
                    >
                      <div className="flex items-center justify-end">
                        Pass <SortIcon field="pass_count" />
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tests.map((test, index) => {
                    const passRate = test.execution_count > 0 
                      ? ((test.pass_count / test.execution_count) * 100).toFixed(0)
                      : null;
                    
                    const isSelected = selectedTest?.id === test.id;
                    
                    return (
                      <TableRow
                        key={`${test.id}-${index}`}
                        onClick={() => setSelectedTest(test)}
                        className={cn(
                          "cursor-pointer transition-all border-b border-border/50 h-10 group relative",
                          isSelected
                            ? "bg-[var(--mac-primary-blue-400)]/10 before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-[var(--mac-primary-blue-400)] before:shadow-[0_0_8px_var(--mac-primary-blue-400)] before:content-['']"
                            : "hover:bg-white/[0.03]"
                        )}
                        data-test-id={`test-row-${test.id}`}
                      >
                        
                        <TableCell className="py-0 px-4 text-[11px] font-mono text-muted-foreground group-hover:text-muted-foreground transition-colors">
                          #{test.id}
                        </TableCell>
                        <TableCell className="py-0 px-2 text-[12px] font-medium text-foreground truncate max-w-[180px] tracking-tight group-hover:text-white transition-colors" title={test.test_name}>
                          {test.test_name || "Unnamed Scenario"}
                        </TableCell>
                        <TableCell className="py-0 px-2 text-center">
                          <Badge variant="outline" className="text-[9px] h-auto py-0.5 px-2 border-border text-muted-foreground font-bold uppercase group-hover:border-border transition-colors whitespace-nowrap">
                            {test.app_under_test}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-0 px-2 text-center">
                          <div className="flex flex-col items-center gap-0.5">
                            <div className="h-6 w-1 rounded-full bg-muted overflow-hidden flex flex-col justify-end">
                              <div 
                                className={cn(
                                  "w-full transition-all duration-1000",
                                  calculateAutomationConfidence(test) >= 0.8 ? "bg-emerald-500" :
                                  calculateAutomationConfidence(test) >= 0.5 ? "bg-amber-500" :
                                  "bg-rose-500"
                                )}
                                style={{ height: `${calculateAutomationConfidence(test) * 100}%` }}
                              />
                            </div>
                            <span className="text-[8px] font-mono text-muted-foreground tabular-nums">
                              {Math.round(calculateAutomationConfidence(test) * 100)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-0 px-4 text-[11px] font-mono text-right tabular-nums">
                          {passRate ? (
                            <span className={cn(
                              "font-bold",
                              parseInt(passRate) >= 80 ? "text-emerald-500/80" :
                              parseInt(passRate) >= 50 ? "text-amber-500/80" :
                              "text-rose-500/80"
                            )}>
                              {passRate}%
                            </span>
                          ) : (
                            <span className="text-muted-foreground">--</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              
              {/* Infinite Scroll Loading Indicator */}
              {loading && (
                <div className="p-4 text-center text-muted-foreground text-xs font-light bg-card/50 animate-pulse">
                  <RefreshCw className="h-3 w-3 inline mr-2 animate-spin" />
                  Fetching batch...
                </div>
              )}
              
              {!hasMore && tests.length > 0 && (
                <div className="p-6 text-center text-muted-foreground text-[10px] font-bold uppercase tracking-widest bg-card/20 border-t border-border">
                  Total of {total.toLocaleString()} records indexed
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT PANEL - Detailed View - Fixed width calculation */}
      <div className="flex-1 min-w-0 rounded-xl border border-[var(--mac-border)] overflow-hidden bg-[var(--mac-surface-background)] flex flex-col shadow-2xl relative">
        {selectedTest ? (
          <div className="flex flex-col h-full" data-test-id="test-detail">
            {/* Detail Header */}
            <div className="p-4 border-b border-[var(--mac-border)] bg-[var(--mac-surface-elevated)] shadow-sm">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-lg font-light text-white truncate tracking-tight">{selectedTest.test_name}</h2>
                    <div className="mt-1 flex items-center gap-2">
                      {getConfidenceBadge(selectedTest.base_confidence)}
                      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest">
                          Auto-Ready: {Math.round(calculateAutomationConfidence(selectedTest) * 100)}%
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-light font-mono">
                    <span className="opacity-40">VAULT://</span>
                    <span className="flex items-center gap-1">
                      ID-{selectedTest.id}
                    </span>
                    <span className="text-muted-foreground">|</span>
                    <span className="text-foreground font-bold uppercase tracking-wider">
                      {selectedTest.app_under_test}
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedTest(null)}
                  className="text-muted-foreground hover:text-white hover:bg-muted h-7 w-7 p-0 flex-shrink-0 rounded-full transition-all"
                  title="Close detail view"
                >
                  <span className="text-lg">×</span>
                </Button>
              </div>

              {/* Quick Stats Cards */}
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2 rounded-lg bg-card/40 border border-border/50 hover:border-[var(--mac-primary-blue-400)]/40 transition-all group shadow-inner text-center">
                  <div className="text-[8px] text-muted-foreground font-bold mb-0.5 flex items-center justify-center gap-1.5 uppercase tracking-widest">
                    <Activity className="h-2 w-2 text-[var(--mac-primary-blue-400)] group-hover:scale-110 transition-transform" />
                    Runs
                  </div>
                  <div className="text-lg font-extralight text-white">
                    {selectedTest.execution_count.toLocaleString()}
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-card/40 border border-border/50 hover:border-emerald-900/30 transition-all group shadow-inner text-center">
                  <div className="text-[8px] text-muted-foreground font-bold mb-0.5 flex items-center justify-center gap-1.5 uppercase tracking-widest">
                    <CheckCircle className="h-2 w-2 text-emerald-500 group-hover:scale-110 transition-transform" />
                    Pass
                  </div>
                  <div className="text-lg font-extralight text-emerald-400">
                    {getPassRate(selectedTest) || "—"}{getPassRate(selectedTest) ? "%" : ""}
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-card/40 border border-border/50 hover:border-border/50 transition-all group shadow-inner text-center">
                  <div className="text-[8px] text-muted-foreground font-bold mb-0.5 flex items-center justify-center gap-1.5 uppercase tracking-widest">
                    <FileText className="h-2 w-2 text-muted-foreground group-hover:scale-110 transition-transform" />
                    JIRA
                  </div>
                  <div className="text-lg font-extralight text-white">
                    {selectedTest.jira_ticket_count}
                  </div>
                </div>
              </div>
            </div>

            {/* Detail Body - Scrollable */}
            <ScrollArea className="flex-1 p-6 bg-background/40">
              <div className="max-w-4xl mx-auto space-y-6">
                {/* Description */}
                {selectedTest.description && (
                  <div className="group border-l border-border/50 pl-6 ml-1 transition-colors hover:border-[var(--mac-primary-blue-400)]/30">
                    <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mb-3">Context Summary</h3>
                    <div 
                      className="leading-relaxed text-foreground text-[14px] font-light overflow-hidden break-words prose prose-invert prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: sanitizeHtml(selectedTest.description) }}
                    />
                  </div>
                )}

                {/* Preconditions */}
                {selectedTest.preconditions && (
                  <div className="group border-l border-border/50 pl-6 ml-1 transition-colors hover:border-amber-500/30">
                    <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mb-3">System Prerequisites</h3>
                    <div 
                      className="p-4 rounded-xl bg-amber-900/5 border border-amber-900/10 text-muted-foreground text-[13px] font-light leading-relaxed shadow-sm overflow-hidden break-words prose prose-invert prose-sm max-w-none italic"
                      dangerouslySetInnerHTML={{ __html: sanitizeHtml(selectedTest.preconditions) }}
                    />
                  </div>
                )}

                {/* Test Script */}
                {selectedTest.test_script && (
                  <div className="border-l border-border/50 pl-6 ml-1 transition-colors hover:border-indigo-500/30">
                    <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mb-3">Instruction Logic</h3>
                    <div className="relative group">
                      <div 
                        className="p-5 rounded-2xl bg-background/40 border border-border/20 shadow-inner leading-relaxed text-foreground text-[14px] font-mono overflow-hidden break-words prose prose-invert prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: sanitizeHtml(selectedTest.test_script) }}
                      />
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-white bg-card/50 backdrop-blur-sm h-7 text-[9px] uppercase font-bold tracking-widest"
                        onClick={() => {
                          navigator.clipboard.writeText(selectedTest.test_script);
                          toast.success("Copied to clipboard");
                        }}
                      >
                        Copy
                      </Button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-6 pt-2">
                  {/* Metadata Section */}
                  <div className="p-5 rounded-2xl bg-card/40 border border-border/50 shadow-md">
                    <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-4">Test Details</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between py-1.5 border-b border-border/30">
                        <span className="text-xs text-muted-foreground font-light">Application</span>
                        <Badge variant="outline" className="text-[10px] border-border text-foreground bg-muted/30 font-medium">
                          {selectedTest.category}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between py-1.5 border-b border-border/30">
                        <span className="text-xs text-muted-foreground font-light">Priority</span>
                        <span className="text-xs text-white font-medium tabular-nums">{selectedTest.client_priority || "0"}</span>
                      </div>
                      <div className="flex items-center justify-between py-1.5 border-b border-border/30">
                        <span className="text-xs text-muted-foreground font-light">Security</span>
                        <span className={cn(
                          "text-[10px] font-bold uppercase tracking-wider",
                          selectedTest.is_security ? "text-amber-400" : "text-muted-foreground"
                        )}>
                          {selectedTest.is_security ? "Active" : "Standard"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-1.5">
                        <span className="text-xs text-muted-foreground font-light">Coverage</span>
                        <span className="text-xs text-white font-mono">{selectedTest.coverage || "0.0%"}</span>
                      </div>
                    </div>
                  </div>

                  {/* History Section */}
                  <div className="p-5 rounded-2xl bg-card/40 border border-border/50 shadow-md">
                    <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-4">History</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between py-1.5 border-b border-border/30">
                        <span className="text-xs text-muted-foreground font-light">Success</span>
                        <span className="text-emerald-400 font-bold tabular-nums text-xs">{selectedTest.pass_count.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between py-1.5 border-b border-border/30">
                        <span className="text-xs text-muted-foreground font-light">Failure</span>
                        <span className="text-rose-400 font-bold tabular-nums text-xs">{selectedTest.fail_count.toLocaleString()}</span>
                      </div>
                      {selectedTest.first_executed_at && (
                        <div className="flex items-center justify-between py-1.5 border-b border-border/30">
                          <span className="text-xs text-muted-foreground font-light">First Run</span>
                          <span className="text-[10px] text-foreground font-mono tabular-nums">{new Date(selectedTest.first_executed_at).toLocaleDateString()}</span>
                        </div>
                      )}
                      {selectedTest.last_executed_at && (
                        <div className="flex items-center justify-between py-1.5">
                          <span className="text-xs text-muted-foreground font-light">Last Run</span>
                          <span className="text-[10px] text-foreground font-mono tabular-nums">{new Date(selectedTest.last_executed_at).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* AI Confidence Result */}
                {aiConfidence && (
                  <div className="p-6 rounded-3xl bg-[var(--mac-primary-blue-400)]/[0.03] border border-[var(--mac-primary-blue-400)]/20 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-[var(--mac-primary-blue-400)]/10 shadow-inner">
                          <Zap className="h-5 w-5 text-[var(--mac-primary-blue-400)]" />
                        </div>
                        <div>
                          <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">AI Analysis</h3>
                          <div className="mt-1">{getConfidenceBadge(aiConfidence.score)}</div>
                        </div>
                      </div>
                      
                      {aiConfidence.automationFeasibility && (
                        <div className="text-right">
                          <div className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">Automation</div>
                          <Badge variant="outline" className={cn(
                            "uppercase text-[9px] font-bold tracking-tighter px-1.5 h-4",
                            aiConfidence.automationFeasibility === "high" ? "border-emerald-500/50 text-emerald-400 bg-emerald-500/10" :
                            aiConfidence.automationFeasibility === "medium" ? "border-amber-500/50 text-amber-400 bg-amber-500/10" :
                            "border-rose-500/50 text-rose-400 bg-rose-500/10"
                          )}>
                            {aiConfidence.automationFeasibility}
                          </Badge>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div className="relative">
                        <div className="absolute -left-3 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[var(--mac-primary-blue-400)]/40 via-transparent to-transparent" />
                        <h4 className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5 pl-2">Reasoning</h4>
                        <p className="text-[14px] text-foreground font-extralight italic leading-relaxed pl-2">
                          {aiConfidence.rationale}
                        </p>
                      </div>

                      {aiConfidence.recommendations && aiConfidence.recommendations.length > 0 && (
                        <div className="pt-3 border-t border-border/50">
                          <h4 className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Suggestions</h4>
                          <ul className="space-y-1.5">
                            {aiConfidence.recommendations.map((rec, i) => (
                              <li key={i} className="flex items-start gap-2.5 text-[11px] text-muted-foreground font-light leading-relaxed">
                                <div className="h-1 w-1 rounded-full bg-[var(--mac-primary-blue-400)]/40 mt-1.5 flex-shrink-0" />
                                {rec}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Automated Test Code */}
                {generatedCode && (
                  <Artifact className="border-border/80 shadow-2xl animate-in zoom-in-95 duration-300 bg-background">
                    <ArtifactHeader className="bg-card/50 border-b border-border/50">
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                          <Sparkles className="h-4 w-4 text-emerald-400" />
                        </div>
                        <ArtifactTitle className="text-xs font-black text-white uppercase tracking-[0.3em]">
                          {artifactMode === "code" ? "Automated Test" : "Human-Readable Scenario"}
                        </ArtifactTitle>
                      </div>
                      <ArtifactActions>
                        <div className="flex bg-card/80 p-0.5 rounded-lg border border-border mr-2">
                          <button
                            onClick={() => setArtifactMode("human")}
                            className={cn(
                              "px-2 py-1 text-[9px] font-bold uppercase tracking-widest rounded-md transition-all",
                              artifactMode === "human" ? "bg-muted text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                            )}
                          >
                            Human
                          </button>
                          <button
                            onClick={() => setArtifactMode("code")}
                            className={cn(
                              "px-2 py-1 text-[9px] font-bold uppercase tracking-widest rounded-md transition-all",
                              artifactMode === "code" ? "bg-muted text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                            )}
                          >
                            Code
                          </button>
                        </div>
                        <ArtifactAction
                          icon={RefreshCw}
                          tooltip="Re-generate"
                          onClick={async () => {
                            if (!selectedTest) return;
                            setGeneratingPlaywright(true);
                            setGeneratedCode(null);
                            try {
                              const response = await fetch("/api/generate-playwright", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ 
                                  test: selectedTest,
                                  additionalInstructions: critiqueText 
                                }),
                              });
                              const data = await response.json();
                              if (data.code) {
                                setGeneratedCode(data.code);
                                toast.success("Test re-generated with critique");
                                setCritiqueText("");
                                setShowCritique(false);
                              }
                            } catch {
                              toast.error("Failed to re-generate test");
                            } finally {
                              setGeneratingPlaywright(false);
                            }
                          }}
                        />
                        <ArtifactAction
                          icon={Edit3}
                          tooltip="Critique Script"
                          onClick={() => setShowCritique(!showCritique)}
                        />
                        <ArtifactAction
                          icon={Copy}
                          tooltip="Copy Test"
                          onClick={() => {
                            navigator.clipboard.writeText(generatedCode);
                            toast.success("Copied to clipboard");
                          }}
                        />
                      </ArtifactActions>
                    </ArtifactHeader>
                    <ArtifactContent className="p-0 bg-black/40">
                      <div className="relative group">
                        {showCritique && (
                          <div className="absolute inset-0 z-50 bg-background/90 backdrop-blur-sm p-6 animate-in fade-in zoom-in-95 duration-200 flex flex-col">
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="text-xs font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
                                <Edit3 className="h-3.5 w-3.5 text-[var(--mac-primary-blue-400)]" />
                                Script Critique
                              </h4>
                              <Button variant="ghost" size="sm" onClick={() => setShowCritique(false)} className="h-6 w-6 p-0 rounded-full">×</Button>
                            </div>
                            <p className="text-[11px] text-muted-foreground mb-4 font-light italic">
                              Suggest improvements, fix selectors, or clarify logic. The AI will rebuild the script based on your feedback.
                            </p>
                            <textarea
                              value={critiqueText}
                              onChange={(e) => setCritiqueText(e.target.value)}
                              placeholder="e.g. 'Use data-test-id for the login button', 'Add an assertion for the successful redirect'..."
                              className="flex-1 bg-card border border-border rounded-xl p-4 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[var(--mac-primary-blue-400)] transition-all resize-none font-light leading-relaxed mb-4"
                            />
                            <div className="flex gap-3">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="flex-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-white"
                                onClick={() => {
                                  setCritiqueText("");
                                  setShowCritique(false);
                                }}
                              >
                                Cancel
                              </Button>
                              <Button 
                                size="sm" 
                                className="flex-1 mac-button-gradient text-white text-[10px] font-bold uppercase tracking-widest"
                                onClick={async () => {
                                  if (!selectedTest) return;
                                  setGeneratingPlaywright(true);
                                  setGeneratedCode(null);
                                  try {
                                    const response = await fetch("/api/tests/generate-playwright", {
                                      method: "POST",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({ 
                                        testId: selectedTest.id,
                                        additionalInstructions: critiqueText 
                                      }),
                                    });
                                    const data = await response.json();
                                    if (data.success) {
                                      setGeneratedCode(data.testCode);
                                      toast.success("Self-healing complete!");
                                      setShowCritique(false);
                                    }
                                  } catch {
                                    toast.error("Critique sync failed");
                                  } finally {
                                    setGeneratingPlaywright(false);
                                  }
                                }}
                                disabled={!critiqueText.trim() || generatingPlaywright}
                              >
                                {generatingPlaywright ? "Healing..." : "Apply & Rebuild"}
                              </Button>
                            </div>
                          </div>
                        )}
                        {artifactMode === "code" ? (
                          <pre className="text-xs text-emerald-400/80 font-mono p-5 overflow-x-auto max-h-[500px] shadow-2xl custom-scrollbar leading-loose tracking-tight">
                            {generatedCode}
                          </pre>
                        ) : (
                          <div className="p-6 prose prose-invert prose-sm max-w-none">
                            <h4 className="text-emerald-400 font-medium mb-4 flex items-center gap-2">
                              <CheckCircle className="h-4 w-4" />
                              Manual Execution Logic
                            </h4>
                            <div className="space-y-4 text-foreground font-light">
                              <div>
                                <span className="text-emerald-500/60 font-bold uppercase text-[9px] block mb-1">Step 1: Environment Setup</span>
                                <p dangerouslySetInnerHTML={{ __html: sanitizeHtml(selectedTest.preconditions) }} />
                              </div>
                              <div className="pt-2 border-t border-white/5">
                                <span className="text-emerald-500/60 font-bold uppercase text-[9px] block mb-1">Step 2: Core Logic</span>
                                <p dangerouslySetInnerHTML={{ __html: sanitizeHtml(selectedTest.test_script) }} />
                              </div>
                              <div className="pt-2 border-t border-white/5">
                                <span className="text-emerald-500/60 font-bold uppercase text-[9px] block mb-1">Expected Outcome</span>
                                <p>Verify that the system responds correctly following the logic script above.</p>
                              </div>
                            </div>
                          </div>
                        )}
                        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-zinc-950/80 to-transparent pointer-events-none" />
                      </div>
                    </ArtifactContent>
                  </Artifact>
                )}

                {/* Action Buttons - Moved to bottom of scroll area */}
                <div className="pt-8 mt-4 border-t border-border/30">
                  <div className="flex gap-6">
                    <Button 
                      size="lg" 
                      className="flex-1 mac-button-gradient text-white font-black uppercase tracking-[0.25em] text-[10px] h-14 rounded-2xl shadow-2xl hover:scale-[1.02] active:scale-95 transition-all group overflow-hidden relative"
                      onClick={async () => {
                        if (!selectedTest) return;
                        setGeneratingPlaywright(true);
                        setGeneratedCode(null);
                        try {
                          const res = await fetch("/api/tests/generate-playwright", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              testId: selectedTest.id,
                              testName: selectedTest.test_name,
                              description: selectedTest.description,
                              preconditions: selectedTest.preconditions,
                              app_under_test: selectedTest.app_under_test,
                              additionalInstructions: critiqueText || undefined
                            }),
                          });
                          const data = await res.json();
                          if (data.success) {
                            setGeneratedCode(data.testCode);
                            toast.success(`Script generated and saved to vault! (ID: ${data.persistedId?.slice(0, 8)})`);
                          } else {
                            toast.error(data.error || "Generation failed");
                          }
                        } catch {
                          toast.error("Sync error");
                        } finally {
                          setGeneratingPlaywright(false);
                        }
                      }}
                      disabled={generatingPlaywright}
                      data-test-id="generate-playwright-btn"
                    >
                      <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                      {generatingPlaywright ? (
                        <RefreshCw className="h-5 w-5 mr-4 animate-spin text-white" />
                      ) : (
                        <Sparkles className="h-5 w-5 mr-4 group-hover:rotate-45 transition-transform text-white" />
                      )}
                      {generatingPlaywright ? "Generating Automated Test..." : "Generate Automated Test"}
                    </Button>
                    
                    <Button 
                      size="lg" 
                      variant="outline" 
                      className="flex-1 border-border/50 text-foreground hover:text-white hover:bg-muted/80 font-black uppercase tracking-[0.25em] text-[10px] h-14 rounded-2xl transition-all group shadow-xl active:scale-95 bg-card/30 backdrop-blur-sm"
                      onClick={async () => {
                        if (!selectedTest) return;
                        setCalculatingConfidence(true);
                        setAiConfidence(null);
                        try {
                          const res = await fetch("/api/tests/confidence-score", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              testId: selectedTest.id,
                              testName: selectedTest.test_name,
                              description: selectedTest.description,
                              preconditions: selectedTest.preconditions,
                              app_under_test: selectedTest.app_under_test,
                              execution_count: selectedTest.execution_count,
                              pass_count: selectedTest.pass_count,
                              last_executed_at: selectedTest.last_executed_at,
                            }),
                          });
                          const data = await res.json();
                          setAiConfidence({ 
                            score: data.score, 
                            rationale: data.rationale,
                            recommendations: data.recommendations,
                          automationFeasibility: data.automationFeasibility
                        });
                        toast.success(`AI Confidence: ${Math.round(data.score * 100)}%`);
                      } catch {
                        toast.error("Analysis failed");
                      } finally {
                        setCalculatingConfidence(false);
                      }
                    }}
                    disabled={calculatingConfidence}
                      data-test-id="calculate-confidence-btn"
                    >
                      {calculatingConfidence ? (
                        <RefreshCw className="h-5 w-5 mr-4 animate-spin text-muted-foreground" />
                      ) : (
                        <Zap className="h-5 w-5 mr-4 text-[var(--mac-primary-blue-400)] group-hover:scale-125 transition-transform" />
                      )}
                      {calculatingConfidence ? "Analyzing..." : "Run AI Analysis"}
                    </Button>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </div>
        ) : (
          // Empty state - no test selected
          <div className="flex flex-col items-center justify-start h-full text-center p-12 pt-24 bg-background/20 backdrop-blur-3xl overflow-y-auto">
            <div className="relative mb-8">
              <div className="absolute -inset-4 bg-[var(--mac-primary-blue-400)]/10 rounded-full blur-2xl transition-all duration-700" />
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center relative shadow-2xl border border-border/50 transition-transform">
                <FileSearch className="h-10 w-10 text-muted-foreground transition-colors" />
              </div>
            </div>
            <h3 className="text-2xl font-extralight text-white mb-4 tracking-tight">Select a Test</h3>
            <p className="text-sm text-muted-foreground font-light max-w-sm leading-relaxed mb-10">
              Pick a historical scenario from the vault to generate scripts, run AI analysis, and view performance history.
            </p>
            <div className="grid grid-cols-1 gap-4 w-full max-w-xs text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
              <div className="flex items-center gap-4 p-4 rounded-2xl border border-border bg-card/20 transition-colors">
                <Sparkles className="h-4 w-4 text-emerald-500" />
                <span className="flex-1 text-left">Script Generator</span>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-2xl border border-border bg-card/20 transition-colors">
                <Zap className="h-4 w-4 text-[var(--mac-primary-blue-400)]" />
                <span className="flex-1 text-left">AI Analyzer</span>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-2xl border border-border bg-card/20 transition-colors">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span className="flex-1 text-left">Test History</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default HistoricalTestExplorer;