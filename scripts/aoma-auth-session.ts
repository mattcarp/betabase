/**
 * AOMA Authentication Session Manager
 * 
 * This script manages authenticated sessions for AOMA stage environment.
 * It can:
 * 1. Verify existing session validity
 * 2. Re-authenticate if session is expired
 * 3. Save session state for reuse
 * 
 * Usage:
 *   npx ts-node scripts/aoma-auth-session.ts [--verify-only] [--force-reauth]
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const SESSION_FILE = path.join(process.cwd(), 'tmp', 'aoma-stage-storage.json');
const AOMA_URL = process.env.AOMA_STAGE_URL || 'https://aoma-stage.smcdp-de.net';

interface SessionState {
  cookies: any[];
  origins: any[];
}

/**
 * Verify if existing session is still valid
 */
async function verifySession(): Promise<boolean> {
  if (!fs.existsSync(SESSION_FILE)) {
    console.log('❌ No session file found at:', SESSION_FILE);
    return false;
  }

  console.log('🔍 Verifying existing session...');
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    storageState: SESSION_FILE,
    viewport: { width: 1920, height: 1080 },
  });
  const page = await context.newPage();

  try {
    // Try to access AOMA home page
    const response = await page.goto(AOMA_URL, { 
      waitUntil: 'domcontentloaded',
      timeout: 15000 
    });

    // Check if we're redirected to login
    const currentUrl = page.url();
    const isLoggedIn = !currentUrl.includes('/login') && 
                       !currentUrl.includes('microsoft') &&
                       response?.status() === 200;

    if (isLoggedIn) {
      console.log('✅ Session is valid! Currently at:', currentUrl);
      
      // Get page title for extra verification
      const title = await page.title();
      console.log('   Page title:', title);
    } else {
      console.log('❌ Session expired or invalid. Current URL:', currentUrl);
      console.log('   Response status:', response?.status());
    }

    await browser.close();
    return isLoggedIn;

  } catch (error) {
    console.error('❌ Session verification failed:', error);
    await browser.close();
    return false;
  }
}

/**
 * Authenticate and save new session
 */
async function authenticateAndSave(): Promise<boolean> {
  console.log('\n🔐 Starting authentication process...');
  console.log('   This will open a browser window for manual login');
  console.log('   Please complete the Azure AD authentication');

  const browser = await chromium.launch({ 
    headless: false,  // Must be visible for manual auth
    slowMo: 100  // Slow down for visibility
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });
  const page = await context.newPage();

  try {
    // Navigate to AOMA
    console.log(`\n📍 Navigating to ${AOMA_URL}...`);
    await page.goto(AOMA_URL, { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });

    console.log('\n⏳ Waiting for authentication...');
    console.log('   Please log in using your Azure AD credentials');
    console.log('   Complete MFA if prompted');
    
    // Wait for successful navigation to AOMA (not login page)
    await page.waitForFunction(
      (aomaUrl) => {
        const url = window.location.href;
        return url.startsWith(aomaUrl) && 
               !url.includes('/login') &&
               !url.includes('microsoft');
      },
      AOMA_URL,
      { timeout: 300000 } // 5 minutes for manual login
    );

    // Extra wait to ensure everything loads
    await page.waitForTimeout(3000);

    const finalUrl = page.url();
    const title = await page.title();
    
    console.log('\n✅ Authentication successful!');
    console.log('   Current URL:', finalUrl);
    console.log('   Page title:', title);

    // Save session state
    console.log(`\n💾 Saving session to ${SESSION_FILE}...`);
    const sessionState = await context.storageState();
    
    // Ensure tmp directory exists
    const tmpDir = path.dirname(SESSION_FILE);
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
    
    fs.writeFileSync(SESSION_FILE, JSON.stringify(sessionState, null, 2));
    console.log('✅ Session saved successfully!');
    console.log(`   Cookies: ${sessionState.cookies.length}`);
    console.log(`   Origins: ${sessionState.origins.length}`);

    await browser.close();
    return true;

  } catch (error) {
    console.error('\n❌ Authentication failed:', error);
    await browser.close();
    return false;
  }
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);
  const verifyOnly = args.includes('--verify-only');
  const forceReauth = args.includes('--force-reauth');

  console.log('🚀 AOMA Authentication Session Manager\n');

  if (forceReauth) {
    console.log('🔄 Force re-authentication requested');
    const success = await authenticateAndSave();
    process.exit(success ? 0 : 1);
  }

  // Check existing session
  const isValid = await verifySession();

  if (isValid) {
    console.log('\n✨ Session is valid and ready to use!');
    process.exit(0);
  }

  if (verifyOnly) {
    console.log('\n❌ Session is invalid (verify-only mode, not re-authenticating)');
    process.exit(1);
  }

  // Session invalid, re-authenticate
  console.log('\n🔄 Session expired or invalid, re-authenticating...');
  const success = await authenticateAndSave();
  
  if (success) {
    console.log('\n✨ All set! Session is ready to use.');
    process.exit(0);
  } else {
    console.log('\n❌ Failed to authenticate');
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

// Export for use in other scripts
export {
  verifySession,
  authenticateAndSave,
  SESSION_FILE,
  AOMA_URL
};

