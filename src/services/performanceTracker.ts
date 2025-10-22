/**
 * Performance Tracking Service
 *
 * Collects and reports performance metrics for queries, API calls, and system operations.
 * Metrics are stored in-memory and can be persisted to the database.
 */

interface PerformanceEntry {
  id: string;
  type: "query" | "api" | "system" | "render";
  operation: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
  success: boolean;
  error?: string;
}

class PerformanceTracker {
  private entries: Map<string, PerformanceEntry>;
  private maxEntries: number = 1000;

  constructor() {
    this.entries = new Map();
  }

  /**
   * Start tracking a new operation
   */
  startTracking(
    type: PerformanceEntry["type"],
    operation: string,
    metadata?: Record<string, any>
  ): string {
    const id = `${type}-${operation}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const entry: PerformanceEntry = {
      id,
      type,
      operation,
      startTime: performance.now(),
      metadata,
      success: true,
    };

    this.entries.set(id, entry);

    // Clean up old entries if we exceed max
    if (this.entries.size > this.maxEntries) {
      const oldestKey = this.entries.keys().next().value;
      this.entries.delete(oldestKey);
    }

    return id;
  }

  /**
   * Stop tracking an operation
   */
  stopTracking(id: string, success: boolean = true, error?: string): number | null {
    const entry = this.entries.get(id);
    if (!entry) {
      console.warn(`Performance tracking entry not found: ${id}`);
      return null;
    }

    entry.endTime = performance.now();
    entry.duration = entry.endTime - entry.startTime;
    entry.success = success;
    if (error) {
      entry.error = error;
    }

    // Persist to API in background (non-blocking)
    this.persistMetric(entry);

    return entry.duration;
  }

  /**
   * Track a query operation
   */
  async trackQuery<T>(
    operation: string,
    queryFn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    const id = this.startTracking("query", operation, metadata);

    try {
      const result = await queryFn();
      this.stopTracking(id, true);
      return result;
    } catch (error) {
      this.stopTracking(id, false, error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  /**
   * Track an API call
   */
  async trackApiCall<T>(
    endpoint: string,
    apiFn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> {
    const id = this.startTracking("api", endpoint, metadata);

    try {
      const result = await apiFn();
      this.stopTracking(id, true);
      return result;
    } catch (error) {
      this.stopTracking(id, false, error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  /**
   * Track a render operation
   */
  trackRender(componentName: string, metadata?: Record<string, any>): () => void {
    const id = this.startTracking("render", componentName, metadata);

    return () => {
      this.stopTracking(id, true);
    };
  }

  /**
   * Get statistics for a specific operation type
   */
  getStatistics(type?: PerformanceEntry["type"], operation?: string) {
    const entries = Array.from(this.entries.values())
      .filter((entry) => entry.duration !== undefined)
      .filter((entry) => !type || entry.type === type)
      .filter((entry) => !operation || entry.operation === operation);

    if (entries.length === 0) {
      return {
        count: 0,
        avgDuration: 0,
        minDuration: 0,
        maxDuration: 0,
        p50: 0,
        p95: 0,
        p99: 0,
        successRate: 100,
      };
    }

    const durations = entries.map((e) => e.duration!).sort((a, b) => a - b);
    const successCount = entries.filter((e) => e.success).length;

    return {
      count: entries.length,
      avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
      minDuration: durations[0],
      maxDuration: durations[durations.length - 1],
      p50: durations[Math.floor(durations.length * 0.5)],
      p95: durations[Math.floor(durations.length * 0.95)],
      p99: durations[Math.floor(durations.length * 0.99)],
      successRate: (successCount / entries.length) * 100,
    };
  }

  /**
   * Get all entries for a specific type
   */
  getEntries(type?: PerformanceEntry["type"]): PerformanceEntry[] {
    return Array.from(this.entries.values())
      .filter((entry) => !type || entry.type === type)
      .filter((entry) => entry.duration !== undefined);
  }

  /**
   * Clear all entries
   */
  clear(): void {
    this.entries.clear();
  }

  /**
   * Export metrics for external analysis
   */
  exportMetrics(): PerformanceEntry[] {
    return Array.from(this.entries.values());
  }

  /**
   * Persist metric to backend API (non-blocking)
   */
  private async persistMetric(entry: PerformanceEntry): Promise<void> {
    // Only persist completed entries
    if (!entry.duration) return;

    // Don't block on persistence
    try {
      await fetch("/api/performance/metrics", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: `${entry.type}:${entry.operation}`,
          duration: entry.duration,
          metadata: {
            ...entry.metadata,
            success: entry.success,
            error: entry.error,
          },
        }),
      });
    } catch (error) {
      // Silently fail - don't disrupt user experience
      console.debug("Failed to persist metric:", error);
    }
  }

  /**
   * Get real-time performance summary
   */
  getSummary() {
    return {
      query: this.getStatistics("query"),
      api: this.getStatistics("api"),
      render: this.getStatistics("render"),
      system: this.getStatistics("system"),
    };
  }

  /**
   * Check if performance is degraded
   */
  isPerformanceDegraded(): boolean {
    const summary = this.getSummary();

    // Check if any operation type is slow
    const thresholds = {
      query: 1000, // 1 second
      api: 500, // 500ms
      render: 16, // 16ms (one frame at 60fps)
      system: 100, // 100ms
    };

    return Object.entries(summary).some(([type, stats]) => {
      const threshold = thresholds[type as keyof typeof thresholds];
      return stats.p95 > threshold;
    });
  }

  /**
   * Get slow operations (above threshold)
   */
  getSlowOperations(threshold: number = 1000): PerformanceEntry[] {
    return Array.from(this.entries.values())
      .filter((entry) => entry.duration && entry.duration > threshold)
      .sort((a, b) => (b.duration || 0) - (a.duration || 0));
  }
}

// Singleton instance
export const performanceTracker = new PerformanceTracker();

// Helper hooks for React components
export const usePerformanceTracking = () => {
  return {
    trackQuery: performanceTracker.trackQuery.bind(performanceTracker),
    trackApiCall: performanceTracker.trackApiCall.bind(performanceTracker),
    trackRender: performanceTracker.trackRender.bind(performanceTracker),
    getStatistics: performanceTracker.getStatistics.bind(performanceTracker),
    getSummary: performanceTracker.getSummary.bind(performanceTracker),
  };
};

export default performanceTracker;
