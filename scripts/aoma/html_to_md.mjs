#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import TurndownService from 'turndown';

const OUT_DIR = path.join(process.cwd(), 'aoma_crawl');
const HTML_DIR = path.join(OUT_DIR, 'html');
const MD_DIR = path.join(OUT_DIR, 'md');

function ensureDir(d) { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); }

(async () => {
  ensureDir(MD_DIR);
  const turndown = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' });
  turndown.remove(['script', 'style', 'nav', 'footer', 'header']);

  const files = fs.readdirSync(HTML_DIR).filter((f) => f.endsWith('.html'));
  let converted = 0;
  for (const f of files) {
    const html = fs.readFileSync(path.join(HTML_DIR, f), 'utf8');
    const md = turndown.turndown(html);
    const cleaned = md.replace(/\n{3,}/g, '\n\n').replace(/[ \t]+$/gm, '').trim();
    fs.writeFileSync(path.join(MD_DIR, f.replace(/\.html$/i, '.md')), cleaned, 'utf8');
    converted += 1;
  }
  console.log(JSON.stringify({ ok: true, converted }));
})();






