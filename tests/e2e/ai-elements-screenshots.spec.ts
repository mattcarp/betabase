/**
 * AI Elements Visual Documentation Tests
 *
 * Captures screenshots of the chat interface UI for visual review.
 * NOTE: Loading states and responses require authentication to capture.
 * These tests document the static UI states without auth.
 */

import { test, expect } from "@playwright/test";
import * as fs from "fs";

const SCREENSHOT_DIR = "screenshots/ai-elements";

test.beforeAll(async () => {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }
});

test.describe("AI Elements Visual Documentation", () => {
  test.setTimeout(60000);

  test.beforeEach(async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(2000);
  });

  test("01 - Chat Interface Overview", async ({ page }) => {
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/01-chat-interface-full.png`,
      fullPage: true,
    });
  });

  test("02 - Chat Input Area", async ({ page }) => {
    const textarea = page.locator("textarea").first();
    await expect(textarea).toBeVisible({ timeout: 10000 });

    // Empty state
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/02a-input-empty.png`,
    });

    // With typed message
    await textarea.fill("What are the main features of AOMA?");
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/02b-input-with-text.png`,
    });
  });

  test("03 - Suggested Questions", async ({ page }) => {
    // Capture the starter question cards
    const questionCards = page.locator("text=What are the different asset types");
    if (await questionCards.isVisible().catch(() => false)) {
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/03-suggested-questions.png`,
      });
    }
  });

  test("04 - Sidebar and Navigation", async ({ page }) => {
    // Click to expand sidebar if collapsed
    const sidebar = page.locator("text=Conversations").first();
    if (await sidebar.isVisible().catch(() => false)) {
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/04-sidebar.png`,
      });
    }
  });

  test("05 - Model Selector", async ({ page }) => {
    // Find and capture model selector
    const modelSelector = page.locator("text=Gemini").first();
    if (await modelSelector.isVisible().catch(() => false)) {
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/05-model-selector.png`,
      });
    }
  });

  test("06 - Header Status Bar", async ({ page }) => {
    // Capture the header with system status
    const header = page.locator("text=All Systems Online").first();
    if (await header.isVisible().catch(() => false)) {
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/06-header-status.png`,
      });
    }
  });

  test("07 - Tab Navigation", async ({ page }) => {
    // Capture the tab bar (Chat, HUD, Test, Fix, Curate)
    const tabBar = page.locator("text=Chat").first();
    if (await tabBar.isVisible().catch(() => false)) {
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/07-tab-navigation.png`,
      });
    }
  });

  test("08 - Quick Actions Panel", async ({ page }) => {
    // Capture the quick actions area
    const quickActions = page.locator("text=Quick Actions").first();
    if (await quickActions.isVisible().catch(() => false)) {
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/08-quick-actions.png`,
      });
    }
  });

  test("09 - Voice Controls", async ({ page }) => {
    // Find and capture voice/audio controls in the input area
    const voiceButton = page.locator('[class*="mic"], [aria-label*="voice"], button').filter({ has: page.locator('svg') }).first();
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/09-input-controls.png`,
    });
  });

  test("10 - Mobile Viewport", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(500);
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/10-mobile-view.png`,
    });
  });

  test("11 - Tablet Viewport", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/11-tablet-view.png`,
    });
  });

  test("12 - Wide Desktop Viewport", async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(500);
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/12-wide-desktop.png`,
    });
  });
});

test.afterAll(async () => {
  generateHTMLGallery();
});

function generateHTMLGallery() {
  const screenshotFiles = fs.readdirSync(SCREENSHOT_DIR)
    .filter(f => f.endsWith(".png"))
    .sort();

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI Elements Visual Gallery - SIAM</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0a0a0a;
      color: #e5e5e5;
      padding: 2rem;
    }
    h1 {
      text-align: center;
      margin-bottom: 0.5rem;
      color: #fff;
      font-weight: 300;
    }
    .subtitle {
      text-align: center;
      color: #888;
      margin-bottom: 1rem;
      font-size: 0.9rem;
    }
    .timestamp {
      text-align: center;
      color: #666;
      margin-bottom: 2rem;
      font-size: 0.8rem;
    }
    .note {
      max-width: 800px;
      margin: 0 auto 2rem;
      padding: 1rem;
      background: rgba(147, 51, 234, 0.1);
      border: 1px solid rgba(147, 51, 234, 0.3);
      border-radius: 8px;
      font-size: 0.85rem;
      color: #c4b5fd;
    }
    .gallery {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(500px, 1fr));
      gap: 1.5rem;
      max-width: 2000px;
      margin: 0 auto;
    }
    .card {
      background: #1a1a1a;
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 12px;
      overflow: hidden;
      transition: transform 0.2s, border-color 0.2s;
    }
    .card:hover {
      transform: translateY(-2px);
      border-color: rgba(147, 51, 234, 0.5);
    }
    .card img {
      width: 100%;
      height: auto;
      display: block;
      cursor: pointer;
    }
    .card-info {
      padding: 1rem;
      border-top: 1px solid rgba(255,255,255,0.08);
    }
    .card-title {
      font-weight: 500;
      color: #fff;
      font-family: monospace;
      font-size: 0.9rem;
    }
    .lightbox {
      display: none;
      position: fixed;
      top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.95);
      z-index: 1000;
      justify-content: center;
      align-items: center;
      padding: 2rem;
    }
    .lightbox.active { display: flex; }
    .lightbox img {
      max-width: 95%;
      max-height: 95%;
      object-fit: contain;
      border-radius: 8px;
    }
    .lightbox-close {
      position: absolute;
      top: 1rem; right: 1rem;
      background: none; border: none;
      color: #fff; font-size: 2rem;
      cursor: pointer; opacity: 0.7;
    }
    .lightbox-close:hover { opacity: 1; }
    .lightbox-title {
      position: absolute;
      bottom: 1rem; left: 50%;
      transform: translateX(-50%);
      color: #fff;
      background: rgba(0,0,0,0.7);
      padding: 0.5rem 1rem;
      border-radius: 4px;
      font-family: monospace;
    }
    .legend {
      max-width: 2000px;
      margin: 2rem auto;
      padding: 1.5rem;
      background: #1a1a1a;
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 12px;
    }
    .legend h2 {
      font-size: 1rem;
      font-weight: 500;
      margin-bottom: 1rem;
      color: #fff;
    }
    .legend ul {
      list-style: none;
      columns: 2;
      gap: 1rem;
    }
    .legend li {
      font-size: 0.85rem;
      color: #888;
      padding: 0.25rem 0;
      break-inside: avoid;
    }
    .legend li strong {
      color: #a855f7;
    }
  </style>
</head>
<body>
  <h1>SIAM Chat Interface Gallery</h1>
  <p class="subtitle">Visual documentation of AI Elements implementation</p>
  <p class="timestamp">Generated: ${new Date().toISOString()}</p>

  <div class="note">
    <strong>Note:</strong> Loading states (shimmer, token estimation, chain of thought, system diagrams, agent visualizer)
    appear during authenticated chat sessions when AI is processing. These screenshots capture the static UI states.
    To see loading animations, use the app with authentication.
  </div>

  <div class="legend">
    <h2>AI Elements Features (require auth to see in action)</h2>
    <ul>
      <li><strong>Shimmer:</strong> Appears 0-2s while AI processes</li>
      <li><strong>Token Estimation:</strong> Shows ~tokens at 2s+</li>
      <li><strong>Chain of Thought:</strong> Thinking steps at 3s+</li>
      <li><strong>System Diagrams:</strong> React Flow diagrams at 4s+ for architecture queries</li>
      <li><strong>Context Chunks:</strong> RAG sources at 6s+</li>
      <li><strong>Agent Visualizer:</strong> Multi-tool execution at 8s+ for complex queries</li>
    </ul>
  </div>

  <div class="gallery">
    ${screenshotFiles.map(file => `
    <div class="card">
      <img src="ai-elements/${file}" alt="${file}" onclick="openLightbox(this, '${file}')" />
      <div class="card-info">
        <div class="card-title">${file.replace('.png', '').replace(/-/g, ' ')}</div>
      </div>
    </div>`).join("")}
  </div>

  <div class="lightbox" id="lightbox" onclick="closeLightbox()">
    <button class="lightbox-close">&times;</button>
    <img id="lightbox-img" src="" alt="" />
    <div class="lightbox-title" id="lightbox-title"></div>
  </div>

  <script>
    function openLightbox(img, title) {
      event.stopPropagation();
      document.getElementById('lightbox-img').src = img.src;
      document.getElementById('lightbox-title').textContent = title;
      document.getElementById('lightbox').classList.add('active');
    }
    function closeLightbox() {
      document.getElementById('lightbox').classList.remove('active');
    }
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLightbox(); });
  </script>
</body>
</html>`;

  fs.writeFileSync(`${SCREENSHOT_DIR}/../ai-elements-gallery.html`, html);
  console.log(`\nGallery: screenshots/ai-elements-gallery.html\n`);
}
