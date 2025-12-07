/**
 * Inngest Client Configuration
 *
 * DISABLED: Inngest integration is currently disabled.
 * This stub prevents build errors while Inngest is not in use.
 */

// Stub client that does nothing - Inngest is disabled
export const inngest = {
  id: "mc-thebetabase",
  createFunction: () => ({ handler: () => {} }),
  send: async () => ({ ids: [] }),
} as unknown as { id: string; createFunction: () => unknown; send: () => Promise<{ ids: string[] }> };

// Event type definitions for type safety
export type AomaCrawlEvent = {
  name: "aoma/crawl.start";
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
  name: "aoma/page.process";
  data: {
    url: string;
    runId: string;
    depth: number;
  };
};

export type IngestEvent = {
  name: "aoma/ingest.start";
  data: {
    crawlDir?: string;
    batchSize?: number;
    dryRun?: boolean;
  };
};

export type TestScenarioEvent = {
  name: "test/scenario.run";
  data: {
    scenarioId: string;
    config?: Record<string, unknown>;
  };
};

// Union type for all events
export type Events = AomaCrawlEvent | PageProcessEvent | IngestEvent | TestScenarioEvent;
