/*
  Firecrawl v2.5 crawl with rich formats + document scraping.

  Env:
    - FIRECRAWL_API_KEY (required)
    - FIRECRAWL_START_URL (required)
    - FIRECRAWL_MAX_PAGES (default: 300)
    - FIRECRAWL_OUTPUT_DIR (default: tmp/firecrawl/v25)
    - AOMA_COOKIES_PATH (optional; if present, adds Cookie header)

  Features:
    - Calls crawl(...), requesting formats: markdown, html, links, images, screenshot
    - Writes each crawled item to JSON and .md files
    - Extracts document URLs (.pdf/.docx/.pptx/.xlsx/etc) from links and markdown
    - Scrapes each document URL with scrape(...) asking for markdown, saves alongside
*/

import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import FirecrawlApp from '@mendable/firecrawl-js';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

function ensureDirSync(dirPath) {
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
}
function buildCookieHeaderFromStorage(storagePath, targetHost) {
  try {
    const raw = fs.readFileSync(storagePath, 'utf8');
    const state = JSON.parse(raw);
    const cookies = Array.isArray(state?.cookies) ? state.cookies : [];
    const host = new URL(targetHost).hostname;
    const relevant = cookies.filter(c => (c?.domain || '').replace(/^\./,'') === host || (c?.domain || '').endsWith(`.${host}`));
    if (!relevant.length) return '';
    return relevant.map(c => `${c.name}=${c.value}`).join('; ');
  } catch {
    return '';
  }
}


function slugify(input) {
  return String(input || '')
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120) || 'page';
}

function unique(array) {
  return Array.from(new Set(array));
}

function extractDocLinksFromItem(item) {
  const exts = /(\.pdf|\.docx?|\.pptx?|\.xlsx?|\.xls)(\?|#|$)/i;
  const urls = [];
  // from item.links if present
  const links = (item?.links && Array.isArray(item.links)) ? item.links : [];
  for (const u of links) {
    if (typeof u === 'string' && exts.test(u)) urls.push(u);
    else if (u?.url && exts.test(u.url)) urls.push(u.url);
  }
  // loose parse markdown for URLs
  const md = String(item?.markdown || '');
  const mdUrls = Array.from(md.matchAll(/\((https?:[^\s)]+)\)/gi)).map(m => m[1]);
  for (const u of mdUrls) if (exts.test(u)) urls.push(u);
  return unique(urls);
}

