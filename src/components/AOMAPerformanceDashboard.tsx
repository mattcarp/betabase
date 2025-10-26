"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Progress } from "./ui/progress";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { aomaRouter, PerformanceMetrics } from "@/services/aomaParallelRouter";
import {
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  Database,
  Gauge,
  Server,
  TrendingDown,
  TrendingUp,
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
} from "recharts";

interface DashboardStats {
  railway: ProviderMetrics;
  render: ProviderMetrics;
  comparison: ComparisonMetrics;
}

interface ProviderMetrics {
  avgLatency: number;
  p50Latency: number;
  p95Latency: number;
  p99Latency: number;
  successRate: number;
  totalRequests: number;
  coldStartRate: number;
  avgPayloadSize: number;
  avgResponseSize: number;
}

interface ComparisonMetrics {
  winner: "railway" | "render";
  improvement: number;
  recommendation: string;
}

export const AOMAPerformanceDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [realtimeMetrics, setRealtimeMetrics] = useState<PerformanceMetrics[]>([]);
  const [isRunningBenchmark, setIsRunningBenchmark] = useState(false);
  const [abTestConfig, setAbTestConfig] = useState(aomaRouter.getConfig());
  const [_selectedTimeRange, _setSelectedTimeRange] = useState<"1m" | "5m" | "15m" | "1h">("5m");

  // Fetch stats periodically
  useEffect(() => {
    const fetchStats = () => {
      const renderStats = aomaRouter.getStatistics("render");
      // Note: Railway has been removed, only Render is used now
      const emptyStats: ProviderMetrics = {
        totalRequests: 0,
        avgLatency: 0,
        p50Latency: 0,
        p95Latency: 0,
        p99Latency: 0,
        successRate: 0,
        coldStartRate: 0,
        avgPayloadSize: 0,
        avgResponseSize: 0,
      };

      const winner = "render";
      const improvement = 0;
      const recommendation = "Render is the primary deployment platform";

      setStats({
        railway: emptyStats, // Legacy field kept for compatibility
        render: renderStats,
        comparison: { winner, improvement, recommendation },
      });

      setRealtimeMetrics(aomaRouter.exportMetrics().slice(-100)); // Last 100 metrics
    };

    fetchStats();
    const interval = setInterval(fetchStats, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  // Run benchmark
  const runQuickBenchmark = useCallback(async () => {
    setIsRunningBenchmark(true);

    try {
      // Run 10 quick comparisons
      for (let i = 0; i < 10; i++) {
        await aomaRouter.compareProviders("/api/health", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
      }
    } catch (error) {
      console.error("Benchmark failed:", error);
    }

    setIsRunningBenchmark(false);
  }, []);

  // Update A/B test configuration
  const updateAbConfig = useCallback(
    (updates: Partial<typeof abTestConfig>) => {
      const newConfig = { ...abTestConfig, ...updates };
      aomaRouter.updateConfig(newConfig);
      setAbTestConfig(newConfig);
    },
    [abTestConfig]
  );

  // Prepare chart data
  const latencyChartData = realtimeMetrics
    .filter((m) => m.success)
    .map((m, index) => ({
      index,
      railway: null, // Railway removed, keeping field for chart compatibility
      render: m.provider === "render" ? m.latency : null,
      timestamp: new Date(m.startTime).toLocaleTimeString(),
    }));

  const performanceComparison = stats
    ? [
        {
          metric: "Avg Latency",
          railway: stats.railway.avgLatency,
          render: stats.render.avgLatency,
        },
        { metric: "P50", railway: stats.railway.p50Latency, render: stats.render.p50Latency },
        { metric: "P95", railway: stats.railway.p95Latency, render: stats.render.p95Latency },
        { metric: "P99", railway: stats.railway.p99Latency, render: stats.render.p99Latency },
      ]
    : [];

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading performance metrics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="mac-heading">AOMA Performance Dashboard</h2>
          <p className="mac-body text-muted-foreground">Real-time A/B testing: Railway vs Render</p>
        </div>
        <div className="flex gap-2">
          <Button
            className="mac-button mac-button-outline"
            onClick={runQuickBenchmark}
            disabled={isRunningBenchmark}
            variant="outline"
            className="mac-button mac-button-outline"
          >
            {isRunningBenchmark ? (
              <>
                <Activity className="h-4 w-4 mr-2 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Quick Benchmark
              </>
            )}
          </Button>
          <Button
            className="mac-button mac-button-primary"
            onClick={() => aomaRouter.clearMetrics()}
            variant="ghost"
          >
            Clear Metrics
          </Button>
        </div>
      </div>

      {/* A/B Test Configuration */}
      <Card className="mac-card">
        <CardHeader className="mac-card">
          <CardTitle className="flex items-center gap-2">
            <Gauge className="h-5 w-5" />
            A/B Test Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="mac-card">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Render Traffic %</label>
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={abTestConfig.renderPercentage}
                  onChange={(e) => updateAbConfig({ renderPercentage: parseInt(e.target.value) })}
                  className="flex-1"
                />
                <span className="w-12 text-right">{abTestConfig.renderPercentage}%</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={abTestConfig.stickySession}
                  onChange={(e) => updateAbConfig({ stickySession: e.target.checked })}
                />
                <span className="text-sm">Sticky Sessions</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={abTestConfig.comparisonMode}
                  onChange={(e) => updateAbConfig({ comparisonMode: e.target.checked })}
                />
                <span className="text-sm">Comparison Mode</span>
              </label>
            </div>
            <div className="flex items-center justify-end">
              <Badge variant={abTestConfig.enabled ? "default" : "secondary"}>
                {abTestConfig.enabled ? "A/B Test Active" : "A/B Test Disabled"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="mac-card">
          <CardHeader className="mac-card pb-2">
            <CardTitle className="text-sm font-medium">Winner</CardTitle>
          </CardHeader>
          <CardContent className="mac-card">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold capitalize">
                {stats.comparison.winner === "render" ? (
                  <span className="text-green-600">Render</span>
                ) : (
                  <span className="text-blue-600">Railway</span>
                )}
              </span>
              {stats.comparison.winner === "render" ? (
                <TrendingUp className="h-8 w-8 text-green-600" />
              ) : (
                <TrendingDown className="h-8 w-8 text-blue-600" />
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {Math.abs(stats.comparison.improvement).toFixed(1)}% faster
            </p>
          </CardContent>
        </Card>

        <Card className="mac-card">
          <CardHeader className="mac-card pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
          </CardHeader>
          <CardContent className="mac-card">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Railway</span>
                <span className="font-semibold">{stats.railway.totalRequests}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Render</span>
                <span className="font-semibold">{stats.render.totalRequests}</span>
              </div>
              <Progress
                value={
                  (stats.render.totalRequests /
                    (stats.railway.totalRequests + stats.render.totalRequests)) *
                  100
                }
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="mac-card">
          <CardHeader className="mac-card pb-2">
            <CardTitle className="text-sm font-medium">Success Rates</CardTitle>
          </CardHeader>
          <CardContent className="mac-card">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Railway</span>
                <div className="flex items-center gap-2">
                  {stats.railway.successRate > 95 ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                  )}
                  <span className="font-semibold">{stats.railway.successRate.toFixed(1)}%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Render</span>
                <div className="flex items-center gap-2">
                  {stats.render.successRate > 95 ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                  )}
                  <span className="font-semibold">{stats.render.successRate.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommendation Alert */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Recommendation</AlertTitle>
        <AlertDescription>{stats.comparison.recommendation}</AlertDescription>
      </Alert>

      {/* Performance Charts */}
      <Tabs defaultValue="latency" className="space-y-4">
        <TabsList>
          <TabsTrigger value="latency">Latency Trends</TabsTrigger>
          <TabsTrigger value="comparison">Performance Comparison</TabsTrigger>
          <TabsTrigger value="distribution">Latency Distribution</TabsTrigger>
        </TabsList>

        <TabsContent value="latency" className="space-y-4">
          <Card className="mac-card">
            <CardHeader className="mac-card">
              <CardTitle className="mac-card">Real-time Latency</CardTitle>
              <CardDescription className="mac-card">Last 100 requests</CardDescription>
            </CardHeader>
            <CardContent className="mac-card">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={latencyChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" />
                  <YAxis label={{ value: "Latency (ms)", angle: -90, position: "insideLeft" }} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="railway"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={false}
                    name="Railway"
                  />
                  <Line
                    type="monotone"
                    dataKey="render"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={false}
                    name="Render"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-4">
          <Card className="mac-card">
            <CardHeader className="mac-card">
              <CardTitle className="mac-card">Performance Metrics Comparison</CardTitle>
              <CardDescription className="mac-card">Railway vs Render</CardDescription>
            </CardHeader>
            <CardContent className="mac-card">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={performanceComparison}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="metric" />
                  <YAxis label={{ value: "Latency (ms)", angle: -90, position: "insideLeft" }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="railway" fill="#3b82f6" name="Railway" />
                  <Bar dataKey="render" fill="#10b981" name="Render" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution" className="space-y-4">
          <Card className="mac-card">
            <CardHeader className="mac-card">
              <CardTitle className="mac-card">Latency Distribution</CardTitle>
              <CardDescription className="mac-card">Response time percentiles</CardDescription>
            </CardHeader>
            <CardContent className="mac-card">
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <h4
                    className="mac-title"
                    className="mac-title font-semibold mb-4 flex items-center gap-2"
                  >
                    <Server className="h-4 w-4" />
                    Railway
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>P50</span>
                        <span>{stats.railway.p50Latency.toFixed(2)}ms</span>
                      </div>
                      <Progress value={50} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>P95</span>
                        <span>{stats.railway.p95Latency.toFixed(2)}ms</span>
                      </div>
                      <Progress value={95} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>P99</span>
                        <span>{stats.railway.p99Latency.toFixed(2)}ms</span>
                      </div>
                      <Progress value={99} className="h-2" />
                    </div>
                  </div>
                </div>

                <div>
                  <h4
                    className="mac-title"
                    className="mac-title font-semibold mb-4 flex items-center gap-2"
                  >
                    <Database className="h-4 w-4" />
                    Render
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>P50</span>
                        <span>{stats.render.p50Latency.toFixed(2)}ms</span>
                      </div>
                      <Progress value={50} className="h-2 bg-green-100" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>P95</span>
                        <span>{stats.render.p95Latency.toFixed(2)}ms</span>
                      </div>
                      <Progress value={95} className="h-2 bg-green-100" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>P99</span>
                        <span>{stats.render.p99Latency.toFixed(2)}ms</span>
                      </div>
                      <Progress value={99} className="h-2 bg-green-100" />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="mac-card">
          <CardHeader className="mac-card">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Cold Start Rate
            </CardTitle>
          </CardHeader>
          <CardContent className="mac-card">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Railway</span>
                <span className="font-semibold">{stats.railway.coldStartRate.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span>Render</span>
                <span className="font-semibold">{stats.render.coldStartRate.toFixed(1)}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mac-card">
          <CardHeader className="mac-card">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Database className="h-4 w-4" />
              Payload Sizes
            </CardTitle>
          </CardHeader>
          <CardContent className="mac-card">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Avg Request</span>
                <span className="font-semibold">
                  {(
                    (stats.railway.avgPayloadSize + stats.render.avgPayloadSize) /
                    2 /
                    1024
                  ).toFixed(2)}
                  KB
                </span>
              </div>
              <div className="flex justify-between">
                <span>Avg Response</span>
                <span className="font-semibold">
                  {(
                    (stats.railway.avgResponseSize + stats.render.avgResponseSize) /
                    2 /
                    1024
                  ).toFixed(2)}
                  KB
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
