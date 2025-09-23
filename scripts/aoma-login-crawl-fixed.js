#!/usr/bin/env node

/**
 * AOMA Login and Crawl - Fixed version
 * Properly handles the username field
 */

const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');

require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

async function loginAndCrawl() {
  console.log('🚀 AOMA Login and Crawl\n');
  
  const USERNAME = process.env.AAD_USERNAME || 'matt.carpenter.ext@sonymusic.com';
  const PASSWORD = process.env.AAD_PASSWORD;
  
  console.log(`Username: ${USERNAME}`);
  console.log(`Password: ${PASSWORD ? '[SET]' : '[MISSING]'}`);
  
  if (!PASSWORD) {
    console.error('❌ AAD_PASSWORD not set in .env.local');
    process.exit(1);
  }

  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 300
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Navigate to AOMA
    console.log('\n📍 Navigating to AOMA...');
    await page.goto('https://aoma-stage.smcdp-de.net', { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });
    
    await page.waitForTimeout(2000);
    
    // Click Employee Login button
    console.log('📍 Looking for Employee Login...');
    const employeeBtn = page.locator('#aadLoginBtn, a:has-text("Employee Login")').first();
    
    if (await employeeBtn.isVisible({ timeout: 5000 })) {
      console.log('   ✅ Found Employee Login, clicking...');
      await employeeBtn.click();
      await page.waitForTimeout(3000);
    }
    
    // Now we should be on Microsoft login page
    console.log('\n📍 Microsoft Login Page');
    
    // LOOK for the username field - it's usually one of these
    const usernameSelectors = [
      'input[type="email"]',
      'input[name="loginfmt"]', 
      '#i0116',
      'input[placeholder*="Email"]',
      'input[placeholder*="someone@example.com"]'
    ];
    
    let usernameEntered = false;
    for (const selector of usernameSelectors) {
      const field = page.locator(selector).first();
      if (await field.isVisible({ timeout: 1000 }).catch(() => false)) {
        console.log(`   📝 Entering username in field: ${selector}`);
        await field.fill(USERNAME);
        usernameEntered = true;
        
        // Click Next/Submit
        const nextBtn = page.locator('#idSIButton9, input[type="submit"], button:has-text("Next")').first();
        if (await nextBtn.isVisible()) {
          console.log('   ✅ Clicking Next...');
          await nextBtn.click();
        }
        break;
      }
    }
    
    if (!usernameEntered) {
      console.log('   ⚠️ Username field not found, may already be filled');
    }
    
    await page.waitForTimeout(3000);
    
    // Now enter password
    console.log('\n📍 Password Page');
    const passwordField = page.locator('input[type="password"], #i0118').first();
    
    if (await passwordField.isVisible({ timeout: 5000 })) {
      console.log('   🔐 Entering password...');
      await passwordField.fill(PASSWORD);
      
      // Click Sign In
      const signInBtn = page.locator('#idSIButton9, button:has-text("Sign in")').first();
      if (await signInBtn.isVisible()) {
        console.log('   ✅ Clicking Sign in...');
        await signInBtn.click();
      }
    }
    
    await page.waitForTimeout(3000);
    
    // Wait for 2FA
    console.log('\n' + '=' * 60);
    console.log('📱 2FA REQUIRED - CHECK YOUR PHONE NOW!');
    console.log('=' * 60);
    console.log('\nThe page should show a 2FA prompt.');
    console.log('Approve it on your phone, then press ENTER here...\n');
    
    // Wait for user input
    await new Promise(resolve => {
      process.stdin.once('data', resolve);
    });
    
    console.log('⏳ Waiting for authentication to complete...');
    await page.waitForTimeout(5000);
    
    // Handle "Stay signed in?" if it appears
    const staySignedIn = page.locator('#idSIButton9, button:has-text("Yes")').first();
    if (await staySignedIn.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log('   Clicking "Yes" to stay signed in...');
      await staySignedIn.click();
      await page.waitForTimeout(2000);
    }
    
    // Check where we are now
    const currentUrl = page.url();
    console.log(`\n📍 Current URL: ${currentUrl}`);
    
    if (currentUrl.includes('aoma-stage.smcdp-de.net') && !currentUrl.includes('login')) {
      console.log('✅ Successfully logged into AOMA!');
      
      // Save cookies
      const storage = await context.storageState();
      await fs.writeFile(
        path.join(process.cwd(), 'tmp/aoma-stage-storage.json'),
        JSON.stringify(storage, null, 2)
      );
      console.log('💾 Saved authentication state');
      
      // Now crawl pages
      await crawlPages(page);
    } else {
      console.log('❌ Not authenticated yet. Complete login manually.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    console.log('\n⏳ Keeping browser open for 10 seconds...');
    await page.waitForTimeout(10000);
    await browser.close();
  }
}

async function crawlPages(page) {
  console.log('\n🕷️ Starting crawl...\n');
  
  const pages = [
    '/aoma-ui/my-aoma-files',
    '/aoma-ui/simple-upload',
    '/aoma-ui/direct-upload',
    '/aoma-ui/product-metadata-viewer',
    '/aoma-ui/registration-job-status'
  ];
  
  for (const path of pages) {
    try {
      const url = `https://aoma-stage.smcdp-de.net${path}`;
      console.log(`📄 Crawling: ${url}`);
      
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(2000);
      
      const title = await page.title();
      const html = await page.content();
      
      // Save HTML
      const fileName = path.replace(/\//g, '_') + '.html';
      const filePath = `tmp/crawled_${fileName}`;
      await fs.writeFile(filePath, html);
      
      // Take screenshot
      await page.screenshot({ 
        path: filePath.replace('.html', '.png'),
        fullPage: true 
      });
      
      console.log(`   ✅ Saved: ${title}`);
      
    } catch (error) {
      console.error(`   ❌ Failed: ${error.message}`);
    }
  }
  
  console.log('\n✅ Crawl complete!');
}

loginAndCrawl();