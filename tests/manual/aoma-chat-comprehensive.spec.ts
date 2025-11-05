/**
 * Comprehensive SIAM Chat Test - AOMA Questions with Full Response Capture
 */

import { test, expect } from '@playwright/test';

test.describe('SIAM Chat - AOMA Q&A (Multi-Tenant Vector Store)', () => {
  test.setTimeout(180000); // 3 minutes

  test('should answer AOMA questions using multi-tenant vector store', async ({ page }) => {
    console.log('\n🎯 Starting SIAM Chat Test with AOMA Questions...\n');

    // Navigate to chat
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // Take initial screenshot
    await page.screenshot({ path: 'tests/manual/screenshots/01-initial-load.png', fullPage: true });

    // Wait for chat input
    const chatInput = page.locator('textarea, input[placeholder*="Ask"]').first();
    await expect(chatInput).toBeVisible({ timeout: 10000 });

    const questions = [
      'What is AOMA?',
      'How many Jira tickets are in AOMA?',
      'What features does AOMA have?',
    ];

    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      console.log(`\n${'='.repeat(60)}`);
      console.log(`Question ${i + 1}: ${question}`);
      console.log('='.repeat(60));

      // Type and send question
      await chatInput.fill(question);
      await chatInput.press('Enter');

      // Wait for AI to start responding
      await page.waitForTimeout(2000);

      // Wait for response to complete (look for new input to be enabled)
      await page.waitForTimeout(8000);

      // Get all visible text from the page
      const pageText = await page.locator('body').textContent();
      
      // Find the most recent AI response (after our question)
      const messages = await page.locator('[class*="message"], [class*="chat"], article').allTextContents();
      
      console.log(`\n📝 Recent Messages:`);
      messages.slice(-4).forEach((msg, idx) => {
        if (msg.trim()) {
          console.log(`\n[${idx}] ${msg.trim().substring(0, 300)}${msg.length > 300 ? '...' : ''}`);
        }
      });

      // Take screenshot
      await page.screenshot({ 
        path: `tests/manual/screenshots/0${i + 2}-question-${i + 1}.png`, 
        fullPage: true 
      });

      // Small delay between questions
      await page.waitForTimeout(2000);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Test Complete!');
    console.log('📸 Screenshots saved to tests/manual/screenshots/');
    console.log('='.repeat(60) + '\n');
  });
});







