import { test, expect } from '@playwright/test';

test.describe('Curate Tab Comprehensive Overhaul', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to Curate tab
    await page.goto('http://localhost:3000/#curate');
    // Ensure auth bypass is active if needed
  });

  test('Overview tab displays executive KPI cards and charts', async ({ page }) => {
    await page.click('button[role="tab"]:has-text("Overview")');
    await expect(page.locator('text=KB Health')).toBeVisible();
    await expect(page.locator('text=Optimization')).toBeVisible();
    await expect(page.locator('text=Document Processing Velocity')).toBeVisible();
    await expect(page.locator('text=Category Health')).toBeVisible();
  });

  test('Deduplication tab shows duplicate groups and intelligence badges', async ({ page }) => {
    await page.click('button[role="tab"]:has-text("Dedupe")');
    await expect(page.locator('text=Deduplication Intelligence')).toBeVisible();
    await expect(page.locator('text=Tenant-Safe Isolation')).toBeVisible();
    
    // Check for mock groups in demo mode
    await expect(page.locator('text=Semantic Similarity')).toBeVisible();
    await expect(page.locator('text=Exact Hash Match')).toBeVisible();
  });

  test('RLHF sub-tabs are navigable and show correct content', async ({ page }) => {
    await page.click('button[role="tab"]:has-text("RLHF")');
    
    // Check Learning Curve sub-tab
    await page.click('button:has-text("Learning Curve")');
    await expect(page.locator('text=Quality Improvement Timeline')).toBeVisible();
    await expect(page.locator('text=Avg Accuracy')).toBeVisible();

    // Check Datasets sub-tab
    await page.click('button:has-text("Datasets")');
    await expect(page.locator('text=Training Datasets')).toBeVisible();

    // Check Model Registry sub-tab
    await page.click('button:has-text("Model Registry")');
    await expect(page.locator('text=Model Registry')).toBeVisible();
  });

  test('Insights tab shows agent decision path flowchart', async ({ page }) => {
    await page.click('button[role="tab"]:has-text("Insights")');
    await expect(page.locator('text=Agent Decision Path')).toBeVisible();
    await expect(page.locator('text=Reasoning Chains')).toBeVisible();
    await expect(page.locator('.mermaid-mock')).toBeVisible();
  });

  test('Feedback Impact card shows non-zero metrics', async ({ page }) => {
    await page.click('button[role="tab"]:has-text("Queue")');
    const corrections = await page.locator('text=Corrections').locator('..').locator('.text-2xl').textContent();
    expect(parseInt(corrections || '0')).toBeGreaterThan(0);
    
    await expect(page.locator('text=Recent Corrections')).toBeVisible();
    await expect(page.locator('text=tests')).toHaveCount(3); // Based on our mock populate
  });
});




