#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { chromium } from 'playwright';

const STORAGE_STATE_PATH = path.join(process.cwd(), 'tmp/aoma-stage-storage.json');
const URLS_PATH = path.join(process.cwd(), 'aoma_crawl/urls.json');
const OUT_DIR = path.join(process.cwd(), 'aoma_crawl');
const HTML_DIR = path.join(OUT_DIR, 'html');
const FILES_DIR = path.join(OUT_DIR, 'files');
const LOG_DIR = path.join(OUT_DIR, 'logs');
const PAGES_JSONL = path.join(OUT_DIR, 'pages.jsonl');

function ensureDir(d) { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); }
function sha256(buf) { return crypto.createHash('sha256').update(buf).digest('hex'); }
function hashOf(str) { return crypto.createHash('sha1').update(str).digest('hex'); }
function sanitize(name) { return name.replace(/[\/:*?"<>|\s]+/g, '_').slice(0, 80); }

async function downloadBinary(context, url, outDir) {
  try {
    const resp = await context.request.get(url, { maxRedirects: 5 });
    const status = resp.status();
    if (status < 200 || status >= 300) return { ok: false, status };
    const body = await resp.body();
    const ctype = resp.headers()['content-type'] || '';
    const u = new URL(url);
    const base = sanitize(u.pathname.split('/').pop() || 'file');
    let fname = base || 'file';
    let final = fname;
    let i = 2;
    while (fs.existsSync(path.join(outDir, final))) { final = `${fname}-${i++}`; }
    const outPath = path.join(outDir, final);
    fs.writeFileSync(outPath, body);
    return { ok: true, file: final, size: body.length, status, contentType: ctype };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

(async () => {
  ensureDir(OUT_DIR); ensureDir(HTML_DIR); ensureDir(FILES_DIR); ensureDir(LOG_DIR);
  if (!fs.existsSync(URLS_PATH)) { console.error('Missing urls.json'); process.exit(2); }
  const urlsData = JSON.parse(fs.readFileSync(URLS_PATH, 'utf8'));
  const urls = urlsData.urls || [];
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ storageState: fs.existsSync(STORAGE_STATE_PATH) ? STORAGE_STATE_PATH : undefined, ignoreHTTPSErrors: true });
  const page = await context.newPage();
  page.setDefaultTimeout(60000);

  let processed = 0;
  for (const url of urls) {
    const id = hashOf(url);
    try {
      const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 90000 });
      await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
      const status = resp ? resp.status() : 0;
      const title = await page.title().catch(() => '');
      const html = await page.content();
      const htmlBuf = Buffer.from(html, 'utf8');
      const htmlPath = path.join(HTML_DIR, `${id}.html`);
      fs.writeFileSync(htmlPath, htmlBuf);
      const screenshotPath = path.join(LOG_DIR, `page-${id}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true }).catch(() => {});

      // collect binary links on the page
      const binLinks = await page.evaluate(() => Array.from(document.querySelectorAll('a[href]'))
        .map(a => a.href)
        .filter(href => /\.(pdf|docx?|xlsx?|pptx|zip)(\?|#|$)/i.test(href)));
      const uniqBins = Array.from(new Set(binLinks));

      const fileOutDir = path.join(FILES_DIR, id);
      ensureDir(fileOutDir);
      const binMeta = [];
      for (const b of uniqBins) {
        const d = await downloadBinary(context, b, fileOutDir);
        binMeta.push({ url: b, ...d });
      }

      const rec = {
        url,
        id,
        title,
        status,
        htmlPath: path.relative(process.cwd(), htmlPath),
        screenshot: path.relative(process.cwd(), screenshotPath),
        htmlSize: htmlBuf.length,
        htmlSha256: sha256(htmlBuf),
        binaries: binMeta,
        crawledAt: new Date().toISOString(),
      };
      fs.appendFileSync(PAGES_JSONL, JSON.stringify(rec) + '\n', 'utf8');
      processed += 1;
      console.log(`Captured [${processed}/${urls.length}]: ${url}`);
    } catch (e) {
      const errRec = { url, error: e instanceof Error ? e.message : String(e), at: new Date().toISOString() };
      fs.appendFileSync(PAGES_JSONL, JSON.stringify(errRec) + '\n', 'utf8');
      console.log(`Failed to capture: ${url}`);
    }
  }

  await browser.close();
  console.log(JSON.stringify({ ok: true, processed }));
})();






