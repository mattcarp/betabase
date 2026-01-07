import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 1920, height: 2000 } });

test('capture full interface screenshots', async ({ page }) => {
  // 1. Capture Homepage
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'test-results/demo-homepage-large.png' });
  console.log('✅ Homepage screenshot saved');

  // 2. Navigate to Curate
  const curateButton = page.locator('button:has-text("Curate"), a:has-text("Curate")').first();
  await curateButton.click();
  await page.waitForTimeout(2000);

  // 3. Try to click RLHF tab specifically
  const rlhfTab = page.locator('button:has-text("RLHF")').first();
  if (await rlhfTab.isVisible()) {
    await rlhfTab.click();
    await page.waitForTimeout(2000);
    
    // Capture RLHF Feedback (Default)
    await page.screenshot({ path: 'test-results/demo-rlhf-feedback.png' });
    console.log('✅ RLHF Feedback screenshot saved');

    // Click Learning Curve
    const learningTab = page.locator('button:has-text("Learning Curve")').first();
    if (await learningTab.isVisible()) {
      await learningTab.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'test-results/demo-rlhf-learning.png' });
      console.log('✅ Learning Curve screenshot saved');
    }
  } else {
    await page.screenshot({ path: 'test-results/demo-curate-main.png' });
    console.log('✅ Curate main screenshot saved');
  }
});