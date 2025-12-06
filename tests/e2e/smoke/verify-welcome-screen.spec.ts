import {  test, expect  } from '../fixtures/base-test';

test.describe('Welcome Screen Verification', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', msg => console.log(`BROWSER LOG: ${msg.text()}`));
    // Clear localStorage to ensure we are in a "fresh" state with no active conversation
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      localStorage.clear();
    });
    await page.reload();
  });

  test('should display logo, welcome text, and suggestions on initial load', async ({ page }) => {
    // 1. Verify "Welcome to The Betabase" heading
    const welcomeHeading = page.getByRole('heading', { name: 'Welcome to The Betabase' });
    await expect(welcomeHeading).toBeVisible({ timeout: 10000 });

    // 2. Verify "Don't be an asshat." text
    // Note: This might be in a paragraph, so we search by text
    const tagline = page.getByText("Don't be an asshat.");
    await expect(tagline).toBeVisible();

    // 3. Verify the Logo is present
    // The SiamLogo usually renders as an SVG. We can check for the container or the SVG itself.
    // Based on previous code, it's in a div with class "relative mb-8" inside the welcome screen.
    // We can look for the SVG element.
    const logo = page.locator('svg').first(); // This is a bit loose, let's try to be more specific if possible, but for now checking for *any* SVG in the hero section is a good start.
    // Better: The logo is likely near the "Welcome to The Betabase" text.
    await expect(logo).toBeVisible();

    // 4. Verify Suggestions
    // We expect 4 to 6 suggestions.
    // They are buttons.
    const suggestionButtons = page.locator('button').filter({ hasText: /How do I|What's the|Why is my/ });
    
    // Wait for at least one to be visible
    await expect(suggestionButtons.first()).toBeVisible();
    
    // Check count
    const count = await suggestionButtons.count();
    console.log(`Found ${count} suggestion buttons.`);
    expect(count).toBeGreaterThanOrEqual(4);
    expect(count).toBeLessThanOrEqual(6);
  });
});
