/**
 * System Metrics Vectorization Service
 * Collects and vectorizes system metrics and telemetry data into Supabase
 * Part of the unified AOMA vector store architecture
 *
 * Supports:
 * - Node.js performance metrics
 * - Application metrics (API response times, error rates, etc.)
 * - Custom metrics from Prometheus/Grafana (future integration)
 * - Web Vitals and client-side performance metrics
 */

import { getSupabaseVectorService } from "./supabaseVectorService";
import * as os from "os";
import * as v8 from "v8";

export interface SystemMetric {
  timestamp: string;
  metricType: "performance" | "resource" | "api" | "error" | "custom";
  name: string;
  value: number | string | Record<string, any>;
  unit?: string;
  tags?: Record<string, string>;
  metadata?: Record<string, any>;
}

export interface MetricsSnapshot {
  timestamp: string;
  system: {
    cpuUsage: number;
    memoryUsage: {
      total: number;
      used: number;
      free: number;
      usagePercent: number;
    };
    loadAverage: number[];
    uptime: number;
    platform: string;
    nodeVersion: string;
  };
  process: {
    memoryUsage: NodeJS.MemoryUsage;
    cpuUsage: NodeJS.CpuUsage;
    uptime: number;
    heapStatistics: v8.HeapSpaceInfo[];
  };
  application?: {
    activeRequests?: number;
    totalRequests?: number;
    errorRate?: number;
    avgResponseTime?: number;
  };
}

export interface MetricsVectorizationResult {
  totalMetrics: number;
  successfulVectorizations: number;
  failedVectorizations: number;
  errors: Array<{ metricName: string; error: string }>;
  duration: number;
}

export class SystemMetricsVectorService {
  private vectorService;
  private metricsHistory: SystemMetric[] = [];
  private maxHistorySize = 1000;

  constructor() {
    this.vectorService = getSupabaseVectorService();
  }

  /**
   * Capture a snapshot of current system metrics
   */
  async captureSystemSnapshot(): Promise<MetricsSnapshot> {
    const timestamp = new Date().toISOString();

    // System metrics
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;

    // Process metrics
    const processMemory = process.memoryUsage();
    const processCpu = process.cpuUsage();
    const heapStats = v8.getHeapSpaceStatistics();

    const snapshot: MetricsSnapshot = {
      timestamp,
      system: {
        cpuUsage: os.loadavg()[0], // 1-minute load average
        memoryUsage: {
          total: totalMem,
          used: usedMem,
          free: freeMem,
          usagePercent: (usedMem / totalMem) * 100,
        },
        loadAverage: os.loadavg(),
        uptime: os.uptime(),
        platform: os.platform(),
        nodeVersion: process.version,
      },
      process: {
        memoryUsage: processMemory,
        cpuUsage: processCpu,
        uptime: process.uptime(),
        heapStatistics: heapStats,
      },
    };

    return snapshot;
  }

  /**
   * Convert metrics snapshot to individual metric objects
   */
  private snapshotToMetrics(snapshot: MetricsSnapshot): SystemMetric[] {
    const metrics: SystemMetric[] = [];
    const timestamp = snapshot.timestamp;

    // System metrics
    metrics.push({
      timestamp,
      metricType: "resource",
      name: "system.cpu.usage",
      value: snapshot.system.cpuUsage,
      unit: "load",
      tags: { platform: snapshot.system.platform },
    });

    metrics.push({
      timestamp,
      metricType: "resource",
      name: "system.memory.usage",
      value: snapshot.system.memoryUsage.usagePercent,
      unit: "percent",
      tags: { platform: snapshot.system.platform },
      metadata: snapshot.system.memoryUsage,
    });

    metrics.push({
      timestamp,
      metricType: "resource",
      name: "system.memory.used",
      value: snapshot.system.memoryUsage.used,
      unit: "bytes",
      tags: { platform: snapshot.system.platform },
    });

    // Process metrics
    metrics.push({
      timestamp,
      metricType: "performance",
      name: "process.memory.heapUsed",
      value: snapshot.process.memoryUsage.heapUsed,
      unit: "bytes",
      tags: { nodeVersion: snapshot.system.nodeVersion },
    });

    metrics.push({
      timestamp,
      metricType: "performance",
      name: "process.memory.external",
      value: snapshot.process.memoryUsage.external,
      unit: "bytes",
      tags: { nodeVersion: snapshot.system.nodeVersion },
    });

    metrics.push({
      timestamp,
      metricType: "performance",
      name: "process.cpu.user",
      value: snapshot.process.cpuUsage.user,
      unit: "microseconds",
      tags: { nodeVersion: snapshot.system.nodeVersion },
    });

    metrics.push({
      timestamp,
      metricType: "performance",
      name: "process.cpu.system",
      value: snapshot.process.cpuUsage.system,
      unit: "microseconds",
      tags: { nodeVersion: snapshot.system.nodeVersion },
    });

    // Application metrics (if available)
    if (snapshot.application) {
      if (snapshot.application.avgResponseTime !== undefined) {
        metrics.push({
          timestamp,
          metricType: "api",
          name: "application.api.responseTime",
          value: snapshot.application.avgResponseTime,
          unit: "milliseconds",
        });
      }

      if (snapshot.application.errorRate !== undefined) {
        metrics.push({
          timestamp,
          metricType: "error",
          name: "application.errorRate",
          value: snapshot.application.errorRate,
          unit: "percent",
        });
      }
    }

    return metrics;
  }

