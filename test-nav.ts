import { chromium } from 'playwright';

async function testNav() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log('Navigating to localhost:3000...');
  const start = Date.now();

  try {
    // Try with domcontentloaded instead of load
    const response = await page.goto('http://localhost:3000/', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });
    console.log('DOMContentLoaded in ' + (Date.now() - start) + 'ms, status: ' + response?.status());

    // Now try waiting for load
    const loadStart = Date.now();
    await page.waitForLoadState('load', { timeout: 30000 });
    console.log('Load event in ' + (Date.now() - loadStart) + 'ms');

  } catch (e: unknown) {
    console.log('Error: ' + (e instanceof Error ? e.message : String(e)));
  }

  await browser.close();
}

testNav();
