"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  CheckCircle,
  AlertTriangle,
  Wrench,
  TrendingUp,
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
  Archive,
} from "lucide-react";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { CuratorQueue } from "../ui/CuratorQueue";
import { TestFilters, TestFilterState, defaultFilters } from "./TestFilters";
import { cn } from "../../lib/utils";

// Tufte-inspired palette: muted, high data-ink ratio (Gold Standard)
const TUFTE_COLORS = {
  primary: "var(--mac-primary-blue-400)",
  accent: "var(--mac-data-coral)",
  success: "var(--mac-data-teal)",
  muted: "var(--mac-text-muted)",
  grid: "var(--mac-utility-border)",
  background: "transparent",
  text: "var(--mac-text-primary)"
};

// Test Intelligence Quality Radar Data (inspired by Curate tab's Gold Standard)
const testIntelligenceData = [
  { subject: 'Coverage', A: 87, fullMark: 100 },
  { subject: 'Pass Rate', A: 80, fullMark: 100 },
  { subject: 'Heal Rate', A: 94, fullMark: 100 },
  { subject: 'Stability', A: 75, fullMark: 100 },
  { subject: 'Performance', A: 88, fullMark: 100 },
];

// Small Multiples: Test Suite Trends (7-day sparklines)
const suiteTrends = [
  { name: 'Authentication', data: [12, 11, 13, 12, 14, 13, 15] },
  { name: 'API Integration', data: [45, 47, 44, 48, 46, 50, 49] },
  { name: 'UI Components', data: [22, 24, 23, 26, 25, 28, 27] },
  { name: 'E2E Flows', data: [8, 9, 7, 10, 11, 10, 12] },
];

