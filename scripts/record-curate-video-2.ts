/**
 * Record Curate Video 2: Correction Flow
 *
 * Demonstrates: AI learns from human expertise
 * - Human catches AI mistake
 * - Types in correct answer from institutional knowledge
 * - That correction becomes training data
 */

import { chromium, Page } from 'playwright';
import * as path from 'path';
import * as fs from 'fs';

const OUTPUT_DIR = path.join(process.env.HOME!, 'Desktop/playwright-screencasts/curate');
const VIDEO_NAME = 'curate-feedback-loop';
const DATE = new Date().toISOString().split('T')[0];

async function getNextVersion(): Promise<number> {
  const files = fs.readdirSync(OUTPUT_DIR).filter(f => f.startsWith(VIDEO_NAME));
  if (files.length === 0) return 1;
  const versions = files.map(f => {
    const match = f.match(/-v(\d+)-/);
    return match ? parseInt(match[1]) : 0;
  });
  return Math.max(...versions) + 1;
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForSelector(page: Page, selector: string, timeout = 10000): Promise<boolean> {
  try {
    await page.waitForSelector(selector, { timeout, state: 'visible' });
    return true;
  } catch {
    console.log(`Selector not found: ${selector}`);
    return false;
  }
}

async function clickIfVisible(page: Page, selector: string, timeout = 5000): Promise<boolean> {
  try {
    const element = page.locator(selector).first();
    if (await element.isVisible({ timeout })) {
      await element.click();
      return true;
    }
  } catch {
    console.log(`Could not click: ${selector}`);
  }
  return false;
}

async function record() {
  const version = await getNextVersion();
  const videoPath = path.join(OUTPUT_DIR, `${VIDEO_NAME}-v${version}-${DATE}.webm`);

  console.log(`Recording: ${videoPath}`);

  const browser = await chromium.launch({
    headless: false,
    slowMo: 150
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    recordVideo: {
      dir: OUTPUT_DIR,
      size: { width: 1280, height: 800 }
    }
  });

  context.on('page', page => {
    page.on('pageerror', err => console.log('Page error:', err.message));
  });

  const page = await context.newPage();

  try {
    // Scene 1: Navigate to the app
    console.log('Scene 1: Landing page');
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await sleep(4000);

    // Scene 2: Click on Curate tab
    console.log('Scene 2: Navigate to Curate');
    await waitForSelector(page, 'button:has-text("Curate")', 15000);
    await page.click('button:has-text("Curate")');
    await sleep(3000); // Wait for Curate content to load

    // Scene 3: Click on RLHF tab (it's a sub-tab, might take time to appear)
    console.log('Scene 3: Navigate to RLHF');
    await waitForSelector(page, 'button:has-text("RLHF")', 15000);
    await page.click('button:has-text("RLHF")');
    await sleep(3000);

    // Scene 4: Scroll to see cards
    console.log('Scene 4: Scrolling to feedback cards');
    await page.evaluate(() => window.scrollBy(0, 400));
    await sleep(2000);

    // Scene 5: Click "Not Helpful" on a card (simulating finding an error)
    console.log('Scene 5: Marking response as not helpful');
    const notHelpfulBtn = page.locator('button:has-text("Not Helpful")').first();
    if (await notHelpfulBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await notHelpfulBtn.click();
      await sleep(2000);
    }

    // Scene 6: Look for correction/feedback text area
    console.log('Scene 6: Looking for correction input');
    const textareaSelectors = [
      'textarea[placeholder*="correction"]',
      'textarea[placeholder*="feedback"]',
      'textarea[placeholder*="comment"]',
      'textarea',
      'input[type="text"]'
    ];

    for (const selector of textareaSelectors) {
      const textarea = page.locator(selector).first();
      if (await textarea.isVisible({ timeout: 1000 }).catch(() => false)) {
        console.log(`Found input: ${selector}`);
        await textarea.click();
        await sleep(500);

        // Type a correction demonstrating institutional knowledge
        await page.keyboard.type(
          'The answer should reference the updated Q3 policy. We changed this in the September all-hands meeting.',
          { delay: 40 }
        );
        await sleep(2000);
        break;
      }
    }

    // Scene 7: Look for submit/save button
    console.log('Scene 7: Submitting correction');
    const submitSelectors = [
      'button:has-text("Submit")',
      'button:has-text("Save")',
      'button:has-text("Send")',
      'button[type="submit"]'
    ];

    for (const selector of submitSelectors) {
      const btn = page.locator(selector).first();
      if (await btn.isVisible({ timeout: 1000 }).catch(() => false)) {
        console.log(`Found submit button: ${selector}`);
        await btn.click();
        await sleep(2000);
        break;
      }
    }

    // Scene 8: Show final state - the correction is saved
    console.log('Scene 8: Final state');
    await sleep(3000);

    console.log('Recording complete!');

  } catch (error) {
    console.error('Error during recording:', error);
  } finally {
    await page.close();
    await context.close();
    await browser.close();
  }

  // Find and rename the video file
  await sleep(1000);
  const files = fs.readdirSync(OUTPUT_DIR);
  const latestVideo = files
    .filter(f => f.endsWith('.webm') && !f.startsWith(VIDEO_NAME) && !f.includes('rlhf-workflow') && !f.includes('quality-review'))
    .sort()
    .pop();

  if (latestVideo) {
    const oldPath = path.join(OUTPUT_DIR, latestVideo);
    fs.renameSync(oldPath, videoPath);
    console.log(`Saved as: ${videoPath}`);
  } else {
    // Try to find any new webm
    const allVideos = files.filter(f => f.endsWith('.webm')).sort();
    const newest = allVideos.pop();
    if (newest && !newest.startsWith(VIDEO_NAME)) {
      const oldPath = path.join(OUTPUT_DIR, newest);
      fs.renameSync(oldPath, videoPath);
      console.log(`Saved as: ${videoPath}`);
    }
  }
}

record().catch(console.error);
