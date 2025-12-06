import { test, expect } from '../e2e/fixtures/base-test';

test('capture all console errors on page load', async ({ page }) => {
  const errors: Array<{type: string, text: string}> = [];

  page.on('console', msg => {
    errors.push({ type: msg.type(), text: msg.text() });
    console.log(`[${msg.type().toUpperCase()}]`, msg.text());
  });

  page.on('pageerror', error => {
    console.log('[PAGE ERROR]', error.message);
    console.log('[STACK]', error.stack);
  });

  console.log('Navigating to http://localhost:3000...');
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 60000 });

  console.log('Waiting 5 seconds for all errors to appear...');
  await page.waitForTimeout(5000);

  console.log('\n=== ALL CAPTURED MESSAGES ===');
  errors.forEach(e => console.log(`[${e.type}]`, e.text));

  console.log('\n=== ERROR SUMMARY ===');
  const errorMessages = errors.filter(e => e.type === 'error');
  console.log(`Total errors: ${errorMessages.length}`);
});
