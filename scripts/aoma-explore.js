/*
  AOMA Stage Explorer (Playwright + saved storage)
  - Loads tmp/aoma-stage-storage.json
  - Starts from a provided URL (defaults to STAGE_URL)
  - Clicks through in-app links/buttons (stage host only), avoids Microsoft hosts
  - Saves HTML, screenshots, and links for each visited page to tmp/

  Usage:
    node scripts/aoma-explore.js [startUrl] [maxPages] [maxDepth]
*/
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const STAGE_URL = process.env.AOMA_STAGE_URL || "https://aoma-stage.smcdp-de.net";
const startUrl = process.argv[2] || STAGE_URL;
const MAX_PAGES = Number(process.argv[3] || 10);
const MAX_DEPTH = Number(process.argv[4] || 2);

const OUT_DIR = path.resolve(process.cwd(), "tmp");
const STORAGE_FILE = path.join(OUT_DIR, "aoma-stage-storage.json");

function safeName(u) {
  return u
    .replace(/[^a-z0-9]+/gi, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 200);
}

async function savePage(page, url) {
  const name = safeName(url);
  const htmlPath = path.join(OUT_DIR, `aoma_${name}.html`);
  const shotPath = path.join(OUT_DIR, `aoma_${name}.png`);
  const linksPath = path.join(OUT_DIR, `aoma_${name}_links.json`);
  const html = await page.content();
  fs.writeFileSync(htmlPath, html);
  await page.screenshot({ path: shotPath, fullPage: true }).catch(() => {});
  const links = await page.evaluate(() =>
    Array.from(document.querySelectorAll("a[href]"))
      .map((a) => ({ href: a.href, text: (a.textContent || "").trim() }))
      .slice(0, 5000)
  );
  fs.writeFileSync(linksPath, JSON.stringify({ url, count: links.length, links }, null, 2));
  console.log("Saved:", { htmlPath, shotPath, linksPath, linkCount: links.length });
  return links;
}

(async () => {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    storageState: fs.existsSync(STORAGE_FILE) ? STORAGE_FILE : undefined,
  });
  const page = await context.newPage();

  const stageHost = new URL(STAGE_URL).host;
  const avoidHosts = [/microsoftonline/];
  const visited = new Set();
  const queue = [{ url: startUrl, depth: 0 }];

  while (queue.length && visited.size < MAX_PAGES) {
    const { url, depth } = queue.shift();
    let host;
    try {
      host = new URL(url).host;
    } catch {
      continue;
    }
    if (host !== stageHost) continue;
    if (Array.from(avoidHosts).some((re) => re.test(url))) continue;
    if (visited.has(url)) continue;
    visited.add(url);

    console.log(`Navigate [${visited.size}/${MAX_PAGES}] depth=${depth}:`, url);
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 120000 }).catch(() => {});
    await page.waitForLoadState("networkidle", { timeout: 60000 }).catch(() => {});
    const links = await savePage(page, url);

    // Click simple in-page nav if shallow depth
    if (depth < MAX_DEPTH) {
      // Collect candidate hrefs
      const next = links
        .map((l) => l.href)
        .filter((h) => {
          try {
            const u = new URL(h);
            if (u.host !== stageHost) return false;
            if (/microsoftonline/.test(u.host)) return false;
            return true;
          } catch {
            return false;
          }
        })
        .slice(0, 20);
      for (const n of next) {
        if (!visited.has(n)) queue.push({ url: n, depth: depth + 1 });
      }
    }
  }

  console.log("Visited:", visited.size);
  await browser.close();
})().catch((err) => {
  console.error("Explorer error:", err);
  process.exit(1);
});
