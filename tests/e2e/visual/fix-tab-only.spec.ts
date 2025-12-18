import { test, expect, navigateTo } from '../fixtures/base-test';

test.describe('Fix Tab Verification', () => {
  test.use({ failOnConsoleError: false });
  const screenshotDir = 'public/audit-results/verification-screenshots';

  test('Capture Fix Tab and Sub-tabs', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1080 });
    
    await navigateTo(page, '/');
    await page.waitForTimeout(3000);

    const fixTab = page.locator('button:has-text("Fix")').first();
    if (await fixTab.isVisible()) {
      await fixTab.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: `${screenshotDir}/full-fix-debugger.png` });

      const subTabs = [
        { name: 'Quick Fix', shot: 'full-fix-quick-fix' },
        { name: 'Test Generator', shot: 'full-fix-test-generator' },
        { name: 'Feedback Timeline', shot: 'full-fix-feedback-timeline' }
      ];

      for (const tab of subTabs) {
        const subTab = page.locator(`button:has-text("${tab.name}"), [role="tab"]:has-text("${tab.name}")`).first();
        if (await subTab.isVisible()) {
          await subTab.click();
          await page.waitForTimeout(2000);
          await page.screenshot({ path: `${screenshotDir}/${tab.shot}.png` });
          console.log(`Captured: ${tab.shot}`);
        }
      }
    }
  });
});
