/**
 * Record Curate Video 2: Correction Flow
 *
 * Demonstrates: AI learns from human expertise
 * - Human catches AI mistake
 * - Types in correct answer from institutional knowledge
 * - That correction becomes training data
 *
 * ARTISTIC VISION: Show typing, interaction, human expertise being captured
 */

import { chromium, Page } from 'playwright';
import * as path from 'path';
import * as fs from 'fs';

const OUTPUT_DIR = path.join(process.env.HOME!, 'Desktop/playwright-screencasts/curate');
const VIDEO_NAME = 'curate-feedback-loop';
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

async function waitFor(page: Page, selector: string, timeout = 8000): Promise<boolean> {
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
    slowMo: 60 // Fast but readable
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
    await sleep(1200);

    // === SCENE 2: Navigate to Curate ===
    console.log('Scene 2: Click Curate');
    await waitFor(page, 'button:has-text("Curate")');
    await page.click('button:has-text("Curate")');
    await sleep(1200);

    // === SCENE 3: Navigate to RLHF ===
    console.log('Scene 3: Click RLHF');
    await waitFor(page, 'button:has-text("RLHF")');
    await page.click('button:has-text("RLHF")');
    await sleep(1500);

    // === SCENE 4: Click on a feedback card ===
    console.log('Scene 4: Select feedback card');
    const cardSelectors = [
      'text=/How do I|What is|Can I/',
      '[data-testid="feedback-card"]',
      '.cursor-pointer'
    ];

    for (const sel of cardSelectors) {
      const card = page.locator(sel).first();
      if (await card.isVisible({ timeout: 1000 }).catch(() => false)) {
        await card.click();
        console.log('Card clicked!');
        await sleep(1000);
        break;
      }
    }

    // === SCENE 5: Click thumbs DOWN (Not Helpful) ===
    console.log('Scene 5: Click Not Helpful/ThumbsDown');
    const thumbsDownSelectors = [
      'button:has-text("Not Helpful")',
      'button[aria-label*="not helpful"]',
      'button[aria-label*="thumbs down"]',
      '[data-testid="thumbs-down"]'
    ];

    for (const sel of thumbsDownSelectors) {
      const btn = page.locator(sel).first();
      if (await btn.isVisible({ timeout: 800 }).catch(() => false)) {
        await btn.click();
        console.log('Clicked thumbs down!');
        await sleep(1000);
        break;
      }
    }

    // === SCENE 6: Find and click on textarea/input ===
    console.log('Scene 6: Focus correction input');
    const inputSelectors = [
      'textarea[placeholder*="correction"]',
      'textarea[placeholder*="feedback"]',
      'textarea[placeholder*="comment"]',
      'textarea[placeholder*="Add"]',
      'textarea',
      'input[placeholder*="correction"]'
    ];

    let foundInput = false;
    for (const sel of inputSelectors) {
      const input = page.locator(sel).first();
      if (await input.isVisible({ timeout: 800 }).catch(() => false)) {
        await input.click();
        foundInput = true;
        console.log('Found input field!');
        await sleep(500);
        break;
      }
    }

    // === SCENE 7: Type correction with visible keystrokes ===
    if (foundInput) {
      console.log('Scene 7: Type correction');
      const correction = "Per Q3 policy update: Use the new asset classification system. See KB-2847 for details.";
      await page.keyboard.type(correction, { delay: 35 }); // Visible typing speed
      await sleep(1500);
    }

    // === SCENE 8: Click Submit/Save ===
    console.log('Scene 8: Submit correction');
    const submitSelectors = [
      'button:has-text("Submit")',
      'button:has-text("Save")',
      'button:has-text("Send")',
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

    // === SCENE 9: Show success feedback ===
    console.log('Scene 9: Success confirmation');
    await sleep(2000); // Let toast appear

    // === SCENE 10: Brief pause ===
    console.log('Scene 10: Final');
    await sleep(1000);

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
    .filter(f => f.endsWith('.webm') && !f.startsWith(VIDEO_NAME) && !f.includes('rlhf-workflow') && !f.includes('quality-review'))
    .sort()
    .pop();

  if (latestVideo) {
    const oldPath = path.join(OUTPUT_DIR, latestVideo);
    fs.renameSync(oldPath, videoPath);
    console.log(`Saved as: ${videoPath}`);
  }
}

record().catch(console.error);
