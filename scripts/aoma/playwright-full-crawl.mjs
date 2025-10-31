#!/usr/bin/env node
/*
  Playwright-based crawler that mimics Firecrawl v2.5 outputs for AOMA.
  - Reuses authenticated session via storageState or Cookie header
  - Crawls within same-origin; follows Media Guide if discovered from AOMA
  - Saves per-page: HTML, Markdown, links.json, screenshot.png, logs.json
  - Auto-downloads and converts common docs (PDF/DOCX/XLSX) to Markdown
  - Dedupe by URL without query params; configurable depth/limit/concurrency
*/

import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import TurndownService from 'turndown';
import axios from 'axios';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env.local
const dotenv = require('dotenv');
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

const mammoth = require('mammoth');
const pdfParse = require('pdf-parse');
const xlsx = require('xlsx');

const env = process.env;

const START_URL = env.AOMA_START_URL || env.FIRECRAWL_START_URL || 'https://aoma-stage.smcdp-de.net';
const OUTPUT_DIR = env.AOMA_OUTPUT_DIR || env.FIRECRAWL_OUTPUT_DIR || 'tmp/pw-crawl/aoma';
const STORAGE_STATE = env.AOMA_STORAGE_STATE || 'tmp/aoma-stage-storage.json';
const COOKIES_PATH = env.AOMA_COOKIES_PATH || 'tmp/aoma-cookie.txt';
const MAX_PAGES = Number(env.PW_CRAWL_MAX_PAGES || env.FIRECRAWL_MAX_PAGES || 2000);
const MAX_DEPTH = Number(env.PW_CRAWL_MAX_DEPTH || 5);
const CONCURRENCY = Number(env.PW_CRAWL_CONCURRENCY || 5);
const WAIT_FOR_MS = Number(env.PW_CRAWL_WAIT_FOR || 6000);
const HEADLESS = env.PW_CRAWL_HEADLESS !== 'false';
const AAD_USERNAME = env.AAD_USERNAME;
const AAD_PASSWORD = env.AAD_PASSWORD;

const turndown = new TurndownService();

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function sanitizeFilename(input) {
  return input
    .replace(/[^a-z0-9-_\.]/gi, '_')
    .replace(/_+/g, '_')
    .slice(0, 180);
}

function canonicalize(url) {
  try {
    const u = new URL(url);
    u.hash = '';
    u.search = '';
    return u.toString();
  } catch {
    return url;
  }
}

function shouldFollowLink(href, startHost) {
  try {
    const u = new URL(href);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return false;
    if (u.hostname === startHost) return true;
    // Allow Media Guide if discovered from AOMA
    if (u.hostname === 'mediaguide.sonymusic.com') return true;
    return false;
  } catch {
    return false;
  }
}

async function buildCookieHeader(context) {
  // Priority: explicit file -> FIRECRAWL_COOKIES env -> context cookies
  if (COOKIES_PATH && fs.existsSync(COOKIES_PATH)) {
    return fs.readFileSync(COOKIES_PATH, 'utf8').trim();
  }
  if (env.FIRECRAWL_COOKIES) return env.FIRECRAWL_COOKIES.trim();
  const cookies = await context.cookies();
  return cookies.map(c => `${c.name}=${c.value}`).join('; ');
}

async function saveDocToMarkdown({ url, outDir, cookie }) {
  const ext = path.extname(new URL(url).pathname).toLowerCase();
  const base = sanitizeFilename(new URL(url).pathname.replace(/\/+/, '_')) || 'file';
  const docDir = path.join(outDir, 'docs');
  ensureDir(docDir);

  const headers = cookie ? { Cookie: cookie } : undefined;
  const res = await axios.get(url, { responseType: 'arraybuffer', headers, timeout: 60000 });
  const buf = Buffer.from(res.data);
  const rawPath = path.join(docDir, `${base}${ext || ''}`);
  fs.writeFileSync(rawPath, buf);

  const mdPath = path.join(docDir, `${base}.md`);
  if (ext === '.pdf') {
    const parsed = await pdfParse(buf);
    fs.writeFileSync(mdPath, `# Extracted from PDF\n\n${parsed.text}`);
  } else if (ext === '.docx') {
    const { value } = await mammoth.extractRawText({ buffer: buf });
    fs.writeFileSync(mdPath, `# Extracted from DOCX\n\n${value}`);
  } else if (ext === '.xlsx' || ext === '.xls') {
    const wb = xlsx.read(buf, { type: 'buffer' });
    const mdParts = [];
    for (const sheet of wb.SheetNames) {
      const json = xlsx.utils.sheet_to_json(wb.Sheets[sheet], { header: 1 });
      mdParts.push(`\n\n## ${sheet}\n`);
      for (const row of json) {
        const cells = (row || []).map(v => `${String(v ?? '')}`);
        if (cells.length) mdParts.push(`| ${cells.join(' | ')} |`);
      }
    }
    fs.writeFileSync(mdPath, `# Extracted from Excel${mdParts.join('')}`);
  } else {
    // Unknown binary; just store raw
    fs.writeFileSync(mdPath, `Downloaded ${url} (saved raw as ${path.basename(rawPath)})`);
  }
}

