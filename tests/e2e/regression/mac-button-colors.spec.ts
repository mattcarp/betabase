import { test, expect } from '@playwright/test';

test.describe('MAC Design System Button Colors', () => {
  test('buttons should use teal colors (not purple) - AI Test Generator', async ({ page }) => {
    await page.goto('http://localhost:3000/test');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Click on the AI Test Generator tab/section if needed
    // (adjust selector based on actual navigation structure)

    // Find the "Run Test" button in the preview section
    const runTestButton = page.locator('button').filter({ hasText: 'Run Test' }).first();

    // Check if button is visible
    await expect(runTestButton).toBeVisible({ timeout: 10000 });

    // Get computed styles
    const backgroundColor = await runTestButton.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });

    console.log('Run Test button background color:', backgroundColor);

    // Teal colors should be in the range of rgb(38, 198, 218) or similar teal shades
    // NOT purple rgb(147, 51, 234) or similar purple shades

    // Check it's not purple (purple would have much higher blue than green)
    // For teal: green > blue, blue > red
    // For purple: blue > red, blue > green
    const rgbMatch = backgroundColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);

    if (rgbMatch) {
      const [, r, g, b] = rgbMatch.map(Number);
      console.log(`RGB values - R: ${r}, G: ${g}, B: ${b}`);

      // Teal characteristics: green should be high, blue should be moderate to high
      // NOT purple where blue dominates over green
      expect(g).toBeGreaterThan(r); // Green should be more than red for teal
      expect(b).toBeGreaterThan(r); // Blue should be more than red for teal

      // Purple would have b > g significantly, teal should have g >= b or close
      const purpleScore = b - g;
      expect(purpleScore).toBeLessThan(50); // Difference should be small for teal
    }
  });

  test('Generate button should use teal-solid variant', async ({ page }) => {
    await page.goto('http://localhost:3000/test');

    await page.waitForLoadState('networkidle');

    // Find the "Generate Automated Test" button
    const generateButton = page.locator('button').filter({ hasText: /Generate.*Test/i }).first();

    await expect(generateButton).toBeVisible({ timeout: 10000 });

    const backgroundColor = await generateButton.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });

    console.log('Generate button background color:', backgroundColor);

    // Check it uses a gradient or solid teal color (not purple)
    const rgbMatch = backgroundColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);

    if (rgbMatch) {
      const [, r, g, b] = rgbMatch.map(Number);
      console.log(`RGB values - R: ${r}, G: ${g}, B: ${b}`);

      // Should be teal-ish
      expect(g).toBeGreaterThan(r);
      expect(b).toBeGreaterThan(r);

      // Not purple
      const purpleScore = b - g;
      expect(purpleScore).toBeLessThan(50);
    }
  });
});
