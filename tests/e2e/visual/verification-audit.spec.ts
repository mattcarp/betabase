import { test, expect, navigateTo } from '../fixtures/base-test';

test.describe('Verification Audit - Fiona Fixes', () => {
  test.use({ failOnConsoleError: false });

  const screenshotDir = 'audit-results/verification-screenshots';

  test.beforeAll(async () => {
    const fs = require('fs');
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }
  });

  test('Capture After Shots', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    
    // 1. Chat Page & Contrast Fix
    await navigateTo(page, '/');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: `${screenshotDir}/after-chat-page.png` });
    
    // 2. HUD Launcher & Brain Icon Fix
    const hudTab = page.locator('button:has-text("HUD")').first();
    if (await hudTab.isVisible()) {
      await hudTab.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: `${screenshotDir}/after-hud-launcher.png` });
    }

    // 3. Test Dashboard & Hex Color Fix
    const testTab = page.locator('button:has-text("Test")').first();
    if (await testTab.isVisible()) {
      await testTab.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: `${screenshotDir}/after-test-dashboard.png` });
      
      // Historical Tests sub-tab
      const histTab = page.locator('button:has-text("Historical")').first();
      if (await histTab.isVisible()) {
        await histTab.click();
        await page.waitForTimeout(2000);
        await page.screenshot({ path: `${screenshotDir}/after-historical-tests.png` });
      }
    }

    // 4. Curate Tab & Brain Icon Fix
    const curateTab = page.locator('button:has-text("Curate")').first();
    if (await curateTab.isVisible()) {
      await curateTab.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: `${screenshotDir}/after-curate-tab.png` });
      
      // RLHF sub-tab
      const rlhfTab = page.locator('button:has-text("RLHF")').first();
      if (await rlhfTab.isVisible()) {
        await rlhfTab.click();
        await page.waitForTimeout(2000);
        await page.screenshot({ path: `${screenshotDir}/after-rlhf-tab.png` });
      }
      
      // Insights sub-tab (Typography weight test)
      const insightsTab = page.locator('button:has-text("Insights")').first();
      if (await insightsTab.isVisible()) {
        await insightsTab.click();
        await page.waitForTimeout(2000);
        await page.screenshot({ path: `${screenshotDir}/after-insights-tab.png` });
      }
    }

    // 5. Fix Tab & Brain Icon Fix
    const fixTab = page.locator('button:has-text("Fix")').first();
    if (await fixTab.isVisible()) {
      await fixTab.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: `${screenshotDir}/after-fix-tab.png` });
    }
  });
});
