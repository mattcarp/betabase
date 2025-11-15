import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import {
  buildGrafanaSeries,
  collectPerformanceSnapshot,
  getSnapshotsSince,
  persistPerformanceSnapshot,
} from "@/services/systemMetricsCollector";

interface PerformanceMetrics {
  // Query Metrics
  queryMetrics: {
    avgResponseTime: number;
    p50ResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
    totalQueries: number;
    successRate: number;
    errorRate: number;
    queryTypes: {
      type: string;
      count: number;
      avgTime: number;
    }[];
  };

  // System Metrics
  systemMetrics: {
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
    networkLatency: number;
    uptime: number;
  };

  // Data Freshness
  dataFreshness: {
    vectorStore: {
      lastUpdate: string;
      totalDocuments: number;
      staleness: number; // in hours
    };
    aomaCache: {
      lastUpdate: string;
      cacheHitRate: number;
      cacheMissRate: number;
    };
    knowledgeBase: {
      lastUpdate: string;
      fileCount: number;
    };
  };

  // API Performance
  apiMetrics: {
    endpoint: string;
    avgLatency: number;
    requestCount: number;
    errorCount: number;
  }[];

  timestamp: string;
}

/**
 * GET /api/performance/metrics
 * Returns comprehensive performance metrics
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const timeRange = searchParams.get("timeRange") || "1h"; // 1h, 6h, 24h, 7d
    const format = searchParams.get("format");

    // Calculate time range in minutes
    const timeRangeMinutes =
      {
        "1h": 60,
        "6h": 360,
        "24h": 1440,
        "7d": 10080,
      }[timeRange] || 60;

    const startTime = new Date(Date.now() - timeRangeMinutes * 60 * 1000);

    let snapshots = await getSnapshotsSince(startTime);

    if (!snapshots.length) {
      const snapshot = await collectPerformanceSnapshot(timeRangeMinutes);
      await persistPerformanceSnapshot(snapshot);
      snapshots = [
        {
          id: "latest",
          metrics: snapshot,
          created_at: snapshot.timestamp,
        },
      ];
    }

    if (format === "grafana") {
      return NextResponse.json(buildGrafanaSeries(snapshots));
    }

    const latest = snapshots[snapshots.length - 1].metrics;

    return NextResponse.json({
      ...latest,
      history: snapshots.map((row) => row.metrics),
    });
  } catch (error) {
    console.error("Error fetching performance metrics:", error);
    return NextResponse.json({ error: "Failed to fetch performance metrics" }, { status: 500 });
  }
}

/**
 * POST /api/performance/metrics
 * Records a new performance metric
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, duration, metadata } = body;

    // Store metric in database
    const { error } = await supabaseAdmin.from("performance_metrics").insert({
      metric_type: type,
      duration_ms: duration,
      metadata: metadata || {},
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Error storing metric:", error);
      return NextResponse.json({ error: "Failed to store metric" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error recording metric:", error);
    return NextResponse.json({ error: "Failed to record metric" }, { status: 500 });
  }
}

// Legacy helper functions removed – logic now lives in systemMetricsCollector.ts
