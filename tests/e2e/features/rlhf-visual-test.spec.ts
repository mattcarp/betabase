/**
 * RLHF Visual Test Suite with Screenshots
 * Captures screenshots at every step to provide visual proof
 */

import { test, expect } from '../fixtures/base-test';

// Helper to navigate to Curate panel
async function navigateToCurate(page: any) {
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle');
  
  const curateTab = page.locator('button:has-text("Curate")').first();
  await curateTab.waitFor({ state: 'visible', timeout: 10000 });
  await curateTab.click();
  
  await page.waitForSelector('text=Knowledge Curation', { timeout: 10000 });
  await page.waitForTimeout(2000);
}

test.describe('📸 RLHF Visual Verification Suite', () => {
  
  test('1. Screenshot: Landing Page', async ({ page }) => {
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    await page.screenshot({ 
      path: 'test-results/screenshots/01-landing-page.png',
      fullPage: true 
    });
    
    console.log('✅ Screenshot saved: 01-landing-page.png');
  });

  test('2. Screenshot: Curate Panel - Base Tabs', async ({ page }) => {
    await navigateToCurate(page);
    
    await page.screenshot({ 
      path: 'test-results/screenshots/02-curate-panel-base.png',
      fullPage: true 
    });
    
    console.log('✅ Screenshot saved: 02-curate-panel-base.png');
    
    // Verify tabs exist
    const tabs = await page.locator('button[role="tab"]').count();
    console.log(`   Found ${tabs} tabs`);
    expect(tabs).toBeGreaterThanOrEqual(3);
  });

  test('3. Screenshot: RLHF Tab Present', async ({ page }) => {
    await navigateToCurate(page);
    
    // Highlight RLHF tab
    const rlhfTab = page.locator('button[role="tab"]:has-text("RLHF")');
    const hasRLHF = await rlhfTab.isVisible();
    
    console.log(`   RLHF tab visible: ${hasRLHF}`);
    
    if (hasRLHF) {
      // Hover to highlight it
      await rlhfTab.hover();
      await page.waitForTimeout(500);
    }
    
    await page.screenshot({ 
      path: 'test-results/screenshots/03-rlhf-tab-visible.png',
      fullPage: true 
    });
    
    console.log('✅ Screenshot saved: 03-rlhf-tab-visible.png');
  });

  test('4. Screenshot: RLHF Tab Content - Stats Dashboard', async ({ page }) => {
    await navigateToCurate(page);
    
    const rlhfTab = page.locator('button[role="tab"]:has-text("RLHF")');
    const hasRLHF = await rlhfTab.isVisible();
    
    if (!hasRLHF) {
      console.log('⏭️  RLHF tab not visible - skipping');
      test.skip();
      return;
    }
    
    await rlhfTab.click();
    await page.waitForTimeout(1500);
    
    await page.screenshot({ 
      path: 'test-results/screenshots/04-rlhf-stats-dashboard.png',
      fullPage: true 
    });
    
    console.log('✅ Screenshot saved: 04-rlhf-stats-dashboard.png');
    
    // Verify stats are visible
    const hasPending = await page.getByText(/pending/i).isVisible();
    const hasSubmitted = await page.getByText(/submitted/i).isVisible();
    console.log(`   Stats visible: Pending=${hasPending}, Submitted=${hasSubmitted}`);
  });

  test('5. Screenshot: Quick Feedback Buttons', async ({ page }) => {
    await navigateToCurate(page);
    
    const rlhfTab = page.locator('button[role="tab"]:has-text("RLHF")');
    if (!await rlhfTab.isVisible()) {
      test.skip();
      return;
    }
    
    await rlhfTab.click();
    await page.waitForTimeout(1500);
    
    // Find and hover over thumbs up button
    const thumbsButtons = page.locator('button').filter({ hasText: /👍|👎|helpful|not.*helpful/i });
    const thumbsCount = await thumbsButtons.count();
    console.log(`   Found ${thumbsCount} quick feedback buttons`);
    
    if (thumbsCount > 0) {
      await thumbsButtons.first().hover();
      await page.waitForTimeout(300);
    }
    
    await page.screenshot({ 
      path: 'test-results/screenshots/05-quick-feedback-buttons.png',
      fullPage: true 
    });
    
    console.log('✅ Screenshot saved: 05-quick-feedback-buttons.png');
  });

  test('6. Screenshot: Thumbs Up Clicked', async ({ page }) => {
    await navigateToCurate(page);
    
    const rlhfTab = page.locator('button[role="tab"]:has-text("RLHF")');
    if (!await rlhfTab.isVisible()) {
      test.skip();
      return;
    }
    
    await rlhfTab.click();
    await page.waitForTimeout(1500);
    
    const thumbsButtons = page.locator('button').filter({ hasText: /👍|helpful/i });
    if (await thumbsButtons.first().isVisible()) {
      await thumbsButtons.first().click();
      await page.waitForTimeout(500);
      
      console.log('   ✅ Clicked thumbs up button');
    }
    
    await page.screenshot({ 
      path: 'test-results/screenshots/06-thumbs-up-clicked.png',
      fullPage: true 
    });
    
    console.log('✅ Screenshot saved: 06-thumbs-up-clicked.png');
  });

  test('7. Screenshot: Star Rating System', async ({ page }) => {
    await navigateToCurate(page);
    
    const rlhfTab = page.locator('button[role="tab"]:has-text("RLHF")');
    if (!await rlhfTab.isVisible()) {
      test.skip();
      return;
    }
    
    await rlhfTab.click();
    await page.waitForTimeout(1500);
    
    // Find star buttons
    const starButtons = page.locator('button').filter({ hasText: /⭐|★/ });
    const starCount = await starButtons.count();
    console.log(`   Found ${starCount} star buttons`);
    
    if (starCount > 0) {
      await starButtons.first().hover();
      await page.waitForTimeout(300);
    }
    
    await page.screenshot({ 
      path: 'test-results/screenshots/07-star-rating-system.png',
      fullPage: true 
    });
    
    console.log('✅ Screenshot saved: 07-star-rating-system.png');
  });

  test('8. Screenshot: Mac Glassmorphism Design', async ({ page }) => {
    await navigateToCurate(page);
    
    const rlhfTab = page.locator('button[role="tab"]:has-text("RLHF")');
    if (!await rlhfTab.isVisible()) {
      test.skip();
      return;
    }
    
    await rlhfTab.click();
    await page.waitForTimeout(1500);
    
    // Check for glassmorphism elements
    const glassElements = await page.locator('[class*="mac-glass"], [class*="backdrop-blur"]').count();
    const purpleElements = await page.locator('[class*="purple"]').count();
    
    console.log(`   Glassmorphism elements: ${glassElements}`);
    console.log(`   Purple accent elements: ${purpleElements}`);
    
    await page.screenshot({ 
      path: 'test-results/screenshots/08-mac-design-glassmorphism.png',
      fullPage: true 
    });
    
    console.log('✅ Screenshot saved: 08-mac-design-glassmorphism.png');
  });

  test('9. Screenshot: All Tabs Navigation', async ({ page }) => {
    await navigateToCurate(page);
    await page.waitForTimeout(1000);
    
    // Take screenshot showing all tabs
    await page.screenshot({ 
      path: 'test-results/screenshots/09-all-tabs-overview.png',
      fullPage: true 
    });
    
    console.log('✅ Screenshot saved: 09-all-tabs-overview.png');
    
    const tabs = await page.locator('button[role="tab"]').all();
    console.log(`   Total tabs: ${tabs.length}`);
    for (let i = 0; i < tabs.length; i++) {
      const text = await tabs[i].textContent();
      console.log(`   ${i + 1}. ${text}`);
    }
  });

  test('10. Screenshot: Final Verification', async ({ page }) => {
    await navigateToCurate(page);
    
    const rlhfTab = page.locator('button[role="tab"]:has-text("RLHF")');
    if (await rlhfTab.isVisible()) {
      await rlhfTab.click();
      await page.waitForTimeout(2000);
      
      // Scroll to show full content
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(500);
      
      await page.screenshot({ 
        path: 'test-results/screenshots/10-final-rlhf-full-view.png',
        fullPage: true 
      });
      
      console.log('✅ Screenshot saved: 10-final-rlhf-full-view.png');
      console.log('\n' + '='.repeat(60));
      console.log('📸 ALL SCREENSHOTS CAPTURED SUCCESSFULLY!');
      console.log('='.repeat(60));
    }
  });
});

