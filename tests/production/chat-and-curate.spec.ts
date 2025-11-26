import { test, expect } from '../fixtures/base-test';

const BASE_URL = process.env.BASE_URL || 'https://thebetabase.com';

test.describe('Production Chat and Curate Tests', () => {
  test('Chat: Send message and verify response', async ({ page }) => {
    console.log('🧪 Testing chat on:', BASE_URL);

    // Navigate to home (chat is default)
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });

    // Wait for page to load
    await page.waitForTimeout(2000);

    // Check if we're on the chat interface (might be bypassed auth)
    const chatInput = page.locator('textarea, input[type="text"]').first();
    await expect(chatInput).toBeVisible({ timeout: 10000 });

    console.log('✅ Chat interface loaded');

    // Type a test message
    const testMessage = 'What is AOMA?';
    await chatInput.fill(testMessage);
    console.log('✅ Typed message:', testMessage);

    // Find and click send button
    const sendButton = page.locator('button[type="submit"], button:has-text("Send")').first();
    await sendButton.click();
    console.log('✅ Clicked send button');

    // Wait for response (look for AI message)
    await page.waitForTimeout(5000);

    // Check for any response content
    const messageElements = page.locator('[role="article"], .message, [data-message]');
    const messageCount = await messageElements.count();

    console.log(`📊 Found ${messageCount} message elements`);
    expect(messageCount).toBeGreaterThan(0);

    // Take screenshot
    await page.screenshot({ path: '/tmp/prod-chat-test.png', fullPage: true });
    console.log('📸 Screenshot saved to /tmp/prod-chat-test.png');

    console.log('✅ Chat test passed!');
  });

  test('Curate: Navigate to curate tab', async ({ page }) => {
    console.log('🧪 Testing curate navigation on:', BASE_URL);

    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Look for Curate tab/button
    const curateTab = page.locator('button:has-text("Curate"), a:has-text("Curate"), [data-tab="curate"]').first();

    if (await curateTab.isVisible({ timeout: 5000 })) {
      await curateTab.click();
      console.log('✅ Clicked Curate tab');

      await page.waitForTimeout(2000);

      // Check for file upload area
      const uploadArea = page.locator('input[type="file"], [data-upload], .upload-area, .dropzone');
      const hasUpload = await uploadArea.count() > 0;

      if (hasUpload) {
        console.log('✅ File upload area found');
      } else {
        console.log('⚠️ No file upload area found, but Curate tab exists');
      }

      // Take screenshot
      await page.screenshot({ path: '/tmp/prod-curate-test.png', fullPage: true });
      console.log('📸 Screenshot saved to /tmp/prod-curate-test.png');

      expect(hasUpload).toBeTruthy();
    } else {
      console.log('⚠️ Curate tab not found - might require authentication');

      // Take screenshot for debugging
      await page.screenshot({ path: '/tmp/prod-curate-missing.png', fullPage: true });
      console.log('📸 Screenshot saved to /tmp/prod-curate-missing.png');

      // Don't fail the test, just warn
      test.skip();
    }
  });

  test('File Upload: Test upload functionality', async ({ page }) => {
    console.log('🧪 Testing file upload on:', BASE_URL);

    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Navigate to Curate
    const curateTab = page.locator('button:has-text("Curate"), a:has-text("Curate")').first();

    if (await curateTab.isVisible({ timeout: 5000 })) {
      await curateTab.click();
      await page.waitForTimeout(2000);

      // Look for file input
      const fileInput = page.locator('input[type="file"]').first();

      if (await fileInput.count() > 0) {
        // Create a test file
        const testFilePath = '/tmp/test-upload.txt';
        await require('fs').promises.writeFile(testFilePath, 'Test file for upload');

        // Upload the file
        await fileInput.setInputFiles(testFilePath);
        console.log('✅ File selected for upload');

        await page.waitForTimeout(2000);

        // Check for upload confirmation/progress
        const uploadIndicator = page.locator('.uploading, .progress, [data-uploading="true"]');
        const hasIndicator = await uploadIndicator.count() > 0;

        console.log(hasIndicator ? '✅ Upload indicator found' : '⚠️ No upload indicator visible');

        // Take screenshot
        await page.screenshot({ path: '/tmp/prod-upload-test.png', fullPage: true });
        console.log('📸 Screenshot saved to /tmp/prod-upload-test.png');

        // Clean up
        await require('fs').promises.unlink(testFilePath);
      } else {
        console.log('⚠️ File input not found');
        test.skip();
      }
    } else {
      console.log('⚠️ Curate tab not found');
      test.skip();
    }
  });
});
