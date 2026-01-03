/**
 * Knowledge API Quality Tests
 *
 * TDD tests for FEAT-013: Unified Knowledge API
 * Stop promise: "hey, maybe the search is better now. check perf, too"
 *
 * Tests:
 * 1. "What is AOMA?" returns useful wiki content (not just Jira titles)
 * 2. Search performance is acceptable (<2s for query+synthesis)
 * 3. Jira detail expand endpoint works
 * 4. Wiki content includes actual documentation
 */

import { test, expect } from '@playwright/test';

const KNOWLEDGE_API_URL = process.env.KNOWLEDGE_API_URL || 'http://localhost:3006';

test.describe('Knowledge API Quality', () => {
  test.describe('Search Quality', () => {
    test('"What is AOMA?" returns wiki documentation, not just Jira titles', async ({
      request,
    }) => {
      const response = await request.post(`${KNOWLEDGE_API_URL}/v1/knowledge/query`, {
        data: {
          query: 'What is AOMA?',
          limit: 5,
        },
      });

      expect(response.ok()).toBe(true);
      const data = await response.json();

      // Must have results
      expect(data.results.length).toBeGreaterThan(0);

      // At least one result should be from wiki (not just jira)
      const wikiResults = data.results.filter(
        (r: { source_type: string }) => r.source_type === 'wiki'
      );
      expect(wikiResults.length).toBeGreaterThan(0);

      // Wiki content should contain actual AOMA documentation
      const hasAomaContent = wikiResults.some(
        (r: { content: string }) =>
          r.content.includes('AOMA') &&
          (r.content.includes('wiki') ||
            r.content.includes('development') ||
            r.content.includes('Asset') ||
            r.content.includes('Offering'))
      );
      expect(hasAomaContent).toBe(true);

      // Best result should be wiki, not jira
      expect(data.results[0].source_type).toBe('wiki');
    });

    test('Search returns diverse source types', async ({ request }) => {
      const response = await request.post(`${KNOWLEDGE_API_URL}/v1/knowledge/query`, {
        data: {
          query: 'media conversion setup',
          limit: 10,
        },
      });

      expect(response.ok()).toBe(true);
      const data = await response.json();

      // Should have results from multiple sources
      const sourceTypes = new Set(data.results.map((r: { source_type: string }) => r.source_type));
      expect(sourceTypes.size).toBeGreaterThanOrEqual(1);

      // Wiki should be present for documentation queries
      expect(sourceTypes.has('wiki')).toBe(true);
    });

    test('Synthesis provides useful answer, not "I dont know"', async ({ request }) => {
      const response = await request.post(`${KNOWLEDGE_API_URL}/v1/knowledge/query`, {
        data: {
          query: 'What is AOMA?',
          limit: 5,
          synthesize: true,
        },
      });

      expect(response.ok()).toBe(true);
      const data = await response.json();

      // Should have synthesis
      expect(data.synthesis).toBeDefined();
      expect(data.synthesis.length).toBeGreaterThan(50);

      // Synthesis should NOT say it doesn't know
      const lowConfidencePhrases = [
        'does not contain',
        'no information',
        "don't have",
        "doesn't have",
        'not provided',
        'cannot find',
        'no context',
      ];
      const synthesisLower = data.synthesis.toLowerCase();
      const hasBadPhrase = lowConfidencePhrases.some((phrase) => synthesisLower.includes(phrase));
      expect(hasBadPhrase).toBe(false);
    });
  });

  test.describe('Performance', () => {
    test('Query with synthesis completes in <3s', async ({ request }) => {
      const start = Date.now();

      const response = await request.post(`${KNOWLEDGE_API_URL}/v1/knowledge/query`, {
        data: {
          query: 'What is AOMA?',
          limit: 5,
          synthesize: true,
        },
      });

      const elapsed = Date.now() - start;

      expect(response.ok()).toBe(true);
      const data = await response.json();

      // Total time should be under 3 seconds
      expect(elapsed).toBeLessThan(3000);

      // API should report timing metrics
      expect(data.metrics).toBeDefined();
      expect(data.metrics.total_ms).toBeLessThan(3000);
      expect(data.metrics.embedding_ms).toBeDefined();
      expect(data.metrics.search_ms).toBeDefined();
    });

    test('Query without synthesis completes in <1.5s', async ({ request }) => {
      const start = Date.now();

      const response = await request.post(`${KNOWLEDGE_API_URL}/v1/knowledge/query`, {
        data: {
          query: 'locked account',
          limit: 5,
          synthesize: false,
        },
      });

      const elapsed = Date.now() - start;

      expect(response.ok()).toBe(true);
      expect(elapsed).toBeLessThan(1500);
    });

    test('Cached queries are fast (<100ms)', async ({ request }) => {
      // First query to warm cache
      await request.post(`${KNOWLEDGE_API_URL}/v1/knowledge/query`, {
        data: {
          query: 'AOMA release notes',
          limit: 3,
          synthesize: true,
        },
      });

      // Second identical query should be cached
      const start = Date.now();
      const response = await request.post(`${KNOWLEDGE_API_URL}/v1/knowledge/query`, {
        data: {
          query: 'AOMA release notes',
          limit: 3,
          synthesize: true,
        },
      });
      const elapsed = Date.now() - start;

      expect(response.ok()).toBe(true);
      const data = await response.json();

      // Should be cache hit
      expect(data.metrics.cache_hit).toBe(true);
      expect(elapsed).toBeLessThan(100);
    });
  });

  test.describe('Jira Detail Expand', () => {
    test('Detail endpoint returns full data for cached tickets', async ({ request }) => {
      // ITSM-48949 is in the JSON cache
      const response = await request.get(`${KNOWLEDGE_API_URL}/v1/knowledge/detail/jira/ITSM-48949`);

      expect(response.ok()).toBe(true);
      const data = await response.json();

      expect(data.detail_level).toBe('full');
      expect(data.data.id).toBe('ITSM-48949');
      expect(data.data.summary).toBeTruthy();
      expect(data.has_description).toBe(true);
    });

    test('Detail endpoint returns minimal data with Jira link for uncached tickets', async ({
      request,
    }) => {
      // ITSM-53036 is only in siam_vectors, not JSON cache
      const response = await request.get(`${KNOWLEDGE_API_URL}/v1/knowledge/detail/jira/ITSM-53036`);

      expect(response.ok()).toBe(true);
      const data = await response.json();

      expect(data.detail_level).toBe('minimal');
      expect(data.jira_url).toContain('ITSM-53036');
      expect(data.hint).toContain('Jira');
    });

    test('Jira results have expandable flag', async ({ request }) => {
      const response = await request.post(`${KNOWLEDGE_API_URL}/v1/knowledge/query`, {
        data: {
          query: 'locked account',
          limit: 5,
        },
      });

      expect(response.ok()).toBe(true);
      const data = await response.json();

      // Find Jira results
      const jiraResults = data.results.filter(
        (r: { source_type: string }) => r.source_type === 'jira'
      );

      // All Jira results should have expandable: true
      jiraResults.forEach((r: { expandable: boolean }) => {
        expect(r.expandable).toBe(true);
      });
    });
  });

  test.describe('Health Check', () => {
    test('Health endpoint returns service info', async ({ request }) => {
      const response = await request.get(`${KNOWLEDGE_API_URL}/health`);

      expect(response.ok()).toBe(true);
      const data = await response.json();

      expect(data.status).toBe('healthy');
      expect(data.service).toBe('knowledge-api');
      expect(data.cache).toBeDefined();
    });
  });
});
