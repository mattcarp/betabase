import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

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

    // Calculate time range in minutes
    const timeRangeMinutes =
      {
        "1h": 60,
        "6h": 360,
        "24h": 1440,
        "7d": 10080,
      }[timeRange] || 60;

    const startTime = new Date(Date.now() - timeRangeMinutes * 60 * 1000);

    // Query analytics from conversation_logs
    const { data: queryData, error: queryError } = await supabase
      .from("conversation_logs")
      .select("*")
      .gte("created_at", startTime.toISOString())
      .order("created_at", { ascending: false });

    if (queryError) {
      console.error("Error fetching query data:", queryError);
    }

    // Calculate query metrics
    const queryMetrics = calculateQueryMetrics(queryData || []);

    // Get vector store stats
    const { count: vectorCount } = await supabase
      .from("embedded_documents")
      .select("*", { count: "exact", head: true });

    const { data: latestVectorUpdate } = await supabase
      .from("embedded_documents")
      .select("created_at")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    // Get knowledge base stats
    const { count: fileCount } = await supabase
      .from("curated_knowledge")
      .select("*", { count: "exact", head: true });

    const { data: latestFileUpdate } = await supabase
      .from("curated_knowledge")
      .select("created_at")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    // Calculate staleness
    const vectorStaleness = latestVectorUpdate
      ? (Date.now() - new Date(latestVectorUpdate.created_at).getTime()) / (1000 * 60 * 60)
      : 0;

    // TODO: Track file staleness if needed
    // latestFileUpdate ? (Date.now() - new Date(latestFileUpdate.created_at).getTime()) / (1000 * 60 * 60) : 0;

    // Get system metrics (simulated - in production, these would come from actual monitoring)
    const systemMetrics = {
      cpuUsage: Math.random() * 100,
      memoryUsage: Math.random() * 100,
      diskUsage: Math.random() * 100,
      networkLatency: Math.random() * 100,
      uptime: process.uptime(),
    };

    // API endpoint metrics (from recent queries)
    const apiMetrics = calculateApiMetrics(queryData || []);

    const metrics: PerformanceMetrics = {
      queryMetrics,
      systemMetrics,
      dataFreshness: {
        vectorStore: {
          lastUpdate: latestVectorUpdate?.created_at || new Date().toISOString(),
          totalDocuments: vectorCount || 0,
          staleness: vectorStaleness,
        },
        aomaCache: {
          lastUpdate: new Date().toISOString(),
          cacheHitRate: 0.85 + Math.random() * 0.1, // Simulated
          cacheMissRate: 0.05 + Math.random() * 0.1,
        },
        knowledgeBase: {
          lastUpdate: latestFileUpdate?.created_at || new Date().toISOString(),
          fileCount: fileCount || 0,
        },
      },
      apiMetrics,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(metrics);
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
    const { error } = await supabase.from("performance_metrics").insert({
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

/**
 * Calculate query metrics from conversation logs
 */
function calculateQueryMetrics(logs: any[]) {
  if (logs.length === 0) {
    return {
      avgResponseTime: 0,
      p50ResponseTime: 0,
      p95ResponseTime: 0,
      p99ResponseTime: 0,
      totalQueries: 0,
      successRate: 100,
      errorRate: 0,
      queryTypes: [],
    };
  }

  // Extract response times (simulated based on message length and complexity)
  const responseTimes = logs.map((log) => {
    // Estimate response time based on message length
    const messageLength = (log.message || "").length;
    return Math.max(100, Math.min(5000, messageLength * 2 + Math.random() * 500));
  });

  responseTimes.sort((a, b) => a - b);

  const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
  const p50ResponseTime = responseTimes[Math.floor(responseTimes.length * 0.5)];
  const p95ResponseTime = responseTimes[Math.floor(responseTimes.length * 0.95)];
  const p99ResponseTime = responseTimes[Math.floor(responseTimes.length * 0.99)];

  // Count query types
  const queryTypeCounts: { [key: string]: { count: number; totalTime: number } } = {};
  logs.forEach((log, index) => {
    const type = log.role || "user";
    if (!queryTypeCounts[type]) {
      queryTypeCounts[type] = { count: 0, totalTime: 0 };
    }
    queryTypeCounts[type].count++;
    queryTypeCounts[type].totalTime += responseTimes[index];
  });

  const queryTypes = Object.entries(queryTypeCounts).map(([type, data]) => ({
    type,
    count: data.count,
    avgTime: data.totalTime / data.count,
  }));

  return {
    avgResponseTime,
    p50ResponseTime,
    p95ResponseTime,
    p99ResponseTime,
    totalQueries: logs.length,
    successRate: 95 + Math.random() * 5, // Simulated
    errorRate: Math.random() * 5,
    queryTypes,
  };
}

/**
 * Calculate API endpoint metrics
 */
function calculateApiMetrics(logs: any[]) {
  // Group by endpoint (simulated)
  const endpoints = [
    { endpoint: "/api/chat", count: logs.length * 0.4 },
    { endpoint: "/api/aoma-mcp", count: logs.length * 0.3 },
    { endpoint: "/api/vector-store", count: logs.length * 0.2 },
    { endpoint: "/api/upload", count: logs.length * 0.1 },
  ];

  return endpoints.map((ep) => ({
    endpoint: ep.endpoint,
    avgLatency: 100 + Math.random() * 400,
    requestCount: Math.floor(ep.count),
    errorCount: Math.floor(ep.count * (Math.random() * 0.05)),
  }));
}
