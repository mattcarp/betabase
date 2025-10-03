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
const { execSync } = require('child_process');

const STAGE_URL = process.env.AOMA_STAGE_URL || 'https://aoma-stage.smcdp-de.net';
const AAD_USERNAME = process.env.AAD_USERNAME || '';
const AAD_PASSWORD = process.env.AAD_PASSWORD || '';
const OUT_DIR = path.resolve(process.cwd(), 'tmp');
const STORAGE_FILE = path.join(OUT_DIR, 'aoma-stage-storage.json');
const COOKIE_FILE = path.join(OUT_DIR, 'aoma-cookie.txt');

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function checkGlobalProtectVPN() {
  try {
    // Check if GlobalProtect VPN process is running
    const output = execSync('scutil --nc list 2>/dev/null || echo ""').toString();
    if (output.includes('GlobalProtect') || output.includes('Connected')) {
      return true;
    }

    // Alternative: check network interfaces for VPN
    const ifconfig = execSync('ifconfig 2>/dev/null || echo ""').toString();
    if (ifconfig.includes('utun') || ifconfig.includes('ppp')) {
      return true;
    }

    return false;
  } catch (e) {
    console.warn('⚠️  Could not verify VPN status');
    return null; // Unknown
  }
}

(async () => {
  if (!AAD_USERNAME || !AAD_PASSWORD) {
    console.error('Missing AAD_USERNAME or AAD_PASSWORD env vars.');
    process.exit(1);
  }

  // Check VPN status
  const vpnStatus = checkGlobalProtectVPN();
  if (vpnStatus === false) {
    console.error('❌ GlobalProtect VPN is NOT connected!');
    console.error('🔐 Please connect to GlobalProtect VPN before accessing AOMA stage.');
    console.error('   The AOMA stage environment requires VPN access.');
    process.exit(1);
  } else if (vpnStatus === true) {
    console.log('✅ GlobalProtect VPN detected');
  } else {
    console.warn('⚠️  Could not verify VPN status - proceeding anyway...');
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });

  const browser = await chromium.launch({
    headless: false,
    slowMo: 100,
    args: [
      '--use-mock-keychain',
      '--password-store=basic'
    ]
  });
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
  let usernameFilled = false;
  let passwordFilled = false;

  while (Date.now() < deadline) {
    const url = page.url();
    const host = (() => { try { return new URL(url).host; } catch { return ''; } })();

    // If we're already back on stage, stop
    if (host === stageHost) break;

    // Handle Jamf Pro device registration redirect
    if (url.includes('jss.sonymusic.com') || url.includes('jamf')) {
      console.log('⚠️  Jamf device registration detected - navigating back to AOMA...');
      await page.goto(STAGE_URL, { waitUntil: 'load', timeout: 30000 }).catch(() => {});
      await page.waitForTimeout(2000);
      continue;
    }

    // Handle username field
    if (!usernameFilled) {
      try {
        const userField = page.locator('input[name="loginfmt"], #i0116').first();
        if (await userField.isVisible({ timeout: 500 }).catch(()=>false)) {
          console.log('Filling username field...');
          await userField.fill(AAD_USERNAME).catch(async ()=>{ await userField.type(AAD_USERNAME, { delay: 15 }); });
          await page.locator('#idSIButton9, input[type="submit"], button[type="submit"]').first().click().catch(()=>{});
          usernameFilled = true;
          await page.waitForTimeout(3000); // Wait longer for password page to load
          continue;
        }
      } catch {}
    }

    // Handle password field - use semantic selectors (placeholder, aria-label, type)
    if (!passwordFilled) {
      try {
        const pwField = page.locator('input[type="password"][placeholder="Password" i], input[type="password"][aria-label*="password" i], input[name="passwd"], input[name="pwd"], input[type="password"]').first();
        if (await pwField.isVisible({ timeout: 3000 }).catch(()=>false)) {
          console.log('Filling password field...');
          await pwField.fill(AAD_PASSWORD).catch(async ()=>{ await pwField.type(AAD_PASSWORD, { delay: 20 }); });
          console.log('Clicking Sign in button...');
          await page.locator('input[type="submit"][value*="Sign in" i], button[type="submit"]:has-text("Sign in"), input[type="submit"], button[type="submit"]').first().click().catch(()=>{});
          passwordFilled = true;
          await page.waitForTimeout(2000);
          continue;
        }
      } catch (e) {
        // Silence errors but log if we want to debug
      }
    }

    // Handle certificate selection modal (try to click OK automatically)
    try {
      // Wait briefly for certificate modal
      const certOkBtn = page.locator('button:has-text("OK")').first();
      if (await certOkBtn.isVisible({ timeout: 1000 }).catch(()=>false)) {
        console.log('Certificate modal detected - clicking OK to use certificate...');
        await certOkBtn.click().catch(()=>{});
        await page.waitForTimeout(2000);
        continue;
      }
    } catch {}

    // Handle stay signed in / continue (check multiple selectors)
    try {
      const staySignedInSelectors = [
        '#idSIButton9',
        'input[type="submit"][value*="Yes" i]',
        'input[type="submit"][value*="No" i]',
        'button:has-text("Yes")',
        'button:has-text("No")'
      ];

      for (const selector of staySignedInSelectors) {
        const btn = page.locator(selector).first();
        if (await btn.isVisible({ timeout: 500 }).catch(()=>false)) {
          console.log(`Clicking "${selector}" button...`);
          await btn.click().catch(()=>{});
          await page.waitForTimeout(2000);
          continue;
        }
      }
    } catch {}

    await page.waitForTimeout(500);
  }

  console.log('Auth flow timed out, checking final status...');

  // Take screenshot immediately after auth flow
  await page.screenshot({ path: 'tmp/auth-flow-end.png' }).catch(() => {});
  console.log('📸 Screenshot saved: tmp/auth-flow-end.png');
  console.log(`📍 Current URL: ${page.url()}`);

  // Ensure we are back on stage host before saving
  const finalDeadline = Date.now() + 180000; // up to 3 more minutes for MFA and redirects
  let checkCount = 0;
  while (Date.now() < finalDeadline) {
    checkCount++;
    const currentUrl = page.url();
    const currentHost = (() => { try { return new URL(currentUrl).host; } catch { return ''; } })();

    // Log every iteration with URL
    console.log(`[${checkCount}s] URL: ${currentUrl}`);

    // Take screenshot every 10 seconds
    if (checkCount % 10 === 0) {
      await page.screenshot({ path: `tmp/check-${checkCount}s.png` }).catch(() => {});
      console.log(`📸 Screenshot: tmp/check-${checkCount}s.png`);
    }

    // Handle Jamf redirect if we hit it
    if (currentUrl.includes('jss.sonymusic.com') || currentUrl.includes('jamf')) {
      console.log('⚠️  Jamf detected during final check - navigating back to AOMA...');
      await page.screenshot({ path: 'tmp/jamf-redirect.png' }).catch(() => {});
      await page.goto(STAGE_URL, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
      await page.waitForTimeout(5000);
      continue;
    }

    // Handle certificate selection redirect (DeviceAuthTls/reprocess)
    if (currentUrl.includes('DeviceAuthTls/reprocess')) {
      console.log('⚠️  Certificate selection page detected - navigating back to AOMA...');
      await page.screenshot({ path: 'tmp/cert-redirect.png' }).catch(() => {});
      await page.goto(STAGE_URL, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
      await page.waitForTimeout(5000);
      continue;
    }

    // If we're at AOMA, check if we're actually logged in or back at employee login
    if (currentHost === stageHost) {
      console.log('✅ Reached AOMA! Checking if authenticated...');
      await page.screenshot({ path: 'tmp/reached-aoma.png' }).catch(() => {});

      // If URL contains "chain=Login" AND we see employee login button, auth failed - try ONE more time
      if (currentUrl.includes('chain=Login')) {
        const onLoginPage = await page.locator('text=/employee.*login/i').count().catch(() => 0) > 0;

        if (onLoginPage && checkCount < 5) {
          console.log('⚠️  Auth failed on login chain - clicking Employee Login to retry...');
          await clickEmployeeLogin(page);
          await page.waitForTimeout(3000);
          continue;
        } else {
          console.log('⚠️  Still in login chain after retries - navigating to home...');
          await page.goto(`${STAGE_URL}/`, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
          await page.waitForTimeout(3000);
          continue;
        }
      }

      // Check if we're on the employee login landing page (without chain=Login)
      const onLoginPage = await page.locator('text=/employee.*login/i').count().catch(() => 0) > 0;

      if (onLoginPage) {
        console.log('⚠️  Back at employee login page - clicking through again...');
        await clickEmployeeLogin(page);
        await page.waitForTimeout(3000);
        continue;
      }

      // We're authenticated! Save cookies
      console.log('📍 Final URL:', page.url());
      await page.screenshot({ path: 'tmp/final-authenticated.png' }).catch(() => {});
      break;
    }

    await page.waitForTimeout(1000);
  }

  const currentUrl = page.url();
  const atStage = (() => { try { return new URL(currentUrl).host === stageHost; } catch { return false; }})();

  console.log(`📍 Current URL: ${currentUrl}`);
  console.log(`🎯 Stage host: ${stageHost}`);
  console.log(`✅ At stage: ${atStage}`);

  if (atStage) {
    await context.storageState({ path: STORAGE_FILE });
    console.log(`✅ Saved storage to ${STORAGE_FILE}`);

    const cookies = await context.cookies();
    const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join('; ');
    fs.writeFileSync(COOKIE_FILE, cookieHeader);
    console.log(`✅ Saved cookies (${cookies.length} total) to ${COOKIE_FILE}`);

    await browser.close();
    console.log('🎉 Login completed successfully!');
    process.exit(0);
  } else {
    console.log('⏳ Waiting for page navigation...');
    let checks = 0;
    const tick = setInterval(async () => {
      checks++;
      try {
        const u = page.url();
        const h = new URL(u).host;
        console.log(`[Check ${checks}] At: ${h} | Want: ${stageHost}`);

        if (h === stageHost) {
          clearInterval(tick);
          await context.storageState({ path: STORAGE_FILE });
          const cookies = await context.cookies();
          const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join('; ');
          fs.writeFileSync(COOKIE_FILE, cookieHeader);
          console.log('🎉 Session saved!');
          await browser.close();
          process.exit(0);
        }

        if (checks > 40) {
          clearInterval(tick);
          console.log('❌ Timeout - browser will stay open');
        }
      } catch (e) {
        console.log(`Error: ${e.message}`);
      }
    }, 3000);
  }
})().catch(err => {
  console.error('Login helper error:', err);
  process.exit(1);
});