  /**
   * Create searchable content from metric data
   */
  private createMetricContent(metric: SystemMetric): string {
    const formattedValue =
      typeof metric.value === "object"
        ? JSON.stringify(metric.value, null, 2)
        : `${metric.value}${metric.unit ? " " + metric.unit : ""}`;

    const tagsContext = metric.tags
      ? `\nTags: ${Object.entries(metric.tags)
          .map(([k, v]) => `${k}=${v}`)
          .join(", ")}`
      : "";

    const metadataContext = metric.metadata
      ? `\nMetadata: ${JSON.stringify(metric.metadata, null, 2)}`
      : "";

    return `${metric.name}: ${formattedValue}
Type: ${metric.metricType}
Timestamp: ${metric.timestamp}${tagsContext}${metadataContext}`;
  }

  /**
   * Create metadata object for metric
   */
  private createMetricMetadata(metric: SystemMetric): Record<string, any> {
    return {
      metricType: metric.metricType,
      name: metric.name,
      value: metric.value,
      unit: metric.unit || null,
      tags: metric.tags || {},
      timestamp: metric.timestamp,
      vectorizedAt: new Date().toISOString(),
      ...metric.metadata,
    };
  }

  /**
   * Vectorize a single metric
   */
  async vectorizeMetric(metric: SystemMetric): Promise<string> {
    const content = this.createMetricContent(metric);
    const metadata = this.createMetricMetadata(metric);
    const sourceId = `${metric.metricType}:${metric.name}:${metric.timestamp}`;

    return await this.vectorService.upsertVector(content, "metrics", sourceId, metadata);
  }

  /**
   * Vectorize multiple metrics in batches
   */
  async vectorizeMetrics(metrics: SystemMetric[]): Promise<MetricsVectorizationResult> {
    const startTime = Date.now();
    const errors: Array<{ metricName: string; error: string }> = [];

    console.log(`🚀 Starting vectorization of ${metrics.length} system metrics...`);

    // Update migration status
    await this.vectorService.updateMigrationStatus("metrics", "in_progress", {
      totalCount: metrics.length,
      migratedCount: 0,
    });

    // Prepare vectors for batch processing
    const vectors = metrics.map((metric) => ({
      content: this.createMetricContent(metric),
      sourceType: "metrics" as const,
      sourceId: `${metric.metricType}:${metric.name}:${metric.timestamp}`,
      metadata: this.createMetricMetadata(metric),
    }));

    // Use the existing batch upsert functionality
    const result = await this.vectorService.batchUpsertVectors(vectors);

    const duration = Date.now() - startTime;

    // Update final migration status
    const status = result.failed === 0 ? "completed" : "failed";
    await this.vectorService.updateMigrationStatus("metrics", status, {
      totalCount: metrics.length,
      migratedCount: result.success,
    });

    console.log(
      `✅ Metrics vectorization complete! ${result.success}/${metrics.length} metrics vectorized in ${(duration / 1000).toFixed(2)}s`
    );

    return {
      totalMetrics: metrics.length,
      successfulVectorizations: result.success,
      failedVectorizations: result.failed,
      errors: [],
      duration,
    };
  }

  /**
   * Capture and vectorize current system snapshot
   */
  async captureAndVectorize(): Promise<MetricsVectorizationResult> {
    console.log("📊 Capturing system snapshot...");
    const snapshot = await this.captureSystemSnapshot();
    const metrics = this.snapshotToMetrics(snapshot);

    // Store in history
    this.metricsHistory.push(...metrics);
    if (this.metricsHistory.length > this.maxHistorySize) {
      this.metricsHistory = this.metricsHistory.slice(-this.maxHistorySize);
    }

    return await this.vectorizeMetrics(metrics);
  }

