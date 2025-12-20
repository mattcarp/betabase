#!/usr/bin/env node
/**
 * Video Recording Script for SIAM
 *
 * Records video walkthroughs of the app for documentation, demos, and QA.
 * Uses Playwright with Chrome in headed mode so you can watch execution.
 *
 * Usage:
 *   node scripts/record-video.mjs
 *   FEATURE_NAME="demo" node scripts/record-video.mjs
 *   OUTPUT_DIR="~/Videos" FEATURE_NAME="test-tab" node scripts/record-video.mjs
 *
 * Environment Variables:
 *   BASE_URL     - App URL to record (default: http://localhost:3000)
 *   OUTPUT_DIR   - Where to save videos (default: ~/Desktop/playwright-screencasts)
 *   FEATURE_NAME - Prefix for filename (default: recording)
 *   SLOW_MO      - Slowdown in ms (default: 50)
 */

import { chromium } from 'playwright';
import { rename, mkdir } from 'fs/promises';
import { homedir } from 'os';
import { join } from 'path';

// Configuration from environment
const config = {
  baseUrl: process.env.BASE_URL || 'http://localhost:3000',
  outputDir: (process.env.OUTPUT_DIR || '~/Desktop/playwright-screencasts').replace('~', homedir()),
  featureName: process.env.FEATURE_NAME || 'recording',
  slowMo: parseInt(process.env.SLOW_MO || '50', 10),
};

console.log('Video Recording Configuration:');
console.log(`  Base URL: ${config.baseUrl}`);
console.log(`  Output Dir: ${config.outputDir}`);
console.log(`  Feature Name: ${config.featureName}`);
console.log(`  Slow Mo: ${config.slowMo}ms`);
console.log('');

async function record() {
  // Create output directory
  await mkdir(config.outputDir, { recursive: true });

  console.log('Launching Chrome (headed mode)...');

  // Launch Chrome in HEADED mode with video recording
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: false,  // HEADED - visible browser window
    slowMo: config.slowMo,
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    recordVideo: {
      dir: config.outputDir,
      size: { width: 1920, height: 1080 }
    }
  });

  const page = await context.newPage();

  try {
    console.log(`Navigating to ${config.baseUrl}...`);
    await page.goto(config.baseUrl);
    await page.waitForLoadState('networkidle');

    // Initial pause to show starting state
    console.log('Recording started. Waiting for initial frame...');
    await page.waitForTimeout(2000);

    // =====================================================
    // NAVIGATION SEQUENCE
    // Customize this section for your recording needs
    // =====================================================

    // Example: Click the Test tab
    const testTab = page.locator('button[data-tab="test"]');
    if (await testTab.isVisible()) {
      console.log('Clicking Test tab...');
      await testTab.click();
      await page.waitForTimeout(1500);
    }

    // Example: Navigate through subtabs
    const subtabs = ['home', 'self-healing', 'historical'];
    for (const tab of subtabs) {
      const subtab = page.locator(`[role="tablist"] button[value="${tab}"]`);
      if (await subtab.isVisible().catch(() => false)) {
        console.log(`Clicking subtab: ${tab}...`);
        await subtab.click();
        await page.waitForTimeout(1500);
      }
    }

    // =====================================================
    // END NAVIGATION SEQUENCE
    // =====================================================

    // Final pause for clean ending
    console.log('Recording final frame...');
    await page.waitForTimeout(2000);

  } catch (error) {
    console.error('Error during recording:', error.message);
  } finally {
    // Get video path BEFORE closing context
    const videoPath = await page.video()?.path();

    console.log('Closing browser and finalizing video...');

    // Close context to finalize video (CRITICAL - must close context, not just browser)
    await context.close();
    await browser.close();

    // Rename to meaningful filename
    if (videoPath) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const newPath = join(config.outputDir, `${config.featureName}-${timestamp}.webm`);

      try {
        await rename(videoPath, newPath);
        console.log('');
        console.log('Video saved successfully!');
        console.log(`  Path: ${newPath}`);
        console.log('');
        console.log('To convert for Premiere Pro:');
        console.log(`  ffmpeg -i "${newPath}" -c:v prores_ks "${newPath.replace('.webm', '.mov')}"`);
        return newPath;
      } catch (renameError) {
        console.log(`Video saved at: ${videoPath}`);
        console.error('Could not rename file:', renameError.message);
        return videoPath;
      }
    } else {
      console.error('No video path found - recording may have failed');
    }
  }
}

// Run the recording
record()
  .then(path => {
    if (path) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
