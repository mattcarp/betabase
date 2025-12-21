/**
 * Record Curate Video 1: Document Relevance Marking
 *
 * Demonstrates: AI needs human judgment
 * - Human curator reviews AI-retrieved documents
 * - Marks which ones were actually relevant
 * - Shows expertise the AI doesn't have
 *
 * ARTISTIC VISION: Show the symbiosis - AI retrieves docs, human judges quality
 */

import { chromium, Page } from 'playwright';
import * as path from 'path';
import * as fs from 'fs';

const OUTPUT_DIR = path.join(process.env.HOME!, 'Desktop/playwright-screencasts/curate');
const VIDEO_NAME = 'curate-rlhf-workflow';
const DATE = new Date().toISOString().split('T')[0];

async function getNextVersion(): Promise<number> {
  const files = fs.readdirSync(OUTPUT_DIR).filter(f => f.startsWith(VIDEO_NAME) && !f.includes('_BEST'));
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

async function waitForContent(page: Page, selector: string, timeout = 15000): Promise<boolean> {
  try {
    await page.waitForSelector(selector, { timeout, state: 'visible' });
    return true;
  } catch {
    console.log(`Content not found: ${selector}`);
    return false;
  }
}

async function smoothScroll(page: Page, amount: number, duration = 1000) {
  const steps = 20;
  const stepAmount = amount / steps;
  const stepDelay = duration / steps;

  // Find the scrollable tabpanel container (RLHF tab uses overflow-auto)
  // If no tabpanel, fall back to window scrolling
  for (let i = 0; i < steps; i++) {
    await page.evaluate((scroll) => {
      // Try to find the RLHF tabpanel (overflow-auto container)
      const tabpanel = document.querySelector('[role="tabpanel"].overflow-auto');
      if (tabpanel) {
        tabpanel.scrollBy(0, scroll);
      } else {
        // Fallback to window scroll
        window.scrollBy(0, scroll);
      }
    }, stepAmount);
    await sleep(stepDelay);
  }
}

async function scrollElementIntoView(page: Page, selector: string) {
  await page.evaluate((sel) => {
    const element = document.querySelector(sel);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, selector);
  await sleep(500);
}

async function record() {
  const version = await getNextVersion();
  const videoPath = path.join(OUTPUT_DIR, `${VIDEO_NAME}-v${version}-${DATE}.webm`);

  console.log(`Recording: ${videoPath}`);

  const browser = await chromium.launch({
    headless: false,
    slowMo: 200 // Slightly slower for better visibility
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
    // === SCENE 1: Landing - establish context ===
    console.log('Scene 1: Landing page - The Betabase');
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await sleep(3000); // Let viewer see the landing page

    // === SCENE 2: Navigate to Curate ===
    console.log('Scene 2: Click Curate tab');
    await waitForContent(page, 'button:has-text("Curate")');
    await sleep(1000); // Pause before clicking
    await page.click('button:has-text("Curate")');
    await sleep(2500); // Let Curate tab load

    // === SCENE 3: Navigate to RLHF ===
    console.log('Scene 3: Click RLHF tab');
    await waitForContent(page, 'button:has-text("RLHF")');
    await sleep(1000);
    await page.click('button:has-text("RLHF")');

    // === SCENE 4: Wait for RLHF content to fully load ===
    console.log('Scene 4: Waiting for feedback cards to load');
    // Wait for loading to finish - look for actual content
    await sleep(2000);

    // Try to wait for feedback card content
    const cardLoaded = await waitForContent(page, 'text="How do I configure"', 8000) ||
                       await waitForContent(page, 'text="What\'s the difference"', 3000) ||
                       await waitForContent(page, '[class*="card"]', 3000);

    if (!cardLoaded) {
      console.log('Waiting extra time for content...');
      await sleep(5000);
    }

    await sleep(2000); // Extra pause to show loaded content

    // === SCENE 5: Smooth scroll to reveal feedback cards ===
    console.log('Scene 5: Scrolling to show feedback cards');
    await smoothScroll(page, 400, 1500);
    await sleep(2000);

    // === SCENE 6: Click on a feedback card to expand it ===
    console.log('Scene 6: Expanding a feedback card');
    const cardSelectors = [
      'text="How do I configure asset metadata"',
      'text="What\'s the difference between a product"',
      'text="How do I troubleshoot"',
      'text="Can I bulk update"',
      'text="What reports are available"'
    ];

    let cardClicked = false;
    for (const selector of cardSelectors) {
      const element = page.locator(selector).first();
      if (await element.isVisible({ timeout: 1500 }).catch(() => false)) {
        console.log(`Found card: ${selector}`);
        await sleep(500);
        await element.click();
        cardClicked = true;
        await sleep(2500); // Let card expand
        break;
      }
    }

    if (!cardClicked) {
      // Try clicking any visible card-like element
      const anyCard = page.locator('[class*="cursor-pointer"]').first();
      if (await anyCard.isVisible({ timeout: 1000 }).catch(() => false)) {
        await anyCard.click();
        await sleep(2500);
      }
    }

    // === SCENE 7: Show retrieved documents ===
    console.log('Scene 7: Viewing retrieved documents');
    await smoothScroll(page, 200, 1000);
    await sleep(3000); // Let viewer see the documents

    // === SCENE 8: Mark response as Helpful ===
    console.log('Scene 8: Marking response as Helpful');
    const helpfulBtn = page.locator('button:has-text("Helpful")').first();
    if (await helpfulBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await sleep(500);
      await helpfulBtn.click();
      await sleep(2000);
      console.log('Clicked Helpful!');
    }

    // === SCENE 9: Mark document relevance ===
    console.log('Scene 9: Marking document as Relevant');
    const relevantBtn = page.locator('button:has-text("Relevant")').first();
    if (await relevantBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await sleep(500);
      await relevantBtn.click();
      await sleep(2000);
      console.log('Marked document as Relevant!');
    }

    // === SCENE 10: Final overview ===
    console.log('Scene 10: Final state - showing the curation in action');
    await smoothScroll(page, -300, 1000); // Scroll back up slightly
    await sleep(4000); // Long pause to end

    console.log('Recording complete!');

  } catch (error) {
    console.error('Error during recording:', error);
  } finally {
    await page.close();
    await context.close();
    await browser.close();
  }

  // Find and rename the video file
  await sleep(1500);
  const files = fs.readdirSync(OUTPUT_DIR);
  const latestVideo = files
    .filter(f => f.endsWith('.webm') && !f.startsWith(VIDEO_NAME) && !f.includes('feedback-loop') && !f.includes('quality-review'))
    .sort()
    .pop();

  if (latestVideo) {
    const oldPath = path.join(OUTPUT_DIR, latestVideo);
    fs.renameSync(oldPath, videoPath);
    console.log(`\nSaved as: ${videoPath}`);
  }
}

record().catch(console.error);
