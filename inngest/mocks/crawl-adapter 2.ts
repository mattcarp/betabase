/**
 * Mock Crawl Adapter
 * 
 * Provides simulated crawl data for testing Inngest workflows
 * without requiring actual AOMA access. This lets you:
 * 
 * 1. Test the full workflow locally
 * 2. Validate retry logic and error handling
 * 3. Develop UI/monitoring features
 * 4. Practice MCP-driven debugging
 * 
 * When AOMA is accessible, swap `useMock: true` for real crawling.
 */

export interface CrawlPage {
  url: string;
  title: string;
  markdown: string;
  links: string[];
  depth: number;
  crawledAt: string;
  status: 'success' | 'error' | 'skipped';
  error?: string;
}

export interface CrawlResult {
  runId: string;
  startUrl: string;
  pages: CrawlPage[];
  stats: {
    totalPages: number;
    successCount: number;
    errorCount: number;
    skippedCount: number;
    durationMs: number;
  };
}

// Simulated AOMA page structure
const MOCK_AOMA_PAGES: CrawlPage[] = [
  {
    url: 'https://aoma-stage.smcdp-de.net/',
    title: 'AOMA - Asset & Offering Management Application',
    markdown: `# AOMA Home
    
Welcome to the Asset & Offering Management Application.

## Quick Links
- [Products](/products)
- [Assets](/assets)
- [Reports](/reports)
- [Administration](/admin)

## Recent Activity
The system is currently managing 15,432 active products across 89 territories.`,
    links: ['/products', '/assets', '/reports', '/admin', '/help'],
    depth: 0,
    crawledAt: new Date().toISOString(),
    status: 'success',
  },
  {
    url: 'https://aoma-stage.smcdp-de.net/products',
    title: 'Products - AOMA',
    markdown: `# Product Management

## Product Types
- **Physical**: CD, Vinyl, Cassette
- **Digital**: Download, Streaming
- **Bundles**: Multi-format packages

## Actions
- Create New Product
- Import from UPC
- Bulk Update
- Export to Excel`,
    links: ['/products/new', '/products/import', '/products/bulk', '/products/export'],
    depth: 1,
    crawledAt: new Date().toISOString(),
    status: 'success',
  },
  {
    url: 'https://aoma-stage.smcdp-de.net/assets',
    title: 'Assets - AOMA',
    markdown: `# Asset Library

## Asset Categories
- Audio Masters
- Artwork & Images  
- Video Content
- Metadata Files

## Storage Stats
- Total Assets: 2.4M
- Storage Used: 847 TB
- Recent Uploads: 1,247 this week`,
    links: ['/assets/audio', '/assets/artwork', '/assets/video', '/assets/metadata'],
    depth: 1,
    crawledAt: new Date().toISOString(),
    status: 'success',
  },
  {
    url: 'https://aoma-stage.smcdp-de.net/reports',
    title: 'Reports - AOMA',
    markdown: `# Reporting Dashboard

## Available Reports
- Territory Performance
- Product Lifecycle
- Asset Utilization
- Compliance Audit

## Scheduled Reports
Configure automated report delivery to stakeholders.`,
    links: ['/reports/territory', '/reports/lifecycle', '/reports/assets', '/reports/audit'],
    depth: 1,
    crawledAt: new Date().toISOString(),
    status: 'success',
  },
  {
    url: 'https://aoma-stage.smcdp-de.net/admin',
    title: 'Administration - AOMA',
    markdown: `# System Administration

## User Management
- Active Users: 342
- Pending Invitations: 12
- Role Assignments

## System Health
- API Latency: 45ms avg
- Queue Depth: 0
- Last Sync: 2 minutes ago`,
    links: ['/admin/users', '/admin/roles', '/admin/system', '/admin/logs'],
    depth: 1,
    crawledAt: new Date().toISOString(),
    status: 'success',
  },
  // Simulate an error case for testing retry logic
  {
    url: 'https://aoma-stage.smcdp-de.net/admin/logs',
    title: 'Error Page',
    markdown: '',
    links: [],
    depth: 2,
    crawledAt: new Date().toISOString(),
    status: 'error',
    error: 'Simulated timeout - useful for testing retry behavior',
  },
];

/**
 * Simulates the crawl process with configurable delays and error rates
 */
export async function mockCrawl(options: {
  startUrl?: string;
  maxPages?: number;
  maxDepth?: number;
  delayMs?: number;
  errorRate?: number; // 0-1, probability of random errors
}): Promise<CrawlResult> {
  const {
    startUrl = 'https://aoma-stage.smcdp-de.net/',
    maxPages = 10,
    maxDepth = 2,
    delayMs = 500,
    errorRate = 0.1,
  } = options;

  const runId = `mock-${Date.now()}`;
  const startTime = Date.now();
  
  // Filter pages by depth and limit
  let pages = MOCK_AOMA_PAGES
    .filter(p => p.depth <= maxDepth)
    .slice(0, maxPages);

  // Simulate crawl delay
  await new Promise(resolve => setTimeout(resolve, delayMs * pages.length));

  // Inject random errors if configured
  if (errorRate > 0) {
    pages = pages.map(page => {
      if (page.status === 'success' && Math.random() < errorRate) {
        return {
          ...page,
          status: 'error' as const,
          error: 'Random simulated error for testing',
          markdown: '',
        };
      }
      return page;
    });
  }

  const stats = {
    totalPages: pages.length,
    successCount: pages.filter(p => p.status === 'success').length,
    errorCount: pages.filter(p => p.status === 'error').length,
    skippedCount: pages.filter(p => p.status === 'skipped').length,
    durationMs: Date.now() - startTime,
  };

  return {
    runId,
    startUrl,
    pages,
    stats,
  };
}

/**
 * Simulates processing a single page (for parallel worker pattern)
 */
export async function mockProcessPage(url: string, depth: number): Promise<CrawlPage> {
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));

  const existingPage = MOCK_AOMA_PAGES.find(p => p.url === url);
  
  if (existingPage) {
    return { ...existingPage, depth, crawledAt: new Date().toISOString() };
  }

  // Generate a mock page for unknown URLs
  return {
    url,
    title: `Page: ${url.split('/').pop() || 'Unknown'}`,
    markdown: `# Mock Page\n\nThis is auto-generated content for ${url}`,
    links: [],
    depth,
    crawledAt: new Date().toISOString(),
    status: 'success',
  };
}
