import { test, expect } from '@playwright/test';

test.describe('Zeitgeist Landing Page Regression', () => {
  test('should display Zeitgeist Intelligence panel on homepage', async ({ page }) => {
    // 1. Navigate to homepage
    await page.goto('/');

    // 2. consistent wait for hyrdration
    await page.waitForLoadState('networkidle');

    // 3. Check for specific text that indicates the suggestions panel is present
    // The header for the suggestions bubbles
    const heading = page.getByText('Try these to get started', { exact: false });
    await expect(heading).toBeVisible({ timeout: 10000 });

    // 4. Check for the "Welcome" text to ensure we are on the landing state
    await expect(page.getByText('Welcome to The Betabase')).toBeVisible();
    
    // 5. Check for at least one suggestion bubble (which is a button)
    // The bubbles use the Suggestion component which renders a Button
    const bubbles = page.locator('button.mac-button');
    // We expect multiple buttons on the page (mic, speaker, clears), but we can check if we have enough
    // Or specifically look for the grid container
    const suggestionGrid = page.locator('.grid.grid-cols-2');
    await expect(suggestionGrid).toBeVisible();
  });
});
