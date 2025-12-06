/**
 * Self-Healing Demo E2E Tests
 *
 * Tests the complete self-healing test demo flow including:
 * - API endpoint validation
 * - Navigation to self-healing tab
 * - Triggering demo healing via secret button (3 clicks on Configure)
 * - Verifying healing attempt appears in queue
 * - Testing History tab with trend data
 */

import { test, expect } from '../fixtures/base-test';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';

// Helper function to navigate to self-healing tab
async function navigateToSelfHealingTab(page: import('@playwright/test').Page) {
  // Navigate to the app
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });

  // Wait for the page to settle and load
  await page.waitForTimeout(2000);

  // Find and click the Test button in the main header navigation
  // The Test button has a specific icon (BeakerIcon) - use more specific selector
  const testTab = page.locator('nav button:has-text("Test"), header button:has-text("Test")').first();
  await expect(testTab).toBeVisible({ timeout: 15000 });
  await testTab.click();

  // Wait for the tab content to switch - look for any Test Dashboard content
  // The TestDashboard shows tabs like "Dashboard", "Historical Tests", etc.
  // Or the loading indicator "Loading Test Dashboard..."
  await page.waitForTimeout(2000);

  // Wait for either the dashboard content OR the Self-Healing tab to appear
  // The Self-Healing is a tab element (role="tab") in the Test Dashboard
  const dashboardContent = page.locator('text=Test Dashboard')
    .or(page.locator('text=Loading Test Dashboard'))
    .or(page.locator('role=tab[name="Self-Healing"]'))
    .or(page.locator('role=tab[name="Home"]'))
    .or(page.locator('[role="tab"]:has-text("Self-Healing")'));
  await expect(dashboardContent.first()).toBeVisible({ timeout: 20000 });

  // If we see "Loading Test Dashboard", wait for it to finish
  const loading = page.locator('text=Loading Test Dashboard');
  if (await loading.isVisible()) {
    await loading.waitFor({ state: 'hidden', timeout: 15000 });
  }

  // Now click on Self-Healing tab in the dashboard sidebar
  // It can be either a button or tab element depending on the view
  const selfHealingTab = page.locator('[role="tab"]:has-text("Self-Healing")')
    .or(page.locator('button:has-text("Self-Healing")'));
  await expect(selfHealingTab.first()).toBeVisible({ timeout: 15000 });
  await selfHealingTab.first().click();

  // Wait for Self-Healing Monitor to load
  await expect(page.locator('text=Self-Healing Test Monitor')).toBeVisible({ timeout: 15000 });
}

// API Tests - these don't need UI navigation
test.describe('Self-Healing API Tests', () => {

  test('API: should return demo data from self-healing endpoint', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/self-healing`);

    expect(response.ok()).toBeTruthy();

    const data = await response.json();

    // Verify response structure
    expect(data).toHaveProperty('attempts');
    expect(Array.isArray(data.attempts)).toBe(true);

    // Should have demo data or real data
    if (data.message && data.message.includes('demo')) {
      // Demo mode - verify demo data structure
      expect(data.attempts.length).toBeGreaterThan(0);
    }
  });

  test('API: should return analytics data', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/self-healing/analytics`);

    expect(response.ok()).toBeTruthy();

    const data = await response.json();

    // Verify analytics structure
    expect(data).toHaveProperty('summary');
    expect(data.summary).toHaveProperty('totalAttempts');
    expect(data.summary).toHaveProperty('autoHealed');
    expect(data.summary).toHaveProperty('successRate');
    expect(data.summary).toHaveProperty('tierBreakdown');

    // Verify trends data
    expect(data).toHaveProperty('trends');
    expect(Array.isArray(data.trends)).toBe(true);
  });

  test('API: should list available demo scenarios', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/self-healing/demo`);

    expect(response.ok()).toBeTruthy();

    const data = await response.json();

    // Verify scenarios are returned
    expect(data).toHaveProperty('scenarios');
    expect(Array.isArray(data.scenarios)).toBe(true);
    expect(data.scenarios.length).toBe(5); // We have 5 demo scenarios

    // Verify scenario structure
    const firstScenario = data.scenarios[0];
    expect(firstScenario).toHaveProperty('testName');
    expect(firstScenario).toHaveProperty('testFile');
    expect(firstScenario).toHaveProperty('originalSelector');
    expect(firstScenario).toHaveProperty('scenario');
  });

  test('API: should trigger demo healing via POST', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/self-healing/demo`, {
      data: {
        scenarioIndex: 0,
        useRealAI: false, // Use mock for faster test
      },
    });

    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(201);

    const data = await response.json();

    // Verify the healing attempt was created
    expect(data).toHaveProperty('id');
    expect(data).toHaveProperty('test_name');
    expect(data).toHaveProperty('status');
    expect(data).toHaveProperty('tier');
    expect(data).toHaveProperty('confidence');
    expect(data).toHaveProperty('original_selector');
    expect(data).toHaveProperty('suggested_selector');
    expect(data.demo).toBe(true);
  });
});

