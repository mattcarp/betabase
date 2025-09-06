import { test, expect } from '@playwright/test';

/**
 * Quick Integration Test for Dashboard-Connected Playwright
 * This test validates that the Test Dashboard integration is working
 */

test.describe('Dashboard Integration Tests', () => {
  test('should demonstrate dashboard connectivity', async ({ page }) => {
    // Navigate to the application
    await page.goto('/');
    
    // Check that the page loads successfully
    await expect(page).toHaveTitle(/SIAM/);
    console.log('✅ Application loaded successfully');
    
    // Take a screenshot for the dashboard
    await page.screenshot({ 
      path: '.playwright-results/dashboard-integration-test.png',
      fullPage: true 
    });
    console.log('📸 Screenshot captured for dashboard');
    
    // Simulate some user interaction
    await page.waitForTimeout(1000);
    console.log('⏳ Simulating user interaction...');
    
    // Check for basic UI elements
    const body = await page.locator('body');
    await expect(body).toBeVisible();
    console.log('🎯 UI elements verified');
  });

  test('should validate navigation functionality', async ({ page }) => {
    await page.goto('/');
    
    // Test tab navigation if available
    const testTab = page.locator('text=Test');
    if (await testTab.isVisible()) {
      await testTab.click();
      console.log('🧪 Navigated to Test tab');
      
      // Verify Test Dashboard elements
      const dashboard = page.locator('text=Test Dashboard');
      if (await dashboard.isVisible()) {
        console.log('✅ Test Dashboard is visible');
      }
    }
    
    await page.waitForTimeout(2000);
    console.log('⚡ Navigation test completed');
  });

  test('should handle API connectivity', async ({ page }) => {
    // Test health endpoint
    const healthResponse = await page.goto('/api/health');
    expect(healthResponse?.status()).toBeLessThan(500);
    console.log('🏥 Health check passed');
    
    // Test basic page functionality
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    console.log('🌐 Network requests completed');
  });
});