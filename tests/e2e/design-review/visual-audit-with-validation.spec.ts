/**
 * VISUAL DESIGN AUDIT WITH SCREENSHOT VALIDATION
 *
 * This test navigates through the entire Betabase app using clicks (not hash URLs),
 * waits for actual content to load, captures screenshots, and validates they're
 * not blank/black before passing.
 */

import { test, expect, Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const SCREENSHOT_DIR = path.join(__dirname, '../../../design-audit-screenshots');
const HTML_REPORT_PATH = path.join(SCREENSHOT_DIR, 'visual-audit-report.html');

// Ensure screenshot directory exists
test.beforeAll(() => {
  if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
  }
});

interface ScreenshotResult {
  name: string;
  path: string;
  isValid: boolean;
  reason?: string;
  timestamp: string;
}

const screenshotResults: ScreenshotResult[] = [];

/**
 * Wait for the page to fully load - network idle + DOM content
 */
async function waitForPageLoad(page: Page, timeout = 30000) {
  // Wait for network to be idle (no requests for 500ms)
  await page.waitForLoadState('networkidle', { timeout });

  // Additional wait for any dynamic content
  await page.waitForTimeout(1000);

  // Make sure the main content area is visible
  try {
    await page.waitForSelector('header', { timeout: 5000 });
  } catch {
    // Header might not exist on all pages
  }
}

/**
 * Capture screenshot and validate it's not blank/black
 */
async function captureAndValidate(page: Page, name: string): Promise<ScreenshotResult> {
  const screenshotPath = path.join(SCREENSHOT_DIR, `${name}.png`);

  // Capture screenshot
  await page.screenshot({ path: screenshotPath, fullPage: false });

  const result: ScreenshotResult = {
    name,
    path: screenshotPath,
    isValid: true,
    timestamp: new Date().toISOString()
  };

  // Read the screenshot and check if it's mostly black/blank
  const buffer = fs.readFileSync(screenshotPath);

  // Check file size - a blank/black image is usually very small due to compression
  if (buffer.length < 5000) {
    result.isValid = false;
    result.reason = 'Image too small (likely blank/black)';
  }

  screenshotResults.push(result);
  return result;
}

/**
 * Click a navigation tab by text and wait for content change
 */
async function clickTab(page: Page, tabText: string) {
  // Find the tab button in the header navigation
  const tabButton = page.locator(`header button:has-text("${tabText}")`).first();

  if (await tabButton.count() === 0) {
    // Try without header constraint
    const fallbackButton = page.locator(`button:has-text("${tabText}")`).first();
    if (await fallbackButton.count() > 0) {
      await fallbackButton.click();
    } else {
      throw new Error(`Tab "${tabText}" not found`);
    }
  } else {
    await tabButton.click();
  }

  // Wait for the click to take effect
  await page.waitForTimeout(500);
  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(500);
}

/**
 * Generate HTML report with all screenshots
 */
