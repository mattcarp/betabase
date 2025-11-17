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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../src/components/ui/dialog";
import { useToast } from "../../src/hooks/use-toast";
import {
  Activity,
  AlertCircle,
  CheckCircle,
  Copy,
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

type AlertSeverity = "warning" | "critical";
const SEVERITY_PRIORITY: Record<AlertSeverity, number> = {
  critical: 2,
  warning: 1,
};

interface PerformanceAlert {
  id: string;
  ruleId: string;
  category: string;
  metricLabel: string;
  severity: AlertSeverity;
  message: string;
  triggeredAt: string;
  value: number;
  valueDisplay: string;
  threshold: number;
  thresholdDisplay: string;
  comparator: "above" | "below";
  context?: Record<string, string>;
}

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
  alerts?: PerformanceAlert[];
}

interface SnapshotRow {
  id: string;
  metrics: PerformanceMetrics;
  created_at: string;
}

export default function PerformanceDashboard() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [metricsHistory, setMetricsHistory] = useState<PerformanceMetrics[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<"1h" | "6h" | "24h" | "7d">("1h");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState(10000);
  const [snapshots, setSnapshots] = useState<SnapshotRow[]>([]);
  const [snapshotsLoading, setSnapshotsLoading] = useState(true);
  const [selectedSnapshot, setSelectedSnapshot] = useState<SnapshotRow | null>(null);
  const [snapshotDialogOpen, setSnapshotDialogOpen] = useState(false);
  const [isCollectingSnapshot, setIsCollectingSnapshot] = useState(false);
  const { toast } = useToast();

  // Fetch metrics
  const fetchMetrics = useCallback(async () => {
    try {
      const response = await fetch(`/api/performance/metrics?timeRange=${timeRange}`);
      if (!response.ok) {
        throw new Error("Failed to fetch metrics");
      }
      const data = await response.json();
      const latestMetrics: PerformanceMetrics = data.metrics ?? data;
      setMetrics(latestMetrics);

      if (Array.isArray(data.history) && data.history.length > 0) {
        setMetricsHistory(data.history.slice(-50));
      } else {
        setMetricsHistory((prev) => [...prev, latestMetrics].slice(-50));
      }
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
      const interval = setInterval(fetchMetrics, autoRefreshInterval);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [fetchMetrics, autoRefresh, autoRefreshInterval]);

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

  const dataSourceUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/performance/snapshots`
      : "/api/performance/snapshots";
  const grafanaUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/performance/metrics?format=grafana`
      : "/api/performance/metrics?format=grafana";

  const copyToClipboard = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
    } catch (error) {
      console.error("Failed to copy value", error);
    }
  };

  const fetchSnapshots = useCallback(async () => {
    try {
      setSnapshotsLoading(true);
      const response = await fetch("/api/performance/snapshots?limit=200&order=desc");
      if (!response.ok) {
        throw new Error("Failed to fetch snapshots");
      }
      const data = await response.json();
      setSnapshots(data.snapshots || []);
    } catch (error) {
      console.error("Error fetching snapshots:", error);
    } finally {
      setSnapshotsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSnapshots();
  }, [fetchSnapshots]);

  const handleCollectSnapshot = useCallback(async () => {
    try {
      setIsCollectingSnapshot(true);
      const response = await fetch("/api/performance/collect", { method: "POST" });
      if (!response.ok) {
        throw new Error("Snapshot collection failed");
      }
      toast({
        title: "Snapshot collected",
        description: "Latest metrics have been stored.",
      });
      await Promise.all([fetchMetrics(), fetchSnapshots()]);
    } catch (error) {
      console.error("Snapshot collection failed:", error);
      toast({
        title: "Collection failed",
        description: "Unable to collect a new metrics snapshot.",
        variant: "destructive",
      });
    } finally {
      setIsCollectingSnapshot(false);
    }
  }, [fetchMetrics, fetchSnapshots, toast]);

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

  const vectorFreshnessHistory = metricsHistory.map((snapshot) => ({
    time: formatTime(snapshot.timestamp),
    staleness: snapshot.dataFreshness.vectorStore.staleness,
  }));

  const trackedEndpoints = ["/api/chat", "/api/aoma-stream", "/api/vector-store", "/api/upload"];
  const apiTrends = metricsHistory.map((snapshot) => {
    const point: Record<string, number | string> = {
      time: formatTime(snapshot.timestamp),
    };
    trackedEndpoints.forEach((endpoint) => {
      const metric = snapshot.apiMetrics.find((apiMetric) => apiMetric.endpoint === endpoint);
      point[endpoint] = metric?.requestCount ?? 0;
    });
    return point;
  });

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

  const sortedAlerts = [...(metrics.alerts ?? [])].sort((a, b) => {
    const severityDiff = SEVERITY_PRIORITY[b.severity] - SEVERITY_PRIORITY[a.severity];
    if (severityDiff !== 0) {
      return severityDiff;
    }
    return new Date(b.triggeredAt).getTime() - new Date(a.triggeredAt).getTime();
  });

  const recentAlertHistory = metricsHistory
    .filter((snapshot) => (snapshot.alerts?.length ?? 0) > 0)
    .map((snapshot) => ({
      timestamp: snapshot.timestamp,
      alerts: [...(snapshot.alerts ?? [])].sort(
        (a, b) => SEVERITY_PRIORITY[b.severity] - SEVERITY_PRIORITY[a.severity]
      ),
    }))
    .slice(-8)
    .reverse();

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
              onClick={() => setAutoRefresh(!autoRefresh)}
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
            <Button
              key={range}
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

      {/* Alerts Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        <Card className="mac-card bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <AlertCircle className="h-5 w-5 text-red-400" />
              Active Alerts
            </CardTitle>
            <CardDescription className="text-gray-400">
              Threshold breaches detected in the latest snapshot
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {sortedAlerts.length === 0 && (
              <div className="flex items-center gap-2 text-sm text-green-400">
                <CheckCircle className="h-4 w-4" />
                All systems are within defined thresholds.
              </div>
            )}
            {sortedAlerts.map((alert) => (
              <div
                key={alert.id}
                className="border border-white/10 rounded-lg p-3 bg-black/30 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">{alert.metricLabel}</p>
                    <p className="text-xs text-gray-400">{alert.category}</p>
                  </div>
                  <Badge
                    variant={alert.severity === "critical" ? "destructive" : "secondary"}
                    className="uppercase"
                  >
                    {alert.severity}
                  </Badge>
                </div>
                <p className="text-sm text-gray-300">{alert.message}</p>
                <div className="flex flex-wrap gap-4 text-xs text-gray-400">
                  <span>Value: {alert.valueDisplay}</span>
                  <span>Threshold: {alert.thresholdDisplay}</span>
                  <span>Triggered: {new Date(alert.triggeredAt).toLocaleTimeString()}</span>
                  {alert.context?.endpoint && <span>Endpoint: {alert.context.endpoint}</span>}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="mac-card bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Recent Alert History</CardTitle>
            <CardDescription className="text-gray-400">
              Snapshot-level alert counts for the selected window
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentAlertHistory.length === 0 && (
              <p className="text-sm text-gray-400">No alerts recorded in this time range.</p>
            )}
            {recentAlertHistory.length > 0 && (
              <div className="space-y-3 text-sm">
                {recentAlertHistory.map((entry) => {
                  const criticalCount = entry.alerts.filter(
                    (alert) => alert.severity === "critical"
                  ).length;
                  const warningCount = entry.alerts.filter(
                    (alert) => alert.severity === "warning"
                  ).length;
                  return (
                    <div
                      key={`${entry.timestamp}-${criticalCount}-${warningCount}`}
                      className="p-3 rounded-lg border border-white/10 bg-black/30"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-white font-medium">
                          {new Date(entry.timestamp).toLocaleString()}
                        </span>
                        <div className="flex gap-2">
                          <Badge variant="destructive">{criticalCount} critical</Badge>
                          <Badge variant="secondary">{warningCount} warning</Badge>
                        </div>
                      </div>
                      <p className="text-xs text-gray-400 line-clamp-2">
                        {entry.alerts.map((alert) => alert.metricLabel).join(", ")}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

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
                    <span className="text-white font-normal">
                      {formatDuration(metrics.queryMetrics.p50ResponseTime)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">P95 Latency</span>
                    <span className="text-white font-normal">
                      {formatDuration(metrics.queryMetrics.p95ResponseTime)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">P99 Latency</span>
                    <span className="text-white font-normal">
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
                    <span className="text-white font-normal">
                      {metrics.dataFreshness.vectorStore.totalDocuments}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Last Update</span>
                    <span className="text-white font-normal">
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
                    <span className="text-white font-normal">
                      {(metrics.dataFreshness.aomaCache.cacheHitRate * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Cache Miss Rate</span>
                    <span className="text-white font-normal">
                      {(metrics.dataFreshness.aomaCache.cacheMissRate * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Last Update</span>
                    <span className="text-white font-normal">
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
                    <span className="text-white font-normal">
                      {metrics.dataFreshness.knowledgeBase.fileCount}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Last Update</span>
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
                      <div className="font-normal text-white mb-2">{api.endpoint}</div>
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

          <Card className="mac-card bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white">API Throughput Trends</CardTitle>
              <CardDescription className="text-gray-400">
                Stacked request counts for the four primary API endpoints.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={apiTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                  <XAxis dataKey="time" stroke="#ffffff60" />
                  <YAxis stroke="#ffffff60" />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #ffffff20" }}
                    labelStyle={{ color: "#ffffff" }}
                  />
                  <Legend />
                  {trackedEndpoints.map((endpoint, index) => (
                    <Bar
                      key={endpoint}
                      dataKey={endpoint}
                      stackId="requests"
                      fill={["#22d3ee", "#a855f7", "#10b981", "#f97316"][index]}
                      name={endpoint}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Vector Store Freshness */}
      <Card className="mac-card bg-white/5 border-white/10 mb-8">
        <CardHeader>
          <CardTitle className="text-white">Vector Store Freshness (Hours)</CardTitle>
          <CardDescription className="text-gray-400">
            Tracks staleness for vector documents over the selected window.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={vectorFreshnessHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
              <XAxis dataKey="time" stroke="#ffffff60" />
              <YAxis stroke="#ffffff60" label={{ value: "Hours", angle: -90, position: "insideLeft" }} />
              <Tooltip
                contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #ffffff20" }}
                labelStyle={{ color: "#ffffff" }}
              />
              <Area
                type="monotone"
                dataKey="staleness"
                stroke="#fbbf24"
                fill="#fbbf2450"
                strokeWidth={2}
                name="Staleness"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Snapshot History */}
      <Card className="mac-card bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Snapshot History</CardTitle>
          <CardDescription className="text-gray-400">
            Snapshots captured via /api/performance/collect or scheduled jobs.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-gray-400">
                <th className="py-2 pr-4">Timestamp</th>
                <th className="py-2 pr-4">CPU</th>
                <th className="py-2 pr-4">Memory</th>
                <th className="py-2 pr-4">Avg Response</th>
                <th className="py-2 pr-4">Error Rate</th>
                <th className="py-2 pr-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {snapshotsLoading && (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-gray-400">
                    Loading snapshots…
                  </td>
                </tr>
              )}
              {!snapshotsLoading && snapshots.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-gray-400">
                    No snapshots recorded yet.
                  </td>
                </tr>
              )}
              {snapshots.map((snapshot) => (
                <tr key={snapshot.id} className="border-t border-white/10">
                  <td className="py-2 pr-4 text-white">
                    {new Date(snapshot.created_at).toLocaleString()}
                  </td>
                  <td className="py-2 pr-4 text-white">
                    {snapshot.metrics.systemMetrics.cpuUsage.toFixed(1)}%
                  </td>
                  <td className="py-2 pr-4 text-white">
                    {snapshot.metrics.systemMetrics.memoryUsage.toFixed(1)}%
                  </td>
                  <td className="py-2 pr-4 text-white">
                    {formatDuration(snapshot.metrics.queryMetrics.avgResponseTime)}
                  </td>
                  <td className="py-2 pr-4 text-white">
                    {snapshot.metrics.queryMetrics.errorRate.toFixed(2)}%
                  </td>
                  <td className="py-2 pr-4 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-white border-white/20"
                      onClick={() => {
                        setSelectedSnapshot(snapshot);
                        setSnapshotDialogOpen(true);
                      }}
                    >
                      View JSON
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Dialog open={snapshotDialogOpen} onOpenChange={setSnapshotDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Snapshot Details</DialogTitle>
            <DialogDescription>
              {selectedSnapshot ? new Date(selectedSnapshot.created_at).toLocaleString() : "No snapshot selected"}
            </DialogDescription>
          </DialogHeader>
          <pre className="bg-black/60 border border-white/10 rounded p-4 text-xs max-h-[60vh] overflow-auto text-white">
            {selectedSnapshot ? JSON.stringify(selectedSnapshot.metrics, null, 2) : "Select a snapshot to inspect"}
          </pre>
        </DialogContent>
      </Dialog>
    </div>
  );
}
