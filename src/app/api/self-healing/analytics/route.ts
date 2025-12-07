/**
 * Self-Healing Analytics API
 *
 * Provides analytics and trends for self-healing test data.
 *
 * Endpoints:
 * - GET: Retrieve analytics with optional date range
 */

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// GET - Retrieve healing analytics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "14");
    const includeHistory = searchParams.get("history") !== "false";

    if (!supabaseAdmin) {
      // Return demo analytics when database not configured
      return NextResponse.json(getDemoAnalytics(days, includeHistory));
    }

    // Get summary stats
    const { data: summaryData } = await supabaseAdmin.rpc("get_self_healing_analytics", {
      p_days: days,
    });

    // Get daily trends if requested
    let trendsData = null;
    if (includeHistory) {
      const { data } = await supabaseAdmin.rpc("get_self_healing_trends", { p_days: days });
      trendsData = data;
    }

    // Get recent activity
    const { data: recentData } = await supabaseAdmin
      .from("self_healing_attempts")
      .select("id, test_name, status, tier, confidence, created_at, healed_at")
      .order("created_at", { ascending: false })
      .limit(10);

    const summary = summaryData?.[0] || getDemoAnalytics(days, false).summary;

    return NextResponse.json({
      summary: {
        totalAttempts: summary.total_attempts || 0,
        autoHealed: summary.auto_healed || 0,
        pendingReview: summary.pending_review || 0,
        successRate: summary.success_rate || 0,
        avgHealTimeMs: summary.avg_heal_time_ms || 0,
        totalTestsImpacted: summary.total_tests_impacted || 0,
        tierBreakdown: {
          tier1: summary.tier1_count || 0,
          tier2: summary.tier2_count || 0,
          tier3: summary.tier3_count || 0,
        },
      },
      trends: trendsData || getDemoAnalytics(days, true).trends,
      recentActivity: recentData || [],
    });
  } catch (error) {
    console.error("Self-healing analytics error:", error);
    // Return demo data on error
    return NextResponse.json(getDemoAnalytics(14, true));
  }
}

// Generate demo analytics data
function getDemoAnalytics(days: number, includeHistory: boolean) {
  const summary = {
    totalAttempts: 1247,
    autoHealed: 1175,
    pendingReview: 18,
    successRate: 94.2,
    avgHealTimeMs: 4200,
    totalTestsImpacted: 3421,
    tierBreakdown: {
      tier1: 1089,
      tier2: 134,
      tier3: 24,
    },
  };

  let trends: any[] = [];
  if (includeHistory) {
    // Generate realistic trend data
    const now = new Date();
    trends = Array.from({ length: days }, (_, i) => {
      const date = new Date(now);
      date.setDate(date.getDate() - (days - 1 - i));

      // Simulate some variance in daily metrics
      const baseAttempts = Math.floor(80 + Math.random() * 40);
      const successfulRate = 0.9 + Math.random() * 0.08;

      return {
        date: date.toISOString().split("T")[0],
        totalAttempts: baseAttempts,
        successful: Math.floor(baseAttempts * successfulRate),
        failed: Math.floor(baseAttempts * (1 - successfulRate) * 0.3),
        pending: Math.floor(baseAttempts * (1 - successfulRate) * 0.7),
      };
    });
  }

  const recentActivity = [
    {
      id: "demo-recent-1",
      test_name: "AOMA Login Flow",
      status: "success",
      tier: 1,
      confidence: 0.95,
      created_at: new Date(Date.now() - 300000).toISOString(),
      healed_at: new Date(Date.now() - 298000).toISOString(),
    },
    {
      id: "demo-recent-2",
      test_name: "Asset Search Filters",
      status: "review",
      tier: 2,
      confidence: 0.72,
      created_at: new Date(Date.now() - 900000).toISOString(),
      healed_at: null,
    },
    {
      id: "demo-recent-3",
      test_name: "Catalog Navigation",
      status: "review",
      tier: 3,
      confidence: 0.45,
      created_at: new Date(Date.now() - 1800000).toISOString(),
      healed_at: null,
    },
    {
      id: "demo-recent-4",
      test_name: "Voice Transcription",
      status: "success",
      tier: 1,
      confidence: 0.98,
      created_at: new Date(Date.now() - 3600000).toISOString(),
      healed_at: new Date(Date.now() - 3595000).toISOString(),
    },
    {
      id: "demo-recent-5",
      test_name: "Dashboard Charts",
      status: "success",
      tier: 1,
      confidence: 0.91,
      created_at: new Date(Date.now() - 7200000).toISOString(),
      healed_at: new Date(Date.now() - 7196000).toISOString(),
    },
  ];

  return {
    summary,
    trends,
    recentActivity,
    demo: true,
  };
}
