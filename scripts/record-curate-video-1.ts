/**
 * Record Curate Video 1: Document Relevance Marking
 *
 * Demonstrates: AI needs human judgment
 * - Human curator reviews AI-retrieved documents
 * - Marks which ones were actually relevant
 * - Shows expertise the AI doesn't have
 *
 * ARTISTIC VISION: Fast-paced, action-oriented demo showing real interactions
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

async function waitForContent(page: Page, selector: string, timeout = 10000): Promise<boolean> {
  try {
    await page.waitForSelector(selector, { timeout, state: 'visible' });
    return true;
  } catch {
    return false;
  }
}

async function record() {
  const version = await getNextVersion();
  const videoPath = path.join(OUTPUT_DIR, `${VIDEO_NAME}-v${version}-${DATE}.webm`);

  console.log(`Recording: ${videoPath}`);

  const browser = await chromium.launch({
    headless: false,
    slowMo: 80 // Faster for action-oriented feel
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    recordVideo: {
      dir: OUTPUT_DIR,
      size: { width: 1280, height: 800 }
    }
  });

  const page = await context.newPage();

  try {
    // === SCENE 1: Quick landing ===
    console.log('Scene 1: Landing');
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await sleep(1500);

    // === SCENE 2: Navigate to Curate ===
    console.log('Scene 2: Click Curate');
    await waitForContent(page, 'button:has-text("Curate")');
    await page.click('button:has-text("Curate")');
    await sleep(1500);

    // === SCENE 3: Navigate to RLHF ===
    console.log('Scene 3: Click RLHF');
    await waitForContent(page, 'button:has-text("RLHF")');
    await page.click('button:has-text("RLHF")');
    await sleep(2000);

    // === SCENE 4: Click on first feedback card to expand ===
    console.log('Scene 4: Expand feedback card');
    // Look for clickable cards in the feedback list
    const cardSelectors = [
      '[data-testid="feedback-card"]',
      '.cursor-pointer:has-text("How")',
      '.cursor-pointer:has-text("What")',
      'div[class*="card"]:has-text("configure")',
      'div[class*="card"]:has-text("troubleshoot")'
    ];

    let expanded = false;
    for (const sel of cardSelectors) {
      const card = page.locator(sel).first();
      if (await card.isVisible({ timeout: 1000 }).catch(() => false)) {
        await card.click();
        expanded = true;
        console.log('Card expanded!');
        await sleep(1500);
        break;
      }
    }

    // If no card found, try clicking any text that looks like a question
    if (!expanded) {
      const questionText = page.locator('text=/How do I|What is|Can I/').first();
      if (await questionText.isVisible({ timeout: 1000 }).catch(() => false)) {
        await questionText.click();
        await sleep(1500);
      }
    }

    // === SCENE 5: Click thumbs up (Helpful) ===
    console.log('Scene 5: Click Helpful/ThumbsUp');
    const thumbsUpSelectors = [
      'button:has-text("Helpful")',
      'button[aria-label*="helpful"]',
      'button[aria-label*="thumbs up"]',
      '[data-testid="thumbs-up"]',
      'button:has(svg[class*="ThumbsUp"])'
    ];

    for (const sel of thumbsUpSelectors) {
      const btn = page.locator(sel).first();
      if (await btn.isVisible({ timeout: 800 }).catch(() => false)) {
        await btn.click();
        console.log('Clicked thumbs up!');
        await sleep(1000);
        break;
      }
    }

    // === SCENE 6: Mark a document as Relevant ===
    console.log('Scene 6: Mark document Relevant');
    const relevantSelectors = [
      'button:has-text("Relevant")',
      'button:has-text("relevant")',
      '[data-testid="mark-relevant"]',
      'button[aria-label*="relevant"]'
    ];

    for (const sel of relevantSelectors) {
      const btn = page.locator(sel).first();
      if (await btn.isVisible({ timeout: 800 }).catch(() => false)) {
        await btn.click();
        console.log('Marked relevant!');
        await sleep(1000);
        break;
      }
    }

    // === SCENE 7: Mark another document as Not Relevant ===
    console.log('Scene 7: Mark document Not Relevant');
    const notRelevantSelectors = [
      'button:has-text("Not Relevant")',
      'button:has-text("Irrelevant")',
      '[data-testid="mark-irrelevant"]'
    ];

    for (const sel of notRelevantSelectors) {
      const btn = page.locator(sel).nth(1); // Second one if available
      if (await btn.isVisible({ timeout: 800 }).catch(() => false)) {
        await btn.click();
        console.log('Marked not relevant!');
        await sleep(1000);
        break;
      }
    }

    // === SCENE 8: Submit/Save feedback ===
    console.log('Scene 8: Submit feedback');
    const submitSelectors = [
      'button:has-text("Submit")',
      'button:has-text("Save")',
      'button:has-text("Done")',
      'button[type="submit"]'
    ];

    for (const sel of submitSelectors) {
      const btn = page.locator(sel).first();
      if (await btn.isVisible({ timeout: 800 }).catch(() => false)) {
        await btn.click();
        console.log('Submitted!');
        await sleep(1500);
        break;
      }
    }

    // === SCENE 9: Show toast/confirmation ===
    console.log('Scene 9: Show confirmation');
    await sleep(2000); // Let any toast appear

    // === SCENE 10: Brief final view ===
    console.log('Scene 10: Final view');
    await sleep(1500);

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