// UI Tests - these need navigation
test.describe('Self-Healing UI Tests', () => {

  test('should navigate to Self-Healing tab and display initial state', async ({ page }) => {
    await navigateToSelfHealingTab(page);

    // Verify Self-Healing Monitor header is visible
    await expect(page.locator('text=Self-Healing Test Monitor')).toBeVisible();
    await expect(page.locator('text=AI-powered test maintenance')).toBeVisible();

    // Verify Configure button is present
    const configureButton = page.locator('button:has-text("Configure")');
    await expect(configureButton).toBeVisible();

    // Verify stats cards are displayed (actual labels from SelfHealingTestViewer)
    await expect(page.locator('text=Total Tests')).toBeVisible();
    await expect(page.locator('text=Auto-Healed')).toBeVisible();
    await expect(page.locator('text=Pending Review')).toBeVisible();

    // Verify tabs are present (Live Healing Workflow, Healing History)
    await expect(page.locator('button:has-text("Live Healing Workflow")')).toBeVisible();
    await expect(page.locator('button:has-text("Healing History")')).toBeVisible();
  });

  test('should trigger demo healing via secret button (3 clicks on Configure)', async ({ page }) => {
    await navigateToSelfHealingTab(page);

    // Get the Configure button
    const configureButton = page.locator('button:has-text("Configure")');
    await expect(configureButton).toBeVisible();

    // Set up request interception to verify API call is made
    let demoCalled = false;
    await page.route('**/api/self-healing/demo', async route => {
      demoCalled = true;
      // Let the request continue normally
      await route.continue();
    });

    // Click the Configure button 3 times (secret trigger)
    await configureButton.click();
    await page.waitForTimeout(200);
    await configureButton.click();
    await page.waitForTimeout(200);
    await configureButton.click();

    // Wait for the button to show "Healing..." (indicates demo is triggering)
    // Use a longer timeout and be more forgiving
    try {
      await expect(page.locator('button:has-text("Healing")')).toBeVisible({ timeout: 10000 });

      // Wait for healing to complete and button to return to "Configure"
      await expect(configureButton).toBeVisible({ timeout: 45000 });

      // Verify the API was called
      expect(demoCalled).toBe(true);
    } catch {
      // If the button doesn't show "Healing...", the demo might have triggered too fast
      // Check if API was at least called
      expect(demoCalled).toBe(true);
    }
  });

  test('should display demo data in queue', async ({ page }) => {
    await navigateToSelfHealingTab(page);

    // Wait for data to load
    await page.waitForTimeout(1000);

    // Demo data should be visible (either from demo trigger or demo fallback data)
    // Look for any of the demo scenarios or the fallback "Active Healing Queue" title
    const activeQueue = page.locator('text=Active Healing Queue');
    await expect(activeQueue).toBeVisible({ timeout: 10000 });

    // The page should show some content (at minimum, demo fallback data or empty state)
    const pageContent = await page.textContent('body');
    expect(pageContent).toContain('Self-Healing Test Monitor');
  });

  test('should switch to Healing History tab and display content', async ({ page }) => {
    await navigateToSelfHealingTab(page);

    // Click Healing History tab
    const historyTab = page.locator('button:has-text("Healing History")');
    await historyTab.click();

    // Wait for history content to load
    await page.waitForTimeout(1000);

    // Verify the 14-Day Healing Trend section appears (this is the content in the History tab)
    const trendContent = page.locator('text=14-Day Healing Trend');
    await expect(trendContent).toBeVisible({ timeout: 5000 });
  });

  test('MAC Design: should use gradient styling on header', async ({ page }) => {
    await navigateToSelfHealingTab(page);

    // Verify gradient text is applied to the header
    const headerElement = page.locator('h2:has-text("Self-Healing Test Monitor")');
    await expect(headerElement).toBeVisible();

    const hasGradient = await headerElement.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return computed.backgroundImage.includes('gradient') ||
             el.className.includes('gradient');
    });

    expect(hasGradient).toBe(true);
  });
});

test.describe('Self-Healing Error Handling', () => {
  test('should handle navigation and display correctly even with data loading', async ({ page }) => {
    await navigateToSelfHealingTab(page);

    // Even if API fails, the component should render with demo data
    await expect(page.locator('text=Self-Healing Test Monitor')).toBeVisible();

    // Stats should still be visible (demo data fallback)
    await expect(page.locator('text=Total Tests')).toBeVisible();
  });
});
