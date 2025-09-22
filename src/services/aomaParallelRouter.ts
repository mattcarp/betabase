/**
 * AOMA Parallel Router - A/B Testing & Performance Monitoring
 * Routes traffic to Render deployment (Railway removed)
 */

import { aomaMeshMcp } from './aomaMeshMcp';

export interface PerformanceMetrics {
  requestId: string;
  provider: 'render';
  endpoint: string;
  startTime: number;
  endTime: number;
  latency: number;
  success: boolean;
  statusCode?: number;
  errorMessage?: string;
  coldStart: boolean;
  payloadSize: number;
  responseSize: number;
}

export interface ABTestConfig {
  enabled: boolean;
  renderPercentage: number; // retained for compatibility
  stickySession: boolean;
  performanceLogging: boolean;
  comparisonMode: boolean; // no-op
}

class AOMAParallelRouter {
  // Railway removed; only Render is used
  private railwayUrl = '';
  
  private renderUrl = process.env.NEXT_PUBLIC_RENDER_AOMA_URL || 
    "https://aoma-mesh-mcp.onrender.com";
  
  private metrics: PerformanceMetrics[] = [];
  private lastRequestTime: { [key: string]: number } = {};
  
  private config: ABTestConfig = {
    enabled: process.env.NEXT_PUBLIC_AOMA_AB_TEST === 'true',
    renderPercentage: parseInt(process.env.NEXT_PUBLIC_RENDER_PERCENTAGE || '10'),
    stickySession: process.env.NEXT_PUBLIC_STICKY_SESSION !== 'false',
    performanceLogging: process.env.NEXT_PUBLIC_PERF_LOGGING !== 'false',
    comparisonMode: process.env.NEXT_PUBLIC_COMPARISON_MODE === 'true'
  };

  private sessionRouting = new Map<string, 'render'>();

  /**
   * Determines which provider to use based on A/B configuration
   */
  private selectProvider(): 'render' {
    return 'render';
  }

