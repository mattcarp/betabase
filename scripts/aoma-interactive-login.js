const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');

console.log('🔐 AOMA Login Script - Interactive Mode\n');

const STORAGE_FILE = path.join(process.cwd(), 'tmp/aoma-stage-storage.json');
const COOKIE_FILE = path.join(process.cwd(), 'tmp/aoma-cookie.txt');

async function interactiveLogin() {
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 100
  });
  
  try {
    // Try to load existing auth first
    let context;
    try {
      const storageExists = await fs.access(STORAGE_FILE).then(() => true).catch(() => false);
      if (storageExists) {
        console.log('📂 Loading existing authentication...\n');
        context = await browser.newContext({
          storageState: STORAGE_FILE
        });
      } else {
        context = await browser.newContext();
      }
    } catch {
      context = await browser.newContext();
    }
    
    const page = await context.newPage();
    
    // Go to AOMA
    console.log('🌐 Navigating to AOMA Stage...');
    await page.goto('https://aoma-stage.smcdp-de.net', { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });
    
    await page.waitForTimeout(3000);
    
    // Check current URL
    const currentUrl = page.url();
    console.log(`📍 Current URL: ${currentUrl}\n`);
    
    // If we see login page, try Employee Login
    if (currentUrl.includes('Login')) {
      console.log('👤 Login page detected. Looking for Employee Login button...');
      
      try {
        // Try multiple selectors for Employee Login
        const clicked = await page.evaluate(() => {
          const selectors = [
            '#aadLoginBtn',
            'button:has-text("Employee Login")',
            'a:has-text("Employee Login")',
            '[onclick*="employee"]',
            '[onclick*="aad"]'
          ];
          
          for (const selector of selectors) {
            const elem = document.querySelector(selector);
            if (elem) {
              elem.click();
              return true;
            }
          }
          return false;
        });
        
        if (clicked) {
          console.log('✅ Clicked Employee Login\n');
          await page.waitForTimeout(3000);
        } else {
          console.log('⚠️  No Employee Login button found\n');
        }
      } catch (e) {
        console.log('⚠️  Could not click Employee Login:', e.message);
      }
    }
    
    // Check if we're on Microsoft login
    if (page.url().includes('microsoftonline')) {
      console.log('🔐 Microsoft login detected');
      
      const username = process.env.AAD_USERNAME;
      const password = process.env.AAD_PASSWORD;
      
      if (username && password) {
        console.log(`📧 Filling username: ${username}`);
        
        // Fill username
        try {
          await page.fill('input[type="email"], input[name="loginfmt"], #i0116', username);
          await page.click('#idSIButton9, input[type="submit"]');
          await page.waitForTimeout(2000);
        } catch {}
        
        // Fill password
        try {
          console.log('🔑 Filling password...');
          await page.fill('input[type="password"], input[name="passwd"], #i0118', password);
          await page.click('#idSIButton9, input[type="submit"]');
          await page.waitForTimeout(2000);
        } catch {}
        
        console.log('\n⏰ WAITING FOR MFA APPROVAL ON YOUR PHONE!');
        console.log('   Please approve the authentication request...\n');
      } else {
        console.log('⚠️  No AAD_USERNAME or AAD_PASSWORD in environment');
        console.log('   Please login manually in the browser\n');
      }
    }
    
    // Wait for user to complete authentication
    console.log('⏳ Waiting for authentication to complete...');
    console.log('   (Script will detect when you reach AOMA)\n');
    
    // Poll for successful authentication
    let authenticated = false;
    for (let i = 0; i < 60; i++) { // Wait up to 3 minutes
      await page.waitForTimeout(3000);
      
      const url = page.url();
      console.log(`   Checking... ${url.substring(0, 50)}...`);
      
      // Check if we're back on AOMA (not login)
      if (url.includes('aoma-stage.smcdp-de.net') && 
          !url.includes('Login') && 
          !url.includes('microsoftonline')) {
        authenticated = true;
        console.log('\n✅ AUTHENTICATED SUCCESSFULLY!\n');
        break;
      }
      
      // Handle "Stay signed in?" prompt
      try {
        const stayButton = page.locator('#idSIButton9, button:has-text("Yes")').first();
        if (await stayButton.isVisible({ timeout: 500 })) {
          await stayButton.click();
          console.log('   Clicked "Stay signed in"');
        }
      } catch {}
    }
    
    if (authenticated) {
      // Save the authentication state
      await context.storageState({ path: STORAGE_FILE });
      console.log(`💾 Saved authentication to ${STORAGE_FILE}`);
      
      // Export cookies
      const cookies = await context.cookies();
      const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join('; ');
      await fs.writeFile(COOKIE_FILE, cookieHeader);
      console.log(`🍪 Saved cookies to ${COOKIE_FILE}\n`);
      
      // Test navigation
      console.log('🧪 Testing navigation to AOMA pages...\n');
      
      const testPages = [
        '/aoma-ui/my-aoma-files',
        '/aoma-ui/simple-upload'
      ];
      
      for (const testPath of testPages) {
        const testUrl = `https://aoma-stage.smcdp-de.net${testPath}`;
        console.log(`   Testing: ${testPath}`);
        await page.goto(testUrl, { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(2000);
        
        const title = await page.title();
        const finalUrl = page.url();
        
        if (finalUrl.includes('Login')) {
          console.log(`      ❌ Redirected to login`);
        } else {
          console.log(`      ✅ Success! Title: ${title}`);
        }
      }
      
      console.log('\n✅ Authentication setup complete!');
      console.log('   You can now run crawling scripts.\n');
    } else {
      console.log('\n⚠️  Authentication not completed');
      console.log('   Please complete login manually and run this script again.\n');
    }
    
    console.log('📌 Browser will stay open for 30 seconds for inspection...');
    await page.waitForTimeout(30000);
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    await browser.close();
    console.log('👋 Browser closed');
  }
}

interactiveLogin().catch(console.error);
