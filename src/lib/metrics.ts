// Metrics tracking utility for SIAM internal monitoring

// In-memory storage for metrics (consider Redis for production)
export const metrics = {
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
