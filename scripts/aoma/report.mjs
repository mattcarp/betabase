#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const OUT_DIR = path.join(process.cwd(), 'aoma_crawl');
const URLS = path.join(OUT_DIR, 'urls.json');
const PAGES = path.join(OUT_DIR, 'pages.jsonl');
const MANIFEST = path.join(OUT_DIR, 'manifest.json');

function safeReadJson(p, dflt) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return dflt; }
}

(async () => {
  const urls = safeReadJson(URLS, { urls: [] }).urls;
  const pages = [];
  if (fs.existsSync(PAGES)) {
    const lines = fs.readFileSync(PAGES, 'utf8').split(/\r?\n/).filter(Boolean);
    for (const line of lines) {
      try { pages.push(JSON.parse(line)); } catch {}
    }
  }
  const successes = pages.filter((p) => p.htmlPath);
  const failures = pages.filter((p) => !p.htmlPath);
  const binaries = successes.reduce((sum, p) => sum + (Array.isArray(p.binaries) ? p.binaries.filter(b => b && b.ok).length : 0), 0);
  const totalHtmlBytes = successes.reduce((sum, p) => sum + (p.htmlSize || 0), 0);

  const manifest = {
    runAt: new Date().toISOString(),
    totals: {
      urlsQueued: urls.length,
      pagesCaptured: successes.length,
      pagesFailed: failures.length,
      binariesDownloaded: binaries,
      totalHtmlBytes,
    },
    outputs: {
      urlsJson: path.relative(process.cwd(), URLS),
      pagesJsonl: path.relative(process.cwd(), PAGES),
      manifest: path.relative(process.cwd(), MANIFEST),
      htmlDir: path.relative(process.cwd(), path.join(OUT_DIR, 'html')),
      mdDir: path.relative(process.cwd(), path.join(OUT_DIR, 'md')),
      filesDir: path.relative(process.cwd(), path.join(OUT_DIR, 'files')),
    },
    sample: successes.slice(0, 5).map((p) => ({ url: p.url, title: p.title, status: p.status })),
  };
  fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2));
  console.log(JSON.stringify({ ok: true, manifest: MANIFEST, pages: successes.length }));
})();






