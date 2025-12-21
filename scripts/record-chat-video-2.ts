/**
 * Record Chat Video 2: CD Text Binary Parsing
 *
 * THE SHOWSTOPPER DEMO
 *
 * Demonstrates:
 * - DDP/Red Book spec knowledge
 * - Binary file parsing from raw hex
 * - Track listing extraction with translations
 * - Multi-language code generation (Rust)
 * - Code-switching (Mandarin Chinese explanation + Rust code)
 *
 * ARTISTIC VISION: The AI parses incomprehensible hex data into beautiful
 * structured information, then generates production code in any language
 * while responding in any human language.
 */

import { chromium, Page } from 'playwright';
import * as path from 'path';
import * as fs from 'fs';
import { execSync } from 'child_process';

const OUTPUT_DIR = path.join(process.env.HOME!, 'Desktop/playwright-screencasts/chat');
const VIDEO_NAME = 'chat-cdtext-parsing';
const DATE = new Date().toISOString().split('T')[0];

// Eros Ramazzotti album - real CD Text binary data
const CDTEXT_HEX = `80000000 5374696C 656C6962 65726F00 F7C18001 01004C27 4F6D6272 61204465 6C20A216 8001020C 47696761 6E746500 46756F63 D3F48002 03046F20 4E656C20 46756F63 6F0083ED 80030400 4C6F2053 70697269 746F2044 391E8003 050C6567 6C692041 6C626572 69008557 80040600 556E2041 6E67656C 6F204E6F 3CA18004 070C6E20 4527004C 27417175 696C6FAA 80050807 61204520 496C2043 6F6E646F 3D318005 090F7200 5069C3B9 20436865 2050ED00 80060A0A 756F6900 496C204D 696F2041 340A8007 0B086D6F 72652050 65722054 65003A60 80080C00 4520416E 636F7261 204D6920 43BF648008 0D0C6869 65646F00 496D7072 6F76DD68 80090E06 76697361 204C7563 65204164 030C8009 0F0F2045 7374004E 656C6C27 417A4B15 800A1007 7A757272 6974C3A0 00416D69 37F2800B 11036361 20446F6E 6E61204D 69612726 800B120F 00506572 204D6520 50657220 2060800C 130B5365 6D707265 00000000 0000D11C 81001400 45726F73 2052616D 617A7A6F AE778100 150C7474 69000000 00000000 00001CC6 81091600 00000000 00000000 00000000 1B838600 17003734 33323137 39323233 32000008 87001800 00000000 00000000 00000000 B28D8E00 19003734 33323137 39323233 3230C7D2 8E001A0C 004E4C41 32303030 30303039 3D1E8E01 1B0B3300 4E4C4132 30303030 30306041 8E021C0A 3834004E 4C413230 30303030 0A788E03 1D093039 32004E4C 41323030 3030D584 8E041E08 30303839 004E4C41 32303030 E5568E05 1F073030 30383600 4E4C4132 30306471 8E062006 30303030 3935004E 4C413230 A2F98E07 21053030 30303039 31004E4C 4132D53E 8E082204 30303030 30303837 004E4C41 D0368E09 23033230 30303030 30383800 4E4CB9BB 8E0A2402 41323030 30303030 3934004E 2D1A8E0B 25014C41 32303030 30303039 30002270 8E0C2600 4E4C4132 30303030 30303835 66AA8E0C 270C0000 00000000 00000000 00007979 8F002800 00010C00 14030000 00000101 0E4C8F01 29000000 00000000 0F032A00 00005999 8F022A00 00000000 09000000 00000000 1A2200`;

