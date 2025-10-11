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
    username = process.env.JIRA_USERNAME || process.env.AAD_USERNAME,
    password = process.env.JIRA_PASSWORD || process.env.AAD_PASSWORD,
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

  await page.waitForTimeout(2000);

  // STEP 1: Click "Log In" button in upper right
  console.log('🔘 Clicking Log In button (upper right)...');
  try {
    // Use exact selector from JIRA HTML: a.login-link
    const loginClicked = await page.evaluate(() => {
      const loginLink = document.querySelector('a.login-link');
      if (loginLink) {
        loginLink.click();
        return true;
      }
      return false;
    });

    if (loginClicked) {
      console.log('✅ Clicked Log In, waiting for form to load...');

      // WAIT FOR LOGIN FORM TO APPEAR
      try {
        await page.waitForSelector('input[name="os_username"], input[name="username"]', { timeout: 10000 });
        await page.waitForTimeout(2000); // Extra time for form to fully render
        console.log('✅ Login form loaded');
      } catch (waitError) {
        console.log('⚠️  Timeout waiting for login form');
      }
    } else {
      console.log('⚠️  No Log In button found (might already be on login page)');
    }
  } catch (e) {
    console.log('⚠️  Error clicking Log In:', e.message);
  }

  // STEP 2: Fill username in the LOGIN FORM (not search box!)
  console.log(`📧 Filling username in login form...`);

  try {
    // Target the LOGIN FORM specifically - use #login-form or form context
    const formInfo = await page.evaluate(() => {
      // Look for login form specifically
      const loginForm = document.querySelector('#login-form, form[name="loginform"], .login-form');
      if (!loginForm) {
        // Fallback: find input with name containing "username"
        const field = document.querySelector('input[name*="username"], input[id*="username"]');
        if (field) {
          return {
            selector: field.id ? `#${field.id}` : `input[name="${field.name}"]`,
            inForm: false
          };
        }
        return null;
      }

      // Find username field WITHIN the login form
      const field = loginForm.querySelector('input[name="os_username"], input[name="username"], input[type="text"]');
      if (!field) return null;

      return {
        selector: field.id ? `#${field.id}` : `input[name="${field.name}"]`,
        inForm: true,
        name: field.name || field.id
      };
    });

    if (!formInfo) {
      console.log('⚠️  Could not find login form username field!');
      return false;
    }

    console.log(`   Found username field: ${formInfo.selector} (in form: ${formInfo.inForm})`);
    console.log(`   Filling: ${username}`);

    // Make the field visible and interactable
    await page.evaluate((selector) => {
      const field = document.querySelector(selector);
      if (field) {
        field.style.opacity = '1';
        field.style.visibility = 'visible';
        field.style.display = 'block';
        field.style.pointerEvents = 'auto';
        field.disabled = false;
        field.readOnly = false;
      }
    }, formInfo.selector);
    await page.waitForTimeout(500);

    // Type the username
    await page.type(formInfo.selector, username, { delay: 100 });
    console.log(`✅ Username filled: ${username}`);
  } catch (error) {
    console.log('⚠️  Error filling username:', error.message);
    return false;
  }

  // STEP 3: Fill password field (VERIFY it's the password field!)
  console.log('🔑 Filling password field...');

  try {
    await page.waitForTimeout(1000);

    // Find and verify the PASSWORD field specifically
    const passwordFieldInfo = await page.evaluate(() => {
      const field = document.querySelector('input[type="password"]#login-form-password');
      if (!field) {
        return { found: false };
      }
      return {
        found: true,
        id: field.id,
        name: field.name,
        type: field.type
      };
    });

    if (!passwordFieldInfo.found) {
      console.log('⚠️  Could not find PASSWORD field (type="password")!');
      return false;
    }

    console.log(`   Found PASSWORD field: id="${passwordFieldInfo.id}" type="${passwordFieldInfo.type}"`);

    // Make password field visible and focus it
    await page.evaluate(() => {
      const field = document.querySelector('input[type="password"]#login-form-password');
      if (field) {
        field.style.opacity = '1';
        field.style.visibility = 'visible';
        field.style.display = 'block';
        field.style.pointerEvents = 'auto';
        field.disabled = false;
        field.readOnly = false;
        field.value = ''; // Clear any existing value
        field.focus();
      }
    });
    await page.waitForTimeout(500);

    // Type password into the PASSWORD field using the most specific selector
    await page.type('input[type="password"]#login-form-password', password, { delay: 100 });
    console.log(`✅ Password filled into PASSWORD field`);
    await page.waitForTimeout(1000);

    // STEP 4: Submit the login form
    console.log('   Submitting login form...');
    await page.evaluate(() => {
      const btn = document.querySelector('#login-form-submit');
      if (btn) {
        console.log('Clicking submit button:', btn.textContent);
        btn.click();
      }
    });

    await page.waitForTimeout(5000);
    console.log('✅ Login form submitted');
  } catch (error) {
    console.log(`⚠️  Error filling password: ${error.message}`);
    return false;
  }

  // Final check
  await page.waitForTimeout(2000);
  const loginUrl = page.url();

  if (loginUrl.includes('microsoftonline')) {
    console.log('🔐 Microsoft login page detected');

    if (!username || !password) {
      console.error('❌ AAD_USERNAME or AAD_PASSWORD not set in environment!');
      console.log('   Please set these environment variables and try again.');
      return false;
    }

    // Fill email for Microsoft SSO (with visibility override)
    const msEmail = process.env.JIRA_EMAIL || process.env.AAD_USERNAME || 'matt.carpenter.ext@sonymusic.com';
    console.log(`📧 Filling Microsoft email: ${msEmail}`);
    try {
      await page.waitForTimeout(2000);

      // Make email field visible
      await page.evaluate(() => {
        const selectors = ['input[type="email"]', 'input[name="loginfmt"]', '#i0116'];
        for (const sel of selectors) {
          const field = document.querySelector(sel);
          if (field) {
            field.style.opacity = '1';
            field.style.visibility = 'visible';
            field.style.display = 'block';
            field.style.pointerEvents = 'auto';
            field.disabled = false;
            field.readOnly = false;
            break;
          }
        }
      });
      await page.waitForTimeout(500);

      // Type email
      await page.type('input[type="email"], input[name="loginfmt"], #i0116', msEmail, { delay: 100 });
      console.log('✅ Email filled');
      await page.waitForTimeout(1000);

      // Click submit
      await page.click('#idSIButton9, input[type="submit"]');
      await page.waitForTimeout(2000);
      console.log('✅ Email submitted');
    } catch (e) {
      console.error('❌ Failed to fill email:', e.message);
      return false;
    }

    // Fill password (with visibility override)
    console.log('🔑 Filling password...');
    try {
      await page.waitForTimeout(2000); // Wait for password field to appear

      // Make password field visible
      await page.evaluate(() => {
        const selectors = ['input[type="password"]', 'input[name="passwd"]', '#i0118'];
        for (const sel of selectors) {
          const field = document.querySelector(sel);
          if (field) {
            field.style.opacity = '1';
            field.style.visibility = 'visible';
            field.style.display = 'block';
            field.style.pointerEvents = 'auto';
            field.disabled = false;
            field.readOnly = false;
            break;
          }
        }
      });
      await page.waitForTimeout(500);

      // Type password
      await page.type('input[type="password"], input[name="passwd"], #i0118', password, { delay: 100 });
      console.log('✅ Password filled');
      await page.waitForTimeout(1000);

      // Click submit
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

    // PROPER CHECK: Look for actual logged-in indicators
    const loginCheck = await page.evaluate(() => {
      // Check 1: "Log In" button should NOT be visible
      const loginButton = document.querySelector('a.login-link');
      const hasLoginButton = loginButton && loginButton.textContent.includes('Log In');

      // Check 2: Should see user-specific content
      const hasUserContent = document.body.textContent.includes('Dashboard for Matt Carpenter') ||
                           document.body.textContent.includes('Log Out') ||
                           document.querySelector('a[title="Log Out"]');

      return {
        hasLoginButton,
        hasUserContent,
        isLoggedIn: !hasLoginButton && hasUserContent
      };
    });

    console.log(`   🔍 Login check: ${loginCheck.isLoggedIn ? '✅ LOGGED IN' : '❌ NOT LOGGED IN'} (loginButton: ${loginCheck.hasLoginButton}, userContent: ${loginCheck.hasUserContent})`);

    if (loginCheck.isLoggedIn) {
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
