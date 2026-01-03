/**
 * Knowledge API E2E Tests
 *
 * Tests for the Unified Knowledge API running on port 3006
 * Prerequisites: Run `npm run knowledge-api:dev` before running these tests
 */

import { test, expect } from '@playwright/test';

const API_BASE = 'http://localhost:3006';

test.describe('Knowledge API', () => {
  test.describe('Health Check', () => {
    test('GET /health returns healthy status', async ({ request }) => {
      const response = await request.get(`${API_BASE}/health`);
      expect(response.ok()).toBeTruthy();

      const data = await response.json();
      expect(data.status).toBe('healthy');
      expect(data.service).toBe('knowledge-api');
      expect(data.version).toBe('1.0.0');
      expect(data.cache).toBeDefined();
    });
  });

  test.describe('POST /v1/knowledge/query', () => {
    test('returns results with similarity scores', async ({ request }) => {
      const response = await request.post(`${API_BASE}/v1/knowledge/query`, {
        data: {
          query: 'How do I create a test case?',
          limit: 3,
        },
      });
      expect(response.ok()).toBeTruthy();

      const data = await response.json();
      expect(data.results).toBeDefined();
      expect(Array.isArray(data.results)).toBeTruthy();
      expect(data.metrics).toBeDefined();
      expect(typeof data.metrics.total_ms).toBe('number');
      expect(typeof data.metrics.embedding_ms).toBe('number');
      expect(typeof data.metrics.search_ms).toBe('number');

      if (data.results.length > 0) {
        const result = data.results[0];
        expect(result.id).toBeDefined();
        expect(result.content).toBeDefined();
        expect(result.source_type).toBeDefined();
        expect(typeof result.similarity).toBe('number');
        expect(result.similarity).toBeGreaterThan(0);
        expect(result.similarity).toBeLessThanOrEqual(1);
      }
    });

    test('includes synthesis when synthesize=true (default)', async ({ request }) => {
      const response = await request.post(`${API_BASE}/v1/knowledge/query`, {
        data: {
          query: 'What is AOMA?',
          limit: 3,
        },
      });
      expect(response.ok()).toBeTruthy();

      const data = await response.json();
      expect(data.synthesis).toBeDefined();
      expect(typeof data.synthesis).toBe('string');
      expect(data.metrics.synthesis_ms).toBeDefined();
    });

    test('excludes synthesis when synthesize=false', async ({ request }) => {
      const response = await request.post(`${API_BASE}/v1/knowledge/query`, {
        data: {
          query: 'test query',
          limit: 3,
          synthesize: false,
        },
      });
      expect(response.ok()).toBeTruthy();

      const data = await response.json();
      expect(data.synthesis).toBeUndefined();
      expect(data.metrics.synthesis_ms).toBeUndefined();
    });

    test('filters by source type', async ({ request }) => {
      const response = await request.post(`${API_BASE}/v1/knowledge/query`, {
        data: {
          query: 'code implementation',
          sources: ['git'],
          limit: 5,
          synthesize: false,
        },
      });
      expect(response.ok()).toBeTruthy();

      const data = await response.json();
      for (const result of data.results) {
        expect(result.source_type).toBe('git');
      }
    });

    test('caching works - second identical query is fast', async ({ request }) => {
      const uniqueQuery = `cache test ${Date.now()}`;

      // First request - cold
      const response1 = await request.post(`${API_BASE}/v1/knowledge/query`, {
        data: {
          query: uniqueQuery,
          limit: 1,
          synthesize: false,
        },
      });
      const data1 = await response1.json();
      expect(data1.metrics.cache_hit).toBe(false);

      // Second request - should hit cache
      const response2 = await request.post(`${API_BASE}/v1/knowledge/query`, {
        data: {
          query: uniqueQuery,
          limit: 1,
          synthesize: false,
        },
      });
      const data2 = await response2.json();
      expect(data2.metrics.cache_hit).toBe(true);
      expect(data2.metrics.total_ms).toBeLessThan(100);
    });

    test('returns 400 for missing query', async ({ request }) => {
      const response = await request.post(`${API_BASE}/v1/knowledge/query`, {
        data: {},
      });
      expect(response.status()).toBe(400);

      const data = await response.json();
      expect(data.error).toContain('query is required');
    });

    test('returns 400 for empty query', async ({ request }) => {
      const response = await request.post(`${API_BASE}/v1/knowledge/query`, {
        data: { query: '   ' },
      });
      expect(response.status()).toBe(400);
    });

    test('respects limit parameter', async ({ request }) => {
      const response = await request.post(`${API_BASE}/v1/knowledge/query`, {
        data: {
          query: 'AOMA',
          limit: 2,
          synthesize: false,
        },
      });
      expect(response.ok()).toBeTruthy();

      const data = await response.json();
      expect(data.results.length).toBeLessThanOrEqual(2);
    });

    test('enforces max limit of 20', async ({ request }) => {
      const response = await request.post(`${API_BASE}/v1/knowledge/query`, {
        data: {
          query: 'AOMA',
          limit: 100, // Exceeds max
          synthesize: false,
        },
      });
      expect(response.ok()).toBeTruthy();

      const data = await response.json();
      expect(data.results.length).toBeLessThanOrEqual(20);
    });
  });

  test.describe('404 Handler', () => {
    test('returns helpful error for unknown routes', async ({ request }) => {
      const response = await request.get(`${API_BASE}/unknown/path`);
      expect(response.status()).toBe(404);

      const data = await response.json();
      expect(data.error).toBe('Not Found');
      expect(data.hint).toContain('/v1/knowledge/query');
    });
  });
});
