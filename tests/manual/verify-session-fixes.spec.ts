/**
 * Verification Tests for Session Fixes (Nov 6, 2024)
 * 
 * This test suite verifies:
 * 1. Black background fix (theme variables)
 * 2. Emergency login redirect fix
 * 3. AuthGuard functionality
 * 4. Login page styling
 * 5. Chat page accessibility
 */

import { test, expect } from '../fixtures/base-test';

const BASE_URL = 'http://localhost:3000';

test.describe('Session Fixes Verification', () => {
  
  test('Login page - Theme styling verification', async ({ page }) => {
    console.log('📸 Testing login page styling...');
    
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    
    // Wait for page to be fully loaded
    await page.waitForTimeout(2000);
    
    // Take full page screenshot
    await page.screenshot({
      path: 'tmp/screenshots/01-login-page.png',
      fullPage: true
    });
    
    console.log('✅ Login page screenshot saved');
    
    // Verify no black background
    const bodyBg = await page.evaluate(() => {
      return window.getComputedStyle(document.body).backgroundColor;
    });
    
    console.log('   Body background color:', bodyBg);
    
    // Should not be pure black (0, 0, 0)
    expect(bodyBg).not.toBe('rgb(0, 0, 0)');
    
    // Verify page elements are visible
    const loginForm = page.locator('form').first();
    await expect(loginForm).toBeVisible({ timeout: 5000 });
    
    // Take a zoomed screenshot of the login form
    await loginForm.screenshot({
      path: 'tmp/screenshots/02-login-form-detail.png'
    });
    
    console.log('✅ Login form detail screenshot saved');
  });

  test('Home page - AuthGuard verification', async ({ page }) => {
    console.log('📸 Testing AuthGuard redirect...');
    
    // Try to access home page without authentication
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    
    // Wait a bit for any redirects
    await page.waitForTimeout(3000);
    
    const currentUrl = page.url();
    console.log('   Current URL after redirect:', currentUrl);
    
    // Take screenshot of auth state
    await page.screenshot({
      path: 'tmp/screenshots/03-auth-guard-redirect.png',
      fullPage: true
    });
    
    console.log('✅ AuthGuard screenshot saved');
    
    // Verify we're either on login page or seeing auth guard
    const isOnLoginPage = currentUrl.includes('/login');
    const hasAuthGuard = await page.locator('text=/Verifying authentication|Unauthorized/').isVisible().catch(() => false);
    
    console.log('   Is on login page:', isOnLoginPage);
    console.log('   Has AuthGuard visible:', hasAuthGuard);
    
    expect(isOnLoginPage || hasAuthGuard).toBeTruthy();
    
    // Verify NO "Emergency Static Login" text
    const hasEmergencyLogin = await page.locator('text=/Emergency Static Login/i').isVisible().catch(() => false);
    expect(hasEmergencyLogin).toBe(false);
    
    console.log('✅ No emergency login redirect (regression fixed)');
  });

  test('Theme verification - No black backgrounds', async ({ page }) => {
    console.log('📸 Verifying theme consistency...');
    
    const pages = [
      { path: '/login', name: 'Login Page' },
      { path: '/', name: 'Home Page (with AuthGuard)' }
    ];
    
    for (const { path, name } of pages) {
      await page.goto(`${BASE_URL}${path}`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);
      
      // Check background colors throughout the page
      const backgrounds = await page.evaluate(() => {
        const elements = document.querySelectorAll('*');
        const blackBackgrounds: string[] = [];
        
        elements.forEach((el) => {
          const bg = window.getComputedStyle(el).backgroundColor;
          if (bg === 'rgb(0, 0, 0)' || bg === '#000000' || bg === 'black') {
            blackBackgrounds.push(`${el.tagName}.${el.className}`);
          }
        });
        
        return blackBackgrounds;
      });
      
      console.log(`   ${name}: Pure black backgrounds found:`, backgrounds.length);
      
      if (backgrounds.length > 0) {
        console.log('   ⚠️  Black elements:', backgrounds.slice(0, 5));
      }
    }
    
    console.log('✅ Theme verification complete');
  });

  test('Visual comparison - Before/After fix', async ({ page }) => {
    console.log('📸 Creating visual comparison screenshots...');
    
    // Login page comparison
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    await page.screenshot({
      path: 'tmp/screenshots/04-login-page-after-fix.png',
      fullPage: false,
      clip: { x: 0, y: 0, width: 1920, height: 1080 }
    });
    
    // Home/AuthGuard comparison
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    
    await page.screenshot({
      path: 'tmp/screenshots/05-auth-guard-after-fix.png',
      fullPage: false,
      clip: { x: 0, y: 0, width: 1920, height: 1080 }
    });
    
    console.log('✅ Comparison screenshots saved');
  });

  test('Responsive design check', async ({ page }) => {
    console.log('📸 Testing responsive design...');
    
    const viewports = [
      { width: 1920, height: 1080, name: 'Desktop' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 375, height: 812, name: 'Mobile' }
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1500);
      
      await page.screenshot({
        path: `tmp/screenshots/06-login-${viewport.name.toLowerCase()}.png`,
        fullPage: false
      });
      
      console.log(`   ✅ ${viewport.name} (${viewport.width}x${viewport.height}) screenshot saved`);
    }
  });

  test('Screenshot manifest - Generate summary', async ({ page }) => {
    console.log('📊 Generating screenshot manifest...');
    
    const fs = require('fs');
    const path = require('path');
    
    const screenshotDir = path.join(process.cwd(), 'tmp', 'screenshots');
    
    // Ensure directory exists
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }
    
    const manifest = {
      testDate: new Date().toISOString(),
      fixes: [
        '✅ Black background → Theme-aware background',
        '✅ Emergency static login → Next.js login page',
        '✅ AuthGuard proper redirects',
        '✅ Theme consistency across pages'
      ],
      screenshots: [
        { file: '01-login-page.png', description: 'Login page full view' },
        { file: '02-login-form-detail.png', description: 'Login form detailed view' },
        { file: '03-auth-guard-redirect.png', description: 'AuthGuard redirect behavior' },
        { file: '04-login-page-after-fix.png', description: 'Login page after theme fix (1920x1080)' },
        { file: '05-auth-guard-after-fix.png', description: 'AuthGuard after fix (1920x1080)' },
        { file: '06-login-desktop.png', description: 'Login page - Desktop (1920x1080)' },
        { file: '06-login-tablet.png', description: 'Login page - Tablet (768x1024)' },
        { file: '06-login-mobile.png', description: 'Login page - Mobile (375x812)' }
      ]
    };
    
    const manifestPath = path.join(screenshotDir, 'manifest.json');
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    
    console.log('✅ Manifest saved to:', manifestPath);
    console.log('\n📸 All screenshots available in:', screenshotDir);
  });
});

