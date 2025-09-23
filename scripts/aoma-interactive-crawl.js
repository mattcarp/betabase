#!/usr/bin/env node

/**
 * AOMA Interactive Login and Crawl
 * This script handles the full login flow with your 2FA approval
 */

const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');
const readline = require('readline');
const TurndownService = require('turndown');
const { createClient } = require('@supabase/supabase-js');

require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

// Initialize services
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const turndown = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced'
});

turndown.remove(['script', 'style', 'nav', 'footer', 'header']);

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const askQuestion = (question) => new Promise((resolve) => rl.question(question, resolve));

async function loginAndCrawl() {
  console.log('🚀 AOMA Interactive Login and Crawl\n');
  console.log('=' .repeat(60));
  console.log('This script will:');
  console.log('1. Navigate to AOMA');
  console.log('2. Click "Employee Login"');
  console.log('3. Enter your credentials');
  console.log('4. Wait for YOUR 2FA approval');
  console.log('5. Crawl all pages once authenticated');
  console.log('=' .repeat(60) + '\n');

  const browser = await chromium.launch({ 
    headless: false, // Must be visible for you to see 2FA
    slowMo: 500 // Slow down for visibility
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  try {
    // Step 1: Navigate to AOMA
    console.log('📍 Step 1: Navigating to AOMA...');
    const aomaUrl = process.env.AOMA_STAGE_URL || 'https://aoma-stage.smcdp-de.net';
    await page.goto(aomaUrl, { waitUntil: 'networkidle', timeout: 30000 });
    
    // Step 2: Click Employee Login
    console.log('📍 Step 2: Looking for Employee Login button...');
    
    // Try to find and click the Employee Login button
    const employeeLoginButton = await page.locator('#aadLoginBtn, a:has-text("Employee Login")').first();
    
    if (await employeeLoginButton.isVisible()) {
      console.log('   ✅ Found Employee Login button, clicking...');
      await employeeLoginButton.click();
      await page.waitForTimeout(2000);
    } else {
      console.log('   ⚠️ Employee Login button not found, may already be on login page');
    }
    
    // Step 3: Handle Microsoft login
    console.log('📍 Step 3: Handling Microsoft authentication...');
    
    // Wait for Microsoft login page
    await page.waitForURL(/login\.microsoftonline\.com|login\.live\.com|aoma.*login/i, { timeout: 10000 }).catch(() => {});
    
    // Check if we're on Microsoft login
    const currentUrl = page.url();
    console.log(`   Current URL: ${currentUrl}`);
    
    if (currentUrl.includes('microsoftonline') || currentUrl.includes('login.live')) {
      // Enter username if needed
      const emailInput = await page.locator('input[type="email"], input[name="loginfmt"], #i0116').first();
      if (await emailInput.isVisible()) {
        console.log('   📝 Entering username...');
        await emailInput.fill(process.env.AAD_USERNAME);
        await page.locator('#idSIButton9, input[type="submit"], button[type="submit"]').first().click();
        await page.waitForTimeout(2000);
      }
      
      // Enter password
      const passwordInput = await page.locator('input[type="password"], input[name="passwd"], #i0118').first();
      if (await passwordInput.isVisible()) {
        console.log('   🔐 Entering password...');
        await passwordInput.fill(process.env.AAD_PASSWORD);
        await page.locator('#idSIButton9, input[type="submit"], button[type="submit"]').first().click();
        await page.waitForTimeout(2000);
      }
      
      // Step 4: Wait for 2FA
      console.log('\n' + '🔔'.repeat(30));
      console.log('📱 2FA REQUIRED - CHECK YOUR PHONE!');
      console.log('🔔'.repeat(30) + '\n');
      console.log('Please approve the 2FA request on your phone.');
      console.log('The browser will wait for you to complete 2FA...\n');
      
      // Wait for user to say they've approved
      await askQuestion('Press ENTER after you\'ve approved 2FA on your phone...');
      
      // Give it a moment for the approval to process
      console.log('\n⏳ Waiting for authentication to complete...');
      await page.waitForTimeout(5000);
      
      // Check if "Stay signed in?" prompt appears
      const staySignedIn = await page.locator('#idSIButton9, button:has-text("Yes")').first();
      if (await staySignedIn.isVisible()) {
        console.log('   📝 Clicking "Yes" to stay signed in...');
        await staySignedIn.click();
        await page.waitForTimeout(2000);
      }
    }
    
    // Step 5: Wait for redirect back to AOMA
    console.log('\n📍 Step 5: Waiting for AOMA to load...');
    await page.waitForURL(/aoma-stage\.smcdp-de\.net(?!.*login)/i, { timeout: 30000 }).catch(() => {});
    
    const finalUrl = page.url();
    console.log(`   Final URL: ${finalUrl}`);
    
    // Check if we're authenticated
    if (finalUrl.includes('login') || finalUrl.includes('Login')) {
      console.log('\n❌ Still on login page. Authentication may have failed.');
      console.log('Please complete login manually in the browser window.');
      await askQuestion('Press ENTER once you\'re logged in...');
    } else {
      console.log('   ✅ Successfully authenticated!');
    }
    
    // Save cookies for future use
    const storageState = await context.storageState();
    const storageFile = path.join(process.cwd(), 'tmp/aoma-stage-storage.json');
    await fs.writeFile(storageFile, JSON.stringify(storageState, null, 2));
    console.log(`   💾 Saved authentication state to ${storageFile}`);
    
    // Step 6: Start crawling
    console.log('\n' + '=' .repeat(60));
    console.log('🕷️ READY TO CRAWL AOMA');
    console.log('=' .repeat(60) + '\n');
    
    const crawlNow = await askQuestion('Type "go" to start crawling or "skip" to exit: ');
    
    if (crawlNow.toLowerCase() === 'go') {
      await crawlAOMAPages(page, context);
    } else {
      console.log('\n👍 Skipping crawl. Authentication state has been saved for future use.');
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    console.log('\n🏁 Complete! Closing browser in 5 seconds...');
    await page.waitForTimeout(5000);
    await browser.close();
    rl.close();
  }
}

async function crawlAOMAPages(page, context) {
  console.log('🚀 Starting AOMA crawl...\n');
  
  const pagesToCrawl = [
    { url: '/aoma-ui/my-aoma-files', name: 'My AOMA Files' },
    { url: '/aoma-ui/simple-upload', name: 'Simple Upload' },
    { url: '/aoma-ui/direct-upload', name: 'Direct Upload' },
    { url: '/aoma-ui/product-metadata-viewer', name: 'Product Metadata Viewer' },
    { url: '/aoma-ui/unified-submission-tool', name: 'Unified Submission Tool' },
    { url: '/aoma-ui/registration-job-status', name: 'Registration Job Status' },
    { url: '/aoma-ui/qc-notes', name: 'QC Notes' },
    { url: '/aoma-ui/video-metadata', name: 'Video Metadata' },
    { url: '/aoma-ui/unregister-assets', name: 'Unregister Assets' }
  ];
  
  const baseUrl = process.env.AOMA_STAGE_URL || 'https://aoma-stage.smcdp-de.net';
  let successCount = 0;
  let errorCount = 0;
  
  for (const pageInfo of pagesToCrawl) {
    try {
      const fullUrl = baseUrl + pageInfo.url;
      console.log(`\n📄 Crawling: ${pageInfo.name}`);
      console.log(`   URL: ${fullUrl}`);
      
      // Navigate to page
      await page.goto(fullUrl, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(2000); // Let dynamic content load
      
      // Get page content
      const html = await page.content();
      const title = await page.title();
      
      // Convert to markdown
      const markdown = turndown.turndown(html);
      const cleanedMarkdown = markdown
        .replace(/\n{3,}/g, '\n\n')
        .replace(/\[]\(\)/g, '')
        .replace(/[ \t]+/g, ' ')
        .replace(/[ \t]+$/gm, '')
        .trim();
      
      // Save to database
      const { error } = await supabase
        .from('aoma_unified_vectors')
        .upsert({
          content: cleanedMarkdown,
          embedding: null,
          source_type: 'knowledge',
          source_id: fullUrl,
          metadata: {
            title: pageInfo.name,
            pageTitle: title,
            url: fullUrl,
            contentLength: cleanedMarkdown.length,
            crawledAt: new Date().toISOString()
          },
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'source_type,source_id'
        });
      
      if (error) {
        console.error(`   ❌ Database error: ${error.message}`);
        errorCount++;
      } else {
        console.log(`   ✅ Saved to database (${cleanedMarkdown.length} chars)`);
        successCount++;
        
        // Save locally too
        const fileName = pageInfo.url.replace(/\//g, '_') + '.html';
        const filePath = path.join(process.cwd(), 'tmp', 'crawled-today', fileName);
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        await fs.writeFile(filePath, html);
        
        // Take screenshot
        const screenshotPath = filePath.replace('.html', '.png');
        await page.screenshot({ path: screenshotPath, fullPage: true });
        console.log(`   📸 Screenshot saved`);
      }
      
    } catch (error) {
      console.error(`   ❌ Error crawling ${pageInfo.name}: ${error.message}`);
      errorCount++;
    }
  }
  
  console.log('\n' + '=' .repeat(60));
  console.log('📊 Crawl Summary:');
  console.log(`   ✅ Success: ${successCount} pages`);
  console.log(`   ❌ Failed: ${errorCount} pages`);
  console.log('=' .repeat(60));
}

// Run the script
loginAndCrawl().catch(console.error);