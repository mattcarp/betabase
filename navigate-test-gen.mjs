import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    console.log('Navigating to http://localhost:3000...');
    await page.goto('http://localhost:3000', { waitUntil: 'load', timeout: 60000 });
    await page.waitForTimeout(3000);
    
    // Click the "Test" navigation button
    const testNavButton = page.locator('button:has-text("Test"), a:has-text("Test")').first();
    await testNavButton.click();
    await page.waitForTimeout(2000);
    console.log('✓ Opened Test section');
    
    // Click the "AI Generate" tab
    const aiGenerateTab = page.locator('[role="tab"]:has-text("AI Generate")').first();
    if (await aiGenerateTab.isVisible({ timeout: 2000 })) {
      console.log('✓ Found AI Generate tab, clicking...');
      await aiGenerateTab.click();
      await page.waitForTimeout(3000);
    }
    
    // Look for "AI Test Generator" heading
    const aiGeneratorHeading = page.locator('text=AI Test Generator').first();
    if (await aiGeneratorHeading.isVisible({ timeout: 2000 })) {
      console.log('✓ Found AI Test Generator section');
      await aiGeneratorHeading.scrollIntoViewIfNeeded();
      await page.waitForTimeout(1000);
    }
    
    // Look for the teal "Generate Automated Test" button
    const generateButton = page.locator('button:has-text("Generate Automated Test"), button:has-text("Generate & Record")').first();
    if (await generateButton.isVisible({ timeout: 2000 })) {
      console.log('✓ Found Generate button');
      await generateButton.scrollIntoViewIfNeeded();
      await page.waitForTimeout(1000);
      
      // Get button color to verify it's teal
      const buttonStyles = await generateButton.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return {
          backgroundColor: styles.backgroundColor,
          color: styles.color,
          borderColor: styles.borderColor
        };
      });
      console.log('Generate button styles:', buttonStyles);
      
      // Take full page screenshot showing the AI Test Generator with teal buttons
      await page.screenshot({ path: '/tmp/ai-test-generator-teal-buttons.png', fullPage: true });
      console.log('✓ Screenshot: Full page with teal Generate button');
      
      // Take a focused screenshot of the button
      const box = await generateButton.boundingBox();
      if (box) {
        await page.screenshot({ 
          path: '/tmp/generate-button-closeup.png',
          clip: {
            x: Math.max(0, box.x - 150),
            y: Math.max(0, box.y - 250),
            width: Math.min(1400, box.width + 300),
            height: Math.min(900, box.height + 700)
          }
        });
        console.log('✓ Screenshot: Closeup of Generate button area');
      }
    }
    
    // Look for "Run Test" button in the right panel
    const runButton = page.locator('button:has-text("Run Test")').first();
    if (await runButton.isVisible({ timeout: 2000 })) {
      console.log('✓ Found Run Test button');
      await runButton.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
      
      const runStyles = await runButton.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return {
          backgroundColor: styles.backgroundColor,
          color: styles.color
        };
      });
      console.log('Run Test button styles:', runStyles);
      
      const runBox = await runButton.boundingBox();
      if (runBox) {
        await page.screenshot({ 
          path: '/tmp/run-test-button-closeup.png',
          clip: {
            x: Math.max(0, runBox.x - 150),
            y: Math.max(0, runBox.y - 150),
            width: Math.min(1200, runBox.width + 300),
            height: Math.min(600, runBox.height + 300)
          }
        });
        console.log('✓ Screenshot: Run Test button closeup');
      }
    }
    
    console.log('\n✓ All screenshots saved to /tmp/');
    console.log('   - ai-test-generator-teal-buttons.png (full page)');
    console.log('   - generate-button-closeup.png (focused on Generate button)');
    console.log('   - run-test-button-closeup.png (focused on Run Test button)');
    console.log('\nKeeping browser open for inspection (30 seconds)...');
    await page.waitForTimeout(30000);
    
  } catch (error) {
    console.error('Error:', error.message);
    await page.screenshot({ path: '/tmp/error.png', fullPage: true }).catch(() => {});
  } finally {
    await browser.close();
  }
})();
