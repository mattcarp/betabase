/**
 * System Metrics Ingestion API
 * POST endpoint for ingesting and vectorizing system metrics
 */

import { NextRequest, NextResponse } from "next/server";
import {
  getSystemMetricsVectorService,
  SystemMetric,
} from "../../../../src/services/systemMetricsVectorService";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { metrics, action = "ingest" } = body;

    const metricsService = getSystemMetricsVectorService();

    // Handle different actions
    if (action === "snapshot") {
      // Capture and vectorize current system snapshot
      console.log("📊 Capturing system snapshot via API...");
      const result = await metricsService.captureAndVectorize();

      return NextResponse.json({
        success: true,
        action: "snapshot",
        result,
      });
    }

    if (action === "custom") {
      // Record a single custom metric
      const { name, value, metricType, unit, tags, metadata } = body;

      if (!name || value === undefined) {
        return NextResponse.json(
          { error: "Missing required fields: name and value" },
          { status: 400 }
        );
      }

      const vectorId = await metricsService.recordCustomMetric(name, value, {
        metricType,
        unit,
        tags,
        metadata,
        vectorize: true,
      });

      return NextResponse.json({
        success: true,
        action: "custom",
        vectorId,
        metric: { name, value, metricType, unit },
      });
    }

    if (action === "batch") {
      // Ingest multiple metrics
      if (!metrics || !Array.isArray(metrics)) {
        return NextResponse.json(
          { error: "Invalid request: metrics array required for batch action" },
          { status: 400 }
        );
      }

      console.log(`📊 Ingesting ${metrics.length} metrics via API...`);
      const result = await metricsService.vectorizeMetrics(metrics as SystemMetric[]);

      return NextResponse.json({
        success: true,
        action: "batch",
        result,
      });
    }

    // Default: ingest metrics
    if (!metrics || !Array.isArray(metrics)) {
      return NextResponse.json(
        { error: "Invalid request: metrics array required" },
        { status: 400 }
      );
    }

    console.log(`📊 Ingesting ${metrics.length} metrics...`);
    const result = await metricsService.vectorizeMetrics(metrics as SystemMetric[]);

    return NextResponse.json({
      success: true,
      action: "ingest",
      result,
    });
  } catch (error) {
    console.error("Metrics ingestion error:", error);
    return NextResponse.json(
      {
        error: "Failed to ingest metrics",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const metricsService = getSystemMetricsVectorService();

    // Get metrics history
    const searchParams = request.nextUrl.searchParams;
    const metricType = searchParams.get("metricType") as SystemMetric["metricType"] | null;
    const namePattern = searchParams.get("namePattern");
    const limit = searchParams.get("limit");

    const history = metricsService.getMetricsHistory({
      metricType: metricType || undefined,
      namePattern: namePattern || undefined,
      limit: limit ? parseInt(limit) : undefined,
    });

    return NextResponse.json({
      success: true,
      count: history.length,
      metrics: history,
    });
  } catch (error) {
    console.error("Failed to get metrics history:", error);
    return NextResponse.json(
      {
        error: "Failed to get metrics history",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
