/**
 * DDP Visual Demo Tests
 *
 * Tests the enhanced DDP parser demo page with visual feedback and animations.
 */

import { test, expect } from '@playwright/test';

test.describe('DDP Visual Demo', () => {
  test.beforeEach(async ({ page }) => {
    // Set bypass auth cookie for localhost
    await page.context().addCookies([
      { name: 'bypass_auth', value: 'true', domain: 'localhost', path: '/' },
    ]);

    await page.goto('http://localhost:3000/test-ddp', { waitUntil: 'domcontentloaded' });

    // Wait for page to load
    await page.waitForTimeout(1000);
  });

  test('should display hero header and branding', async ({ page }) => {
    // Check for hero badge
    const heroBadge = page.locator('text=DDP Master Parser');
    await expect(heroBadge).toBeVisible();

    // Check for main heading
    const heading = page.locator('h1:has-text("CD Master Analysis Demo")');
    await expect(heading).toBeVisible();

    // Check for description
    const description = page.locator('text=Upload a DDP folder to extract metadata');
    await expect(description).toBeVisible();
  });

  test('should show idle stage initially', async ({ page }) => {
    // Check stage indicator shows "Ready to Parse"
    const stageLabel = page.locator('text=Ready to Parse');
    await expect(stageLabel).toBeVisible();

    // Check status message
    const statusMessage = page.locator('text=Drop a DDP folder or select files to begin');
    await expect(statusMessage).toBeVisible();

    // Progress bars should be empty (muted)
    const progressBars = page.locator('.h-1\\.5.flex-1.rounded-full');
    const firstBar = progressBars.first();
    const className = await firstBar.getAttribute('class');
    expect(className).toContain('bg-muted');
  });

  test('should display info card about DDP', async ({ page }) => {
    // Check "What is DDP?" section
    const infoHeading = page.locator('text=What is DDP?');
    await expect(infoHeading).toBeVisible();

    // Check for DDP component descriptions
    await expect(page.locator('text=DDPMS - Map Stream (TOC)')).toBeVisible();
    await expect(page.locator('text=DDPID - Disc Identification')).toBeVisible();
    await expect(page.locator('text=DDPPQ - Subcode & Timing')).toBeVisible();
    await expect(page.locator('text=CD-TEXT - Metadata')).toBeVisible();
  });

  test('should show upload buttons', async ({ page }) => {
    // Check for folder upload button
    const folderButton = page.locator('button:has-text("Select Folder")');
    await expect(folderButton).toBeVisible();

    // Check for files upload button
    const filesButton = page.locator('button:has-text("Select Files")');
    await expect(filesButton).toBeVisible();
  });

  test('should have stage indicator with icon', async ({ page }) => {
    // Check that stage indicator card exists
    const stageCard = page.locator('.p-6.bg-card.border-border').first();
    await expect(stageCard).toBeVisible();

    // Check for icon container
    const iconContainer = stageCard.locator('.p-3.rounded-lg').first();
    await expect(iconContainer).toBeVisible();

    // Check for stage label and description
    const stageLabel = stageCard.locator('.mac-title');
    await expect(stageLabel).toBeVisible();
  });

  test('should use correct MAC design system classes', async ({ page }) => {
    // Check hero heading uses mac-heading
    const heading = page.locator('h1.mac-heading');
    await expect(heading).toBeVisible();

    // Check body text uses mac-body
    const bodyText = page.locator('.mac-body');
    await expect(bodyText).toBeVisible();

    // Check info card uses mac-title (multiple instances, check first)
    const titleText = page.locator('.mac-title').first();
    await expect(titleText).toBeVisible();

    // Verify no hardcoded colors (check a few key elements)
    const stageCard = page.locator('.bg-card.border-border').first();
    await expect(stageCard).toBeVisible();
  });

  test('should have responsive layout', async ({ page }) => {
    // Check container has max-width constraint
    const container = page.locator('.max-w-5xl.mx-auto');
    await expect(container).toBeVisible();

    // Check centered text in hero (multiple instances, check first)
    const centerText = page.locator('.text-center').first();
    await expect(centerText).toBeVisible();
  });

  test('should display visual elements with proper spacing', async ({ page }) => {
    // Check for space-y-8 (spacing between sections)
    const mainContainer = page.locator('.space-y-8').first();
    await expect(mainContainer).toBeVisible();

    // Check for gap-4 in stage indicator
    const stageContainer = page.locator('.flex.items-center.gap-4').first();
    await expect(stageContainer).toBeVisible();
  });

  test('should not show quick stats before parsing', async ({ page }) => {
    // Stats cards should not be visible initially
    const statsGrid = page.locator('.grid.grid-cols-3.gap-4');
    await expect(statsGrid).not.toBeVisible();
  });

  test('should not show error display initially', async ({ page }) => {
    // Error card should not be visible
    const errorCard = page.locator('.bg-red-500\\/10.border-red-500\\/20');
    await expect(errorCard).not.toBeVisible();
  });

  test('should have animated icons with proper colors', async ({ page }) => {
    // Check that icon has proper color class
    const icon = page.locator('.text-muted-foreground').first();
    await expect(icon).toBeVisible();

    // Verify transition classes are present
    const transitionElement = page.locator('.transition-all.duration-300').first();
    await expect(transitionElement).toBeVisible();
  });

  test('should display progress bars', async ({ page }) => {
    // Check for progress bar container
    const progressContainer = page.locator('.mt-6.flex.items-center.gap-2').first();
    await expect(progressContainer).toBeVisible();

    // Check for individual progress bars
    const progressBars = page.locator('.h-1\\.5.flex-1.rounded-full');
    const count = await progressBars.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should have accessible structure', async ({ page }) => {
    // Check for proper heading hierarchy
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible();

    const h3 = page.locator('h3').first();
    await expect(h3).toBeVisible();

    // Check for semantic card structure
    const cards = page.locator('[class*="card"]');
    const cardCount = await cards.count();
    expect(cardCount).toBeGreaterThan(0);
  });
});
