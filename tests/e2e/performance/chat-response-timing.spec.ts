/**
 * Chat Response Timing and Caching Tests
 *
 * Tests chat functionality with different questions and measures:
 * 1. Response times for various questions
 * 2. Cache effectiveness by comparing repeat question performance
 */

import { test, expect, type Page } from '@playwright/test';

// Helper to wait for AI response to complete
async function waitForResponse(page: Page, messageCountBefore: number, timeout = 60000) {
  const startTime = Date.now();

  // Wait for new AI message to appear
  await page.waitForFunction(
    (count) => {
      const aiMessages = document.querySelectorAll('[data-testid="ai-message"]');
      return aiMessages.length > count;
    },
    messageCountBefore,
    { timeout }
  );

  // Wait a moment for streaming to complete (look for no more loading indicators)
  await page.waitForTimeout(500);

  const endTime = Date.now();
  return endTime - startTime;
}

// Helper to count existing AI messages
async function countAIMessages(page: Page): Promise<number> {
  return await page.locator('[data-testid="ai-message"]').count();
}

// Helper to send a message
async function sendMessage(page: Page, message: string) {
  const textarea = page.locator('[data-testid="chat-input"]');
  await textarea.fill(message);
  await textarea.press('Enter');
}

test.describe('Chat Response Timing', () => {
  test.beforeEach(async ({ page }) => {
    // Set bypass auth cookie for localhost
    await page.context().addCookies([
      { name: 'bypass_auth', value: 'true', domain: 'localhost', path: '/' },
    ]);

    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });

    // Wait for app to be fully hydrated by checking for branding first
    await page.locator('text=The Betabase').first().waitFor({ state: 'visible', timeout: 10000 });

    // Wait for chat interface to render
    try {
      await page.locator('[data-testid="chat-input"]').first()
        .waitFor({ state: 'visible', timeout: 15000 });
    } catch {
      // If still not visible, wait a bit more and try again (heavy load scenario)
      await page.waitForTimeout(2000);
      await page.locator('[data-testid="chat-input"]').first()
        .waitFor({ state: 'visible', timeout: 10000 });
    }

    // Wait a moment for initial load
    await page.waitForTimeout(1000);
  });

  test('should measure response time for different questions', async ({ page }) => {
    const questions = [
      'What is AOMA?',
      'Explain the architecture of AOMA 4',
      'How does the digital supply chain work?',
      'What are the key features of the beta testing program?',
    ];

    const responseTimes: { question: string; time: number }[] = [];

    for (const question of questions) {
      console.log(`\n📝 Asking: "${question}"`);

      const messageCountBefore = await countAIMessages(page);
      const startTime = Date.now();
      await sendMessage(page, question);

      // Wait for response
      const responseTime = await waitForResponse(page, messageCountBefore);
      const totalTime = Date.now() - startTime;

      responseTimes.push({ question, time: totalTime });

      console.log(`⏱️  Response time: ${totalTime}ms (${(totalTime / 1000).toFixed(2)}s)`);

      // Wait a bit between questions to avoid rate limiting
      await page.waitForTimeout(2000);
    }

    // Log summary
    console.log('\n📊 Response Time Summary:');
    console.log('═══════════════════════════════════════════════════');
    responseTimes.forEach(({ question, time }) => {
      console.log(`${question.substring(0, 50)}...`);
      console.log(`  ⏱️  ${time}ms (${(time / 1000).toFixed(2)}s)`);
    });

    const avgTime = responseTimes.reduce((sum, { time }) => sum + time, 0) / responseTimes.length;
    console.log('═══════════════════════════════════════════════════');
    console.log(`📈 Average response time: ${avgTime.toFixed(0)}ms (${(avgTime / 1000).toFixed(2)}s)`);

    // Assert all responses completed within reasonable time (60s)
    responseTimes.forEach(({ time }) => {
      expect(time).toBeLessThan(60000);
    });
  });

  test('should demonstrate cache effectiveness with repeat questions', async ({ page }) => {
    const testQuestion = 'What is AOMA 4?';

    // First request - uncached
    console.log('\n🔵 First request (uncached):');
    console.log(`📝 Question: "${testQuestion}"`);

    let messageCountBefore = await countAIMessages(page);
    const firstStartTime = Date.now();
    await sendMessage(page, testQuestion);
    const firstResponseTime = await waitForResponse(page, messageCountBefore);
    const firstTotalTime = Date.now() - firstStartTime;

    console.log(`⏱️  Response time: ${firstTotalTime}ms (${(firstTotalTime / 1000).toFixed(2)}s)`);

    // Wait a moment for any post-processing
    await page.waitForTimeout(3000);

    // Second request - should be cached/faster
    console.log('\n🟢 Second request (cached):');
    console.log(`📝 Question: "${testQuestion}"`);

    messageCountBefore = await countAIMessages(page);
    const secondStartTime = Date.now();
    await sendMessage(page, testQuestion);
    const secondResponseTime = await waitForResponse(page, messageCountBefore);
    const secondTotalTime = Date.now() - secondStartTime;

    console.log(`⏱️  Response time: ${secondTotalTime}ms (${(secondTotalTime / 1000).toFixed(2)}s)`);

    // Calculate improvement
    const improvement = ((firstTotalTime - secondTotalTime) / firstTotalTime) * 100;
    const speedup = firstTotalTime / secondTotalTime;

    console.log('\n📊 Cache Performance Analysis:');
    console.log('═══════════════════════════════════════════════════');
    console.log(`1st request: ${firstTotalTime}ms (${(firstTotalTime / 1000).toFixed(2)}s)`);
    console.log(`2nd request: ${secondTotalTime}ms (${(secondTotalTime / 1000).toFixed(2)}s)`);
    console.log(`Improvement: ${improvement.toFixed(1)}%`);
    console.log(`Speedup: ${speedup.toFixed(2)}x faster`);
    console.log('═══════════════════════════════════════════════════');

    if (secondTotalTime < firstTotalTime) {
      console.log('✅ Cache is working - second request was faster!');
    } else {
      console.log('⚠️  No cache improvement detected - second request was not faster');
    }

    // Assert both completed
    expect(firstTotalTime).toBeLessThan(60000);
    expect(secondTotalTime).toBeLessThan(60000);

    // Log cache effectiveness (don't assert, just report)
    console.log(`\nℹ️  Cache effectiveness: ${improvement > 0 ? 'POSITIVE' : 'NONE'}`);
  });

  test('should measure RAG query performance', async ({ page }) => {
    // Questions that should trigger RAG/vector search
    const ragQuestions = [
      'What documents are available about AOMA?',
      'Tell me about the Sony Music catalog management',
      'How does metadata management work in AOMA?',
    ];

    console.log('\n🔍 Testing RAG Query Performance:');
    console.log('═══════════════════════════════════════════════════');

    const ragTimes: { question: string; time: number }[] = [];

    for (const question of ragQuestions) {
      console.log(`\n📝 RAG Query: "${question}"`);

      const messageCountBefore = await countAIMessages(page);
      const startTime = Date.now();
      await sendMessage(page, question);
      const responseTime = await waitForResponse(page, messageCountBefore);
      const totalTime = Date.now() - startTime;

      ragTimes.push({ question, time: totalTime });

      console.log(`⏱️  Response time: ${totalTime}ms (${(totalTime / 1000).toFixed(2)}s)`);

      // Wait between queries
      await page.waitForTimeout(2000);
    }

    console.log('\n📊 RAG Query Summary:');
    console.log('═══════════════════════════════════════════════════');
    const avgRagTime = ragTimes.reduce((sum, { time }) => sum + time, 0) / ragTimes.length;
    console.log(`📈 Average RAG response time: ${avgRagTime.toFixed(0)}ms (${(avgRagTime / 1000).toFixed(2)}s)`);

    ragTimes.forEach(({ question, time }) => {
      console.log(`  • ${question.substring(0, 40)}... - ${(time / 1000).toFixed(2)}s`);
    });

    // All RAG queries should complete
    ragTimes.forEach(({ time }) => {
      expect(time).toBeLessThan(60000);
    });
  });

  test('should compare simple vs complex question response times', async ({ page }) => {
    const simpleQuestion = 'Hello';
    const complexQuestion = 'Explain the complete architecture of AOMA 4, including all microservices, data flows, and integration points with existing Sony systems';

    console.log('\n📊 Simple vs Complex Question Comparison:');
    console.log('═══════════════════════════════════════════════════');

    // Simple question
    console.log('\n🔹 Simple question:');
    console.log(`"${simpleQuestion}"`);
    let messageCountBefore = await countAIMessages(page);
    const simpleStart = Date.now();
    await sendMessage(page, simpleQuestion);
    await waitForResponse(page, messageCountBefore);
    const simpleTime = Date.now() - simpleStart;
    console.log(`⏱️  ${simpleTime}ms (${(simpleTime / 1000).toFixed(2)}s)`);

    await page.waitForTimeout(2000);

    // Complex question
    console.log('\n🔸 Complex question:');
    console.log(`"${complexQuestion.substring(0, 60)}..."`);
    messageCountBefore = await countAIMessages(page);
    const complexStart = Date.now();
    await sendMessage(page, complexQuestion);
    await waitForResponse(page, messageCountBefore);
    const complexTime = Date.now() - complexStart;
    console.log(`⏱️  ${complexTime}ms (${(complexTime / 1000).toFixed(2)}s)`);

    console.log('\n📈 Comparison:');
    console.log('═══════════════════════════════════════════════════');
    console.log(`Simple:  ${(simpleTime / 1000).toFixed(2)}s`);
    console.log(`Complex: ${(complexTime / 1000).toFixed(2)}s`);
    console.log(`Difference: ${((complexTime - simpleTime) / 1000).toFixed(2)}s`);

    if (complexTime > simpleTime) {
      console.log('✅ Complex questions take longer (expected)');
    } else {
      console.log('⚠️  Complex question was not slower than simple');
    }

    expect(simpleTime).toBeLessThan(60000);
    expect(complexTime).toBeLessThan(60000);
  });
});
