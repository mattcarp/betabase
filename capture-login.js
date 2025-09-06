const { chromium } = require('playwright');

async function captureLogin() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  try {
    console.log('📸 Attempting to capture login page...');
    
    // Try with a longer timeout and different wait condition
    await page.goto('http://localhost:3000/', { 
      waitUntil: 'domcontentloaded', 
      timeout: 30000 
    });
    
    // Wait for any dynamic content
    await page.waitForTimeout(3000);
    
    // Take screenshot
    await page.screenshot({
      path: 'screenshots/login.png',
      fullPage: true
    });
    
    console.log('✅ Login page captured successfully');
    
    // Get page info
    const title = await page.title();
    const url = page.url();
    console.log(`Title: ${title}`);
    console.log(`URL: ${url}`);
    
  } catch (error) {
    console.log(`❌ Failed to capture login page: ${error.message}`);
  }

  await browser.close();
}

captureLogin();