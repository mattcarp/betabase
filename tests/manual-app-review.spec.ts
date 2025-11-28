import { test, expect } from '@playwright/test';

test('Manual app review - test all tabs and UI', async ({ page }) => {
  const observations: string[] = [];

  // Capture console errors
  const consoleErrors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
      console.log('[CONSOLE ERROR]', msg.text());
    }
  });

  console.log('\n=== Starting App Review ===\n');
  observations.push('Starting app review at ' + new Date().toISOString());

  // Navigate to app
  console.log('1. Navigating to http://localhost:3000...');
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(3000);
  observations.push('App loaded successfully');

  // Take screenshot of initial state
  await page.screenshot({ path: 'screenshots/app-review-initial.png', fullPage: true });
  console.log('   Screenshot saved: app-review-initial.png');

  // Check for visible tabs/navigation
  console.log('\n2. Checking visible tabs and navigation...');
  const tabs = await page.locator('[role="tab"], button, a').allTextContents();
  console.log(`   Found ${tabs.length} interactive elements`);
  observations.push(`Found ${tabs.length} interactive elements: ${tabs.slice(0, 10).join(', ')}`);

  // Check main chat interface
  console.log('\n3. Checking chat interface...');
  const chatInput = page.locator('textarea, input[type="text"]').first();
  const chatInputVisible = await chatInput.isVisible().catch(() => false);
  console.log(`   Chat input visible: ${chatInputVisible}`);
  observations.push(`Chat input visible: ${chatInputVisible}`);

  if (chatInputVisible) {
    await page.screenshot({ path: 'screenshots/app-review-chat.png', fullPage: true });
    console.log('   Screenshot saved: app-review-chat.png');
  }

  // Try to send a test message
  if (chatInputVisible) {
    console.log('\n4. Testing chat functionality...');
    observations.push('Testing chat with simple query');

    await chatInput.fill('Hello, this is a test message');
    await page.waitForTimeout(500);

    // Look for send button
    const sendButton = page.locator('button').filter({ hasText: /send|submit/i }).first();
    const sendButtonVisible = await sendButton.isVisible().catch(() => false);

    if (sendButtonVisible) {
      console.log('   Clicking send button...');
      await sendButton.click();
      await page.waitForTimeout(5000); // Wait for response

      // Check for response
      const messages = await page.locator('[data-testid*="message"], [class*="message"]').count();
      console.log(`   Found ${messages} messages after sending`);
      observations.push(`Messages after sending: ${messages}`);

      await page.screenshot({ path: 'screenshots/app-review-after-message.png', fullPage: true });
      console.log('   Screenshot saved: app-review-after-message.png');
    }
  }

  // Check for any obvious UI issues
  console.log('\n5. Checking for UI issues...');
  const body = await page.locator('body').evaluate(el => {
    const styles = window.getComputedStyle(el);
    return {
      backgroundColor: styles.backgroundColor,
      color: styles.color,
      fontFamily: styles.fontFamily
    };
  });
  console.log('   Body styles:', body);
  observations.push(`Body styles: bg=${body.backgroundColor}, color=${body.color}`);

  // Final checks
  console.log('\n6. Final checks...');
  console.log(`   Console errors: ${consoleErrors.length}`);
  if (consoleErrors.length > 0) {
    console.log('   Errors:', consoleErrors.slice(0, 5));
    observations.push(`Console errors found: ${consoleErrors.length}`);
  } else {
    observations.push('No console errors');
  }

  // Save observations
  console.log('\n=== Review Summary ===');
  observations.forEach((obs, i) => console.log(`${i + 1}. ${obs}`));

  console.log('\n=== Screenshots saved ===');
  console.log('- screenshots/app-review-initial.png');
  console.log('- screenshots/app-review-chat.png');
  console.log('- screenshots/app-review-after-message.png');
});
