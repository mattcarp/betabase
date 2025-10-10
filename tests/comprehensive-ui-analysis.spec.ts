import { test, expect } from '@playwright/test';

test.describe('Comprehensive UI/UX Analysis', () => {
  test.setTimeout(120000); // 2 minutes per test

  test('Phase 0: Preparation - Initial Screenshots', async ({ page }) => {
    // Navigate to login page
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });

    // Take initial screenshot
    await page.screenshot({
      path: '/tmp/screenshots/01-login-page.png',
      fullPage: true
    });

    // Check console errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Wait for page to be ready
    await page.waitForLoadState('domcontentloaded');

    console.log('Console errors:', errors);

    // Take screenshot of browser console state
    const logs = await page.evaluate(() => {
      return {
        errors: console.error.length || 0,
        warnings: console.warn.length || 0
      };
    });

    console.log('Console state:', logs);
  });

  test('Phase 1: Interaction Testing - Login Form', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Test email input interaction
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();

    // Take screenshot of initial state
    await page.screenshot({
      path: '/tmp/screenshots/02-login-initial.png',
      fullPage: true
    });

    // Test hover state
    await emailInput.hover();
    await page.screenshot({
      path: '/tmp/screenshots/03-login-input-hover.png',
      fullPage: true
    });

    // Test focus state
    await emailInput.focus();
    await page.screenshot({
      path: '/tmp/screenshots/04-login-input-focus.png',
      fullPage: true
    });

    // Fill email
    await emailInput.fill('matt@mattcarpenter.com');
    await page.screenshot({
      path: '/tmp/screenshots/05-login-email-filled.png',
      fullPage: true
    });

    // Check submit button state
    const submitButton = page.locator('button:has-text("Send Magic Link")');
    await expect(submitButton).toBeVisible();

    // Hover over submit button
    await submitButton.hover();
    await page.screenshot({
      path: '/tmp/screenshots/06-login-button-hover.png',
      fullPage: true
    });
  });

  test('Phase 2: Responsiveness - Mobile View', async ({ page, browser }) => {
    // Test mobile viewport (375px)
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    await page.screenshot({
      path: '/tmp/screenshots/07-mobile-375px.png',
      fullPage: true
    });
  });

  test('Phase 2: Responsiveness - Tablet View', async ({ page }) => {
    // Test tablet viewport (768px)
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    await page.screenshot({
      path: '/tmp/screenshots/08-tablet-768px.png',
      fullPage: true
    });
  });

  test('Phase 2: Responsiveness - Desktop View', async ({ page }) => {
    // Test desktop viewport (1440px)
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    await page.screenshot({
      path: '/tmp/screenshots/09-desktop-1440px.png',
      fullPage: true
    });
  });

  test('Phase 3: Visual Polish - MAC Design System Compliance', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Check for MAC Design System CSS variables
    const macVariables = await page.evaluate(() => {
      const root = getComputedStyle(document.documentElement);
      return {
        primaryBlue: root.getPropertyValue('--mac-primary-blue-400'),
        accentPurple: root.getPropertyValue('--mac-accent-purple-400'),
        surfaceBackground: root.getPropertyValue('--mac-surface-background'),
        surfaceElevated: root.getPropertyValue('--mac-surface-elevated'),
        textPrimary: root.getPropertyValue('--mac-text-primary'),
        textSecondary: root.getPropertyValue('--mac-text-secondary'),
        border: root.getPropertyValue('--mac-utility-border'),
      };
    });

    console.log('MAC Design System Variables:', macVariables);

    // Check for MAC component classes
    const macComponents = await page.evaluate(() => {
      return {
        buttons: document.querySelectorAll('.mac-button, .mac-button-primary, .mac-button-secondary').length,
        inputs: document.querySelectorAll('.mac-input').length,
        cards: document.querySelectorAll('.mac-card, .mac-card-elevated').length,
        glass: document.querySelectorAll('.mac-glass').length,
      };
    });

    console.log('MAC Components Found:', macComponents);

    // Check typography weights
    const typographyWeights = await page.evaluate(() => {
      const allElements = Array.from(document.querySelectorAll('*'));
      const weights = new Set<string>();

      allElements.forEach(el => {
        const weight = getComputedStyle(el).fontWeight;
        weights.add(weight);
      });

      return Array.from(weights);
    });

    console.log('Font Weights Found:', typographyWeights);
  });

  test('Phase 4: Accessibility - WCAG Compliance', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Check for focus indicators
    const focusableElements = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('button, input, a, [tabindex]'));
      return elements.length;
    });

    console.log('Focusable elements:', focusableElements);

    // Test keyboard navigation
    await page.keyboard.press('Tab');
    await page.screenshot({
      path: '/tmp/screenshots/10-keyboard-navigation-tab1.png',
      fullPage: true
    });

    await page.keyboard.press('Tab');
    await page.screenshot({
      path: '/tmp/screenshots/11-keyboard-navigation-tab2.png',
      fullPage: true
    });

    // Check for ARIA labels
    const ariaLabels = await page.evaluate(() => {
      return {
        ariaLabels: document.querySelectorAll('[aria-label]').length,
        ariaDescribed: document.querySelectorAll('[aria-describedby]').length,
        roleAttributes: document.querySelectorAll('[role]').length,
      };
    });

    console.log('Accessibility attributes:', ariaLabels);
  });

  test('Phase 5: Robustness - Error States', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Test empty email submission
    const submitButton = page.locator('button:has-text("Send Magic Link")');
    await submitButton.click();

    await page.screenshot({
      path: '/tmp/screenshots/12-error-empty-email.png',
      fullPage: true
    });

    // Test invalid email
    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill('invalid-email');
    await submitButton.click();

    await page.screenshot({
      path: '/tmp/screenshots/13-error-invalid-email.png',
      fullPage: true
    });
  });

  test('Phase 7: Console Errors Check', async ({ page }) => {
    const consoleMessages: { type: string; text: string }[] = [];

    page.on('console', msg => {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text()
      });
    });

    page.on('pageerror', error => {
      consoleMessages.push({
        type: 'pageerror',
        text: error.message
      });
    });

    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Wait for any async operations

    console.log('All Console Messages:', JSON.stringify(consoleMessages, null, 2));

    const errors = consoleMessages.filter(m => m.type === 'error' || m.type === 'pageerror');
    const warnings = consoleMessages.filter(m => m.type === 'warning');

    console.log(`\nSummary: ${errors.length} errors, ${warnings.length} warnings`);

    if (errors.length > 0) {
      console.log('\nErrors:', JSON.stringify(errors, null, 2));
    }
  });

  test('Phase 8: Performance - CLS Check', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Measure CLS (Cumulative Layout Shift)
    const clsValue = await page.evaluate(() => {
      return new Promise((resolve) => {
        let cls = 0;

        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              cls += (entry as any).value;
            }
          }
        });

        observer.observe({ type: 'layout-shift', buffered: true });

        setTimeout(() => {
          observer.disconnect();
          resolve(cls);
        }, 3000);
      });
    });

    console.log('Cumulative Layout Shift (CLS):', clsValue);
    console.log('CLS Status:', clsValue < 0.1 ? '✅ GOOD' : clsValue < 0.25 ? '⚠️ NEEDS IMPROVEMENT' : '❌ POOR');

    // Take screenshot after CLS measurement
    await page.screenshot({
      path: '/tmp/screenshots/14-cls-measurement.png',
      fullPage: true
    });
  });
});
