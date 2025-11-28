/**
 * Demo Queries Test Suite
 * Tests the 5 key demo queries for the SIAM presentation
 *
 * Tests both:
 * - Questions that SHOULD return knowledge (AOMA basics, dev status)
 * - Questions that SHOULD honestly say "don't know" (blockchain trick question)
 */

import { test, expect } from '../fixtures/base-test';

// Demo queries with expected behavior
const DEMO_QUERIES = [
  {
    id: 'aoma-basics',
    question: 'What is AOMA?',
    expectKnowledge: true,
    description: 'Basic AOMA query - should return detailed knowledge about Asset and Offering Management Application',
    keywords: ['AOMA', 'Asset', 'Offering', 'Management', 'Application'],
  },
  {
    id: 'multi-source',
    question: 'Show me JIRA tickets related to AOMA migration and the related code commits',
    expectKnowledge: true,
    description: 'Multi-source query - demonstrates unified enterprise knowledge (JIRA + Git + Docs)',
    keywords: ['JIRA', 'migration', 'commit', 'ticket'],
  },
  {
    id: 'diagram-generation',
    question: 'Generate a system architecture diagram for AOMA showing all integration points',
    expectKnowledge: true,
    description: 'Diagram request - should offer to generate a Mermaid diagram (not auto-generate)',
    keywords: ['diagram', 'architecture', 'integration', 'mermaid', 'would you like'],
  },
  {
    id: 'dev-status',
    question: "What's the current development status of AOMA3 migration?",
    expectKnowledge: true,
    description: 'Development context query - should return dev status info',
    keywords: ['AOMA3', 'migration', 'development', 'status'],
  },
  {
    id: 'anti-hallucination',
    question: 'Does AOMA have a blockchain integration?',
    expectKnowledge: false, // This is a trick question - AOMA has no blockchain
    description: 'Anti-hallucination test - should honestly say "not in my knowledge base" or similar',
    keywords: ['not in my knowledge base', "don't have", 'no information', 'not found'],
  },
];

test.describe('Demo Queries Test Suite', () => {
  test.setTimeout(180000); // 3 minutes for all tests

  // Shared state for all tests
  let apiResponses: Array<{ status: number; url: string; query: string }> = [];
  let pageConsoleErrors: string[] = [];

  test.beforeAll(async () => {
    console.log('\n' + '='.repeat(80));
    console.log('SIAM DEMO QUERIES TEST SUITE');
    console.log('Testing KB Chat Connection + Anti-Hallucination');
    console.log('='.repeat(80) + '\n');
  });

  for (const query of DEMO_QUERIES) {
    test(`[${query.id}] ${query.description}`, async ({ page }) => {
      console.log('\n' + '-'.repeat(70));
      console.log(`TEST: ${query.id}`);
      console.log(`QUESTION: "${query.question}"`);
      console.log(`EXPECTED: ${query.expectKnowledge ? 'Should HAVE knowledge' : 'Should NOT know (anti-hallucination)'}`);
      console.log('-'.repeat(70));

      // Track API calls
      page.on('request', request => {
        if (request.url().includes('/api/chat')) {
          console.log(`[API REQUEST] POST /api/chat`);
        }
      });

      page.on('response', async response => {
        if (response.url().includes('/api/chat')) {
          const status = response.status();
          console.log(`[API RESPONSE] Status: ${status}`);
          apiResponses.push({ status, url: response.url(), query: query.id });
        }
      });

      // Track console errors
      page.on('console', msg => {
        if (msg.type() === 'error') {
          const text = msg.text();
          pageConsoleErrors.push(text);
          console.log(`[CONSOLE ERROR] ${text.substring(0, 200)}`);
        }
      });

      // Navigate to chat
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      console.log('[PAGE] Loaded');

      // Find chat input
      const chatInput = page.locator('textarea, input[placeholder*="message"], input[placeholder*="ask"]').first();
      await expect(chatInput).toBeVisible({ timeout: 10000 });
      console.log('[PAGE] Chat input found');

      // Submit query
      await chatInput.fill(query.question);
      await chatInput.press('Enter');
      console.log('[TEST] Query submitted, waiting for response...');

      // Wait for response - give streaming time to complete
      await page.waitForTimeout(20000);

      // Capture response text
      const responseElements = await page.locator('[class*="message"], [class*="response"], article, [role="article"]').allTextContents();
      const pageText = await page.textContent('body') || '';

      // Analyze response
      const hasKBError = pageText.includes("not in my knowledge base") ||
                         pageText.includes("don't have information") ||
                         pageText.includes("no information available") ||
                         pageText.includes("won't guess");

      const foundKeywords = query.keywords.filter(kw =>
        pageText.toLowerCase().includes(kw.toLowerCase())
      );

      console.log('\n[ANALYSIS]');
      console.log(`  Response length: ${pageText.length} chars`);
      console.log(`  Has "not in KB" response: ${hasKBError}`);
      console.log(`  Keywords found: ${foundKeywords.join(', ') || 'NONE'}`);

      // Take screenshot
      const screenshotPath = `tests/manual/screenshots/demo-${query.id}.png`;
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.log(`[SCREENSHOT] ${screenshotPath}`);

      // Log actual response (truncated)
      const combinedResponse = responseElements.join(' ').trim();
      console.log('\n[RESPONSE PREVIEW]');
      console.log(combinedResponse.substring(0, 500) + (combinedResponse.length > 500 ? '...' : ''));

      // Assertions based on expected behavior
      if (query.expectKnowledge) {
        // Should NOT have "not in my knowledge base" error
        expect(hasKBError, `Query "${query.id}" should have returned knowledge but got KB error`).toBe(false);
        // Should have found at least some relevant keywords
        expect(foundKeywords.length, `Query "${query.id}" should have found relevant keywords`).toBeGreaterThan(0);
      } else {
        // Anti-hallucination: Should honestly say it doesn't know
        expect(hasKBError, `Query "${query.id}" should honestly admit lack of knowledge`).toBe(true);
      }

      console.log(`\n[RESULT] ${query.expectKnowledge ? 'KNOWLEDGE' : 'ANTI-HALLUCINATION'} test: PASSED`);
    });
  }

  test.afterAll(async () => {
    console.log('\n' + '='.repeat(80));
    console.log('DEMO QUERIES TEST SUMMARY');
    console.log('='.repeat(80));
    console.log(`Total API calls: ${apiResponses.length}`);
    console.log(`Console errors: ${pageConsoleErrors.length}`);

    if (pageConsoleErrors.length > 0) {
      console.log('\nConsole Errors:');
      pageConsoleErrors.forEach((err, i) => console.log(`  ${i + 1}. ${err.substring(0, 100)}`));
    }

    console.log('\n' + '='.repeat(80) + '\n');
  });
});
