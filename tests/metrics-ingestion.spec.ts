/**
 * System Metrics Ingestion Tests
 * Tests for the metrics ingestion pipeline and vector storage
 */

import { test, expect } from '@playwright/test';

test.describe('System Metrics Ingestion Pipeline', () => {
  const baseUrl = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';

  test('Should capture and vectorize system snapshot', async ({ request }) => {
    console.log('📊 Testing system snapshot capture and vectorization...\n');

    const response = await request.post(`${baseUrl}/api/metrics/ingest`, {
      data: {
        action: 'snapshot',
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    console.log('📋 Snapshot Result:');
    console.log(`  Success: ${data.success}`);
    console.log(`  Action: ${data.action}`);
    console.log(`  Total Metrics: ${data.result?.totalMetrics || 0}`);
    console.log(`  Successful: ${data.result?.successfulVectorizations || 0}`);
    console.log(`  Failed: ${data.result?.failedVectorizations || 0}`);
    console.log(`  Duration: ${data.result?.duration || 0}ms\n`);

    expect(data.success).toBe(true);
    expect(data.action).toBe('snapshot');
    expect(data.result).toBeDefined();
    expect(data.result.totalMetrics).toBeGreaterThan(0);
    expect(data.result.successfulVectorizations).toBeGreaterThan(0);
    expect(data.result.failedVectorizations).toBe(0);
  });

  test('Should record and vectorize custom metric', async ({ request }) => {
    console.log('📊 Testing custom metric recording...\n');

    const customMetric = {
      action: 'custom',
      name: 'test.api.responseTime',
      value: 125.5,
      metricType: 'api',
      unit: 'milliseconds',
      tags: {
        endpoint: '/api/test',
        method: 'GET',
      },
      metadata: {
        testRun: 'playwright-test',
        timestamp: new Date().toISOString(),
      },
    };

    const response = await request.post(`${baseUrl}/api/metrics/ingest`, {
      data: customMetric,
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    console.log('📋 Custom Metric Result:');
    console.log(`  Success: ${data.success}`);
    console.log(`  Action: ${data.action}`);
    console.log(`  Vector ID: ${data.vectorId || 'N/A'}`);
    console.log(`  Metric Name: ${data.metric?.name || 'N/A'}`);
    console.log(`  Metric Value: ${data.metric?.value || 'N/A'}\n`);

    expect(data.success).toBe(true);
    expect(data.action).toBe('custom');
    expect(data.vectorId).toBeDefined();
    expect(data.metric.name).toBe(customMetric.name);
    expect(data.metric.value).toBe(customMetric.value);
  });

  test('Should ingest batch of metrics', async ({ request }) => {
    console.log('📊 Testing batch metrics ingestion...\n');

    const metrics = [
      {
        timestamp: new Date().toISOString(),
        metricType: 'api',
        name: 'api.endpoint1.responseTime',
        value: 150,
        unit: 'milliseconds',
        tags: { endpoint: '/api/endpoint1' },
      },
      {
        timestamp: new Date().toISOString(),
        metricType: 'api',
        name: 'api.endpoint2.responseTime',
        value: 200,
        unit: 'milliseconds',
        tags: { endpoint: '/api/endpoint2' },
      },
      {
        timestamp: new Date().toISOString(),
        metricType: 'error',
        name: 'api.errorRate',
        value: 0.5,
        unit: 'percent',
        tags: { severity: 'low' },
      },
      {
        timestamp: new Date().toISOString(),
        metricType: 'performance',
        name: 'page.loadTime',
        value: 1200,
        unit: 'milliseconds',
        tags: { page: '/dashboard' },
      },
    ];

    const response = await request.post(`${baseUrl}/api/metrics/ingest`, {
      data: {
        action: 'batch',
        metrics,
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    console.log('📋 Batch Ingestion Result:');
    console.log(`  Success: ${data.success}`);
    console.log(`  Action: ${data.action}`);
    console.log(`  Total Metrics: ${data.result?.totalMetrics || 0}`);
    console.log(`  Successful: ${data.result?.successfulVectorizations || 0}`);
    console.log(`  Failed: ${data.result?.failedVectorizations || 0}`);
    console.log(`  Duration: ${data.result?.duration || 0}ms\n`);

    expect(data.success).toBe(true);
    expect(data.action).toBe('batch');
    expect(data.result.totalMetrics).toBe(metrics.length);
    expect(data.result.successfulVectorizations).toBe(metrics.length);
    expect(data.result.failedVectorizations).toBe(0);
  });

  test('Should search vectorized metrics', async ({ request }) => {
    console.log('🔍 Testing metrics search...\n');

    // First, ingest a known metric
    await request.post(`${baseUrl}/api/metrics/ingest`, {
      data: {
        action: 'custom',
        name: 'test.search.metric',
        value: 999,
        metricType: 'custom',
        unit: 'count',
        tags: { test: 'search' },
      },
    });

    // Wait a moment for vectorization to complete
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Now search for it
    const searchResponse = await request.post(`${baseUrl}/api/metrics/search`, {
      data: {
        query: 'search metric test',
        matchThreshold: 0.7,
        matchCount: 5,
      },
    });

    expect(searchResponse.ok()).toBeTruthy();
    const searchData = await searchResponse.json();

    console.log('📋 Search Results:');
    console.log(`  Success: ${searchData.success}`);
    console.log(`  Query: "${searchData.query}"`);
    console.log(`  Match Count: ${searchData.matchCount}`);

    if (searchData.results && searchData.results.length > 0) {
      console.log('\n  Top Results:');
      searchData.results.slice(0, 3).forEach((result: any, index: number) => {
        console.log(`    ${index + 1}. ${result.metadata?.name || 'Unknown'}`);
        console.log(`       Similarity: ${(result.similarity * 100).toFixed(1)}%`);
        console.log(`       Type: ${result.metadata?.metricType || 'Unknown'}`);
        console.log(`       Value: ${result.metadata?.value || 'N/A'}`);
      });
    }

    expect(searchData.success).toBe(true);
    expect(searchData.query).toBeDefined();
  });

  test('Should get metrics statistics', async ({ request }) => {
    console.log('📊 Testing metrics statistics...\n');

    const response = await request.get(`${baseUrl}/api/metrics/stats`);

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    console.log('📋 Metrics Statistics:');
    console.log(`  Success: ${data.success}`);
    console.log('\n  Vectorized Metrics:');
    console.log(`    Total Count: ${data.vectorized?.count || 0}`);

    console.log('\n  In-Memory Metrics:');
    console.log(`    Total: ${data.inMemory?.totalMetrics || 0}`);
    console.log(`    Oldest: ${data.inMemory?.oldestMetric || 'N/A'}`);
    console.log(`    Latest: ${data.inMemory?.latestMetric || 'N/A'}`);

    if (data.inMemory?.breakdown) {
      console.log('\n  Breakdown by Type:');
      Object.entries(data.inMemory.breakdown).forEach(([type, count]) => {
        console.log(`    ${type}: ${count}`);
      });
    }

    expect(data.success).toBe(true);
    expect(data.vectorized).toBeDefined();
    expect(data.inMemory).toBeDefined();
  });

  test('Should get metrics history', async ({ request }) => {
    console.log('📊 Testing metrics history retrieval...\n');

    const response = await request.get(`${baseUrl}/api/metrics/ingest?limit=10`);

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    console.log('📋 Metrics History:');
    console.log(`  Success: ${data.success}`);
    console.log(`  Count: ${data.count}`);

    if (data.metrics && data.metrics.length > 0) {
      console.log('\n  Recent Metrics:');
      data.metrics.slice(0, 5).forEach((metric: any, index: number) => {
        console.log(`    ${index + 1}. ${metric.name}`);
        console.log(`       Type: ${metric.metricType}`);
        console.log(`       Value: ${metric.value}${metric.unit ? ' ' + metric.unit : ''}`);
        console.log(`       Time: ${metric.timestamp}`);
      });
    }

    expect(data.success).toBe(true);
    expect(data.count).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(data.metrics)).toBe(true);
  });

  test('Should filter metrics by type', async ({ request }) => {
    console.log('📊 Testing metrics filtering by type...\n');

    // First ingest metrics of different types
    await request.post(`${baseUrl}/api/metrics/ingest`, {
      data: {
        action: 'batch',
        metrics: [
          {
            timestamp: new Date().toISOString(),
            metricType: 'api',
            name: 'filter.test.api',
            value: 100,
          },
          {
            timestamp: new Date().toISOString(),
            metricType: 'error',
            name: 'filter.test.error',
            value: 1,
          },
        ],
      },
    });

    // Get only API metrics
    const response = await request.get(`${baseUrl}/api/metrics/ingest?metricType=api&limit=20`);

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    console.log('📋 Filtered Metrics (API only):');
    console.log(`  Success: ${data.success}`);
    console.log(`  Count: ${data.count}`);

    if (data.metrics && data.metrics.length > 0) {
      const allApi = data.metrics.every((m: any) => m.metricType === 'api');
      console.log(`  All metrics are API type: ${allApi}`);
      expect(allApi).toBe(true);
    }

    expect(data.success).toBe(true);
  });

  test('Should handle validation errors gracefully', async ({ request }) => {
    console.log('📊 Testing error handling...\n');

    // Test missing required fields
    const response = await request.post(`${baseUrl}/api/metrics/ingest`, {
      data: {
        action: 'custom',
        // Missing name and value
      },
    });

    expect(response.status()).toBe(400);
    const data = await response.json();

    console.log('📋 Validation Error Response:');
    console.log(`  Error: ${data.error}`);

    expect(data.error).toBeDefined();
    expect(data.error).toContain('required');
  });

  test('Should verify metrics in vector store', async ({ request }) => {
    console.log('🔍 Verifying metrics in vector store...\n');

    // Ingest a unique metric
    const uniqueName = `test.vector.verify.${Date.now()}`;
    const uniqueValue = Math.floor(Math.random() * 1000);

    await request.post(`${baseUrl}/api/metrics/ingest`, {
      data: {
        action: 'custom',
        name: uniqueName,
        value: uniqueValue,
        metricType: 'custom',
        tags: { verification: 'true' },
      },
    });

    // Wait for vectorization
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Search for it
    const searchResponse = await request.post(`${baseUrl}/api/metrics/search`, {
      data: {
        query: uniqueName,
        matchThreshold: 0.5,
        matchCount: 5,
      },
    });

    const searchData = await searchResponse.json();

    console.log('📋 Vector Store Verification:');
    console.log(`  Unique Metric Name: ${uniqueName}`);
    console.log(`  Unique Value: ${uniqueValue}`);
    console.log(`  Found in vector store: ${searchData.matchCount > 0}`);

    if (searchData.results && searchData.results.length > 0) {
      const foundMetric = searchData.results.find((r: any) =>
        r.metadata?.name === uniqueName
      );

      if (foundMetric) {
        console.log(`  ✅ Verified! Similarity: ${(foundMetric.similarity * 100).toFixed(1)}%`);
        console.log(`  Vector ID: ${foundMetric.id}`);
        console.log(`  Source ID: ${foundMetric.sourceId}`);

        expect(foundMetric.metadata.value).toBe(uniqueValue);
        expect(foundMetric.metadata.metricType).toBe('custom');
      }
    }

    expect(searchData.success).toBe(true);
  });
});
