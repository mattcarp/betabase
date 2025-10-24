import { NextRequest, NextResponse } from "next/server";
import { trackRequest, trackError, getMetrics } from "./metrics";

// Calculate percentiles
function calculatePercentile(arr: number[], percentile: number): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[index] || 0;
}

// Calculate performance metrics from request data
function calculatePerformanceMetrics() {
  const metrics = getMetrics();
  const recentRequests = metrics.requests.slice(-100);
  const durations = recentRequests.map((r) => r.duration);

  if (durations.length === 0) {
    return {
      avgResponseTime: 0,
      p95ResponseTime: 0,
      p99ResponseTime: 0,
      totalRequests: 0,
      errorRate: 0,
      lastUpdated: Date.now(),
    };
  }

  const avgResponseTime = durations.reduce((a, b) => a + b, 0) / durations.length;
  const p95ResponseTime = calculatePercentile(durations, 95);
  const p99ResponseTime = calculatePercentile(durations, 99);

  const recentErrors = metrics.errors.filter(
    (e) => e.timestamp > Date.now() - 5 * 60 * 1000 // Last 5 minutes
  ).length;

  const errorRate = recentRequests.length > 0 ? (recentErrors / recentRequests.length) * 100 : 0;

  return {
    avgResponseTime,
    p95ResponseTime,
    p99ResponseTime,
    totalRequests: metrics.requests.length,
    errorRate,
    lastUpdated: Date.now(),
  };
}

// Introspection API endpoint for SIAM internal monitoring
export async function GET(_request: NextRequest) {
  try {
    // Track this introspection request
    const startTime = Date.now();
    const metrics = getMetrics();

    // Update system metrics
    const systemMetrics = {
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime(),
      nodeVersion: process.version,
      platform: process.platform,
    };

    // Generate some sample internal activity if we don't have real data yet
    if (metrics.requests.length === 0) {
      // Simulate recent chat requests for demo
      const now = Date.now();
      const sampleRequests = [
        { path: "/api/chat", method: "POST", duration: 3200, status: 200, timestamp: now - 30000 },
        {
          path: "/api/vector-store/files",
          method: "GET",
          duration: 150,
          status: 200,
          timestamp: now - 25000,
        },
        { path: "/api/chat", method: "POST", duration: 5400, status: 200, timestamp: now - 20000 },
        { path: "/api/health", method: "GET", duration: 45, status: 200, timestamp: now - 15000 },
        { path: "/api/chat", method: "POST", duration: 2800, status: 200, timestamp: now - 10000 },
      ];

      sampleRequests.forEach((req) => {
        trackRequest(req.path, req.method, req.duration, req.status);
      });
    }

    // Recalculate performance metrics
    const performanceMetrics = calculatePerformanceMetrics();

    // Get recent activity (last 20 requests)
    const currentMetrics = getMetrics();
    const recentActivity = currentMetrics.requests
      .slice(-20)
      .reverse()
      .map((req) => ({
        id: `req_${req.timestamp}`,
        name: `${req.method} ${req.path}`,
        runType: req.path.includes("/chat") ? "llm" : req.path.includes("/api/") ? "tool" : "chain",
        startTime: new Date(req.timestamp).toISOString(),
        endTime: new Date(req.timestamp + req.duration).toISOString(),
        duration: req.duration,
        status: req.status >= 400 ? "error" : "success",
        error: req.error,
        inputs: { method: req.method, path: req.path },
        outputs: { status: req.status },
        metadata: {
          responseTime: `${req.duration}ms`,
          statusCode: req.status,
        },
      }));

    // Track this request completion
    const endTime = Date.now();
    trackRequest("/api/introspection", "GET", endTime - startTime, 200);

    // Check if LangSmith environment variables are set
    const langsmithEnabled = !!(process.env.LANGCHAIN_TRACING_V2 || process.env.LANGSMITH_API_KEY);

    // Format response for IntrospectionDropdown
    return NextResponse.json({
      status: {
        enabled: langsmithEnabled,
        project: process.env.LANGCHAIN_PROJECT || "siam-internal-monitoring",
        endpoint: process.env.LANGCHAIN_ENDPOINT || "https://api.smith.langchain.com",
        tracingEnabled: process.env.LANGCHAIN_TRACING_V2 === "true",
        hasApiKey: !!process.env.LANGSMITH_API_KEY,
        clientInitialized: langsmithEnabled,
      },
      traces: recentActivity,
      metrics: {
        performance: performanceMetrics,
        system: {
          ...systemMetrics,
          memoryUsageMB: {
            rss: Math.round(systemMetrics.memoryUsage.rss / 1024 / 1024),
            heapTotal: Math.round(systemMetrics.memoryUsage.heapTotal / 1024 / 1024),
            heapUsed: Math.round(systemMetrics.memoryUsage.heapUsed / 1024 / 1024),
            external: Math.round(systemMetrics.memoryUsage.external / 1024 / 1024),
          },
          uptimeHours: Math.round((systemMetrics.uptime / 3600) * 10) / 10,
        },
        recentErrors: currentMetrics.errors.slice(-10).reverse(),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[INTROSPECTION] Error getting metrics:", error);
    trackError(
      error instanceof Error ? error.message : "Unknown introspection error",
      error instanceof Error ? error.stack : undefined,
      "/api/introspection"
    );

    return NextResponse.json(
      {
        error: "Failed to get introspection data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// POST endpoint to manually track events
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, ...data } = body;

    if (type === "request") {
      trackRequest(data.path, data.method, data.duration, data.status, data.error);
    } else if (type === "error") {
      trackError(data.message, data.stack, data.path);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[INTROSPECTION] Error tracking event:", error);
    return NextResponse.json(
      {
        error: "Failed to track event",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
