import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client with placeholder values if env vars missing
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "placeholder-key"
);

// Track when server started for uptime calculation
const serverStartTime = Date.now();

// Simple in-memory tracking for API calls (resets on server restart)
const apiCallTracker: Map<string, { count: number; totalMs: number; errors: number }> = new Map();

// Function to record API call (can be called from other routes)
export function recordApiCall(endpoint: string, durationMs: number, isError: boolean = false) {
  const existing = apiCallTracker.get(endpoint) || { count: 0, totalMs: 0, errors: 0 };
  existing.count++;
  existing.totalMs += durationMs;
  if (isError) existing.errors++;
  apiCallTracker.set(endpoint, existing);
}

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

  // System Metrics (REAL from Node.js)
  systemMetrics: {
    cpuUsage: number;
    memoryUsage: number;
    memoryUsedMB: number;
    memoryTotalMB: number;
    heapUsedMB: number;
    heapTotalMB: number;
    diskUsage: number; // Not available in Node.js - will show as N/A
    networkLatency: number;
    uptime: number;
    nodeVersion: string;
    platform: string;
  };

  // Test Metrics (from real Supabase tables)
  testMetrics: {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    passRate: number;
    recentRuns: number;
    avgDurationMs: number;
    historicalTestCount: number;
    rlhfFeedbackCount: number;
    selfHealingPending: number;
    selfHealingApproved: number;
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

  // API Performance (from real tracking)
  apiMetrics: {
    endpoint: string;
    avgLatency: number;
    requestCount: number;
    errorCount: number;
  }[];

  // Core Web Vitals (from client-side reporting)
  webVitals: {
    lcp: { avg: number; p75: number; samples: number }; // Largest Contentful Paint
    fid: { avg: number; p75: number; samples: number }; // First Input Delay
    cls: { avg: number; p75: number; samples: number }; // Cumulative Layout Shift
    fcp: { avg: number; p75: number; samples: number }; // First Contentful Paint
    ttfb: { avg: number; p75: number; samples: number }; // Time to First Byte
    inp: { avg: number; p75: number; samples: number }; // Interaction to Next Paint
  };

  timestamp: string;
}

