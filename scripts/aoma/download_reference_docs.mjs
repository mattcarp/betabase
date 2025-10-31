import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { chromium } from 'playwright';

const TARGET_URL = 'https://aoma-stage.smcdp-de.net/legacy-embed/a5cb295f793f4ccba744007d33ac137b/servlet%7Ccom%5Esonymusic%5Eaoma%5EAOMADispatcherServlet~chain*CustomHomePageViewAction';
const STORAGE_STATE_PATH = 'tmp/aoma-stage-storage.json';
const OUTPUT_DIR = 'aoma_knowledge_docs';
const LOG_DIR = 'tmp/aoma-refdocs-logs';

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
}

function sha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function sanitizeFilename(name) {
  return name.replace(/[\/:*?"<>|\s]+/g, '_').replace(/_+/g, '_').replace(/^_+|_+$/g, '');
}

function pickFilenameFromHeadersOrUrl(headers, url, fallbackBase) {
  const cd = headers['content-disposition'] || headers['Content-Disposition'];
  if (cd) {
    const match = /filename\*=UTF-8''([^;\n]+)|filename="?([^";\n]+)"?/i.exec(cd);
    const raw = decodeURIComponent(match?.[1] || match?.[2] || '').trim();
    if (raw) return sanitizeFilename(raw);
  }
  try {
    const u = new URL(url);
    const last = (u.pathname.split('/').pop() || '').trim();
    if (last) return sanitizeFilename(last);
  } catch {}
  return sanitizeFilename(fallbackBase);
}

function maybeAddExtension(name, contentType) {
  const hasExt = /\.[a-zA-Z0-9]{2,6}$/.test(name);
  if (hasExt) return name;
  const map = new Map([
    ['application/pdf', '.pdf'],
    ['application/msword', '.doc'],
    ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', '.docx'],
    ['application/vnd.ms-excel', '.xls'],
    ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', '.xlsx'],
    ['application/vnd.ms-powerpoint', '.ppt'],
    ['application/vnd.openxmlformats-officedocument.presentationml.presentation', '.pptx'],
    ['text/plain', '.txt'],
    ['text/csv', '.csv'],
    ['application/zip', '.zip'],
  ]);
  const ext = map.get(contentType || '') || '';
  return ext ? `${name}${ext}` : name;
}

async function waitForReferenceSection(page, timeoutMs = 90000) {
  await page.waitForFunction(() => {
    return typeof document !== 'undefined' && document.body && document.body.innerText && document.body.innerText.includes('Reference Documents:');
  }, { timeout: timeoutMs });
}

async function extractReferenceLinks(page) {
  const links = await page.evaluate(() => {
    function absUrl(href) {
      try { return new URL(href, window.location.href).toString(); } catch { return null; }
    }
    const allCandidates = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
    const carriers = [];
    while (walker.nextNode()) {
      const el = walker.currentNode;
      const txt = (el.innerText || '').trim();
      if (txt && txt.includes('Reference Documents:')) {
        carriers.push(el);
      }
    }
    let container = null;
    // choose the element with most links in subtree, fallback to parent/sibling
    let max = -1;
    for (const el of carriers) {
      const aCount = el.querySelectorAll('a').length;
      if (aCount > max) { max = aCount; container = el; }
    }
    if (!container && carriers.length) container = carriers[0];
    if (!container) container = document.body;

    let anchors = Array.from(container.querySelectorAll('a'));
    if (anchors.length === 0 && container.parentElement) {
      anchors = Array.from(container.parentElement.querySelectorAll('a'));
    }
    if (anchors.length === 0 && container.nextElementSibling) {
      anchors = Array.from(container.nextElementSibling.querySelectorAll('a'));
    }

    const results = anchors
      .map(a => ({ text: (a.textContent || '').trim(), href: a.getAttribute('href') || '' }))
      .map(x => ({ ...x, url: absUrl(x.href) }))
      .filter(x => x.url);

    // Deduplicate by URL
    const seen = new Set();
    const dedup = [];
    for (const r of results) {
      if (!seen.has(r.url)) { seen.add(r.url); dedup.push(r); }
    }
    return dedup;
  });
  return links;
}