function generateHTMLReport() {
  const validCount = screenshotResults.filter(r => r.isValid).length;
  const invalidCount = screenshotResults.filter(r => !r.isValid).length;

  const html = `<!DOCTYPE html>
<html>
<head>
  <title>The Betabase Visual Design Audit Report</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0a0a0a; color: #fff; padding: 20px; }
    h1 { border-bottom: 1px solid #333; padding-bottom: 10px; }
    .summary { background: #1a1a1a; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
    .summary .stat { display: inline-block; margin-right: 30px; }
    .summary .stat-value { font-size: 24px; font-weight: bold; }
    .summary .stat-label { color: #888; font-size: 14px; }
    .valid { color: #4ade80; }
    .invalid { color: #f87171; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(400px, 1fr)); gap: 20px; }
    .card { background: #1a1a1a; border-radius: 8px; overflow: hidden; }
    .card.invalid { border: 2px solid #f87171; }
    .card.valid { border: 2px solid #4ade80; }
    .card img { width: 100%; height: 300px; object-fit: contain; background: #000; }
    .card-info { padding: 15px; }
    .card-title { font-weight: bold; margin-bottom: 5px; }
    .card-status { font-size: 12px; }
    .card-status.valid { color: #4ade80; }
    .card-status.invalid { color: #f87171; }
    .timestamp { color: #666; font-size: 11px; }
  </style>
</head>
<body>
  <h1>The Betabase Visual Design Audit Report</h1>
  <p>Generated: ${new Date().toISOString()}</p>

  <div class="summary">
    <div class="stat">
      <div class="stat-value">${screenshotResults.length}</div>
      <div class="stat-label">Total Screenshots</div>
    </div>
    <div class="stat">
      <div class="stat-value valid">${validCount}</div>
      <div class="stat-label">Valid</div>
    </div>
    <div class="stat">
      <div class="stat-value invalid">${invalidCount}</div>
      <div class="stat-label">Invalid/Blank</div>
    </div>
    <div class="stat">
      <div class="stat-value">${validCount > 0 ? Math.round((validCount / screenshotResults.length) * 100) : 0}%</div>
      <div class="stat-label">Pass Rate</div>
    </div>
  </div>

  <div class="grid">
    ${screenshotResults.map(r => `
      <div class="card ${r.isValid ? 'valid' : 'invalid'}">
        <img src="${path.basename(r.path)}" alt="${r.name}" />
        <div class="card-info">
          <div class="card-title">${r.name}</div>
          <div class="card-status ${r.isValid ? 'valid' : 'invalid'}">
            ${r.isValid ? 'PASS' : 'FAIL: ' + r.reason}
          </div>
          <div class="timestamp">${r.timestamp}</div>
        </div>
      </div>
    `).join('')}
  </div>
</body>
</html>`;

  fs.writeFileSync(HTML_REPORT_PATH, html);
  console.log(`\n HTML Report generated: ${HTML_REPORT_PATH}`);
  return HTML_REPORT_PATH;
}

