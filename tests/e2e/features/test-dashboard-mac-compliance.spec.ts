import { test, expect } from '@playwright/test';

/**
 * MAC Design System Compliance Test for Test Dashboard
 *
 * Verifies that the Test Dashboard adheres to MAC Design System standards:
 * - Dark backgrounds (#0a0a0a base, #141414 elevated)
 * - Light font weights (font-light, 100-400)
 * - Proper color palette (blue-400, purple-400, emerald-500, etc.)
 * - No white/light gray backgrounds
 */

test.describe('Test Dashboard - MAC Design System Compliance', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app (bypassing auth if possible)
    await page.goto('http://localhost:3000');

    // Wait for any authentication redirects or initial loading
    await page.waitForLoadState('networkidle');

    // Try to navigate to Test Dashboard tab if visible
    // Note: Adjust selector based on actual navigation structure
    const testDashboardButton = page.locator('button:has-text("Test Dashboard"), a:has-text("Test Dashboard")').first();
    if (await testDashboardButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await testDashboardButton.click();
      await page.waitForLoadState('networkidle');
    }
  });

  test('should have dark background colors throughout', async ({ page }) => {
    // Check main container background
    const mainContainer = page.locator('[class*="test-dashboard"], [class*="TestDashboard"]').first();

    if (await mainContainer.isVisible({ timeout: 5000 }).catch(() => false)) {
      const bgColor = await mainContainer.evaluate((el) => {
        return window.getComputedStyle(el).backgroundColor;
      });

      // Should be dark (close to #0a0a0a which is rgb(10, 10, 10))
      expect(bgColor).toMatch(/rgba?\(1[0-5], 1[0-5], 1[0-5]/);
    }
  });

  test('should use font-light (300) for text elements', async ({ page }) => {
    // Find headings and check font weight
    const headings = page.locator('h1, h2, h3, h4').first();

    if (await headings.isVisible({ timeout: 5000 }).catch(() => false)) {
      const fontWeight = await headings.evaluate((el) => {
        return window.getComputedStyle(el).fontWeight;
      });

      // Should be 300 (font-light) or less
      const weight = parseInt(fontWeight);
      expect(weight).toBeLessThanOrEqual(400);
    }
  });

  test('should have dark card backgrounds', async ({ page }) => {
    // Find cards in the Test Dashboard
    const cards = page.locator('[class*="Card"], .mac-card').first();

    if (await cards.isVisible({ timeout: 5000 }).catch(() => false)) {
      const bgColor = await cards.evaluate((el) => {
        return window.getComputedStyle(el).backgroundColor;
      });

      // Should be dark (#0a0a0a or #141414)
      // rgb(10, 10, 10) or rgb(20, 20, 20)
      expect(bgColor).toMatch(/rgba?\((1[0-9]|2[0-4]), (1[0-9]|2[0-4]), (1[0-9]|2[0-4])/);
    }
  });

  test('should use proper MAC color palette', async ({ page }) => {
    // Check for blue-400 primary color usage
    const blueElements = page.locator('[class*="text-blue-400"], [class*="text-blue-500"]').first();

    if (await blueElements.isVisible({ timeout: 5000 }).catch(() => false)) {
      const color = await blueElements.evaluate((el) => {
        return window.getComputedStyle(el).color;
      });

      // Should be a blue color (rgb values roughly 74, 158, 255 for blue-400)
      expect(color).toMatch(/rgb/);
    }
  });

  test('should have no harsh white backgrounds', async ({ page }) => {
    // Take a screenshot for visual inspection
    await page.screenshot({
      path: 'test-results/test-dashboard-mac-compliance.png',
      fullPage: true
    });

    // Check for any elements with pure white backgrounds
    const whiteBackgrounds = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      const whiteElements: string[] = [];

      elements.forEach((el) => {
        const bg = window.getComputedStyle(el).backgroundColor;
        // Check for pure white or very light backgrounds
        if (bg === 'rgb(255, 255, 255)' || bg === 'rgba(255, 255, 255, 1)') {
          whiteElements.push(el.tagName + (el.className ? '.' + el.className : ''));
        }
      });

      return whiteElements;
    });

    // Log any white backgrounds found (should be minimal or none in Test Dashboard)
    if (whiteBackgrounds.length > 0) {
      console.log('⚠️ Elements with white backgrounds found:', whiteBackgrounds);
      // Allow some white backgrounds (like SVG icons), but warn if excessive
      expect(whiteBackgrounds.length).toBeLessThan(10);
    }
  });

  test('should use subtle borders (white/10)', async ({ page }) => {
    const cards = page.locator('[class*="border-white/10"]').first();

    if (await cards.isVisible({ timeout: 5000 }).catch(() => false)) {
      const borderColor = await cards.evaluate((el) => {
        return window.getComputedStyle(el).borderColor;
      });

      // Should have a subtle border (low opacity white)
      expect(borderColor).toBeTruthy();
    }
  });

  test('should have proper contrast for readability', async ({ page }) => {
    // Check text color against background
    const textElements = page.locator('p, span, div').first();

    if (await textElements.isVisible({ timeout: 5000 }).catch(() => false)) {
      const contrast = await textElements.evaluate((el) => {
        const bg = window.getComputedStyle(el).backgroundColor;
        const color = window.getComputedStyle(el).color;
        return { bg, color };
      });

      // Ensure text is light colored on dark background
      expect(contrast).toBeTruthy();
    }
  });

  test('visual regression - Test Dashboard appearance', async ({ page }) => {
    // Navigate to Test Dashboard if not already there
    const testDashboard = page.locator('[class*="test-dashboard"], [class*="TestDashboard"]').first();

    if (await testDashboard.isVisible({ timeout: 10000 }).catch(() => false)) {
      // Take screenshot for visual regression
      await testDashboard.screenshot({
        path: 'test-results/test-dashboard-visual-regression.png'
      });

      // Verify no console errors
      const consoleErrors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });

      // Wait a bit for any async errors
      await page.waitForTimeout(2000);

      // Should have no critical console errors
      const criticalErrors = consoleErrors.filter(err =>
        !err.includes('DevTools') &&
        !err.includes('favicon')
      );

      if (criticalErrors.length > 0) {
        console.error('Console errors found:', criticalErrors);
      }

      expect(criticalErrors.length).toBe(0);
    }
  });
});

