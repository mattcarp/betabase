/**
 * Manual Test: SIAM Chat with AOMA Questions
 * Tests multi-tenant vector store integration
 */

import { test, expect } from '@playwright/test';

test.describe('SIAM Chat - AOMA Questions', () => {
  test.setTimeout(120000); // 2 minutes for AI responses

  test('should answer AOMA-related questions', async ({ page }) => {
    // Navigate to chat
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // Wait for chat interface
    const chatInput = page.locator('textarea, input[type="text"]').first();
    await expect(chatInput).toBeVisible({ timeout: 10000 });

    console.log('\n🎯 Testing AOMA Questions...\n');

    // Test Question 1: What is AOMA?
    console.log('Question 1: What is AOMA?');
    await chatInput.fill('What is AOMA?');
    await chatInput.press('Enter');
    
    // Wait for response
    await page.waitForTimeout(5000);
    const messages1 = await page.locator('[role="article"], .message, .chat-message').allTextContents();
    console.log('Response 1:', messages1[messages1.length - 1]);
    console.log('---\n');

    // Test Question 2: How do I use AOMA?
    console.log('Question 2: How do I use AOMA?');
    await chatInput.fill('How do I use AOMA?');
    await chatInput.press('Enter');
    
    await page.waitForTimeout(5000);
    const messages2 = await page.locator('[role="article"], .message, .chat-message').allTextContents();
    console.log('Response 2:', messages2[messages2.length - 1]);
    console.log('---\n');

    // Test Question 3: What features does AOMA have?
    console.log('Question 3: What features does AOMA have?');
    await chatInput.fill('What features does AOMA have?');
    await chatInput.press('Enter');
    
    await page.waitForTimeout(5000);
    const messages3 = await page.locator('[role="article"], .message, .chat-message').allTextContents();
    console.log('Response 3:', messages3[messages3.length - 1]);
    console.log('---\n');

    // Take a screenshot of the chat
    await page.screenshot({ path: 'tests/manual/aoma-chat-screenshot.png', fullPage: true });
    console.log('📸 Screenshot saved to tests/manual/aoma-chat-screenshot.png');
  });
});






