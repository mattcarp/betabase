/**
 * Zeitgeist Cron Job
 *
 * Runs daily to refresh hot topics based on aggregated activity signals.
 *
 * Vercel Cron: Add to vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/zeitgeist",
 *     "schedule": "0 1 * * *"  // 1am UTC daily
 *   }]
 * }
 *
 * Or call manually for testing: GET /api/cron/zeitgeist?secret=YOUR_CRON_SECRET
 */

import { NextResponse } from "next/server";
import { refreshZeitgeist } from "@/services/zeitgeistService";

export const runtime = "nodejs";
export const maxDuration = 60; // Allow up to 60 seconds

export async function GET(request: Request) {
  // Verify cron secret (for security in production)
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");

  // In production, verify the secret
  if (process.env.NODE_ENV === "production") {
    const expectedSecret = process.env.CRON_SECRET;
    if (expectedSecret && secret !== expectedSecret) {
      // Also check Vercel's cron authorization header
      const authHeader = request.headers.get("authorization");
      if (authHeader !== `Bearer ${expectedSecret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }
  }

  console.log("[Cron] Zeitgeist refresh triggered at", new Date().toISOString());

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
    console.error("[Cron] Zeitgeist refresh failed:", error);

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
