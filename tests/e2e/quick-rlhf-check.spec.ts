/**
 * Quick diagnostic test to see what tabs are actually present
 */

import { test, expect } from '../fixtures/base-test';

test('Diagnostic: Count tabs in Curate panel', async ({ page }) => {
  // Navigate
  await page.goto('http://localhost:3000');
  await page.waitForLoadState('networkidle');
  
  // Click Curate tab
  const curateTab = page.locator('button:has-text("Curate")').first();
  await curateTab.waitFor({ state: 'visible', timeout: 10000 });
  await curateTab.click();
  
  // Wait for content
  await page.waitForSelector('text=Knowledge Curation', { timeout: 10000 });
  await page.waitForTimeout(2000); // Give it time to render
  
  // Count ALL tabs
  const allTabs = await page.locator('button[role="tab"]').all();
  console.log(`\n📊 FOUND ${allTabs.length} TABS:`);
  
  for (let i = 0; i < allTabs.length; i++) {
    const text = await allTabs[i].textContent();
    console.log(`   ${i + 1}. "${text}"`);
  }
  
  // Check specifically for RLHF
  const rlhfTab = page.locator('button[role="tab"]:has-text("RLHF")');
  const hasRLHF = await rlhfTab.isVisible().catch(() => false);
  
  console.log(`\n🔍 RLHF tab visible: ${hasRLHF}`);
  
  if (hasRLHF) {
    console.log('✅ SUCCESS: RLHF tab is present!');
  } else {
    console.log('❌ FAIL: RLHF tab not found');
  }
  
  // Take screenshot
  await page.screenshot({ path: 'test-results/curate-tabs-screenshot.png', fullPage: true });
  console.log('\n📸 Screenshot saved to: test-results/curate-tabs-screenshot.png');
});

