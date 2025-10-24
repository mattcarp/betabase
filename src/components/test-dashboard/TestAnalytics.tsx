"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Clock,
  Users,
  GitBranch,
  Package,
  Zap,
  Target,
  Award,
  Calendar,
  Download,
} from "lucide-react";
import { cn } from "../../lib/utils";

export const TestAnalytics: React.FC = () => {
  const [timeRange, setTimeRange] = useState("7d");
  const [metricView, setMetricView] = useState("overview");

  // Test execution data over time
  const executionTrend = [
    { date: "Mon", total: 450, passed: 420, failed: 25, skipped: 5 },
    { date: "Tue", total: 480, passed: 445, failed: 30, skipped: 5 },
    { date: "Wed", total: 510, passed: 475, failed: 28, skipped: 7 },
    { date: "Thu", total: 495, passed: 460, failed: 30, skipped: 5 },
    { date: "Fri", total: 520, passed: 485, failed: 28, skipped: 7 },
    { date: "Sat", total: 380, passed: 360, failed: 15, skipped: 5 },
    { date: "Sun", total: 410, passed: 385, failed: 20, skipped: 5 },
  ];

  // Test duration analysis
  const durationDistribution = [
    { range: "0-1s", count: 120 },
    { range: "1-5s", count: 280 },
    { range: "5-10s", count: 150 },
    { range: "10-30s", count: 85 },
    { range: "30-60s", count: 45 },
    { range: ">60s", count: 20 },
  ];

  // Test suite performance
  const suitePerformance = [
    { suite: "Unit", avgDuration: 2.3, successRate: 95, tests: 250 },
    { suite: "Integration", avgDuration: 8.5, successRate: 88, tests: 150 },
    { suite: "E2E", avgDuration: 25.4, successRate: 82, tests: 80 },
    { suite: "API", avgDuration: 5.2, successRate: 92, tests: 120 },
    { suite: "Performance", avgDuration: 45.8, successRate: 78, tests: 50 },
  ];

  // Team productivity metrics
  const teamMetrics = [
    { name: "Tests Written", value: 85, max: 100 },
    { name: "Coverage", value: 83, max: 100 },
    { name: "Fix Rate", value: 92, max: 100 },
    { name: "Review Speed", value: 78, max: 100 },
    { name: "Automation", value: 70, max: 100 },
    { name: "Stability", value: 88, max: 100 },
  ];

  // Test categories breakdown
  const categoriesData = [
    { name: "Unit Tests", value: 45, color: "#3b82f6" },
    { name: "Integration", value: 25, color: "#10b981" },
    { name: "E2E", value: 15, color: "#f59e0b" },
    { name: "API", value: 10, color: "#8b5cf6" },
    { name: "Performance", value: 5, color: "#ef4444" },
  ];

  // Key metrics
  const keyMetrics = {
    avgExecutionTime: "12.5 min",
    avgPassRate: "92.3%",
    testsPerDay: "485",
    mttr: "2.3 hours", // Mean Time To Repair
    testEfficiency: "87%",
    automationRate: "78%",
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24 Hours</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
            </SelectContent>
          </Select>

          <Select value={metricView} onValueChange={setMetricView}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="overview">Overview</SelectItem>
              <SelectItem value="performance">Performance</SelectItem>
              <SelectItem value="quality">Quality</SelectItem>
              <SelectItem value="productivity">Productivity</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          className="mac-button mac-button-outline"
          variant="outline"
          className="mac-button mac-button-outline"
        >
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-6 gap-4">
        <Card className="mac-card">
          <CardHeader className="mac-card pb-4">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Avg Execution
            </CardTitle>
          </CardHeader>
          <CardContent className="mac-card">
            <div className="text-2xl font-bold">{keyMetrics.avgExecutionTime}</div>
            <Badge className="bg-green-500/20 text-green-500 mt-2">
              <TrendingDown className="h-3 w-3 mr-2" />
              -15%
            </Badge>
          </CardContent>
        </Card>

        <Card className="mac-card">
          <CardHeader className="mac-card pb-4">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4" />
              Pass Rate
            </CardTitle>
          </CardHeader>
          <CardContent className="mac-card">
            <div className="text-2xl font-bold">{keyMetrics.avgPassRate}</div>
            <Badge className="bg-green-500/20 text-green-500 mt-2">
              <TrendingUp className="h-3 w-3 mr-2" />
              +2.3%
            </Badge>
          </CardContent>
        </Card>

        <Card className="mac-card">
          <CardHeader className="mac-card pb-4">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Tests/Day
            </CardTitle>
          </CardHeader>
          <CardContent className="mac-card">
            <div className="text-2xl font-bold">{keyMetrics.testsPerDay}</div>
            <Badge className="bg-blue-500/20 text-blue-500 mt-2">Stable</Badge>
          </CardContent>
        </Card>

        <Card className="mac-card">
          <CardHeader className="mac-card pb-4">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="h-4 w-4" />
              MTTR
            </CardTitle>
          </CardHeader>
          <CardContent className="mac-card">
            <div className="text-2xl font-bold">{keyMetrics.mttr}</div>
            <Badge className="bg-green-500/20 text-green-500 mt-2">
              <TrendingDown className="h-3 w-3 mr-2" />
              -0.5h
            </Badge>
          </CardContent>
        </Card>

        <Card className="mac-card">
          <CardHeader className="mac-card pb-4">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Award className="h-4 w-4" />
              Efficiency
            </CardTitle>
          </CardHeader>
          <CardContent className="mac-card">
            <div className="text-2xl font-bold">{keyMetrics.testEfficiency}</div>
            <Badge className="bg-yellow-500/20 text-yellow-500 mt-2">Good</Badge>
          </CardContent>
        </Card>

        <Card className="mac-card">
          <CardHeader className="mac-card pb-4">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Package className="h-4 w-4" />
              Automation
            </CardTitle>
          </CardHeader>
          <CardContent className="mac-card">
            <div className="text-2xl font-bold">{keyMetrics.automationRate}</div>
            <Badge className="bg-green-500/20 text-green-500 mt-2">
              <TrendingUp className="h-3 w-3 mr-2" />
              +5%
            </Badge>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Test Execution Trend */}
        <div className="col-span-8">
          <Card className="mac-card">
            <CardHeader className="mac-card">
              <CardTitle className="mac-card">Test Execution Trend</CardTitle>
            </CardHeader>
            <CardContent className="mac-card">
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={executionTrend}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="passed"
                    stackId="1"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.6}
                  />
                  <Area
                    type="monotone"
                    dataKey="failed"
                    stackId="1"
                    stroke="#ef4444"
                    fill="#ef4444"
                    fillOpacity={0.6}
                  />
                  <Area
                    type="monotone"
                    dataKey="skipped"
                    stackId="1"
                    stroke="#f59e0b"
                    fill="#f59e0b"
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Test Categories */}
        <div className="col-span-4">
          <Card className="mac-card">
            <CardHeader className="mac-card">
              <CardTitle className="mac-card">Test Distribution</CardTitle>
            </CardHeader>
            <CardContent className="mac-card">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoriesData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}%`}
                    outerRadius={80}
                    dataKey="value"
                  >
                    {categoriesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Duration Distribution */}
        <div className="col-span-6">
          <Card className="mac-card">
            <CardHeader className="mac-card">
              <CardTitle className="mac-card">Test Duration Distribution</CardTitle>
            </CardHeader>
            <CardContent className="mac-card">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={durationDistribution}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="range" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Team Performance Radar */}
        <div className="col-span-6">
          <Card className="mac-card">
            <CardHeader className="mac-card">
              <CardTitle className="mac-card">Team Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent className="mac-card">
              <ResponsiveContainer width="100%" height={250}>
                <RadarChart data={teamMetrics}>
                  <PolarGrid className="stroke-muted" />
                  <PolarAngleAxis dataKey="name" className="text-xs" />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} className="text-xs" />
                  <Radar
                    name="Performance"
                    dataKey="value"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.6}
                  />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Suite Performance Table */}
        <div className="col-span-12">
          <Card className="mac-card">
            <CardHeader className="mac-card">
              <CardTitle className="mac-card">Test Suite Performance</CardTitle>
            </CardHeader>
            <CardContent className="mac-card">
              <div className="space-y-4">
                {suitePerformance.map((suite) => (
                  <div
                    key={suite.suite}
                    className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="mac-body font-medium">{suite.suite}</p>
                        <p className="text-sm text-muted-foreground">{suite.tests} tests</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-8">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Avg Duration</p>
                        <p className="mac-body font-medium">{suite.avgDuration}s</p>
                      </div>

                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Success Rate</p>
                        <Badge
                          className={cn(
                            suite.successRate >= 90 && "bg-green-500/20 text-green-500",
                            suite.successRate >= 80 &&
                              suite.successRate < 90 &&
                              "bg-yellow-500/20 text-yellow-500",
                            suite.successRate < 80 && "bg-red-500/20 text-red-500"
                          )}
                        >
                          {suite.successRate}%
                        </Badge>
                      </div>

                      <div className="w-32">
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full transition-all",
                              suite.successRate >= 90 && "bg-green-500",
                              suite.successRate >= 80 && suite.successRate < 90 && "bg-yellow-500",
                              suite.successRate < 80 && "bg-red-500"
                            )}
                            style={{ width: `${suite.successRate}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TestAnalytics;
