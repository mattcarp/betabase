const { chromium } = require('playwright');

(async () => {
  console.log('📸 Taking screenshot of current app state...\n');
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Set viewport
  await page.setViewportSize({ width: 1280, height: 720 });
  
  console.log('Navigating to http://localhost:3000...');
  await page.goto('http://localhost:3000', { 
    waitUntil: 'networkidle',
    timeout: 15000 
  });
  
  // Wait for React
  await page.waitForTimeout(5000);
  
  // Take screenshot
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `PROOF-${timestamp}.png`;
  await page.screenshot({ 
    path: filename,
    fullPage: false 
  });
  
  console.log(`\n✅ Screenshot saved: ${filename}`);
  
  // Check what's visible
  const bodyText = await page.locator('body').innerText();
  const hasLoading = bodyText.includes('Loading');
  const hasSIAM = bodyText.includes('SIAM');
  const hasChat = await page.locator('textarea, input[placeholder*="Ask"]').count();
  
  console.log('\n📊 What\'s on screen:');
  console.log(`  Has "Loading": ${hasLoading}`);
  console.log(`  Has "SIAM": ${hasSIAM}`);
  console.log(`  Has input field: ${hasChat > 0}`);
  
  if (hasLoading && !hasChat) {
    console.log('\n❌ APP IS STUCK ON LOADING SCREEN!');
  } else if (hasChat > 0) {
    console.log('\n✅ APP IS WORKING - Chat interface visible!');
  }
  
  await browser.close();
})();