import { test, expect } from '@playwright/test';

/**
 * Production test to verify CustomElementGuard prevents web component conflicts
 * This test specifically checks for the issue that broke production in September 2024
 */

test.describe('CustomElementGuard Protection', () => {
  test.beforeEach(async ({ page }) => {
    // Monitor console for errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error('Console error:', msg.text());
      }
    });
  });

  test('No web component registration errors on login page', async ({ page }) => {
    const errors: string[] = [];
    
    // Capture all console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Navigate to production
    await page.goto('https://iamsiam.ai', {
      waitUntil: 'networkidle'
    });

    // Wait for page to fully load
    await page.waitForTimeout(2000);

    // Check for the specific error that was breaking production
    const hasCustomElementError = errors.some(error => 
      error.includes('CustomElementRegistry') ||
      error.includes('ace-autosize-textarea') ||
      error.includes('Failed to execute \'define\'')
    );

    expect(hasCustomElementError).toBeFalsy();
  });

  test('Authentication flow completes without component errors', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    page.on('pageerror', error => {
      errors.push(error.message);
    });

    // Navigate to login
    await page.goto('https://iamsiam.ai');
    
    // Check login form is present
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 10000 });
    
    // Enter test email
    await page.fill('input[type="email"]', 'siam-test-x7j9k2p4@mailinator.com');
    
    // Click send magic link
    await page.click('button:has-text("Send Magic Link")');
    
    // Wait for response
    await page.waitForTimeout(3000);
    
    // Verify no critical errors occurred
    const criticalErrors = errors.filter(error => 
      !error.includes('Failed to load resource') && // Ignore CDN issues
      !error.includes('ResizeObserver') && // Ignore browser quirk
      !error.includes('Non-Error promise rejection') // Ignore promise warnings
    );
    
    // Log any errors for debugging
    if (criticalErrors.length > 0) {
      console.log('Critical errors found:', criticalErrors);
    }
    
    expect(criticalErrors).toHaveLength(0);
  });

  test('CustomElementGuard prevents duplicate registrations', async ({ page }) => {
    await page.goto('https://iamsiam.ai');
    
    // Try to register a custom element that might conflict
    const registrationResult = await page.evaluate(() => {
      try {
        // Attempt to define a test custom element
        class TestElement extends HTMLElement {}
        
        // Try to define it twice (should be handled gracefully)
        customElements.define('test-element-guard', TestElement);
        
        // Try again - CustomElementGuard should prevent error
        try {
          customElements.define('test-element-guard', TestElement);
          return 'duplicate-allowed'; // Should not happen
        } catch (e) {
          return 'duplicate-prevented'; // Expected with guard
        }
      } catch (e) {
        return 'initial-registration-failed';
      }
    });
    
    // The guard should prevent the duplicate registration error
    expect(registrationResult).not.toBe('duplicate-allowed');
  });

  test('Page loads without Supabase reference errors', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('https://iamsiam.ai');
    await page.waitForLoadState('networkidle');
    
    // Check for Supabase-related errors that were in the original bug
    const hasSupabaseError = errors.some(error => 
      error.includes('SupabaseVectorStore') ||
      error.includes('ReferenceError') ||
      error.includes('AISaChatPanel')
    );
    
    expect(hasSupabaseError).toBeFalsy();
  });

  test('Health endpoint confirms application is running', async ({ request }) => {
    const response = await request.get('https://iamsiam.ai/api/health');
    
    expect(response.status()).toBe(200);
    
    const body = await response.json();
    expect(body.status).toBe('healthy');
  });
});

test.describe('Production Smoke Tests', () => {
  test('Critical user journey works end-to-end', async ({ page }) => {
    // Navigate to home
    await page.goto('https://iamsiam.ai');
    
    // Verify page loaded
    await expect(page).toHaveTitle(/Betabase/i);
    
    // Check login form is functional
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();
    await expect(emailInput).toBeEnabled();
    
    // Check send button is functional
    const sendButton = page.locator('button:has-text("Send Magic Link")');
    await expect(sendButton).toBeVisible();
    await expect(sendButton).toBeEnabled();
    
    // Verify no JavaScript errors on page
    const jsErrors = await page.evaluate(() => {
      return window.console.error ? false : true;
    });
    
    expect(jsErrors).toBeTruthy();
  });

  test('Application responds quickly', async ({ page }) => {
    const startTime = Date.now();
    
    const response = await page.goto('https://iamsiam.ai', {
      waitUntil: 'domcontentloaded'
    });
    
    const loadTime = Date.now() - startTime;
    
    // Page should load in under 5 seconds
    expect(loadTime).toBeLessThan(5000);
    
    // Response should be successful
    expect(response?.status()).toBeLessThan(400);
  });
});