/*
  Authenticated downloader for AOMA Stage bottom-of-page documents.

  Environment variables (set in .env.local):
  - AOMA_START_URL: full URL to the logged-in AOMA page
  - AOMA_STAGING_HOST: staging origin (e.g., https://aoma-stage.smcdp-de.net)
  - AOMA_STORAGE_STATE: path to persist/reuse Playwright storage state (default: tmp/aoma-stage-storage.json)
  - AOMA_COOKIES_PATH: path to write cookie text for reuse (default: tmp/aoma-cookie.txt)
  - AOMA_DOWNLOAD_DIR: destination directory (default: aoma-source-docs)

  Usage:
    node scripts/aoma/download-bottom-docs.js
*/

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.local') });

function ensureDirSync(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function buildCookieHeader(cookies) {
  if (!Array.isArray(cookies) || cookies.length === 0) return '';
  return cookies.map(c => `${c.name}=${c.value}`).join('; ');
}

function sanitizeFilename(name) {
  return name.replace(/[^a-zA-Z0-9._-]+/g, '_');
}

async function saveCookiesToFile(context, cookiePath) {
  const cookies = await context.cookies();
  const cookieHeader = buildCookieHeader(cookies);
  fs.writeFileSync(cookiePath, cookieHeader, 'utf8');
}

async function collectDocLinks(page, baseHost) {
  // Heuristics: capture anchors with common doc extensions OR download-like signals
  const candidates = await page.evaluate(() => {
    const anchors = Array.from(document.querySelectorAll('a[href]'));
    const exts = /(\.(pdf|docx?|pptx?|xlsx?|xls|txt|md)(\?|#|$))/i;
    const keywords = /(download|document|file|attachment|export)/i;
    return anchors.map(a => ({
      href: a.getAttribute('href') || '',
      text: (a.textContent || '').trim()
    })).filter(x => x.href)
      .filter(x => exts.test(x.href) || keywords.test(x.href) || keywords.test(x.text))
      .map(x => x.href);
  });

  const unique = Array.from(new Set(candidates));

  // Normalize to absolute URLs and keep within the staging host if provided
  const abs = unique.map(href => {
    try {
      return new URL(href, page.url()).toString();
    } catch (_) {
      return null;
    }
  }).filter(Boolean);

  const filtered = abs.filter(u => {
    try {
      const url = new URL(u);
      return baseHost ? (url.origin === baseHost) : true;
    } catch (_) {
      return false;
    }
  });

  return Array.from(new Set(filtered));
}

async function clickBottomSectionAnchors(page) {
  try {
    // Scroll to bottom, then collect anchors likely within bottom 1500px region
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(600);
    const anchors = await page.evaluate(() => {
      const docHeight = document.body.scrollHeight;
      const threshold = docHeight - 1500;
      const list = Array.from(document.querySelectorAll('a[href]'));
      return list
        .map(a => ({
          href: a.getAttribute('href') || '',
          text: (a.textContent || '').trim(),
          top: a.getBoundingClientRect().top + window.scrollY
        }))
        .filter(x => x.top >= threshold);
    });

    // Click up to a reasonable cap to avoid over-navigation
    const cap = Math.min(anchors.length, 25);
    for (let i = 0; i < cap; i++) {
      const a = anchors[i];
      try {
        await page.evaluate((href) => {
          const el = Array.from(document.querySelectorAll(`a[href]`)).find(a => a.getAttribute('href') === href);
          if (el) {
            el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
          }
        }, a.href);
        await page.waitForTimeout(800);
      } catch (_) {}
    }
  } catch (_) {}
}

async function clickReferenceDocsAnchors(page) {
  try {
    // Find a container that includes the heading/text "Reference Docs"
    const refs = await page.evaluate(() => {
      function findContainerByText(root, text) {
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT, null);
        while (walker.nextNode()) {
          const el = walker.currentNode;
          const t = (el.textContent || '').trim().toLowerCase();
          if (t.includes(text)) return el;
        }
        return null;
      }

      const root = document.body;
      const container = findContainerByText(root, 'reference docs');
      if (!container) return [];
      const anchors = Array.from(container.querySelectorAll('a[href]'))
        .map(a => ({ href: a.getAttribute('href') || '', text: (a.textContent || '').trim() }))
        .filter(x => x.href);
      return anchors;
    });

    const cap = Math.min(refs.length, 25);
    for (let i = 0; i < cap; i++) {
      const a = refs[i];
      try {
        // Click by href match within the Reference Docs container scope
        await page.evaluate((href) => {
          function findContainerByText(root, text) {
            const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT, null);
            while (walker.nextNode()) {
              const el = walker.currentNode;
              const t = (el.textContent || '').trim().toLowerCase();
              if (t.includes(text)) return el;
            }
            return null;
          }
          const root = document.body;
          const container = findContainerByText(root, 'reference docs');
          if (!container) return;
          const el = Array.from(container.querySelectorAll('a[href]')).find(a => a.getAttribute('href') === href);
          if (el) el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
        }, a.href);
        // Wait longer to allow XHR->attachment flows to complete and be captured by response listener
        await page.waitForTimeout(4000);
      } catch (_) {}
    }
  } catch (_) {}
}

async function tryClickEmployeeLogin(page) {
  try {
    const link = await page.$('a:has-text("Employee Login")');
    if (!link) return false;
    await Promise.all([
      page.waitForNavigation({ url: /login\.microsoftonline\.com/i, waitUntil: 'domcontentloaded' }).catch(() => {}),
      link.click({ force: true })
    ]);
    return true;
  } catch (_) {
    return false;
  }
}

async function performAADLoginIfNeeded(page, stagingHostOrigin) {
  const aadUser = process.env.AAD_USERNAME;
  const aadPass = process.env.AAD_PASSWORD;

  if (!/login\.microsoftonline\.com/i.test(page.url())) return;

  if (!aadUser || !aadPass) {
    console.log('ℹ️  On Microsoft login; waiting up to 90s for manual SSO/MFA...');
    try { await page.waitForLoadState('networkidle', { timeout: 90000 }); } catch (_) {}
    return;
  }

  try {
    await page.waitForSelector('input[name="loginfmt"]', { timeout: 15000 });
    await page.fill('input[name="loginfmt"]', aadUser);
    const next1 = await page.$('#idSIButton9, input[type="submit"], button[type="submit"]');
    if (next1) await Promise.all([
      page.waitForLoadState('domcontentloaded').catch(() => {}),
      next1.click()
    ]);
  } catch (_) {}

  try {
    await page.waitForSelector('input[name="passwd"]', { timeout: 20000 });
    await page.fill('input[name="passwd"]', aadPass);
    const signin = await page.$('#idSIButton9, input[type="submit"], button[type="submit"]');
    if (signin) await Promise.all([
      page.waitForLoadState('domcontentloaded').catch(() => {}),
      signin.click()
    ]);
  } catch (_) {}

  try {
    const staySigned = await page.$('#idSIButton9');
    if (staySigned) await Promise.all([
      page.waitForLoadState('domcontentloaded').catch(() => {}),
      staySigned.click()
    ]);
  } catch (_) {}

  try {
    await page.waitForURL(u => { try { return new URL(u).origin === stagingHostOrigin; } catch { return false; } }, { timeout: 120000 });
  } catch (_) {}
}

async function downloadWithClick(page, linkUrl, destDir, cookiePath) {
  // Attempt a download click flow; fallback to response capture if needed
  try {
    const anchorHandle = await page.$(`a[href='${linkUrl}']`);
    if (anchorHandle) {
      const [download] = await Promise.all([
        page.waitForEvent('download', { timeout: 8000 }).catch(() => null),
        anchorHandle.click({ force: true })
      ]);
      if (download) {
        const filename = sanitizeFilename(await download.suggestedFilename());
        const toPath = path.join(destDir, filename);
        await download.saveAs(toPath);
        return { ok: true, path: toPath };
      }
    }
  } catch (_) {
    // ignore and fallback
  }

  // Fallback 1: navigate and capture the response body
  try {
    const resp = await page.goto(linkUrl, { waitUntil: 'domcontentloaded' });
    if (!resp) return { ok: false, error: 'No response' };
    const ct = resp.headers()['content-type'] || '';
    const disposition = resp.headers()['content-disposition'] || '';
    if (/text\/html/i.test(ct)) {
      // HTML shell, not a document
      throw new Error(`HTML response (content-type=${ct})`);
    }
    const urlObj = new URL(linkUrl);
    let filename = path.basename(urlObj.pathname) || 'download.bin';
    if (/filename=/i.test(disposition)) {
      const match = disposition.match(/filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i);
      const raw = match ? (decodeURIComponent(match[1] || match[2] || '').trim()) : filename;
      if (raw) filename = raw;
    } else if (!/\./.test(filename)) {
      // infer an extension from content-type
      if (ct.includes('pdf')) filename += '.pdf';
    }
    filename = sanitizeFilename(filename);
    const buf = await resp.body();
    const toPath = path.join(destDir, filename);
    fs.writeFileSync(toPath, buf);
    return { ok: true, path: toPath };
  } catch (err) {
    // continue to cookie fetch fallback
  }

  // Fallback 2: HTTP fetch with Cookie header outside the browser
  try {
    const cookieHeader = fs.existsSync(cookiePath) ? fs.readFileSync(cookiePath, 'utf8').trim() : '';
    const axios = require('axios');
    const response = await axios.get(linkUrl, {
      responseType: 'arraybuffer',
      maxRedirects: 5,
      headers: cookieHeader ? { Cookie: cookieHeader, 'User-Agent': 'siam-aoma-downloader/1.0' } : { 'User-Agent': 'siam-aoma-downloader/1.0' }
    });
    const ct2 = String(response.headers['content-type'] || '');
    const disp2 = String(response.headers['content-disposition'] || '');
    if (/text\/html/i.test(ct2)) {
      return { ok: false, error: `HTML content (content-type=${ct2})` };
    }
    let filename = path.basename(new URL(linkUrl).pathname) || 'download.bin';
    if (/filename=/i.test(disp2)) {
      const match = disp2.match(/filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i);
      const raw = match ? (decodeURIComponent(match[1] || match[2] || '').trim()) : filename;
      if (raw) filename = raw;
    }
    // add extension by content-type if missing
    if (!/\./.test(filename)) {
      if (/pdf/i.test(ct2)) filename += '.pdf';
      else if (/msword|officedocument\.wordprocessingml/i.test(ct2)) filename += '.docx';
      else if (/powerpoint|officedocument\.presentationml/i.test(ct2)) filename += '.pptx';
      else if (/excel|officedocument\.spreadsheetml/i.test(ct2)) filename += '.xlsx';
    }
    filename = sanitizeFilename(filename);
    const toPath = path.join(destDir, filename);
    fs.writeFileSync(toPath, response.data);
    return { ok: true, path: toPath };
  } catch (err2) {
    return { ok: false, error: String(err2) };
  }
}

function attachResponseSaver(page, destDir) {
  page.on('response', async (resp) => {
    try {
      const url = resp.url();
      const ct = String(resp.headers()['content-type'] || '');
      const disp = String(resp.headers()['content-disposition'] || '');
      // Only save likely document types
      const isDocType = /(application\/pdf|msword|officedocument\.wordprocessingml|powerpoint|officedocument\.presentationml|excel|officedocument\.spreadsheetml)/i.test(ct);
      const hasDisposition = /attachment|filename=/i.test(disp);
      if (!isDocType && !hasDisposition) return;
      const buf = await resp.body();
      let filename = path.basename(new URL(url).pathname) || 'download.bin';
      if (/filename=/i.test(disp)) {
        const match = disp.match(/filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i);
        const raw = match ? (decodeURIComponent(match[1] || match[2] || '').trim()) : filename;
        if (raw) filename = raw;
      }
      if (!/\./.test(filename)) {
        if (/pdf/i.test(ct)) filename += '.pdf';
        else if (/msword|officedocument\.wordprocessingml/i.test(ct)) filename += '.docx';
        else if (/powerpoint|officedocument\.presentationml/i.test(ct)) filename += '.pptx';
        else if (/excel|officedocument\.spreadsheetml/i.test(ct)) filename += '.xlsx';
      }
      filename = sanitizeFilename(filename);
      const toPath = path.join(destDir, filename);
      fs.writeFileSync(toPath, buf);
      console.log(`⬇️  Saved (response): ${toPath}`);
    } catch (_) {}
  });
}

(async () => {
  const startUrl = process.env.AOMA_START_URL || 'https://aoma-stage.smcdp-de.net/legacy-embed/a5cb295f793f4ccba744007d33ac137b/servlet%7Ccom%5Esonymusic%5Eaoma%5EAOMADispatcherServlet~chain*CustomHomePageViewAction';
  const stagingHost = process.env.AOMA_STAGING_HOST || 'https://aoma-stage.smcdp-de.net';
  const storageStatePath = process.env.AOMA_STORAGE_STATE || 'tmp/aoma-stage-storage.json';
  const cookiePath = process.env.AOMA_COOKIES_PATH || 'tmp/aoma-cookie.txt';
  const downloadDir = process.env.AOMA_DOWNLOAD_DIR || 'aoma-source-docs';
  const manualCapture = /^1|true$/i.test(String(process.env.AOMA_MANUAL_CAPTURE || ''));
  const manualTimeoutMs = Number(process.env.AOMA_MANUAL_TIMEOUT_MS || 180000);

  // startUrl now has a default; proceed

  ensureDirSync(path.dirname(storageStatePath));
  ensureDirSync(path.dirname(cookiePath));
  ensureDirSync(downloadDir);

  const storageExists = fs.existsSync(storageStatePath);

  const launchOpts = { headless: false }; // headful for SSO/MFA flows
  const browser = await chromium.launch(launchOpts);
  let context;
  if (storageExists) {
    context = await browser.newContext({ storageState: storageStatePath, acceptDownloads: true });
  } else {
    context = await browser.newContext({ acceptDownloads: true });
  }
  const page = await context.newPage();
  attachResponseSaver(page, downloadDir);

  console.log(`➡️  Navigating to ${startUrl}`);
  await page.goto(startUrl, { waitUntil: 'domcontentloaded' });

  // If first-time login, give time for user to complete SSO/MFA in headful window
  if (!storageExists) {
    console.log('⏳ Waiting up to 90s for login (complete any SSO/MFA in the opened browser)...');
    try {
      await page.waitForLoadState('networkidle', { timeout: 90000 });
    } catch (_) {
      // proceed; user may still be on the target page
    }
    await context.storageState({ path: storageStatePath });
    await saveCookiesToFile(context, cookiePath);
    console.log(`✅ Saved storage state: ${storageStatePath}`);
    console.log(`✅ Saved cookie header: ${cookiePath}`);
  }

  // Ensure we are on the right page before scraping links
  try {
    await page.waitForLoadState('domcontentloaded', { timeout: 15000 });
  } catch (_) {}
  try {
    const currentUrl = page.url();
    const title = await page.title();
    console.log(`🔗 Current URL: ${currentUrl}`);
    console.log(`🧾 Title: ${title}`);
  } catch (_) {}

  // Attempt SSO flow if needed
  const baseHostOrigin = (() => {
    try {
      const u = new URL(stagingHost);
      return u.origin;
    } catch (_) {
      return null;
    }
  })();

  const clicked = await tryClickEmployeeLogin(page);
  if (clicked) {
    console.log('👤 Employee Login clicked, attempting AAD sign-in...');
  }
  await performAADLoginIfNeeded(page, baseHostOrigin);
  try { await page.waitForLoadState('domcontentloaded', { timeout: 30000 }); } catch (_) {}
  try { await page.waitForLoadState('networkidle', { timeout: 30000 }); } catch (_) {}
  try {
    const currentUrl2 = page.url();
    const title2 = await page.title();
    console.log(`🔗 After login URL: ${currentUrl2}`);
    console.log(`🧾 After login title: ${title2}`);
  } catch (_) {}

  // Scroll to bottom to reveal any lazy-loaded bottom-of-page links
  try {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(800);
  } catch (_) {}

  if (manualCapture) {
    console.log(`🖱️  Manual capture mode: click each document link under "Reference Docs".
⏳ Listening for document responses for ${Math.round(manualTimeoutMs/1000)}s...`);
    try { await page.waitForTimeout(manualTimeoutMs); } catch (_) {}
    await context.storageState({ path: storageStatePath });
    await saveCookiesToFile(context, cookiePath);
    await browser.close();
    console.log('✅ Manual capture complete. Check aoma-source-docs/');
    return;
  }

  // Try page and all frames
  let docLinks = await collectDocLinks(page, baseHostOrigin);
  if (docLinks.length === 0) {
    try {
      for (const frame of page.frames()) {
        try {
          const links = await collectDocLinks(frame, baseHostOrigin);
          if (links && links.length) {
            docLinks = Array.from(new Set([ ...docLinks, ...links ]));
          }
        } catch (_) {}
      }
    } catch (_) {}
  }
  console.log(`🔎 Found ${docLinks.length} candidate document links`);

  const results = [];
  for (const link of docLinks) {
    const r = await downloadWithClick(page, link, downloadDir, cookiePath);
    if (r.ok) {
      console.log(`⬇️  Saved: ${r.path}`);
    } else {
      console.warn(`⚠️  Failed to download ${link}: ${r.error}`);
    }
    results.push({ url: link, ...r });
  }

  // Additionally, try clicking anchors in the bottom section to trigger any attachment downloads
  await clickBottomSectionAnchors(page);
  // Specifically click anchors under the "Reference Docs" section and allow time for network requests
  await clickReferenceDocsAnchors(page);

  // Persist final cookies/state after downloads
  await context.storageState({ path: storageStatePath });
  await saveCookiesToFile(context, cookiePath);

  await browser.close();

  const summaryPath = path.join(downloadDir, '_download-summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify({
    startedFrom: startUrl,
    foundLinks: docLinks.length,
    saved: results.filter(r => r.ok).length,
    failed: results.filter(r => !r.ok).length,
    items: results
  }, null, 2));

  console.log(`📄 Summary written: ${summaryPath}`);
  console.log('✅ Done');
})().catch(err => {
  console.error('❌ Unhandled error:', err);
  process.exit(1);
});





