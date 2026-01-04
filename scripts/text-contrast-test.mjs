#!/usr/bin/env node
/**
 * Text Contrast Test Script
 * Creates visible test panels with teal backgrounds and different text colors
 */

import { chromium } from 'playwright';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
const OUTPUT_DIR = join(process.cwd(), 'contrast-screenshots');

const TEXT_OPTIONS = [
  { id: 'white', name: 'White (Current)', color: '#ffffff', description: 'Current default - pure white' },
  { id: 'dark-teal', name: 'Dark Teal', color: '#003d44', description: 'Very dark teal for maximum contrast' },
  { id: 'navy', name: 'Navy Blue', color: '#0a1628', description: 'Deep navy - high contrast, warm feel' },
  { id: 'black', name: 'Near Black', color: '#0f0f0f', description: 'Almost black - maximum contrast' },
  { id: 'cream', name: 'Warm Cream', color: '#fffef5', description: 'Slightly warm white - softer look' }
];

async function testTextContrast() {
  console.log('Starting text contrast test...');

  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1200, height: 800 } });
  const page = await context.newPage();
  const screenshots = [];

  try {
    await page.goto(BASE_URL);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);

    for (const theme of ['dark', 'light']) {
      console.log(`\nTesting ${theme} theme...`);

      await page.evaluate((t) => {
        const themeName = t === 'dark' ? 'mac' : 'light';
        localStorage.setItem('siam-theme-preference', themeName);
        document.documentElement.setAttribute('data-theme', themeName);
        if (t === 'dark') document.body.classList.add('dark');
        else document.body.classList.remove('dark');
      }, theme);
      await page.waitForTimeout(400);

      for (const option of TEXT_OPTIONS) {
        console.log(`  Testing: ${option.name}`);

        await page.evaluate(({ opt, isDark }) => {
          const existing = document.getElementById('contrast-test-panel');
          if (existing) existing.remove();

          const tealBg = isDark ? '#26c6da' : '#0097a7';
          const tealBgHover = isDark ? '#00bcd4' : '#00838f';
          const panelBg = isDark ? '#0a0a0a' : '#ffffff';
          const textColor = isDark ? '#fff' : '#111';
          const mutedColor = isDark ? '#888' : '#666';
          const codeBg = isDark ? '#222' : '#f0f0f0';

          const panel = document.createElement('div');
          panel.id = 'contrast-test-panel';
          panel.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:99999;';

          const container = document.createElement('div');
          container.style.cssText = `background:${panelBg};border:1px solid ${isDark?'#333':'#ddd'};border-radius:16px;padding:40px;box-shadow:0 25px 80px rgba(0,0,0,0.5);width:700px;`;

          const h2 = document.createElement('h2');
          h2.textContent = opt.name;
          h2.style.cssText = `margin:0 0 8px 0;font-size:24px;font-weight:500;color:${textColor};`;
          container.appendChild(h2);

          const desc = document.createElement('p');
          desc.style.cssText = `margin:0 0 24px 0;color:${mutedColor};font-size:14px;`;
          desc.textContent = opt.description + ' — ';
          const code = document.createElement('code');
          code.textContent = opt.color;
          code.style.cssText = `background:${codeBg};padding:2px 6px;border-radius:4px;`;
          desc.appendChild(code);
          container.appendChild(desc);

          const btnRow = document.createElement('div');
          btnRow.style.cssText = 'display:flex;gap:16px;flex-wrap:wrap;margin-bottom:24px;';

          const btn1 = document.createElement('button');
          btn1.textContent = 'Primary Button';
          btn1.style.cssText = `background:${tealBg};color:${opt.color};border:none;padding:14px 28px;border-radius:8px;font-size:16px;font-weight:500;cursor:pointer;`;
          btnRow.appendChild(btn1);

          const btn2 = document.createElement('button');
          btn2.textContent = 'Hover State';
          btn2.style.cssText = `background:${tealBgHover};color:${opt.color};border:none;padding:14px 28px;border-radius:8px;font-size:16px;font-weight:500;cursor:pointer;`;
          btnRow.appendChild(btn2);

          const btn3 = document.createElement('button');
          btn3.textContent = 'Small Button';
          btn3.style.cssText = `background:${tealBg};color:${opt.color};border:none;padding:10px 20px;border-radius:6px;font-size:14px;font-weight:500;cursor:pointer;`;
          btnRow.appendChild(btn3);

          container.appendChild(btnRow);

          const card = document.createElement('div');
          card.style.cssText = `background:${tealBg};color:${opt.color};padding:20px 24px;border-radius:8px;margin-bottom:16px;`;
          const cardH = document.createElement('div');
          cardH.textContent = 'Card Header on Teal';
          cardH.style.cssText = 'font-size:18px;font-weight:500;margin-bottom:8px;';
          card.appendChild(cardH);
          const cardP = document.createElement('div');
          cardP.textContent = 'This is body text on a teal background. How readable is this?';
          cardP.style.cssText = 'font-size:14px;opacity:0.9;';
          card.appendChild(cardP);
          container.appendChild(card);

          const tagRow = document.createElement('div');
          tagRow.style.cssText = 'display:flex;gap:12px;align-items:center;';

          const badge = document.createElement('span');
          badge.textContent = 'Badge Label';
          badge.style.cssText = `background:${tealBg};color:${opt.color};padding:6px 14px;border-radius:20px;font-size:13px;font-weight:500;`;
          tagRow.appendChild(badge);

          const tag = document.createElement('span');
          tag.textContent = 'Tag';
          tag.style.cssText = `background:${tealBg};color:${opt.color};padding:4px 10px;border-radius:4px;font-size:12px;`;
          tagRow.appendChild(tag);

          const link = document.createElement('a');
          link.href = '#';
          link.textContent = 'Link on ' + (isDark ? 'dark' : 'light') + ' bg';
          link.style.cssText = `color:${tealBg};font-size:14px;text-decoration:underline;`;
          tagRow.appendChild(link);

          container.appendChild(tagRow);
          panel.appendChild(container);
          document.body.appendChild(panel);
        }, { opt: option, isDark: theme === 'dark' });

        await page.waitForTimeout(200);

        const filename = `${theme}-${option.id}.png`;
        await page.screenshot({ path: join(OUTPUT_DIR, filename), fullPage: false });
        screenshots.push({ theme, option, file: filename });

        await page.evaluate(() => {
          const panel = document.getElementById('contrast-test-panel');
          if (panel) panel.remove();
        });
      }
    }

    console.log(`\nCaptured ${screenshots.length} screenshots`);
  } finally {
    await browser.close();
  }

  generateGallery(screenshots);
  console.log(`\nGallery: file://${join(OUTPUT_DIR, 'index.html')}`);
}

