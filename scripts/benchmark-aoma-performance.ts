#!/usr/bin/env ts-node

/**
 * AOMA Performance Benchmarking Suite
 * Comprehensive testing of Railway vs Render deployments
 */

import { aomaRouter } from '../src/services/aomaParallelRouter';
import chalk from 'chalk';
import ora from 'ora';
import Table from 'cli-table3';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

interface BenchmarkConfig {
  iterations: number;
  warmupRuns: number;
  endpoints: string[];
  payloadSizes: number[];
  concurrency: number[];
  outputDir: string;
}

interface BenchmarkResult {
  timestamp: string;
  config: BenchmarkConfig;
  results: {
    railway: ProviderStats;
    render: ProviderStats;
  };
  comparison: ComparisonStats;
}

interface ProviderStats {
  avgLatency: number;
  p50: number;
  p95: number;
  p99: number;
  minLatency: number;
  maxLatency: number;
  successRate: number;
  throughput: number;
  coldStarts: number;
}

interface ComparisonStats {
  winner: 'railway' | 'render';
  latencyImprovement: number;
  throughputImprovement: number;
  reliabilityImprovement: number;
}

class AOMABenchmark {
  private config: BenchmarkConfig = {
    iterations: parseInt(process.env.BENCHMARK_ITERATIONS || '100'),
    warmupRuns: parseInt(process.env.WARMUP_RUNS || '10'),
    endpoints: [
      '/api/health',
      '/api/query',
      '/api/search/jira',
      '/api/analyze/context',
      '/api/knowledge/query'
    ],
    payloadSizes: [100, 1000, 5000, 10000], // bytes
    concurrency: [1, 5, 10, 20],
    outputDir: './benchmark-results'
  };

  private results: BenchmarkResult[] = [];

  async run(): Promise<void> {
    console.log(chalk.blue.bold('\n🚀 AOMA Performance Benchmark Suite\n'));
    console.log(chalk.gray('Comparing Railway vs Render deployments\n'));

    // Create output directory
    mkdirSync(this.config.outputDir, { recursive: true });

    // Step 1: Warmup
    await this.warmup();

    // Step 2: Latency benchmarks
    await this.benchmarkLatency();

    // Step 3: Throughput benchmarks
    await this.benchmarkThroughput();

    // Step 4: Payload size benchmarks
    await this.benchmarkPayloadSizes();

    // Step 5: Concurrent load benchmarks
    await this.benchmarkConcurrency();

    // Step 6: Cold start benchmarks
    await this.benchmarkColdStarts();

    // Step 7: Generate report
    await this.generateReport();
  }

  /**
   * Warmup both providers to eliminate cold starts
   */
  private async warmup(): Promise<void> {
    const spinner = ora('Warming up providers...').start();

    for (let i = 0; i < this.config.warmupRuns; i++) {
      await Promise.all([
        aomaRouter.makeRequestDirect('railway', '/api/health', { method: 'GET' }),
        aomaRouter.makeRequestDirect('render', '/api/health', { method: 'GET' })
      ]).catch(() => {}); // Ignore warmup errors

      spinner.text = `Warming up providers... ${i + 1}/${this.config.warmupRuns}`;
    }

    spinner.succeed('Providers warmed up!');
  }

  /**
   * Benchmark basic latency for each endpoint
   */
  private async benchmarkLatency(): Promise<void> {
    console.log(chalk.yellow('\n📊 Latency Benchmarks\n'));

    for (const endpoint of this.config.endpoints) {
      const spinner = ora(`Testing ${endpoint}...`).start();
      const results = await this.runEndpointBenchmark(endpoint);
      spinner.succeed(`${endpoint} complete!`);
      
      this.displayLatencyTable(endpoint, results);
    }
  }