function extractLinksFromHTML(html, baseUrl) {
  const links = [];
  const regex = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>/gi;
  let m;
  while ((m = regex.exec(html))) {
    try {
      const resolved = new URL(m[1], baseUrl).toString();
      links.push(resolved);
    } catch {}
  }
  return Array.from(new Set(links));
}

async function tryClickEmployeeLogin(page) {
  try {
    const link = await page.$('a:has-text("Employee Login")');
    if (!link) return false;
    console.log('👤 Clicking Employee Login...');
    await Promise.all([
      page.waitForNavigation({ url: /login\.microsoftonline\.com/i, waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {}),
      link.click({ force: true })
    ]);
    return true;
  } catch (_) {
    return false;
  }
}

async function performAADLoginIfNeeded(page, stagingHostOrigin) {
  if (!/login\.microsoftonline\.com/i.test(page.url())) return false;

  if (!AAD_USERNAME || !AAD_PASSWORD) {
    console.log('ℹ️  On Microsoft login; waiting up to 90s for manual SSO/MFA...');
    try { await page.waitForLoadState('networkidle', { timeout: 90000 }); } catch (_) {}
    return true;
  }

  console.log('🔐 Performing AAD auto-login...');
  try {
    await page.waitForSelector('input[name="loginfmt"]', { timeout: 15000 });
    await page.fill('input[name="loginfmt"]', AAD_USERNAME);
    const next1 = await page.$('#idSIButton9, input[type="submit"], button[type="submit"]');
    if (next1) await Promise.all([
      page.waitForLoadState('domcontentloaded').catch(() => {}),
      next1.click()
    ]);
  } catch (_) {}

  try {
    await page.waitForSelector('input[name="passwd"]', { timeout: 20000 });
    await page.fill('input[name="passwd"]', AAD_PASSWORD);
    await page.waitForTimeout(500);
    const signin = await page.$('button:has-text("Sign in"), input[type="submit"]:has-text("Sign in"), #idSIButton9, input[type="submit"], button[type="submit"]');
    if (signin) {
      console.log('🔘 Clicking Sign in button...');
      await Promise.all([
        page.waitForLoadState('domcontentloaded', { timeout: 30000 }).catch(() => {}),
        signin.click()
      ]);
    }
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
    console.log('✅ AAD login complete');
    return true;
  } catch (_) {
    console.log('⚠️  AAD login may not have completed');
    return false;
  }
}

async function detectAndHandleAuth(page, stagingHostOrigin) {
  // Check if we landed on login page or if page has 401 errors
  const html = await page.content();
  const isLoginPage = /AOMA Login|Employee Login/i.test(html);
  
  if (!isLoginPage) return true; // Already authenticated
  
  console.log('🔒 Authentication required, attempting login...');
  const clicked = await tryClickEmployeeLogin(page);
  if (clicked) {
    const loginSuccess = await performAADLoginIfNeeded(page, stagingHostOrigin);
    if (loginSuccess) {
      // Wait for page to fully load after auth
      try { await page.waitForLoadState('networkidle', { timeout: 15000 }); } catch (_) {}
      return true;
    }
  }
  
  return false;
}

async function crawl() {
  ensureDir(OUTPUT_DIR);
  const start = new URL(START_URL);
  const stagingHostOrigin = start.origin;

  const browser = await chromium.launch({ headless: HEADLESS });
  const context = await browser.newContext({
    storageState: fs.existsSync(STORAGE_STATE) ? STORAGE_STATE : undefined,
  });

  const cookieHeader = await buildCookieHeader(context);

  const visited = new Set();
  const queue = [{ url: START_URL, depth: 0 }];
  let processed = 0;
  let authRefreshed = false;

  async function processUrl(item) {
    if (processed >= MAX_PAGES) return;
    const canonical = canonicalize(item.url);
    if (visited.has(canonical)) return;
    visited.add(canonical);

    const page = await context.newPage();
    const logs = [];
    const errors = [];
    page.on('console', msg => logs.push({ type: msg.type(), text: msg.text() }));
    page.on('pageerror', err => errors.push({ message: String(err) }));

    await page.setExtraHTTPHeaders(cookieHeader ? { Cookie: cookieHeader } : {});
    await page.goto(item.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    
    try { await page.waitForLoadState('networkidle', { timeout: WAIT_FOR_MS }); } catch {}
    
    // Check if we're still on login page despite using saved session
    let html = await page.content();
    if (!authRefreshed && /AOMA Login|Employee Login/i.test(html)) {
      console.log(`🔒 Login page detected, attempting AAD flow...`);
      const authenticated = await detectAndHandleAuth(page, stagingHostOrigin);
      if (authenticated) {
        await context.storageState({ path: STORAGE_STATE });
        authRefreshed = true;
        console.log('💾 Saved fresh session state after AAD login');
        // Re-capture HTML after auth
        html = await page.content();
      } else {
        console.log(`⚠️  Auth failed for: ${item.url}, skipping page`);
        await page.close();
        return;
      }
    }
    
    const title = await page.title().catch(() => '');
    
    // Extract ONLY semantic elements to avoid CSS/JS bloat
    const semanticHtml = await page.evaluate(() => {
      const semanticTags = 'h1, h2, h3, h4, h5, h6, p, ul, ol, li, table, thead, tbody, tr, th, td, a, strong, em, blockquote, pre, code';
      const elements = Array.from(document.querySelectorAll(semanticTags));
      return elements.map(el => el.outerHTML).join('\n');
    });
    
    const md = semanticHtml ? turndown.turndown(semanticHtml) : turndown.turndown(html);
    const links = extractLinksFromHTML(html, item.url);

    const baseName = sanitizeFilename(new URL(canonical).hostname + new URL(canonical).pathname.replace(/\/+/, '_')) || 'page';
    const outDir = path.join(OUTPUT_DIR, baseName);
    ensureDir(outDir);
    fs.writeFileSync(path.join(outDir, 'page.html'), html);
    fs.writeFileSync(path.join(outDir, 'page.md'), md);
    fs.writeFileSync(path.join(outDir, 'links.json'), JSON.stringify(links, null, 2));
    try { await page.screenshot({ path: path.join(outDir, 'screenshot.png'), fullPage: true }); } catch {}
    fs.writeFileSync(path.join(outDir, 'logs.json'), JSON.stringify({ logs, errors }, null, 2));

    // Auto-download docs
    const docExts = ['.pdf', '.doc', '.docx', '.xls', '.xlsx'];
    const docLinks = links.filter(h => {
      try { return docExts.includes(path.extname(new URL(h).pathname).toLowerCase()); } catch { return false; }
    });
    for (const dl of docLinks) {
      try { await saveDocToMarkdown({ url: dl, outDir, cookie: cookieHeader }); } catch {}
    }

    processed += 1;

    if (item.depth < MAX_DEPTH) {
      const toEnqueue = links.filter(h => shouldFollowLink(h, start.hostname)).map(h => ({ url: h, depth: item.depth + 1 }));
      for (const nxt of toEnqueue) {
        const can = canonicalize(nxt.url);
        if (!visited.has(can)) queue.push(nxt);
      }
    }

    await page.close();
  }

  const workers = Array.from({ length: CONCURRENCY }).map(async () => {
    while (queue.length && processed < MAX_PAGES) {
      const next = queue.shift();
      if (!next) break;
      await processUrl(next);
    }
  });

  await Promise.all(workers);
  await browser.close();

  const status = { startUrl: START_URL, processed, uniqueVisited: visited.size, outputDir: OUTPUT_DIR, maxDepth: MAX_DEPTH };
  fs.writeFileSync(path.join(OUTPUT_DIR, 'status.json'), JSON.stringify(status, null, 2));
  console.log(JSON.stringify(status));
}

crawl().catch(err => {
  console.error('Crawler failed:', err);
  process.exit(1);
});