  /**
   * Makes a request to AOMA with performance tracking
   */
  async makeRequest(
    endpoint: string,
    options: RequestInit,
    sessionId?: string
  ): Promise<{ data: any; metrics: PerformanceMetrics }> {
    const provider = this.selectProvider();
    const baseUrl = this.renderUrl;
    const url = `${baseUrl}${endpoint}`;

    // Check for cold start (no request in last 5 minutes)
    const lastRequest = this.lastRequestTime[provider] || 0;
    const coldStart = Date.now() - lastRequest > 5 * 60 * 1000;
    
    const requestId = `${provider}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const startTime = performance.now();
    
    const metrics: PerformanceMetrics = {
      requestId,
      provider,
      endpoint,
      startTime,
      endTime: 0,
      latency: 0,
      success: false,
      coldStart,
      payloadSize: JSON.stringify(options.body || '').length,
      responseSize: 0
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'X-Request-ID': requestId,
          'X-AB-Test': provider
        }
      });

      const endTime = performance.now();
      metrics.endTime = endTime;
      metrics.latency = endTime - startTime;
      metrics.statusCode = response.status;
      metrics.success = response.ok;

      const data = await response.json();
      metrics.responseSize = JSON.stringify(data).length;

      this.lastRequestTime[provider] = Date.now();
      
      if (this.config.performanceLogging) {
        this.logMetrics(metrics);
      }
      
      this.metrics.push(metrics);

      return { data, metrics };
    } catch (error) {
      const endTime = performance.now();
      metrics.endTime = endTime;
      metrics.latency = endTime - startTime;
      metrics.errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (this.config.performanceLogging) {
        this.logMetrics(metrics);
      }
      
      this.metrics.push(metrics);
      throw error;
    }
  }

  /**
   * Run the same request on both providers for direct comparison
   */
  async compareProviders(
    endpoint: string,
    options: RequestInit
  ): Promise<{
    render: { data?: any; metrics: PerformanceMetrics };
    winner: 'render';
    improvement: number;
  }> {
    const renderResult = await this.makeRequestDirect('render', endpoint, options);
    return {
      render: renderResult,
      winner: 'render',
      improvement: 0
    };
  }

  /**
   * Make a direct request to a specific provider
   */
  private async makeRequestDirect(
    provider: 'render',
    endpoint: string,
    options: RequestInit
  ): Promise<{ data: any; metrics: PerformanceMetrics }> {
    const baseUrl = this.renderUrl;
    const url = `${baseUrl}${endpoint}`;
    
    const requestId = `${provider}-direct-${Date.now()}`;
    const startTime = performance.now();
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'X-Request-ID': requestId
      }
    });

    const endTime = performance.now();
    const data = await response.json();

    const metrics: PerformanceMetrics = {
      requestId,
      provider,
      endpoint,
      startTime,
      endTime,
      latency: endTime - startTime,
      success: response.ok,
      statusCode: response.status,
      coldStart: false,
      payloadSize: JSON.stringify(options.body || '').length,
      responseSize: JSON.stringify(data).length
    };

    return { data, metrics };
  }

  /**
   * Create error metrics for failed requests
   */
  private createErrorMetrics(
    provider: 'render',
    endpoint: string,
    error: any
  ): PerformanceMetrics {
    return {
      requestId: `${provider}-error-${Date.now()}`,
      provider,
      endpoint,
      startTime: 0,
      endTime: 0,
      latency: Infinity,
      success: false,
      errorMessage: error?.message || 'Request failed',
      coldStart: false,
      payloadSize: 0,
      responseSize: 0
    };
  }

  /**
   * Log metrics for monitoring
   */
  private logMetrics(metrics: PerformanceMetrics): void {
    const logData = {
      ...metrics,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV
    };

    console.log(`🎯 AOMA Performance [${metrics.provider}]:`, {
      endpoint: metrics.endpoint,
      latency: `${metrics.latency.toFixed(2)}ms`,
      success: metrics.success,
      coldStart: metrics.coldStart,
      payloadSize: `${(metrics.payloadSize / 1024).toFixed(2)}KB`,
      responseSize: `${(metrics.responseSize / 1024).toFixed(2)}KB`
    });

    // Send to monitoring service if configured
    if (process.env.NEXT_PUBLIC_MONITORING_ENDPOINT) {
      fetch(process.env.NEXT_PUBLIC_MONITORING_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logData)
      }).catch(err => console.error('Failed to send metrics:', err));
    }
  }

  /**
   * Get performance statistics
   */
  getStatistics(provider?: 'render'): {
    totalRequests: number;
    avgLatency: number;
    p50Latency: number;
    p95Latency: number;
    p99Latency: number;
    successRate: number;
    coldStartRate: number;
    avgPayloadSize: number;
    avgResponseSize: number;
  } {
    const relevantMetrics = provider 
      ? this.metrics.filter(m => m.provider === provider)
      : this.metrics;

    if (relevantMetrics.length === 0) {
      return {
        totalRequests: 0,
        avgLatency: 0,
        p50Latency: 0,
        p95Latency: 0,
        p99Latency: 0,
        successRate: 0,
        coldStartRate: 0,
        avgPayloadSize: 0,
        avgResponseSize: 0
      };
    }

    const latencies = relevantMetrics
      .filter(m => m.success)
      .map(m => m.latency)
      .sort((a, b) => a - b);

    return {
      totalRequests: relevantMetrics.length,
      avgLatency: latencies.reduce((a, b) => a + b, 0) / latencies.length,
      p50Latency: latencies[Math.floor(latencies.length * 0.5)] || 0,
      p95Latency: latencies[Math.floor(latencies.length * 0.95)] || 0,
      p99Latency: latencies[Math.floor(latencies.length * 0.99)] || 0,
      successRate: (relevantMetrics.filter(m => m.success).length / relevantMetrics.length) * 100,
      coldStartRate: (relevantMetrics.filter(m => m.coldStart).length / relevantMetrics.length) * 100,
      avgPayloadSize: relevantMetrics.reduce((a, m) => a + m.payloadSize, 0) / relevantMetrics.length,
      avgResponseSize: relevantMetrics.reduce((a, m) => a + m.responseSize, 0) / relevantMetrics.length
    };
  }

  /**
   * Clear metrics history
   */
  clearMetrics(): void {
    this.metrics = [];
  }

  /**
   * Export metrics for analysis
   */
  exportMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  /**
   * Update A/B test configuration
   */
  updateConfig(config: Partial<ABTestConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('🔧 AOMA A/B Test Config Updated:', this.config);
  }

  /**
   * Get current configuration
   */
  getConfig(): ABTestConfig {
    return { ...this.config };
  }
}

export const aomaRouter = new AOMAParallelRouter();