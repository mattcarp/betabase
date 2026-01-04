#!/usr/bin/env node
/**
 * Theme Visual Test Script
 * Takes screenshots of the app in both light and dark themes
 * Generates an HTML gallery for visual comparison
 */

import { chromium } from 'playwright';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
const OUTPUT_DIR = join(process.cwd(), 'theme-screenshots');

async function takeThemeScreenshots() {
  console.log('Starting theme visual test...');
  console.log(`Base URL: ${BASE_URL}`);

  // Create output directory
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  const screenshots = [];

  try {
    // Navigate to app
    await page.goto(BASE_URL);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // === DARK THEME (MAC) SCREENSHOTS ===
    console.log('Taking dark theme screenshots...');

    // Ensure dark theme
    await page.evaluate(() => {
      localStorage.setItem('siam-theme-preference', 'mac');
      document.documentElement.setAttribute('data-theme', 'mac');
      document.body.classList.add('dark');
    });
    await page.waitForTimeout(500);

    // Full page dark
    await page.screenshot({
      path: join(OUTPUT_DIR, '01-dark-full-page.png'),
      fullPage: false
    });
    screenshots.push({
      name: 'Dark Theme - Full Page',
      file: '01-dark-full-page.png',
      theme: 'dark'
    });

    // Try to open sidebar if not visible
    const sidebar = page.locator('[data-testid="conversation-sidebar"]');
    if (await sidebar.isVisible()) {
      await page.screenshot({
        path: join(OUTPUT_DIR, '02-dark-sidebar.png'),
        fullPage: false
      });
      screenshots.push({
        name: 'Dark Theme - With Sidebar',
        file: '02-dark-sidebar.png',
        theme: 'dark'
      });
    }

    // Focus on chat area
    const chatArea = page.locator('main').first();
    if (await chatArea.isVisible()) {
      await chatArea.screenshot({
        path: join(OUTPUT_DIR, '03-dark-chat-area.png')
      });
      screenshots.push({
        name: 'Dark Theme - Chat Area',
        file: '03-dark-chat-area.png',
        theme: 'dark'
      });
    }

    // === LIGHT THEME SCREENSHOTS ===
    console.log('Switching to light theme...');

    await page.evaluate(() => {
      localStorage.setItem('siam-theme-preference', 'light');
      document.documentElement.setAttribute('data-theme', 'light');
      document.body.classList.remove('dark');
    });
    await page.waitForTimeout(800);

    // Full page light
    await page.screenshot({
      path: join(OUTPUT_DIR, '04-light-full-page.png'),
      fullPage: false
    });
    screenshots.push({
      name: 'Light Theme - Full Page',
      file: '04-light-full-page.png',
      theme: 'light'
    });

    // With sidebar
    if (await sidebar.isVisible()) {
      await page.screenshot({
        path: join(OUTPUT_DIR, '05-light-sidebar.png'),
        fullPage: false
      });
      screenshots.push({
        name: 'Light Theme - With Sidebar',
        file: '05-light-sidebar.png',
        theme: 'light'
      });
    }

    // Chat area
    if (await chatArea.isVisible()) {
      await chatArea.screenshot({
        path: join(OUTPUT_DIR, '06-light-chat-area.png')
      });
      screenshots.push({
        name: 'Light Theme - Chat Area',
        file: '06-light-chat-area.png',
        theme: 'light'
      });
    }

    // === SIDE BY SIDE COMPARISON ===
    // Take mobile viewport screenshots
    console.log('Taking mobile viewport screenshots...');

    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(300);

    // Mobile dark
    await page.evaluate(() => {
      localStorage.setItem('siam-theme-preference', 'mac');
      document.documentElement.setAttribute('data-theme', 'mac');
      document.body.classList.add('dark');
    });
    await page.waitForTimeout(500);
    await page.screenshot({
      path: join(OUTPUT_DIR, '07-dark-mobile.png'),
      fullPage: false
    });
    screenshots.push({
      name: 'Dark Theme - Mobile',
      file: '07-dark-mobile.png',
      theme: 'dark'
    });

    // Mobile light
    await page.evaluate(() => {
      localStorage.setItem('siam-theme-preference', 'light');
      document.documentElement.setAttribute('data-theme', 'light');
      document.body.classList.remove('dark');
    });
    await page.waitForTimeout(500);
    await page.screenshot({
      path: join(OUTPUT_DIR, '08-light-mobile.png'),
      fullPage: false
    });
    screenshots.push({
      name: 'Light Theme - Mobile',
      file: '08-light-mobile.png',
      theme: 'light'
    });

    console.log(`Captured ${screenshots.length} screenshots`);

  } finally {
    await browser.close();
  }

  // Generate HTML gallery
  generateGallery(screenshots);

  console.log(`\nGallery created: ${join(OUTPUT_DIR, 'index.html')}`);
  console.log(`Open in browser: file://${join(OUTPUT_DIR, 'index.html')}`);
}

