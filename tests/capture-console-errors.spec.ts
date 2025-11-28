import { test } from '@playwright/test';

test('capture all console errors', async ({ page }) => {
  const consoleErrors: string[] = [];
  const networkErrors: Array<{url: string, status: number}> = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  page.on('response', response => {
    if (response.status() >= 400) {
      networkErrors.push({
        url: response.url(),
        status: response.status()
      });
    }
  });

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(5000);

  console.log('\n=== CONSOLE ERRORS ===');
  consoleErrors.forEach((err, i) => {
    console.log(`${i + 1}. ${err}`);
  });

  console.log('\n=== NETWORK ERRORS ===');
  networkErrors.forEach((err, i) => {
    console.log(`${i + 1}. ${err.status} ${err.url}`);
  });

  console.log(`\nTotal console errors: ${consoleErrors.length}`);
  console.log(`Total network errors: ${networkErrors.length}`);
});
