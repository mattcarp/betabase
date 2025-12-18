/**
 * Historical Test Explorer Component
 * 
 * Browse and interact with 8,700+ historical tests from bb_case
 * Part of Testing Tab Transformation - Phase 2 (US1)
 */

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { ScrollArea } from "../ui/scroll-area";
import { 
  Archive, 
  Search, 
  RefreshCw,
  Filter,
  FileText,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp
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

export function HistoricalTestExplorer() {
  const [tests, setTests] = useState<HistoricalTest[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedApp, setSelectedApp] = useState<string>("");
  const [hasExecutions, setHasExecutions] = useState<string>("");
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 0,
    hasMore: false,
  });
  const [filters, setFilters] = useState<Filters>({ categories: [], apps: [] });
  const [selectedTest, setSelectedTest] = useState<HistoricalTest | null>(null);
  const [generatingPlaywright, setGeneratingPlaywright] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [calculatingConfidence, setCalculatingConfidence] = useState(false);
  const [aiConfidence, setAiConfidence] = useState<{ score: number; rationale: string } | null>(null);

  const loadTests = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (searchQuery) params.set("search", searchQuery);
      if (selectedCategory) params.set("category", selectedCategory);
      if (selectedApp) params.set("app", selectedApp);
      if (hasExecutions) params.set("hasExecutions", hasExecutions);

      const response = await fetch(`/api/tests/historical?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch tests");
      }

      setTests(data.tests);
      setPagination(data.pagination);
      setFilters(data.filters);
    } catch (error) {
      console.error("Error loading tests:", error);
      toast.error("Failed to load historical tests");
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, searchQuery, selectedCategory, selectedApp, hasExecutions]);

  useEffect(() => {
    loadTests();
  }, [loadTests]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    loadTests();
  };

  const goToPage = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.8) {
      return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/40 font-light">High ({Math.round(confidence * 100)}%)</Badge>;
    } else if (confidence >= 0.5) {
      return <Badge className="bg-[var(--mac-primary-blue-400)]/20 text-[var(--mac-primary-blue-400)] border-[var(--mac-primary-blue-400)]/40 font-light">Medium ({Math.round(confidence * 100)}%)</Badge>;
    } else {
      return <Badge className="bg-[#333] text-[#888] border-[#444] font-light">Low ({Math.round(confidence * 100)}%)</Badge>;
    }
  };

  const getPassRate = (test: HistoricalTest) => {
    if (test.execution_count === 0) return null;
    const rate = (test.pass_count / test.execution_count) * 100;
    return rate.toFixed(1);
  };

  return (
    <Card className="h-full flex flex-col mac-card" data-test-id="historical-test-explorer">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-white font-light text-xl">
          <Archive className="h-5 w-5 text-[var(--mac-primary-blue-400)]" />
          Historical Test Suite
        </CardTitle>
        <CardDescription className="text-[#a3a3a3] font-light">
          {pagination.total.toLocaleString()} tests from legacy Betabase • Real QA data
        </CardDescription>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col space-y-4 min-h-0">
        {/* Search and Filters */}
        <form onSubmit={handleSearch} className="flex gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#a3a3a3]" />
            <Input
              placeholder="Search tests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-[#141414] border-[#333] text-white placeholder:text-[#666] focus:border-[var(--mac-primary-blue-400)]"
              data-test-id="search-input"
            />
          </div>
          
          <select
            value={selectedApp}
            onChange={(e) => { setSelectedApp(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
            className="px-3 py-2 bg-[#141414] border border-[#333] rounded-md text-white text-sm font-light"
            data-test-id="app-filter"
          >
            <option value="">All Apps</option>
            {filters.apps.map(app => (
              <option key={app} value={app}>{app}</option>
            ))}
          </select>

          <select
            value={hasExecutions}
            onChange={(e) => { setHasExecutions(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
            className="px-3 py-2 bg-[#141414] border border-[#333] rounded-md text-white text-sm font-light"
            data-test-id="execution-filter"
          >
            <option value="">All Tests</option>
            <option value="true">With Executions</option>
            <option value="false">Never Executed</option>
          </select>

          <Button 
            type="submit" 
            variant="outline" 
            size="sm"
            className="border-[#333] hover:bg-[#1a1a1a] hover:border-[var(--mac-primary-blue-400)] text-white font-light"
            data-test-id="search-button"
          >
            <Filter className="h-4 w-4 mr-1" /> Apply
          </Button>

          <Button 
            type="button" 
            variant="ghost" 
            size="sm"
            onClick={() => { 
              setSearchQuery(""); 
              setSelectedApp(""); 
              setHasExecutions("");
              setPagination(p => ({ ...p, page: 1 }));
            }}
            className="text-[#a3a3a3] hover:text-white font-light"
          >
            <RefreshCw className="h-4 w-4 mr-1" /> Reset
          </Button>
        </form>

        {/* Quick Stats */}
        <div className="flex gap-4 text-sm text-[#a3a3a3] font-light">
          <span className="flex items-center gap-1">
            <FileText className="h-4 w-4" /> {pagination.total.toLocaleString()} total
          </span>
          <span className="flex items-center gap-1">
            <TrendingUp className="h-4 w-4 text-[var(--mac-primary-blue-400)]" /> Page {pagination.page} of {pagination.totalPages}
          </span>
        </div>

        {/* Test List */}
        <ScrollArea className="flex-1 min-h-[300px] -mx-4 px-4" data-test-id="test-list">
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-24 bg-[#1a1a1a] rounded-lg animate-pulse" />
              ))}
            </div>
          ) : tests.length === 0 ? (
            <div className="text-center py-12 text-[#666]">
              <Archive className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-light">No tests found matching your criteria</p>
            </div>
          ) : (
            <div className="space-y-2">
              {tests.map((test) => (
                <div
                  key={test.id}
                  onClick={() => setSelectedTest(test)}
                  className={cn(
                    "p-4 rounded-lg border cursor-pointer transition-all duration-150",
                    selectedTest?.id === test.id
                      ? "bg-[#1a1a2e] border-[var(--mac-primary-blue-400)]/50"
                      : "bg-[#141414] border-[#333] hover:bg-[#1a1a1a] hover:border-[#444]"
                  )}
                  data-test-id={`test-row-${test.id}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-light text-white truncate">
                          {test.test_name || "Unnamed Test"}
                        </h4>
                        {getConfidenceBadge(test.base_confidence)}
                      </div>
                      <p className="text-sm text-[#a3a3a3] font-light line-clamp-2">
                        {test.description || "No description available"}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-[#888] font-light">
                        <Badge variant="outline" className="text-xs border-[#444] text-[#a3a3a3]">
                          {test.app_under_test}
                        </Badge>
                        <Badge variant="outline" className="text-xs border-[#444] text-[#a3a3a3]">
                          {test.category}
                        </Badge>
                        {test.execution_count > 0 && (
                          <span className="flex items-center gap-1 text-emerald-400">
                            <CheckCircle className="h-3 w-3" />
                            {getPassRate(test)}% pass rate
                          </span>
                        )}
                        {test.execution_count === 0 && (
                          <span className="flex items-center gap-1 text-[#666]">
                            <Clock className="h-3 w-3" />
                            Never executed
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right text-xs text-[#888] shrink-0 font-light">
                      <div>#{test.id}</div>
                      <div>{test.execution_count} runs</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Pagination */}
        <div className="flex items-center justify-between pt-2 border-t border-[#333]">
          <Button
            variant="ghost"
            size="sm"
            disabled={pagination.page <= 1}
            onClick={() => goToPage(pagination.page - 1)}
            className="text-[#a3a3a3] font-light hover:text-white"
            data-test-id="prev-page"
          >
            <ChevronLeft className="h-4 w-4 mr-1" /> Previous
          </Button>
          
          <div className="flex items-center gap-1">
            {[...Array(Math.min(5, pagination.totalPages))].map((_, i) => {
              const pageNum = pagination.page <= 3 
                ? i + 1 
                : pagination.page + i - 2;
              if (pageNum < 1 || pageNum > pagination.totalPages) return null;
              return (
                <Button
                  key={pageNum}
                  variant={pageNum === pagination.page ? "default" : "ghost"}
                  size="sm"
                  onClick={() => goToPage(pageNum)}
                  className={cn(
                    "w-8 h-8 p-0 font-light",
                    pageNum === pagination.page 
                      ? "bg-[var(--mac-primary-blue-400)] text-white" 
                      : "text-[#a3a3a3] hover:text-white"
                  )}
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>

          <Button
            variant="ghost"
            size="sm"
            disabled={!pagination.hasMore}
            onClick={() => goToPage(pagination.page + 1)}
            className="text-[#a3a3a3] font-light hover:text-white"
            data-test-id="next-page"
          >
            Next <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>

        {/* Selected Test Detail */}
        {selectedTest && (
          <div className="p-4 bg-[#141414] rounded-lg border border-[#333] mt-2" data-test-id="test-detail">
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-light text-white text-lg">{selectedTest.test_name}</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedTest(null)}
                className="text-[#888] hover:text-white -mr-2 -mt-2"
              >
                ×
              </Button>
            </div>
            <p className="text-sm text-[#a3a3a3] font-light mb-3">{selectedTest.description}</p>
            
            <div className="grid grid-cols-2 gap-4 text-sm font-light">
              <div>
                <span className="text-[#888]">App:</span>
                <span className="ml-2 text-white">{selectedTest.app_under_test}</span>
              </div>
              <div>
                <span className="text-[#888]">Category:</span>
                <span className="ml-2 text-white">{selectedTest.category}</span>
              </div>
              <div>
                <span className="text-[#888]">Executions:</span>
                <span className="ml-2 text-white">{selectedTest.execution_count}</span>
              </div>
              <div>
                <span className="text-[#888]">Pass/Fail:</span>
                <span className="ml-2">
                  <span className="text-emerald-400">{selectedTest.pass_count}</span>
                  <span className="text-[#666]"> / </span>
                  <span className="text-red-400">{selectedTest.fail_count}</span>
                </span>
              </div>
              <div>
                <span className="text-[#888]">Confidence:</span>
                <span className="ml-2">{getConfidenceBadge(selectedTest.base_confidence)}</span>
              </div>
              <div>
                <span className="text-[#888]">Jira Links:</span>
                <span className="ml-2 text-white">{selectedTest.jira_ticket_count}</span>
              </div>
            </div>

            {selectedTest.preconditions && (
              <div className="mt-3 pt-3 border-t border-[#333]">
                <span className="text-[#888] text-sm font-light">Preconditions:</span>
                <p className="text-sm text-[#a3a3a3] font-light mt-1">{selectedTest.preconditions}</p>
              </div>
            )}

            <div className="flex gap-2 mt-4">
              <Button 
                size="sm" 
                className="mac-button-gradient text-white font-light"
                onClick={async () => {
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
                  <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-1" />
                )}
                {generatingPlaywright ? "Generating..." : "Generate Playwright"}
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="border-[#444] text-white hover:bg-[#1a1a1a] hover:border-[var(--mac-primary-blue-400)] font-light"
                onClick={async () => {
                  setCalculatingConfidence(true);
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
                  <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <TrendingUp className="h-4 w-4 mr-1" />
                )}
                {calculatingConfidence ? "Analyzing..." : "AI Confidence"}
              </Button>
            </div>

            {/* AI Confidence Result */}
            {aiConfidence && (
              <div className="mt-3 p-3 bg-[#0c0c0c] rounded border border-[#333]">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[#888] text-sm font-light">AI Analysis:</span>
                  {getConfidenceBadge(aiConfidence.score)}
                </div>
                <p className="text-sm text-[#a3a3a3] font-light">{aiConfidence.rationale}</p>
              </div>
            )}

            {/* Generated Playwright Code */}
            {generatedCode && (
              <div className="mt-3 p-3 bg-[#0c0c0c] rounded border border-[#333]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[#888] text-sm font-light">Generated Playwright Test:</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      navigator.clipboard.writeText(generatedCode);
                      toast.success("Copied to clipboard!");
                    }}
                    className="text-[var(--mac-primary-blue-400)] hover:text-white font-light"
                  >
                    Copy
                  </Button>
                </div>
                <pre className="text-xs text-[#a3a3a3] overflow-x-auto max-h-64 p-2 bg-[#0a0a0a] rounded font-mono">
                  {generatedCode.substring(0, 1500)}
                  {generatedCode.length > 1500 && "...\n\n// (truncated - copy for full code)"}
                </pre>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default HistoricalTestExplorer;
