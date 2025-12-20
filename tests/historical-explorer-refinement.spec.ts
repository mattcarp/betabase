import { test, expect } from '@playwright/test';

test('capture-visual-refinement', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1080 });

  // 1. DASHBOARD / CURATE
  console.log('--- Phase 1: Dashboard ---');
  await page.goto('http://localhost:3000#curate', { waitUntil: 'networkidle' });
  
  // The Curate page has its own sub-tabs. Default is "dashboard"
  // Wait for the Radar Chart text
  try {
    await page.waitForSelector('text=Intelligence Quality Index', { timeout: 30000 });
    await page.waitForTimeout(3000); // Animation buffer
    await page.screenshot({ path: 'dashboard-refinement.png' });
    console.log('✅ Captured dashboard-refinement.png');
  } catch (e) {
    console.log('❌ Failed to find Intelligence Quality Index. Taking fallback screenshot.');
    await page.screenshot({ path: 'dashboard-failed.png' });
  }

  // 2. TEST TAB
  console.log('--- Phase 2: Test Tab ---');
  await page.goto('http://localhost:3000#test', { waitUntil: 'networkidle' });
  
  // Click "Historical Tests" sub-tab
  const historicalSubTab = page.locator('button[role="tab"]:has-text("Historical Tests")');
  await historicalSubTab.click();
  
  try {
    // Wait for the Archive icon or text
    await page.waitForSelector('text=Historical Tests', { timeout: 30000 });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'test-tab-refinement-final.png' });
    console.log('✅ Captured test-tab-refinement-final.png');

    // 3. TEST DETAIL
    console.log('--- Phase 3: Test Detail ---');
    // Wait for any row to be visible
    const row = page.locator('tr[data-test-id^="test-row-"]').first();
    await row.waitFor({ state: 'visible', timeout: 30000 });
    await row.click();
    
    // Wait for overhaul indicators
    await page.waitForSelector('text=VAULT://', { timeout: 20000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-detail-refinement.png' });
    console.log('✅ Captured test-detail-refinement.png');
  } catch (e) {
    console.log('❌ Failed to capture Test Tab details. ' + e.message);
    await page.screenshot({ path: 'test-tab-failed.png' });
  }

  // 4. LANDING PAGE
  console.log('--- Phase 4: Landing Page ---');
  await page.goto('http://localhost:3000#chat', { waitUntil: 'networkidle' });
  await page.waitForSelector('text=Welcome to The Betabase', { timeout: 20000 });
  await page.screenshot({ path: 'landing-page.png' });
  console.log('✅ Captured landing-page.png');
});