  /**
   * Run benchmark for a specific endpoint
   */
  private async runEndpointBenchmark(endpoint: string): Promise<any> {
    const railwayLatencies: number[] = [];
    const renderLatencies: number[] = [];

    for (let i = 0; i < this.config.iterations; i++) {
      const comparison = await aomaRouter.compareProviders(endpoint, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (comparison.railway.metrics.success) {
        railwayLatencies.push(comparison.railway.metrics.latency);
      }
      if (comparison.render.metrics.success) {
        renderLatencies.push(comparison.render.metrics.latency);
      }
    }

    return {
      railway: this.calculateStats(railwayLatencies),
      render: this.calculateStats(renderLatencies)
    };
  }

  /**
   * Benchmark throughput (requests per second)
   */
  private async benchmarkThroughput(): Promise<void> {
    console.log(chalk.yellow('\n📊 Throughput Benchmarks\n'));

    const duration = 10000; // 10 seconds
    const spinner = ora('Testing throughput...').start();

    const railwayCount = await this.measureThroughput('railway', duration);
    const renderCount = await this.measureThroughput('render', duration);

    spinner.succeed('Throughput test complete!');

    const table = new Table({
      head: ['Provider', 'Total Requests', 'Requests/Second'],
      style: { head: ['cyan'] }
    });

    table.push(
      ['Railway', railwayCount, (railwayCount / (duration / 1000)).toFixed(2)],
      ['Render', renderCount, (renderCount / (duration / 1000)).toFixed(2)]
    );

    console.log(table.toString());
  }

  /**
   * Measure throughput for a provider
   */
  private async measureThroughput(provider: 'railway' | 'render', duration: number): Promise<number> {
    const startTime = Date.now();
    let count = 0;

    while (Date.now() - startTime < duration) {
      try {
        await aomaRouter.makeRequestDirect(provider, '/api/health', { method: 'GET' });
        count++;
      } catch {
        // Continue on errors
      }
    }

    return count;
  }

  /**
   * Benchmark different payload sizes
   */
  private async benchmarkPayloadSizes(): Promise<void> {
    console.log(chalk.yellow('\n📊 Payload Size Benchmarks\n'));

    const table = new Table({
      head: ['Payload Size', 'Railway (ms)', 'Render (ms)', 'Improvement'],
      style: { head: ['cyan'] }
    });

    for (const size of this.config.payloadSizes) {
      const spinner = ora(`Testing ${size} bytes payload...`).start();
      
      const payload = this.generatePayload(size);
      const comparison = await aomaRouter.compareProviders('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      spinner.succeed(`${size} bytes complete!`);

      table.push([
        `${size} bytes`,
        comparison.railway.metrics.latency.toFixed(2),
        comparison.render.metrics.latency.toFixed(2),
        `${comparison.improvement.toFixed(1)}%`
      ]);
    }

    console.log(table.toString());
  }

  /**
   * Generate test payload of specified size
   */
  private generatePayload(bytes: number): any {
    const chars = 'a'.repeat(bytes);
    return {
      query: chars,
      context: {
        sessionId: 'benchmark-' + Date.now(),
        timestamp: new Date().toISOString()
      }
    };
  }

  /**
   * Benchmark concurrent requests
   */
  private async benchmarkConcurrency(): Promise<void> {
    console.log(chalk.yellow('\n📊 Concurrency Benchmarks\n'));

    const table = new Table({
      head: ['Concurrent Requests', 'Railway Avg (ms)', 'Render Avg (ms)', 'Winner'],
      style: { head: ['cyan'] }
    });

    for (const concurrent of this.config.concurrency) {
      const spinner = ora(`Testing ${concurrent} concurrent requests...`).start();
      
      const railwayResults = await this.runConcurrentRequests('railway', concurrent);
      const renderResults = await this.runConcurrentRequests('render', concurrent);

      spinner.succeed(`${concurrent} concurrent requests complete!`);

      const railwayAvg = railwayResults.reduce((a, b) => a + b, 0) / railwayResults.length;
      const renderAvg = renderResults.reduce((a, b) => a + b, 0) / renderResults.length;
      
      table.push([
        concurrent,
        railwayAvg.toFixed(2),
        renderAvg.toFixed(2),
        renderAvg < railwayAvg ? chalk.green('Render') : chalk.yellow('Railway')
      ]);
    }

    console.log(table.toString());
  }

  /**
   * Run concurrent requests
   */
  private async runConcurrentRequests(provider: 'railway' | 'render', count: number): Promise<number[]> {
    const promises = Array(count).fill(0).map(() =>
      aomaRouter.makeRequestDirect(provider, '/api/health', { method: 'GET' })
    );

    const results = await Promise.allSettled(promises);
    
    return results
      .filter(r => r.status === 'fulfilled')
      .map(r => (r as any).value.metrics.latency);
  }

  /**
   * Benchmark cold starts
   */
  private async benchmarkColdStarts(): Promise<void> {
    console.log(chalk.yellow('\n📊 Cold Start Benchmarks\n'));
    console.log(chalk.gray('Waiting 5 minutes for services to go cold...\n'));

    // Wait for services to go cold (in production, this would be longer)
    if (process.env.SKIP_COLD_START !== 'true') {
      await new Promise(resolve => setTimeout(resolve, 5 * 60 * 1000));
    }

    const spinner = ora('Testing cold starts...').start();

    const comparison = await aomaRouter.compareProviders('/api/health', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    spinner.succeed('Cold start test complete!');

    const table = new Table({
      head: ['Metric', 'Railway', 'Render', 'Improvement'],
      style: { head: ['cyan'] }
    });

    table.push([
      'Cold Start Latency',
      `${comparison.railway.metrics.latency.toFixed(2)}ms`,
      `${comparison.render.metrics.latency.toFixed(2)}ms`,
      `${comparison.improvement.toFixed(1)}%`
    ]);

    console.log(table.toString());
  }

  /**
   * Calculate statistics from latency array
   */
  private calculateStats(latencies: number[]): ProviderStats {
    if (latencies.length === 0) {
      return {
        avgLatency: 0,
        p50: 0,
        p95: 0,
        p99: 0,
        minLatency: 0,
        maxLatency: 0,
        successRate: 0,
        throughput: 0,
        coldStarts: 0
      };
    }

    const sorted = [...latencies].sort((a, b) => a - b);

    return {
      avgLatency: latencies.reduce((a, b) => a + b, 0) / latencies.length,
      p50: sorted[Math.floor(sorted.length * 0.5)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
      minLatency: sorted[0],
      maxLatency: sorted[sorted.length - 1],
      successRate: 100, // All successful in this array
      throughput: 1000 / (latencies.reduce((a, b) => a + b, 0) / latencies.length),
      coldStarts: 0
    };
  }

  /**
   * Display latency comparison table
   */
  private displayLatencyTable(endpoint: string, results: any): void {
    const table = new Table({
      head: ['Metric', 'Railway', 'Render', 'Improvement'],
      style: { head: ['cyan'] }
    });

    const improvement = ((results.railway.avgLatency - results.render.avgLatency) / 
                        results.railway.avgLatency) * 100;

    table.push(
      ['Average', `${results.railway.avgLatency.toFixed(2)}ms`, 
       `${results.render.avgLatency.toFixed(2)}ms`, 
       improvement > 0 ? chalk.green(`${improvement.toFixed(1)}%`) : chalk.red(`${improvement.toFixed(1)}%`)],
      ['P50', `${results.railway.p50.toFixed(2)}ms`, `${results.render.p50.toFixed(2)}ms`, '-'],
      ['P95', `${results.railway.p95.toFixed(2)}ms`, `${results.render.p95.toFixed(2)}ms`, '-'],
      ['P99', `${results.railway.p99.toFixed(2)}ms`, `${results.render.p99.toFixed(2)}ms`, '-'],
      ['Min', `${results.railway.minLatency.toFixed(2)}ms`, `${results.render.minLatency.toFixed(2)}ms`, '-'],
      ['Max', `${results.railway.maxLatency.toFixed(2)}ms`, `${results.render.maxLatency.toFixed(2)}ms`, '-']
    );

    console.log(`\n${chalk.bold(endpoint)}`);
    console.log(table.toString());
  }

  /**
   * Generate comprehensive report
   */
  private async generateReport(): Promise<void> {
    console.log(chalk.blue.bold('\n📝 Generating Comprehensive Report...\n'));

    const stats = {
      railway: aomaRouter.getStatistics('railway'),
      render: aomaRouter.getStatistics('render')
    };

    const report = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      config: this.config,
      statistics: stats,
      metrics: aomaRouter.exportMetrics(),
      summary: {
        totalRequests: stats.railway.totalRequests + stats.render.totalRequests,
        renderImprovement: {
          latency: ((stats.railway.avgLatency - stats.render.avgLatency) / stats.railway.avgLatency) * 100,
          successRate: stats.render.successRate - stats.railway.successRate
        },
        recommendation: this.generateRecommendation(stats)
      }
    };

    // Save report to file
    const reportPath = join(this.config.outputDir, `benchmark-${Date.now()}.json`);
    writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log(chalk.green(`✅ Report saved to: ${reportPath}`));
    
    // Display summary
    this.displaySummary(report);
  }

  /**
   * Generate recommendation based on results
   */
  private generateRecommendation(stats: any): string {
    const improvement = ((stats.railway.avgLatency - stats.render.avgLatency) / 
                        stats.railway.avgLatency) * 100;

    if (improvement > 30) {
      return 'STRONGLY RECOMMEND: Switch to Render immediately. Significant performance gains observed.';
    } else if (improvement > 10) {
      return 'RECOMMEND: Gradual migration to Render. Notable performance improvements detected.';
    } else if (improvement > 0) {
      return 'CONSIDER: Render shows marginal improvements. Monitor in production before full switch.';
    } else {
      return 'HOLD: Railway currently performing better. Investigate Render configuration.';
    }
  }

  /**
   * Display summary of results
   */
  private displaySummary(report: any): void {
    console.log(chalk.blue.bold('\n🏆 BENCHMARK SUMMARY\n'));

    const table = new Table({
      head: ['Provider', 'Avg Latency', 'P95', 'Success Rate', 'Cold Starts'],
      style: { head: ['cyan'] }
    });

    table.push(
      ['Railway', 
       `${report.statistics.railway.avgLatency.toFixed(2)}ms`,
       `${report.statistics.railway.p95Latency.toFixed(2)}ms`,
       `${report.statistics.railway.successRate.toFixed(1)}%`,
       `${report.statistics.railway.coldStartRate.toFixed(1)}%`],
      ['Render',
       `${report.statistics.render.avgLatency.toFixed(2)}ms`,
       `${report.statistics.render.p95Latency.toFixed(2)}ms`,
       `${report.statistics.render.successRate.toFixed(1)}%`,
       `${report.statistics.render.coldStartRate.toFixed(1)}%`]
    );

    console.log(table.toString());

    console.log(chalk.yellow('\n📊 Key Findings:'));
    console.log(`• Latency Improvement: ${report.summary.renderImprovement.latency.toFixed(1)}%`);
    console.log(`• Total Requests Tested: ${report.summary.totalRequests}`);
    
    console.log(chalk.green('\n✨ Recommendation:'));
    console.log(report.summary.recommendation);
  }
}

// Run if called directly
if (require.main === module) {
  const benchmark = new AOMABenchmark();
  benchmark.run()
    .then(() => {
      console.log(chalk.green.bold('\n✅ Benchmark Complete!\n'));
      process.exit(0);
    })
    .catch(error => {
      console.error(chalk.red('❌ Benchmark failed:'), error);
      process.exit(1);
    });
}

export { AOMABenchmark };