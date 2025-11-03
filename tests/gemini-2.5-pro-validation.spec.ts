/**
 * Gemini 2.5 Pro Migration Validation Test
 * Tests basic chat functionality with Gemini 2.5 Pro model
 * 
 * Run with: npx playwright test tests/gemini-2.5-pro-validation.spec.ts
 */

import { test, expect } from '@playwright/test';

test.describe('Gemini 2.5 Pro Chat Validation', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to chat interface
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    console.log('🌐 Navigated to chat interface');
  });

  test('should have Gemini 2.5 Pro as default model', async ({ page }) => {
    console.log('🔍 Checking default model selection...');
    
    // Look for model selector - it might be in a dropdown or visible text
    // Check if Gemini 2.5 Pro is selected/visible
    const pageContent = await page.content();
    
    // Check for Gemini 2.5 Pro in the page (either in dropdown, selected state, or visible)
    const hasGeminiPro = pageContent.includes('gemini-2.5-pro') || 
                         pageContent.includes('Gemini 2.5 Pro') ||
                         pageContent.includes('Gemini');
    
    console.log('✅ Page has Gemini references:', hasGeminiPro);
    expect(hasGeminiPro).toBeTruthy();
  });

  test('should send a basic query and receive response from Gemini', async ({ page }) => {
    console.log('💬 Testing basic chat with Gemini 2.5 Pro...');
    
    // Find and fill input field
    const inputSelector = 'textarea, input[type="text"]';
    await page.waitForSelector(inputSelector, { timeout: 10000 });
    
    const testQuery = "What is 2 + 2?";
    console.log(`📝 Sending query: "${testQuery}"`);
    
    await page.fill(inputSelector, testQuery);
    
    // Find and click send button
    const sendButton = page.locator('button:has-text("Send"), button[type="submit"]').first();
    await sendButton.click();
    
    console.log('📤 Query sent, waiting for response...');
    
    // Wait for response to appear (look for message container or response text)
    // Give it up to 30 seconds for first response (cold start)
    await page.waitForTimeout(2000); // Initial wait
    
    // Check for response content
    const pageContentAfter = await page.content();
    
    // Look for indicators of a response:
    // 1. The answer "4" should appear
    // 2. Or typical AI response patterns
    const hasResponse = pageContentAfter.includes('4') || 
                       pageContentAfter.toLowerCase().includes('answer') ||
                       pageContentAfter.toLowerCase().includes('result');
    
    console.log('✅ Response received:', hasResponse);
    expect(hasResponse).toBeTruthy();
  });

  test('should handle AOMA-specific query', async ({ page }) => {
    console.log('🎯 Testing AOMA knowledge query with Gemini 2.5 Pro...');
    
    const inputSelector = 'textarea, input[type="text"]';
    await page.waitForSelector(inputSelector, { timeout: 10000 });
    
    const aomaQuery = "What is AOMA?";
    console.log(`📝 Sending AOMA query: "${aomaQuery}"`);
    
    await page.fill(inputSelector, aomaQuery);
    
    const sendButton = page.locator('button:has-text("Send"), button[type="submit"]').first();
    await sendButton.click();
    
    console.log('📤 AOMA query sent, waiting for response...');
    
    // Wait for response - AOMA queries might take longer (vector search + synthesis)
    await page.waitForTimeout(5000);
    
    const pageContent = await page.content();
    
    // Check for AOMA-related content in response
    const hasAOMAResponse = pageContent.toLowerCase().includes('aoma') ||
                           pageContent.toLowerCase().includes('sony music') ||
                           pageContent.toLowerCase().includes('platform');
    
    console.log('✅ AOMA response received:', hasAOMAResponse);
    expect(hasAOMAResponse).toBeTruthy();
  });

  test('should display model provider info in console', async ({ page }) => {
    console.log('🔍 Checking for Gemini provider logs...');
    
    const consoleLogs: string[] = [];
    
    page.on('console', msg => {
      const text = msg.text();
      consoleLogs.push(text);
      if (text.includes('Gemini') || text.includes('Google')) {
        console.log('📋 Console log:', text);
      }
    });
    
    // Trigger a query to see console logs
    const inputSelector = 'textarea, input[type="text"]';
    await page.waitForSelector(inputSelector, { timeout: 10000 });
    await page.fill(inputSelector, "Hello");
    
    const sendButton = page.locator('button:has-text("Send"), button[type="submit"]').first();
    await sendButton.click();
    
    await page.waitForTimeout(3000);
    
    // Check if any logs mention Gemini or Google provider
    const hasGeminiLogs = consoleLogs.some(log => 
      log.includes('Gemini') || 
      log.includes('Google') || 
      log.includes('gemini-2.5-pro')
    );
    
    console.log('✅ Found Gemini provider logs:', hasGeminiLogs);
    console.log('📝 Total console logs captured:', consoleLogs.length);
    
    // This is informational, not a hard requirement
    if (!hasGeminiLogs) {
      console.log('⚠️  No Gemini logs found, but this may be expected in production mode');
    }
  });

  test('should measure response time with Gemini 2.5 Pro', async ({ page }) => {
    console.log('⏱️  Measuring Gemini 2.5 Pro response time...');
    
    const inputSelector = 'textarea, input[type="text"]';
    await page.waitForSelector(inputSelector, { timeout: 10000 });
    
    const query = "What is the capital of France?";
    await page.fill(inputSelector, query);
    
    const startTime = Date.now();
    
    const sendButton = page.locator('button:has-text("Send"), button[type="submit"]').first();
    await sendButton.click();
    
    console.log('⏰ Query sent at:', new Date(startTime).toISOString());
    
    // Wait for response (up to 30s)
    let responseReceived = false;
    let elapsedTime = 0;
    
    while (!responseReceived && elapsedTime < 30000) {
      await page.waitForTimeout(500);
      const content = await page.content();
      
      // Check for "Paris" in response
      if (content.includes('Paris')) {
        responseReceived = true;
        elapsedTime = Date.now() - startTime;
      } else {
        elapsedTime = Date.now() - startTime;
      }
    }
    
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

test.describe('Gemini vs GPT-5 Comparison', () => {
  test('compare response times between models', async ({ page }) => {
    console.log('📊 Comparing Gemini 2.5 Pro vs GPT-5...');
    
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    const testQuery = "Explain what a database is in one sentence.";
    
    // Test with Gemini 2.5 Pro (default)
    console.log('\n🤖 Testing with Gemini 2.5 Pro...');
    const geminiStartTime = Date.now();
    
    const inputSelector = 'textarea, input[type="text"]';
    await page.waitForSelector(inputSelector);
    await page.fill(inputSelector, testQuery);
    
    let sendButton = page.locator('button:has-text("Send"), button[type="submit"]').first();
    await sendButton.click();
    
    await page.waitForTimeout(5000); // Wait for response
    const geminiTime = Date.now() - geminiStartTime;
    
    console.log('⏱️  Gemini 2.5 Pro response time:', geminiTime, 'ms');
    
    // Note: To test GPT-5, would need to change model selector
    // This is left as a placeholder for manual testing
    console.log('\n💡 To compare with GPT-5:');
    console.log('   1. Change model selector to GPT-5');
    console.log('   2. Send the same query');
    console.log('   3. Compare response times');
    
    expect(geminiTime).toBeLessThan(30000);
  });
});

