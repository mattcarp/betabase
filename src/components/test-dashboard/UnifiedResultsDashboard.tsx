"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { ScrollArea } from "../ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Users,
  Bot,
  Layers,
  Search,
  Filter,
  Download,
  Calendar,
  TrendingUp,
  Activity,
  Eye,
  PlayCircle,
  StopCircle,
  Grid3x3,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { enhancedSupabaseTestDB } from "../../services/supabase-test-integration-enhanced";

// Type definitions
type TestType = "manual" | "automated";
type ViewMode = "manual" | "automated" | "combined";
type TestStatus = "passed" | "failed" | "skipped" | "in-progress";

interface UnifiedTestResult {
  id: string;
  name: string;
  type: TestType;
  status: TestStatus;
  duration: number;
  timestamp: Date;
  tester?: string; // For manual tests
  suite?: string; // For automated tests
  area?: string; // UI area tested
  coverage?: string[]; // Features/areas covered
  error?: {
    message: string;
    stack?: string;
  };
  findings?: string[]; // For manual tests
  screenshots?: string[];
  video?: string;
  metadata?: any;
}

interface CoverageData {
  area: string;
  manualTests: number;
  automatedTests: number;
  totalCoverage: number;
  lastTested: Date;
}

interface MetricsSummary {
  manual: {
    total: number;
    passed: number;
    failed: number;
    inProgress: number;
    avgDuration: number;
  };
  automated: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    avgDuration: number;
  };
  combined: {
    total: number;
    passed: number;
    failed: number;
    coverage: number;
    uniqueAreas: number;
  };
}