  /**
   * Record a custom application metric
   */
  async recordCustomMetric(
    name: string,
    value: number | string | Record<string, any>,
    options: {
      metricType?: SystemMetric["metricType"];
      unit?: string;
      tags?: Record<string, string>;
      metadata?: Record<string, any>;
      vectorize?: boolean;
    } = {}
  ): Promise<string | null> {
    const { metricType = "custom", unit, tags, metadata, vectorize = true } = options;

    const metric: SystemMetric = {
      timestamp: new Date().toISOString(),
      metricType,
      name,
      value,
      unit,
      tags,
      metadata,
    };

    // Store in history
    this.metricsHistory.push(metric);
    if (this.metricsHistory.length > this.maxHistorySize) {
      this.metricsHistory = this.metricsHistory.slice(-this.maxHistorySize);
    }

    // Optionally vectorize immediately
    if (vectorize) {
      return await this.vectorizeMetric(metric);
    }

    return null;
  }

  /**
   * Search vectorized metrics
   */
  async searchMetrics(
    query: string,
    options: {
      matchThreshold?: number;
      matchCount?: number;
      metricType?: SystemMetric["metricType"];
      timeRange?: { start: string; end: string };
    } = {}
  ) {
    const { matchThreshold = 0.78, matchCount = 10, metricType, timeRange } = options;

    // Search with metrics source type filter
    const results = await this.vectorService.searchVectors(query, {
      matchThreshold,
      matchCount,
      sourceTypes: ["metrics"],
    });

    // Additional filtering by metadata
    let filteredResults = results;

    if (metricType) {
      filteredResults = filteredResults.filter(
        (result) => result.metadata?.metricType === metricType
      );
    }

    if (timeRange) {
      const startDate = new Date(timeRange.start);
      const endDate = new Date(timeRange.end);
      filteredResults = filteredResults.filter((result) => {
        if (!result.metadata?.timestamp) return false;
        const metricDate = new Date(result.metadata.timestamp);
        return metricDate >= startDate && metricDate <= endDate;
      });
    }

    return filteredResults;
  }

  /**
   * Get metrics history (in-memory)
   */
  getMetricsHistory(
    filters: {
      metricType?: SystemMetric["metricType"];
      namePattern?: string;
      limit?: number;
    } = {}
  ): SystemMetric[] {
    let filtered = [...this.metricsHistory];

    if (filters.metricType) {
      filtered = filtered.filter((m) => m.metricType === filters.metricType);
    }

    if (filters.namePattern) {
      const pattern = new RegExp(filters.namePattern, "i");
      filtered = filtered.filter((m) => pattern.test(m.name));
    }

    if (filters.limit) {
      filtered = filtered.slice(-filters.limit);
    }

    return filtered;
  }

  /**
   * Get statistics about vectorized metrics
   */
  async getMetricsVectorStats() {
    const allStats = await this.vectorService.getVectorStats();
    return allStats?.filter((stat: any) => stat.source_type === "metrics") || [];
  }

  /**
   * Setup automated metrics collection
   * Collects and vectorizes metrics at specified interval
   */
  setupAutomatedCollection(intervalMs: number = 60000): NodeJS.Timeout {
    console.log(`🔄 Setting up automated metrics collection (interval: ${intervalMs}ms)`);

    return setInterval(async () => {
      try {
        await this.captureAndVectorize();
      } catch (error) {
        console.error("Failed to capture and vectorize metrics:", error);
      }
    }, intervalMs);
  }

  /**
   * Integration point for Prometheus metrics
   * Future: Pull metrics from Prometheus endpoint
   */
  async ingestPrometheusMetrics(prometheusUrl: string): Promise<MetricsVectorizationResult> {
    console.log("📊 Prometheus integration not yet implemented");
    console.log(`💡 Future: Pull metrics from ${prometheusUrl}`);

    // Placeholder for future Prometheus integration
    // Would use prometheus-query library to fetch metrics
    return {
      totalMetrics: 0,
      successfulVectorizations: 0,
      failedVectorizations: 0,
      errors: [{ metricName: "prometheus", error: "Not implemented" }],
      duration: 0,
    };
  }

  /**
   * Integration point for Grafana dashboards
   * Future: Pull metrics from Grafana API
   */
  async ingestGrafanaMetrics(
    grafanaUrl: string,
    _apiKey: string
  ): Promise<MetricsVectorizationResult> {
    console.log("📊 Grafana integration not yet implemented");
    console.log(`💡 Future: Pull metrics from ${grafanaUrl}`);

    // Placeholder for future Grafana integration
    return {
      totalMetrics: 0,
      successfulVectorizations: 0,
      failedVectorizations: 0,
      errors: [{ metricName: "grafana", error: "Not implemented" }],
      duration: 0,
    };
  }
}

// Export singleton instance
let systemMetricsVectorServiceInstance: SystemMetricsVectorService | null = null;

export function getSystemMetricsVectorService(): SystemMetricsVectorService {
  if (!systemMetricsVectorServiceInstance) {
    systemMetricsVectorServiceInstance = new SystemMetricsVectorService();
  }
  return systemMetricsVectorServiceInstance;
}

export default SystemMetricsVectorService;
