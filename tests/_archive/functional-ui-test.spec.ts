import {  test, expect  } from './fixtures/base-test';

test('Functional UI test - tabs and chat', async ({ page }) => {
  test.setTimeout(90000);

  console.log('\n=== Testing App Functionality ===\n');

  // Navigate
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  console.log('✓ App loaded');

  // Test Tab Navigation
  console.log('\n1. Testing tab navigation...');

  const chatTab = page.locator('button:has-text("Chat")').first();
  if (await chatTab.isVisible()) {
    await chatTab.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/tab-chat.png' });
    console.log('   ✓ Chat tab clicked');
  }

  const hudTab = page.locator('button:has-text("HUD")').first();
  if (await hudTab.isVisible()) {
    await hudTab.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/tab-hud.png' });
    console.log('   ✓ HUD tab clicked');
  }

  const testTab = page.locator('button:has-text("Test")').first();
  if (await testTab.isVisible()) {
    await testTab.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/tab-test.png' });
    console.log('   ✓ Test tab clicked');
  }

  const fixTab = page.locator('button:has-text("Fix")').first();
  if (await fixTab.isVisible()) {
    await fixTab.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/tab-fix.png' });
    console.log('   ✓ Fix tab clicked');
  }

  const curateTab = page.locator('button:has-text("Curate")').first();
  if (await curateTab.isVisible()) {
    await curateTab.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'screenshots/tab-curate.png' });
    console.log('   ✓ Curate tab clicked');
  }

  // Go back to Chat tab
  await chatTab.click();
  await page.waitForTimeout(1000);
  console.log('   ✓ Returned to Chat tab');

  // Test Chat Functionality
  console.log('\n2. Testing chat functionality...');

  const chatInput = page.locator('textarea[placeholder*="Ask me"]').first();
  await chatInput.waitFor({ state: 'visible', timeout: 5000 });
  console.log('   ✓ Chat input found');

  await chatInput.fill('What is the difference between Unified Submission Tool and Asset Submission Tool?');
  await page.waitForTimeout(500);
  console.log('   ✓ Text entered');

  // Find and click send button
  const sendButton = page.locator('button[type="submit"]').last();
  await sendButton.click();
  console.log('   ✓ Send button clicked');

  // Wait for AI response
  await page.waitForTimeout(10000);
  console.log('   ✓ Waiting for response...');

  await page.screenshot({ path: 'screenshots/chat-response.png', fullPage: true });
  console.log('   ✓ Screenshot after response');

  // Check if response appeared
  const messages = await page.locator('[data-testid*="message"], [class*="message"]').count();
  console.log(`   Messages visible: ${messages}`);

  // Check for any visible text that looks like an AI response
  const responseText = await page.locator('div').filter({ hasText: /submission|tool|asset/i }).first().textContent().catch(() => '');
  if (responseText) {
    console.log(`   ✓ Response detected: ${responseText.substring(0, 100)}...`);
  }

  console.log('\n=== Test Complete ===');
});
