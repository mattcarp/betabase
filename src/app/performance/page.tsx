"use client";

import React, { useState, useEffect, useCallback } from "react";
import { cn } from "../../lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  Clock,
  Database,
  HardDrive,
  RefreshCw,
  Server,
  Zap,
} from "lucide-react";
import { SiamLogo } from "@/components/ui/SiamLogo";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

interface PerformanceMetrics {
  queryMetrics: {
    avgResponseTime: number;
    p50ResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
    totalQueries: number;
    successRate: number;
    errorRate: number;
    queryTypes: {
      type: string;
      count: number;
      avgTime: number;
    }[];
  };
  systemMetrics: {
    cpuUsage: number;
    memoryUsage: number;
    memoryUsedMB: number;
    memoryTotalMB: number;
    heapUsedMB: number;
    heapTotalMB: number;
    diskUsage: number;
    networkLatency: number;
    uptime: number;
    nodeVersion: string;
    platform: string;
  };
  testMetrics: {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    passRate: number;
    recentRuns: number;
    avgDurationMs: number;
    historicalTestCount: number;
    rlhfFeedbackCount: number;
    selfHealingPending: number;
    selfHealingApproved: number;
  };
  dataFreshness: {
    vectorStore: {
      lastUpdate: string;
      totalDocuments: number;
      staleness: number;
    };
    aomaCache: {
      lastUpdate: string;
      cacheHitRate: number;
      cacheMissRate: number;
    };
    knowledgeBase: {
      lastUpdate: string;
      fileCount: number;
    };
  };
  apiMetrics: {
    endpoint: string;
    avgLatency: number;
    requestCount: number;
    errorCount: number;
  }[];
  webVitals: {
    lcp: { avg: number; p75: number; samples: number };
    fid: { avg: number; p75: number; samples: number };
    cls: { avg: number; p75: number; samples: number };
    fcp: { avg: number; p75: number; samples: number };
    ttfb: { avg: number; p75: number; samples: number };
    inp: { avg: number; p75: number; samples: number };
  };
  timestamp: string;
}

