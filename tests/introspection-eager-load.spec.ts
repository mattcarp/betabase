import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Introspection Eager Loading Test
 *
 * Demonstrates that the introspection status goes green automatically
 * on app load without needing to click the dropdown.
 *
 * Output: ~/Desktop/playwright-screencasts/test-introspection-eager-v1-YYYY-MM-DD.webm
 */

const OUTPUT_DIR = '/Users/matt/Desktop/playwright-screencasts/test';
const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

// Configure video recording at full Retina resolution
test.use({
  video: {
    mode: 'on',
    size: { width: 2880, height: 1800 }
  },
  viewport: { width: 2880, height: 1800 },
  baseURL: 'http://localhost:3000',
  storageState: undefined,
});

test.describe('Introspection Eager Loading', () => {
  test.setTimeout(120000); // 2 minute timeout for video recording

  // Video will be saved to test-results/ directory automatically
  // Copy manually after test run:
  // cp test-results/*/video.webm ~/Desktop/playwright-screencasts/test/test-introspection-eager-v1-YYYY-MM-DD.webm

  test('Introspection status turns green without dropdown interaction', async ({ page }) => {
    // Navigate to the app with extended timeout
    await page.goto('/', { timeout: 60000, waitUntil: 'domcontentloaded' });

    // Initial pause to show the page loading
    await page.waitForTimeout(2000);

    // Find the introspection button - it shows "X/2" status
    const introspectionButton = page.locator('button:has-text("Introspection")');

    // Wait for the button to be visible
    await expect(introspectionButton).toBeVisible({ timeout: 10000 });

    // Scroll it into view if needed
    await introspectionButton.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);

    // The eager loading fix means the introspection status fetches on app mount
    // and should turn green (2/2) within ~5-10 seconds WITHOUT clicking the dropdown.

    // Wait for the green 2/2 status to appear - give it up to 30 seconds
    // The green class indicates successful connection
    const greenStatus = page.locator('button:has-text("Introspection")').locator('.text-green-400, .text-green-500');

    await expect(greenStatus).toBeVisible({ timeout: 30000 });
    await expect(introspectionButton).toContainText('2/2', { timeout: 5000 });

    console.log('Introspection status turned GREEN on mount - eager loading works!');

    // Hold for a moment to show the status in the video
    await page.waitForTimeout(3000);

    // Click the introspection button to open the dropdown/popover
    await introspectionButton.click();
    await page.waitForTimeout(2000);

    // After clicking, some content should appear - look for common elements
    // The popover should show connection info or status
    const popoverContent = page.locator('.popover-content, [data-radix-popper-content-wrapper], [class*="PopoverContent"]').first();

    // If popover is visible, great - if not, just wait and show the state
    try {
      await expect(popoverContent).toBeVisible({ timeout: 3000 });
      console.log('Dropdown opened successfully');
    } catch {
      console.log('Dropdown selector not found, but eager loading was verified');
    }

    // Hold for final frame of video
    await page.waitForTimeout(3000);

    console.log('Test complete - eager loading verified');
  });
});
