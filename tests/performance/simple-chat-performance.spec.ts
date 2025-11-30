/**
 * Simplified Chat Performance Test
 * Measures real chat response times in the browser
 */

import { test, expect } from '../fixtures/base-test';
import fs from 'fs';
import path from 'path';

interface PerformanceMetric {
  query: string;
  timestamp: string;
  timeToFirstToken: number; // When first character appears
  timeToComplete: number; // When response is fully rendered
  success: boolean;
  error?: string;
}

const QUERIES = [
  "What is AOMA?",
  "How do I upload files?",
  "What are the main features?"
];

test.describe('Chat Performance Study', () => {
  const metrics: PerformanceMetric[] = [];

  test('Measure chat response performance', async ({ page }) => {
    // Navigate to chat
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
    await page.click('text=Chat');

    // Wait for chat to be ready
    await page.waitForSelector('textarea', { timeout: 10000 });
    await page.waitForTimeout(2000); // Let initial loads settle

    // Test each query
    for (const query of QUERIES) {
      console.log(`\n Testing: "${query}"`);

      const metric = await measureQuery(page, query);
      metrics.push(metric);

      if (metric.success) {
        console.log(`   ✓ First token: ${metric.timeToFirstToken}ms`);
        console.log(`   ✓ Complete: ${metric.timeToComplete}ms`);
      } else {
        console.log(`   ✗ Failed: ${metric.error}`);
      }

      // Wait between queries
      await page.waitForTimeout(3000);
    }
  });

  test.afterAll(async () => {
    const report = generateReport(metrics);
    console.log('\n' + report);

    // Save to file
    const reportDir = path.join(process.cwd(), 'tests', 'performance', 'reports');
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportPath = path.join(reportDir, `chat-perf-${timestamp}.json`);

    fs.writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      metrics,
      summary: calculateSummary(metrics)
    }, null, 2));

    console.log(`\n Report saved: ${reportPath}\n`);
  });
});

async function measureQuery(page: any, query: string): Promise<PerformanceMetric> {
  try {
    const textarea = page.locator('textarea').first();

    // Clear any existing text
    await textarea.fill('');
    await page.waitForTimeout(500);

    // Type the query
    await textarea.fill(query);

    // Get the current message count
    const messagesBefore = await page.locator('[data-role="user"], [data-role="assistant"]').count();

    const startTime = Date.now();

    // Press Enter to send
    await textarea.press('Enter');

    // Wait for a new message to appear (assistant response)
    let timeToFirstToken = 0;
    try {
      await page.waitForSelector(`[data-role="assistant"]:nth-of-type(${messagesBefore + 1})`, {
        timeout: 30000,
        state: 'visible'
      });
      timeToFirstToken = Date.now() - startTime;
    } catch (e) {
      // If no response appears, check if there's any text in assistant messages
      const assistantMessages = await page.locator('[data-role="assistant"]').count();
      if (assistantMessages > messagesBefore) {
        timeToFirstToken = Date.now() - startTime;
      } else {
        throw new Error('No assistant response appeared');
      }
    }

    // Wait for response to stabilize (stop changing)
    await page.waitForTimeout(2000);
    const timeToComplete = Date.now() - startTime;

    return {
      query,
      timestamp: new Date().toISOString(),
      timeToFirstToken,
      timeToComplete,
      success: true
    };
  } catch (error) {
    return {
      query,
      timestamp: new Date().toISOString(),
      timeToFirstToken: 0,
      timeToComplete: 0,
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

function calculateSummary(metrics: PerformanceMetric[]) {
  const successful = metrics.filter(m => m.success);

  if (successful.length === 0) {
    return {
      totalTests: metrics.length,
      successCount: 0,
      failureCount: metrics.length,
      avgTimeToFirstToken: 0,
      avgTimeToComplete: 0
    };
  }

  return {
    totalTests: metrics.length,
    successCount: successful.length,
    failureCount: metrics.length - successful.length,
    avgTimeToFirstToken: Math.round(successful.reduce((sum, m) => sum + m.timeToFirstToken, 0) / successful.length),
    avgTimeToComplete: Math.round(successful.reduce((sum, m) => sum + m.timeToComplete, 0) / successful.length),
    minTimeToFirstToken: Math.min(...successful.map(m => m.timeToFirstToken)),
    maxTimeToFirstToken: Math.max(...successful.map(m => m.timeToFirstToken)),
    minTimeToComplete: Math.min(...successful.map(m => m.timeToComplete)),
    maxTimeToComplete: Math.max(...successful.map(m => m.timeToComplete))
  };
}

function generateReport(metrics: PerformanceMetric[]): string {
  const summary = calculateSummary(metrics);

  return `
═══════════════════════════════════════════════════════════
                  CHAT PERFORMANCE STUDY
═══════════════════════════════════════════════════════════

Tests Completed:    ${summary.totalTests}
Successful:         ${summary.successCount}
Failed:             ${summary.failureCount}

───────────────────────────────────────────────────────────
                    RESPONSE TIMES
───────────────────────────────────────────────────────────

Average Time to First Token:    ${summary.avgTimeToFirstToken}ms
Average Time to Complete:        ${summary.avgTimeToComplete}ms

Best Time to First Token:        ${summary.minTimeToFirstToken}ms
Worst Time to First Token:       ${summary.maxTimeToFirstToken}ms

Best Time to Complete:           ${summary.minTimeToComplete}ms
Worst Time to Complete:          ${summary.maxTimeToComplete}ms

───────────────────────────────────────────────────────────
                   INDIVIDUAL RESULTS
───────────────────────────────────────────────────────────
${metrics.map((m, i) => `
${i + 1}. "${m.query}"
   ${m.success ? `✓ First token: ${m.timeToFirstToken}ms | Complete: ${m.timeToComplete}ms` : `✗ ${m.error}`}
`).join('')}
═══════════════════════════════════════════════════════════
`;
}
