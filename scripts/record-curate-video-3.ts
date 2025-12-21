/**
 * Record Curate Video 3: Cumulative Impact / Learning Curve
 *
 * Demonstrates: AI improves because of humans
 * - Show the stats/metrics of curation progress
 * - Visualize how many corrections have been made
 * - Show the feedback improving the system over time
 */

import { chromium, Page } from 'playwright';
import * as path from 'path';
import * as fs from 'fs';

const OUTPUT_DIR = path.join(process.env.HOME!, 'Desktop/playwright-screencasts/curate');
const VIDEO_NAME = 'curate-quality-review';
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
    await sleep(3000);

    // Scene 3: Show the Overview tab first (stats and metrics)
    console.log('Scene 3: Showing Overview stats');
    // The Overview tab should show by default, look for stats cards
    const statsSelectors = [
      'text="Total Feedback"',
      'text="Pending Review"',
      'text="Helpful"',
      'text="Curation"',
      '[data-testid="stats-card"]'
    ];

    for (const selector of statsSelectors) {
      const element = page.locator(selector).first();
      if (await element.isVisible({ timeout: 2000 }).catch(() => false)) {
        console.log(`Found stats element: ${selector}`);
        break;
      }
    }
    await sleep(3000);

    // Scene 4: Scroll to see all stats
    console.log('Scene 4: Scrolling to view stats');
    await page.evaluate(() => window.scrollBy(0, 300));
    await sleep(2000);

    // Scene 5: Click on RLHF tab to show the feedback queue
    console.log('Scene 5: Navigate to RLHF');
    await waitForSelector(page, 'button:has-text("RLHF")', 15000);
    await page.click('button:has-text("RLHF")');
    await sleep(3000);

    // Scene 6: Scroll through feedback cards
    console.log('Scene 6: Scrolling through feedback cards');
    await page.evaluate(() => window.scrollBy(0, 400));
    await sleep(2000);

    // Scene 7: Look for any feedback progress indicators
    console.log('Scene 7: Looking for progress indicators');
    const progressSelectors = [
      'text="Reviewed"',
      'text="Approved"',
      'text="pending"',
      '[role="progressbar"]',
      '.progress'
    ];

    for (const selector of progressSelectors) {
      const element = page.locator(selector).first();
      if (await element.isVisible({ timeout: 1000 }).catch(() => false)) {
        console.log(`Found progress element: ${selector}`);
        await element.scrollIntoViewIfNeeded();
        await sleep(1500);
        break;
      }
    }

    // Scene 8: Scroll back up to show full view
    console.log('Scene 8: Final overview');
    await page.evaluate(() => window.scrollTo(0, 0));
    await sleep(2000);

    // Scene 9: Go back to Overview for final stats view
    console.log('Scene 9: Return to Overview');
    const overviewBtn = page.locator('button:has-text("Overview")').first();
    if (await overviewBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await overviewBtn.click();
      await sleep(3000);
    }

    // Scene 10: Final pause on stats
    console.log('Scene 10: Final state - stats display');
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
    .filter(f => f.endsWith('.webm') && !f.startsWith(VIDEO_NAME) && !f.includes('rlhf-workflow') && !f.includes('feedback-loop'))
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
    if (newest && !newest.startsWith(VIDEO_NAME) && !newest.includes('rlhf-workflow') && !newest.includes('feedback-loop')) {
      const oldPath = path.join(OUTPUT_DIR, newest);
      fs.renameSync(oldPath, videoPath);
      console.log(`Saved as: ${videoPath}`);
    }
  }
}

record().catch(console.error);
