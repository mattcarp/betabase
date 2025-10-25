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
};

// Keep only last 100 requests
const MAX_STORED_REQUESTS = 100;
const MAX_STORED_ERRORS = 50;

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

// Get all metrics (used by introspection route)
export function getMetrics() {
  return metrics;
}
