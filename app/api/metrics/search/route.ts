/**
 * System Metrics Search API
 * Search vectorized system metrics using semantic search
 */

import { NextRequest, NextResponse } from "next/server";
import { getSystemMetricsVectorService, SystemMetric } from "../../../../src/services/systemMetricsVectorService";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, matchThreshold = 0.78, matchCount = 10, metricType, timeRange } = body;

    if (!query) {
      return NextResponse.json({ error: "Query parameter is required" }, { status: 400 });
    }

    const metricsService = getSystemMetricsVectorService();

    console.log(`🔍 Searching metrics for: "${query}"`);

    const results = await metricsService.searchMetrics(query, {
      matchThreshold,
      matchCount,
      metricType: metricType as SystemMetric["metricType"] | undefined,
      timeRange,
    });

    return NextResponse.json({
      success: true,
      query,
      matchCount: results.length,
      results: results.map((result) => ({
        id: result.id,
        content: result.content,
        similarity: result.similarity,
        metadata: result.metadata,
        sourceType: result.source_type,
        sourceId: result.source_id,
      })),
    });
  } catch (error) {
    console.error("Metrics search error:", error);
    return NextResponse.json(
      {
        error: "Failed to search metrics",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q") || searchParams.get("query");
    const metricType = searchParams.get("metricType");
    const matchThreshold = searchParams.get("threshold");
    const matchCount = searchParams.get("limit");

    if (!query) {
      return NextResponse.json(
        { error: "Query parameter (q or query) is required" },
        { status: 400 }
      );
    }

    const metricsService = getSystemMetricsVectorService();

    console.log(`🔍 Searching metrics for: "${query}"`);

    const results = await metricsService.searchMetrics(query, {
      matchThreshold: matchThreshold ? parseFloat(matchThreshold) : 0.78,
      matchCount: matchCount ? parseInt(matchCount) : 10,
      metricType: metricType as SystemMetric["metricType"] | undefined,
    });

    return NextResponse.json({
      success: true,
      query,
      matchCount: results.length,
      results: results.map((result) => ({
        id: result.id,
        content: result.content,
        similarity: result.similarity,
        metadata: result.metadata,
        sourceType: result.source_type,
        sourceId: result.source_id,
      })),
    });
  } catch (error) {
    console.error("Metrics search error:", error);
    return NextResponse.json(
      {
        error: "Failed to search metrics",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