export default function PerformanceDashboard() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [metricsHistory, setMetricsHistory] = useState<PerformanceMetrics[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<"1h" | "6h" | "24h" | "7d">("1h");
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch metrics
  const fetchMetrics = useCallback(async () => {
    try {
      const response = await fetch(`/api/performance/metrics?timeRange=${timeRange}`);
      if (!response.ok) {
        throw new Error("Failed to fetch metrics");
      }
      const data = await response.json();
      setMetrics(data);

      // Add to history for charts (keep last 50 data points)
      setMetricsHistory((prev) => [...prev, data].slice(-50));
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching metrics:", error);
      setIsLoading(false);
    }
  }, [timeRange]);

  // Auto-refresh metrics
  useEffect(() => {
    fetchMetrics();

    if (autoRefresh) {
      const interval = setInterval(fetchMetrics, 10000); // Refresh every 10 seconds
      return () => clearInterval(interval);
    }
    return undefined;
  }, [fetchMetrics, autoRefresh]);

  // Format time
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  // Format duration
  const formatDuration = (ms: number) => {
    return `${ms.toFixed(0)}ms`;
  };

  // Format uptime
  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  // Format metric value, showing N/A for unavailable metrics (-1)
  const formatMetricValue = (value: number, suffix: string = "") => {
    if (value < 0) return "N/A";
    return `${value.toFixed(1)}${suffix}`;
  };

  // Calculate health status
  const getHealthStatus = () => {
    if (!metrics) return { status: "unknown", color: "gray" };

    const { systemMetrics, testMetrics, dataFreshness } = metrics;

    // Critical conditions (skip if value is -1 meaning unavailable)
    if (
      (systemMetrics.cpuUsage >= 0 && systemMetrics.cpuUsage > 90) ||
      (systemMetrics.memoryUsage >= 0 && systemMetrics.memoryUsage > 90) ||
      (testMetrics && testMetrics.passRate < 50 && testMetrics.totalTests > 0) ||
      dataFreshness.vectorStore.staleness > 72
    ) {
      return { status: "critical", color: "red" };
    }

    // Warning conditions (skip if value is -1 meaning unavailable)
    if (
      (systemMetrics.cpuUsage >= 0 && systemMetrics.cpuUsage > 70) ||
      (systemMetrics.memoryUsage >= 0 && systemMetrics.memoryUsage > 70) ||
      (testMetrics && testMetrics.passRate < 80 && testMetrics.totalTests > 0) ||
      dataFreshness.vectorStore.staleness > 24
    ) {
      return { status: "warning", color: "yellow" };
    }

    return { status: "healthy", color: "green" };
  };

  const healthStatus = getHealthStatus();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Activity className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Loading performance metrics...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white p-8">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>Failed to load performance metrics</AlertDescription>
        </Alert>
      </div>
    );
  }

  // Prepare chart data
  const systemMetricsHistory = metricsHistory.map((m, _index) => ({
    time: formatTime(m.timestamp),
    cpu: m.systemMetrics.cpuUsage,
    memory: m.systemMetrics.memoryUsage,
    disk: m.systemMetrics.diskUsage,
  }));

  const queryMetricsHistory = metricsHistory.map((m, _index) => ({
    time: formatTime(m.timestamp),
    avgResponseTime: m.queryMetrics.avgResponseTime,
    p95ResponseTime: m.queryMetrics.p95ResponseTime,
    successRate: m.queryMetrics.successRate,
  }));

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-sm supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="px-6 py-4 h-16">
          <div className="flex items-center justify-between h-full">
            {/* Back Navigation + Brand */}
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => (window.location.href = "/")}
                className="text-muted-foreground hover:text-foreground hover:bg-muted/50 mac-button"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to App
              </Button>
              <div className="h-6 w-px bg-border" />
              <div className="flex items-center space-x-3">
                <SiamLogo size="md" variant="icon" />
                <div>
                  <h1 className="text-sm font-medium text-foreground">Performance Dashboard</h1>
                  <p className="text-xs text-muted-foreground">Real-time monitoring</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="p-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="mac-heading text-4xl font-normal mb-2">Performance Dashboard</h1>
            <p className="mac-body text-muted-foreground">Real-time system monitoring and analytics</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={fetchMetrics}
              variant="outline"
              size="sm"
              className="text-white border-white/20 mac-button mac-button-outline"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={() => setAutoRefresh(!autoRefresh)}
              variant={autoRefresh ? "default" : "outline"}
              size="sm"
              className={
                autoRefresh
                  ? "mac-button mac-button-primary"
                  : "mac-button mac-button-primary text-white border-white/20"
              }
            >
              <Activity className={`h-4 w-4 mr-2 ${autoRefresh ? "animate-pulse" : ""}`} />
              Auto-refresh
            </Button>
          </div>
        </div>

        {/* Time Range Selector */}
        <div className="flex gap-2">
          {(["1h", "6h", "24h", "7d"] as const).map((range) => (
            <Button key={range}
              onClick={() => setTimeRange(range)}
              variant={timeRange === range ? "default" : "outline"}
              size="sm"
              className={
                timeRange === range
                  ? "mac-button mac-button-primary"
                  : "mac-button mac-button-primary text-white border-white/20"
              }
            >
              {range.toUpperCase()}
            </Button>
          ))}
        </div>
      </div>

      {/* Health Status */}
      <Card className="mac-card mb-8 bg-white/5 border-white/10">
        <CardHeader className="mac-card">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-white">
              {healthStatus.status === "healthy" && (
                <CheckCircle className="h-6 w-6 text-green-500" />
              )}
              {healthStatus.status === "warning" && (
                <AlertCircle className="h-6 w-6 text-yellow-500" />
              )}
              {healthStatus.status === "critical" && (
                <AlertCircle className="h-6 w-6 text-red-500" />
              )}
              System Status: {healthStatus.status.toUpperCase()}
            </CardTitle>
            <Badge
              variant={
                healthStatus.status === "healthy"
                  ? "default"
                  : healthStatus.status === "warning"
                    ? "secondary"
                    : "destructive"
              }
            >
              Last updated: {formatTime(metrics.timestamp)}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="mac-card bg-white/5 border-white/10">
          <CardHeader className="mac-card pb-2">
            <CardTitle className="text-sm font-normal text-muted-foreground">Avg Response Time</CardTitle>
          </CardHeader>
          <CardContent className="mac-card">
            <div className="text-2xl font-normal text-white">
              {formatDuration(metrics.queryMetrics.avgResponseTime)}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              P95: {formatDuration(metrics.queryMetrics.p95ResponseTime)}
            </p>
          </CardContent>
        </Card>

        <Card className="mac-card bg-white/5 border-white/10">
          <CardHeader className="mac-card pb-2">
            <CardTitle className="text-sm font-normal text-muted-foreground">Total Queries</CardTitle>
          </CardHeader>
          <CardContent className="mac-card">
            <div className="text-2xl font-normal text-white">{metrics.queryMetrics.totalQueries}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Success rate: {metrics.queryMetrics.successRate.toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card className="mac-card bg-white/5 border-white/10">
          <CardHeader className="mac-card pb-2">
            <CardTitle className="text-sm font-normal text-muted-foreground">System Load</CardTitle>
          </CardHeader>
          <CardContent className="mac-card">
            <div className="text-2xl font-normal text-white">
              {metrics.systemMetrics.cpuUsage.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              CPU Usage | Memory: {metrics.systemMetrics.memoryUsage.toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card className="mac-card bg-white/5 border-white/10">
          <CardHeader className="mac-card pb-2">
            <CardTitle className="text-sm font-normal text-muted-foreground">Uptime</CardTitle>
          </CardHeader>
          <CardContent className="mac-card">
            <div className="text-2xl font-normal text-white">
              {formatUptime(metrics.systemMetrics.uptime)}
            </div>
            <p className="text-xs text-muted-foreground mt-2">System uptime</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics */}
      <Tabs defaultValue="tests" className="space-y-4">
        <TabsList className="bg-white/5 border-white/10 flex-wrap">
          <TabsTrigger value="tests" className="data-[state=active]:bg-white/10">
            Test Metrics
          </TabsTrigger>
          <TabsTrigger value="vitals" className="data-[state=active]:bg-white/10">
            Web Vitals
          </TabsTrigger>
          <TabsTrigger value="system" className="data-[state=active]:bg-white/10">
            System Health
          </TabsTrigger>
          <TabsTrigger value="data" className="data-[state=active]:bg-white/10">
            Data Freshness
          </TabsTrigger>
          <TabsTrigger value="api" className="data-[state=active]:bg-white/10">
            API Performance
          </TabsTrigger>
        </TabsList>

        {/* Test Metrics Tab */}
        <TabsContent value="tests" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="mac-card bg-white/5 border-white/10">
              <CardHeader className="mac-card pb-2">
                <CardTitle className="text-sm font-normal text-muted-foreground">Test Pass Rate</CardTitle>
              </CardHeader>
              <CardContent className="mac-card">
                <div className="text-2xl font-normal text-white">
                  {metrics.testMetrics?.passRate || 0}%
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {metrics.testMetrics?.passedTests || 0} passed / {metrics.testMetrics?.failedTests || 0} failed
                </p>
              </CardContent>
            </Card>

            <Card className="mac-card bg-white/5 border-white/10">
              <CardHeader className="mac-card pb-2">
                <CardTitle className="text-sm font-normal text-muted-foreground">Recent Test Runs</CardTitle>
              </CardHeader>
              <CardContent className="mac-card">
                <div className="text-2xl font-normal text-white">
                  {metrics.testMetrics?.recentRuns || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Avg duration: {formatDuration(metrics.testMetrics?.avgDurationMs || 0)}
                </p>
              </CardContent>
            </Card>

            <Card className="mac-card bg-white/5 border-white/10">
              <CardHeader className="mac-card pb-2">
                <CardTitle className="text-sm font-normal text-muted-foreground">Historical Tests</CardTitle>
              </CardHeader>
              <CardContent className="mac-card">
                <div className="text-2xl font-normal text-white">
                  {(metrics.testMetrics?.historicalTestCount || 0).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Total test cases in bb_case table
                </p>
              </CardContent>
            </Card>

            <Card className="mac-card bg-white/5 border-white/10">
              <CardHeader className="mac-card pb-2">
                <CardTitle className="text-sm font-normal text-muted-foreground">RLHF Feedback</CardTitle>
              </CardHeader>
              <CardContent className="mac-card">
                <div className="text-2xl font-normal text-white">
                  {metrics.testMetrics?.rlhfFeedbackCount || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  User feedback entries collected
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="mac-card bg-white/5 border-white/10">
              <CardHeader className="mac-card">
                <CardTitle className="text-white">Self-Healing Tests</CardTitle>
                <CardDescription className="text-muted-foreground">
                  AI-suggested test fixes awaiting review
                </CardDescription>
              </CardHeader>
              <CardContent className="mac-card">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Pending Review</span>
                    <Badge variant={metrics.testMetrics?.selfHealingPending > 0 ? "secondary" : "default"}>
                      {metrics.testMetrics?.selfHealingPending || 0}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Approved/Applied</span>
                    <Badge variant="default">{metrics.testMetrics?.selfHealingApproved || 0}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="mac-card bg-white/5 border-white/10">
              <CardHeader className="mac-card">
                <CardTitle className="text-white">Data Sources</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Real data from Supabase tables
                </CardDescription>
              </CardHeader>
              <CardContent className="mac-card">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">test_results</span>
                    <span className="text-white">Recent test executions</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">bb_case</span>
                    <span className="text-white">Historical test cases</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">rlhf_feedback</span>
                    <span className="text-white">User feedback</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">self_healing_attempts</span>
                    <span className="text-white">AI test fixes</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Web Vitals Tab */}
        <TabsContent value="vitals" className="space-y-4">
          <Card className="mac-card bg-white/5 border-white/10">
            <CardHeader className="mac-card">
              <CardTitle className="text-white">Core Web Vitals</CardTitle>
              <CardDescription className="text-muted-foreground">
                Google&apos;s metrics for user experience. Collected from client-side page loads.
              </CardDescription>
            </CardHeader>
            <CardContent className="mac-card">
              {metrics.webVitals?.lcp?.samples === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No Web Vitals data collected yet.</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Web Vitals are reported from client-side page loads. Navigate through the app to collect data.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="p-4 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-normal text-white">LCP</span>
                      <span className="text-xs text-muted-foreground">Largest Contentful Paint</span>
                    </div>
                    <div className="text-2xl font-normal text-white">
                      {metrics.webVitals?.lcp?.p75 ? `${(metrics.webVitals.lcp.p75 / 1000).toFixed(2)}s` : 'N/A'}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      P75 ({metrics.webVitals?.lcp?.samples || 0} samples) | Good: &lt;2.5s
                    </p>
                  </div>

                  <div className="p-4 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-normal text-white">INP</span>
                      <span className="text-xs text-muted-foreground">Interaction to Next Paint</span>
                    </div>
                    <div className="text-2xl font-normal text-white">
                      {metrics.webVitals?.inp?.p75 ? `${metrics.webVitals.inp.p75.toFixed(0)}ms` : 'N/A'}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      P75 ({metrics.webVitals?.inp?.samples || 0} samples) | Good: &lt;200ms
                    </p>
                  </div>

                  <div className="p-4 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-normal text-white">CLS</span>
                      <span className="text-xs text-muted-foreground">Cumulative Layout Shift</span>
                    </div>
                    <div className="text-2xl font-normal text-white">
                      {metrics.webVitals?.cls?.p75 !== undefined ? metrics.webVitals.cls.p75.toFixed(3) : 'N/A'}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      P75 ({metrics.webVitals?.cls?.samples || 0} samples) | Good: &lt;0.1
                    </p>
                  </div>

                  <div className="p-4 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-normal text-white">FCP</span>
                      <span className="text-xs text-muted-foreground">First Contentful Paint</span>
                    </div>
                    <div className="text-2xl font-normal text-white">
                      {metrics.webVitals?.fcp?.p75 ? `${(metrics.webVitals.fcp.p75 / 1000).toFixed(2)}s` : 'N/A'}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      P75 ({metrics.webVitals?.fcp?.samples || 0} samples) | Good: &lt;1.8s
                    </p>
                  </div>

                  <div className="p-4 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-normal text-white">TTFB</span>
                      <span className="text-xs text-muted-foreground">Time to First Byte</span>
                    </div>
                    <div className="text-2xl font-normal text-white">
                      {metrics.webVitals?.ttfb?.p75 ? `${metrics.webVitals.ttfb.p75.toFixed(0)}ms` : 'N/A'}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      P75 ({metrics.webVitals?.ttfb?.samples || 0} samples) | Good: &lt;800ms
                    </p>
                  </div>

                  <div className="p-4 bg-white/5 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-normal text-white">FID</span>
                      <span className="text-xs text-muted-foreground">First Input Delay (legacy)</span>
                    </div>
                    <div className="text-2xl font-normal text-white">
                      {metrics.webVitals?.fid?.p75 ? `${metrics.webVitals.fid.p75.toFixed(0)}ms` : 'N/A'}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      P75 ({metrics.webVitals?.fid?.samples || 0} samples) | Good: &lt;100ms
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="mac-card bg-white/5 border-white/10">
            <CardHeader className="mac-card">
              <CardTitle className="text-white">How to Collect Web Vitals</CardTitle>
            </CardHeader>
            <CardContent className="mac-card">
              <p className="text-sm text-muted-foreground">
                Web Vitals are automatically collected from page loads when the web-vitals reporter is installed.
                The data shown here is aggregated from all users of the application.
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Note: Web Vitals data resets when the server restarts. In production, consider using a persistent
                storage solution like Render&apos;s metrics or a dedicated monitoring service.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Query Analytics Tab (kept for reference but removed from tabs) */}
        <TabsContent value="queries" className="space-y-4">
          <Card className="mac-card bg-white/5 border-white/10">
            <CardHeader className="mac-card">
              <CardTitle className="text-white">Response Time Trends</CardTitle>
              <CardDescription className="text-muted-foreground">
                Average and P95 response times over time
              </CardDescription>
            </CardHeader>
            <CardContent className="mac-card">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={queryMetricsHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                  <XAxis dataKey="time" stroke="#ffffff60" />
                  <YAxis
                    stroke="#ffffff60"
                    label={{ value: "Time (ms)", angle: -90, position: "insideLeft" }}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #ffffff20" }}
                    labelStyle={{ color: "#ffffff" }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="avgResponseTime"
                    stroke="#10b981"
                    strokeWidth={2}
                    name="Avg Response"
                  />
                  <Line
                    type="monotone"
                    dataKey="p95ResponseTime"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    name="P95 Response"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="mac-card bg-white/5 border-white/10">
              <CardHeader className="mac-card">
                <CardTitle className="text-white">Query Types</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Distribution by query type
                </CardDescription>
              </CardHeader>
              <CardContent className="mac-card">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={metrics.queryMetrics.queryTypes}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                    <XAxis dataKey="type" stroke="#ffffff60" />
                    <YAxis stroke="#ffffff60" />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #ffffff20" }}
                      labelStyle={{ color: "#ffffff" }}
                    />
                    <Legend />
                    <Bar dataKey="count" fill="#3b82f6" name="Count" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="mac-card bg-white/5 border-white/10">
              <CardHeader className="mac-card">
                <CardTitle className="text-white">Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent className="mac-card">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">P50 Latency</span>
                    <span className="text-white font-normal">
                      {formatDuration(metrics.queryMetrics.p50ResponseTime)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">P95 Latency</span>
                    <span className="text-white font-normal">
                      {formatDuration(metrics.queryMetrics.p95ResponseTime)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">P99 Latency</span>
                    <span className="text-white font-normal">
                      {formatDuration(metrics.queryMetrics.p99ResponseTime)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Success Rate</span>
                    <Badge variant="default">{metrics.queryMetrics.successRate.toFixed(1)}%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Error Rate</span>
                    <Badge
                      variant={metrics.queryMetrics.errorRate > 5 ? "destructive" : "secondary"}
                    >
                      {metrics.queryMetrics.errorRate.toFixed(1)}%
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* System Health Tab */}
        <TabsContent value="system" className="space-y-4">
          <Card className="mac-card bg-white/5 border-white/10">
            <CardHeader className="mac-card">
              <CardTitle className="text-white">Node.js Process Metrics</CardTitle>
              <CardDescription className="text-muted-foreground">
                Real-time metrics from the Node.js runtime (not simulated)
              </CardDescription>
            </CardHeader>
            <CardContent className="mac-card">
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={systemMetricsHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                  <XAxis dataKey="time" stroke="#ffffff60" />
                  <YAxis
                    stroke="#ffffff60"
                    label={{ value: "Memory %", angle: -90, position: "insideLeft" }}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #ffffff20" }}
                    labelStyle={{ color: "#ffffff" }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="memory"
                    stackId="1"
                    stroke="#3b82f6"
                    fill="#3b82f640"
                    name="Heap Memory %"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="mac-card bg-white/5 border-white/10">
              <CardHeader className="mac-card">
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Heap Memory
                </CardTitle>
              </CardHeader>
              <CardContent className="mac-card">
                <div className="text-3xl font-normal text-white mb-2">
                  {metrics.systemMetrics.heapUsedMB || 0} MB
                </div>
                <p className="text-xs text-muted-foreground">
                  of {metrics.systemMetrics.heapTotalMB || 0} MB allocated
                </p>
                <div className="w-full bg-muted rounded-full h-2 mt-2">
                  <div
                    className={`h-2 rounded-full ${
                      metrics.systemMetrics.memoryUsage > 80
                        ? "bg-red-500"
                        : metrics.systemMetrics.memoryUsage > 60
                          ? "bg-yellow-500"
                          : "bg-green-500"
                    }`}
                    style={{ width: `${Math.min(metrics.systemMetrics.memoryUsage, 100)}%` }}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="mac-card bg-white/5 border-white/10">
              <CardHeader className="mac-card">
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Total Memory
                </CardTitle>
              </CardHeader>
              <CardContent className="mac-card">
                <div className="text-3xl font-normal text-white mb-2">
                  {metrics.systemMetrics.memoryUsedMB || 0} MB
                </div>
                <p className="text-xs text-muted-foreground">
                  RSS + External memory
                </p>
              </CardContent>
            </Card>

            <Card className="mac-card bg-white/5 border-white/10">
              <CardHeader className="mac-card">
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <Server className="h-4 w-4" />
                  Runtime Info
                </CardTitle>
              </CardHeader>
              <CardContent className="mac-card">
                <div className="text-xl font-normal text-white mb-2">
                  {metrics.systemMetrics.nodeVersion || 'Unknown'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Platform: {metrics.systemMetrics.platform || 'Unknown'}
                </p>
              </CardContent>
            </Card>

            <Card className="mac-card bg-white/5 border-white/10">
              <CardHeader className="mac-card">
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Uptime
                </CardTitle>
              </CardHeader>
              <CardContent className="mac-card">
                <div className="text-3xl font-normal text-white mb-2">
                  {formatUptime(metrics.systemMetrics.uptime)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Since server start
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Data Freshness Tab */}
        <TabsContent value="data" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="mac-card bg-white/5 border-white/10">
              <CardHeader className="mac-card">
                <CardTitle className="text-white flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Vector Store
                </CardTitle>
              </CardHeader>
              <CardContent className="mac-card">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Documents</span>
                    <span className="text-white font-normal">
                      {metrics.dataFreshness.vectorStore.totalDocuments}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Update</span>
                    <span className="text-white font-normal">
                      {new Date(metrics.dataFreshness.vectorStore.lastUpdate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Staleness</span>
                    <Badge
                      variant={
                        metrics.dataFreshness.vectorStore.staleness > 72
                          ? "destructive"
                          : metrics.dataFreshness.vectorStore.staleness > 24
                            ? "secondary"
                            : "default"
                      }
                    >
                      {metrics.dataFreshness.vectorStore.staleness.toFixed(0)}h
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="mac-card bg-white/5 border-white/10">
              <CardHeader className="mac-card">
                <CardTitle className="text-white flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  AOMA Cache
                </CardTitle>
              </CardHeader>
              <CardContent className="mac-card">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cache Hit Rate</span>
                    <span className="text-white font-normal">
                      {(metrics.dataFreshness.aomaCache.cacheHitRate * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cache Miss Rate</span>
                    <span className="text-white font-normal">
                      {(metrics.dataFreshness.aomaCache.cacheMissRate * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Update</span>
                    <span className="text-white font-normal">
                      {formatTime(metrics.dataFreshness.aomaCache.lastUpdate)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="mac-card bg-white/5 border-white/10">
              <CardHeader className="mac-card">
                <CardTitle className="text-white flex items-center gap-2">
                  <HardDrive className="h-5 w-5" />
                  Knowledge Base
                </CardTitle>
              </CardHeader>
              <CardContent className="mac-card">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Files</span>
                    <span className="text-white font-normal">
                      {metrics.dataFreshness.knowledgeBase.fileCount}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Update</span>
                    <span className="text-white font-normal">
                      {new Date(
                        metrics.dataFreshness.knowledgeBase.lastUpdate
                      ).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* API Performance Tab */}
        <TabsContent value="api" className="space-y-4">
          <Card className="mac-card bg-white/5 border-white/10">
            <CardHeader className="mac-card">
              <CardTitle className="text-white">API Endpoint Performance</CardTitle>
              <CardDescription className="text-muted-foreground">
                Latency and error rates by endpoint
              </CardDescription>
            </CardHeader>
            <CardContent className="mac-card">
              <div className="space-y-4">
                {metrics.apiMetrics.map((api) => (
                  <div
                    key={api.endpoint}
                    className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10"
                  >
                    <div className="flex-1">
                      <div className="font-normal text-white mb-2">{api.endpoint}</div>
                      <div className="flex gap-4 text-sm">
                        <span className="text-muted-foreground">
                          Latency:{" "}
                          <span className="text-white">{formatDuration(api.avgLatency)}</span>
                        </span>
                        <span className="text-muted-foreground">
                          Requests: <span className="text-white">{api.requestCount}</span>
                        </span>
                        <span className="text-muted-foreground">
                          Errors: <span className="text-white">{api.errorCount}</span>
                        </span>
                      </div>
                    </div>
                    <Badge
                      variant={
                        api.errorCount / api.requestCount > 0.05
                          ? "destructive"
                          : api.errorCount / api.requestCount > 0.02
                            ? "secondary"
                            : "default"
                      }
                    >
                      {((api.errorCount / api.requestCount) * 100).toFixed(1)}% errors
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
}
