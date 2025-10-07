/**
 * Microsoft SSO Authentication Utility
 *
 * Handles Microsoft Azure AD authentication with 2FA support.
 * Used by JIRA, Confluence, and AOMA scrapers.
 *
 * @module utils/auth/microsoft-sso
 */

const fs = require('fs').promises;
const path = require('path');

/**
 * Configuration for Microsoft SSO authentication
 * @typedef {Object} MicrosoftSSOConfig
 * @property {string} url - Target URL that requires authentication
 * @property {string} storagePath - Path to save authentication state (optional)
 * @property {string} username - Microsoft username/email (from env: AAD_USERNAME)
 * @property {string} password - Microsoft password (from env: AAD_PASSWORD)
 * @property {number} mfaTimeout - Max wait time for MFA approval in seconds (default: 180)
 * @property {boolean} headless - Run browser in headless mode (default: false for MFA)
 * @property {Function} onMFAPrompt - Callback when waiting for MFA (optional)
 */

/**
 * Authenticate with Microsoft SSO
 *
 * Steps:
 * 1. Checks for existing auth state
 * 2. Navigates to target URL
 * 3. Detects and handles Employee Login redirect
 * 4. Fills username and password
 * 5. Waits for MFA approval (2FA)
 * 6. Saves authentication state
 *
 * @param {import('playwright').Page} page - Playwright page object
 * @param {MicrosoftSSOConfig} config - Authentication configuration
 * @returns {Promise<boolean>} - True if authentication successful
 */
async function authenticateWithMicrosoft(page, config) {
  const {
    url,
    username = process.env.AAD_USERNAME,
    password = process.env.AAD_PASSWORD,
    mfaTimeout = 180,
    onMFAPrompt = null
  } = config;

  console.log(`🔐 Starting Microsoft SSO authentication for ${url}`);

  // Navigate to target URL
  console.log('🌐 Navigating to target URL...');
  await page.goto(url, {
    waitUntil: 'domcontentloaded',
    timeout: 30000
  });

  await page.waitForTimeout(3000);

  const currentUrl = page.url();
  console.log(`📍 Current URL: ${currentUrl}`);

  // Check if we're already authenticated
  if (!currentUrl.includes('Login') && !currentUrl.includes('microsoftonline')) {
    console.log('✅ Already authenticated!');
    return true;
  }

  // Handle Employee Login button if present
  if (currentUrl.includes('Login')) {
    console.log('👤 Login page detected. Looking for Employee Login button...');

    try {
      const clicked = await page.evaluate(() => {
        const selectors = [
          '#aadLoginBtn',
          'button:has-text("Employee Login")',
          'a:has-text("Employee Login")',
          'a:has-text("Sign in")',
          '[onclick*="employee"]',
          '[onclick*="aad"]',
          '[href*="microsoftonline"]'
        ];

        for (const selector of selectors) {
          try {
            const elem = document.querySelector(selector);
            if (elem && elem.offsetParent !== null) { // Check if visible
              elem.click();
              return true;
            }
          } catch (e) {
            // Try next selector
          }
        }
        return false;
      });

      if (clicked) {
        console.log('✅ Clicked Employee Login');
        await page.waitForTimeout(3000);
      } else {
        console.log('⚠️  No Employee Login button found, continuing...');
      }
    } catch (e) {
      console.log('⚠️  Could not click Employee Login:', e.message);
    }
  }

  // Check if we're on Microsoft login page
  await page.waitForTimeout(2000);
  const loginUrl = page.url();

  if (loginUrl.includes('microsoftonline')) {
    console.log('🔐 Microsoft login page detected');

    if (!username || !password) {
      console.error('❌ AAD_USERNAME or AAD_PASSWORD not set in environment!');
      console.log('   Please set these environment variables and try again.');
      return false;
    }

    // Fill username
    console.log(`📧 Filling username: ${username}`);
    try {
      await page.fill('input[type="email"], input[name="loginfmt"], #i0116', username, {
        timeout: 10000
      });
      await page.click('#idSIButton9, input[type="submit"]');
      await page.waitForTimeout(2000);
      console.log('✅ Username submitted');
    } catch (e) {
      console.error('❌ Failed to fill username:', e.message);
      return false;
    }

    // Fill password
    console.log('🔑 Filling password...');
    try {
      await page.waitForSelector('input[type="password"], input[name="passwd"], #i0118', {
        timeout: 10000
      });
      await page.fill('input[type="password"], input[name="passwd"], #i0118', password);
      await page.click('#idSIButton9, input[type="submit"]');
      await page.waitForTimeout(2000);
      console.log('✅ Password submitted');
    } catch (e) {
      console.error('❌ Failed to fill password:', e.message);
      return false;
    }

    // Wait for MFA approval
    console.log('\n⏰ WAITING FOR MFA APPROVAL ON YOUR PHONE!');
    console.log('   Please approve the authentication request...');
    console.log(`   Will wait up to ${mfaTimeout} seconds\n`);

    if (onMFAPrompt) {
      onMFAPrompt();
    }
  }

  // Poll for successful authentication
  console.log('⏳ Polling for authentication completion...');
  let authenticated = false;
  const maxAttempts = Math.floor(mfaTimeout / 3); // Check every 3 seconds

  for (let i = 0; i < maxAttempts; i++) {
    await page.waitForTimeout(3000);

    const currentUrl = page.url();

    // Check if we're back on the target site (not login/microsoft)
    if (!currentUrl.includes('Login') &&
        !currentUrl.includes('microsoftonline') &&
        !currentUrl.includes('login.microsoftonline')) {
      authenticated = true;
      console.log('\n✅ AUTHENTICATED SUCCESSFULLY!');
      break;
    }

    // Handle "Stay signed in?" prompt
    try {
      const stayButton = page.locator('#idSIButton9, button:has-text("Yes"), button:has-text("Stay signed in")').first();
      if (await stayButton.isVisible({ timeout: 500 })) {
        await stayButton.click();
        console.log('   ✓ Clicked "Stay signed in"');
      }
    } catch {}

    // Show progress every 5 attempts (15 seconds)
    if (i % 5 === 0) {
      console.log(`   Still waiting... (${i * 3}s elapsed)`);
    }
  }

  if (!authenticated) {
    console.error('\n❌ Authentication timeout!');
    console.log('   MFA approval was not completed within the timeout period.');
    return false;
  }

  return true;
}

