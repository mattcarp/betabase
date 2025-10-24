import { NextRequest, NextResponse } from "next/server";
import { metrics, trackRequest, trackError } from "@/lib/metrics";

// Introspection API endpoint for SIAM internal monitoring
export async function GET(request: NextRequest) {
  try {
    // Track this introspection request
    const startTime = Date.now();

    // Update system metrics
    metrics.system.memoryUsage = process.memoryUsage();
    metrics.system.uptime = process.uptime();

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
        metrics.requests.push({
          ...req,
        });
      });
      updatePerformanceMetrics();
    }

    // Get recent activity (last 20 requests)
    const recentActivity = metrics.requests
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
        performance: metrics.performance,
        system: {
          ...metrics.system,
          memoryUsageMB: {
            rss: Math.round(metrics.system.memoryUsage.rss / 1024 / 1024),
            heapTotal: Math.round(metrics.system.memoryUsage.heapTotal / 1024 / 1024),
            heapUsed: Math.round(metrics.system.memoryUsage.heapUsed / 1024 / 1024),
            external: Math.round(metrics.system.memoryUsage.external / 1024 / 1024),
          },
          uptimeHours: Math.round((metrics.system.uptime / 3600) * 10) / 10,
        },
        recentErrors: metrics.errors.slice(-10).reverse(),
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