test.describe('Visual Design Audit with Validation', () => {
  test.setTimeout(120000); // 2 minute timeout

  test('Complete visual audit of all pages and tabs', async ({ page }) => {
    console.log('\n Starting Visual Design Audit...\n');

    // Navigate to homepage
    console.log('1. Loading homepage...');
    await page.goto('http://localhost:3000');
    await waitForPageLoad(page);

    let result = await captureAndValidate(page, '01-homepage-initial');
    console.log(`   Screenshot: ${result.name} - ${result.isValid ? 'VALID' : 'INVALID: ' + result.reason}`);

    // Chat Mode (should be default)
    console.log('\n2. Chat Mode...');
    await clickTab(page, 'Chat');
    await waitForPageLoad(page);

    result = await captureAndValidate(page, '02-chat-mode');
    console.log(`   Screenshot: ${result.name} - ${result.isValid ? 'VALID' : 'INVALID: ' + result.reason}`);

    // Look for message input
    const chatInput = page.locator('textarea').first();
    if (await chatInput.count() > 0) {
      await chatInput.focus();
      result = await captureAndValidate(page, '02-chat-input-focused');
      console.log(`   Screenshot: ${result.name} - ${result.isValid ? 'VALID' : 'INVALID: ' + result.reason}`);
    }

    // HUD Mode
    console.log('\n3. HUD Mode...');
    await clickTab(page, 'HUD');
    await page.waitForTimeout(2000); // Dynamic import takes longer
    await waitForPageLoad(page);

    result = await captureAndValidate(page, '03-hud-mode');
    console.log(`   Screenshot: ${result.name} - ${result.isValid ? 'VALID' : 'INVALID: ' + result.reason}`);

    // Test Mode and all sub-tabs
    console.log('\n4. Test Mode...');
    await clickTab(page, 'Test');
    await page.waitForTimeout(2000); // Dynamic import
    await waitForPageLoad(page);

    result = await captureAndValidate(page, '04-test-mode');
    console.log(`   Screenshot: ${result.name} - ${result.isValid ? 'VALID' : 'INVALID: ' + result.reason}`);

    // Test mode sub-tabs
    const testSubTabs = ['Dashboard', 'Historical', 'RLHF', 'Impact', 'Monitor'];
    for (const subTab of testSubTabs) {
      console.log(`   Checking sub-tab: ${subTab}...`);
      const subTabBtn = page.locator(`button:has-text("${subTab}")`).first();
      if (await subTabBtn.count() > 0) {
        await subTabBtn.click();
        await page.waitForTimeout(1000);
        result = await captureAndValidate(page, `04-test-${subTab.toLowerCase()}`);
        console.log(`   Screenshot: ${result.name} - ${result.isValid ? 'VALID' : 'INVALID: ' + result.reason}`);
      }
    }

    // Fix Mode and all sub-tabs
    console.log('\n5. Fix Mode...');
    await clickTab(page, 'Fix');
    await waitForPageLoad(page);

    result = await captureAndValidate(page, '05-fix-mode');
    console.log(`   Screenshot: ${result.name} - ${result.isValid ? 'VALID' : 'INVALID: ' + result.reason}`);

    // Fix mode sub-tabs
    const fixSubTabs = ['Debugger', 'Quick Fix', 'Generator', 'Timeline'];
    for (const subTab of fixSubTabs) {
      console.log(`   Checking sub-tab: ${subTab}...`);
      const subTabBtn = page.locator(`button:has-text("${subTab}")`).first();
      if (await subTabBtn.count() > 0) {
        await subTabBtn.click();
        await page.waitForTimeout(500);
        result = await captureAndValidate(page, `05-fix-${subTab.toLowerCase().replace(/\s+/g, '-')}`);
        console.log(`   Screenshot: ${result.name} - ${result.isValid ? 'VALID' : 'INVALID: ' + result.reason}`);
      }
    }

    // Curate Mode
    console.log('\n6. Curate Mode...');
    await clickTab(page, 'Curate');
    await page.waitForTimeout(2000); // Dynamic import
    await waitForPageLoad(page);

    result = await captureAndValidate(page, '06-curate-mode');
    console.log(`   Screenshot: ${result.name} - ${result.isValid ? 'VALID' : 'INVALID: ' + result.reason}`);

    // Mobile view
    console.log('\n7. Mobile Responsive View...');
    await page.setViewportSize({ width: 375, height: 667 });
    await clickTab(page, 'Chat');
    await waitForPageLoad(page);

    result = await captureAndValidate(page, '07-mobile-chat');
    console.log(`   Screenshot: ${result.name} - ${result.isValid ? 'VALID' : 'INVALID: ' + result.reason}`);

    // Reset to desktop
    await page.setViewportSize({ width: 1280, height: 800 });

    // Header controls
    console.log('\n8. Header Controls...');
    await clickTab(page, 'Chat');
    await waitForPageLoad(page);

    // Try to open introspection dropdown
    const introspectionBtn = page.locator('button:has([class*="Brain"])').first();
    if (await introspectionBtn.count() > 0) {
      await introspectionBtn.click();
      await page.waitForTimeout(500);
      result = await captureAndValidate(page, '08-introspection-dropdown');
      console.log(`   Screenshot: ${result.name} - ${result.isValid ? 'VALID' : 'INVALID: ' + result.reason}`);
      await page.keyboard.press('Escape');
    }

    // Knowledge panel
    const knowledgeBtn = page.locator('button[title*="Knowledge"], button[aria-label*="knowledge"]').first();
    if (await knowledgeBtn.count() > 0) {
      await knowledgeBtn.click();
      await page.waitForTimeout(500);
      result = await captureAndValidate(page, '08-knowledge-panel');
      console.log(`   Screenshot: ${result.name} - ${result.isValid ? 'VALID' : 'INVALID: ' + result.reason}`);
    }

    // Generate the HTML report
    console.log('\n Generating HTML Report...');
    const reportPath = generateHTMLReport();

    // Final summary
    const validCount = screenshotResults.filter(r => r.isValid).length;
    const invalidCount = screenshotResults.filter(r => !r.isValid).length;

    console.log('\n=== VISUAL AUDIT SUMMARY ===');
    console.log(`Total Screenshots: ${screenshotResults.length}`);
    console.log(`Valid: ${validCount}`);
    console.log(`Invalid/Blank: ${invalidCount}`);
    console.log(`Pass Rate: ${Math.round((validCount / screenshotResults.length) * 100)}%`);
    console.log(`\nHTML Report: ${reportPath}`);

    // Fail the test if any screenshots are invalid
    if (invalidCount > 0) {
      const invalidScreenshots = screenshotResults.filter(r => !r.isValid).map(r => r.name);
      expect(invalidCount, `Invalid screenshots found: ${invalidScreenshots.join(', ')}`).toBe(0);
    }
  });
});