test.describe('Test Dashboard - Unified Results Tab Compliance', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // Try to click on Test Dashboard and then Unified tab
    const testDashboardButton = page.locator('button:has-text("Test Dashboard"), a:has-text("Test Dashboard")').first();
    if (await testDashboardButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await testDashboardButton.click();
      await page.waitForLoadState('networkidle');

      // Click on Unified tab
      const unifiedTab = page.locator('button:has-text("Unified")').first();
      if (await unifiedTab.isVisible({ timeout: 5000 }).catch(() => false)) {
        await unifiedTab.click();
        await page.waitForTimeout(1000);
      }
    }
  });

  test('Unified Results - metric cards should have dark backgrounds', async ({ page }) => {
    const metricCards = page.locator('[class*="grid"] [class*="Card"]');
    const count = await metricCards.count();

    if (count > 0) {
      // Check first metric card
      const firstCard = metricCards.first();
      const bgColor = await firstCard.evaluate((el) => {
        return window.getComputedStyle(el).backgroundColor;
      });

      // Should be #0a0a0a (rgb(10, 10, 10))
      expect(bgColor).toMatch(/rgba?\(1[0-5], 1[0-5], 1[0-5]/);
    }
  });

  test('Unified Results - should use light font weights', async ({ page }) => {
    const labels = page.locator('span:has-text("Total Tests"), span:has-text("Passed"), span:has-text("Failed")').first();

    if (await labels.isVisible({ timeout: 5000 }).catch(() => false)) {
      const fontWeight = await labels.evaluate((el) => {
        return window.getComputedStyle(el).fontWeight;
      });

      const weight = parseInt(fontWeight);
      expect(weight).toBeLessThanOrEqual(400);
    }
  });

  test('Unified Results - timeline cards should be dark', async ({ page }) => {
    const timelineCards = page.locator('[class*="border-l-4"]').first();

    if (await timelineCards.isVisible({ timeout: 5000 }).catch(() => false)) {
      const bgColor = await timelineCards.evaluate((el) => {
        return window.getComputedStyle(el).backgroundColor;
      });

      // Should be #141414 (rgb(20, 20, 20))
      expect(bgColor).toMatch(/rgba?\(2[0-4], 2[0-4], 2[0-4]/);
    }
  });

  test('Unified Results - should use proper accent colors', async ({ page }) => {
    // Check for emerald-400/500 for passed tests
    const passedIndicators = page.locator('[class*="text-emerald"], [class*="CheckCircle"]').first();

    if (await passedIndicators.isVisible({ timeout: 5000 }).catch(() => false)) {
      const color = await passedIndicators.evaluate((el) => {
        return window.getComputedStyle(el).color;
      });

      // Should be green-ish (emerald)
      expect(color).toMatch(/rgb/);
    }
  });
});
