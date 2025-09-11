/*
  AOMA Stage Login Helper (Headed)
  - Navigates to AOMA stage URL
  - Fills AAD username/password
  - Pauses for MFA approval
  - Saves storage to tmp/aoma-stage-storage.json and Cookie header to tmp/aoma-cookie.txt

  Usage:
    AAD_USERNAME=you@company.com AAD_PASSWORD='your-pass' node scripts/aoma-stage-login.js
*/

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const STAGE_URL = process.env.AOMA_STAGE_URL || 'https://aoma-stage.smcdp-de.net';
const AAD_USERNAME = process.env.AAD_USERNAME || '';
const AAD_PASSWORD = process.env.AAD_PASSWORD || '';
const OUT_DIR = path.resolve(process.cwd(), 'tmp');
const STORAGE_FILE = path.join(OUT_DIR, 'aoma-stage-storage.json');
const COOKIE_FILE = path.join(OUT_DIR, 'aoma-cookie.txt');

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

(async () => {
  if (!AAD_USERNAME || !AAD_PASSWORD) {
    console.error('Missing AAD_USERNAME or AAD_PASSWORD env vars.');
    process.exit(1);
  }
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: false, slowMo: 100 });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log(`Navigating to ${STAGE_URL} ...`);
  await page.goto(STAGE_URL, { waitUntil: 'load', timeout: 120000 }).catch(() => {});

  // Expect redirect to Microsoft login
  // Page 1: username
  try {
    await page.waitForSelector('input[name="loginfmt"]', { timeout: 60000 });
    await page.fill('input[name="loginfmt"]', AAD_USERNAME);
    await page.click('input[type="submit"], button[type="submit"], #idSIButton9');
  } catch (e) {
    console.warn('Username step may be skipped or not visible:', e.message);
  }

  // Page 2: password
  try {
    await page.waitForSelector('input[name="passwd"]', { timeout: 60000 });
    await page.fill('input[name="passwd"]', AAD_PASSWORD);
    await page.click('input[type="submit"], button[type="submit"], #idSIButton9');
  } catch (e) {
    console.warn('Password step may be skipped or not visible:', e.message);
  }

  // MFA: wait up to 2 minutes for host to become the stage host
  const stageHost = new URL(STAGE_URL).host;
  console.log('Waiting for MFA approval (up to 2 minutes)...');
  const start = Date.now();
  while (Date.now() - start < 120000) {
    try {
      const url = page.url();
      const host = new URL(url).host;
      if (host === stageHost) break;
    } catch {}
    // Handle "Stay signed in?" prompt
    const stayYes = await page.$('#idSIButton9').catch(() => null);
    if (stayYes) {
      try { await stayYes.click(); } catch {}
    }
    await sleep(1500);
  }

  // Save storage
  await context.storageState({ path: STORAGE_FILE });
  console.log(`Saved storage state to ${STORAGE_FILE}`);

  // Export Cookie header
  const cookies = await context.cookies();
  const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join('; ');
  fs.writeFileSync(COOKIE_FILE, cookieHeader);
  console.log(`Saved Cookie header to ${COOKIE_FILE}`);

  await browser.close();
  console.log('Login helper completed.');
})().catch(err => {
  console.error('Login helper error:', err);
  process.exit(1);
});