/**
 * Save authentication state to file
 *
 * @param {import('playwright').BrowserContext} context - Browser context
 * @param {string} storagePath - Path to save authentication state
 */
async function saveAuthState(context, storagePath) {
  try {
    // Ensure directory exists
    const dir = path.dirname(storagePath);
    await fs.mkdir(dir, { recursive: true });

    // Save storage state
    await context.storageState({ path: storagePath });
    console.log(`💾 Saved authentication to ${storagePath}`);

    // Also save cookies separately for debugging
    const cookiePath = storagePath.replace('.json', '-cookies.txt');
    const cookies = await context.cookies();
    const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join('; ');
    await fs.writeFile(cookiePath, cookieHeader);
    console.log(`🍪 Saved cookies to ${cookiePath}`);

    return true;
  } catch (error) {
    console.error('❌ Failed to save auth state:', error.message);
    return false;
  }
}

/**
 * Load authentication state from file
 *
 * @param {string} storagePath - Path to authentication state file
 * @returns {Promise<Object|null>} - Storage state object or null if not found
 */
async function loadAuthState(storagePath) {
  try {
    const exists = await fs.access(storagePath).then(() => true).catch(() => false);
    if (!exists) {
      console.log('📂 No existing authentication found');
      return null;
    }

    console.log(`📂 Loading existing authentication from ${storagePath}`);
    const data = await fs.readFile(storagePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.log('⚠️  Could not load auth state:', error.message);
    return null;
  }
}

/**
 * Check if VPN is connected (basic check)
 *
 * This is a simple heuristic - checks if we can resolve internal domains.
 * For more robust VPN detection, you might need to check specific internal IPs or services.
 *
 * @returns {Promise<boolean>} - True if likely on VPN
 */
async function isVPNConnected() {
  // This is a placeholder - implement based on your network setup
  // Common approaches:
  // 1. Try to resolve internal domain
  // 2. Check for specific network interface
  // 3. Ping internal service

  console.log('🔍 VPN detection not yet implemented');
  console.log('   Assuming VPN is connected...');
  return true;
}

module.exports = {
  authenticateWithMicrosoft,
  saveAuthState,
  loadAuthState,
  isVPNConnected
};
