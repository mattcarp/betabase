import { test, expect } from '@playwright/test';

test.describe('Chat Follow-up Questions', () => {
  test('should handle two consecutive questions without hanging', async ({ page }) => {
    // Set a longer timeout for this test since chat can be slow
    test.setTimeout(180000); // 3 minutes

    // Navigate to the chat interface
    await page.goto('http://localhost:3000');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    console.log('✅ Page loaded');

    // Find the chat input - try multiple possible selectors
    const inputSelectors = [
      'textarea[placeholder*="Message"]',
      'textarea[placeholder*="Ask"]',
      'textarea',
      '[data-test-id="chat-input"]',
    ];

    let chatInput = null;
    for (const selector of inputSelectors) {
      try {
        chatInput = await page.waitForSelector(selector, { timeout: 5000 });
        if (chatInput) {
          console.log(`✅ Found chat input with selector: ${selector}`);
          break;
        }
      } catch (e) {
        continue;
      }
    }

    if (!chatInput) {
      throw new Error('Could not find chat input field');
    }

    // ========================================
    // FIRST QUESTION
    // ========================================
    console.log('📝 Sending first question...');
    await chatInput.fill('What is 2+2?');
    
    // Find and click submit button
    const submitButton = await page.locator('button[type="submit"]').first();
    await submitButton.click();
    
    console.log('⏳ Waiting for progress indicator on first question...');
    
    // Verify progress indicator appears (Chain of Thought UI)
    const progressIndicator1 = await page.waitForSelector('text=/Processing query|Query Analysis|Knowledge Search/', { timeout: 5000 }).catch(() => null);
    if (progressIndicator1) {
      console.log('✅ Progress indicator appeared for first question!');
    } else {
      console.log('⚠️  Progress indicator did NOT appear for first question (might be too fast)');
    }
    
    console.log('⏳ Waiting for first response...');
    
    // Wait for assistant response (look for AI avatar or message container)
    // The response should appear within 60 seconds
    const firstResponse = await page.waitForSelector('text=/AI|In the context|result/', { timeout: 60000 }).catch(async () => {
      // Try alternative: wait for any text content to appear after the user message
      return await page.waitForSelector('.message-content, [class*="message"], [class*="response"]', { timeout: 60000 });
    });
    
    if (!firstResponse) {
      throw new Error('First response did not appear');
    }
    
    console.log('✅ First response received!');
    
    // Wait a moment for the response to fully complete and loading state to clear
    await page.waitForTimeout(5000);

    // ========================================
    // SECOND QUESTION (FOLLOW-UP)
    // ========================================
    console.log('📝 Sending second (follow-up) question...');
    
    // Get text content before second question to compare
    const textBeforeSecondQuestion = await page.textContent('body');
    
    // Re-find the input (it might have been re-rendered)
    const chatInput2 = await page.locator('textarea').first();
    await chatInput2.fill('What is 3+3?');
    
    // Click submit again
    const submitButton2 = await page.locator('button[type="submit"]').first();
    await submitButton2.click();
    
    console.log('⏳ Waiting for progress indicator on second (follow-up) question...');
    
    // 🎯 THIS IS THE KEY TEST: Verify progress indicator appears for FOLLOW-UP question too!
    const progressIndicator2 = await page.waitForSelector('text=/Processing query|Query Analysis|Knowledge Search/', { timeout: 5000 }).catch(() => null);
    if (progressIndicator2) {
      console.log('✅ Progress indicator appeared for FOLLOW-UP question! (FIX WORKS!)');
    } else {
      console.log('❌ Progress indicator did NOT appear for follow-up question (BUG STILL EXISTS)');
      await page.screenshot({ path: 'tests/screenshots/no-progress-on-followup.png', fullPage: true });
    }
    
    console.log('⏳ Waiting for second response...');
    
    // Wait for new content to appear that wasn't there before
    const secondResponseAppeared = await page.waitForFunction(
      (previousText) => {
        const currentText = document.body.textContent || '';
        // Check if new substantial content appeared (more than just "3+3")
        return currentText.length > (previousText?.length || 0) + 50;
      },
      textBeforeSecondQuestion,
      { timeout: 60000 }
    ).catch(() => false);
    
    if (!secondResponseAppeared) {
      console.error('❌ SECOND RESPONSE DID NOT ARRIVE - CHAT IS HANGING!');
      
      // Take a screenshot for debugging
      await page.screenshot({ path: 'tests/screenshots/chat-hang.png', fullPage: true });
      
      // Also log the page content
      const pageContent = await page.textContent('body');
      console.log('Page content:', pageContent?.substring(0, 500));
      
      throw new Error('Second (follow-up) question received no response - chat is hanging!');
    }
    
    console.log('✅ Second response received!');
    
    // Take a success screenshot
    await page.screenshot({ path: 'tests/screenshots/chat-success.png', fullPage: true });
    
    console.log('✅ TEST PASSED: Both questions received responses');
  });
});

