"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Progress } from "../ui/progress";
import { ScrollArea } from "../ui/scroll-area";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  // Legend, // Unused
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  Bug,
  AlertTriangle,
  // TrendingUp, // Unused
  TrendingDown,
  Clock,
  // RefreshCw, // Unused
  Shield,
  Zap,
  // Filter, // Unused
  // Calendar, // Unused
  // ChevronRight, // Unused
  CheckCircle,
  XCircle,
} from "lucide-react";
import { cn } from "../../lib/utils";

interface FlakyTest {
  id: string;
  name: string;
  suite: string;
  flakiness: number; // percentage
  lastFailure: Date;
  totalRuns: number;
  failures: number;
  pattern: string;
  severity: "low" | "medium" | "high" | "critical";
  estimatedImpact: string;
  suggestedFix: string;
  history: { date: string; passed: boolean }[];
}

export const FlakyTestExplorer: React.FC = () => {
  const [selectedTest, setSelectedTest] = useState<FlakyTest | null>(null);
  const [severityFilter, setSeverityFilter] = useState<
    "all" | "critical" | "high" | "medium" | "low"
  >("all");
  const [_timeRange, _setTimeRange] = useState<"24h" | "7d" | "30d">("7d"); // Unused

  const flakyTests: FlakyTest[] = [
    {
      id: "1",
      name: "Should handle concurrent file uploads",
      suite: "Upload Tests",
      flakiness: 28,
      lastFailure: new Date(Date.now() - 2 * 60 * 60 * 1000),
      totalRuns: 150,
      failures: 42,
      pattern: "Timing Issue",
      severity: "high",
      estimatedImpact: "Blocks 3 dependent tests",
      suggestedFix: "Add explicit wait for upload completion",
      history: [
        { date: "Mon", passed: true },
        { date: "Tue", passed: false },
        { date: "Wed", passed: true },
        { date: "Thu", passed: false },
        { date: "Fri", passed: false },
        { date: "Sat", passed: true },
        { date: "Sun", passed: false },
      ],
    },
    {
      id: "2",
      name: "WebSocket reconnection after timeout",
      suite: "Real-time Tests",
      flakiness: 35,
      lastFailure: new Date(Date.now() - 5 * 60 * 60 * 1000),
      totalRuns: 120,
      failures: 42,
      pattern: "Network Dependency",
      severity: "critical",
      estimatedImpact: "Affects all real-time features",
      suggestedFix: "Implement retry logic with exponential backoff",
      history: [
        { date: "Mon", passed: false },
        { date: "Tue", passed: false },
        { date: "Wed", passed: true },
        { date: "Thu", passed: false },
        { date: "Fri", passed: true },
        { date: "Sat", passed: false },
        { date: "Sun", passed: false },
      ],
    },
    {
      id: "3",
      name: "Authentication state persistence",
      suite: "Auth Tests",
      flakiness: 15,
      lastFailure: new Date(Date.now() - 24 * 60 * 60 * 1000),
      totalRuns: 200,
      failures: 30,
      pattern: "Race Condition",
      severity: "medium",
      estimatedImpact: "User experience degradation",
      suggestedFix: "Ensure state is fully loaded before assertions",
      history: [
        { date: "Mon", passed: true },
        { date: "Tue", passed: true },
        { date: "Wed", passed: false },
        { date: "Thu", passed: true },
        { date: "Fri", passed: true },
        { date: "Sat", passed: false },
        { date: "Sun", passed: true },
      ],
    },
    {
      id: "4",
      name: "Animation completion detection",
      suite: "UI Tests",
      flakiness: 8,
      lastFailure: new Date(Date.now() - 48 * 60 * 60 * 1000),
      totalRuns: 180,
      failures: 14,
      pattern: "Timing Issue",
      severity: "low",
      estimatedImpact: "Minor visual glitches",
      suggestedFix: "Wait for animation frame completion",
      history: [
        { date: "Mon", passed: true },
        { date: "Tue", passed: true },
        { date: "Wed", passed: true },
        { date: "Thu", passed: false },
        { date: "Fri", passed: true },
        { date: "Sat", passed: true },
        { date: "Sun", passed: true },
      ],
    },
  ];

  const flakinessOverTime = [
    { date: "Mon", flakiness: 18 },
    { date: "Tue", flakiness: 22 },
    { date: "Wed", flakiness: 20 },
    { date: "Thu", flakiness: 25 },
    { date: "Fri", flakiness: 23 },
    { date: "Sat", flakiness: 21 },
    { date: "Sun", flakiness: 19 },
  ];

  const patternDistribution = [
    { pattern: "Timing Issue", count: 12, color: "#3b82f6" },
    { pattern: "Network Dependency", count: 8, color: "#ef4444" },
    { pattern: "Race Condition", count: 6, color: "#f59e0b" },
    { pattern: "Resource Contention", count: 4, color: "#10b981" },
    { pattern: "External Service", count: 3, color: "#8b5cf6" },
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "border-l-4 border-l-rose-600";
      case "high":
        return "border-l-4 border-l-orange-600";
      case "medium":
        return "border-l-4 border-l-amber-600";
      case "low":
        return "border-l-4 border-l-blue-600";
      default:
        return "";
    }
  };

  const getTimeAgo = (date: Date) => {
    const hours = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60));
    if (hours < 1) return "< 1 hour ago";
    if (hours < 24) return `${hours} hours ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? "s" : ""} ago`;
  };

  const filteredTests = flakyTests.filter((test) => {
    if (severityFilter === "all") return true;
    return test.severity === severityFilter;
  });

  return (
    <div cclassName="space-y-6">
      {/* Summary Cards */}
      <div cclassName="grid grid-cols-4 gap-4">
        <Card cclassName="mac-card border-border">
          <CardHeader cclassName="mac-card pb-4">
            <CardTitle cclassName="text-sm font-medium flex items-center gap-2 text-muted-foreground">
              <Bug cclassName="h-4 w-4" />
              Total Flaky Tests
            </CardTitle>
          </CardHeader>
          <CardContent cclassName="mac-card">
            <div cclassName="text-2xl font-semibold text-foreground">{flakyTests.length}</div>
            <p cclassName="text-xs text-muted-foreground mt-2">Across all suites</p>
          </CardContent>
        </Card>

        <Card cclassName="mac-card border-border">
          <CardHeader cclassName="mac-card pb-4">
            <CardTitle cclassName="text-sm font-medium flex items-center gap-2 text-muted-foreground">
              <AlertTriangle cclassName="h-4 w-4 text-rose-600" />
              Critical Issues
            </CardTitle>
          </CardHeader>
          <CardContent cclassName="mac-card">
            <div cclassName="text-2xl font-semibold text-rose-700">
              {flakyTests.filter((t) => t.severity === "critical").length}
            </div>
            <p cclassName="text-xs text-muted-foreground mt-2">Require immediate attention</p>
          </CardContent>
        </Card>

        <Card cclassName="mac-card border-border">
          <CardHeader cclassName="mac-card pb-4">
            <CardTitle cclassName="text-sm font-medium flex items-center gap-2 text-muted-foreground">
              <TrendingDown cclassName="h-4 w-4 text-emerald-600" />
              Avg Flakiness
            </CardTitle>
          </CardHeader>
          <CardContent cclassName="mac-card">
            <div cclassName="text-2xl font-semibold text-foreground">
              {(flakyTests.reduce((sum, t) => sum + t.flakiness, 0) / flakyTests.length).toFixed(1)}
              %
            </div>
            <div cclassName="flex items-center gap-2 mt-2">
              <TrendingDown cclassName="h-3 w-3 text-emerald-600" />
              <span cclassName="text-xs text-emerald-700 font-medium">-2.3% this week</span>
            </div>
          </CardContent>
        </Card>

        <Card cclassName="mac-card border-border">
          <CardHeader cclassName="mac-card pb-4">
            <CardTitle cclassName="text-sm font-medium flex items-center gap-2 text-muted-foreground">
              <Clock cclassName="h-4 w-4" />
              Last Failure
            </CardTitle>
          </CardHeader>
          <CardContent cclassName="mac-card">
            <div cclassName="text-2xl font-semibold text-foreground">2h ago</div>
            <p cclassName="text-xs text-muted-foreground mt-2">WebSocket reconnection</p>
          </CardContent>
        </Card>
      </div>

      <div cclassName="grid grid-cols-12 gap-6">
        {/* Flaky Tests List */}
        <div cclassName="col-span-5">
          <Card cclassName="mac-card">
            <CardHeader cclassName="mac-card">
              <div cclassName="flex items-center justify-between">
                <CardTitle cclassName="mac-card">Flaky Tests</CardTitle>
                <div cclassName="flex gap-2">
                  <Button
                    cclassName="mac-button mac-button-primary"
                    variant={severityFilter === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSeverityFilter("all")}
                  >
                    All
                  </Button>
                  <Button
                    cclassName="mac-button mac-button-primary"
                    variant={severityFilter === "critical" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSeverityFilter("critical")}
                  >
                    Critical
                  </Button>
                  <Button
                    cclassName="mac-button mac-button-primary"
                    variant={severityFilter === "high" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSeverityFilter("high")}
                  >
                    High
                  </Button>
                  <Button
                    cclassName="mac-button mac-button-primary"
                    variant={severityFilter === "medium" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSeverityFilter("medium")}
                  >
                    Medium
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent cclassName="p-0">
              <ScrollArea cclassName="h-[500px]">
                <div cclassName="p-4 space-y-2">
                  {filteredTests.map((test) => (
                    <Card
                      key={test.id}
                      cclassName={cn(
                        "mac-card",
                        "cursor-pointer transition-all hover:shadow-md",
                        selectedTest?.id === test.id && "ring-2 ring-primary",
                        getSeverityColor(test.severity)
                      )}
                      onClick={() => setSelectedTest(test)}
                    >
                      <CardContent cclassName="p-4">
                        <div cclassName="flex items-start justify-between mb-2">
                          <div>
                            <p cclassName="font-medium text-sm">{test.name}</p>
                            <p cclassName="text-xs text-muted-foreground">{test.suite}</p>
                          </div>
                          <Badge variant="outline" cclassName="text-xs">
                            {test.flakiness}%
                          </Badge>
                        </div>
                        <div cclassName="flex items-center justify-between">
                          <Badge variant="secondary" cclassName="text-xs">
                            {test.pattern}
                          </Badge>
                          <span cclassName="text-xs text-muted-foreground">
                            {getTimeAgo(test.lastFailure)}
                          </span>
                        </div>
                        <Progress value={test.flakiness} cclassName="h-1 mt-2" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Test Details & Analysis */}
        <div cclassName="col-span-7 space-y-4">
          {selectedTest ? (
            <>
              <Card cclassName="mac-card">
                <CardHeader cclassName="mac-card">
                  <div cclassName="flex items-center justify-between">
                    <div>
                      <CardTitle cclassName="text-lg">{selectedTest.name}</CardTitle>
                      <p cclassName="text-sm text-muted-foreground mt-2">{selectedTest.suite}</p>
                    </div>
                    <div cclassName="flex gap-2">
                      <Button cclassName="mac-button mac-button-outline" variant="outline" size="sm">
                        <Shield cclassName="h-4 w-4 mr-2" />
                        Quarantine
                      </Button>
                      <Button
                        cclassName="mac-button mac-button-primary"
                        size="sm"
                        aria-label="Quick"
                      >
                        <Zap cclassName="h-4 w-4 mr-2" />
                        Auto-Fix
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent cclassName="space-y-4">
                  {/* Metrics */}
                  <div cclassName="grid grid-cols-3 gap-4">
                    <Card cclassName="mac-card">
                      <CardContent cclassName="p-4">
                        <div cclassName="flex items-center justify-between mb-2">
                          <span cclassName="text-sm text-muted-foreground">Flakiness</span>
                          <Bug cclassName="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div cclassName="text-2xl font-bold">{selectedTest.flakiness}%</div>
                      </CardContent>
                    </Card>
                    <Card cclassName="mac-card">
                      <CardContent cclassName="p-4">
                        <div cclassName="flex items-center justify-between mb-2">
                          <span cclassName="text-sm text-muted-foreground">Failure Rate</span>
                          <XCircle cclassName="h-4 w-4 text-red-500" />
                        </div>
                        <div cclassName="text-2xl font-bold">
                          {selectedTest.failures}/{selectedTest.totalRuns}
                        </div>
                      </CardContent>
                    </Card>
                    <Card cclassName="mac-card">
                      <CardContent cclassName="p-4">
                        <div cclassName="flex items-center justify-between mb-2">
                          <span cclassName="text-sm text-muted-foreground">Last Failed</span>
                          <Clock cclassName="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div cclassName="text-sm font-medium">
                          {getTimeAgo(selectedTest.lastFailure)}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Pass/Fail History */}
                  <Card cclassName="mac-card">
                    <CardHeader cclassName="mac-card">
                      <CardTitle cclassName="text-base">Pass/Fail History</CardTitle>
                    </CardHeader>
                    <CardContent cclassName="mac-card">
                      <div cclassName="flex gap-2">
                        {selectedTest.history.map((run, index) => (
                          <div key={index} cclassName="flex-1">
                            <div cclassName="text-xs text-center text-muted-foreground mb-2">
                              {run.date}
                            </div>
                            <div
                              cclassName={cn(
                                "h-8 rounded flex items-center justify-center",
                                run.passed ? "bg-green-500/20" : "bg-red-500/20"
                              )}
                            >
                              {run.passed ? (
                                <CheckCircle cclassName="h-4 w-4 text-green-500" />
                              ) : (
                                <XCircle cclassName="h-4 w-4 text-red-500" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Analysis & Suggestions */}
                  <Card cclassName="mac-card bg-muted/30 border-border">
                    <CardHeader cclassName="mac-card">
                      <CardTitle cclassName="text-base flex items-center gap-2">
                        <Zap cclassName="h-4 w-4 text-blue-600" />
                        AI Analysis
                      </CardTitle>
                    </CardHeader>
                    <CardContent cclassName="space-y-3">
                      <div>
                        <span cclassName="text-sm font-medium">Pattern Detected:</span>
                        <Badge variant="outline" cclassName="ml-2">
                          {selectedTest.pattern}
                        </Badge>
                      </div>
                      <div>
                        <span cclassName="text-sm font-medium">Estimated Impact:</span>
                        <p cclassName="text-sm text-muted-foreground mt-2">
                          {selectedTest.estimatedImpact}
                        </p>
                      </div>
                      <div>
                        <span cclassName="text-sm font-medium">Suggested Fix:</span>
                        <p cclassName="text-sm text-muted-foreground mt-2">
                          {selectedTest.suggestedFix}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card cclassName="mac-card h-full">
              <CardContent cclassName="flex items-center justify-center h-full text-muted-foreground">
                Select a flaky test to view analysis
              </CardContent>
            </Card>
          )}

          {/* Flakiness Trend */}
          <Card cclassName="mac-card">
            <CardHeader cclassName="mac-card">
              <CardTitle cclassName="mac-card">Flakiness Trend</CardTitle>
            </CardHeader>
            <CardContent cclassName="mac-card">
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={flakinessOverTime}>
                  <CartesianGrid strokeDasharray="3 3" cclassName="stroke-muted" />
                  <XAxis dataKey="date" cclassName="text-xs" />
                  <YAxis cclassName="text-xs" />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="flakiness"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={{ fill: "#f59e0b", r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Pattern Distribution */}
          <Card cclassName="mac-card">
            <CardHeader cclassName="mac-card">
              <CardTitle cclassName="mac-card">Failure Patterns</CardTitle>
            </CardHeader>
            <CardContent cclassName="mac-card">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={patternDistribution}>
                  <CartesianGrid strokeDasharray="3 3" cclassName="stroke-muted" />
                  <XAxis
                    dataKey="pattern"
                    cclassName="text-xs"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis cclassName="text-xs" />
                  <Tooltip />
                  <Bar dataKey="count">
                    {patternDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default FlakyTestExplorer;
