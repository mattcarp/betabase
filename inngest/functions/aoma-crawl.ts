/**
 * AOMA Crawl Orchestrator
 * 
 * This function demonstrates the "Orchestrator-Workers" pattern:
 * 1. Receives a crawl.start event
 * 2. Discovers URLs to crawl
 * 3. Fans out to parallel page processors
 * 4. Aggregates results
 * 
 * MCP Testing Workflow:
 * 1. `list_functions` - verify this function is registered
 * 2. `send_event` with "aoma/crawl.start" - trigger crawl
 * 3. `poll_run_status` - watch it execute
 * 4. `get_run_status` - inspect step details on failure
 */

import { inngest } from '../client';
import { mockCrawl, type CrawlResult } from '../mocks/crawl-adapter';

export const aomaCrawlOrchestrator = inngest.createFunction(
  {
    id: 'aoma-crawl-orchestrator',
    name: 'AOMA Crawl Orchestrator',
    // Retry configuration for resilience
    retries: 3,
    // Cancel any existing run when a new one starts (prevents overlapping crawls)
    cancelOn: [{ event: 'aoma/crawl.cancel' }],
  },
  { event: 'aoma/crawl.start' },
  async ({ event, step }) => {
    const {
      startUrl = 'https://aoma-stage.smcdp-de.net/',
      maxPages = 50,
      maxDepth = 3,
      concurrency = 5,
      useMock = true, // Default to mock while AOMA is inaccessible
    } = event.data;

    // Step 1: Initialize crawl session
    const session = await step.run('initialize-session', async () => {
      console.log(`Starting crawl: ${startUrl}`);
      return {
        runId: `crawl-${Date.now()}`,
        startedAt: new Date().toISOString(),
        config: { startUrl, maxPages, maxDepth, concurrency, useMock },
      };
    });

    // Step 2: Discover seed URLs (or use mock)
    const seedUrls = await step.run('discover-seeds', async () => {
      if (useMock) {
        // Return mock seed URLs for testing
        return [
          `${startUrl}`,
          `${startUrl}products`,
          `${startUrl}assets`,
          `${startUrl}reports`,
          `${startUrl}admin`,
        ];
      }
      
      // TODO: Real implementation would:
      // 1. Authenticate with AOMA
      // 2. Fetch the start page
      // 3. Extract all links
      throw new Error('Real crawl not implemented - set useMock: true');
    });

    // Step 3: Fan out to parallel page processors
    // Using step.invoke for synchronous sub-function calls
    const pageResults = await step.run('process-pages-parallel', async () => {
      if (useMock) {
        const result = await mockCrawl({
          startUrl,
          maxPages,
          maxDepth,
          delayMs: 300, // Simulate network latency
          errorRate: 0.1, // 10% error rate for testing retry logic
        });
        return result;
      }
      
      throw new Error('Real crawl not implemented');
    });

    // Step 4: Aggregate and report results
    const summary = await step.run('aggregate-results', async () => {
      const result = pageResults as CrawlResult;
      return {
        runId: session.runId,
        completedAt: new Date().toISOString(),
        stats: result.stats,
        samplePages: result.pages.slice(0, 3).map(p => ({
          url: p.url,
          title: p.title,
          status: p.status,
        })),
      };
    });

    // Step 5: Optionally trigger ingestion
    if (pageResults.stats.successCount > 0) {
      await step.sendEvent('trigger-ingestion', {
        name: 'aoma/ingest.start',
        data: {
          crawlRunId: session.runId,
          pageCount: pageResults.stats.successCount,
        },
      });
    }

    return {
      success: true,
      ...summary,
    };
  }
);
