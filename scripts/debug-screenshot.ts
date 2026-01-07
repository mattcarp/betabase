import { chromium } from '@playwright/test';
import fs from 'fs';

async function captureScreenshot() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  const allLogs: string[] = [];
  page.on('console', msg => {
    allLogs.push(`[${msg.type()}] ${msg.text()}`);
  });

  page.on('pageerror', err => {
    allLogs.push(`[Page Error] ${err.message}`);
  });

  try {
    console.log('Navigating to http://localhost:3000...');
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    console.log('Waiting for header...');
    await page.waitForSelector('header', { timeout: 10000 });
    
    // Wait an extra few seconds for any client-side rendering
    await page.waitForTimeout(5000);
    
    const screenshotPath = 'debug-screenshot.png';
    await page.screenshot({ path: screenshotPath });
    console.log(`Screenshot saved to ${screenshotPath}`);
    
    console.log('--- Console Logs ---');
    allLogs.forEach(err => console.log(err));

    // Check for a black screen by looking at the body background or specific elements
    const bodyStyles = await page.evaluate(() => {
      const style = window.getComputedStyle(document.body);
      const header = document.querySelector('header');
      const main = document.querySelector('main');
      const aside = document.querySelector('aside');
      return {
        backgroundColor: style.backgroundColor,
        color: style.color,
        height: document.body.scrollHeight,
        headerFound: !!header,
        mainFound: !!main,
        asideFound: !!aside,
        htmlLength: document.body.innerHTML.length,
        html: document.body.innerHTML.substring(0, 1000)
      };
    });
    console.log('--- Body Info ---', bodyStyles);

  } catch (error) {
    console.error('Failed to capture screenshot:', error);
  } finally {
    await browser.close();
  }
}

captureScreenshot();
