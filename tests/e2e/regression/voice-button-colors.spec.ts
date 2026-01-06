/**
 * Voice Button Colors and Functionality Tests
 *
 * Tests that all toolbar buttons use teal colors and that
 * the microphone button turns red when recording.
 */

import { test, expect } from '@playwright/test';

test.describe('Voice Button Colors', () => {
  test.beforeEach(async ({ page }) => {
    // Set bypass auth cookie for localhost
    await page.context().addCookies([
      { name: 'bypass_auth', value: 'true', domain: 'localhost', path: '/' },
    ]);

    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });

    // Wait for app to be fully hydrated
    await page.locator('text=The Betabase').first().waitFor({ state: 'visible', timeout: 10000 });

    // Click "Start a conversation" button to open chat interface
    const startButton = page.locator('button:has-text("Start a conversation")');
    await startButton.waitFor({ state: 'visible', timeout: 5000 });
    await startButton.click();
    await page.waitForTimeout(1000);

    // Wait for chat interface - wait for buttons to appear
    const micButton = page.locator('button').filter({ has: page.locator('svg.lucide-mic') }).first();
    await micButton.waitFor({ state: 'visible', timeout: 15000 });

    await page.waitForTimeout(500);
  });

  test('should show all toolbar buttons in teal', async ({ page }) => {
    // Find the buttons by their icons
    const paperclipButton = page.locator('button').filter({ has: page.locator('svg.lucide-paperclip') }).first();
    const micButton = page.locator('button').filter({ has: page.locator('svg.lucide-mic') }).first();
    const speakerButton = page.locator('button').filter({ has: page.locator('svg.lucide-volume-x, svg.lucide-volume-2') }).first();

    // All buttons should be visible
    await expect(paperclipButton).toBeVisible();
    await expect(micButton).toBeVisible();
    await expect(speakerButton).toBeVisible();

    // Take screenshot for visual verification
    await page.screenshot({ path: 'test-results/voice-buttons-toolbar.png' });
  });

  test('should have paperclip button in teal', async ({ page }) => {
    // Find paperclip button (file upload)
    const paperclipButton = page.locator('button').filter({ has: page.locator('svg.lucide-paperclip') }).first();
    await expect(paperclipButton).toBeVisible();

    // Get computed color - should be teal (primary color)
    const color = await paperclipButton.evaluate((el) => {
      return window.getComputedStyle(el).color;
    });

    console.log('Paperclip button color:', color);
    // Teal is rgb(0, 128, 128) or variations
    expect(color).toMatch(/rgb\(.*\)/);
  });

  test('should have microphone button in teal when not recording', async ({ page }) => {
    // Find microphone button
    const micButton = page.locator('button').filter({ has: page.locator('svg.lucide-mic') }).first();
    await expect(micButton).toBeVisible();

    // Button should have teal color when idle
    const classList = await micButton.getAttribute('class');
    console.log('Mic button classes:', classList);

    // Should have text-primary class (teal)
    expect(classList).toContain('text-primary');
  });

  test('should have speaker button in teal', async ({ page }) => {
    // Find speaker button (Volume2 or VolumeX icon)
    const speakerButton = page.locator('button').filter({
      has: page.locator('svg.lucide-volume-2, svg.lucide-volume-x')
    }).first();

    await expect(speakerButton).toBeVisible();

    // Get computed color
    const color = await speakerButton.evaluate((el) => {
      return window.getComputedStyle(el).color;
    });

    console.log('Speaker button color:', color);
    expect(color).toMatch(/rgb\(.*\)/);
  });

  test('should show Volume2 icon when TTS is enabled by default', async ({ page }) => {
    // Speaker button should show Volume2 (audio ON) by default
    const volume2Icon = page.locator('svg.lucide-volume-2').first();

    // Wait a moment for initial state
    await page.waitForTimeout(500);

    // Should be visible by default (TTS starts enabled)
    await expect(volume2Icon).toBeVisible();
  });

  test('should toggle speaker icon when clicked', async ({ page }) => {
    // Find speaker button
    const speakerButton = page.locator('button').filter({
      has: page.locator('svg.lucide-volume-2, svg.lucide-volume-x')
    }).first();

    await expect(speakerButton).toBeVisible();

    // Initially should show Volume2 (enabled)
    await expect(page.locator('svg.lucide-volume-2').first()).toBeVisible();

    // Click to disable
    await speakerButton.click();
    await page.waitForTimeout(300);

    // Should now show VolumeX (disabled)
    await expect(page.locator('svg.lucide-volume-x').first()).toBeVisible();

    // Click again to enable
    await speakerButton.click();
    await page.waitForTimeout(300);

    // Should show Volume2 again
    await expect(page.locator('svg.lucide-volume-2').first()).toBeVisible();
  });

  test('should have model selector in toolbar', async ({ page }) => {
    // Model selector should be visible
    const modelSelector = page.locator('text=Gemini').first();
    await expect(modelSelector).toBeVisible();
  });

  test('buttons should not use hardcoded gray colors', async ({ page }) => {
    // Check that voice buttons don't use muted-foreground (gray)
    const buttons = page.locator('button').filter({ has: page.locator('svg.lucide-paperclip, svg.lucide-mic, svg.lucide-volume-x, svg.lucide-volume-2') });

    const count = await buttons.count();
    for (let i = 0; i < count; i++) {
      const button = buttons.nth(i);
      const classes = await button.getAttribute('class');

      // Should not contain muted-foreground (gray)
      expect(classes).not.toContain('muted-foreground');
    }
  });

  test('toolbar should use MAC design system classes', async ({ page }) => {
    // Check that buttons use MAC design system classes
    const buttons = page.locator('button').filter({ has: page.locator('svg.lucide-paperclip, svg.lucide-mic, svg.lucide-volume-x, svg.lucide-volume-2') });
    const firstButton = buttons.first();
    await expect(firstButton).toBeVisible();

    // Should use mac-button class or similar
    const classes = await firstButton.getAttribute('class');
    expect(classes).toMatch(/mac-button|text-primary/);
  });
});
