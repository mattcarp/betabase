import { test, expect } from '@playwright/test';

test('capture-visual-refinement', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1080 });

  // 1. DASHBOARD / CURATE
  console.log('--- Phase 1: Dashboard ---');
  await page.goto('http://localhost:3000#curate', { waitUntil: 'networkidle' });
  await page.waitForSelector('text=Intelligence Quality Index', { timeout: 30000 });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'dashboard-refinement.png' });

  // 2. TEST TAB
  console.log('--- Phase 2: Test Tab ---');
  await page.goto('http://localhost:3000#test', { waitUntil: 'networkidle' });
  await page.locator('button[role="tab"]:has-text("Historical Tests")').click();
  
  console.log('Waiting for test rows...');
  const firstRow = page.locator('tr[data-test-id^="test-row-"]').first();
  await firstRow.waitFor({ state: 'visible', timeout: 45000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'test-tab-refinement-final.png' });

  // 3. TEST DETAIL
  console.log('--- Phase 3: Test Detail ---');
  await firstRow.click();
  await page.waitForSelector('text=Auto-Ready', { timeout: 20000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'test-detail-refinement.png' });

  // 4. GENERATE & CRITIQUE
  console.log('--- Phase 4: Generate & Critique ---');
  const genBtn = page.locator('button:has-text("Generate Automated Test")');
  await genBtn.click();
  
  // Wait for code artifact to appear (Tokyo Night theme likely has specific colors or text)
  await page.waitForSelector('text=Manual Execution Logic', { timeout: 30000 }); // It defaults to human mode if code is generating? No, wait.
  
  // Click Critique button (Edit3 icon)
  const critiqueBtn = page.locator('button[title="Critique Script"]');
  await critiqueBtn.waitFor({ state: 'visible', timeout: 30000 });
  await critiqueBtn.click();
  
  await page.waitForSelector('text=Script Critique', { timeout: 10000 });
  await page.screenshot({ path: 'critique-ui-refinement.png' });
});
