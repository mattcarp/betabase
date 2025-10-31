#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const DEEP_FILE = path.join(process.cwd(), 'scripts/aoma-deep-crawl.js');
const OUT_DIR = path.join(process.cwd(), 'aoma_crawl');
const URLS_JSON = path.join(OUT_DIR, 'urls.json');
const BASE = (process.env.AOMA_STAGE_URL || 'https://aoma-stage.smcdp-de.net').replace(/\/$/, '');

function ensureDir(d){ if(!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); }

function extractEndpoints(src){
  const m = src.match(/const\s+AOMA_ENDPOINTS\s*=\s*\[(\s|\S)*?\];/);
  if(!m) return [];
  const block = m[0];
  const re = /"([^"]+)"|'([^']+)'/g;
  const items = [];
  let mm;
  while ((mm = re.exec(block))) {
    const val = (mm[1] || mm[2] || '').trim();
    if (!val) continue;
    if (val.startsWith('/')) items.push(val);
  }
  return Array.from(new Set(items));
}

function mergeUrls(existing, endpoints){
  const set = new Set([...(existing || [])]);
  for(const ep of endpoints){
    const abs = `${BASE}${ep}`;
    set.add(abs);
  }
  return Array.from(set);
}

(async () => {
  ensureDir(OUT_DIR);
  const src = fs.readFileSync(DEEP_FILE, 'utf8');
  const endpoints = extractEndpoints(src);
  let existing = [];
  if (fs.existsSync(URLS_JSON)) {
    try { existing = JSON.parse(fs.readFileSync(URLS_JSON, 'utf8')).urls || []; } catch {}
  }
  const urls = mergeUrls(existing, endpoints);
  fs.writeFileSync(URLS_JSON, JSON.stringify({ seed: BASE, count: urls.length, urls }, null, 2));
  console.log(JSON.stringify({ ok: true, added: urls.length - existing.length, total: urls.length, out: URLS_JSON }));
})();






