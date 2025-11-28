/**
 * Diagnostic Test: KB Chat Connection
 * Captures full API response to diagnose why responses aren't meaningful
 */

import { test, expect } from '../fixtures/base-test';

test.describe('KB Chat Diagnosis', () => {
  test.setTimeout(120000);

  test('diagnose chat API responses', async ({ page }) => {
    console.log('\n' + '='.repeat(70));
    console.log('KB CHAT DIAGNOSTIC TEST');
    console.log('='.repeat(70) + '\n');

    // Capture ALL network requests/responses
    const apiResponses: any[] = [];

    page.on('request', request => {
      if (request.url().includes('/api/chat')) {
        console.log(`\n[REQUEST] POST /api/chat`);
        const postData = request.postData();
        if (postData) {
          try {
            const parsed = JSON.parse(postData);
            console.log(`  Model: ${parsed.model || 'default'}`);
            console.log(`  Messages: ${parsed.messages?.length || 0}`);
            console.log(`  Last message: "${parsed.messages?.[parsed.messages.length - 1]?.content?.substring(0, 100)}..."`);
          } catch (e) {
            console.log(`  Body: ${postData.substring(0, 200)}`);
          }
        }
      }
    });

    page.on('response', async response => {
      if (response.url().includes('/api/chat')) {
        const status = response.status();
        console.log(`\n[RESPONSE] ${status} ${response.url()}`);

        // Check headers for RAG metadata
        const ragMetadata = response.headers()['x-rag-metadata'];
        if (ragMetadata) {
          console.log(`  RAG Metadata: ${ragMetadata}`);
        }

        // Try to capture response body (streaming makes this tricky)
        try {
          const contentType = response.headers()['content-type'];
          console.log(`  Content-Type: ${contentType}`);
        } catch (e) {
          console.log(`  Could not read response: ${e}`);
        }

        apiResponses.push({ status, url: response.url() });
      }
    });

    // Also capture console logs from the page
    page.on('console', msg => {
      const text = msg.text();
      // Only log interesting messages (skip noise)
      if (text.includes('AOMA') ||
          text.includes('Vector') ||
          text.includes('RAG') ||
          text.includes('orchestr') ||
          text.includes('Supabase') ||
          text.includes('Gemini') ||
          text.includes('error') ||
          text.includes('Error')) {
        console.log(`[BROWSER] ${text.substring(0, 300)}`);
      }
    });

    // Navigate to chat
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    console.log('\n[PAGE] Loaded successfully');

    // Find chat input
    const chatInput = page.locator('textarea, input[placeholder*="message"], input[placeholder*="ask"]').first();
    await expect(chatInput).toBeVisible({ timeout: 10000 });
    console.log('[PAGE] Chat input found');

    // Simple test question - if this doesn't work, we're not connected
    const testQuestion = 'What is AOMA?';
    console.log(`\n[TEST] Asking: "${testQuestion}"`);

    await chatInput.fill(testQuestion);
    await chatInput.press('Enter');

    // Wait for response
    console.log('[TEST] Waiting for response...');
    await page.waitForTimeout(15000); // Give it time for full response

    // Capture the response text
    const responseElements = await page.locator('[class*="message"], [class*="response"], article, [role="article"]').allTextContents();

    console.log('\n' + '='.repeat(70));
    console.log('CAPTURED RESPONSES:');
    console.log('='.repeat(70));

    responseElements.forEach((text, i) => {
      if (text.trim()) {
        console.log(`\n[${i}] ${text.trim().substring(0, 500)}${text.length > 500 ? '...' : ''}`);
      }
    });

    // Check for the "not in my knowledge base" message
    const pageText = await page.textContent('body');
    const hasKBError = pageText?.includes("not in my knowledge base") ||
                       pageText?.includes("won't guess");

    console.log('\n' + '='.repeat(70));
    console.log('DIAGNOSIS:');
    console.log('='.repeat(70));
    console.log(`  "Not in my knowledge base" error present: ${hasKBError ? 'YES - PROBLEM!' : 'NO'}`);
    console.log(`  API calls made: ${apiResponses.length}`);
    console.log(`  API status codes: ${apiResponses.map(r => r.status).join(', ')}`);

    // Take screenshot
    await page.screenshot({
      path: 'tests/manual/screenshots/kb-chat-diagnosis.png',
      fullPage: true
    });
    console.log('\n[SCREENSHOT] Saved to tests/manual/screenshots/kb-chat-diagnosis.png');
    console.log('\n' + '='.repeat(70) + '\n');
  });
});
