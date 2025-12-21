/**
 * RLHF Impact Dashboard Component
 *
 * Visualizes improvement trends and metrics from human feedback
 * Part of Test tab integration - Phase 6
 */

"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Badge } from "../ui/badge";
import { TrendingUp, TrendingDown, Activity, Target, Users, Award, Download, FileText, Table } from "lucide-react";
import { Button } from "../ui/button";
import { useSupabaseClient } from "../../hooks/useSupabaseClient";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";

interface ImpactMetrics {
  avgRating: number;
  ratingTrend: number; // % change from previous period
  totalFeedback: number;
  feedbackTrend: number;
  curatorApprovals: number;
  approvalRate: number;
  avgConfidence: number;
  confidenceTrend: number;
}

interface TimeSeriesData {
  date: string;
  avgRating: number;
  feedbackCount: number;
  confidence: number;
}

interface PeriodMetrics {
  avgRating: number;
  totalFeedback: number;
  curatorApprovals: number;
  approvalRate: number;
  avgConfidence: number;
}

export function RLHFImpactDashboard() {
  const [metrics, setMetrics] = useState<ImpactMetrics>({
    avgRating: 0,
    ratingTrend: 0,
    totalFeedback: 0,
    feedbackTrend: 0,
    curatorApprovals: 0,
    approvalRate: 0,
    avgConfidence: 0,
    confidenceTrend: 0,
  });
  const [timeSeries, setTimeSeries] = useState<TimeSeriesData[]>([]);
  const [loading, setLoading] = useState(true);
  const [previousPeriodMetrics, setPreviousPeriodMetrics] = useState<PeriodMetrics>({
    avgRating: 0,
    totalFeedback: 0,
    curatorApprovals: 0,
    approvalRate: 0,
    avgConfidence: 0,
  });
  const [showComparison, setShowComparison] = useState(false);
  const supabase = useSupabaseClient();

  // Export functions for T069
  const exportToCSV = () => {
    const headers = ["Date", "Average Rating", "Feedback Count", "Confidence %"];
    const rows = timeSeries.map((d) => [
      d.date,
      d.avgRating.toFixed(2),
      d.feedbackCount.toString(),
      d.confidence.toFixed(1),
    ]);

    const csvContent = [
      "RLHF Impact Report - 30 Day Summary",
      "",
      `Generated: ${new Date().toISOString().split("T")[0]}`,
      "",
      "Summary Metrics:",
      `Average Rating,${metrics.avgRating.toFixed(2)}`,
      `Total Feedback,${metrics.totalFeedback}`,
      `Approval Rate,${metrics.approvalRate.toFixed(1)}%`,
      `Avg Confidence,${metrics.avgConfidence.toFixed(1)}%`,
      "",
      "Daily Time Series:",
      headers.join(","),
      ...rows.map((r) => r.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `rlhf-impact-report-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportToPDF = () => {
    // Generate a printable HTML report
    const reportHtml = `
<!DOCTYPE html>
<html>
<head>
  <title>RLHF Impact Report</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
    h1 { color: #18181b; border-bottom: 2px solid #a855f7; padding-bottom: 10px; }
    .summary { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin: 30px 0; }
    .metric { background: #f4f4f5; padding: 20px; border-radius: 8px; }
    .metric-value { font-size: 32px; font-weight: bold; color: #18181b; }
    .metric-label { color: #71717a; font-size: 14px; margin-top: 5px; }
    .trend { font-size: 14px; margin-top: 8px; }
    .trend.positive { color: #22c55e; }
    .trend.negative { color: #ef4444; }
    table { width: 100%; border-collapse: collapse; margin-top: 30px; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e4e4e7; }
    th { background: #f4f4f5; font-weight: 600; }
    .comparison { margin-top: 30px; background: #faf5ff; padding: 20px; border-radius: 8px; }
    .footer { margin-top: 40px; color: #a1a1aa; font-size: 12px; text-align: center; }
  </style>
</head>
<body>
  <h1>RLHF Impact Report</h1>
  <p>Generated: ${new Date().toLocaleDateString()} | Period: Last 30 Days</p>

  <div class="summary">
    <div class="metric">
      <div class="metric-value">${metrics.avgRating.toFixed(2)}</div>
      <div class="metric-label">Average Rating</div>
      <div class="trend ${metrics.ratingTrend >= 0 ? "positive" : "negative"}">
        ${metrics.ratingTrend >= 0 ? "+" : ""}${metrics.ratingTrend.toFixed(1)}% vs previous period
      </div>
    </div>
    <div class="metric">
      <div class="metric-value">${metrics.totalFeedback}</div>
      <div class="metric-label">Total Feedback</div>
      <div class="trend ${metrics.feedbackTrend >= 0 ? "positive" : "negative"}">
        ${metrics.feedbackTrend >= 0 ? "+" : ""}${metrics.feedbackTrend.toFixed(1)}% vs previous period
      </div>
    </div>
    <div class="metric">
      <div class="metric-value">${metrics.approvalRate.toFixed(1)}%</div>
      <div class="metric-label">Approval Rate</div>
    </div>
    <div class="metric">
      <div class="metric-value">${metrics.avgConfidence.toFixed(1)}%</div>
      <div class="metric-label">Avg Confidence</div>
      <div class="trend ${metrics.confidenceTrend >= 0 ? "positive" : "negative"}">
        ${metrics.confidenceTrend >= 0 ? "+" : ""}${metrics.confidenceTrend.toFixed(1)}% vs previous period
      </div>
    </div>
  </div>

  <div class="comparison">
    <h3>Period Comparison</h3>
    <table>
      <tr>
        <th>Metric</th>
        <th>Current (30d)</th>
        <th>Previous (30d)</th>
        <th>Change</th>
      </tr>
      <tr>
        <td>Average Rating</td>
        <td>${metrics.avgRating.toFixed(2)}</td>
        <td>${previousPeriodMetrics.avgRating.toFixed(2)}</td>
        <td class="${metrics.ratingTrend >= 0 ? "positive" : "negative"}">${metrics.ratingTrend >= 0 ? "+" : ""}${metrics.ratingTrend.toFixed(1)}%</td>
      </tr>
      <tr>
        <td>Total Feedback</td>
        <td>${metrics.totalFeedback}</td>
        <td>${previousPeriodMetrics.totalFeedback}</td>
        <td class="${metrics.feedbackTrend >= 0 ? "positive" : "negative"}">${metrics.feedbackTrend >= 0 ? "+" : ""}${metrics.feedbackTrend.toFixed(1)}%</td>
      </tr>
      <tr>
        <td>Approval Rate</td>
        <td>${metrics.approvalRate.toFixed(1)}%</td>
        <td>${previousPeriodMetrics.approvalRate.toFixed(1)}%</td>
        <td>-</td>
      </tr>
      <tr>
        <td>Avg Confidence</td>
        <td>${metrics.avgConfidence.toFixed(1)}%</td>
        <td>${previousPeriodMetrics.avgConfidence.toFixed(1)}%</td>
        <td class="${metrics.confidenceTrend >= 0 ? "positive" : "negative"}">${metrics.confidenceTrend >= 0 ? "+" : ""}${metrics.confidenceTrend.toFixed(1)}%</td>
      </tr>
    </table>
  </div>

  <div class="footer">
    The Betabase | RLHF Impact Dashboard | ${new Date().getFullYear()}
  </div>
</body>
</html>`;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(reportHtml);
      printWindow.document.close();
      printWindow.print();
    }
  };

  useEffect(() => {
    loadImpactMetrics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadImpactMetrics = async () => {
    setLoading(true);

    try {
      // Load overall metrics from rlhf_feedback
      // Using correct column names: feedback_type, feedback_value, retrieved_contexts
      const { data: allFeedback, error } = await supabase
        .from("rlhf_feedback")
        .select("feedback_type, feedback_value, retrieved_contexts, created_at")
        .not("feedback_value", "is", null);

      if (error) {
        console.error("Failed to load metrics:", error);
        return;
      }

      if (!allFeedback || allFeedback.length === 0) {
        setLoading(false);
        return;
      }

      // Calculate current period metrics (last 30 days)
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

      const currentPeriod = allFeedback.filter((f) => new Date(f.created_at) > thirtyDaysAgo);
      const previousPeriod = allFeedback.filter(
        (f) => new Date(f.created_at) > sixtyDaysAgo && new Date(f.created_at) <= thirtyDaysAgo
      );

      // Average rating - using feedback_value.score
      const getRating = (f: any) =>
        f.feedback_value?.score ||
        (f.feedback_type === "thumbs_up" ? 5 : f.feedback_type === "thumbs_down" ? 1 : 3);
      const avgRating =
        currentPeriod.reduce((sum, f) => sum + getRating(f), 0) / currentPeriod.length;
      const prevAvgRating =
        previousPeriod.length > 0
          ? previousPeriod.reduce((sum, f) => sum + getRating(f), 0) / previousPeriod.length
          : avgRating;
      const ratingTrend =
        prevAvgRating > 0 ? ((avgRating - prevAvgRating) / prevAvgRating) * 100 : 0;

      // Feedback count
      const totalFeedback = currentPeriod.length;
      const prevFeedback = previousPeriod.length;
      const feedbackTrend =
        prevFeedback > 0 ? ((totalFeedback - prevFeedback) / prevFeedback) * 100 : 0;

      // Curator approvals (rating >= 4 or thumbs_up)
      const curatorApprovals = currentPeriod.filter(
        (f) => getRating(f) >= 4 || f.feedback_type === "thumbs_up"
      ).length;
      const approvalRate = totalFeedback > 0 ? (curatorApprovals / totalFeedback) * 100 : 0;

      // Confidence (based on retrieved contexts - all are considered relevant if in positive feedback)
      const avgConfidence =
        currentPeriod
          .filter((f) => f.retrieved_contexts && f.retrieved_contexts.length > 0)
          .reduce((sum, f) => {
            // Use similarity scores from retrieved_contexts
            const avgSimilarity =
              f.retrieved_contexts.reduce((s: number, d: any) => s + (d.similarity || 0), 0) /
              f.retrieved_contexts.length;
            return sum + avgSimilarity;
          }, 0) /
          currentPeriod.filter((f) => f.retrieved_contexts && f.retrieved_contexts.length > 0)
            .length || 0;

      const prevConfidence =
        previousPeriod
          .filter((f) => f.retrieved_contexts && f.retrieved_contexts.length > 0)
          .reduce((sum, f) => {
            const avgSimilarity =
              f.retrieved_contexts.reduce((s: number, d: any) => s + (d.similarity || 0), 0) /
              f.retrieved_contexts.length;
            return sum + avgSimilarity;
          }, 0) /
          previousPeriod.filter((f) => f.retrieved_contexts && f.retrieved_contexts.length > 0)
            .length || avgConfidence;

      const confidenceTrend =
        prevConfidence > 0 ? ((avgConfidence - prevConfidence) / prevConfidence) * 100 : 0;

      setMetrics({
        avgRating,
        ratingTrend,
        totalFeedback,
        feedbackTrend,
        curatorApprovals,
        approvalRate,
        avgConfidence: avgConfidence * 100, // Convert to percentage
        confidenceTrend,
      });

      // T070: Store previous period metrics for comparison
      const prevCuratorApprovals = previousPeriod.filter(
        (f) => getRating(f) >= 4 || f.feedback_type === "thumbs_up"
      ).length;
      const prevApprovalRate =
        previousPeriod.length > 0 ? (prevCuratorApprovals / previousPeriod.length) * 100 : 0;

      setPreviousPeriodMetrics({
        avgRating: prevAvgRating,
        totalFeedback: previousPeriod.length,
        curatorApprovals: prevCuratorApprovals,
        approvalRate: prevApprovalRate,
        avgConfidence: prevConfidence * 100,
      });

      // Generate time series data (last 30 days)
      const timeSeriesData: TimeSeriesData[] = [];
      for (let i = 29; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dayStart = new Date(date.setHours(0, 0, 0, 0));
        const dayEnd = new Date(date.setHours(23, 59, 59, 999));

        const dayFeedback = allFeedback.filter((f) => {
          const fDate = new Date(f.created_at);
          return fDate >= dayStart && fDate <= dayEnd;
        });

        const dayAvgRating =
          dayFeedback.length > 0
            ? dayFeedback.reduce((sum, f) => sum + getRating(f), 0) / dayFeedback.length
            : 0;

        const dayConfidence =
          dayFeedback
            .filter((f) => f.retrieved_contexts && f.retrieved_contexts.length > 0)
            .reduce((sum, f) => {
              const avgSimilarity =
                f.retrieved_contexts.reduce((s: number, d: any) => s + (d.similarity || 0), 0) /
                f.retrieved_contexts.length;
              return sum + avgSimilarity;
            }, 0) /
            dayFeedback.filter((f) => f.retrieved_contexts && f.retrieved_contexts.length > 0)
              .length || 0;

        timeSeriesData.push({
          date: dayStart.toISOString().split("T")[0],
          avgRating: dayAvgRating,
          feedbackCount: dayFeedback.length,
          confidence: dayConfidence * 100,
        });
      }

      setTimeSeries(timeSeriesData);
    } catch (error) {
      // Network failures are expected during rapid navigation/tests - fail silently
      if (error instanceof TypeError && error.message === "Failed to fetch") {
        // Silently ignore aborted requests
      } else {
        console.warn("Error loading impact metrics:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  const MetricCard = ({
    title,
    value,
    trend,
    icon: Icon,
    color,
  }: {
    title: string;
    value: string | number;
    trend?: number;
    icon: any;
    color: string;
  }) => (
    <Card className="bg-zinc-900/30 border-zinc-800">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className={`p-2 rounded-lg ${color}`}>
            <Icon className="h-5 w-5" />
          </div>
          {trend !== undefined && (
            <Badge
              variant="outline"
              className={
                trend >= 0 ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
              }
            >
              {trend >= 0 ? (
                <TrendingUp className="h-3 w-3 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1" />
              )}
              {Math.abs(trend).toFixed(1)}%
            </Badge>
          )}
        </div>
        <div className="text-3xl font-bold text-zinc-100 mb-1">{value}</div>
        <div className="text-sm text-zinc-500">{title}</div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Card className="h-full flex items-center justify-center bg-zinc-900/50 border-zinc-800">
        <div className="text-zinc-400">Loading impact metrics...</div>
      </Card>
    );
  }

  return (
    <div className="h-full space-y-6">
      {/* Header with Export Buttons (T069) */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-zinc-100">
                <Activity className="h-5 w-5 text-purple-400" />
                RLHF Impact Dashboard
              </CardTitle>
              <CardDescription className="text-zinc-400 mt-1">
                Track how human feedback improves AI performance over time
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowComparison(!showComparison)}
                className="border border-border bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <Table className="h-4 w-4 mr-2" />
                {showComparison ? "Hide" : "Show"} Comparison
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={exportToCSV}
                className="border border-border bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <Download className="h-4 w-4 mr-2" />
                CSV
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={exportToPDF}
                className="border border-border bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <FileText className="h-4 w-4 mr-2" />
                PDF
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Average Rating"
          value={metrics.avgRating.toFixed(2)}
          trend={metrics.ratingTrend}
          icon={Award}
          color="bg-purple-500/20 text-purple-400"
        />
        <MetricCard
          title="Total Feedback"
          value={metrics.totalFeedback}
          trend={metrics.feedbackTrend}
          icon={Users}
          color="bg-blue-500/20 text-blue-400"
        />
        <MetricCard
          title="Approval Rate"
          value={`${metrics.approvalRate.toFixed(1)}%`}
          icon={Target}
          color="bg-green-500/20 text-green-400"
        />
        <MetricCard
          title="Avg Confidence"
          value={`${metrics.avgConfidence.toFixed(1)}%`}
          trend={metrics.confidenceTrend}
          icon={TrendingUp}
          color="bg-amber-500/20 text-amber-400"
        />
      </div>

      {/* Period Comparison (T070) */}
      {showComparison && (
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-zinc-100 text-lg flex items-center gap-2">
              <Table className="h-5 w-5 text-blue-400" />
              Period Comparison
            </CardTitle>
            <CardDescription className="text-zinc-400">
              Current 30 days vs previous 30 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-800">
                    <th className="text-left py-3 px-4 text-zinc-400 font-medium">Metric</th>
                    <th className="text-right py-3 px-4 text-zinc-400 font-medium">Current (30d)</th>
                    <th className="text-right py-3 px-4 text-zinc-400 font-medium">Previous (30d)</th>
                    <th className="text-right py-3 px-4 text-zinc-400 font-medium">Change</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-zinc-800/50">
                    <td className="py-3 px-4 text-zinc-300">Average Rating</td>
                    <td className="py-3 px-4 text-right text-zinc-100 font-medium">
                      {metrics.avgRating.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right text-zinc-400">
                      {previousPeriodMetrics.avgRating.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Badge
                        variant="outline"
                        className={
                          metrics.ratingTrend >= 0
                            ? "bg-green-500/10 text-green-400 border-green-500/20"
                            : "bg-red-500/10 text-red-400 border-red-500/20"
                        }
                      >
                        {metrics.ratingTrend >= 0 ? "+" : ""}
                        {metrics.ratingTrend.toFixed(1)}%
                      </Badge>
                    </td>
                  </tr>
                  <tr className="border-b border-zinc-800/50">
                    <td className="py-3 px-4 text-zinc-300">Total Feedback</td>
                    <td className="py-3 px-4 text-right text-zinc-100 font-medium">
                      {metrics.totalFeedback}
                    </td>
                    <td className="py-3 px-4 text-right text-zinc-400">
                      {previousPeriodMetrics.totalFeedback}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Badge
                        variant="outline"
                        className={
                          metrics.feedbackTrend >= 0
                            ? "bg-green-500/10 text-green-400 border-green-500/20"
                            : "bg-red-500/10 text-red-400 border-red-500/20"
                        }
                      >
                        {metrics.feedbackTrend >= 0 ? "+" : ""}
                        {metrics.feedbackTrend.toFixed(1)}%
                      </Badge>
                    </td>
                  </tr>
                  <tr className="border-b border-zinc-800/50">
                    <td className="py-3 px-4 text-zinc-300">Curator Approvals</td>
                    <td className="py-3 px-4 text-right text-zinc-100 font-medium">
                      {metrics.curatorApprovals}
                    </td>
                    <td className="py-3 px-4 text-right text-zinc-400">
                      {previousPeriodMetrics.curatorApprovals}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {previousPeriodMetrics.curatorApprovals > 0 ? (
                        <Badge
                          variant="outline"
                          className={
                            metrics.curatorApprovals >= previousPeriodMetrics.curatorApprovals
                              ? "bg-green-500/10 text-green-400 border-green-500/20"
                              : "bg-red-500/10 text-red-400 border-red-500/20"
                          }
                        >
                          {metrics.curatorApprovals >= previousPeriodMetrics.curatorApprovals ? "+" : ""}
                          {(
                            ((metrics.curatorApprovals - previousPeriodMetrics.curatorApprovals) /
                              previousPeriodMetrics.curatorApprovals) *
                            100
                          ).toFixed(1)}
                          %
                        </Badge>
                      ) : (
                        <span className="text-zinc-500">-</span>
                      )}
                    </td>
                  </tr>
                  <tr className="border-b border-zinc-800/50">
                    <td className="py-3 px-4 text-zinc-300">Approval Rate</td>
                    <td className="py-3 px-4 text-right text-zinc-100 font-medium">
                      {metrics.approvalRate.toFixed(1)}%
                    </td>
                    <td className="py-3 px-4 text-right text-zinc-400">
                      {previousPeriodMetrics.approvalRate.toFixed(1)}%
                    </td>
                    <td className="py-3 px-4 text-right">
                      {previousPeriodMetrics.approvalRate > 0 ? (
                        <Badge
                          variant="outline"
                          className={
                            metrics.approvalRate >= previousPeriodMetrics.approvalRate
                              ? "bg-green-500/10 text-green-400 border-green-500/20"
                              : "bg-red-500/10 text-red-400 border-red-500/20"
                          }
                        >
                          {metrics.approvalRate >= previousPeriodMetrics.approvalRate ? "+" : ""}
                          {(metrics.approvalRate - previousPeriodMetrics.approvalRate).toFixed(1)}pp
                        </Badge>
                      ) : (
                        <span className="text-zinc-500">-</span>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 text-zinc-300">Avg Confidence</td>
                    <td className="py-3 px-4 text-right text-zinc-100 font-medium">
                      {metrics.avgConfidence.toFixed(1)}%
                    </td>
                    <td className="py-3 px-4 text-right text-zinc-400">
                      {previousPeriodMetrics.avgConfidence.toFixed(1)}%
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Badge
                        variant="outline"
                        className={
                          metrics.confidenceTrend >= 0
                            ? "bg-green-500/10 text-green-400 border-green-500/20"
                            : "bg-red-500/10 text-red-400 border-red-500/20"
                        }
                      >
                        {metrics.confidenceTrend >= 0 ? "+" : ""}
                        {metrics.confidenceTrend.toFixed(1)}%
                      </Badge>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Time Series Chart (Simplified ASCII representation) */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-100 text-lg">30-Day Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {/* Rating Trend */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm font-medium text-zinc-400">Average Rating Trend</div>
                <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/20">
                  Last 30 Days
                </Badge>
              </div>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timeSeries}>
                    <defs>
                      <linearGradient id="colorRating" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--mac-accent-purple-400)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="var(--mac-accent-purple-400)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#666", fontSize: 10 }}
                      minTickGap={30}
                    />
                    <YAxis
                      domain={[0, 5]}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#666", fontSize: 10 }}
                    />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: "rgba(9, 9, 11, 0.9)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                      itemStyle={{ color: "var(--mac-accent-purple-400)" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="avgRating"
                      stroke="var(--mac-accent-purple-400)"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorRating)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Confidence Trend */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm font-medium text-zinc-400">Retrieval Confidence Trend</div>
                <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/20">
                  Semantic Accuracy
                </Badge>
              </div>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timeSeries}>
                    <defs>
                      <linearGradient id="colorConf" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--mac-accent-orange-400)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="var(--mac-accent-orange-400)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#666", fontSize: 10 }}
                      minTickGap={30}
                    />
                    <YAxis
                      domain={[0, 100]}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#666", fontSize: 10 }}
                      unit="%"
                    />
                    <RechartsTooltip
                      contentStyle={{
                        backgroundColor: "rgba(9, 9, 11, 0.9)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                      itemStyle={{ color: "var(--mac-accent-orange-400)" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="confidence"
                      stroke="var(--mac-accent-orange-400)"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorConf)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Feedback Volume */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm font-medium text-zinc-400">Daily Feedback Volume</div>
                <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20">
                  Engagement
                </Badge>
              </div>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={timeSeries}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#666", fontSize: 10 }}
                      minTickGap={30}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#666", fontSize: 10 }}
                    />
                    <RechartsTooltip
                      cursor={{ fill: "rgba(255,255,255,0.05)" }}
                      contentStyle={{
                        backgroundColor: "rgba(9, 9, 11, 0.9)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                      itemStyle={{ color: "var(--mac-primary-blue-400)" }}
                    />
                    <Bar
                      dataKey="feedbackCount"
                      fill="var(--mac-primary-blue-400)"
                      radius={[4, 4, 0, 0]}
                      fillOpacity={0.6}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Insights */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-zinc-100 text-lg">Key Insights</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {metrics.ratingTrend > 5 && (
            <div className="flex items-start gap-3 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
              <TrendingUp className="h-5 w-5 text-green-400 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-green-400">Positive Rating Trend</div>
                <div className="text-xs text-zinc-400">
                  Average rating improved by {metrics.ratingTrend.toFixed(1)}% - feedback loop is
                  working!
                </div>
              </div>
            </div>
          )}

          {metrics.approvalRate > 70 && (
            <div className="flex items-start gap-3 p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
              <Award className="h-5 w-5 text-purple-400 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-purple-400">High Approval Rate</div>
                <div className="text-xs text-zinc-400">
                  {metrics.approvalRate.toFixed(1)}% of responses are curator-approved - excellent
                  quality!
                </div>
              </div>
            </div>
          )}

          {metrics.confidenceTrend > 10 && (
            <div className="flex items-start gap-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <Target className="h-5 w-5 text-amber-400 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-amber-400">Confidence Increasing</div>
                <div className="text-xs text-zinc-400">
                  Document relevance confidence up {metrics.confidenceTrend.toFixed(1)}% - retrieval
                  improving!
                </div>
              </div>
            </div>
          )}

          {metrics.totalFeedback === 0 && (
            <div className="flex items-start gap-3 p-3 bg-zinc-800/50 border border-zinc-700 rounded-lg">
              <Users className="h-5 w-5 text-zinc-400 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-zinc-400">No Data Yet</div>
                <div className="text-xs text-zinc-500">
                  Start curating feedback to see impact metrics and trends!
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
