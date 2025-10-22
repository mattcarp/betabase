import { NextRequest, NextResponse } from "next/server";

// In-memory storage for metrics (consider Redis for production)
const metrics = {
  requests: [] as Array<{
    timestamp: number;
    path: string;
    method: string;
    duration: number;
    status: number;
    error?: string;
  }>,
  errors: [] as Array<{
    timestamp: number;
    message: string;
    stack?: string;
    path?: string;
  }>,
  performance: {
    avgResponseTime: 0,
    p95ResponseTime: 0,
    p99ResponseTime: 0,
    totalRequests: 0,
    errorRate: 0,
    lastUpdated: Date.now(),
  },
  system: {
    memoryUsage: {} as NodeJS.MemoryUsage,
    uptime: 0,
    nodeVersion: process.version,
    platform: process.platform,
  },
};

// Keep only last 100 requests
const MAX_STORED_REQUESTS = 100;
const MAX_STORED_ERRORS = 50;

// Calculate percentiles
function calculatePercentile(arr: number[], percentile: number): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[index] || 0;
}

// Update performance metrics
function updatePerformanceMetrics() {
  const recentRequests = metrics.requests.slice(-100);
  const durations = recentRequests.map((r) => r.duration);

  if (durations.length > 0) {
    metrics.performance.avgResponseTime = durations.reduce((a, b) => a + b, 0) / durations.length;
    metrics.performance.p95ResponseTime = calculatePercentile(durations, 95);
    metrics.performance.p99ResponseTime = calculatePercentile(durations, 99);
  }

  metrics.performance.totalRequests = metrics.requests.length;
  const recentErrors = metrics.errors.filter(
    (e) => e.timestamp > Date.now() - 5 * 60 * 1000 // Last 5 minutes
  ).length;
  metrics.performance.errorRate =
    recentRequests.length > 0 ? (recentErrors / recentRequests.length) * 100 : 0;

  metrics.performance.lastUpdated = Date.now();
}

// Add request to metrics
export function trackRequest(
  path: string,
  method: string,
  duration: number,
  status: number,
  error?: string
) {
  metrics.requests.push({
    timestamp: Date.now(),
    path,
    method,
    duration,
    status,
    error,
  });

  // Keep only recent requests
  if (metrics.requests.length > MAX_STORED_REQUESTS) {
    metrics.requests = metrics.requests.slice(-MAX_STORED_REQUESTS);
  }

  updatePerformanceMetrics();
}

// Add error to metrics
export function trackError(message: string, stack?: string, path?: string) {
  metrics.errors.push({
    timestamp: Date.now(),
    message,
    stack,
    path,
  });

  // Keep only recent errors
  if (metrics.errors.length > MAX_STORED_ERRORS) {
    metrics.errors = metrics.errors.slice(-MAX_STORED_ERRORS);
  }
}

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