async function getNextVersion(): Promise<number> {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
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

async function typeSlowly(page: Page, selector: string, text: string, delayMs = 50) {
  await page.click(selector);
  for (const char of text) {
    await page.keyboard.type(char, { delay: delayMs });
  }
}

async function waitForAIResponse(page: Page, minWaitMs = 5000, maxWaitMs = 90000): Promise<boolean> {
  console.log('Waiting for AI response...');
  await sleep(minWaitMs);

  // Check for response indicators
  const startTime = Date.now();
  while (Date.now() - startTime < maxWaitMs) {
    // Look for loading indicator disappearing or response appearing
    const isLoading = await page.locator('[class*="loading"], [class*="spinner"], [class*="animate-pulse"]')
      .first()
      .isVisible({ timeout: 1000 })
      .catch(() => false);

    if (!isLoading) {
      // Give extra time for content to render
      await sleep(2000);
      return true;
    }
    await sleep(1000);
  }
  return false;
}

async function smoothScroll(page: Page, amount: number, duration = 1000) {
  const steps = 20;
  const stepAmount = amount / steps;
  const stepDelay = duration / steps;

  for (let i = 0; i < steps; i++) {
    await page.evaluate((scroll) => {
      // Try to find chat message container
      const chatContainer = document.querySelector('[class*="overflow-y-auto"]');
      if (chatContainer) {
        chatContainer.scrollBy(0, scroll);
      } else {
        window.scrollBy(0, scroll);
      }
    }, stepAmount);
    await sleep(stepDelay);
  }
}

async function ensureInputVisible(page: Page) {
  // Scroll the chat input into view with padding so it's fully visible
  await page.evaluate(() => {
    const input = document.querySelector('textarea, input[type="text"], [contenteditable="true"]');
    if (input) {
      // Scroll the input into view with some bottom padding
      input.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });
  await sleep(500);
}

async function record() {
  const version = await getNextVersion();
  const videoPath = path.join(OUTPUT_DIR, `${VIDEO_NAME}-v${version}-${DATE}.webm`);

  console.log(`Recording: ${videoPath}`);
  console.log('This demo showcases CD Text binary parsing - THE SHOWSTOPPER');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 150
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }, // Standard HD
    recordVideo: {
      dir: OUTPUT_DIR,
      size: { width: 1920, height: 1080 }
    }
  });

  context.on('page', page => {
    page.on('pageerror', err => console.log('Page error:', err.message));
  });

  const page = await context.newPage();

  try {
    // === SCENE 1: Landing page ===
    console.log('Scene 1: Landing page');
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await sleep(2000);

    // === SCENE 2: Navigate to Chat ===
    console.log('Scene 2: Click Chat tab');
    await waitForContent(page, 'button:has-text("Chat")');
    await sleep(500);
    await page.click('button:has-text("Chat")');
    await sleep(2000);

    // === SCENE 3: Single Combined Question (DDP + CD Text + Hex) ===
    console.log('Scene 3: Combined DDP/CD-TEXT question with hex data');
    const chatInput = 'textarea, input[type="text"], [contenteditable="true"]';
    await waitForContent(page, chatInput);

    // Ensure input is fully visible before typing
    await ensureInputVisible(page);

    // Click and type the question
    await page.click(chatInput);
    await sleep(300);

    // Type the question first
    await page.keyboard.type("I have a folder that I think is a DDP master. It has this file called cdtext.bin - can you figure out all this mumbo jumbo hexadecimal data?", { delay: 25 });
    await page.keyboard.press('Enter');
    await page.keyboard.press('Enter');
    await sleep(500);

    // Set system clipboard and paste (like a real user would do)
    execSync(`echo "${CDTEXT_HEX}" | pbcopy`);
    await sleep(300);
    await page.keyboard.press('Meta+v'); // Cmd+V to paste
    await sleep(1500); // Let viewer see the hex data
    await page.keyboard.press('Enter');

    // Wait for combined response (DDP explanation + parsed CD-TEXT)
    console.log('Waiting for DDP explanation + CD Text parsing... (this may take 45-90 seconds)');
    await waitForAIResponse(page, 20000, 120000);
    await sleep(3000);

    // Scroll through the response to show:
    // - DDP/CD-TEXT explanation
    // - Parsed track table
    // - Artist spotlight
    // - MusicBrainz links
    await smoothScroll(page, 400, 1500);
    await sleep(3000);

    await smoothScroll(page, 400, 1500);
    await sleep(3000);

    await smoothScroll(page, 400, 1500);
    await sleep(3000);

    // === SCENE 4: MusicBrainz Lookup ===
    console.log('Scene 4: Ask for MusicBrainz lookup');
    await ensureInputVisible(page);

    const musicbrainzPrompt = "Yes, please look it up in MusicBrainz!";
    await page.click(chatInput);
    await sleep(300);
    await typeSlowly(page, chatInput, musicbrainzPrompt, 40);
    await sleep(500);
    await page.keyboard.press('Enter');

    // Wait for MusicBrainz lookup response
    console.log('Waiting for MusicBrainz lookup...');
    await waitForAIResponse(page, 10000, 60000);
    await sleep(3000);

    // Scroll to see MusicBrainz results
    await smoothScroll(page, 300, 1000);
    await sleep(4000); // Pause on the MusicBrainz results

    // === SCENE 5: THE SHOWSTOPPER - Rust + Mandarin ===
    console.log('Scene 5: THE SHOWSTOPPER - Rust code + Mandarin Chinese');

    // Ensure input is fully visible before the showstopper question
    await ensureInputVisible(page);

    const showstopperPrompt = "Amazing! Could you write that parser code so I can use it myself? Write it in Rust. And explain it in Mandarin Chinese.";

    await page.click(chatInput);
    await sleep(300);
    await typeSlowly(page, chatInput, showstopperPrompt, 35);
    await sleep(500);
    await page.keyboard.press('Enter');

    // Wait for the multi-language response
    console.log('Waiting for Rust + Mandarin response... (may take 45-90 seconds)');
    await waitForAIResponse(page, 20000, 120000);
    await sleep(3000);

    // Scroll through the code
    await smoothScroll(page, 400, 1500);
    await sleep(3000);

    // Show more of the response
    await smoothScroll(page, 400, 1500);
    await sleep(4000);

    // Final scroll to show complete response
    await smoothScroll(page, 300, 1000);
    await sleep(5000); // Long pause on the finale

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
    .filter(f => f.endsWith('.webm') && !f.startsWith(VIDEO_NAME))
    .sort()
    .pop();

  if (latestVideo) {
    const oldPath = path.join(OUTPUT_DIR, latestVideo);
    fs.renameSync(oldPath, videoPath);
    console.log(`\nSaved as: ${videoPath}`);
    console.log('\nDemo captured:');
    console.log('  1. DDP spec knowledge');
    console.log('  2. CD Text binary parsing');
    console.log('  3. Track listing with translations');
    console.log('  4. THE SHOWSTOPPER: Rust code + Mandarin Chinese');
  }
}

record().catch(console.error);
