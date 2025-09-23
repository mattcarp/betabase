const { chromium } = require('playwright');

async function investigateLogin() {
  console.log('🔍 Investigating login screen at https://thebetabase.com');

  const browser = await chromium.launch({
    headless: false,
    args: ['--disable-web-security', '--disable-features=VizDisplayCompositor']
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });

  const page = await context.newPage();

  // Capture console logs and errors
  page.on('console', msg => {
    console.log(`📝 Console ${msg.type()}: ${msg.text()}`);
  });

  page.on('pageerror', error => {
    console.error(`❌ Page Error: ${error.message}`);
  });

  try {
    console.log('🌐 Navigating to https://thebetabase.com...');
    await page.goto('https://thebetabase.com', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    // Wait for page to load
    await page.waitForTimeout(3000);

    // Take initial screenshot
    console.log('📸 Taking initial screenshot...');
    await page.screenshot({
      path: '/Users/mcarpent/Documents/projects/siam/tmp/login-investigation-initial.png',
      fullPage: true
    });

    // Check for any input fields
    const inputs = await page.$$eval('input', inputs =>
      inputs.map(input => ({
        type: input.type,
        placeholder: input.placeholder,
        id: input.id,
        className: input.className,
        visible: input.offsetParent !== null
      }))
    );

    console.log('📋 Found input fields:', JSON.stringify(inputs, null, 2));

    // Check for buttons
    const buttons = await page.$$eval('button', buttons =>
      buttons.map(button => ({
        text: button.textContent?.trim(),
        id: button.id,
        className: button.className,
        visible: button.offsetParent !== null
      }))
    );

    console.log('🔘 Found buttons:', JSON.stringify(buttons, null, 2));

    // Look for any calculator-like elements
    const calculatorElements = await page.$$eval('*', elements => {
      return elements
        .filter(el => {
          const text = el.textContent?.toLowerCase() || '';
          const className = el.className?.toLowerCase() || '';
          const id = el.id?.toLowerCase() || '';

          return (
            text.includes('calculator') ||
            text.includes('pin') ||
            className.includes('calculator') ||
            className.includes('pin') ||
            id.includes('calculator') ||
            id.includes('pin') ||
            (el.tagName === 'INPUT' && el.type === 'number') ||
            (el.tagName === 'BUTTON' && /^\d$/.test(text.trim()))
          );
        })
        .map(el => ({
          tagName: el.tagName,
          text: el.textContent?.trim(),
          className: el.className,
          id: el.id,
          type: el.type
        }));
    });

    console.log('🧮 Potential calculator/pin elements:', JSON.stringify(calculatorElements, null, 2));

    // Check page title and URL
    const title = await page.title();
    const url = page.url();
    console.log(`📄 Page title: ${title}`);
    console.log(`🔗 Current URL: ${url}`);

    // Look for email input specifically
    const emailInput = await page.$('input[type="email"], input[placeholder*="email" i]');
    if (emailInput) {
      console.log('✅ Found email input field');
      await page.screenshot({
        path: '/Users/mcarpent/Documents/projects/siam/tmp/login-investigation-email-found.png',
        fullPage: true
      });
    } else {
      console.log('❌ No email input field found');
    }

    // Check if there's any auth-related content
    const authContent = await page.$$eval('*', elements => {
      return elements
        .filter(el => {
          const text = el.textContent?.toLowerCase() || '';
          return text.includes('login') ||
                 text.includes('sign in') ||
                 text.includes('magic link') ||
                 text.includes('email') ||
                 text.includes('authentication');
        })
        .map(el => ({
          tagName: el.tagName,
          text: el.textContent?.trim().substring(0, 100),
          className: el.className
        }));
    });

    console.log('🔐 Auth-related content:', JSON.stringify(authContent, null, 2));

    console.log('⏳ Keeping browser open for 30 seconds for manual inspection...');
    await page.waitForTimeout(30000);

  } catch (error) {
    console.error('💥 Error during investigation:', error);
    await page.screenshot({
      path: '/Users/mcarpent/Documents/projects/siam/tmp/login-investigation-error.png',
      fullPage: true
    });
  }

  await browser.close();
  console.log('✅ Investigation complete. Check screenshots in tmp/ directory.');
}

investigateLogin().catch(console.error);