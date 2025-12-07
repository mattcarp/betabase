/**
 * Inngest Client Configuration
 * 
 * This client connects your functions to the Inngest dev server
 * and will later connect to Inngest Cloud in production.
 */
import { Inngest } from 'inngest';

// Create the Inngest client
export const inngest = new Inngest({
  id: 'mc-thebetabase',
  // In dev, this automatically connects to the local dev server
  // In production, set INNGEST_EVENT_KEY and INNGEST_SIGNING_KEY
});

// Type definitions for our custom events
export type Events = {
  'aoma/crawl.requested': {
    data: {
      startUrl: string;
      maxPages?: number;
      maxDepth?: number;
      concurrency?: number;
      outputDir?: string;
      // When true, uses mock data instead of real AOMA connection
      useMock?: boolean;
    };
  };
  'aoma/page.discovered': {
    data: {
      url: string;
      depth: number;
      parentUrl?: string;
      crawlId: string;
    };
  };
  'aoma/document.found': {
    data: {
      url: string;
      type: 'pdf' | 'docx' | 'xlsx' | 'pptx';
      sourcePageUrl: string;
      crawlId: string;
    };
  };
  'aoma/crawl.completed': {
    data: {
      crawlId: string;
      pagesProcessed: number;
      documentsExtracted: number;
      duration: number;
    };
  };
  'test/echo': {
    data: {
      message: string;
    };
  };
};
