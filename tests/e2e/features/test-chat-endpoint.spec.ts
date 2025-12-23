import { test, expect } from '@playwright/test';

test('test chat endpoint being called', async ({ page }) => {
  const networkRequests: Array<{url: string, method: string, status: number}> = [];

  // Capture all network requests
  page.on('response', response => {
    if (response.url().includes('/api/')) {
      networkRequests.push({
        url: response.url(),
        method: response.request().method(),
        status: response.status()
      });
    }
  });

  console.log('\n=== Testing Chat Endpoint ===\n');

  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  console.log('✓ Page loaded');

  // Find chat input
  const chatInput = page.locator('textarea[placeholder*="Ask me"]').first();
  await chatInput.waitFor({ state: 'visible', timeout: 10000 });

  // Type a simple message
  await chatInput.fill('Test message');
  await page.waitForTimeout(500);

  // Press Enter to send (instead of clicking button)
  await chatInput.press('Enter');
  console.log('✓ Message sent');

  // Wait for API call
  await page.waitForTimeout(5000);

  // Report what endpoints were called
  console.log('\n=== API Requests Made ===');
  const chatRequests = networkRequests.filter(r => r.url.includes('/chat'));
  chatRequests.forEach(req => {
    console.log(`${req.method} ${req.url} - Status: ${req.status}`);
  });

  console.log(`\nTotal API requests: ${networkRequests.length}`);
  console.log(`Chat-related requests: ${chatRequests.length}`);

  // Check if /api/chat was called (not /api/chat-vercel)
  const correctEndpoint = chatRequests.find(r => r.url.endsWith('/api/chat'));
  const wrongEndpoint = chatRequests.find(r => r.url.includes('/chat-vercel'));

  if (correctEndpoint) {
    console.log('\n✓ CORRECT: /api/chat was called');
  }
  if (wrongEndpoint) {
    console.log('\n✗ WRONG: /api/chat-vercel was called');
  }
  if (!correctEndpoint && !wrongEndpoint) {
    console.log('\n✗ NO CHAT ENDPOINT CALLED');
  }
});
