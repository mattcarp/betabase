/**
 * Chat Response Time Performance Test
 * Measures end-to-end chat performance including AOMA orchestration
 * 
 * Run with: npx playwright test tests/performance/chat-response-time.spec.ts
 */

import { test, expect } from '../fixtures/base-test';
import fs from 'fs';
import path from 'path';

interface ChatPerformanceMetrics {
  timestamp: string;
  query: string;
  ttfb: number; // Time to first byte (AOMA orchestration time)
  ttfr: number; // Time to first render (when user sees response)
  totalTime: number; // Complete response time
  aomaOrchestrationTime: number | null; // Extracted from server logs
  embeddingTime: number | null;
  vectorSearchTime: number | null;
  streamingStartDelay: number; // TTFB - how long before stream starts
  success: boolean;
  errorMessage?: string;
}

const TEST_QUERIES = [
  "What is AOMA?", // Common query, should be cached
  "How do I upload assets to AOMA?", // Real-world query
  "What metadata fields are required?", // Specific query
  "Tell me about Sony Music's AOMA platform", // Longer query
];

test.describe('Chat Response Time Performance', () => {
  const results: ChatPerformanceMetrics[] = [];

  test('Measure chat response times - Cold Start', async ({ page }) => {
    console.log('\n🔵 COLD START TEST - First query (no cache)');

    // Navigate to chat
    await page.goto('http://localhost:3000');
    await page.click('text=Chat');

    // Wait for chat interface to be ready (not networkidle - too many background requests)
    await page.waitForSelector('textarea, input[type="text"]', { timeout: 10000 });
    await page.waitForTimeout(1000); // Give UI time to settle

    const query = TEST_QUERIES[0]; // "What is AOMA?"
    const metrics = await measureChatQuery(page, query, true);
    results.push(metrics);

    console.log(`\n📊 Cold Start Metrics:`);
    console.log(`   TTFB: ${metrics.ttfb}ms (AOMA orchestration)`);
    console.log(`   TTFR: ${metrics.ttfr}ms (first visible response)`);
    console.log(`   Total: ${metrics.totalTime}ms`);
    console.log(`   Streaming Delay: ${metrics.streamingStartDelay}ms`);
    
    // Performance assertions
    expect(metrics.ttfb).toBeLessThan(3000); // AOMA orchestration should be < 3s
    expect(metrics.ttfr).toBeLessThan(4000); // First visible response < 4s
    expect(metrics.totalTime).toBeLessThan(10000); // Total < 10s
  });

  test('Measure chat response times - Warm Cache', async ({ page }) => {
    console.log('\n🟢 WARM CACHE TEST - Repeated query');

    await page.goto('http://localhost:3000');
    await page.click('text=Chat');
    await page.waitForSelector('textarea, input[type="text"]', { timeout: 10000 });
    await page.waitForTimeout(1000);

    // First query to warm cache
    await measureChatQuery(page, TEST_QUERIES[0], false);
    
    // Wait a bit
    await page.waitForTimeout(2000);

    // Same query again - should be faster
    const metrics = await measureChatQuery(page, TEST_QUERIES[0], false);
    results.push(metrics);

    console.log(`\n📊 Warm Cache Metrics:`);
    console.log(`   TTFB: ${metrics.ttfb}ms (should be faster with cache)`);
    console.log(`   TTFR: ${metrics.ttfr}ms`);
    console.log(`   Total: ${metrics.totalTime}ms`);
    
    // Warm cache should be significantly faster
    expect(metrics.ttfb).toBeLessThan(1000); // With cache, should be < 1s
    expect(metrics.ttfr).toBeLessThan(2000);
  });

  test('Measure multiple different queries', async ({ page }) => {
    console.log('\n🔷 MULTIPLE QUERIES TEST');

    await page.goto('http://localhost:3000');
    await page.click('text=Chat');
    await page.waitForSelector('textarea, input[type="text"]', { timeout: 10000 });
    await page.waitForTimeout(1000);

    for (let i = 1; i < TEST_QUERIES.length; i++) {
      const query = TEST_QUERIES[i];
      console.log(`\n   Testing: "${query}"`);
      
      const metrics = await measureChatQuery(page, query, false);
      results.push(metrics);

      console.log(`   TTFB: ${metrics.ttfb}ms | Total: ${metrics.totalTime}ms`);
      
      // Wait between queries
      await page.waitForTimeout(2000);
    }
  });

  test('Analyze AOMA orchestration bottleneck', async ({ page, context }) => {
    console.log('\n🔍 AOMA ORCHESTRATION ANALYSIS');

    // Listen for server-timing headers
    const serverTimings: any[] = [];
    page.on('response', async response => {
      const serverTiming = response.headers()['server-timing'];
      if (serverTiming) {
        serverTimings.push({
          url: response.url(),
          timing: serverTiming,
          status: response.status()
        });
      }
    });

    await page.goto('http://localhost:3000');
    await page.click('text=Chat');
    await page.waitForSelector('textarea, input[type="text"]', { timeout: 10000 });
    await page.waitForTimeout(1000);

    const metrics = await measureChatQuery(page, "What is AOMA?", false);
    
    console.log('\n📡 Server Timing Headers:');
    serverTimings.forEach(timing => {
      console.log(`   ${timing.url}: ${timing.timing}`);
    });

    console.log('\n⚠️  BOTTLENECK ANALYSIS:');
    if (metrics.ttfb > 1500) {
      console.log(`   ❌ AOMA orchestration is slow: ${metrics.ttfb}ms`);
      console.log(`   Breakdown (if available):`);
      console.log(`      - Embedding: ${metrics.embeddingTime || 'N/A'}ms`);
      console.log(`      - Vector Search: ${metrics.vectorSearchTime || 'N/A'}ms`);
      console.log(`   Recommendations:`);
      console.log(`      1. Enable embedding cache (target: 325ms)`);
      console.log(`      2. Optimize Supabase index (target: <150ms)`);
      console.log(`      3. Consider parallel processing`);
    } else {
      console.log(`   ✅ AOMA orchestration is fast: ${metrics.ttfb}ms`);
    }
  });

  test.afterAll(async () => {
    // Generate performance report
    const report = generatePerformanceReport(results);
    
    console.log('\n' + '='.repeat(80));
    console.log(report);
    console.log('='.repeat(80));

    // Save to file
    const reportDir = path.join(process.cwd(), 'tests', 'performance', 'reports');
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportPath = path.join(reportDir, `chat-performance-${timestamp}.json`);
    
    fs.writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      summary: calculateSummaryStats(results),
      results
    }, null, 2));

    console.log(`\n💾 Detailed report saved to: ${reportPath}\n`);
  });
});

