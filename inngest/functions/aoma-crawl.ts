/**
 * AOMA Crawl Orchestrator - Inngest Function
 * 
 * This demonstrates the "orchestrator-workers" pattern for parallel scraping.
 * Each step is independently retryable and visible in the Inngest dashboard.
 * 
 * When useMock=true, uses simulated data so you can test the workflow
 * without connecting to the real AOMA system.
 */
import { inngest } from '../client';

// Mock data for testing when AOMA isn't accessible
const MOCK_PAGES = [
  { url: 'https://aoma-mock.example/home', title: 'AOMA Home', links: ['/docs', '/api', '/guides'] },
  { url: 'https://aoma-mock.example/docs', title: 'Documentation', links: ['/docs/getting-started', '/docs/api-reference'] },
  { url: 'https://aoma-mock.example/api', title: 'API Reference', links: ['/api/endpoints', '/api/auth'] },
  { url: 'https://aoma-mock.example/guides', title: 'User Guides', links: ['/guides/upload', '/guides/search'] },
  { url: 'https://aoma-mock.example/docs/getting-started', title: 'Getting Started', links: [] },
  { url: 'https://aoma-mock.example/docs/api-reference', title: 'API Docs', links: [] },
];

const MOCK_DOCUMENTS = [
  { url: 'https://aoma-mock.example/docs/user-manual.pdf', type: 'pdf' as const, title: 'User Manual' },
  { url: 'https://aoma-mock.example/docs/api-spec.docx', type: 'docx' as const, title: 'API Specification' },
  { url: 'https://aoma-mock.example/reports/metrics.xlsx', type: 'xlsx' as const, title: 'Metrics Report' },
];

// Simulated delay to mimic real network latency
const simulateLatency = () => new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

export const aomaCrawlOrchestrator = inngest.createFunction(
  {
    id: 'aoma-crawl-orchestrator',
    name: 'AOMA Crawl Orchestrator',
    // Retry configuration for resilience
    retries: 3,
    // Concurrency limit to respect rate limits
    concurrency: {
      limit: 5,
    },
  },
  { event: 'aoma/crawl.requested' },
  async ({ event, step }) => {
    const {
      startUrl,
      maxPages = 100,
      maxDepth = 3,
      concurrency = 5,
      useMock = true, // Default to mock for safety
    } = event.data;

    const crawlId = `crawl-${Date.now()}`;
    const startTime = Date.now();

    // Step 1: Initialize crawl session
    const session = await step.run('initialize-session', async () => {
      console.log(`[Crawl ${crawlId}] Initializing...`);
      
      if (useMock) {
        console.log('[Crawl] Using MOCK data - no real AOMA connection');
        return {
          crawlId,
          mode: 'mock',
          authenticated: true,
          startUrl: 'https://aoma-mock.example/home',
        };
      }
      
      // Real implementation would authenticate here
      // const auth = await authenticateToAOMA();
      return {
        crawlId,
        mode: 'live',
        authenticated: true,
        startUrl,
      };
    });

    // Step 2: Discover initial pages (breadth-first)
    const discoveredPages = await step.run('discover-pages', async () => {
      await simulateLatency();
      
      if (useMock) {
        // Return mock pages
        return MOCK_PAGES.slice(0, Math.min(maxPages, MOCK_PAGES.length)).map((page, idx) => ({
          url: page.url,
          title: page.title,
          depth: idx === 0 ? 0 : 1,
          linkCount: page.links.length,
        }));
      }
      
      // Real implementation would crawl here
      // const pages = await discoverPages(startUrl, maxDepth, maxPages);
      return [];
    });

    // Step 3: Process pages in parallel using fan-out
    // This is where the orchestrator-workers pattern shines
    const pageResults = await step.run('process-pages-batch', async () => {
      const results = [];
      
      for (const page of discoveredPages) {
        await simulateLatency();
        
        // Simulate page processing
        results.push({
          url: page.url,
          title: page.title,
          contentLength: Math.floor(Math.random() * 10000) + 1000,
          hasMarkdown: true,
          screenshotTaken: true,
          processedAt: new Date().toISOString(),
        });
      }
      
      return results;
    });

    // Step 4: Extract and process documents
    const documentResults = await step.run('extract-documents', async () => {
      await simulateLatency();
      
      if (useMock) {
        return MOCK_DOCUMENTS.map(doc => ({
          url: doc.url,
          type: doc.type,
          title: doc.title,
          extractedMarkdown: true,
          wordCount: Math.floor(Math.random() * 5000) + 500,
        }));
      }
      
      return [];
    });

    // Step 5: Generate summary report
    const report = await step.run('generate-report', async () => {
      const duration = Date.now() - startTime;
      
      return {
        crawlId,
        mode: useMock ? 'mock' : 'live',
        summary: {
          pagesDiscovered: discoveredPages.length,
          pagesProcessed: pageResults.length,
          documentsExtracted: documentResults.length,
          totalContentBytes: pageResults.reduce((sum, p) => sum + p.contentLength, 0),
        },
        timing: {
          startedAt: new Date(startTime).toISOString(),
          completedAt: new Date().toISOString(),
          durationMs: duration,
          durationHuman: `${(duration / 1000).toFixed(1)}s`,
        },
      };
    });

    // Emit completion event for downstream consumers
    await step.sendEvent('notify-completion', {
      name: 'aoma/crawl.completed',
      data: {
        crawlId,
        pagesProcessed: pageResults.length,
        documentsExtracted: documentResults.length,
        duration: Date.now() - startTime,
      },
    });

    return report;
  }
);
