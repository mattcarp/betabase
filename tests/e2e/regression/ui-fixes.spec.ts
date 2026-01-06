import { test, expect } from '@playwright/test';

test.describe('UI Regressions & Fixes', () => {
  test('Header should have theme toggle and sidebar should NOT have MAC Dark tab', async ({ page }) => {
    // Navigate to chat page
    await page.goto('http://localhost:3000');
    
    // Wait for page to load
    await page.waitForSelector('text=The Betabase', { timeout: 30000 });

    // 1. Verify Header Theme Toggle Exists
    // Look for the sun/moon/palette icon button in the header
    const themeToggle = page.locator('header button[title*="Current:"]');
    await expect(themeToggle).toBeVisible();
    
    // 2. Verify "MAC Dark" text is NOT present (Regression Check)
    const macDarkText = page.locator('text="MAC Dark"');
    await expect(macDarkText).not.toBeVisible();

    // 3. Verify Ghostly Vertical Bar is GONE
    // We check the computed style of the sidebar rail or ensuring no overlay blocking right side
    // This is harder to test visually without screenshot comparison, but we can check if the rail is transparent
    const sidebarRail = page.locator('.mac-sidebar-rail');
    if (await sidebarRail.count() > 0) {
       const railBackground = await sidebarRail.evaluate((el) => {
          return window.getComputedStyle(el).backgroundColor;
       });
       // Expect transparent or rgba(0,0,0,0)
       expect(railBackground).toBe('rgba(0, 0, 0, 0)');
    }
  });
});