async function main() {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) {
    console.error('❌ FIRECRAWL_API_KEY missing');
    process.exit(1);
  }

  const startUrl = process.env.FIRECRAWL_START_URL;
  if (!startUrl) {
    console.error('❌ FIRECRAWL_START_URL missing');
    process.exit(1);
  }

  const maxPages = Number(process.env.FIRECRAWL_MAX_PAGES || 300);
  const outDir = process.env.FIRECRAWL_OUTPUT_DIR || 'tmp/firecrawl/v25';
  const cookiePath = process.env.AOMA_COOKIES_PATH || '';
  const storagePath = process.env.AOMA_STORAGE_STATE || 'tmp/aoma-stage-storage.json';
  // Preferred: explicit Cookie header copied from DevTools
  let cookieHeader = (process.env.FIRECRAWL_COOKIES || '').trim();
  if (cookiePath && fs.existsSync(cookiePath)) {
    if (!cookieHeader) cookieHeader = fs.readFileSync(cookiePath, 'utf8').trim();
  }
  if (!cookieHeader && fs.existsSync(storagePath)) {
    cookieHeader = buildCookieHeaderFromStorage(storagePath, startUrl);
  }

  ensureDirSync(outDir);
  const docsDir = path.join(outDir, 'docs');
  const mdDir = path.join(outDir, 'md');
  const assetsDir = path.join(outDir, 'assets');
  ensureDirSync(docsDir);
  ensureDirSync(mdDir);
  ensureDirSync(assetsDir);

  const baseUrl = process.env.FIRECRAWL_BASE_URL || undefined;
  const app = new FirecrawlApp(baseUrl ? { apiKey, baseUrl } : { apiKey });

  const origin = (() => { try { return new URL(startUrl).origin; } catch { return null; } })();
  const includes = origin ? [ `${origin.replace(/\/$/, '')}/**` ] : [];
  const extraIncludes = (process.env.FIRECRAWL_EXTRA_INCLUDES || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
  if (extraIncludes.length) includes.push(...extraIncludes);

  const options = {
    crawlerOptions: {
      limit: maxPages,
      maxDepth: 6,
      includes,
      respectRobotsTxt: false,
      requestOptions: cookieHeader ? { headers: { Cookie: cookieHeader } } : undefined
    },
    pageOptions: {
      formats: ['markdown','html','links','images','screenshot'],
      onlyMainContent: false,
      timeout: 120000,
      // Also pass headers at the page level per Firecrawl auth docs
      headers: cookieHeader ? { Cookie: cookieHeader } : undefined,
      waitFor: 3000
    }
  };

  console.log(`🚀 v2.5 crawl → ${startUrl} (limit=${maxPages})`);

  // Start crawl with method compatibility
  let job;
  if (typeof app.crawlUrl === 'function') {
    job = await app.crawlUrl(startUrl, options);
  } else if (typeof app.crawlURL === 'function') {
    job = await app.crawlURL(startUrl, options);
  } else if (typeof app.crawl === 'function') {
    job = await app.crawl(startUrl, options);
  } else {
    console.error('❌ Firecrawl client missing crawl method');
    process.exit(1);
  }

  let status;
  if (!job?.jobId) {
    console.log('ℹ️ Immediate results (no job id)');
    status = job;
  } else {
    console.log(`🪪 Job ID: ${job.jobId}`);
    while (true) {
      if (typeof app.getCrawlStatus === 'function') status = await app.getCrawlStatus(job.jobId);
      else if (typeof app.getJobStatus === 'function') status = await app.getJobStatus(job.jobId);
      else { console.error('❌ Missing getCrawlStatus/getJobStatus'); process.exit(1); }
      if (status?.status === 'completed' || status?.status === 'failed') break;
      process.stdout.write('.');
      await new Promise(r => setTimeout(r, 2000));
    }
    console.log(`\n📊 Status: ${status?.status}`);
  }

  const allItems = status?.data || status?.result || [];
  const crawlOut = path.join(outDir, `crawl-result-${Date.now()}.json`);
  fs.writeFileSync(crawlOut, JSON.stringify(status, null, 2));
  console.log(`💾 Saved crawl status: ${crawlOut}`);

  // Write each crawled page to JSON and Markdown
  const docLinks = new Set();
  allItems.forEach((item, idx) => {
    const jsonFile = path.join(docsDir, `${String(idx + 1).padStart(3,'0')}.json`);
    fs.writeFileSync(jsonFile, JSON.stringify(item, null, 2));

    const title = item?.metadata?.title || item?.metadata?.sourceURL || `page-${idx+1}`;
    const slug = slugify(title);
    const mdFile = path.join(mdDir, `${slug}.md`);
    if (item?.markdown) fs.writeFileSync(mdFile, item.markdown);

    extractDocLinksFromItem(item).forEach(u => docLinks.add(u));
  });

  console.log(`🔗 Candidate document links: ${docLinks.size}`);

  // Scrape documents (pdf/docx/pptx/xlsx)
  const scrapeOptions = {
    formats: ['markdown','html'],
    onlyMainContent: false,
    timeout: 120000
  };

  const scrapeOne = async (url) => {
    try {
      let res;
      if (typeof app.scrapeUrl === 'function') res = await app.scrapeUrl(url, scrapeOptions);
      else if (typeof app.scrapeURL === 'function') res = await app.scrapeURL(url, scrapeOptions);
      else if (typeof app.scrape === 'function') res = await app.scrape(url, scrapeOptions);
      else throw new Error('Missing scrape method');

      const data = res?.data || res;
      const base = slugify(url.replace(/^https?:\/\//i, ''));
      const outJson = path.join(outDir, 'doc-scrapes', `${base}.json`);
      const outMd = path.join(outDir, 'doc-scrapes', `${base}.md`);
      ensureDirSync(path.dirname(outJson));
      fs.writeFileSync(outJson, JSON.stringify(data, null, 2));
      if (data?.markdown) fs.writeFileSync(outMd, data.markdown);
      console.log(`📥 Scraped doc → ${url}`);
    } catch (err) {
      console.warn(`⚠️  Doc scrape failed: ${url} → ${String(err)}`);
    }
  };

  // Run in small concurrency batches
  const urls = Array.from(docLinks);
  const concurrency = 4;
  for (let i = 0; i < urls.length; i += concurrency) {
    const batch = urls.slice(i, i + concurrency);
    await Promise.all(batch.map(u => scrapeOne(u)));
  }

  console.log('✅ v2.5 crawl and doc-scrape complete');
}

main().catch(e => { console.error('❌ Unhandled error:', e); process.exit(1); });


