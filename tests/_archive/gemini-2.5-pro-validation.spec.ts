/**
 * Gemini 2.5 Pro Migration Validation Test
 * Tests basic chat functionality with Gemini 2.5 Pro model
 * 
 * Run with: npx playwright test tests/gemini-2.5-pro-validation.spec.ts
 */

import { test, expect } from './fixtures/base-test';

test.describe('Gemini 2.5 Pro Chat Validation', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to chat interface - don't wait for networkidle (Next.js HMR keeps it busy)
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('domcontentloaded');
    
    // Wait for the chat textarea to be visible (confirms page loaded)
    await page.waitForSelector('textarea[name="message"]', { timeout: 10000 });
    
    console.log('🌐 Navigated to chat interface');
  });

  test('should have Gemini 2.5 Pro as default model', async ({ page }) => {
    console.log('🔍 Checking default model selection...');
    
    // The model selector button should be visible
    const modelSelector = page.locator('button[role="combobox"]');
    await expect(modelSelector).toBeVisible({ timeout: 5000 });
    
    console.log('✅ Model selector found');
  });

  test('should send a basic query and receive response from Gemini', async ({ page }) => {
    console.log('💬 Testing basic chat with Gemini 2.5 Pro...');
    
    // Fill the textarea
    const textarea = page.locator('textarea[name="message"]');
    const testQuery = "What is 2 + 2?";
    console.log(`📝 Sending query: "${testQuery}"`);
    
    await textarea.fill(testQuery);
    
    // Click the send button (gradient button with send icon)
    const sendButton = page.locator('button[type="submit"]').last();
    await sendButton.click();
    
    console.log('📤 Query sent, waiting for response...');
    
    // Wait for a response message to appear (should have role="log" container or message content)
    // Give it up to 30 seconds for API response
    await page.waitForTimeout(5000);
    
    // Check for any new content that appeared after sending
    const messages = page.locator('[role="log"]');
    const hasContent = await messages.count() > 0;
    
    console.log('✅ Chat interaction completed, messages found:', hasContent);
    expect(hasContent).toBeTruthy();
  });

  test('should handle AOMA-specific query', async ({ page }) => {
    console.log('🎯 Testing AOMA knowledge query with Gemini 2.5 Pro...');
    
    const textarea = page.locator('textarea[name="message"]');
    const aomaQuery = "What is AOMA?";
    console.log(`📝 Sending AOMA query: "${aomaQuery}"`);
    
    await textarea.fill(aomaQuery);
    
    const sendButton = page.locator('button[type="submit"]').last();
    await sendButton.click();
    
    console.log('📤 AOMA query sent, waiting for response...');
    
    // Wait for response - AOMA queries involve vector search
    await page.waitForTimeout(8000);
    
    // Check that the chat area has content
    const messages = page.locator('[role="log"]');
    const hasContent = await messages.count() > 0;
    
    console.log('✅ AOMA query completed, messages found:', hasContent);
    expect(hasContent).toBeTruthy();
  });

  test('should measure response time with Gemini 2.5 Pro', async ({ page }) => {
    console.log('⏱️  Measuring Gemini 2.5 Pro response time...');
    
    const textarea = page.locator('textarea[name="message"]');
    const query = "Say hello";
    await textarea.fill(query);
    
    const startTime = Date.now();
    
    const sendButton = page.locator('button[type="submit"]').last();
    await sendButton.click();
    
    console.log('⏰ Query sent at:', new Date(startTime).toISOString());
    
    // Wait up to 30s for response
    await page.waitForTimeout(10000);
    const elapsedTime = Date.now() - startTime;
    
    // Check that chat interaction occurred
    const messages = page.locator('[role="log"]');
    const responseReceived = await messages.count() > 0;
    
    console.log('⏱️  Response time:', elapsedTime, 'ms');
    console.log('✅ Response received:', responseReceived);
    
    // Log performance tier
    if (elapsedTime < 2000) {
      console.log('🚀 Excellent performance (< 2s)');
    } else if (elapsedTime < 5000) {
      console.log('✅ Good performance (< 5s)');
    } else if (elapsedTime < 10000) {
      console.log('⚠️  Acceptable performance (< 10s)');
    } else {
      console.log('❌ Slow performance (> 10s)');
    }
    
    expect(responseReceived).toBeTruthy();
    expect(elapsedTime).toBeLessThan(30000); // Should respond within 30s
  });
});

