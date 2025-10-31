#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright';

const START_URL = process.env.AOMA_START_URL || (process.env.AOMA_STAGE_URL || 'https://aoma-stage.smcdp-de.net');
const STORAGE_STATE_PATH = path.join(process.cwd(), 'tmp/aoma-stage-storage.json');
const OUT_DIR = path.join(process.cwd(), 'aoma_crawl');
const LOG_DIR = path.join(OUT_DIR, 'logs');
const OUT_URLS = path.join(OUT_DIR, 'urls.json');
const MAX_PAGES = Number(process.env.AOMA_MAX_PAGES || process.argv[2] || 200);
const ALLOW_RE = /^https:\/\/aoma-stage\.smcdp-de\.net\//i;
const DENY_PATTERNS = [/logout/i, /signin|login|microsoftonline|azure/i, /#/, /\.(zip|pdf|docx?|xlsx?|pptx?)$/i];

function ensureDir(d) { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); }
function allow(url) { return ALLOW_RE.test(url) && !DENY_PATTERNS.some((re) => re.test(url)); }
function norm(u) { try { return new URL(u).toString(); } catch { return null; } }

async function extractLinks(page) {
  const urls = await page.evaluate(() => Array.from(document.querySelectorAll('a[href]')).map(a => a.href));
  return Array.from(new Set(urls));
}

(async () => {
  ensureDir(OUT_DIR); ensureDir(LOG_DIR);
  const visited = new Set();
  const queue = [];
  const seed = norm(START_URL);
  if (!seed) { console.error('Invalid START_URL'); process.exit(2); }
  queue.push(seed);
  // Add common AOMA routes as additional seeds to overcome JS boot delays
  const commonPaths = [
    '/',
    '/aoma-ui/my-aoma-files',
    '/aoma-ui/simple-upload',
    '/aoma-ui/direct-upload',
    '/aoma-ui/product-metadata-viewer',
    '/aoma-ui/unified-submission-tool',
    '/aoma-ui/registration-job-status',
    '/aoma-ui/qc-notes',
    '/aoma-ui/video-metadata',
    '/aoma-ui/unregister-assets',
  ];
  const base = new URL(seed).origin;
  for (const p of commonPaths) {
    const u = norm(p.startsWith('http') ? p : base + p);
    if (u && allow(u)) queue.push(u);
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ storageState: fs.existsSync(STORAGE_STATE_PATH) ? STORAGE_STATE_PATH : undefined, ignoreHTTPSErrors: true });
  const page = await context.newPage();
  page.setDefaultTimeout(45000);

  while (queue.length && visited.size < MAX_PAGES) {
    const url = queue.shift();
    if (!url || visited.has(url)) continue;
    if (!allow(url)) continue;
    visited.add(url);
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});
      const links = (await extractLinks(page))
        .map(norm)
        .filter(Boolean)
        .filter(allow);
      for (const l of links) {
        if (!visited.has(l)) queue.push(l);
      }
      if (visited.size % 10 === 0) {
        await page.screenshot({ path: path.join(LOG_DIR, `disc-${visited.size}.png`), fullPage: true }).catch(() => {});
      }
      console.log(`Discovered: ${visited.size} | queued: ${queue.length} | ${url}`);
    } catch (e) {
      console.log(`Failed: ${url} :: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  const urls = Array.from(visited);
  fs.writeFileSync(OUT_URLS, JSON.stringify({ seed: seed, maxPages: MAX_PAGES, count: urls.length, urls }, null, 2));
  console.log(JSON.stringify({ ok: true, count: urls.length, out: OUT_URLS }));
  await browser.close();
})();


