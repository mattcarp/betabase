/**
 * Record Curate Video 3: Cumulative Impact / Learning Curve
 *
 * Demonstrates: AI improves because of humans
 * - Click on stats cards to explore details
 * - Toggle view options
 * - Filter feedback by status
 * - Show real data interaction
 *
 * ARTISTIC VISION: Interactive exploration of metrics, not just passive viewing
 */

import { chromium, Page } from 'playwright';
import * as path from 'path';
import * as fs from 'fs';

const OUTPUT_DIR = path.join(process.env.HOME!, 'Desktop/playwright-screencasts/curate');
const VIDEO_NAME = 'curate-quality-review';
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
    slowMo: 70 // Fast but readable
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

    // === SCENE 3: Click on a stat card (Total Feedback or similar) ===
    console.log('Scene 3: Click stat card');
    const statCardSelectors = [
      '[data-testid="stats-card"]',
      '.cursor-pointer:has-text("Total")',
      '.cursor-pointer:has-text("Feedback")',
      'div[class*="card"]:has-text("Total")',
      'button:has-text("View")'
    ];

    for (const sel of statCardSelectors) {
      const card = page.locator(sel).first();
      if (await card.isVisible({ timeout: 1000 }).catch(() => false)) {
        await card.click();
        console.log('Clicked stat card!');
        await sleep(1000);
        break;
      }
    }

    // === SCENE 4: Look for filter/dropdown and click it ===
    console.log('Scene 4: Find filter control');
    const filterSelectors = [
      'select',
      'button:has-text("Filter")',
      'button:has-text("All")',
      '[data-testid="filter"]',
      'button[aria-haspopup="listbox"]',
      'button[role="combobox"]'
    ];

    for (const sel of filterSelectors) {
      const filter = page.locator(sel).first();
      if (await filter.isVisible({ timeout: 800 }).catch(() => false)) {
        await filter.click();
        console.log('Clicked filter!');
        await sleep(800);

        // Try to select an option
        const optionSelectors = [
          '[role="option"]',
          'option',
          'li[data-value]',
          '.select-option'
        ];

        for (const optSel of optionSelectors) {
          const opt = page.locator(optSel).first();
          if (await opt.isVisible({ timeout: 500 }).catch(() => false)) {
            await opt.click();
            console.log('Selected filter option!');
            await sleep(800);
            break;
          }
        }
        break;
      }
    }

    // === SCENE 5: Navigate to RLHF tab ===
    console.log('Scene 5: Click RLHF');
    await waitFor(page, 'button:has-text("RLHF")');
    await page.click('button:has-text("RLHF")');
    await sleep(1200);

    // === SCENE 6: Click on a feedback card to expand ===
    console.log('Scene 6: Click feedback card');
    const cardSelectors = [
      'text=/How do I|What is|Can I/',
      '[data-testid="feedback-card"]',
      '.cursor-pointer'
    ];

    for (const sel of cardSelectors) {
      const card = page.locator(sel).first();
      if (await card.isVisible({ timeout: 1000 }).catch(() => false)) {
        await card.click();
        console.log('Card expanded!');
        await sleep(1000);
        break;
      }
    }

    // === SCENE 7: Click a toggle or checkbox if available ===
    console.log('Scene 7: Toggle/checkbox interaction');
    const toggleSelectors = [
      '[role="checkbox"]',
      '[role="switch"]',
      'input[type="checkbox"]',
      'button[aria-pressed]'
    ];

    for (const sel of toggleSelectors) {
      const toggle = page.locator(sel).first();
      if (await toggle.isVisible({ timeout: 800 }).catch(() => false)) {
        await toggle.click();
        console.log('Toggled element!');
        await sleep(800);
        break;
      }
    }

    // === SCENE 8: Click back to Overview ===
    console.log('Scene 8: Return to Overview');
    const overviewBtn = page.locator('button:has-text("Overview")').first();
    if (await overviewBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await overviewBtn.click();
      await sleep(1000);
    }

    // === SCENE 9: Hover over a chart element if available ===
    console.log('Scene 9: Chart interaction');
    const chartSelectors = [
      'svg rect',
      'svg path',
      '[data-testid="chart"]',
      '.recharts-bar',
      '.recharts-line'
    ];

    for (const sel of chartSelectors) {
      const chartEl = page.locator(sel).first();
      if (await chartEl.isVisible({ timeout: 800 }).catch(() => false)) {
        await chartEl.hover();
        console.log('Hovered chart element!');
        await sleep(1000);
        break;
      }
    }

    // === SCENE 10: Final pause ===
    console.log('Scene 10: Final');
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
    .filter(f => f.endsWith('.webm') && !f.startsWith(VIDEO_NAME) && !f.includes('rlhf-workflow') && !f.includes('feedback-loop'))
    .sort()
    .pop();

  if (latestVideo) {
    const oldPath = path.join(OUTPUT_DIR, latestVideo);
    fs.renameSync(oldPath, videoPath);
    console.log(`Saved as: ${videoPath}`);
  }
}

record().catch(console.error);
