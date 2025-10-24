"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../src/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../src/components/ui/tabs";
import { Button } from "../../src/components/ui/button";
import { Badge } from "../../src/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "../../src/components/ui/alert";
import {
  Activity,
  AlertCircle,
  CheckCircle,
  Database,
  HardDrive,
  RefreshCw,
  Server,
  Zap,
} from "lucide-react";
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
    diskUsage: number;
    networkLatency: number;
    uptime: number;
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

  // Calculate health status
  const getHealthStatus = () => {
    if (!metrics) return { status: "unknown", color: "gray" };

    const { systemMetrics, queryMetrics, dataFreshness } = metrics;

    // Critical conditions
    if (
      systemMetrics.cpuUsage > 90 ||
      systemMetrics.memoryUsage > 90 ||
      queryMetrics.errorRate > 10 ||
      dataFreshness.vectorStore.staleness > 72
    ) {
      return { status: "critical", color: "red" };
    }

    // Warning conditions
    if (
      systemMetrics.cpuUsage > 70 ||
      systemMetrics.memoryUsage > 70 ||
      queryMetrics.errorRate > 5 ||
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-4xl font-bold mb-2">Performance Dashboard</h1>
            <p className="text-gray-400">Real-time system monitoring and analytics</p>
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
            <Button
              className="mac-button mac-button-primary"
              onClick={() => setAutoRefresh(!autoRefresh)}
              variant={autoRefresh ? "default" : "outline"}
              size="sm"
              className={autoRefresh ? "" : "text-white border-white/20"}
            >
              <Activity className={`h-4 w-4 mr-2 ${autoRefresh ? "animate-pulse" : ""}`} />
              Auto-refresh
            </Button>
          </div>
        </div>

        {/* Time Range Selector */}
        <div className="flex gap-2">
          {(["1h", "6h", "24h", "7d"] as const).map((range) => (
            <Button
              className="mac-button mac-button-primary"
              key={range}
              onClick={() => setTimeRange(range)}
              variant={timeRange === range ? "default" : "outline"}
              size="sm"
              className={timeRange !== range ? "text-white border-white/20" : ""}
            >
              {range.toUpperCase()}
            </Button>
          ))}
        </div>
      </div>

      {/* Health Status */}
      <Card className="mac-card mb-8 bg-white/5 border-white/10">
        <CardHeader>
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
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Avg Response Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {formatDuration(metrics.queryMetrics.avgResponseTime)}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              P95: {formatDuration(metrics.queryMetrics.p95ResponseTime)}
            </p>
          </CardContent>
        </Card>

        <Card className="mac-card bg-white/5 border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Total Queries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{metrics.queryMetrics.totalQueries}</div>
            <p className="text-xs text-gray-400 mt-2">
              Success rate: {metrics.queryMetrics.successRate.toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card className="mac-card bg-white/5 border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">System Load</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {metrics.systemMetrics.cpuUsage.toFixed(1)}%
            </div>
            <p className="text-xs text-gray-400 mt-2">
              CPU Usage | Memory: {metrics.systemMetrics.memoryUsage.toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card className="mac-card bg-white/5 border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Uptime</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {formatUptime(metrics.systemMetrics.uptime)}
            </div>
            <p className="text-xs text-gray-400 mt-2">System uptime</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics */}
      <Tabs defaultValue="queries" className="space-y-4">
        <TabsList className="bg-white/5 border-white/10">
          <TabsTrigger value="queries" className="data-[state=active]:bg-white/10">
            Query Analytics
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

        {/* Query Analytics Tab */}
        <TabsContent value="queries" className="space-y-4">
          <Card className="mac-card bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Response Time Trends</CardTitle>
              <CardDescription className="text-gray-400">
                Average and P95 response times over time
              </CardDescription>
            </CardHeader>
            <CardContent>
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
              <CardHeader>
                <CardTitle className="text-white">Query Types</CardTitle>
                <CardDescription className="text-gray-400">
                  Distribution by query type
                </CardDescription>
              </CardHeader>
              <CardContent>
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
              <CardHeader>
                <CardTitle className="text-white">Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">P50 Latency</span>
                    <span className="text-white font-semibold">
                      {formatDuration(metrics.queryMetrics.p50ResponseTime)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">P95 Latency</span>
                    <span className="text-white font-semibold">
                      {formatDuration(metrics.queryMetrics.p95ResponseTime)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">P99 Latency</span>
                    <span className="text-white font-semibold">
                      {formatDuration(metrics.queryMetrics.p99ResponseTime)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Success Rate</span>
                    <Badge variant="default">{metrics.queryMetrics.successRate.toFixed(1)}%</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Error Rate</span>
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
            <CardHeader>
              <CardTitle className="text-white">System Resource Usage</CardTitle>
              <CardDescription className="text-gray-400">
                CPU, Memory, and Disk usage over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={systemMetricsHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                  <XAxis dataKey="time" stroke="#ffffff60" />
                  <YAxis
                    stroke="#ffffff60"
                    label={{ value: "Usage (%)", angle: -90, position: "insideLeft" }}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #ffffff20" }}
                    labelStyle={{ color: "#ffffff" }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="cpu"
                    stackId="1"
                    stroke="#ef4444"
                    fill="#ef444440"
                    name="CPU"
                  />
                  <Area
                    type="monotone"
                    dataKey="memory"
                    stackId="2"
                    stroke="#3b82f6"
                    fill="#3b82f640"
                    name="Memory"
                  />
                  <Area
                    type="monotone"
                    dataKey="disk"
                    stackId="3"
                    stroke="#10b981"
                    fill="#10b98140"
                    name="Disk"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="mac-card bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
                  <Server className="h-4 w-4" />
                  CPU Usage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white mb-2">
                  {metrics.systemMetrics.cpuUsage.toFixed(1)}%
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      metrics.systemMetrics.cpuUsage > 80
                        ? "bg-red-500"
                        : metrics.systemMetrics.cpuUsage > 60
                          ? "bg-yellow-500"
                          : "bg-green-500"
                    }`}
                    style={{ width: `${metrics.systemMetrics.cpuUsage}%` }}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="mac-card bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Memory Usage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white mb-2">
                  {metrics.systemMetrics.memoryUsage.toFixed(1)}%
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      metrics.systemMetrics.memoryUsage > 80
                        ? "bg-red-500"
                        : metrics.systemMetrics.memoryUsage > 60
                          ? "bg-yellow-500"
                          : "bg-green-500"
                    }`}
                    style={{ width: `${metrics.systemMetrics.memoryUsage}%` }}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="mac-card bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-sm text-gray-400 flex items-center gap-2">
                  <HardDrive className="h-4 w-4" />
                  Disk Usage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white mb-2">
                  {metrics.systemMetrics.diskUsage.toFixed(1)}%
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      metrics.systemMetrics.diskUsage > 80
                        ? "bg-red-500"
                        : metrics.systemMetrics.diskUsage > 60
                          ? "bg-yellow-500"
                          : "bg-green-500"
                    }`}
                    style={{ width: `${metrics.systemMetrics.diskUsage}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Data Freshness Tab */}
        <TabsContent value="data" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="mac-card bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Vector Store
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Documents</span>
                    <span className="text-white font-semibold">
                      {metrics.dataFreshness.vectorStore.totalDocuments}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Last Update</span>
                    <span className="text-white font-semibold">
                      {new Date(metrics.dataFreshness.vectorStore.lastUpdate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Staleness</span>
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
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  AOMA Cache
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Cache Hit Rate</span>
                    <span className="text-white font-semibold">
                      {(metrics.dataFreshness.aomaCache.cacheHitRate * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Cache Miss Rate</span>
                    <span className="text-white font-semibold">
                      {(metrics.dataFreshness.aomaCache.cacheMissRate * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Last Update</span>
                    <span className="text-white font-semibold">
                      {formatTime(metrics.dataFreshness.aomaCache.lastUpdate)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="mac-card bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <HardDrive className="h-5 w-5" />
                  Knowledge Base
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Files</span>
                    <span className="text-white font-semibold">
                      {metrics.dataFreshness.knowledgeBase.fileCount}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Last Update</span>
                    <span className="text-white font-semibold">
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
            <CardHeader>
              <CardTitle className="text-white">API Endpoint Performance</CardTitle>
              <CardDescription className="text-gray-400">
                Latency and error rates by endpoint
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics.apiMetrics.map((api) => (
                  <div
                    key={api.endpoint}
                    className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10"
                  >
                    <div className="flex-1">
                      <div className="font-semibold text-white mb-2">{api.endpoint}</div>
                      <div className="flex gap-4 text-sm">
                        <span className="text-gray-400">
                          Latency:{" "}
                          <span className="text-white">{formatDuration(api.avgLatency)}</span>
                        </span>
                        <span className="text-gray-400">
                          Requests: <span className="text-white">{api.requestCount}</span>
                        </span>
                        <span className="text-gray-400">
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
  );
}
