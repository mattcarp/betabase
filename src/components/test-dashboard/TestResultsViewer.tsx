"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  FileText,
  Code,
  Download,
  Filter,
  Search,
  ChevronDown,
  ChevronRight,
  Terminal,
  Copy,
  ExternalLink,
  Calendar,
  RefreshCw,
  PlayCircle,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { enhancedSupabaseTestDB } from "../../services/supabase-test-integration-enhanced";
import { VisualRegressionComparison, VisualRegressionComparisonType } from "../visual-regression";
import { visualRegressionService } from "../../services/visualRegressionService";

interface TestResult {
  id: string;
  name: string;
  suite: string;
  status: "passed" | "failed" | "skipped";
  duration: number;
  timestamp: Date;
  error?: {
    message: string;
    stack: string;
    expected?: string;
    actual?: string;
  };
  logs?: string[];
  screenshots?: string[];
  video?: string;
  visualComparison?: VisualRegressionComparisonType; // Visual regression data
}

export const TestResultsViewer: React.FC = () => {
  const [selectedResult, setSelectedResult] = useState<TestResult | null>(null);
  const [expandedSuites, setExpandedSuites] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<"all" | "passed" | "failed" | "skipped">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState<{
    from: Date | null;
    to: Date | null;
  }>({ from: null, to: null });
  const [sortBy, setSortBy] = useState<"name" | "duration" | "date">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch test results from Supabase on mount
  useEffect(() => {
    fetchTestResults();
  }, []);

  const fetchTestResults = async () => {
    setIsLoading(true);
    try {
      // Fetch from Supabase
      const results = await enhancedSupabaseTestDB.getTestResults({
        limit: 100,
      });

      // Transform Supabase data to our TestResult format
      const transformedResults: TestResult[] = results.map((r: any) => ({
        id: r.id,
        name: r.test_name || "Unnamed Test",
        suite: r.suite_name || "Default Suite",
        status: r.status || "pending",
        duration: r.duration || 0,
        timestamp: new Date(r.created_at),
        error: r.error_message
          ? {
              message: r.error_message,
              stack: r.stack_trace || "",
              expected: r.metadata?.expected,
              actual: r.metadata?.actual,
            }
          : undefined,
        logs: r.console_logs ? [r.console_logs].flat() : [],
        screenshots: r.screenshot_url ? [r.screenshot_url] : [],
        video: r.metadata?.video_url,
      }));

      // If no results from Supabase, use mock data for demo
      if (transformedResults.length === 0) {
        setTestResults(getMockTestResults());
      } else {
        setTestResults(transformedResults);
      }
    } catch (error) {
      console.error("Error fetching test results:", error);
      // Fall back to mock data on error
      setTestResults(getMockTestResults());
    } finally {
      setIsLoading(false);
    }
  };

  const getMockTestResults = (): TestResult[] => [
    {
      id: "1",
      name: "Should authenticate with valid credentials",
      suite: "Authentication",
      status: "passed",
      duration: 1234,
      timestamp: new Date(),
      logs: [
        "Starting authentication test...",
        "Navigating to login page",
        "Entering credentials",
        "Submitting form",
        "Authentication successful",
      ],
    },
    {
      id: "2",
      name: "Should reject invalid credentials",
      suite: "Authentication",
      status: "failed",
      duration: 892,
      timestamp: new Date(),
      error: {
        message: "Expected authentication to fail but it succeeded",
        stack: `Error: Expected authentication to fail but it succeeded
    at Context.<anonymous> (tests/auth.spec.ts:45:15)
    at processTicksAndRejections (internal/process/task_queues.js:97:5)`,
        expected: "Authentication failed",
        actual: "Authentication successful",
      },
      logs: [
        "Starting authentication test...",
        "Navigating to login page",
        "Entering invalid credentials",
        "Submitting form",
        "ERROR: Unexpected authentication success",
      ],
      screenshots: ["screenshot-1.png", "screenshot-2.png"],
    },
    {
      id: "3",
      name: "Should handle magic link authentication",
      suite: "Authentication",
      status: "passed",
      duration: 3456,
      timestamp: new Date(),
    },
    {
      id: "4",
      name: "Should stream chat responses",
      suite: "Chat Interface",
      status: "passed",
      duration: 2100,
      timestamp: new Date(),
    },
    {
      id: "5",
      name: "Should handle file uploads",
      suite: "Chat Interface",
      status: "failed",
      duration: 1500,
      timestamp: new Date(),
      error: {
        message: "File upload failed: Network timeout",
        stack: `Error: File upload failed: Network timeout
    at uploadFile (tests/chat.spec.ts:120:10)
    at Context.<anonymous> (tests/chat.spec.ts:125:5)`,
      },
    },
    {
      id: "6",
      name: "Should display error boundaries correctly",
      suite: "Error Handling",
      status: "skipped",
      duration: 0,
      timestamp: new Date(),
    },
  ];

  const groupedResults = testResults.reduce(
    (acc, result) => {
      if (!acc[result.suite]) {
        acc[result.suite] = [];
      }
      acc[result.suite].push(result);
      return acc;
    },
    {} as Record<string, TestResult[]>
  );

  // Enhanced filtering with search and date range
  const filteredResults = useMemo(() => {
    let results = [...testResults];

    // Status filter
    if (filter !== "all") {
      results = results.filter((r) => r.status === filter);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      results = results.filter(
        (r) =>
          r.name.toLowerCase().includes(query) ||
          r.suite.toLowerCase().includes(query) ||
          r.error?.message.toLowerCase().includes(query)
      );
    }

    // Date range filter
    if (dateRange.from) {
      results = results.filter((r) => r.timestamp >= dateRange.from!);
    }
    if (dateRange.to) {
      const endOfDay = new Date(dateRange.to);
      endOfDay.setHours(23, 59, 59, 999);
      results = results.filter((r) => r.timestamp <= endOfDay);
    }

    // Sorting
    results.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "duration":
          comparison = a.duration - b.duration;
          break;
        case "date":
          comparison = a.timestamp.getTime() - b.timestamp.getTime();
          break;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return results;
  }, [testResults, filter, searchQuery, dateRange, sortBy, sortOrder]);

  const handleRerunTest = async (testId: string) => {
    try {
      const testToRerun = testResults.find((t) => t.id === testId);
      if (!testToRerun) return;

      // Call the test execution API
      const response = await fetch("/api/test/execute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          testSuite: testToRerun.suite,
          testFiles: [testToRerun.name],
          options: {
            rerun: true,
            testId: testId,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to start test re-run");
      }

      const data = await response.json();
      console.log("Test re-run started:", data);

      // Create test execution record in Supabase
      await enhancedSupabaseTestDB.createTestExecution({
        run_id: data.executionId,
        execution_id: data.executionId,
        suite_name: testToRerun.suite,
        total_tests: 1,
        passed: 0,
        failed: 0,
        skipped: 0,
        environment: "development",
        triggered_by: "manual",
        metadata: {
          rerun: true,
          original_test_id: testId,
        },
      });

      // Update UI to show test is running
      alert(`Re-running test: ${testToRerun.name}\nExecution ID: ${data.executionId}`);

      // Refresh test results after a delay
      setTimeout(fetchTestResults, 3000);
    } catch (error) {
      console.error("Error re-running test:", error);
      alert("Failed to re-run test. Please try again.");
    }
  };

  const handleExportResults = () => {
    // TODO: Implement export functionality
    const data = filteredResults.map((r) => ({
      name: r.name,
      suite: r.suite,
      status: r.status,
      duration: r.duration,
      timestamp: r.timestamp.toISOString(),
      error: r.error?.message || "",
    }));

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `test-results-${new Date().toISOString()}.json`;
    a.click();
  };

  const toggleSuite = (suite: string) => {
    const newExpanded = new Set(expandedSuites);
    if (newExpanded.has(suite)) {
      newExpanded.delete(suite);
    } else {
      newExpanded.add(suite);
    }
    setExpandedSuites(newExpanded);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "passed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "skipped":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSuiteStats = (suite: string) => {
    const suiteResults = groupedResults[suite];
    return {
      total: suiteResults.length,
      passed: suiteResults.filter((r) => r.status === "passed").length,
      failed: suiteResults.filter((r) => r.status === "failed").length,
      skipped: suiteResults.filter((r) => r.status === "skipped").length,
    };
  };

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Results List */}
      <div className="col-span-5">
        <Card className="mac-card">
          <CardHeader className="mac-card">
            <div className="space-y-4">
              {/* Title and Action Buttons */}
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Test Results</CardTitle>
                <div className="flex gap-2">
                  <Button
                    className="mac-button mac-button-outline"
                    variant="outline"
                    className="mac-button mac-button-outline"
                    size="sm"
                    onClick={handleExportResults}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                  <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        className="mac-button mac-button-outline"
                        variant="outline"
                        className="mac-button mac-button-outline"
                        size="sm"
                      >
                        <Filter className="h-4 w-4 mr-2" />
                        Filters
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80" align="end">
                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm">Date Range</Label>
                          <div className="flex gap-2 mt-2">
                            <Input
                              className="mac-input"
                              type="date"
                              placeholder="From"
                              onChange={(e) =>
                                setDateRange({
                                  ...dateRange,
                                  from: e.target.value ? new Date(e.target.value) : null,
                                })
                              }
                            />
                            <Input
                              className="mac-input"
                              type="date"
                              placeholder="To"
                              onChange={(e) =>
                                setDateRange({
                                  ...dateRange,
                                  to: e.target.value ? new Date(e.target.value) : null,
                                })
                              }
                            />
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm">Sort By</Label>
                          <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                            <SelectTrigger className="mt-2">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="name">Name</SelectItem>
                              <SelectItem value="duration">Duration</SelectItem>
                              <SelectItem value="date">Date</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-sm">Sort Order</Label>
                          <Select value={sortOrder} onValueChange={(v: any) => setSortOrder(v)}>
                            <SelectTrigger className="mt-2">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="asc">Ascending</SelectItem>
                              <SelectItem value="desc">Descending</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full mac-button mac-button-outline"
                          onClick={() => {
                            setDateRange({ from: null, to: null });
                            setSortBy("date");
                            setSortOrder("desc");
                            setSearchQuery("");
                            setFilter("all");
                          }}
                        >
                          Reset Filters
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  className="mac-input"
                  placeholder="Search tests by name, suite, or error..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Status Filter Buttons */}
              <div className="flex gap-2">
                <Button
                  className="mac-button mac-button-primary"
                  variant={filter === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("all")}
                >
                  All ({testResults.length})
                </Button>
                <Button
                  className="mac-button mac-button-primary"
                  variant={filter === "passed" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("passed")}
                >
                  <CheckCircle className="h-3 w-3 mr-2" />
                  Passed ({testResults.filter((r) => r.status === "passed").length})
                </Button>
                <Button
                  className="mac-button mac-button-primary"
                  variant={filter === "failed" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("failed")}
                >
                  <XCircle className="h-3 w-3 mr-2" />
                  Failed ({testResults.filter((r) => r.status === "failed").length})
                </Button>
                <Button
                  className="mac-button mac-button-primary"
                  variant={filter === "skipped" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter("skipped")}
                >
                  <AlertTriangle className="h-3 w-3 mr-2" />
                  Skipped ({testResults.filter((r) => r.status === "skipped").length})
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[600px]">
              {isLoading ? (
                <div className="flex items-center justify-center h-full p-8">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="mac-body text-muted-foreground">Loading test results...</p>
                  </div>
                </div>
              ) : (
                <div className="p-4 space-y-4">
                  {Object.entries(groupedResults)
                    .filter(([suite, results]) => results.some((r) => filteredResults.includes(r)))
                    .map(([suite, results]) => {
                      const filteredSuiteResults = results.filter((r) =>
                        filteredResults.includes(r)
                      );
                      const stats = {
                        total: filteredSuiteResults.length,
                        passed: filteredSuiteResults.filter((r) => r.status === "passed").length,
                        failed: filteredSuiteResults.filter((r) => r.status === "failed").length,
                        skipped: filteredSuiteResults.filter((r) => r.status === "skipped").length,
                      };
                      const isExpanded = expandedSuites.has(suite);

                      return (
                        <div key={suite}>
                          <div
                            className="flex items-center justify-between p-4 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted/70 transition-colors"
                            onClick={() => toggleSuite(suite)}
                          >
                            <div className="flex items-center gap-2">
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                              <span className="font-medium">{suite}</span>
                            </div>
                            <div className="flex gap-2">
                              <Badge variant="secondary">{stats.total}</Badge>
                              {stats.passed > 0 && (
                                <Badge className="bg-green-500/20 text-green-500">
                                  {stats.passed}
                                </Badge>
                              )}
                              {stats.failed > 0 && (
                                <Badge className="bg-red-500/20 text-red-500">{stats.failed}</Badge>
                              )}
                              {stats.skipped > 0 && (
                                <Badge className="bg-yellow-500/20 text-yellow-500">
                                  {stats.skipped}
                                </Badge>
                              )}
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="mt-2 space-y-2 pl-6">
                              {filteredSuiteResults.map((result) => (
                                <Card
                                  key={result.id}
                                  className={cn(
                                    "mac-card",
                                    "cursor-pointer transition-all hover:shadow-md",
                                    selectedResult?.id === result.id && "ring-2 ring-primary",
                                    result.status === "failed" && "border-red-500/20",
                                    result.status === "passed" && "border-green-500/20",
                                    result.status === "skipped" && "border-yellow-500/20"
                                  )}
                                  onClick={() => setSelectedResult(result)}
                                >
                                  <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2 flex-1">
                                        {getStatusIcon(result.status)}
                                        <span className="text-sm truncate">{result.name}</span>
                                      </div>
                                      <Badge variant="secondary" className="text-xs">
                                        {result.duration}ms
                                      </Badge>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Result Details */}
      <div className="col-span-7">
        {selectedResult ? (
          <Card className="mac-card h-full">
            <CardHeader className="mac-card">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{selectedResult.name}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-2">
                    {selectedResult.suite} • {selectedResult.timestamp.toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    className="mac-button mac-button-outline"
                    variant="outline"
                    className="mac-button mac-button-outline"
                    size="sm"
                    onClick={() => handleRerunTest(selectedResult.id)}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Re-run
                  </Button>
                  {getStatusIcon(selectedResult.status)}
                  <Badge
                    variant={
                      selectedResult.status === "passed"
                        ? "default"
                        : selectedResult.status === "failed"
                          ? "destructive"
                          : "secondary"
                    }
                  >
                    {selectedResult.status.toUpperCase()}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="mac-card">
              <Tabs defaultValue="error" className="h-full">
                <TabsList
                  className={cn(
                    "grid w-full",
                    selectedResult.visualComparison ? "grid-cols-5" : "grid-cols-4"
                  )}
                >
                  <TabsTrigger value="error">Error</TabsTrigger>
                  <TabsTrigger value="logs">Logs</TabsTrigger>
                  <TabsTrigger value="media">Media</TabsTrigger>
                  <TabsTrigger value="code">Code</TabsTrigger>
                  {selectedResult.visualComparison && (
                    <TabsTrigger value="visual">Visual Diff</TabsTrigger>
                  )}
                </TabsList>

                <TabsContent value="error" className="space-y-4">
                  {selectedResult.error ? (
                    <>
                      <Card className="mac-card bg-red-500/10 border-red-500/20">
                        <CardContent className="p-4">
                          <h3
                            className="mac-title"
                            className="mac-title font-medium text-red-500 mb-2"
                          >
                            Error Message
                          </h3>
                          <p className="text-sm font-mono">{selectedResult.error.message}</p>
                        </CardContent>
                      </Card>

                      {(selectedResult.error.expected || selectedResult.error.actual) && (
                        <div className="grid grid-cols-2 gap-4">
                          <Card className="mac-card">
                            <CardContent className="p-4">
                              <h3
                                className="mac-title"
                                className="mac-title font-medium text-green-500 mb-2"
                              >
                                Expected
                              </h3>
                              <p className="text-sm font-mono">
                                {selectedResult.error.expected || "N/A"}
                              </p>
                            </CardContent>
                          </Card>
                          <Card className="mac-card">
                            <CardContent className="p-4">
                              <h3
                                className="mac-title"
                                className="mac-title font-medium text-red-500 mb-2"
                              >
                                Actual
                              </h3>
                              <p className="text-sm font-mono">
                                {selectedResult.error.actual || "N/A"}
                              </p>
                            </CardContent>
                          </Card>
                        </div>
                      )}

                      <Card className="mac-card">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="mac-title">
                              Stack Trace
                            </h3>
                            <Button
                              className="mac-button mac-button-outline"
                              variant="ghost"
                              className="mac-button mac-button-outline"
                              size="sm"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                          <pre className="text-xs font-mono bg-muted p-4 rounded overflow-x-auto">
                            {selectedResult.error.stack}
                          </pre>
                        </CardContent>
                      </Card>
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-[400px] text-muted-foreground">
                      No errors for this test
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="logs">
                  {selectedResult.logs && selectedResult.logs.length > 0 ? (
                    <Card className="mac-card">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-4">
                          <h3
                            className="mac-title"
                            className="mac-title font-medium flex items-center gap-2"
                          >
                            <Terminal className="h-4 w-4" />
                            Console Output
                          </h3>
                          <Button
                            className="mac-button mac-button-outline"
                            variant="ghost"
                            className="mac-button mac-button-outline"
                            size="sm"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                        <ScrollArea className="h-[400px]">
                          <div className="space-y-1">
                            {selectedResult.logs.map((log, index) => (
                              <div
                                key={index}
                                className="font-mono text-xs p-2 hover:bg-muted rounded"
                              >
                                <span className="text-muted-foreground mr-4">
                                  {String(index + 1).padStart(3, "0")}
                                </span>
                                {log}
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="flex items-center justify-center h-[400px] text-muted-foreground">
                      No logs available
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="media">
                  {selectedResult.screenshots && selectedResult.screenshots.length > 0 ? (
                    <div className="space-y-4">
                      <h3 className="mac-title">
                        Screenshots
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        {selectedResult.screenshots.map((screenshot, index) => (
                          <Card className="mac-card" key={index}>
                            <CardContent className="p-4">
                              <div className="aspect-video bg-muted rounded flex items-center justify-center">
                                <FileText className="h-8 w-8 text-muted-foreground" />
                              </div>
                              <p className="text-sm mt-2">{screenshot}</p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-[400px] text-muted-foreground">
                      No media attachments
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="code">
                  <Card className="mac-card">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3
                          className="mac-title"
                          className="mac-title font-medium flex items-center gap-2"
                        >
                          <Code className="h-4 w-4" />
                          Test Source
                        </h3>
                        <Button
                          className="mac-button mac-button-outline"
                          variant="ghost"
                          className="mac-button mac-button-outline"
                          size="sm"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                      <pre className="text-xs font-mono bg-muted p-4 rounded overflow-x-auto">
                        {`describe('${selectedResult.suite}', () => {
  it('${selectedResult.name}', async () => {
    // Test implementation
    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="password"]', 'password');
    await page.click('[data-testid="submit"]');
    
    await expect(page).toHaveURL('/dashboard');
  });
});`}
                      </pre>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Visual Regression Tab */}
                {selectedResult.visualComparison && (
                  <TabsContent value="visual" className="space-y-4">
                    <VisualRegressionComparison
                      comparison={selectedResult.visualComparison}
                      onApprove={async (id, comment) => {
                        try {
                          await visualRegressionService.approveComparison(id, comment);
                          alert("Visual regression approved!");
                          fetchTestResults(); // Refresh
                        } catch (error) {
                          console.error("Failed to approve:", error);
                          alert("Failed to approve comparison");
                        }
                      }}
                      onReject={async (id, reason) => {
                        try {
                          await visualRegressionService.rejectComparison(id, reason);
                          alert("Visual regression rejected!");
                          fetchTestResults(); // Refresh
                        } catch (error) {
                          console.error("Failed to reject:", error);
                          alert("Failed to reject comparison");
                        }
                      }}
                      onUpdateBaseline={async (id) => {
                        try {
                          await visualRegressionService.updateBaseline(id);
                          alert("Baseline updated!");
                          fetchTestResults(); // Refresh
                        } catch (error) {
                          console.error("Failed to update baseline:", error);
                          alert("Failed to update baseline");
                        }
                      }}
                      onAddComment={async (id, comment) => {
                        try {
                          await visualRegressionService.addComment(id, comment);
                        } catch (error) {
                          console.error("Failed to add comment:", error);
                        }
                      }}
                    />
                  </TabsContent>
                )}
              </Tabs>
            </CardContent>
          </Card>
        ) : (
          <Card className="mac-card h-full">
            <CardContent className="flex items-center justify-center h-full text-muted-foreground">
              Select a test result to view details
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default TestResultsViewer;