async function measureChatQuery(
  page: any, 
  query: string, 
  captureServerLogs: boolean
): Promise<ChatPerformanceMetrics> {
  const startTime = performance.now();
  let ttfb = 0;
  let ttfr = 0;
  let responseReceived = false;

  // Start timing
  const input = page.locator('textarea, input[type="text"]').first();
  await input.fill(query);

  // Capture network request timing
  const requestPromise = page.waitForResponse(
    (response: any) => response.url().includes('/api/chat'),
    { timeout: 30000 }
  );

  // Press enter to send
  const sendTime = performance.now();
  await input.press('Enter');

  try {
    // Wait for API response (TTFB)
    const response = await requestPromise;
    ttfb = performance.now() - sendTime;
    responseReceived = true;

    // Wait for first visible response (TTFR)
    await page.waitForSelector('[data-role="assistant"], .assistant-message, [role="article"]', {
      timeout: 30000
    });
    ttfr = performance.now() - sendTime;

    // Wait for streaming to complete
    await page.waitForTimeout(5000); // Give it time to complete
    const totalTime = performance.now() - sendTime;

    return {
      timestamp: new Date().toISOString(),
      query,
      ttfb,
      ttfr,
      totalTime,
      streamingStartDelay: ttfb,
      aomaOrchestrationTime: ttfb, // TTFB = AOMA orchestration time
      embeddingTime: null, // Would need to extract from logs
      vectorSearchTime: null, // Would need to extract from logs
      success: true
    };
  } catch (error) {
    return {
      timestamp: new Date().toISOString(),
      query,
      ttfb: 0,
      ttfr: 0,
      totalTime: performance.now() - sendTime,
      streamingStartDelay: 0,
      aomaOrchestrationTime: null,
      embeddingTime: null,
      vectorSearchTime: null,
      success: false,
      errorMessage: error instanceof Error ? error.message : String(error)
    };
  }
}

