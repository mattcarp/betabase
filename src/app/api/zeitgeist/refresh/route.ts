/**
 * Zeitgeist Refresh API
 *
 * Manual trigger to refresh zeitgeist data.
 * Aggregates signals from RLHF, Jira, test failures, and validates against KB.
 *
 * POST /api/zeitgeist/refresh - Triggers a full refresh
 */

import { NextResponse } from "next/server";
import { refreshZeitgeist } from "@/services/zeitgeistService";

export const runtime = "nodejs";
export const maxDuration = 60; // Allow up to 60 seconds for refresh

export async function POST() {
  console.log("[API] Zeitgeist refresh triggered at", new Date().toISOString());

  try {
    const result = await refreshZeitgeist();

    return NextResponse.json({
      success: result.success,
      timestamp: new Date().toISOString(),
      analysis: {
        topicsAnalyzed: result.topicsAnalyzed,
        topicsWithAnswers: result.topicsWithAnswers,
        sourceBreakdown: result.sourceBreakdown,
        topQuestions: result.topQuestions.slice(0, 6),
        duration: result.duration,
      },
    });
  } catch (error) {
    console.error("[API] Zeitgeist refresh failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
