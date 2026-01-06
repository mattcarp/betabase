import { test, expect } from '@playwright/test';

test.describe('Layout AppProviders Fix', () => {
  test('should load homepage without "Cannot read properties of undefined" error', async ({ page }) => {
    const consoleErrors: string[] = [];

    // Capture console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Capture page errors
    page.on('pageerror', (error) => {
      consoleErrors.push(error.message);
    });

    // Navigate to homepage
    await page.goto('http://localhost:3000');

    // Wait for page to fully load
    await page.waitForLoadState('networkidle');

    // Check that no "Cannot read properties of undefined" errors occurred
    const hasUndefinedError = consoleErrors.some(error =>
      error.includes('Cannot read properties of undefined')
    );

    expect(hasUndefinedError, `Found "Cannot read properties of undefined" error: ${consoleErrors.join(', ')}`).toBe(false);

    // Verify the page loaded successfully
    await expect(page.locator('body')).toBeVisible();

    // Verify theme provider is working (check for data-theme attribute)
    const html = page.locator('html');
    await expect(html).toHaveAttribute('data-theme', 'mac');
  });

  test('should render AppProviders and ThemeProvider correctly', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check that the body has the dark class (from layout)
    const body = page.locator('body');
    await expect(body).toHaveClass(/dark/);

    // Check that html has the font-sans class
    const html = page.locator('html');
    await expect(html).toHaveClass(/font-sans/);
  });
});