function generateGallery(screenshots) {
  const darkShots = screenshots.filter(s => s.theme === 'dark');
  const lightShots = screenshots.filter(s => s.theme === 'light');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Theme Visual Comparison - The Betabase</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #1a1a1a;
      color: #fff;
      padding: 2rem;
      line-height: 1.6;
    }
    h1 {
      text-align: center;
      margin-bottom: 0.5rem;
      font-weight: 300;
      font-size: 2.5rem;
    }
    .subtitle {
      text-align: center;
      color: #888;
      margin-bottom: 3rem;
    }
    .comparison-section {
      max-width: 1600px;
      margin: 0 auto 4rem;
    }
    h2 {
      font-weight: 400;
      margin-bottom: 1.5rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid #333;
    }
    .side-by-side {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
      margin-bottom: 3rem;
    }
    .screenshot-card {
      background: #252525;
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid #333;
    }
    .screenshot-card img {
      width: 100%;
      height: auto;
      display: block;
      cursor: pointer;
      transition: transform 0.2s;
    }
    .screenshot-card img:hover {
      transform: scale(1.02);
    }
    .screenshot-card .label {
      padding: 1rem;
      font-size: 0.9rem;
      color: #aaa;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .theme-badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 500;
    }
    .theme-badge.dark {
      background: #333;
      color: #26c6da;
    }
    .theme-badge.light {
      background: #f0f0f0;
      color: #0097a7;
    }
    .mobile-section {
      display: flex;
      justify-content: center;
      gap: 3rem;
      flex-wrap: wrap;
    }
    .mobile-card {
      max-width: 300px;
    }
    .modal {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.95);
      z-index: 1000;
      cursor: zoom-out;
      padding: 2rem;
    }
    .modal.active { display: flex; align-items: center; justify-content: center; }
    .modal img {
      max-width: 95%;
      max-height: 95%;
      object-fit: contain;
    }
    .timestamp {
      text-align: center;
      color: #555;
      font-size: 0.8rem;
      margin-top: 3rem;
    }
    @media (max-width: 900px) {
      .side-by-side { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <h1>Theme Visual Comparison</h1>
  <p class="subtitle">The Betabase - Light vs Dark Theme</p>

  <div class="comparison-section">
    <h2>Desktop View</h2>
    <div class="side-by-side">
      ${darkShots.filter(s => s.file.includes('full-page')).map(s => `
      <div class="screenshot-card">
        <img src="${s.file}" alt="${s.name}" onclick="openModal(this.src)">
        <div class="label">
          <span class="theme-badge dark">Dark</span>
          ${s.name}
        </div>
      </div>
      `).join('')}
      ${lightShots.filter(s => s.file.includes('full-page')).map(s => `
      <div class="screenshot-card">
        <img src="${s.file}" alt="${s.name}" onclick="openModal(this.src)">
        <div class="label">
          <span class="theme-badge light">Light</span>
          ${s.name}
        </div>
      </div>
      `).join('')}
    </div>

    <div class="side-by-side">
      ${darkShots.filter(s => s.file.includes('sidebar')).map(s => `
      <div class="screenshot-card">
        <img src="${s.file}" alt="${s.name}" onclick="openModal(this.src)">
        <div class="label">
          <span class="theme-badge dark">Dark</span>
          ${s.name}
        </div>
      </div>
      `).join('')}
      ${lightShots.filter(s => s.file.includes('sidebar')).map(s => `
      <div class="screenshot-card">
        <img src="${s.file}" alt="${s.name}" onclick="openModal(this.src)">
        <div class="label">
          <span class="theme-badge light">Light</span>
          ${s.name}
        </div>
      </div>
      `).join('')}
    </div>
  </div>

  <div class="comparison-section">
    <h2>Mobile View</h2>
    <div class="mobile-section">
      ${darkShots.filter(s => s.file.includes('mobile')).map(s => `
      <div class="screenshot-card mobile-card">
        <img src="${s.file}" alt="${s.name}" onclick="openModal(this.src)">
        <div class="label">
          <span class="theme-badge dark">Dark</span>
          Mobile
        </div>
      </div>
      `).join('')}
      ${lightShots.filter(s => s.file.includes('mobile')).map(s => `
      <div class="screenshot-card mobile-card">
        <img src="${s.file}" alt="${s.name}" onclick="openModal(this.src)">
        <div class="label">
          <span class="theme-badge light">Light</span>
          Mobile
        </div>
      </div>
      `).join('')}
    </div>
  </div>

  <p class="timestamp">Generated: ${new Date().toLocaleString()}</p>

  <div class="modal" id="modal" onclick="closeModal()">
    <img id="modal-img" src="" alt="Full size">
  </div>

  <script>
    function openModal(src) {
      document.getElementById('modal-img').src = src;
      document.getElementById('modal').classList.add('active');
    }
    function closeModal() {
      document.getElementById('modal').classList.remove('active');
    }
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeModal();
    });
  </script>
</body>
</html>`;

  writeFileSync(join(OUTPUT_DIR, 'index.html'), html);
}

// Run
takeThemeScreenshots().catch(console.error);
