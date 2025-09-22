/*
  AOMA Stage Page Scraper (Playwright, uses saved storage)
  - Loads storage from tmp/aoma-stage-storage.json
  - Navigates to provided URL
  - Waits for network idle
  - Saves HTML, screenshot, and discovered links to tmp/

  Usage:
    node scripts/aoma-scrape-page.js https://aoma-stage.smcdp-de.net
*/

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

async function main() {
  const url = process.argv[2];
  if (!url) {
    console.error('Usage: node scripts/aoma-scrape-page.js <url>');
    process.exit(1);
  }
  const outDir = path.resolve(process.cwd(), 'tmp');
  fs.mkdirSync(outDir, { recursive: true });

  const storagePath = path.join(outDir, 'aoma-stage-storage.json');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ storageState: fs.existsSync(storagePath) ? storagePath : undefined });
  const page = await context.newPage();

  console.log('Navigating to', url);
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120000 });

  // If landing page shows Employee Login, click it
  const empSelectors = [
    'button:has-text("Employee Login")',
    'text=/^\s*Employee\s+Login\s*$/i',
    '#employeeLogin, input[type="submit"][value*="Employee" i]'
  ];
  for (const sel of empSelectors) {
    const el = page.locator(sel).first();
    if (await el.isVisible().catch(() => false)) {
      console.log('Clicking Employee Login');
      await el.click().catch(()=>{});
      await page.waitForLoadState('networkidle', { timeout: 60000 }).catch(()=>{});
      break;
    }
  }

  await page.waitForLoadState('networkidle', { timeout: 60000 }).catch(()=>{});

  const safeName = url.replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, '');
  const htmlPath = path.join(outDir, `aoma_${safeName}.html`);
  const shotPath = path.join(outDir, `aoma_${safeName}.png`);
  const linksPath = path.join(outDir, `aoma_${safeName}_links.json`);

  const html = await page.content();
  fs.writeFileSync(htmlPath, html);
  await page.screenshot({ path: shotPath, fullPage: true }).catch(()=>{});

  const links = await page.evaluate(() => Array.from(document.querySelectorAll('a[href]')).map(a => ({ href: a.href, text: (a.textContent||'').trim() })).slice(0, 5000));
  fs.writeFileSync(linksPath, JSON.stringify({ url, count: links.length, links }, null, 2));

  console.log('Saved:', { htmlPath, shotPath, linksPath, linkCount: links.length });
  await browser.close();
}

main().catch(err => {
  console.error('Scrape error:', err);
  process.exit(1);
});