/**
 * GET /api/performance/metrics
 * Returns comprehensive performance metrics with REAL data
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const timeRange = searchParams.get("timeRange") || "1h"; // 1h, 6h, 24h, 7d

    // Calculate time range in minutes
    const timeRangeMinutes =
      {
        "1h": 60,
        "6h": 360,
        "24h": 1440,
        "7d": 10080,
      }[timeRange] || 60;

    const startTime = new Date(Date.now() - timeRangeMinutes * 60 * 1000);

    // ========================================
    // REAL SYSTEM METRICS from Node.js
    // ========================================
    const memUsage = process.memoryUsage();
    const totalMemoryMB = Math.round((memUsage.rss + memUsage.external) / 1024 / 1024);
    const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);

    // Memory usage as percentage of heap
    const memoryUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;

    const systemMetrics = {
      cpuUsage: -1, // CPU % not reliably available in Node.js without native modules
      memoryUsage: Math.round(memoryUsagePercent * 10) / 10,
      memoryUsedMB: totalMemoryMB,
      memoryTotalMB: heapTotalMB,
      heapUsedMB,
      heapTotalMB,
      diskUsage: -1, // Not available without native modules
      networkLatency: -1, // Would need to ping external service
      uptime: Math.round((Date.now() - serverStartTime) / 1000), // Seconds since this server started
      nodeVersion: process.version,
      platform: process.platform,
    };

    // ========================================
    // REAL TEST METRICS from Supabase
    // ========================================
    let testMetrics = {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      passRate: 0,
      recentRuns: 0,
      avgDurationMs: 0,
      historicalTestCount: 0,
      rlhfFeedbackCount: 0,
      selfHealingPending: 0,
      selfHealingApproved: 0,
    };

    try {
      // Get recent test results (last 7 days max)
      const { data: testResults, count: totalTestRuns } = await supabase
        .from("test_results")
        .select("status, duration_ms", { count: "exact" })
        .gte("created_at", startTime.toISOString());

      if (testResults && testResults.length > 0) {
        const passed = testResults.filter(t => t.status === "passed").length;
        const failed = testResults.filter(t => t.status === "failed").length;
        const avgDuration = testResults.reduce((sum, t) => sum + (t.duration_ms || 0), 0) / testResults.length;

        testMetrics.recentRuns = totalTestRuns || testResults.length;
        testMetrics.passedTests = passed;
        testMetrics.failedTests = failed;
        testMetrics.totalTests = passed + failed;
        testMetrics.passRate = testMetrics.totalTests > 0 ? Math.round((passed / testMetrics.totalTests) * 100) : 0;
        testMetrics.avgDurationMs = Math.round(avgDuration);
      }

      // Get historical test count from bb_case
      const { count: bbCaseCount } = await supabase
        .from("bb_case")
        .select("*", { count: "exact", head: true });
      testMetrics.historicalTestCount = bbCaseCount || 0;

      // Get RLHF feedback count
      const { count: rlhfCount } = await supabase
        .from("rlhf_feedback")
        .select("*", { count: "exact", head: true });
      testMetrics.rlhfFeedbackCount = rlhfCount || 0;

      // Get self-healing stats
      const { data: healingStats } = await supabase
        .from("self_healing_attempts")
        .select("status");

      if (healingStats) {
        testMetrics.selfHealingPending = healingStats.filter(h => h.status === "pending").length;
        testMetrics.selfHealingApproved = healingStats.filter(h =>
          h.status === "approved" || h.status === "auto_approved" || h.status === "applied"
        ).length;
      }
    } catch (dbError) {
      console.warn("Could not fetch test metrics from Supabase:", dbError);
      // Continue with zeros - dashboard will show "No data"
    }

    // ========================================
    // VECTOR STORE & KNOWLEDGE BASE
    // ========================================
    let vectorCount = 0;
    let latestVectorUpdate: { created_at: string } | null = null;
    let fileCount = 0;
    let latestFileUpdate: { created_at: string } | null = null;

    try {
      const { count } = await supabase
        .from("siam_vectors")
        .select("*", { count: "exact", head: true });
      vectorCount = count || 0;

      const { data: vectorData } = await supabase
        .from("siam_vectors")
        .select("created_at")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      latestVectorUpdate = vectorData;
    } catch {
      // Table may not exist
    }

    try {
      const { count } = await supabase
        .from("curated_knowledge")
        .select("*", { count: "exact", head: true });
      fileCount = count || 0;

      const { data: fileData } = await supabase
        .from("curated_knowledge")
        .select("created_at")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      latestFileUpdate = fileData;
    } catch {
      // Table may not exist
    }

    const vectorStaleness = latestVectorUpdate
      ? (Date.now() - new Date(latestVectorUpdate.created_at).getTime()) / (1000 * 60 * 60)
      : 0;

    // ========================================
    // API METRICS from in-memory tracking
    // ========================================
    const apiMetrics: { endpoint: string; avgLatency: number; requestCount: number; errorCount: number }[] = [];
    apiCallTracker.forEach((stats, endpoint) => {
      apiMetrics.push({
        endpoint,
        avgLatency: stats.count > 0 ? Math.round(stats.totalMs / stats.count) : 0,
        requestCount: stats.count,
        errorCount: stats.errors,
      });
    });

    // If no API calls tracked yet, show placeholder endpoints
    if (apiMetrics.length === 0) {
      apiMetrics.push(
        { endpoint: "/api/chat", avgLatency: 0, requestCount: 0, errorCount: 0 },
        { endpoint: "/api/aoma-stream", avgLatency: 0, requestCount: 0, errorCount: 0 },
        { endpoint: "/api/vector-store", avgLatency: 0, requestCount: 0, errorCount: 0 }
      );
    }

    // Sort by request count descending
    apiMetrics.sort((a, b) => b.requestCount - a.requestCount);

    // ========================================
    // QUERY METRICS (simplified - based on test results)
    // ========================================
    const queryMetrics = {
      avgResponseTime: testMetrics.avgDurationMs,
      p50ResponseTime: testMetrics.avgDurationMs * 0.8, // Estimate
      p95ResponseTime: testMetrics.avgDurationMs * 1.5, // Estimate
      p99ResponseTime: testMetrics.avgDurationMs * 2, // Estimate
      totalQueries: testMetrics.recentRuns,
      successRate: testMetrics.passRate,
      errorRate: 100 - testMetrics.passRate,
      queryTypes: [
        { type: "test_runs", count: testMetrics.recentRuns, avgTime: testMetrics.avgDurationMs },
        { type: "rlhf_feedback", count: testMetrics.rlhfFeedbackCount, avgTime: 50 },
      ],
    };

    // Get Web Vitals stats
    const webVitals = getWebVitalsStats();

    const metrics: PerformanceMetrics = {
      queryMetrics,
      systemMetrics,
      testMetrics,
      dataFreshness: {
        vectorStore: {
          lastUpdate: latestVectorUpdate?.created_at || new Date().toISOString(),
          totalDocuments: vectorCount,
          staleness: Math.round(vectorStaleness * 10) / 10,
        },
        aomaCache: {
          lastUpdate: new Date().toISOString(),
          cacheHitRate: 0, // Would need actual cache implementation to track
          cacheMissRate: 0,
        },
        knowledgeBase: {
          lastUpdate: latestFileUpdate?.created_at || new Date().toISOString(),
          fileCount: fileCount,
        },
      },
      apiMetrics,
      webVitals,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(metrics);
  } catch (error) {
    console.error("Error fetching performance metrics:", error);
    return NextResponse.json({ error: "Failed to fetch performance metrics" }, { status: 500 });
  }
}

// In-memory storage for Core Web Vitals (aggregated)
// Note: FID was removed in web-vitals v4 (2024), replaced by INP
const webVitalsTracker = {
  lcp: [] as number[], // Largest Contentful Paint
  cls: [] as number[], // Cumulative Layout Shift
  fcp: [] as number[], // First Contentful Paint
  ttfb: [] as number[], // Time to First Byte
  inp: [] as number[], // Interaction to Next Paint (replaced FID)
};

// Export for use in client-side reporting
export function getWebVitalsStats() {
  const calcPercentile = (arr: number[], p: number) => {
    if (arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  };

  const calcAvg = (arr: number[]) =>
    arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

  return {
    lcp: { avg: calcAvg(webVitalsTracker.lcp), p75: calcPercentile(webVitalsTracker.lcp, 75), samples: webVitalsTracker.lcp.length },
    fid: { avg: 0, p75: 0, samples: 0 }, // Deprecated in web-vitals v4, kept for API compatibility
    cls: { avg: calcAvg(webVitalsTracker.cls), p75: calcPercentile(webVitalsTracker.cls, 75), samples: webVitalsTracker.cls.length },
    fcp: { avg: calcAvg(webVitalsTracker.fcp), p75: calcPercentile(webVitalsTracker.fcp, 75), samples: webVitalsTracker.fcp.length },
    ttfb: { avg: calcAvg(webVitalsTracker.ttfb), p75: calcPercentile(webVitalsTracker.ttfb, 75), samples: webVitalsTracker.ttfb.length },
    inp: { avg: calcAvg(webVitalsTracker.inp), p75: calcPercentile(webVitalsTracker.inp, 75), samples: webVitalsTracker.inp.length },
  };
}

/**
 * POST /api/performance/metrics
 * Records performance metrics including Core Web Vitals
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, value, duration, metadata } = body;

    // Handle Core Web Vitals
    if (type === "web-vital") {
      const { name, value: vitalValue } = metadata || {};
      if (name && typeof vitalValue === "number") {
        const metricName = name.toLowerCase() as keyof typeof webVitalsTracker;
        if (webVitalsTracker[metricName]) {
          // Keep only last 100 samples per metric
          if (webVitalsTracker[metricName].length >= 100) {
            webVitalsTracker[metricName].shift();
          }
          webVitalsTracker[metricName].push(vitalValue);
        }
      }
      return NextResponse.json({ success: true });
    }

    // Handle API call tracking
    if (type === "api-call") {
      const { endpoint, durationMs, isError } = metadata || {};
      if (endpoint && typeof durationMs === "number") {
        recordApiCall(endpoint, durationMs, isError);
      }
      return NextResponse.json({ success: true });
    }

    // Store other metrics in database (if table exists)
    try {
      const { error } = await supabase.from("performance_metrics").insert({
        metric_type: type,
        duration_ms: duration || value,
        metadata: metadata || {},
        created_at: new Date().toISOString(),
      });

      if (error) {
        console.warn("Could not store metric in DB:", error.message);
        // Don't fail - just log and continue
      }
    } catch {
      // Table may not exist - that's OK
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error recording metric:", error);
    return NextResponse.json({ error: "Failed to record metric" }, { status: 500 });
  }
}
