import { test, expect, navigateTo } from '../fixtures/base-test';

test.describe('Comprehensive Verification - Fiona Fixes Full App', () => {
  test.use({ failOnConsoleError: false });

  const screenshotDir = 'public/audit-results/verification-screenshots';

  test('Capture Every Single Panel and Tab', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1080 }); // Taller viewport for long lists
    
    // Helper to take a screenshot with a specific name
    const takeShot = async (name: string) => {
      await page.waitForTimeout(1000); // Wait for animations
      await page.screenshot({ path: `${screenshotDir}/${name}.png` });
      console.log(`Captured: ${name}`);
    };

    // 1. Landing / Chat
    await navigateTo(page, '/');
    await page.waitForTimeout(3000);
    await takeShot('full-chat-landing');

    // 2. HUD
    const hudTab = page.locator('button:has-text("HUD")').first();
    if (await hudTab.isVisible()) {
      await hudTab.click();
      await takeShot('full-hud-launcher');
    }

    // 3. Test Tab & Sub-tabs
    const testTab = page.locator('button:has-text("Test")').first();
    if (await testTab.isVisible()) {
      await testTab.click();
      await page.waitForTimeout(1000);
      await takeShot('full-test-dashboard');

      const subTabs = ['Historical', 'RLHF Tests', 'Impact Metrics', 'Live Monitor'];
      for (const tab of subTabs) {
        const subTab = page.locator(`button:has-text("${tab}"), [role="tab"]:has-text("${tab}")`).first();
        if (await subTab.isVisible()) {
          await subTab.click();
          await takeShot(`full-test-${tab.toLowerCase().replace(' ', '-')}`);
        }
      }
    }

    // 4. Fix Tab & Sub-tabs
    const fixTab = page.locator('button:has-text("Fix")').first();
    if (await fixTab.isVisible()) {
      await fixTab.click();
      await page.waitForTimeout(1000);
      await takeShot('full-fix-debugger');

      const subTabs = ['Quick Fix', 'Test Generator', 'Feedback Timeline'];
      for (const tab of subTabs) {
        const subTab = page.locator(`button:has-text("${tab}"), [role="tab"]:has-text("${tab}")`).first();
        if (await subTab.isVisible()) {
          await subTab.click();
          await takeShot(`full-fix-${tab.toLowerCase().replace(' ', '-')}`);
        }
      }
    }

    // 5. Curate Tab & ALL Sub-tabs
    const curateTab = page.locator('button:has-text("Curate")').first();
    if (await curateTab.isVisible()) {
      await curateTab.click();
      await page.waitForTimeout(1000);
      await takeShot('full-curate-overview');

      const curateSubTabs = ['Queue', 'Files', 'Upload', 'Info', 'RLHF', 'Dedupe', 'Insights'];
      for (const tab of curateSubTabs) {
        const subTab = page.locator(`button:has-text("${tab}")`).first();
        if (await subTab.isVisible()) {
          await subTab.click();
          await page.waitForTimeout(1000);
          await takeShot(`full-curate-${tab.toLowerCase()}`);

          // If we are in RLHF sub-tab, click its own sub-sub-tabs
          if (tab === 'RLHF') {
            const rlhfSubTabs = ['Feedback', 'Learning Curve', 'Datasets', 'Fine-Tuning', 'Model Registry'];
            for (const rTab of rlhfSubTabs) {
              const rSubTab = page.locator(`button:has-text("${rTab}")`).first();
              if (await rSubTab.isVisible()) {
                await rSubTab.click();
                await takeShot(`full-curate-rlhf-${rTab.toLowerCase().replace(' ', '-')}`);
              }
            }
          }
        }
      }
    }

    // 6. External Pages
    const externalPages = [
      { name: 'performance', url: '/performance' },
      { name: 'style-guide', url: '/style-guide' },
      { name: 'self-healing', url: '/self-healing' }
    ];

    for (const p of externalPages) {
      try {
        await navigateTo(page, p.url);
        await page.waitForTimeout(2000);
        await takeShot(`full-page-${p.name}`);
      } catch (e) {
        console.log(`Could not navigate to ${p.url}`);
      }
    }
  });
});
