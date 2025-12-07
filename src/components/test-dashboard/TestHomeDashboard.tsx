"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Progress } from "../ui/progress";
import { ScrollArea } from "../ui/scroll-area";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Wrench,
  TrendingUp,
  TrendingDown,
  Clock,
  Zap,
  Activity,
  ArrowRight,
  Eye,
  RefreshCw,
  Target,
  Users,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { CuratorQueue } from "../ui/CuratorQueue";
import { TestFilters, TestFilterState, defaultFilters } from "./TestFilters";
import { cn } from "../../lib/utils";

interface TestHomeDashboardProps {
  onNavigate?: (tab: string) => void;
  testStats?: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    duration: number;
  };
}

export const TestHomeDashboard: React.FC<TestHomeDashboardProps> = ({
  onNavigate,
  testStats = { total: 0, passed: 0, failed: 0, skipped: 0, duration: 0 },
}) => {
  const [showCuratorQueue, setShowCuratorQueue] = useState(false);
  const [filters, setFilters] = useState<TestFilterState>(defaultFilters);

  const handleFiltersChange = (newFilters: TestFilterState) => {
    setFilters(newFilters);
    // Navigate to results tab if any filter is active
    if (
      newFilters.search ||
      newFilters.status.length > 0 ||
      newFilters.flaky ||
      newFilters.selfHealed ||
      newFilters.needsReview
    ) {
      onNavigate?.("results");
    }
  };

  // Mock data for demonstration - would be fetched from API
  const healthMetrics = {
    passRate: testStats.total > 0 ? Math.round((testStats.passed / testStats.total) * 100) : 96.2,
    passRateTrend: 2.1,
    failingTests: testStats.failed || 3,
    healedToday: 12,
    pendingReview: 5,
    flakyTests: 7,
    avgDuration: testStats.duration || 142,
  };

  const recentSelfHeals = [
    {
      id: "1",
      testName: "login-button selector",
      time: "2 hours ago",
      status: "approved",
      confidence: 95,
    },
    {
      id: "2",
      testName: "checkout-form ID",
      time: "yesterday",
      status: "approved",
      confidence: 92,
    },
    {
      id: "3",
      testName: "nav-menu structure",
      time: "2 days ago",
      status: "pending",
      confidence: 78,
    },
  ];

  const attentionItems = [
    {
      id: "1",
      type: "low-confidence",
      message: "3 tests with confidence < 70%",
      severity: "warning",
    },
    {
      id: "2",
      type: "flaky",
      message: "2 tests increasingly flaky",
      severity: "warning",
    },
    {
      id: "3",
      type: "curator",
      message: "5 items awaiting curator review",
      severity: "info",
    },
  ];

  const getPassRateColor = (rate: number) => {
    if (rate >= 95) return "text-emerald-600";
    if (rate >= 85) return "text-amber-600";
    return "text-rose-600";
  };

  return (
    <div className="space-y-6">
      {/* Hero Stats Row */}
      <div className="grid grid-cols-4 gap-4">
        {/* Pass Rate */}
        <Card className="mac-card border-border relative overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Pass Rate</p>
                <div className="flex items-baseline gap-2">
                  <span
                    className={cn("text-4xl font-light", getPassRateColor(healthMetrics.passRate))}
                  >
                    {healthMetrics.passRate}%
                  </span>
                  {healthMetrics.passRateTrend > 0 ? (
                    <span className="flex items-center text-emerald-600 text-sm">
                      <TrendingUp className="h-4 w-4 mr-1" />+{healthMetrics.passRateTrend}%
                    </span>
                  ) : (
                    <span className="flex items-center text-rose-600 text-sm">
                      <TrendingDown className="h-4 w-4 mr-1" />
                      {healthMetrics.passRateTrend}%
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">this week</p>
              </div>
              <div className="p-2 rounded-full bg-emerald-500/10">
                <CheckCircle className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Failing Tests */}
        <Card className="mac-card border-border">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Failing</p>
                <span
                  className={cn(
                    "text-4xl font-light",
                    healthMetrics.failingTests > 0 ? "text-rose-600" : "text-emerald-600"
                  )}
                >
                  {healthMetrics.failingTests}
                </span>
                <p className="text-xs text-muted-foreground mt-1">tests need attention</p>
              </div>
              <div
                className={cn(
                  "p-2 rounded-full",
                  healthMetrics.failingTests > 0 ? "bg-rose-500/10" : "bg-emerald-500/10"
                )}
              >
                <XCircle
                  className={cn(
                    "h-6 w-6",
                    healthMetrics.failingTests > 0 ? "text-rose-600" : "text-emerald-600"
                  )}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Self-Healed Today */}
        <Card className="mac-card border-border">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Self-Healed</p>
                <span className="text-4xl font-light text-purple-600">
                  {healthMetrics.healedToday}
                </span>
                <p className="text-xs text-muted-foreground mt-1">tests auto-fixed today</p>
              </div>
              <div className="p-2 rounded-full bg-purple-500/10">
                <Wrench className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pending HITL Review */}
        <Card className="mac-card border-border">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Need HITL</p>
                <span
                  className={cn(
                    "text-4xl font-light",
                    healthMetrics.pendingReview > 0 ? "text-amber-600" : "text-muted-foreground"
                  )}
                >
                  {healthMetrics.pendingReview}
                </span>
                <p className="text-xs text-muted-foreground mt-1">awaiting human review</p>
              </div>
              <div
                className={cn(
                  "p-2 rounded-full",
                  healthMetrics.pendingReview > 0 ? "bg-amber-500/10" : "bg-muted"
                )}
              >
                <Users
                  className={cn(
                    "h-6 w-6",
                    healthMetrics.pendingReview > 0 ? "text-amber-600" : "text-muted-foreground"
                  )}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Filters Bar */}
      <Card className="mac-card border-border">
        <CardContent className="p-4">
          <TestFilters filters={filters} onFiltersChange={handleFiltersChange} compact />
        </CardContent>
      </Card>

      {/* Main Content Grid */}
      <div className="grid grid-cols-3 gap-6">
        {/* Recent Self-Heals */}
        <Card className="mac-card border-border col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Wrench className="h-4 w-4 text-purple-600" />
                Recent Self-Heals
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs"
                onClick={() => onNavigate?.("self-healing")}
              >
                View All
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentSelfHeals.map((heal) => (
                <div
                  key={heal.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted/80 transition-colors cursor-pointer"
                  onClick={() => onNavigate?.("self-healing")}
                >
                  <div className="flex items-center gap-3">
                    {heal.status === "approved" ? (
                      <CheckCircle className="h-5 w-5 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-amber-600" />
                    )}
                    <div>
                      <p className="text-sm font-medium">{heal.testName}</p>
                      <p className="text-xs text-muted-foreground">{heal.time}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs",
                        heal.status === "approved"
                          ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                          : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                      )}
                    >
                      {heal.confidence}% confidence
                    </Badge>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs",
                        heal.status === "approved"
                          ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                          : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                      )}
                    >
                      {heal.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Attention Needed */}
        <Card className="mac-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              Attention Needed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {attentionItems.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    "p-3 rounded-lg border cursor-pointer hover:shadow-sm transition-shadow",
                    item.severity === "warning"
                      ? "bg-amber-500/5 border-amber-500/20"
                      : "bg-blue-500/5 border-blue-500/20"
                  )}
                  onClick={() => {
                    if (item.type === "low-confidence") onNavigate?.("results");
                    if (item.type === "flaky") onNavigate?.("flaky");
                    if (item.type === "curator") onNavigate?.("unified");
                  }}
                >
                  <div className="flex items-start gap-2">
                    {item.severity === "warning" ? (
                      <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
                    ) : (
                      <Activity className="h-4 w-4 text-blue-600 mt-0.5" />
                    )}
                    <p className="text-sm">{item.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="mac-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-muted-foreground">Coverage</span>
              </div>
              <span className="text-lg font-medium">87%</span>
            </div>
            <Progress value={87} className="h-1.5 mt-2" />
          </CardContent>
        </Card>

        <Card className="mac-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-purple-600" />
                <span className="text-sm text-muted-foreground">Heal Rate</span>
              </div>
              <span className="text-lg font-medium">94.2%</span>
            </div>
            <Progress value={94.2} className="h-1.5 mt-2" />
          </CardContent>
        </Card>

        <Card className="mac-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-amber-600" />
                <span className="text-sm text-muted-foreground">Flaky Tests</span>
              </div>
              <span className="text-lg font-medium">{healthMetrics.flakyTests}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="mac-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-slate-600" />
                <span className="text-sm text-muted-foreground">Avg Duration</span>
              </div>
              <span className="text-lg font-medium">
                {Math.floor(healthMetrics.avgDuration / 60)}:
                {(healthMetrics.avgDuration % 60).toString().padStart(2, "0")}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* HITL Curator Queue Section */}
      <Card className="mac-card border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-600" />
              HITL Curator Queue
              <Badge variant="secondary" className="ml-2">
                {healthMetrics.pendingReview} pending
              </Badge>
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCuratorQueue(!showCuratorQueue)}
              className="gap-2"
            >
              {showCuratorQueue ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  Collapse
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  Expand
                </>
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Review and approve AI responses, test corrections, and low-confidence results
          </p>
        </CardHeader>
        {showCuratorQueue && (
          <CardContent className="pt-0">
            <CuratorQueue className="h-[500px]" />
          </CardContent>
        )}
      </Card>

      {/* Quick Actions */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onNavigate?.("self-healing")}
          className="gap-2"
        >
          <Wrench className="h-4 w-4" />
          Review Self-Heals
        </Button>
        <Button variant="outline" size="sm" onClick={() => onNavigate?.("flaky")} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Explore Flaky Tests
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onNavigate?.("analytics")}
          className="gap-2"
        >
          <Activity className="h-4 w-4" />
          View Analytics
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onNavigate?.("ai-generate")}
          className="gap-2"
        >
          <Zap className="h-4 w-4" />
          Generate Tests
        </Button>
        <Button
          variant={showCuratorQueue ? "default" : "outline"}
          size="sm"
          onClick={() => setShowCuratorQueue(!showCuratorQueue)}
          className="gap-2"
        >
          <Sparkles className="h-4 w-4" />
          {showCuratorQueue ? "Hide Curator" : "Open Curator"}
        </Button>
      </div>
    </div>
  );
};

export default TestHomeDashboard;
