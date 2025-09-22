/*
  AOMA Click Crawler (Playwright + saved storage)
  - Interacts with JS-driven UI (tiles/buttons/menus)
  - Clicks visible tiles and menu items by text; handles submitChain onclicks
  - Saves HTML/PNG/links for each visited screen; stays on stage host

  Usage: node scripts/aoma-click-crawl.js [startUrl] [maxPages]
*/
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const STAGE_URL = process.env.AOMA_STAGE_URL || 'https://aoma-stage.smcdp-de.net';
const startUrl = process.argv[2] || STAGE_URL;
const MAX_PAGES = Number(process.argv[3] || 12);

const OUT_DIR = path.resolve(process.cwd(), 'tmp');
const STORAGE_FILE = path.join(OUT_DIR, 'aoma-stage-storage.json');

function safeName(u){ return u.replace(/[^a-z0-9]+/gi,'_').replace(/^_+|_+$/g,'').slice(0,200); }
async function savePage(page, url){
  const name = safeName(url);
  const htmlPath = path.join(OUT_DIR, `aoma_${name}.html`);
  const shotPath = path.join(OUT_DIR, `aoma_${name}.png`);
  const linksPath = path.join(OUT_DIR, `aoma_${name}_links.json`);
  const html = await page.content();
  fs.writeFileSync(htmlPath, html);
  await page.screenshot({ path: shotPath, fullPage: true }).catch(()=>{});
  const links = await page.evaluate(() => Array.from(document.querySelectorAll('a[href], [onclick]')).map(el => ({ href: el.getAttribute('href')||'', onclick: el.getAttribute('onclick')||'', text: (el.textContent||'').trim() })).slice(0, 1000));
  fs.writeFileSync(linksPath, JSON.stringify({ url, count: links.length, links }, null, 2));
  console.log('Saved:', { htmlPath, shotPath, linksPath, linkCount: links.length });
}

(async () => {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ storageState: fs.existsSync(STORAGE_FILE) ? STORAGE_FILE : undefined });
  const page = await context.newPage();
  const stageHost = new URL(STAGE_URL).host;
  const visited = new Set();
  let count = 0;

  async function visit(url){
    if (count >= MAX_PAGES) return;
    let host; try { host = new URL(url).host; } catch { return; }
    if (host !== stageHost) return;
    if (visited.has(url)) return;
    visited.add(url); count++;
    console.log(`Visit [${count}/${MAX_PAGES}]:`, url);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120000 }).catch(()=>{});
    await page.waitForLoadState('networkidle', { timeout: 60000 }).catch(()=>{});
    await savePage(page, url);

    // Gather clickable candidates on this page
    const selectors = [
      'a.login-btn',
      'a:has-text("Unified Submission Tool")',
      'a:has-text("Direct Upload")',
      'a:has-text("Simple Upload")',
      'a:has-text("Registration Job Status")',
      'a:has-text("Unregister Assets")',
      'a:has-text("My AOMA Files")',
      'a:has-text("Product Metadata Viewer")',
      '[onclick*="submitChain"]'
    ];

    for (const sel of selectors){
      const els = await page.$$(sel).catch(()=>[]);
      for (let i=0; i<els.length && count < MAX_PAGES; i++){
        const el = els[i];
        const href = (await el.getAttribute('href').catch(()=>'')) || '';
        const onclick = (await el.getAttribute('onclick').catch(()=>'')) || '';
        // Build target URL
        let target = '';
        if (href && /^https?:/.test(href)) target = href;
        else if (href && href.startsWith('/')) target = `https://${stageHost}${href}`;
        else if (/submitChain\('([^']+)'\)/.test(onclick)){
          const chain = onclick.match(/submitChain\('([^']+)'\)/)[1];
          target = `https://${stageHost}/servlet/com.sonymusic.aoma.AOMADispatcherServlet?chain=${chain}`;
        }
        if (!target) continue;
        const thost = (()=>{ try { return new URL(target).host; } catch { return ''; }})();
        if (thost !== stageHost) continue;
        if (visited.has(target)) continue;
        // Open in same page to ensure cookies apply
        await visit(target);
      }
    }
  }

  await visit(startUrl);
  console.log('Visited pages:', visited.size);
  await browser.close();
})().catch(err => { console.error('Click crawler error:', err); process.exit(1); });


