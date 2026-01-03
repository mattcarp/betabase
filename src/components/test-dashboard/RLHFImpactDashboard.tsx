/**
 * RLHF Impact Dashboard Component
 *
 * Visualizes improvement trends and metrics from human feedback
 * Part of Test tab integration - Phase 6
 */

"use client";

import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Badge } from "../ui/badge";
import { TrendingUp, TrendingDown, Activity, Target, Users, Award } from "lucide-react";
import { supabase } from "../../lib/supabase";
import {
  LineChart,
  Line,
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

// Helper to safely get Supabase client - returns null if env vars missing
function getSupabaseClient() {
  if (!supabase) {
    console.warn("Supabase not configured - RLHF Impact Dashboard disabled");
    return null;
  }
  return supabase;
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
  const [supabaseAvailable, setSupabaseAvailable] = useState(true);
  const supabaseRef = useRef<ReturnType<typeof createClientComponentClient> | null>(null);

  useEffect(() => {
    // Lazy-init Supabase client
    if (!supabaseRef.current) {
      supabaseRef.current = getSupabaseClient();
      if (!supabaseRef.current) {
        setSupabaseAvailable(false);
        setLoading(false);
        return;
      }
    }
    loadImpactMetrics();
  }, []);

  const loadImpactMetrics = async () => {
    const supabase = supabaseRef.current;
    if (!supabase) {
      setSupabaseAvailable(false);
      setLoading(false);
      return;
    }

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

  // Graceful fallback when Supabase is not configured
  if (!supabaseAvailable) {
    return (
      <Card className="h-full flex items-center justify-center bg-zinc-900/50 border-zinc-800">
        <div className="text-center text-zinc-500">
          <Activity className="h-8 w-8 mx-auto mb-3 text-yellow-500/60" />
          <p className="text-sm">Database connection not configured</p>
          <p className="text-xs mt-1 text-zinc-600">RLHF Impact Dashboard requires Supabase</p>
        </div>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="h-full flex items-center justify-center bg-zinc-900/50 border-zinc-800">
        <div className="text-zinc-400">Loading impact metrics...</div>
      </Card>
    );
  }

  return (
    <div className="h-full space-y-6">
      {/* Header */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-zinc-100">
            <Activity className="h-5 w-5 text-purple-400" />
            RLHF Impact Dashboard
          </CardTitle>
          <CardDescription className="text-zinc-400">
            Track how human feedback improves AI performance over time
          </CardDescription>
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
