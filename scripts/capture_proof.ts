import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    console.log('Navigating to localhost:3000...');
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
    // Wait for the specific content we want to verify
    await page.waitForSelector('.grid.grid-cols-2', { timeout: 10000 });
    // Give it a moment for animations
    await page.waitForTimeout(2000);
    
    console.log('Capturing screenshot...');
    await page.screenshot({ path: '/Users/matt/.gemini/antigravity/brain/49ad6f70-60c0-4456-ae92-4ef1eaff3f26/zeitgeist_restored_proof.png', fullPage: true });
    
    console.log('Screenshot saved.');
  } catch (error) {
    console.error('Error capturing screenshot:', error);
  } finally {
    await browser.close();
  }
})();
