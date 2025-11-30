import { test, expect, navigateTo } from '../fixtures/base-test';
import path from 'path';

/**
 * Comprehensive Visual UX/UI Audit
 *
 * This test suite captures screenshots of all major pages and states
 * for manual visual analysis and automated regression testing.
 */

test.describe('Visual UX/UI Audit @visual-audit', () => {
  // Disable console error checking for this audit - we're capturing the current state
  test.use({ failOnConsoleError: false });

  const screenshotDir = '/tmp/siam-visual-audit';

  test.beforeEach(async ({ page }) => {
    // Start at home page - will show login or chat depending on auth state
    await navigateTo(page, '/');
    await page.waitForTimeout(2000); // Let app settle
  });

  test('01 - Chat Page (Landing)', async ({ page }) => {
    // Navigate to chat (may require clicking through login)
    await navigateTo(page, '/');

    // Wait for either login form or chat interface
    const hasLogin = await page.locator('input[type="email"]').isVisible().catch(() => false);

    if (hasLogin) {
      console.log('Login page detected - capturing auth state');
      await page.screenshot({
        path: `${screenshotDir}/00-login-page.png`,
        fullPage: true,
      });
    }

    // Check for chat interface
    const chatTextarea = page.locator('textarea[placeholder*="Ask"], textarea[placeholder*="message"]').first();
    const isChatVisible = await chatTextarea.isVisible().catch(() => false);

    if (isChatVisible) {
      // Desktop view
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.screenshot({
        path: `${screenshotDir}/01-chat-desktop.png`,
        fullPage: true,
      });

      // Tablet view
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.screenshot({
        path: `${screenshotDir}/01-chat-tablet.png`,
        fullPage: true,
      });

      // Mobile view
      await page.setViewportSize({ width: 375, height: 667 });
      await page.screenshot({
        path: `${screenshotDir}/01-chat-mobile.png`,
        fullPage: true,
      });

      console.log('Chat page screenshots captured (desktop/tablet/mobile)');
    } else {
      console.log('Chat interface not accessible - authentication may be required');
    }
  });

  test('02 - HUD Page', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    // Navigate to home first (SPA limitation - no direct deep links)
    await navigateTo(page, '/');
    await page.waitForTimeout(1000);

    // Look for navigation menu to click on HUD
    const hudLink = page.locator('a[href="/hud"], button:has-text("HUD"), nav a:has-text("HUD")').first();
    const hasHudLink = await hudLink.isVisible().catch(() => false);

    if (hasHudLink) {
      await hudLink.click();
      await page.waitForTimeout(2000);

      await page.screenshot({
        path: `${screenshotDir}/02-hud-desktop.png`,
        fullPage: true,
      });

      // Mobile view
      await page.setViewportSize({ width: 375, height: 667 });
      await page.screenshot({
        path: `${screenshotDir}/02-hud-mobile.png`,
        fullPage: true,
      });

      console.log('HUD page screenshots captured');
    } else {
      console.log('HUD link not found in navigation');
      await page.screenshot({
        path: `${screenshotDir}/02-hud-no-nav-link.png`,
        fullPage: true,
      });
    }
  });

  test('03 - Test Page (Self-Healing Tab)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    // Navigate to home first (SPA limitation)
    await navigateTo(page, '/');
    await page.waitForTimeout(1000);

    // Click on Test link in navigation
    const testLink = page.locator('a[href="/test"], button:has-text("Test"), nav a:has-text("Test")').first();
    const hasTestLink = await testLink.isVisible().catch(() => false);

    if (hasTestLink) {
      await testLink.click();
      await page.waitForTimeout(2000);

      // Look for Self-Healing tab
      const selfHealingTab = page.locator('text="Self-Healing", [role="tab"]:has-text("Self-Healing")').first();
      const hasTab = await selfHealingTab.isVisible().catch(() => false);

      if (hasTab) {
        await selfHealingTab.click();
        await page.waitForTimeout(1000);
      }

      await page.screenshot({
        path: `${screenshotDir}/03-test-page-desktop.png`,
        fullPage: true,
      });

      // Mobile view
      await page.setViewportSize({ width: 375, height: 667 });
      await page.screenshot({
        path: `${screenshotDir}/03-test-page-mobile.png`,
        fullPage: true,
      });

      console.log('Test page screenshots captured');
    } else {
      console.log('Test link not found in navigation');
    }
  });

  test('04 - Fix Page', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    // Navigate to home first (SPA limitation)
    await navigateTo(page, '/');
    await page.waitForTimeout(1000);

    // Click on Fix link in navigation
    const fixLink = page.locator('a[href="/fix"], button:has-text("Fix"), nav a:has-text("Fix")').first();
    const hasFixLink = await fixLink.isVisible().catch(() => false);

    if (hasFixLink) {
      await fixLink.click();
      await page.waitForTimeout(2000);

      await page.screenshot({
        path: `${screenshotDir}/04-fix-page-desktop.png`,
        fullPage: true,
      });

      // Mobile view
      await page.setViewportSize({ width: 375, height: 667 });
      await page.screenshot({
        path: `${screenshotDir}/04-fix-page-mobile.png`,
        fullPage: true,
      });

      console.log('Fix page screenshots captured');
    } else {
      console.log('Fix link not found in navigation');
    }
  });

  test('05 - Curate Page', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    // Navigate to home first (SPA limitation)
    await navigateTo(page, '/');
    await page.waitForTimeout(1000);

    // Click on Curate link in navigation
    const curateLink = page.locator('a[href="/curate"], button:has-text("Curate"), nav a:has-text("Curate")').first();
    const hasCurateLink = await curateLink.isVisible().catch(() => false);

    if (hasCurateLink) {
      await curateLink.click();
      await page.waitForTimeout(2000);

      await page.screenshot({
        path: `${screenshotDir}/05-curate-page-desktop.png`,
        fullPage: true,
      });

      // Mobile view
      await page.setViewportSize({ width: 375, height: 667 });
      await page.screenshot({
        path: `${screenshotDir}/05-curate-page-mobile.png`,
        fullPage: true,
      });

      console.log('Curate page screenshots captured');
    } else {
      console.log('Curate link not found in navigation');
    }
  });

  test('06 - Interactive States Analysis', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await navigateTo(page, '/');
    await page.waitForTimeout(2000);

    // Capture all buttons in their default state
    const buttons = page.locator('button:visible');
    const buttonCount = await buttons.count();

    console.log(`Found ${buttonCount} visible buttons`);

    await page.screenshot({
      path: `${screenshotDir}/06-buttons-default-state.png`,
      fullPage: true,
    });

    // Try to capture hover states on first few buttons
    if (buttonCount > 0) {
      const firstButton = buttons.first();
      await firstButton.hover();
      await page.waitForTimeout(500);
      await page.screenshot({
        path: `${screenshotDir}/06-button-hover-state.png`,
        fullPage: true,
      });
    }

    // Capture input states
    const inputs = page.locator('input:visible, textarea:visible');
    const inputCount = await inputs.count();

    if (inputCount > 0) {
      const firstInput = inputs.first();
      await firstInput.click();
      await page.waitForTimeout(500);
      await page.screenshot({
        path: `${screenshotDir}/06-input-focus-state.png`,
        fullPage: true,
      });
    }
  });

  test('07 - Color and Contrast Analysis', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await navigateTo(page, '/');
    await page.waitForTimeout(2000);

    // Extract computed styles for analysis
    const colorAnalysis = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('*:not(script):not(style)'));
      const colorData: Array<{
        tag: string;
        background: string;
        color: string;
        fontSize: string;
        selector: string;
      }> = [];

      elements.slice(0, 100).forEach(el => {
        const styles = window.getComputedStyle(el);
        const bg = styles.backgroundColor;
        const fg = styles.color;
        const fs = styles.fontSize;

        // Get a useful selector
        const selector = el.id ? `#${el.id}` :
                        el.className ? `.${Array.from(el.classList).join('.')}` :
                        el.tagName.toLowerCase();

        if (bg !== 'rgba(0, 0, 0, 0)' || fg !== 'rgb(0, 0, 0)') {
          colorData.push({
            tag: el.tagName.toLowerCase(),
            background: bg,
            color: fg,
            fontSize: fs,
            selector: selector.substring(0, 50),
          });
        }
      });

      return colorData;
    });

    console.log('Color analysis captured:', JSON.stringify(colorAnalysis.slice(0, 10), null, 2));

    // Calculate contrast ratios (basic check)
    const contrastIssues = await page.evaluate(() => {
      function getLuminance(r: number, g: number, b: number) {
        const [rs, gs, bs] = [r, g, b].map(c => {
          c = c / 255;
          return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
      }

      function getContrastRatio(l1: number, l2: number) {
        const lighter = Math.max(l1, l2);
        const darker = Math.min(l1, l2);
        return (lighter + 0.05) / (darker + 0.05);
      }

      function parseRgb(rgb: string): [number, number, number] | null {
        const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (!match) return null;
        return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];
      }

      const textElements = Array.from(document.querySelectorAll('p, span, h1, h2, h3, h4, h5, h6, button, a, label'));
      const issues: string[] = [];

      textElements.slice(0, 50).forEach(el => {
        const styles = window.getComputedStyle(el);
        const bg = parseRgb(styles.backgroundColor);
        const fg = parseRgb(styles.color);

        if (bg && fg) {
          const bgLum = getLuminance(bg[0], bg[1], bg[2]);
          const fgLum = getLuminance(fg[0], fg[1], fg[2]);
          const ratio = getContrastRatio(bgLum, fgLum);

          if (ratio < 4.5) {
            issues.push(`Low contrast ${ratio.toFixed(2)}:1 on ${el.tagName}`);
          }
        }
      });

      return issues;
    });

    if (contrastIssues.length > 0) {
      console.log('Contrast issues found:', contrastIssues.slice(0, 10));
    }
  });

  test('08 - Spacing and Layout Analysis', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await navigateTo(page, '/');
    await page.waitForTimeout(2000);

    // Extract spacing values and check 8px grid compliance
    const spacingAnalysis = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('*:not(script):not(style)'));
      const spacingData: Array<{
        tag: string;
        margin: string;
        padding: string;
        violations: string[];
      }> = [];

      elements.slice(0, 100).forEach(el => {
        const styles = window.getComputedStyle(el);
        const margins = [
          parseInt(styles.marginTop),
          parseInt(styles.marginRight),
          parseInt(styles.marginBottom),
          parseInt(styles.marginLeft),
        ];
        const paddings = [
          parseInt(styles.paddingTop),
          parseInt(styles.paddingRight),
          parseInt(styles.paddingBottom),
          parseInt(styles.paddingLeft),
        ];

        // Check for 8px grid violations
        const violations: string[] = [];
        [...margins, ...paddings].forEach((val, i) => {
          if (val > 0 && val % 8 !== 0) {
            const prop = i < 4 ? 'margin' : 'padding';
            violations.push(`${prop}: ${val}px (not multiple of 8)`);
          }
        });

        if (violations.length > 0 || margins.some(m => m > 0) || paddings.some(p => p > 0)) {
          spacingData.push({
            tag: el.tagName.toLowerCase(),
            margin: margins.join(' '),
            padding: paddings.join(' '),
            violations,
          });
        }
      });

      return spacingData;
    });

    const violators = spacingAnalysis.filter(s => s.violations.length > 0);
    if (violators.length > 0) {
      console.log('8px grid violations found:', violators.length);
      console.log('Examples:', JSON.stringify(violators.slice(0, 5), null, 2));
    }

    console.log('Spacing analysis complete');
  });

  test('09 - Generate Comprehensive Report', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await navigateTo(page, '/');
    await page.waitForTimeout(2000);

    // Generate comprehensive audit data
    const auditData = await page.evaluate(() => {
      const report: any = {
        timestamp: new Date().toISOString(),
        url: window.location.href,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
        },
        issues: {
          critical: [],
          high: [],
          medium: [],
          low: [],
        },
        metrics: {
          totalElements: document.querySelectorAll('*').length,
          totalButtons: document.querySelectorAll('button').length,
          totalLinks: document.querySelectorAll('a').length,
          totalInputs: document.querySelectorAll('input, textarea, select').length,
        },
      };

      // Check for missing alt text on images
      const images = Array.from(document.querySelectorAll('img'));
      images.forEach(img => {
        if (!img.alt) {
          report.issues.critical.push({
            type: 'accessibility',
            element: 'img',
            issue: 'Missing alt text',
            selector: img.src.substring(0, 50),
          });
        }
      });

      // Check for proper heading hierarchy
      const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
      let prevLevel = 0;
      headings.forEach(h => {
        const level = parseInt(h.tagName.substring(1));
        if (level - prevLevel > 1) {
          report.issues.high.push({
            type: 'accessibility',
            element: h.tagName,
            issue: 'Heading hierarchy skip',
            details: `Jumped from h${prevLevel} to h${level}`,
          });
        }
        prevLevel = level;
      });

      // Check for empty buttons
      const buttons = Array.from(document.querySelectorAll('button'));
      buttons.forEach(btn => {
        const text = btn.textContent?.trim() || '';
        const hasIcon = btn.querySelector('svg') !== null;
        const hasAriaLabel = btn.hasAttribute('aria-label');

        if (!text && !hasIcon && !hasAriaLabel) {
          report.issues.critical.push({
            type: 'accessibility',
            element: 'button',
            issue: 'Empty button with no accessible name',
          });
        }
      });

      return report;
    });

    console.log('\n=== COMPREHENSIVE AUDIT REPORT ===\n');
    console.log(JSON.stringify(auditData, null, 2));

    // Save report to file
    const fs = require('fs');
    const path = require('path');
    const reportPath = '/tmp/siam-visual-audit/audit-report.json';

    try {
      fs.writeFileSync(reportPath, JSON.stringify(auditData, null, 2));
      console.log(`\nReport saved to: ${reportPath}`);
    } catch (e) {
      console.log('Could not save report file:', e);
    }
  });
});