export const UnifiedResultsDashboard: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>("combined");
  const [results, setResults] = useState<UnifiedTestResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<UnifiedTestResult | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | TestStatus>("all");
  const [dateRange, setDateRange] = useState<{ from: Date | null; to: Date | null }>({
    from: null,
    to: null,
  });
  const [sortBy, setSortBy] = useState<"date" | "duration" | "name">("date");
  const [isLoading, setIsLoading] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(false);

  // Fetch unified test results
  useEffect(() => {
    fetchUnifiedResults();
  }, []);

  const fetchUnifiedResults = async () => {
    setIsLoading(true);
    try {
      // Fetch automated test results
      const automatedResults = await enhancedSupabaseTestDB.getTestResults({
        limit: 100,
      });

      // Transform automated results
      const transformedAutomated: UnifiedTestResult[] = automatedResults.map((r: any) => ({
        id: `auto-${r.id}`,
        name: r.test_name || "Unnamed Test",
        type: "automated" as TestType,
        status: r.status || "skipped",
        duration: r.duration || 0,
        timestamp: new Date(r.created_at),
        suite: r.test_file?.split("/").pop()?.replace(".spec.ts", "") || "Default",
        area: r.metadata?.area || "General",
        coverage: r.metadata?.coverage || [],
        error: r.error_message
          ? {
              message: r.error_message,
              stack: r.stack_trace,
            }
          : undefined,
        screenshots: r.screenshot_url ? [r.screenshot_url] : [],
        metadata: r.metadata,
      }));

      // TODO: Fetch manual test sessions when table is created
      // For now, use mock manual test data
      const mockManualTests: UnifiedTestResult[] = generateMockManualTests();

      // Combine both types
      const allResults = [...transformedAutomated, ...mockManualTests];
      setResults(allResults);
    } catch (error) {
      console.error("Error fetching unified results:", error);
      // Fall back to mock data
      setResults([...generateMockAutomatedTests(), ...generateMockManualTests()]);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate metrics
  const metrics = useMemo((): MetricsSummary => {
    const manual = results.filter((r) => r.type === "manual");
    const automated = results.filter((r) => r.type === "automated");

    const manualMetrics = {
      total: manual.length,
      passed: manual.filter((r) => r.status === "passed").length,
      failed: manual.filter((r) => r.status === "failed").length,
      inProgress: manual.filter((r) => r.status === "in-progress").length,
      avgDuration: manual.length
        ? manual.reduce((sum, r) => sum + r.duration, 0) / manual.length
        : 0,
    };

    const automatedMetrics = {
      total: automated.length,
      passed: automated.filter((r) => r.status === "passed").length,
      failed: automated.filter((r) => r.status === "failed").length,
      skipped: automated.filter((r) => r.status === "skipped").length,
      avgDuration: automated.length
        ? automated.reduce((sum, r) => sum + r.duration, 0) / automated.length
        : 0,
    };

    // Get unique areas tested
    const allAreas = new Set(results.map((r) => r.area).filter(Boolean));
    const totalTests = manualMetrics.total + automatedMetrics.total;
    const totalPassed = manualMetrics.passed + automatedMetrics.passed;
    const coverage = totalTests > 0 ? (totalPassed / totalTests) * 100 : 0;

    return {
      manual: manualMetrics,
      automated: automatedMetrics,
      combined: {
        total: totalTests,
        passed: totalPassed,
        failed: manualMetrics.failed + automatedMetrics.failed,
        coverage: Math.round(coverage),
        uniqueAreas: allAreas.size,
      },
    };
  }, [results]);

  // Filter and sort results
  const filteredResults = useMemo(() => {
    let filtered = [...results];

    // View mode filter
    if (viewMode !== "combined") {
      filtered = filtered.filter((r) => r.type === viewMode);
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((r) => r.status === statusFilter);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.name.toLowerCase().includes(query) ||
          r.area?.toLowerCase().includes(query) ||
          r.suite?.toLowerCase().includes(query) ||
          r.tester?.toLowerCase().includes(query)
      );
    }

    // Date range filter
    if (dateRange.from) {
      filtered = filtered.filter((r) => r.timestamp >= dateRange.from!);
    }
    if (dateRange.to) {
      const endOfDay = new Date(dateRange.to);
      endOfDay.setHours(23, 59, 59, 999);
      filtered = filtered.filter((r) => r.timestamp <= endOfDay);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "duration":
          return b.duration - a.duration;
        case "date":
        default:
          return b.timestamp.getTime() - a.timestamp.getTime();
      }
    });

    return filtered;
  }, [results, viewMode, statusFilter, searchQuery, dateRange, sortBy]);

  // Calculate coverage heatmap data
  const coverageData = useMemo((): CoverageData[] => {
    const areaMap = new Map<string, CoverageData>();

    results.forEach((r) => {
      const area = r.area || "Unknown";
      if (!areaMap.has(area)) {
        areaMap.set(area, {
          area,
          manualTests: 0,
          automatedTests: 0,
          totalCoverage: 0,
          lastTested: r.timestamp,
        });
      }

      const data = areaMap.get(area)!;
      if (r.type === "manual") {
        data.manualTests++;
      } else {
        data.automatedTests++;
      }
      data.totalCoverage = data.manualTests + data.automatedTests;
      if (r.timestamp > data.lastTested) {
        data.lastTested = r.timestamp;
      }
    });

    return Array.from(areaMap.values()).sort((a, b) => b.totalCoverage - a.totalCoverage);
  }, [results]);

  const getStatusIcon = (status: TestStatus, type: TestType) => {
    const baseClass = "h-4 w-4";
    const color = type === "manual" ? "text-blue-500" : "text-green-500";

    switch (status) {
      case "passed":
        return <CheckCircle className={cn(baseClass, color)} />;
      case "failed":
        return <XCircle className={cn(baseClass, "text-red-500")} />;
      case "skipped":
        return <AlertTriangle className={cn(baseClass, "text-yellow-500")} />;
      case "in-progress":
        return <Activity className={cn(baseClass, "text-orange-500 animate-pulse")} />;
      default:
        return <Clock className={cn(baseClass, "text-muted-foreground")} />;
    }
  };

  const getTypeIcon = (type: TestType) => {
    return type === "manual" ? (
      <Users className="h-4 w-4 text-blue-500" />
    ) : (
      <Bot className="h-4 w-4 text-green-500" />
    );
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <div className="flex flex-col h-full space-y-6 bg-[var(--mac-surface-bg)]">
      {/* Header with View Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Layers className="h-5 w-5 text-blue-400" />
          <h2 className="mac-heading">Unified Test Results</h2>
        </div>

        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
          <TabsList>
            <TabsTrigger value="manual" className="gap-2">
              <Users className="h-4 w-4" />
              Manual Sessions
            </TabsTrigger>
            <TabsTrigger value="automated" className="gap-2">
              <Bot className="h-4 w-4" />
              Automated Tests
            </TabsTrigger>
            <TabsTrigger value="combined" className="gap-2">
              <Layers className="h-4 w-4" />
              Combined View
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Metrics Panel */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="mac-card bg-[var(--mac-surface-bg)] border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-blue-400" />
                <span className="text-sm font-light text-muted-foreground">Total Tests</span>
              </div>
              <span className="text-2xl font-light text-white">{metrics.combined.total}</span>
            </div>
            <div className="mt-2 flex gap-2 text-xs text-muted-foreground">
              <span className="text-blue-400">{metrics.manual.total} manual</span>
              <span className="text-emerald-400">{metrics.automated.total} auto</span>
            </div>
          </CardContent>
        </Card>

        <Card className="mac-card bg-[var(--mac-surface-bg)] border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-500" />
                <span className="text-sm font-light text-muted-foreground">Passed</span>
              </div>
              <span className="text-2xl font-light text-emerald-500">
                {metrics.combined.passed}
              </span>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              {metrics.combined.coverage}% success rate
            </div>
          </CardContent>
        </Card>

        <Card className="mac-card bg-[var(--mac-surface-bg)] border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-rose-500" />
                <span className="text-sm font-light text-muted-foreground">Failed</span>
              </div>
              <span className="text-2xl font-light text-rose-500">{metrics.combined.failed}</span>
            </div>
            <div className="mt-2 flex gap-2 text-xs text-muted-foreground">
              <span className="text-blue-400">{metrics.manual.failed} manual</span>
              <span className="text-emerald-400">{metrics.automated.failed} auto</span>
            </div>
          </CardContent>
        </Card>

        <Card className="mac-card bg-[var(--mac-surface-bg)] border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Grid3x3 className="h-4 w-4 text-primary-400" />
                <span className="text-sm font-light text-muted-foreground">Areas Tested</span>
              </div>
              <span className="text-2xl font-light text-primary-400">
                {metrics.combined.uniqueAreas}
              </span>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">UI/feature coverage</div>
          </CardContent>
        </Card>

        <Card className="mac-card bg-[var(--mac-surface-bg)] border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-light text-muted-foreground">Avg Duration</span>
              </div>
              <span className="text-2xl font-light text-white">
                {formatDuration((metrics.manual.avgDuration + metrics.automated.avgDuration) / 2)}
              </span>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">Per test execution</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="mac-input"
            placeholder="Search tests by name, area, suite, or tester..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="passed">Passed</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="skipped">Skipped</SelectItem>
            <SelectItem value="in-progress">In Progress</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">Recent First</SelectItem>
            <SelectItem value="duration">Duration</SelectItem>
            <SelectItem value="name">Name</SelectItem>
          </SelectContent>
        </Select>

        <Button className="mac-button"
          variant={showHeatmap ? "default" : "outline"}
          size="sm"
          onClick={() => setShowHeatmap(!showHeatmap)}
          className="gap-2"
        >
          <Grid3x3 className="h-4 w-4" />
          Heatmap
        </Button>

        <Button variant="outline" size="sm" className="mac-button gap-2">
          <Download className="h-4 w-4" />
          Export
        </Button>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-12 gap-6 flex-1">
        {/* Timeline / Results List */}
        <div className={cn("col-span-12", showHeatmap ? "lg:col-span-7" : "lg:col-span-5")}>
          <Card className="mac-card h-full bg-[var(--mac-surface-bg)] border-white/10">
            <CardHeader className="mac-card">
              <CardTitle className="text-base font-light flex items-center justify-between text-white">
                <span>Test Timeline ({filteredResults.length} results)</span>
                <Badge variant="outline">{viewMode === "combined" ? "Mixed View" : viewMode}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full p-8">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                      <p className="mac-body text-muted-foreground">Loading test results...</p>
                    </div>
                  </div>
                ) : filteredResults.length === 0 ? (
                  <div className="flex items-center justify-center h-full p-8 text-muted-foreground">
                    No test results found
                  </div>
                ) : (
                  <div className="p-4 space-y-2">
                    {filteredResults.map((result) => (
                      <Card key={result.id}
                        className={cn("mac-card", 
                          "cursor-pointer transition-all hover:shadow-md border-l-4 bg-[var(--mac-surface-elevated)] border-white/10",
                          result.type === "manual"
                            ? "border-l-blue-400 hover:border-l-blue-500"
                            : "border-l-emerald-400 hover:border-l-emerald-500",
                          selectedResult?.id === result.id && "ring-2 ring-blue-500",
                          result.status === "failed" && "bg-rose-500/5"
                        )}
                        onClick={() => setSelectedResult(result)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3 flex-1">
                              {getTypeIcon(result.type)}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  {getStatusIcon(result.status, result.type)}
                                  <h4 className="mac-title">{result.name}</h4>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                  <span>{result.area || "General"}</span>
                                  <span>•</span>
                                  <span>
                                    {result.timestamp.toLocaleDateString()}{" "}
                                    {result.timestamp.toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </span>
                                  {result.tester && (
                                    <>
                                      <span>•</span>
                                      <span>{result.tester}</span>
                                    </>
                                  )}
                                  {result.suite && (
                                    <>
                                      <span>•</span>
                                      <span>{result.suite}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-xs">
                                {formatDuration(result.duration)}
                              </Badge>
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-xs",
                                  result.type === "manual" ? "text-blue-500" : "text-green-500"
                                )}
                              >
                                {result.type}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Coverage Heatmap (conditional) */}
        {showHeatmap && (
          <div className="col-span-12 lg:col-span-5">
            <Card className="mac-card h-full bg-[var(--mac-surface-bg)] border-white/10">
              <CardHeader className="mac-card">
                <CardTitle className="text-base font-light flex items-center gap-2 text-white">
                  <Grid3x3 className="h-4 w-4" />
                  Coverage Heatmap
                </CardTitle>
              </CardHeader>
              <CardContent className="mac-card">
                <ScrollArea className="h-[500px]">
                  <div className="space-y-3">
                    {coverageData.map((area) => {
                      const intensity = Math.min(area.totalCoverage / 10, 1);
                      return (
                        <div
                          key={area.area}
                          className="p-3 rounded-lg border transition-all hover:shadow-md"
                          style={{
                            backgroundColor: `rgba(139, 92, 246, ${intensity * 0.2})`,
                            borderColor: `rgba(139, 92, 246, ${intensity * 0.5})`,
                          }}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="mac-title">{area.area}</h4>
                            <Badge variant="secondary">{area.totalCoverage} tests</Badge>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3 text-blue-500" />
                              <span>{area.manualTests} manual</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Bot className="h-3 w-3 text-green-500" />
                              <span>{area.automatedTests} auto</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>{area.lastTested.toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Result Details */}
        <div className={cn("col-span-12", showHeatmap ? "hidden" : "lg:col-span-7")}>
          {selectedResult ? (
            <Card className="mac-card h-full bg-[var(--mac-surface-bg)] border-white/10">
              <CardHeader className="mac-card">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-light flex items-center gap-2 text-white">
                      {getTypeIcon(selectedResult.type)}
                      {selectedResult.name}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {selectedResult.area} • {selectedResult.timestamp.toLocaleString()}
                      {selectedResult.tester && ` • by ${selectedResult.tester}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(selectedResult.status, selectedResult.type)}
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
                <Tabs defaultValue="details">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="details">Details</TabsTrigger>
                    <TabsTrigger value="coverage">Coverage</TabsTrigger>
                    <TabsTrigger value="media">Media</TabsTrigger>
                  </TabsList>

                  <TabsContent value="details" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Card className="mac-card bg-[var(--mac-surface-elevated)] border-white/10">
                        <CardContent className="p-4">
                          <h4 className="mac-title">Type</h4>
                          <div className="flex items-center gap-2">
                            {getTypeIcon(selectedResult.type)}
                            <span className="font-light capitalize text-white">
                              {selectedResult.type}
                            </span>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="mac-card bg-[var(--mac-surface-elevated)] border-white/10">
                        <CardContent className="p-4">
                          <h4 className="mac-title">Duration</h4>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="font-light text-white">
                              {formatDuration(selectedResult.duration)}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {selectedResult.error && (
                      <Card className="mac-card bg-rose-500/10 border-rose-500/20">
                        <CardContent className="p-4">
                          <h4 className="mac-title">Error Message</h4>
                          <p className="text-sm font-mono text-white">
                            {selectedResult.error.message}
                          </p>
                          {selectedResult.error.stack && (
                            <>
                              <h4 className="mac-title">Stack Trace</h4>
                              <pre className="text-xs font-mono bg-[var(--mac-surface-elevated)] p-3 rounded overflow-x-auto text-muted-foreground">
                                {selectedResult.error.stack}
                              </pre>
                            </>
                          )}
                        </CardContent>
                      </Card>
                    )}

                    {selectedResult.findings && selectedResult.findings.length > 0 && (
                      <Card className="mac-card bg-[var(--mac-surface-elevated)] border-white/10">
                        <CardContent className="p-4">
                          <h4 className="mac-title">Manual Test Findings</h4>
                          <ul className="space-y-2">
                            {selectedResult.findings.map((finding, index) => (
                              <li
                                key={index}
                                className="flex items-start gap-2 text-sm text-muted-foreground"
                              >
                                <Eye className="h-4 w-4 mt-0.5 text-blue-400 flex-shrink-0" />
                                <span>{finding}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>

                  <TabsContent value="coverage" className="space-y-4">
                    <Card className="mac-card bg-[var(--mac-surface-elevated)] border-white/10">
                      <CardContent className="p-4">
                        <h4 className="mac-title">Areas Covered</h4>
                        {selectedResult.coverage && selectedResult.coverage.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {selectedResult.coverage.map((area, index) => (
                              <Badge
                                key={index}
                                variant="secondary"
                                className="bg-blue-500/10 text-blue-400 border-blue-500/20"
                              >
                                {area}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            No specific coverage areas recorded
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="media">
                    {selectedResult.screenshots && selectedResult.screenshots.length > 0 ? (
                      <div className="grid grid-cols-2 gap-4">
                        {selectedResult.screenshots.map((screenshot, index) => (
                          <Card key={index} className="mac-card bg-[var(--mac-surface-elevated)] border-white/10">
                            <CardContent className="p-4">
                              <div className="aspect-video bg-[#0a0a0a] rounded flex items-center justify-center">
                                <Eye className="h-8 w-8 text-muted-foreground" />
                              </div>
                              <p className="text-sm mt-2 truncate text-muted-foreground">{screenshot}</p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                        No media attachments
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ) : (
            <Card className="mac-card h-full bg-[var(--mac-surface-bg)] border-white/10">
              <CardContent className="flex items-center justify-center h-full text-muted-foreground">
                Select a test result to view details
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

// Mock data generators
function generateMockManualTests(): UnifiedTestResult[] {
  return [
    {
      id: "manual-1",
      name: "Login flow exploratory testing",
      type: "manual",
      status: "passed",
      duration: 1800000, // 30 minutes
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      tester: "Elena Martinez",
      area: "Authentication",
      coverage: ["Login Page", "Magic Link", "Error States"],
      findings: [
        "Email validation works correctly",
        "Magic link email arrives within 30 seconds",
        "Error messages are clear and helpful",
      ],
    },
    {
      id: "manual-2",
      name: "Chat interface usability test",
      type: "manual",
      status: "failed",
      duration: 2400000, // 40 minutes
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
      tester: "Marcus Chen",
      area: "Chat Interface",
      coverage: ["Message Input", "File Upload", "Response Display"],
      error: {
        message: "File upload fails with large files (>10MB)",
      },
      findings: [
        "Chat responses render correctly",
        "File upload UI is intuitive",
        "Large file uploads (>10MB) fail silently",
        "No error message shown to user",
      ],
      screenshots: ["chat-error-1.png", "upload-failure-2.png"],
    },
    {
      id: "manual-3",
      name: "Dashboard navigation testing",
      type: "manual",
      status: "in-progress",
      duration: 900000, // 15 minutes (ongoing)
      timestamp: new Date(),
      tester: "Sarah Johnson",
      area: "Dashboard",
      coverage: ["Navigation", "Tabs", "Sidebar"],
    },
  ];
}

function generateMockAutomatedTests(): UnifiedTestResult[] {
  return [
    {
      id: "auto-1",
      name: "Should authenticate with magic link",
      type: "automated",
      status: "passed",
      duration: 3456,
      timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
      suite: "Authentication",
      area: "Authentication",
      coverage: ["Magic Link Flow", "Email Delivery"],
    },
    {
      id: "auto-2",
      name: "Should upload and display files",
      type: "automated",
      status: "failed",
      duration: 5234,
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
      suite: "Chat Interface",
      area: "Chat Interface",
      coverage: ["File Upload", "File Display"],
      error: {
        message: "File upload timeout after 30s",
        stack: "Error: Timeout waiting for file upload...",
      },
      screenshots: ["upload-timeout.png"],
    },
  ];
}

export default UnifiedResultsDashboard;
