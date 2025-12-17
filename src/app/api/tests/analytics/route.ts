import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// GET: Fetch test analytics and dashboard metrics
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { searchParams } = new URL(request.url);

    const days = parseInt(searchParams.get("days") || "30");
    const app = searchParams.get("app");

    // Get counts from bb_case for real data
    let caseQuery = supabase
      .from("bb_case")
      .select("app_under_test, execution_count, pass_count, fail_count", { count: "exact" });
    
    if (app) {
      caseQuery = caseQuery.eq("app_under_test", app);
    }

    const { data: caseData, count: totalCases } = await caseQuery;

    // Calculate aggregates from bb_case
    const totalExecutions = caseData?.reduce((sum, c) => sum + (c.execution_count || 0), 0) || 0;
    const totalPasses = caseData?.reduce((sum, c) => sum + (c.pass_count || 0), 0) || 0;
    const totalFails = caseData?.reduce((sum, c) => sum + (c.fail_count || 0), 0) || 0;
    const passRate = totalExecutions > 0 ? (totalPasses / totalExecutions) * 100 : 0;

    // Get app breakdown
    const appBreakdown: Record<string, { total: number; executed: number; passes: number; fails: number }> = {};
    caseData?.forEach((c) => {
      const appName = c.app_under_test || "Unknown";
      if (!appBreakdown[appName]) {
        appBreakdown[appName] = { total: 0, executed: 0, passes: 0, fails: 0 };
      }
      appBreakdown[appName].total++;
      if (c.execution_count > 0) {
        appBreakdown[appName].executed++;
        appBreakdown[appName].passes += c.pass_count || 0;
        appBreakdown[appName].fails += c.fail_count || 0;
      }
    });

    // Try to get self-healing stats
    let healingStats = { total: 0, autoHealed: 0, pending: 0, applied: 0 };
    const { data: healingData } = await supabase
      .from("self_healing_attempts")
      .select("status");
    
    if (healingData) {
      healingStats = {
        total: healingData.length,
        autoHealed: healingData.filter(h => h.status === "auto_approved").length,
        pending: healingData.filter(h => h.status === "pending").length,
        applied: healingData.filter(h => h.status === "applied").length,
      };
    }

    // Try to get RLHF test stats
    let rlhfStats = { total: 0, pending: 0, passing: 0 };
    const { data: rlhfData } = await supabase
      .from("rlhf_generated_tests")
      .select("status");
    
    if (rlhfData) {
      rlhfStats = {
        total: rlhfData.length,
        pending: rlhfData.filter(r => r.status === "pending").length,
        passing: rlhfData.filter(r => r.status === "passing").length,
      };
    }

    // Try to get feedback counts
    let feedbackStats = { total: 0, approved: 0, pending: 0 };
    const { data: feedbackData, count: feedbackCount } = await supabase
      .from("rlhf_feedback")
      .select("status", { count: "exact" });
    
    if (feedbackData) {
      feedbackStats = {
        total: feedbackCount || 0,
        approved: feedbackData.filter(f => f.status === "approved").length,
        pending: feedbackData.filter(f => f.status === "pending").length,
      };
    }

    // Build trend data (mock for now, would come from test_analytics_daily)
    const trendData = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      trendData.push({
        date: date.toISOString().split("T")[0],
        runs: Math.floor(Math.random() * 50) + 10,
        passed: Math.floor(Math.random() * 45) + 10,
        failed: Math.floor(Math.random() * 5),
      });
    }

    return NextResponse.json({
      summary: {
        totalTests: totalCases || 0,
        totalExecutions,
        passRate: passRate.toFixed(1),
        testsWithExecutions: caseData?.filter(c => c.execution_count > 0).length || 0,
        testsNeverExecuted: caseData?.filter(c => !c.execution_count).length || 0,
      },
      apps: Object.entries(appBreakdown).map(([name, stats]) => ({
        name,
        ...stats,
        passRate: stats.executed > 0 
          ? ((stats.passes / (stats.passes + stats.fails)) * 100).toFixed(1) 
          : "N/A",
      })),
      selfHealing: healingStats,
      rlhfTests: rlhfStats,
      feedback: feedbackStats,
      trend: trendData,
      meta: {
        days,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error in analytics API:", error);
    return NextResponse.json(
      { error: "Internal server error", details: String(error) },
      { status: 500 }
    );
  }
}

