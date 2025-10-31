/*
  Authenticated Firecrawl crawl for AOMA Stage.

  Prereqs:
    - FIRECRAWL_API_KEY in .env.local
    - Run Playwright login first to generate tmp/aoma-cookie.txt

  Env vars (with sensible defaults):
    - AOMA_START_URL: starting page (falls back to AOMA_STAGING_HOST)
    - AOMA_STAGING_HOST: https://aoma-stage.smcdp-de.net
    - AOMA_COOKIES_PATH: tmp/aoma-cookie.txt
    - FIRECRAWL_MAX_PAGES: 30
    - FIRECRAWL_OUTPUT_DIR: tmp/firecrawl

  Usage:
    node scripts/aoma/firecrawl-auth-crawl.mjs
*/

import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import FirecrawlApp from '@mendable/firecrawl-js';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

function ensureDirSync(dirPath) {
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
}

function readCookieHeader(cookiePath) {
  if (!fs.existsSync(cookiePath)) return '';
  return fs.readFileSync(cookiePath, 'utf8').trim();
}

async function sleep(ms) {
  return new Promise(res => setTimeout(res, ms));
}

async function main() {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) {
    console.error('❌ FIRECRAWL_API_KEY missing. Add it to .env.local');
    process.exit(1);
  }

  const stagingHost = process.env.AOMA_STAGING_HOST || 'https://aoma-stage.smcdp-de.net';
  const startUrl = process.env.FIRECRAWL_START_URL || process.env.AOMA_START_URL || stagingHost;
  const cookiePath = process.env.AOMA_COOKIES_PATH || 'tmp/aoma-cookie.txt';
  const maxPages = Number(process.env.FIRECRAWL_MAX_PAGES || 30);
  const outDir = process.env.FIRECRAWL_OUTPUT_DIR || 'tmp/firecrawl';

  ensureDirSync(outDir);

  const cookieHeader = readCookieHeader(cookiePath);
  if (!cookieHeader) {
    console.error('❌ Cookie header not found. Run the Playwright downloader/login first.');
    process.exit(1);
  }

  const baseUrl = process.env.FIRECRAWL_BASE_URL || undefined;
  const app = new FirecrawlApp(baseUrl ? { apiKey, baseUrl } : { apiKey });

  console.log(`🚀 Starting authenticated crawl: ${startUrl} (limit=${maxPages})`);

  // Firecrawl options; headers support may vary by version but safe to pass
  const options = {
    crawlerOptions: {
      limit: maxPages,
      maxDepth: 2,
      includes: (() => {
        try {
          const origin = new URL(startUrl).origin.replace(/\/$/, '');
          return [ `${origin}/**` ];
        } catch { return []; }
      })(),
      respectRobotsTxt: false,
      // Attempt to pass cookies for auth
      requestOptions: {
        headers: {
          'Cookie': cookieHeader,
          'User-Agent': 'siam-aoma-crawler/1.0'
        }
      }
    },
    pageOptions: {
      onlyMainContent: false,
      fetchPageContent: true
    }
  };

  let job;
  if (typeof app.crawlUrl === 'function') {
    job = await app.crawlUrl(startUrl, options);
  } else if (typeof app.crawlURL === 'function') {
    job = await app.crawlURL(startUrl, options);
  } else if (typeof app.crawl === 'function') {
    job = await app.crawl(startUrl, options);
  } else {
    console.error('❌ Firecrawl client missing crawl method.');
    process.exit(1);
  }

  // Handle immediate results (no jobId) vs job-based polling
  let status;
  if (!job?.jobId) {
    console.log('ℹ️ Firecrawl returned immediate results (no job id).');
    status = job;
  } else {
    console.log(`🪪 Job ID: ${job.jobId}`);

    // Poll for completion and write live status
    const liveStatusPath = path.join(outDir, 'status.json');
    while (true) {
      if (typeof app.getCrawlStatus === 'function') {
        status = await app.getCrawlStatus(job.jobId);
      } else if (typeof app.getJobStatus === 'function') {
        status = await app.getJobStatus(job.jobId);
      } else {
        console.error('❌ Firecrawl client missing getCrawlStatus/getJobStatus.');
        process.exit(1);
      }
      try {
        const snapshot = {
          jobId: job.jobId,
          status: status?.status || 'unknown',
          updatedAt: new Date().toISOString(),
          counts: {
            total: Array.isArray(status?.data) ? status.data.length : undefined,
            totalAlt: Array.isArray(status?.result) ? status.result.length : undefined
          }
        };
        fs.writeFileSync(liveStatusPath, JSON.stringify(snapshot, null, 2));
      } catch (_) {}

      if (status?.status === 'completed' || status?.status === 'failed') break;
      process.stdout.write('.');
      await sleep(2000);
    }
    console.log(`\n📊 Status: ${status?.status}`);
  }

  const outPath = path.join(outDir, `crawl-result-${Date.now()}.json`);
  fs.writeFileSync(outPath, JSON.stringify(status, null, 2));
  console.log(`💾 Saved status/result: ${outPath}`);

  // Save each document (if present)
  const items = status?.data || status?.result || [];
  if (Array.isArray(items) && items.length) {
    const docsDir = path.join(outDir, 'docs');
    ensureDirSync(docsDir);
    items.forEach((doc, idx) => {
      const file = path.join(docsDir, `${String(idx + 1).padStart(3, '0')}.json`);
      fs.writeFileSync(file, JSON.stringify(doc, null, 2));
    });
    console.log(`🗂️  Saved ${items.length} documents under ${docsDir}`);
  }

  console.log('✅ Done');
}

main().catch(e => {
  console.error('❌ Unhandled error:', e);
  process.exit(1);
});


