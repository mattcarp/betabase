/**
 * Zeitgeist Trending API
 *
 * Returns the full list of trending topics with scores, sources, and metadata.
 * Used by the manager dashboard for visibility into hot topics.
 *
 * GET /api/zeitgeist/trending - Returns all trending topics with full details
 */

import { NextResponse } from "next/server";
import { getTrendingTopics, getStats } from "@/services/zeitgeistService";

export const runtime = "nodejs";

export async function GET() {
  try {
    const [topics, stats] = await Promise.all([
      getTrendingTopics(),
      getStats(),
    ]);

    return NextResponse.json({
      topics: topics.map((topic) => ({
        id: topic.id,
        question: topic.question,
        score: topic.rawScore,
        frequency: topic.frequency,
        trend: topic.trend,
        hasGoodAnswer: topic.hasGoodAnswer,
        answerConfidence: topic.answerConfidence,
        sources: topic.sources.map((s) => ({
          type: s.type,
          count: s.count,
          weight: s.weight,
        })),
        category: topic.category,
        lastSeen: topic.lastSeen,
      })),
      stats: {
        totalTopics: stats.totalTopics,
        withGoodAnswers: stats.withGoodAnswers,
        lastRefresh: stats.lastRefresh,
        sourceBreakdown: stats.sourceBreakdown,
        cacheStatus: stats.cacheStatus,
      },
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[API] Error fetching trending topics:", error);

    return NextResponse.json(
      {
        topics: [],
        stats: null,
        error: error instanceof Error ? error.message : "Unknown error",
        generatedAt: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
