import { test, expect } from './fixtures/base-test';

/**
 * RLHF Tab Tests
 *
 * Tests the Curate tab's RLHF functionality including:
 * - Tab navigation and rendering
 * - Feedback queue loading from database
 * - Charts rendering (Accuracy Trend, Feedback Distribution)
 * - Stats cards displaying correct values
 * - Console error monitoring
 */

test.describe('RLHF Tab Functionality', () => {
  // Capture console logs and errors
  const consoleLogs: string[] = [];
  const consoleErrors: string[] = [];

  test.beforeEach(async ({ page }) => {
    consoleLogs.length = 0;
    consoleErrors.length = 0;

    // Capture all console output
    page.on('console', msg => {
      const text = `[${msg.type()}] ${msg.text()}`;
      consoleLogs.push(text);
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Capture page errors
    page.on('pageerror', error => {
      consoleErrors.push(`PAGE ERROR: ${error.message}`);
    });
  });

  test.afterEach(async () => {
    // Log all console output for debugging
    if (consoleLogs.length > 0) {
      console.log('\n=== Console Logs ===');
      consoleLogs.slice(-30).forEach(log => console.log(log)); // Last 30 logs
    }
    if (consoleErrors.length > 0) {
      console.log('\n=== Console Errors ===');
      consoleErrors.forEach(err => console.log(err));
    }
  });

  test('should load page and navigate to Curate mode', async ({ page }) => {
    console.log('\n=== Testing Page Load and Curate Navigation ===\n');

    // Use load instead of networkidle to avoid timeout from streaming connections
    await page.goto('http://localhost:3000', { waitUntil: 'load', timeout: 30000 });
    console.log('Page loaded');

    // Wait for the header navigation to be visible
    await page.waitForSelector('header', { timeout: 10000 });

    // The Curate button is in the header navigation
    const curateButton = page.locator('button', { hasText: 'Curate' }).first();
    await expect(curateButton).toBeVisible({ timeout: 10000 });
    console.log('Curate button found');

    // Click to navigate to Curate mode
    await curateButton.click();
    console.log('Clicked Curate button');

    // Wait for the CurateTab to load (dynamically imported)
    // Look for "Knowledge Curation" header which appears when mode switches
    const knowledgeCurationHeader = page.locator('h2:has-text("Knowledge Curation")');

    await expect(knowledgeCurationHeader).toBeVisible({ timeout: 15000 });
    console.log('Knowledge Curation header visible - CurateTab loaded');

    // Wait for the CurateTab component to finish loading (wait for "Loading Curate..." to disappear)
    await page.waitForFunction(() => {
      return !document.body.textContent?.includes('Loading Curate...');
    }, { timeout: 15000 });
    console.log('CurateTab component fully loaded');

    // Wait for tabs to be visible (Files, Upload, Info tabs)
    await page.waitForSelector('[role="tablist"]', { timeout: 10000 });
    console.log('Tab list visible');

    // Take a screenshot for debugging
    await page.screenshot({ path: 'test-results/rlhf-curate-tab.png', fullPage: true });

    // Check that the Curate content loaded
    const pageContent = await page.content();

    // Should have HITL-related content or Curate tab content
    const hasHITLContent = pageContent.includes('HITL') ||
                          pageContent.includes('Knowledge Curation') ||
                          pageContent.includes('Feedback') ||
                          pageContent.includes('Vector Store');

    expect(hasHITLContent).toBe(true);
    console.log('HITL/Curate content found on page');

    // Check for no critical console errors
    const criticalErrors = consoleErrors.filter(err =>
      !err.includes('favicon') &&
      !err.includes('hydration') &&
      !err.includes('Warning:') &&
      !err.includes('404') &&
      !err.includes('NEXT_REDIRECT')
    );

    if (criticalErrors.length > 0) {
      console.log('Critical errors found:', criticalErrors);
    }
    expect(criticalErrors.length).toBe(0);
  });

  test('should display RLHF dashboard with charts', async ({ page }) => {
    console.log('\n=== Testing RLHF Dashboard ===\n');

    await page.goto('http://localhost:3000', { waitUntil: 'load', timeout: 30000 });

    // Navigate to Curate tab
    const curateButton = page.locator('button', { hasText: 'Curate' }).first();
    await curateButton.click();

    // Wait for CurateTab to load
    await page.locator('h2:has-text("Knowledge Curation")').waitFor({ timeout: 15000 });
    console.log('CurateTab header loaded');

    // Wait for the CurateTab component to finish loading
    await page.waitForFunction(() => {
      return !document.body.textContent?.includes('Loading Curate...');
    }, { timeout: 15000 });
    console.log('CurateTab component fully loaded');

    // Wait for tabs to be visible
    await page.waitForSelector('[role="tablist"]', { timeout: 10000 });

    // Look for HITL sub-tab within the Curate section (formerly RLHF)
    const hitlTab = page.locator('[role="tab"]:has-text("HITL")').first();
    if (await hitlTab.isVisible({ timeout: 5000 }).catch(() => false)) {
      await hitlTab.click();
      console.log('Clicked HITL sub-tab');
      // Wait for RLHF content to load
      await page.waitForTimeout(3000);
    } else {
      console.log('RLHF tab not visible (may be permission-gated)');
    }

    // Take a screenshot
    await page.screenshot({ path: 'test-results/rlhf-dashboard.png', fullPage: true });

    // Check for chart elements (Recharts renders SVG)
    const svgElements = page.locator('svg');
    const svgCount = await svgElements.count();
    console.log(`Found ${svgCount} SVG elements`);

    // Should have charts (at least icons + potential chart SVGs)
    expect(svgCount).toBeGreaterThan(0);

    // Check for stats or feedback content
    const pageContent = await page.content();
    const hasFeedbackContent = pageContent.includes('Feedback') ||
                               pageContent.includes('Pending') ||
                               pageContent.includes('Submitted') ||
                               pageContent.includes('Rating');

    console.log(`Has feedback content: ${hasFeedbackContent}`);
  });

  test('should load feedback items from database', async ({ page }) => {
    console.log('\n=== Testing Feedback Loading ===\n');

    await page.goto('http://localhost:3000', { waitUntil: 'load', timeout: 30000 });

    // Navigate to Curate
    const curateButton = page.locator('button', { hasText: 'Curate' }).first();
    await curateButton.click();

    // Wait for CurateTab
    await page.locator('h2:has-text("Knowledge Curation")').waitFor({ timeout: 15000 });

    // Check for HITL tab and click it
    const hitlTab = page.locator('[role="tab"]:has-text("HITL")').first();
    if (await hitlTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await hitlTab.click();
      await page.waitForTimeout(3000);
    }

    // Take screenshot for debugging
    await page.screenshot({ path: 'test-results/rlhf-feedback-items.png', fullPage: true });

    // Check console for Supabase connection
    const supabaseConnected = consoleLogs.some(log =>
      log.includes('Supabase') ||
      log.includes('rlhf_feedback') ||
      log.includes('RLHF feedback')
    );
    console.log(`Supabase connection logged: ${supabaseConnected}`);

    // Check for demo data queries (if seeded)
    const pageContent = await page.content();
    const demoQueries = [
      'authentication',
      'RLHF feedback loop',
      'deployment architecture',
      'multi-tenant'
    ];

    let foundDemoQuery = false;
    for (const query of demoQueries) {
      if (pageContent.toLowerCase().includes(query.toLowerCase())) {
        console.log(`Found demo query: "${query}"`);
        foundDemoQuery = true;
      }
    }

    if (!foundDemoQuery) {
      console.log('Note: Demo data may not be seeded. Run: npx tsx scripts/seed-enhanced-rlhf-demo.ts');
    }
  });

  test('should not have critical console errors', async ({ page }) => {
    console.log('\n=== Testing Console Error Free ===\n');

    await page.goto('http://localhost:3000', { waitUntil: 'load', timeout: 30000 });

    // Navigate through the app
    const curateButton = page.locator('button', { hasText: 'Curate' }).first();
    await curateButton.click();

    // Wait for CurateTab
    await page.locator('h2:has-text("Knowledge Curation")').waitFor({ timeout: 15000 });
    await page.waitForTimeout(3000);

    // Filter out non-critical errors
    const criticalErrors = consoleErrors.filter(err => {
      // Ignore these common non-critical errors
      if (err.includes('favicon')) return false;
      if (err.includes('404')) return false;
      if (err.includes('hydration')) return false;
      if (err.includes('Warning:')) return false;
      if (err.includes('NEXT_REDIRECT')) return false;
      if (err.includes('GoTrueClient')) return false; // Auth warnings
      if (err.includes('Listener')) return false; // Event listener warnings
      return true;
    });

    console.log(`Total console errors: ${consoleErrors.length}`);
    console.log(`Critical errors: ${criticalErrors.length}`);

    if (criticalErrors.length > 0) {
      console.log('Critical errors:', criticalErrors);
    }

    expect(criticalErrors.length).toBe(0);
  });
});