async function downloadWithApi(context, url, baseName, manifestEntries) {
  const resp = await context.request.get(url, { maxRedirects: 5 });
  const status = resp.status();
  const headers = resp.headers();
  if (status < 200 || status >= 300) {
    manifestEntries.push({ url, baseName, status, error: `HTTP ${status}` });
    return false;
  }
  const body = await resp.body();
  const contentType = headers['content-type'] || headers['Content-Type'] || '';
  let fileName = pickFilenameFromHeadersOrUrl(headers, url, baseName);
  fileName = maybeAddExtension(fileName, contentType);
  // ensure unique
  let finalName = fileName;
  let idx = 2;
  while (fs.existsSync(path.join(OUTPUT_DIR, finalName))) {
    const ext = path.extname(fileName);
    const stem = path.basename(fileName, ext);
    finalName = `${stem}-${idx}${ext}`;
    idx += 1;
  }
  const outPath = path.join(OUTPUT_DIR, finalName);
  fs.writeFileSync(outPath, body);
  const size = fs.statSync(outPath).size;
  const hash = sha256(body);
  manifestEntries.push({ url, fileName: finalName, size, sha256: hash, contentType, status });
  return true;
}

(async () => {
  ensureDir('tmp');
  ensureDir(LOG_DIR);
  ensureDir(OUTPUT_DIR);

  const manifest = { source: TARGET_URL, downloadedAt: new Date().toISOString(), items: [] };

  // First try: reuse existing session
  let browser = await chromium.launch({ headless: true });
  let context = await browser.newContext({ storageState: fs.existsSync(STORAGE_STATE_PATH) ? STORAGE_STATE_PATH : undefined, ignoreHTTPSErrors: true });
  let page = await context.newPage();
  page.setDefaultTimeout(60000);
  try {
    await page.goto(TARGET_URL, { waitUntil: 'commit', timeout: 90000 });
    await page.waitForLoadState('domcontentloaded', { timeout: 60000 }).catch(() => {});
    await page.waitForLoadState('networkidle', { timeout: 60000 }).catch(() => {});
    await waitForReferenceSection(page, 90000);
  } catch (e) {
    // Fallback: headful login, wait for section
    await browser.close();
    browser = await chromium.launch({ headless: false });
    context = await browser.newContext({ ignoreHTTPSErrors: true });
    page = await context.newPage();
    page.setDefaultTimeout(120000);
    await page.goto(TARGET_URL, { waitUntil: 'commit', timeout: 120000 });
    await page.waitForLoadState('domcontentloaded', { timeout: 90000 }).catch(() => {});
    await page.waitForLoadState('networkidle', { timeout: 90000 }).catch(() => {});
    await waitForReferenceSection(page, 120000);
    // Save session for reuse
    const state = await context.storageState();
    fs.writeFileSync(STORAGE_STATE_PATH, JSON.stringify(state, null, 2));
  }

  // Confirm section is present and screenshot
  await page.screenshot({ path: path.join(LOG_DIR, 'reference_docs_section.png'), fullPage: true }).catch(() => {});

  // Extract links near the Reference Documents section
  const links = await extractReferenceLinks(page);
  if (!links || links.length === 0) {
    console.log(JSON.stringify({ ok: false, error: 'No links detected under Reference Documents section.' }));
    await browser.close();
    process.exit(2);
  }

  // Download each link using context.request
  let successCount = 0;
  for (const { url, text } of links) {
    const baseName = sanitizeFilename(text || 'reference_doc');
    try {
      const ok = await downloadWithApi(context, url, baseName || 'reference_doc', manifest.items);
      if (ok) successCount += 1;
    } catch (err) {
      manifest.items.push({ url, baseName, error: String(err) });
    }
  }

  // Persist manifest
  fs.writeFileSync(path.join(OUTPUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2));

  console.log(JSON.stringify({ ok: true, linksFound: links.length, downloaded: successCount, outputDir: OUTPUT_DIR }));
  await browser.close();
})();