function calculateSummaryStats(results: ChatPerformanceMetrics[]) {
  const successful = results.filter(r => r.success);
  
  if (successful.length === 0) {
    return {
      totalTests: results.length,
      successCount: 0,
      failureCount: results.length,
      avgTTFB: 0,
      avgTTFR: 0,
      avgTotal: 0
    };
  }

  const avgTTFB = successful.reduce((sum, r) => sum + r.ttfb, 0) / successful.length;
  const avgTTFR = successful.reduce((sum, r) => sum + r.ttfr, 0) / successful.length;
  const avgTotal = successful.reduce((sum, r) => sum + r.totalTime, 0) / successful.length;

  return {
    totalTests: results.length,
    successCount: successful.length,
    failureCount: results.filter(r => !r.success).length,
    avgTTFB: Math.round(avgTTFB),
    avgTTFR: Math.round(avgTTFR),
    avgTotal: Math.round(avgTotal),
    minTTFB: Math.round(Math.min(...successful.map(r => r.ttfb))),
    maxTTFB: Math.round(Math.max(...successful.map(r => r.ttfb))),
    p95TTFB: Math.round(calculatePercentile(successful.map(r => r.ttfb), 0.95))
  };
}

function calculatePercentile(values: number[], percentile: number): number {
  const sorted = values.slice().sort((a, b) => a - b);
  const index = Math.ceil(sorted.length * percentile) - 1;
  return sorted[index] || 0;
}

function generatePerformanceReport(results: ChatPerformanceMetrics[]): string {
  const stats = calculateSummaryStats(results);
  
  return `
📊 CHAT PERFORMANCE REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Tests Completed: ${stats.totalTests}
✅ Successful: ${stats.successCount}
❌ Failed: ${stats.failureCount}

⏱️  RESPONSE TIMES (Average)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   TTFB (AOMA Orchestration):  ${stats.avgTTFB}ms
   TTFR (First Visible):        ${stats.avgTTFR}ms
   Total Response Time:         ${stats.avgTotal}ms

📈 PERCENTILES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Minimum TTFB:    ${stats.minTTFB}ms (best case)
   Maximum TTFB:    ${stats.maxTTFB}ms (worst case)
   P95 TTFB:        ${stats.p95TTFB}ms (95th percentile)

🎯 BOTTLENECK ANALYSIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${stats.avgTTFB > 1500 ? `
   ⚠️  PRIMARY BOTTLENECK: AOMA Orchestration (${stats.avgTTFB}ms)
   
   This happens BEFORE streaming starts, blocking the response.
   
   Expected breakdown:
   - Embedding generation: ~858ms (68%)
   - Vector search: ~392ms (32%)
   
   RECOMMENDATIONS:
   1. ✅ Enable embedding cache → Target: 325ms (6x faster)
   2. ✅ Optimize Supabase HNSW index → Target: 150ms
   3. ✅ Pre-filter by source_type before search
   4. ⚠️  Consider moving to background/parallel processing
   5. ⚠️  Implement progressive streaming (stream partial results)
` : `
   ✅ Performance is GOOD! AOMA orchestration is fast.
   
   Keep monitoring for regressions.
`}

💡 TARGET PERFORMANCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Best Case (with all optimizations):    200ms
   Typical Case (warm cache):              545ms
   Current Average:                        ${stats.avgTTFB}ms
   Worst Case (cold start):                2698ms
`;
}





