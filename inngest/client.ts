/**
 * Inngest Client Configuration
 * 
 * This is the single source of truth for the Inngest client.
 * All functions import from here to ensure consistent configuration.
 */

import { Inngest } from 'inngest';

// Create the Inngest client
export const inngest = new Inngest({
  id: 'mc-thebetabase',
  // In dev mode, events are sent to the local dev server
  // In production, set INNGEST_EVENT_KEY and INNGEST_SIGNING_KEY
});

// Event type definitions for type safety
export type AomaCrawlEvent = {
  name: 'aoma/crawl.start';
  data: {
    startUrl?: string;
    maxPages?: number;
    maxDepth?: number;
    concurrency?: number;
    /** Use mock data instead of real crawl (for testing without AOMA access) */
    useMock?: boolean;
  };
};

export type PageProcessEvent = {
  name: 'aoma/page.process';
  data: {
    url: string;
    runId: string;
    depth: number;
  };
};

export type IngestEvent = {
  name: 'aoma/ingest.start';
  data: {
    crawlDir?: string;
    batchSize?: number;
    dryRun?: boolean;
  };
};

export type TestScenarioEvent = {
  name: 'test/scenario.run';
  data: {
    scenarioId: string;
    config?: Record<string, unknown>;
  };
};

// Union type for all events
export type Events = AomaCrawlEvent | PageProcessEvent | IngestEvent | TestScenarioEvent;
