import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

/**
 * DDP Parser E2E Tests
 *
 * Tests for the DDP file upload and parsing functionality.
 * Note: These tests use mock DDP files to verify the UI behavior.
 */

test.describe('DDP Parser', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the DDP test page
    await page.goto('/test-ddp');
    await page.waitForLoadState('networkidle');
  });

  test('should display DDP uploader with title and description', async ({ page }) => {
    // Check page header
    await expect(page.getByRole('heading', { name: 'DDP Parser' })).toBeVisible();

    // Check uploader is visible
    await expect(page.getByText('Upload DDP Master')).toBeVisible();
    await expect(page.getByText('Select a DDP folder or multiple files to parse')).toBeVisible();

    // Check buttons are visible
    await expect(page.getByRole('button', { name: 'Select Folder' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Select Files' })).toBeVisible();
  });

  test('should show info card explaining DDP', async ({ page }) => {
    await expect(page.getByText('What is DDP?')).toBeVisible();
    // Use more specific text that only appears in the info card
    await expect(page.getByText(/industry standard format for delivering CD masters/)).toBeVisible();
  });

  test('should have folder input with webkitdirectory attribute', async ({ page }) => {
    // Find the hidden folder input
    const folderInput = page.locator('input[type="file"][webkitdirectory]');
    await expect(folderInput).toBeAttached();
  });

  test('should have multiple file input', async ({ page }) => {
    // Find the hidden files input (without webkitdirectory)
    const filesInput = page.locator('input[type="file"]:not([webkitdirectory])');
    await expect(filesInput).toBeAttached();
  });

  test('should show tips section', async ({ page }) => {
    await expect(page.getByText('Tips:')).toBeVisible();
    await expect(page.getByText(/Audio files.*are automatically skipped/)).toBeVisible();
    await expect(page.getByText(/parser detects DDP by looking for the DDPMS file/)).toBeVisible();
  });
});

test.describe('DDP Parser - File Upload', () => {
  // Use the properly generated DDP test fixtures
  const fixtureDir = path.join(__dirname, '..', 'fixtures', 'ddp-sample');

  test('should detect and parse DDP files correctly', async ({ page }) => {
    await page.goto('/test-ddp');
    await page.waitForLoadState('networkidle');

    // Upload all three DDP files from fixtures
    const fileInput = page.locator('input[type="file"]:not([webkitdirectory])');

    await fileInput.setInputFiles([
      path.join(fixtureDir, 'DDPMS'),
      path.join(fixtureDir, 'DDPID'),
      path.join(fixtureDir, 'DDPPQ'),
    ]);

    // Wait for parsing to complete
    await page.waitForTimeout(2000);

    // Check for parsed result - should show track listing header
    // Use exact match to avoid matching other text containing these words
    await expect(page.getByText('Track Listing', { exact: true })).toBeVisible({ timeout: 5000 });

    // Verify track count - fixture has 5 tracks
    await expect(page.getByText('5 tracks')).toBeVisible();

    // Verify UPC from DDPID (0886446672632)
    await expect(page.getByText('0886446672632')).toBeVisible();
  });

  test('should show ISRC codes from parsed DDP', async ({ page }) => {
    await page.goto('/test-ddp');
    await page.waitForLoadState('networkidle');

    const fileInput = page.locator('input[type="file"]:not([webkitdirectory])');

    await fileInput.setInputFiles([
      path.join(fixtureDir, 'DDPMS'),
      path.join(fixtureDir, 'DDPID'),
      path.join(fixtureDir, 'DDPPQ'),
    ]);

    await page.waitForTimeout(2000);

    // Check for ISRC codes (from fixture: USRC11234567, USRC11234568, etc.)
    await expect(page.getByText('USRC11234567')).toBeVisible({ timeout: 5000 });
  });

  test('should show DDP files table', async ({ page }) => {
    await page.goto('/test-ddp');
    await page.waitForLoadState('networkidle');

    const fileInput = page.locator('input[type="file"]:not([webkitdirectory])');

    await fileInput.setInputFiles([
      path.join(fixtureDir, 'DDPMS'),
      path.join(fixtureDir, 'DDPID'),
      path.join(fixtureDir, 'DDPPQ'),
    ]);

    await page.waitForTimeout(2000);

    // Check for DDP Files section
    await expect(page.getByText('DDP Files', { exact: true })).toBeVisible({ timeout: 5000 });

    // Check individual file names are shown in the table cells
    await expect(page.getByRole('cell', { name: 'DDPMS' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'DDPID' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'DDPPQ' })).toBeVisible();
  });
});

test.describe('DDP Display Component', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/test-ddp');
    await page.waitForLoadState('networkidle');
  });

  test('should have accessible upload buttons', async ({ page }) => {
    const folderButton = page.getByRole('button', { name: 'Select Folder' });
    const filesButton = page.getByRole('button', { name: 'Select Files' });

    await expect(folderButton).toBeEnabled();
    await expect(filesButton).toBeEnabled();

    // Check they are focusable
    await folderButton.focus();
    await expect(folderButton).toBeFocused();
  });
});
