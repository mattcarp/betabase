const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const logs = [];
  const errors = [];

  page.on('console', msg => {
    const text = msg.text();
    logs.push({ type: msg.type(), text });
    if (msg.type() === 'error') {
      errors.push(text);
    }
  });

  page.on('request', request => {
    if (request.url().includes('/api/chat')) {
      logs.push({ type: 'request', text: `API CALL: ${request.method()} ${request.url()}` });
    }
  });

  page.on('requestfailed', request => {
    errors.push(`REQUEST FAILED: ${request.method()} ${request.url()} - ${request.failure()?.errorText}`);
  });

  page.on('pageerror', error => {
    errors.push(`PAGE ERROR: ${error.message}\n${error.stack}`);
  });

  try {
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
  } catch (e) {
    console.log(`Navigation error: ${e.message}`);
  }

  // Try to get the loading state
  const loadingText = await page.textContent('body').catch(() => 'Could not read body');
  console.log('\n=== PAGE CONTENT ===');
  console.log(loadingText);

  console.log('\n=== CONSOLE ERRORS ===');
  if (errors.length === 0) {
    console.log('No errors found');
  } else {
    errors.forEach(err => console.log(err));
  }

  console.log('\n=== ALL CONSOLE LOGS ===');
  logs.forEach(log => console.log(`[${log.type}] ${log.text}`));

  await browser.close();
})();
