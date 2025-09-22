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

  // Some gateways show a landing with "Employee Login" before AAD
  async function clickEmployeeLogin(frame) {
    const tries = [
      () => frame.locator('#aadLoginBtn'),
      () => frame.getByRole('button', { name: /employee\s*login/i }),
      () => frame.locator('button:has-text("Employee Login")'),
      () => frame.locator('text=/^\s*Employee\s+Login\s*$/i'),
      () => frame.locator('input[type="submit"][value*="Employee" i]')
    ];
    for (const get of tries) {
      try {
        const loc = get();
        if (await loc.first().isVisible({ timeout: 2000 }).catch(() => false)) {
          console.log('Clicking "Employee Login"...');
          await loc.first().click();
          await frame.waitForLoadState('domcontentloaded', { timeout: 60000 }).catch(()=>{});
          return true;
        }
      } catch {}
    }
    return false;
  }
  // Try on main page and any iframes
  let clicked = await clickEmployeeLogin(page);
  if (!clicked) {
    for (const f of page.frames()) {
      if (f === page.mainFrame()) continue;
      if (await clickEmployeeLogin(f)) { clicked = true; break; }
    }
  }
  if (!clicked) console.log('Employee Login button not detected (may not be required).');

  // Expect redirect to Microsoft login
  // AAD sequence (more robust): username -> password -> stay signed in
  const aadHostRegex = /(login\.microsoftonline\.com|microsoftonline|sts|adfs)/i;
  const stageHost = new URL(STAGE_URL).host;
  const deadline = Date.now() + 240000; // up to 4 minutes to traverse flows + MFA
  while (Date.now() < deadline) {
    const url = page.url();
    const host = (() => { try { return new URL(url).host; } catch { return ''; } })();

    // If we're already back on stage, stop
    if (host === stageHost) break;

    // Handle username field
    try {
      const userField = page.locator('input[name="loginfmt"], #i0116').first();
      if (await userField.isVisible({ timeout: 500 }).catch(()=>false)) {
        await userField.fill(AAD_USERNAME).catch(async ()=>{ await userField.type(AAD_USERNAME, { delay: 15 }); });
        await page.locator('#idSIButton9, input[type="submit"], button[type="submit"]').first().click().catch(()=>{});
        await page.waitForTimeout(600);
        continue;
      }
    } catch {}

    // Handle password field
    try {
      const pwField = page.locator('input[name="pwd"], input[name="passwd"], #i0118, input[type="password"]').first();
      if (await pwField.isVisible({ timeout: 800 }).catch(()=>false)) {
        await pwField.fill(AAD_PASSWORD).catch(async ()=>{ await pwField.type(AAD_PASSWORD, { delay: 20 }); });
        await page.locator('#idSIButton9, input[type="submit"], button[type="submit"]').first().click().catch(()=>{});
        await page.waitForTimeout(800);
        continue;
      }
    } catch {}

    // Handle stay signed in / continue
    try {
      const btn = page.locator('#idSIButton9').first();
      if (await btn.isVisible({ timeout: 500 }).catch(()=>false)) {
        await btn.click().catch(()=>{});
        await page.waitForTimeout(600);
        continue;
      }
    } catch {}

    await page.waitForTimeout(700);
  }

  // MFA: wait up to 2 minutes for host to become the stage host
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

  // Ensure we are back on stage host before saving
  const finalDeadline = Date.now() + 180000; // up to 3 more minutes for MFA
  while (Date.now() < finalDeadline) {
    try {
      if (new URL(page.url()).host === stageHost) break;
    } catch {}
    await page.waitForTimeout(1000);
  }

  const atStage = (() => { try { return new URL(page.url()).host === stageHost; } catch { return false; }})();
  if (atStage) {
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
  } else {
    console.log('Still on AAD; waiting for you to complete password/MFA in the open window...');
    // Keep browser open for manual completion
    // Periodically print status
    const tick = setInterval(async () => {
      try {
        const u = page.url();
        console.log('Current URL:', u);
        if (new URL(u).host === stageHost) {
          clearInterval(tick);
          await context.storageState({ path: STORAGE_FILE });
          const cookies = await context.cookies();
          const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join('; ');
          fs.writeFileSync(COOKIE_FILE, cookieHeader);
          console.log('Session saved after manual completion.');
          await browser.close();
        }
      } catch {}
    }, 3000);
  }
})().catch(err => {
  console.error('Login helper error:', err);
  process.exit(1);
});