function generateGallery(screenshots) {
  const darkShots = screenshots.filter(s => s.theme === 'dark');
  const lightShots = screenshots.filter(s => s.theme === 'light');

  const cardHtml = (s) => `
    <div class="card ${s.option.id === 'white' ? 'current' : ''}">
      <img src="${s.file}" alt="${s.option.name}" onclick="openModal(this.src)">
      <div class="info">
        <div class="name">
          <span class="swatch" style="background:${s.option.color}"></span>
          ${s.option.name}
          ${s.option.id === 'white' ? '<span class="tag">CURRENT</span>' : ''}
        </div>
        <div class="desc">${s.option.description}</div>
        <div class="hex">${s.option.color}</div>
      </div>
    </div>`;

  const html = `<!DOCTYPE html>
<html><head>
<meta charset="UTF-8"><title>Text Contrast Options</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:system-ui,sans-serif;background:#0a0a0a;color:#fff;padding:2rem}
h1{text-align:center;font-weight:300;margin-bottom:.5rem}
.sub{text-align:center;color:#666;margin-bottom:2rem}
.section{max-width:1600px;margin:0 auto 3rem}
h2{font-weight:400;margin-bottom:1rem;border-bottom:1px solid #222;padding-bottom:.5rem}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:1rem}
.card{background:#111;border-radius:12px;overflow:hidden;border:1px solid #222;transition:.2s}
.card:hover{border-color:#26c6da;transform:translateY(-2px)}
.card.current{border-color:#f59e0b}
.card img{width:100%;cursor:pointer}
.info{padding:1rem}
.name{font-weight:500;display:flex;align-items:center;gap:.5rem}
.swatch{width:18px;height:18px;border-radius:4px;border:1px solid #444}
.desc{font-size:.85rem;color:#888;margin-top:.25rem}
.hex{font-family:monospace;font-size:.8rem;color:#26c6da}
.tag{background:#f59e0b;color:#000;font-size:.65rem;padding:2px 6px;border-radius:3px;font-weight:600}
.modal{display:none;position:fixed;inset:0;background:rgba(0,0,0,.95);z-index:1000;cursor:zoom-out}
.modal.active{display:flex;align-items:center;justify-content:center}
.modal img{max-width:95%;max-height:95%}
</style></head><body>
<h1>Text Color on Teal Background</h1>
<p class="sub">5 options - which has best contrast?</p>
<div class="section"><h2>Dark Theme (MAC)</h2><div class="grid">${darkShots.map(cardHtml).join('')}</div></div>
<div class="section"><h2>Light Theme</h2><div class="grid">${lightShots.map(cardHtml).join('')}</div></div>
<div class="modal" id="modal" onclick="closeModal()"><img id="modal-img"></div>
<script>
function openModal(src){document.getElementById('modal-img').src=src;document.getElementById('modal').classList.add('active')}
function closeModal(){document.getElementById('modal').classList.remove('active')}
document.onkeydown=e=>{if(e.key==='Escape')closeModal()}
</script></body></html>`;

  writeFileSync(join(OUTPUT_DIR, 'index.html'), html);
}

testTextContrast().catch(console.error);