// Real analytics data type
interface AnalyticsData {
  summary: {
    totalTests: number;
    totalExecutions: number;
    passRate: string;
    testsWithExecutions: number;
    testsNeverExecuted: number;
  };
  selfHealing: {
    total: number;
    autoHealed: number;
    pending: number;
    applied: number;
  };
  feedback: {
    total: number;
    approved: number;
    pending: number;
  };
}

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
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

  // Fetch real analytics on mount
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch("/api/tests/analytics");
        if (response.ok) {
          const data = await response.json();
          setAnalytics(data);
        }
      } catch (error) {
        console.error("Failed to fetch analytics:", error);
      }
    };
    fetchAnalytics();
  }, []);

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

  // Use real data from API when available, fallback to props/mock
  const healthMetrics = {
    passRate: analytics?.summary?.passRate 
      ? parseFloat(analytics.summary.passRate) 
      : (testStats.total > 0 ? Math.round((testStats.passed / testStats.total) * 100) : 96.2),
    passRateTrend: 2.1,
    failingTests: testStats.failed || 3,
    healedToday: analytics?.selfHealing?.autoHealed || 12,
    pendingReview: analytics?.feedback?.pending || 5,
    flakyTests: 7,
    avgDuration: testStats.duration || 142,
    totalTests: analytics?.summary?.totalTests || 0,
    totalExecutions: analytics?.summary?.totalExecutions || 0,
    testsNeverExecuted: analytics?.summary?.testsNeverExecuted || 0,
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

  // Prevent Recharts SSR issues
  if (typeof window === 'undefined') return null;

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-8 w-full">
      {/* GOLD STANDARD: Intelligence Quality Radar + Small Multiples */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Test Intelligence Quality Radar */}
        <Card className="mac-card mac-glass bg-[var(--mac-surface-elevated)] border-[var(--mac-utility-border)] col-span-1 shadow-lg">
          <CardHeader className="p-3 pb-1">
            <CardTitle className="font-light text-sm flex items-center gap-2">
              <Activity className="h-3.5 w-3.5 text-[var(--mac-primary-blue-400)]" />
              Test Intelligence Index
            </CardTitle>
            <CardDescription className="text-[9px] uppercase tracking-[0.15em] opacity-50">Multi-dimensional test health</CardDescription>
          </CardHeader>
          <CardContent className="h-[200px] p-2 pt-0">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={testIntelligenceData}>
                <PolarGrid stroke={TUFTE_COLORS.grid} strokeDasharray="3 3" />
                <PolarAngleAxis 
                  dataKey="subject" 
                  tick={{ fill: 'var(--mac-text-secondary)', fontSize: 10, fontWeight: 300 }} 
                />
                <Radar
                  name="Quality"
                  dataKey="A"
                  stroke={TUFTE_COLORS.primary}
                  fill={TUFTE_COLORS.primary}
                  fillOpacity={0.15}
                />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Small Multiples: Test Suite Sparklines (Tufte "Small Multiples") */}
        <Card className="mac-card mac-glass bg-[var(--mac-surface-elevated)] border-[var(--mac-utility-border)] lg:col-span-2 shadow-lg">
          <CardHeader className="p-3 pb-1">
            <CardTitle className="font-light text-sm flex items-center gap-2">
              <Target className="h-3.5 w-3.5 text-[var(--mac-primary-blue-400)]" />
              Test Suite Velocity
            </CardTitle>
            <CardDescription className="text-[9px] uppercase tracking-[0.15em] opacity-50">7-day execution trends</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 p-3 pt-1">
            {suiteTrends.map((suite, idx) => (
              <div key={idx} className="flex items-center gap-4 group hover:bg-white/[0.02] py-1 px-2 rounded transition-colors">
                <div className="w-28 text-[11px] text-muted-foreground font-light">{suite.name}</div>
                <div className="flex-1 h-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={suite.data.map((v) => ({ value: v }))}>
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke={TUFTE_COLORS.primary} 
                        strokeWidth={1.5} 
                        dot={false} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-[10px] text-foreground font-mono w-12 text-right">{suite.data[suite.data.length - 1]}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Compact Hero Stats Row - Tufte-inspired density */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        <Card className="mac-card-static border-[var(--mac-utility-border)] bg-[var(--mac-surface-elevated)]/50">
          <CardContent className="p-2">
            <div className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground mb-0.5">Pass Rate</div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-light" style={{ color: 'var(--mac-data-success)' }}>
                {healthMetrics.passRate}%
              </span>
              <span className="flex items-center text-[9px] text-emerald-400">
                <TrendingUp className="h-2.5 w-2.5 mr-0.5" />+{healthMetrics.passRateTrend}%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="mac-card-static border-[var(--mac-utility-border)] bg-[var(--mac-surface-elevated)]/50">
          <CardContent className="p-2">
            <div className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-1">Failing</div>
            <span className="text-xl font-light text-rose-400">{healthMetrics.failingTests}</span>
          </CardContent>
        </Card>

        <Card className="mac-card-static border-[var(--mac-utility-border)] bg-[var(--mac-surface-elevated)]/50">
          <CardContent className="p-2">
            <div className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-1">Auto-Healed</div>
            <span className="text-xl font-light" style={{ color: 'var(--mac-primary-blue-400)' }}>{healthMetrics.healedToday}</span>
          </CardContent>
        </Card>

        <Card className="mac-card-static border-[var(--mac-utility-border)] bg-[var(--mac-surface-elevated)]/50">
          <CardContent className="p-2">
            <div className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-1">Need HITL</div>
            <span className="text-xl font-light text-amber-400">{healthMetrics.pendingReview}</span>
          </CardContent>
        </Card>

        <Card className="mac-card-static border-[var(--mac-utility-border)] bg-[var(--mac-surface-elevated)]/50">
          <CardContent className="p-2">
            <div className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-1">Coverage</div>
            <span className="text-xl font-light text-teal-400">87%</span>
          </CardContent>
        </Card>

        <Card className="mac-card-static border-[var(--mac-utility-border)] bg-[var(--mac-surface-elevated)]/50">
          <CardContent className="p-2">
            <div className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-1">Flaky</div>
            <span className="text-xl font-light text-muted-foreground">{healthMetrics.flakyTests}</span>
          </CardContent>
        </Card>
      </div>

      {/* Historical Test Suite Stats - Tufte-inspired compact banner */}
      {analytics && (
        <Card className="mac-card mac-glass bg-[var(--mac-surface-elevated)] border-[var(--mac-utility-border)] shadow-lg" data-test-id="historical-stats">
          <CardContent className="p-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Archive className="h-4 w-4 text-[var(--mac-primary-blue-400)]" />
                  <span className="text-xs font-normal text-foreground uppercase tracking-wider">Historical Vault</span>
                </div>
                <div className="flex items-center gap-4 text-[11px]">
                  <div>
                    <span className="text-lg font-light text-[var(--mac-primary-blue-400)]">{healthMetrics.totalTests.toLocaleString()}</span>
                    <span className="text-muted-foreground ml-1.5">tests</span>
                  </div>
                  <div className="text-border">•</div>
                  <div>
                    <span className="text-base font-light text-foreground">{healthMetrics.totalExecutions.toLocaleString()}</span>
                    <span className="text-muted-foreground ml-1.5">runs</span>
                  </div>
                  <div className="text-border">•</div>
                  <div>
                    <span className="text-base font-light text-muted-foreground">{healthMetrics.testsNeverExecuted.toLocaleString()}</span>
                    <span className="text-muted-foreground ml-1.5">dormant</span>
                  </div>
                </div>
              </div>
              <Button className="mac-button" 
                variant="ghost" className="mac-button mac-button-outline" 
                size="sm" 
                onClick={() => onNavigate?.("historical")}
                className="text-[var(--mac-primary-blue-400)] hover:bg-[var(--mac-primary-blue-400)]/10 text-xs h-7"
              >
                Explore <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Needs Your Expertise - Compact Tufte style */}
      {healthMetrics.pendingReview > 0 && (
        <Card className="mac-card mac-glass bg-[var(--mac-surface-elevated)] border-[var(--mac-utility-border)] shadow-lg" data-test-id="human-needed-banner">
          <CardContent className="p-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[var(--mac-primary-blue-400)]/10">
                  <Users className="h-4 w-4 text-[var(--mac-primary-blue-400)]" />
                </div>
                <div>
                  <p className="text-xs font-normal text-white">AI Needs Your Expertise</p>
                  <p className="mac-body text-[10px] text-muted-foreground">
                    {healthMetrics.pendingReview} items awaiting review
                  </p>
                </div>
              </div>
              <Button size="sm"
                className="mac-button bg-[var(--mac-primary-blue-400)] text-white hover:bg-[var(--mac-primary-blue-400)]/90 h-8 text-xs"
                onClick={() => setShowCuratorQueue(true)}
              >
                <Eye className="h-3.5 w-3.5 mr-2" />
                Review Queue
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Filters Bar */}
      <Card className="mac-card border-border">
        <CardContent className="p-4">
          <TestFilters filters={filters} onFiltersChange={handleFiltersChange} compact />
        </CardContent>
      </Card>

      {/* Unified Grid: Recent Self-Heals + Attention Items - Gold Standard Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Self-Heals - Compact */}
        <Card className="mac-card mac-glass bg-[var(--mac-surface-elevated)] border-[var(--mac-utility-border)] lg:col-span-2 shadow-lg">
          <CardHeader className="mac-card pb-2 pt-3 px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-light flex items-center gap-2 text-white">
                <Wrench className="h-3.5 w-3.5 text-[var(--mac-primary-blue-400)]" />
                Recent Self-Heals
              </CardTitle>
              <Button variant="ghost"
                size="sm"
                className="mac-button mac-button-outline text-[10px] h-6 text-[var(--mac-primary-blue-400)] hover:bg-[var(--mac-primary-blue-400)]/10"
                onClick={() => onNavigate?.("self-healing")}
              >
                View All <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="space-y-2">
              {recentSelfHeals.map((heal) => (
                <div
                  key={heal.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-card/30 hover:bg-card/50 transition-colors cursor-pointer border border-border"
                  onClick={() => onNavigate?.("self-healing")}
                >
                  <div className="flex items-center gap-2">
                    {heal.status === "approved" ? (
                      <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                    ) : (
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                    )}
                    <div>
                      <p className="text-xs font-normal text-foreground">{heal.testName}</p>
                      <p className="mac-body text-[10px] text-muted-foreground">{heal.time}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className="text-[9px] h-4 px-1.5 border-[var(--mac-primary-blue-400)]/30 text-[var(--mac-primary-blue-400)] bg-[var(--mac-primary-blue-400)]/10"
                    >
                      {heal.confidence}%
                    </Badge>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[9px] h-4 px-1.5",
                        heal.status === "approved" 
                          ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
                          : "border-amber-500/30 text-amber-400 bg-amber-500/10"
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

        {/* Attention Needed - Compact */}
        <Card className="mac-card mac-glass bg-[var(--mac-surface-elevated)] border-[var(--mac-utility-border)] shadow-lg">
          <CardHeader className="mac-card pb-2 pt-3 px-4">
            <CardTitle className="text-sm font-light flex items-center gap-2 text-white">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
              Attention Needed
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="space-y-2">
              {attentionItems.map((item) => (
                <div
                  key={item.id}
                  className="p-2 rounded-lg border border-border cursor-pointer hover:bg-card/30 transition-colors bg-card/20"
                  onClick={() => {
                    if (item.type === "low-confidence") onNavigate?.("results");
                    if (item.type === "flaky") onNavigate?.("flaky");
                    if (item.type === "curator") onNavigate?.("unified");
                  }}
                >
                  <div className="flex items-start gap-2">
                    {item.severity === "warning" ? (
                      <AlertTriangle className="h-3.5 w-3.5 mt-0.5 text-amber-400" />
                    ) : (
                      <Activity className="h-3.5 w-3.5 mt-0.5 text-[var(--mac-primary-blue-400)]" />
                    )}
                    <p className="text-xs text-foreground">{item.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>


      {/* HITL Curator Queue - Compact Gold Standard */}
      <Card className="mac-card mac-glass bg-[var(--mac-surface-elevated)] border-[var(--mac-utility-border)] shadow-lg">
        <CardHeader className="mac-card pb-2 pt-3 px-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-light flex items-center gap-2 text-white">
              <Sparkles className="h-3.5 w-3.5 text-[var(--mac-primary-blue-400)]" />
              HITL Curator Queue
              <Badge variant="outline" className="ml-2 text-[9px] h-4 px-1.5 border-[var(--mac-primary-blue-400)]/30 text-[var(--mac-primary-blue-400)] bg-[var(--mac-primary-blue-400)]/10">
                {healthMetrics.pendingReview} pending
              </Badge>
            </CardTitle>
            <Button variant="ghost" className="mac-button mac-button-outline"
              size="sm"
              onClick={() => setShowCuratorQueue(!showCuratorQueue)}
              className="gap-1.5 h-7 text-xs text-muted-foreground hover:text-foreground"
            >
              {showCuratorQueue ? (
                <><ChevronUp className="h-3 w-3" /> Collapse</>
              ) : (
                <><ChevronDown className="h-3 w-3" /> Expand</>
              )}
            </Button>
          </div>
          <p className="mac-body text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">
            Review AI responses, test corrections, and low-confidence results
          </p>
        </CardHeader>
        {showCuratorQueue && (
          <CardContent className="pt-0 px-4 pb-3">
            <CuratorQueue className="h-[400px]" />
          </CardContent>
        )}
      </Card>

      {/* Quick Actions - Tufte minimal */}
      <div className="flex flex-wrap gap-2">
        <Button variant="ghost" className="mac-button mac-button-outline"
          size="sm"
          onClick={() => onNavigate?.("self-healing")}
          className="gap-2 h-8 text-xs border border-border bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <Wrench className="h-3.5 w-3.5" />
          Review Self-Heals
        </Button>
        <Button variant="ghost" className="mac-button mac-button-outline"
          size="sm"
          onClick={() => onNavigate?.("flaky")}
          className="gap-2 h-8 text-xs border border-border bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Flaky Tests
        </Button>
        <Button variant="ghost" className="mac-button mac-button-outline"
          size="sm"
          onClick={() => onNavigate?.("analytics")}
          className="gap-2 h-8 text-xs border border-border bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <Activity className="h-3.5 w-3.5" />
          Analytics
        </Button>
        <Button variant="ghost" className="mac-button mac-button-outline"
          size="sm"
          onClick={() => onNavigate?.("ai-generate")}
          className="gap-2 h-8 text-xs border border-border bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <Zap className="h-3.5 w-3.5" />
          Generate Tests
        </Button>
        <Button
          variant={showCuratorQueue ? "default" : "ghost"}
          size="sm"
          onClick={() => setShowCuratorQueue(!showCuratorQueue)}
          className={cn(
            "gap-2 h-8 text-xs",
            showCuratorQueue
              ? "bg-[var(--mac-primary-blue-400)] text-white hover:bg-[var(--mac-primary-blue-400)]/90"
              : "border border-border bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <Sparkles className="h-3.5 w-3.5" />
          {showCuratorQueue ? "Hide Curator" : "Open Curator"}
        </Button>
      </div>
    </div>
  );
};

export default TestHomeDashboard;
