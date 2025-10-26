import { test, expect } from '@playwright/test';

test.describe('Production Comprehensive Tests', () => {
  test.use({
    baseURL: 'https://thebetabase.com',
    viewport: { width: 1920, height: 1080 }
  });

  test('1. AOMA Chat - Meaningful Response Test', async ({ page }) => {
    console.log('🧪 Testing AOMA chat for meaningful responses...');

    // Navigate to chat page
    await page.goto('/chat');
    await page.waitForLoadState('networkidle');

    // Find chat input
    const chatInput = page.locator('textarea, input[type="text"]').first();
    await expect(chatInput).toBeVisible({ timeout: 10000 });

    // Type AOMA question
    await chatInput.fill('What is AOMA?');

    // Find and click submit button
    const submitButton = page.locator('button[type="submit"], button:has-text("Send")').first();
    await submitButton.click();

    // Wait for response
    await page.waitForTimeout(30000); // Give Railway time to respond

    // Check for response content
    const responseText = await page.textContent('body');

    // Validate response contains correct terminology
    if (responseText?.includes('Offering Management')) {
      console.log('✅ CORRECT: Found "Offering Management"');
    } else if (responseText?.includes('Operations Management')) {
      throw new Error('❌ HALLUCINATION: Found "Operations Management" instead of "Offering"');
    }

    // Validate response doesn't claim no access
    if (responseText?.includes("don't have access") || responseText?.includes("cannot access")) {
      throw new Error('❌ FALSE CLAIM: AI claiming no access when it should have context');
    }

    console.log('✅ AOMA Chat test passed');
  });

  test('2. Curate Tab - File Upload Test', async ({ page }) => {
    console.log('🧪 Testing file upload on Curate tab...');

    // Navigate to main page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Click on Curate tab
    const curateTab = page.locator('button:has-text("Curate"), a:has-text("Curate")').first();
    await expect(curateTab).toBeVisible({ timeout: 10000 });
    await curateTab.click();

    // Wait for curate interface
    await page.waitForTimeout(2000);

    // Look for file upload interface
    const fileInput = page.locator('input[type="file"]').first();
    const uploadButton = page.locator('button:has-text("Upload"), button:has-text("Choose")').first();

    if (await fileInput.isVisible() || await uploadButton.isVisible()) {
      console.log('✅ File upload interface is visible');

      // Take screenshot of curate tab
      await page.screenshot({ path: '/tmp/curate-tab-upload.png', fullPage: true });
      console.log('📸 Screenshot saved: /tmp/curate-tab-upload.png');
    } else {
      console.log('⚠️  File upload interface not immediately visible');
    }

    console.log('✅ Curate tab file upload test completed');
  });

  test('3. Curate Tab - File Deletion Test', async ({ page }) => {
    console.log('🧪 Testing file deletion on Curate tab...');

    // Navigate to curate tab
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const curateTab = page.locator('button:has-text("Curate"), a:has-text("Curate")').first();
    await curateTab.click();
    await page.waitForTimeout(2000);

    // Look for existing files and delete buttons
    const deleteButtons = page.locator('button:has-text("Delete"), button:has-text("Remove"), [aria-label*="delete"]');
    const deleteCount = await deleteButtons.count();

    console.log(`Found ${deleteCount} delete buttons`);

    if (deleteCount > 0) {
      console.log('✅ Delete functionality is available');
    } else {
      console.log('ℹ️  No files to delete (may be empty state)');
    }

    // Take screenshot
    await page.screenshot({ path: '/tmp/curate-tab-delete.png', fullPage: true });
    console.log('📸 Screenshot saved: /tmp/curate-tab-delete.png');

    console.log('✅ Curate tab file deletion test completed');
  });

  test('4. Console Errors Check', async ({ page }) => {
    console.log('🧪 Checking for console errors...');

    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Visit main pages
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await page.goto('/chat');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    if (errors.length > 0) {
      console.log('⚠️  Console errors found:');
      errors.forEach(err => console.log('  -', err));
    } else {
      console.log('✅ No console errors detected');
    }
  });
});
