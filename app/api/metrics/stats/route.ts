/**
 * System Metrics Statistics API
 * Get statistics about vectorized metrics
 */

import { NextRequest, NextResponse } from "next/server";
import { getSystemMetricsVectorService } from "@/services/systemMetricsVectorService";

export async function GET(request: NextRequest) {
  try {
    const metricsService = getSystemMetricsVectorService();

    // Get vector stats for metrics
    const vectorStats = await metricsService.getMetricsVectorStats();

    // Get in-memory metrics history stats
    const history = metricsService.getMetricsHistory();

    const metricTypeBreakdown = history.reduce(
      (acc, metric) => {
        acc[metric.metricType] = (acc[metric.metricType] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return NextResponse.json({
      success: true,
      vectorized: {
        stats: vectorStats,
        count: vectorStats.reduce((sum: number, stat: any) => sum + (stat.vector_count || 0), 0),
      },
      inMemory: {
        totalMetrics: history.length,
        breakdown: metricTypeBreakdown,
        oldestMetric: history[0]?.timestamp,
        latestMetric: history[history.length - 1]?.timestamp,
      },
    });
  } catch (error) {
    console.error("Failed to get metrics stats:", error);
    return NextResponse.json(
      {
        error: "Failed to get metrics stats",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
