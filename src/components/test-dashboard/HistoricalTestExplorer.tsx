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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
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
  Archive, 
  Search, 
  RefreshCw,
  Filter,
  FileText,
  Sparkles,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  ChevronRight,
  Activity,
  Zap,
  AlertTriangle
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "../../lib/utils";

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
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

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
  const [cachedTests, setCachedTests] = useState<HistoricalTest[]>([]); // First 100 cached
  const [loading, setLoading] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  
  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedApp, setSelectedApp] = useState<string>("");
  const [hasExecutions, setHasExecutions] = useState<string>("");
  
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
  const [aiConfidence, setAiConfidence] = useState<{ score: number; rationale: string } | null>(null);

  // Load initial batch (first 100 tests for cache)
  const loadInitialTests = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: "1",
        limit: "100", // Cache first 100
      });

      if (selectedApp) params.set("app", selectedApp);
      if (hasExecutions) params.set("hasExecutions", hasExecutions);

      const response = await fetch(`/api/tests/historical?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch tests");
      }

      setCachedTests(data.tests);
      setTests(data.tests);
      setTotal(data.pagination.total);
      setHasMore(data.pagination.hasMore);
      setFilters(data.filters);
      setInitialLoadComplete(true);
      setPage(1);
    } catch (error) {
      console.error("Error loading initial tests:", error);
      toast.error("Failed to load historical tests");
    } finally {
      setLoading(false);
    }
  }, [selectedApp, hasExecutions]);

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

      const response = await fetch(`/api/tests/historical?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch tests");
      }

      setTests(prev => [...prev, ...data.tests]);
      setHasMore(data.pagination.hasMore);
      setPage(nextPage);
    } catch (error) {
      console.error("Error loading more tests:", error);
    } finally {
      setLoading(false);
    }
  }, [page, loading, hasMore, searchQuery, selectedApp, hasExecutions]);

  // Initial load on mount - use prefetched data if available
  useEffect(() => {
    if (prefetchedData && !initialLoadComplete) {
      // Use prefetched data (instant load!)
      console.log("⚡ Using prefetched historical tests");
      setCachedTests(prefetchedData.tests || []);
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

  // Handle search with debounce
  useEffect(() => {
    if (!searchQuery) return;
    
    const timer = setTimeout(() => {
      setTests([]);
      setPage(1);
      loadInitialTests();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, loadInitialTests]);

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

  return (
    <div className="h-full flex gap-4 min-h-0" data-test-id="historical-test-explorer">
      {/* LEFT SIDEBAR - Compact One-Line Table - Always visible */}
      <div className="w-[40%] min-w-[400px] flex flex-col mac-card rounded-lg border border-[var(--mac-border)] overflow-hidden flex-shrink-0">
        {/* Header */}
        <div className="p-3 border-b border-[var(--mac-border)] bg-[var(--mac-surface-elevated)]">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-light text-white flex items-center gap-2">
              <Archive className="h-4 w-4 text-[var(--mac-primary-blue-400)]" />
              Historical Tests
            </h3>
            <Badge variant="outline" className="text-xs border-[var(--mac-border)] text-[var(--mac-text-secondary)]">
              {total.toLocaleString()}
            </Badge>
          </div>
          
          {/* Compact Search */}
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--mac-text-muted)]" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-8 text-xs bg-[var(--mac-surface-background)] border-[var(--mac-border)] text-white placeholder:text-[var(--mac-text-muted)]"
              data-test-id="search-input"
            />
          </div>
          
          {/* Compact Filters */}
          <div className="flex gap-2 mt-2">
            <select
              value={selectedApp}
              onChange={(e) => setSelectedApp(e.target.value)}
              className="flex-1 h-7 px-2 text-xs bg-[var(--mac-surface-background)] border border-[var(--mac-border)] rounded text-white font-light"
              data-test-id="app-filter"
            >
              <option value="">All Apps</option>
              {filters.apps.map(app => (
                <option key={app} value={app}>{app}</option>
              ))}
            </select>
            
            <select
              value={hasExecutions}
              onChange={(e) => setHasExecutions(e.target.value)}
              className="flex-1 h-7 px-2 text-xs bg-[var(--mac-surface-background)] border border-[var(--mac-border)] rounded text-white font-light"
              data-test-id="execution-filter"
            >
              <option value="">All</option>
              <option value="true">Executed</option>
              <option value="false">Never Run</option>
            </select>
          </div>
        </div>

        {/* Scrollable Table with Infinite Scroll */}
        <div 
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto"
          data-test-id="test-list"
        >
          {!initialLoadComplete ? (
            <div className="p-4 text-center text-[var(--mac-text-secondary)] text-sm">
              Loading first 100 tests...
            </div>
          ) : tests.length === 0 ? (
            <div className="p-8 text-center text-[var(--mac-text-muted)]">
              <Archive className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs font-light">No tests found</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader className="sticky top-0 bg-[var(--mac-surface-elevated)] z-10">
                  <TableRow className="border-b border-[var(--mac-border)] hover:bg-transparent">
                    <TableHead className="w-[60px] h-9 px-2 text-xs font-light text-[var(--mac-text-secondary)]">
                      ID
                    </TableHead>
                    <TableHead className="h-9 px-2 text-xs font-light text-[var(--mac-text-secondary)]">
                      Test Name
                    </TableHead>
                    <TableHead className="w-[90px] h-9 px-2 text-xs font-light text-[var(--mac-text-secondary)]">
                      App
                    </TableHead>
                    <TableHead className="w-[70px] h-9 px-2 text-xs font-light text-[var(--mac-text-secondary)] text-right">
                      Pass %
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
                        data-state={isSelected ? "selected" : undefined}
                        className={cn(
                          "cursor-pointer transition-colors border-b border-[var(--mac-border)]/30",
                          isSelected
                            ? "bg-[var(--mac-primary-blue-400)]/20 hover:bg-[var(--mac-primary-blue-400)]/30"
                            : "hover:bg-[var(--mac-state-hover)]"
                        )}
                        data-test-id={`test-row-${test.id}`}
                      >
                        <TableCell className="py-2 px-2 text-xs font-mono text-[var(--mac-text-muted)]">
                          #{test.id}
                        </TableCell>
                        <TableCell className="py-2 px-2 text-xs font-light text-white truncate max-w-[200px]" title={test.test_name}>
                          {test.test_name || "Unnamed"}
                        </TableCell>
                        <TableCell className="py-2 px-2 text-xs">
                          <Badge variant="outline" className="text-[10px] h-4 px-1.5 border-[var(--mac-border)] text-[var(--mac-text-secondary)] font-light">
                            {test.app_under_test}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-2 px-2 text-xs font-mono text-right">
                          {passRate ? (
                            <span className={cn(
                              "font-medium",
                              parseInt(passRate) >= 80 ? "text-emerald-400" :
                              parseInt(passRate) >= 50 ? "text-yellow-400" :
                              "text-red-400"
                            )}>
                              {passRate}%
                            </span>
                          ) : (
                            <span className="text-[var(--mac-text-muted)]">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              
              {/* Infinite Scroll Loading Indicator */}
              {loading && (
                <div className="p-3 text-center text-[var(--mac-text-secondary)] text-sm font-light bg-[var(--mac-surface-background)]">
                  Loading more tests...
                </div>
              )}
              
              {!hasMore && tests.length > 0 && (
                <div className="p-3 text-center text-[var(--mac-text-muted)] text-xs font-light bg-[var(--mac-surface-background)]">
                  All {total.toLocaleString()} tests loaded
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* RIGHT PANEL - Detailed View */}
      <div className="flex-1 min-w-0 mac-card rounded-lg border border-[var(--mac-border)] overflow-hidden bg-[var(--mac-surface-background)]">
        {selectedTest ? (
          <div className="flex flex-col h-full" data-test-id="test-detail">
            {/* Detail Header */}
            <div className="p-6 border-b border-[var(--mac-border)] bg-[var(--mac-surface-elevated)]">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-xl font-light text-white truncate">{selectedTest.test_name}</h2>
                    {getConfidenceBadge(selectedTest.base_confidence)}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-[var(--mac-text-secondary)] font-light">
                    <span className="flex items-center gap-1">
                      <FileText className="h-3.5 w-3.5" />
                      Test #{selectedTest.id}
                    </span>
                    <span className="text-[var(--mac-border)]">•</span>
                    <Badge variant="outline" className="text-xs border-[var(--mac-border)] text-[var(--mac-text-secondary)]">
                      {selectedTest.app_under_test}
                    </Badge>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedTest(null)}
                  className="text-[var(--mac-text-muted)] hover:text-white hover:bg-[var(--mac-state-hover)] h-8 w-8 p-0 flex-shrink-0"
                  title="Close detail view"
                >
                  ×
                </Button>
              </div>

              {/* Quick Stats Cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-[var(--mac-surface-background)] border border-[var(--mac-border)] hover:border-[var(--mac-primary-blue-400)]/40 transition-colors">
                  <div className="text-xs text-[var(--mac-text-muted)] font-light mb-1.5 flex items-center gap-1.5">
                    <Activity className="h-3.5 w-3.5 text-[var(--mac-primary-blue-400)]" />
                    Executions
                  </div>
                  <div className="text-2xl font-light text-white">
                    {selectedTest.execution_count.toLocaleString()}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-[var(--mac-surface-background)] border border-[var(--mac-border)] hover:border-emerald-500/40 transition-colors">
                  <div className="text-xs text-[var(--mac-text-muted)] font-light mb-1.5 flex items-center gap-1.5">
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                    Pass Rate
                  </div>
                  <div className="text-2xl font-light text-emerald-400">
                    {getPassRate(selectedTest) || "—"}{getPassRate(selectedTest) ? "%" : ""}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-[var(--mac-surface-background)] border border-[var(--mac-border)] hover:border-[var(--mac-text-muted)]/40 transition-colors">
                  <div className="text-xs text-[var(--mac-text-muted)] font-light mb-1.5 flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-[var(--mac-text-muted)]" />
                    JIRA Links
                  </div>
                  <div className="text-2xl font-light text-white">
                    {selectedTest.jira_ticket_count}
                  </div>
                </div>
              </div>
            </div>

            {/* Detail Body - Scrollable */}
            <ScrollArea className="flex-1 p-6">
              {/* Description */}
              {selectedTest.description && (
                <div className="mb-6 p-4 rounded-lg bg-[var(--mac-surface-elevated)] border border-[var(--mac-border)]">
                  <h3 className="text-sm font-medium text-[var(--mac-text-muted)] mb-3 uppercase tracking-wide flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Description
                  </h3>
                  <p className="text-sm text-white font-light leading-relaxed">{selectedTest.description}</p>
                </div>
              )}

              {/* Preconditions */}
              {selectedTest.preconditions && (
                <div className="mb-6 p-4 rounded-lg bg-[var(--mac-surface-elevated)] border border-[var(--mac-border)]">
                  <h3 className="text-sm font-medium text-[var(--mac-text-muted)] mb-3 uppercase tracking-wide flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Preconditions
                  </h3>
                  <p className="text-sm text-[var(--mac-text-secondary)] font-light leading-relaxed">{selectedTest.preconditions}</p>
                </div>
              )}

              {/* Test Script */}
              {selectedTest.test_script && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-[var(--mac-text-muted)] mb-3 uppercase tracking-wide flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Test Script
                  </h3>
                  <pre className="text-xs text-[var(--mac-text-secondary)] font-mono bg-[var(--mac-surface-elevated)] p-4 rounded-lg border border-[var(--mac-border)] overflow-x-auto whitespace-pre-wrap leading-relaxed">
                    {selectedTest.test_script}
                  </pre>
                </div>
              )}

              {/* Metadata */}
              <div className="mb-6 p-4 rounded-lg bg-[var(--mac-surface-elevated)] border border-[var(--mac-border)]">
                <h3 className="text-sm font-medium text-[var(--mac-text-muted)] mb-3 uppercase tracking-wide">
                  Test Metadata
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm font-light">
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--mac-text-muted)]">Category</span>
                    <Badge variant="outline" className="text-xs border-[var(--mac-border)] text-white">
                      {selectedTest.category}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--mac-text-muted)]">Priority</span>
                    <span className="text-white font-medium">{selectedTest.client_priority || "Normal"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--mac-text-muted)]">Security Test</span>
                    <span className={cn(
                      "font-medium",
                      selectedTest.is_security ? "text-amber-400" : "text-[var(--mac-text-secondary)]"
                    )}>
                      {selectedTest.is_security ? "Yes" : "No"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--mac-text-muted)]">Coverage</span>
                    <span className="text-white">{selectedTest.coverage || "N/A"}</span>
                  </div>
                </div>
              </div>

              {/* Execution History */}
              {selectedTest.execution_count > 0 && (
                <div className="mb-6 p-4 rounded-lg bg-[var(--mac-surface-elevated)] border border-[var(--mac-border)]">
                  <h3 className="text-sm font-medium text-[var(--mac-text-muted)] mb-3 uppercase tracking-wide flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Execution History
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm font-light">
                    <div className="flex items-center justify-between">
                      <span className="text-[var(--mac-text-muted)]">Passed</span>
                      <span className="text-emerald-400 font-medium flex items-center gap-1">
                        <CheckCircle className="h-3.5 w-3.5" />
                        {selectedTest.pass_count.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[var(--mac-text-muted)]">Failed</span>
                      <span className="text-red-400 font-medium flex items-center gap-1">
                        <XCircle className="h-3.5 w-3.5" />
                        {selectedTest.fail_count.toLocaleString()}
                      </span>
                    </div>
                    {selectedTest.first_executed_at && (
                      <div className="flex items-center justify-between col-span-2 pt-2 border-t border-[var(--mac-border)]">
                        <span className="text-[var(--mac-text-muted)]">First Run</span>
                        <span className="text-white text-xs font-mono">{new Date(selectedTest.first_executed_at).toLocaleDateString()}</span>
                      </div>
                    )}
                    {selectedTest.last_executed_at && (
                      <div className="flex items-center justify-between col-span-2">
                        <span className="text-[var(--mac-text-muted)]">Last Run</span>
                        <span className="text-white text-xs font-mono">{new Date(selectedTest.last_executed_at).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* AI Confidence Result */}
              {aiConfidence && (
                <div className="mb-4 p-3 bg-[var(--mac-surface-background)] rounded border border-[var(--mac-border)]">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="h-4 w-4 text-[var(--mac-primary-blue-400)]" />
                    <span className="text-sm font-light text-white">AI Analysis</span>
                    {getConfidenceBadge(aiConfidence.score)}
                  </div>
                  <p className="text-sm text-[var(--mac-text-secondary)] font-light">{aiConfidence.rationale}</p>
                </div>
              )}

              {/* Generated Playwright Code */}
              {generatedCode && (
                <div className="mb-4 p-3 bg-[var(--mac-surface-background)] rounded border border-[var(--mac-border)]">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-[var(--mac-primary-blue-400)]" />
                      <span className="text-sm font-light text-white">Generated Playwright Test</span>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        navigator.clipboard.writeText(generatedCode);
                        toast.success("Copied to clipboard!");
                      }}
                      className="text-[var(--mac-primary-blue-400)] hover:text-white font-light h-6 text-xs"
                    >
                      Copy
                    </Button>
                  </div>
                  <pre className="text-xs text-[var(--mac-text-secondary)] font-mono bg-[var(--mac-surface-bg)] p-3 rounded border border-[var(--mac-border)] overflow-x-auto max-h-64">
                    {generatedCode.substring(0, 1500)}
                    {generatedCode.length > 1500 && "\n\n// (truncated - copy for full code)"}
                  </pre>
                </div>
              )}
            </ScrollArea>

            {/* Action Buttons Footer */}
            <div className="p-4 border-t border-[var(--mac-border)] bg-[var(--mac-surface-elevated)]">
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  className="flex-1 mac-button-gradient text-white font-light"
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
                        }),
                      });
                      const data = await res.json();
                      if (data.success) {
                        setGeneratedCode(data.testCode);
                        toast.success("Playwright test generated!");
                      } else {
                        toast.error(data.error || "Failed to generate");
                      }
                    } catch (err) {
                      toast.error("Generation failed");
                    } finally {
                      setGeneratingPlaywright(false);
                    }
                  }}
                  disabled={generatingPlaywright}
                  data-test-id="generate-playwright-btn"
                >
                  {generatingPlaywright ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4 mr-2" />
                  )}
                  {generatingPlaywright ? "Generating..." : "Generate Playwright"}
                </Button>
                
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex-1 border-[var(--mac-border)] text-white hover:bg-[var(--mac-surface-elevated)] hover:border-[var(--mac-primary-blue-400)] font-light"
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
                      setAiConfidence({ score: data.score, rationale: data.rationale });
                      toast.success(`AI Confidence: ${Math.round(data.score * 100)}%`);
                    } catch (err) {
                      toast.error("Confidence calculation failed");
                    } finally {
                      setCalculatingConfidence(false);
                    }
                  }}
                  disabled={calculatingConfidence}
                  data-test-id="calculate-confidence-btn"
                >
                  {calculatingConfidence ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Zap className="h-4 w-4 mr-2" />
                  )}
                  {calculatingConfidence ? "Analyzing..." : "AI Confidence"}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          // Empty state - no test selected
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="w-16 h-16 rounded-full bg-[var(--mac-surface-elevated)] flex items-center justify-center mb-4">
              <FileText className="h-8 w-8 text-[var(--mac-text-muted)]" />
            </div>
            <h3 className="text-lg font-light text-white mb-2">No Test Selected</h3>
            <p className="text-sm text-[var(--mac-text-secondary)] font-light max-w-md">
              Select a test from the list on the left to view details, execution history, and AI-powered features.
            </p>
            <div className="mt-6 flex flex-col gap-2 text-xs text-[var(--mac-text-muted)] font-light">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[var(--mac-primary-blue-400)]" />
                <span>Generate Playwright tests from historical data</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-[var(--mac-primary-blue-400)]" />
                <span>Calculate AI confidence scores</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-[var(--mac-primary-blue-400)]" />
                <span>View execution history and pass rates</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default HistoricalTestExplorer;
