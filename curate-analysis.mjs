import { chromium } from 'playwright';

const run = async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 750, height: 805 }
  });
  const page = await context.newPage();
  
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  
  console.log('Navigating to http://localhost:3000');
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(3000);
  
  // Take initial screenshot
  await page.screenshot({ path: '/tmp/curate-01-initial.png', fullPage: true });
  console.log('✓ Screenshot: curate-01-initial.png');
  
  // Find and click Curate button
  const curateButton = page.locator('button:has-text("Curate"), [role="tab"]:has-text("Curate")').first();
  const curateVisible = await curateButton.isVisible().catch(() => false);
  
  if (curateVisible) {
    console.log('✓ Found Curate button');
    await curateButton.click();
    await page.waitForTimeout(3000); // Wait for API call
    await page.screenshot({ path: '/tmp/curate-02-files-tab.png', fullPage: true });
    console.log('✓ Screenshot: curate-02-files-tab.png (Files Tab)');
    
    // Test Upload tab
    const uploadTab = page.locator('[role="tab"]:has-text("Upload")').first();
    if (await uploadTab.isVisible().catch(() => false)) {
      await uploadTab.click();
      await page.waitForTimeout(800);
      await page.screenshot({ path: '/tmp/curate-03-upload-tab.png', fullPage: true });
      console.log('✓ Screenshot: curate-03-upload-tab.png (Upload Tab)');
    }
    
    // Test Info tab
    const infoTab = page.locator('[role="tab"]:has-text("Info")').first();
    if (await infoTab.isVisible().catch(() => false)) {
      await infoTab.click();
      await page.waitForTimeout(800);
      await page.screenshot({ path: '/tmp/curate-04-info-tab.png', fullPage: true });
      console.log('✓ Screenshot: curate-04-info-tab.png (Info Tab)');
    }
    
    // Back to Files tab for detailed testing
    const filesTab = page.locator('[role="tab"]:has-text("Files")').first();
    if (await filesTab.isVisible().catch(() => false)) {
      await filesTab.click();
      await page.waitForTimeout(800);
      
      // Test hover effect on file item (if any files exist)
      const fileItem = page.locator('[class*="group flex items-center"]').first();
      const fileExists = await fileItem.isVisible().catch(() => false);
      if (fileExists) {
        await fileItem.hover();
        await page.waitForTimeout(300);
        await page.screenshot({ path: '/tmp/curate-05-hover-effect.png', fullPage: true });
        console.log('✓ Screenshot: curate-05-hover-effect.png (Hover Effect)');
      }
    }
  } else {
    console.log('✗ Could not find Curate button');
  }
  
  // Report console errors
  console.log('\n=== CONSOLE ERRORS ===');
  if (errors.length > 0) {
    console.log(`Found ${errors.length} errors:`);
    errors.forEach((err, i) => console.log(`${i + 1}. ${err}`));
  } else {
    console.log('✓ No console errors detected');
  }
  
  await browser.close();
  console.log('\n✓ Analysis complete');
};

run().catch(console.error);
