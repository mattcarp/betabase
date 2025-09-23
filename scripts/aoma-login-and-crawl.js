#!/usr/bin/env node

/**
 * Simple AOMA login and crawl test
 * Uses Playwright for login, then tests Firecrawl
 */

const { chromium } = require('playwright');
const fs = require('fs/promises');
const path = require('path');
const dotenv = require('dotenv');

// Load env vars
dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });

const AOMA_URL = 'https://aoma-stage.smcdp-de.net';
const USERNAME = process.env.AAD_USERNAME;
const PASSWORD = process.env.AAD_PASSWORD;

if (!USERNAME || !PASSWORD) {
  console.error('❌ Missing AAD_USERNAME or AAD_PASSWORD');
  process.exit(1);
}

console.log('🚀 AOMA Login & Crawl Test');
console.log('👤 User:', USERNAME);
console.log('🌐 URL:', AOMA_URL);
console.log('');

async function loginAndCrawl() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 100 
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Navigate to AOMA
    console.log('📍 Navigating to AOMA...');
    await page.goto(AOMA_URL, { waitUntil: 'networkidle' });
    
    // Check if we need to click Employee Login
    try {
      const employeeBtn = page.locator('button:has-text("Employee Login"), #aadLoginBtn');
      if (await employeeBtn.isVisible({ timeout: 3000 })) {
        console.log('🔘 Clicking Employee Login...');
        await employeeBtn.click();
        await page.waitForTimeout(2000);
      }
    } catch {}
    
    // Fill username if on Microsoft login
    if (page.url().includes('microsoftonline.com')) {
      console.log('📝 Entering username...');
      await page.fill('input[name="loginfmt"], #i0116', USERNAME);
      await page.click('#idSIButton9');
      await page.waitForTimeout(1500);
      
      // Fill password
      console.log('🔐 Entering password...');
      await page.fill('input[type="password"], #i0118', PASSWORD);
      await page.click('#idSIButton9');
      
      // Wait for MFA
      console.log('\n⏳ WAITING FOR MFA APPROVAL ON YOUR PHONE...');
      console.log('   Please approve the authentication request\n');
      
      // Wait up to 2 minutes for MFA
      let mfaComplete = false;
      for (let i = 0; i < 120; i++) {
        await page.waitForTimeout(1000);
        
        // Check if we're back on AOMA
        if (page.url().includes('aoma-stage')) {
          mfaComplete = true;
          break;
        }
        
        // Handle "Stay signed in?" prompt
        try {
          await page.click('#idSIButton9, button:has-text("Yes")', { timeout: 500 });
        } catch {}
      }
      
      if (!mfaComplete) {
        console.log('❌ MFA timeout - please complete authentication manually');
        console.log('   Browser will stay open for manual completion...');
        await page.waitForTimeout(300000); // 5 minutes
      }
    }
    
    // Check if we're logged in
    if (page.url().includes('aoma-stage')) {
      console.log('✅ LOGGED IN TO AOMA!\n');
      
      // Save authentication
      const storage = await context.storageState();
      await fs.mkdir('tmp', { recursive: true });
      await fs.writeFile('tmp/aoma-stage-storage.json', JSON.stringify(storage, null, 2));
      console.log('💾 Saved authentication state');
      
      // Now let's crawl some pages
      console.log('\n🕷️ Starting crawl...\n');
      
      const pages = [
        '/aoma-ui/my-aoma-files',
        '/aoma-ui/simple-upload', 
        '/aoma-ui/direct-upload',
        '/aoma-ui/product-metadata-viewer'
      ];
      
      for (const pagePath of pages) {
        try {
          const url = `${AOMA_URL}${pagePath}`;
          console.log(`📄 Crawling: ${url}`);
          
          await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
          await page.waitForTimeout(2000);
          
          const title = await page.title();
          const html = await page.content();
          
          // Save HTML
          const fileName = `tmp/aoma_${pagePath.replace(/\//g, '_')}.html`;
          await fs.writeFile(fileName, html);
          
          // Take screenshot
          await page.screenshot({ 
            path: fileName.replace('.html', '.png'),
            fullPage: true 
          });
          
          console.log(`   ✅ ${title}`);
          
        } catch (error) {
          console.error(`   ❌ Failed: ${error.message}`);
        }
      }
      
      console.log('\n✅ Crawl complete!');
      console.log('📁 Check tmp/ folder for HTML files and screenshots');
      
    } else {
      console.log('❌ Not logged in - URL:', page.url());
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    console.log('\nKeeping browser open for 10 seconds...');
    await page.waitForTimeout(10000);
    await browser.close();
  }
}

loginAndCrawl();
