import { test, expect } from '../fixtures/base-test';

/**
 * RLHF MAC Design System Compliance Test
 *
 * Verifies that the RLHF tabs and components adhere to the MAC Design System standards:
 * - Uses CSS variables (var(--mac-...)) for colors instead of hard-coded hex/tailwind classes
 * - Correct background and text colors for dark mode compatibility
 * - Proper component styling (StatCard, MetricCard, Badges)
 */

test.describe('RLHF Tab - MAC Design System Compliance', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 45000 });

    // Navigate to Curate tab
    const curateButton = page.locator('button', { hasText: 'Curate' }).first();
    await expect(curateButton).toBeVisible({ timeout: 15000 });
    await curateButton.click();

    // Wait for CurateTab to load
    await expect(page.locator('[role="tablist"]').first()).toBeVisible({ timeout: 15000 });

    // Click on RLHF tab
    const rlhfTab = page.locator('[role="tab"]:has-text("RLHF")').first();
    if (await rlhfTab.isVisible({ timeout: 5000 }).catch(() => false)) {
        await rlhfTab.click();
    } else {
        console.log('RLHF tab not found - permissions might be missing or tab name changed');
        // If "RLHF" isn't found, try "HITL" or check if we are in "Files" and need to switch
        const hitlTab = page.locator('[role="tab"]:has-text("HITL")').first();
        if (await hitlTab.isVisible()) {
            await hitlTab.click();
        }
    }
    
    // Wait for RLHF content
    await page.waitForTimeout(1000); 
  });

  test('Feedback tab StatCards should use MAC variables', async ({ page }) => {
    // Ensure we are on the Feedback sub-tab
    const feedbackSubTab = page.locator('button:has-text("Feedback")').first();
    if (await feedbackSubTab.isVisible()) {
        await feedbackSubTab.click();
    }

    // Check StatCards in the top bar
    const statCards = page.locator('.mac-card .text-2xl.font-light');
    await expect(statCards.first()).toBeVisible();

    // Evaluate the computed style or class names to ensure no hard-coded Tailwind colors
    // We expect classes like "text-[var(--mac-primary-blue-400)]" or similar usage via cn()
    
    // Check Pending card (yellow)
    const pendingValue = page.locator('div:has-text("Pending") + p');
    if (await pendingValue.isVisible()) {
        const classAttribute = await pendingValue.getAttribute('class');
        expect(classAttribute).toContain('var(--mac-warning-yellow)');
    }

    // Check Submitted card (green/connected)
    const submittedValue = page.locator('div:has-text("Submitted") + p');
    if (await submittedValue.isVisible()) {
        const classAttribute = await submittedValue.getAttribute('class');
        expect(classAttribute).toContain('var(--mac-status-connected)');
    }
  });

  test('Learning Curve MetricCards should use MAC variables', async ({ page }) => {
    // Navigate to Learning Curve sub-tab
    const learningCurveTab = page.locator('button:has-text("Learning Curve")').first();
    await learningCurveTab.click();
    await page.waitForTimeout(500);

    // Check MetricCards
    const metricCards = page.locator('.mac-card .mac-title');
    await expect(metricCards.first()).toBeVisible();

    // Verify Avg Accuracy card uses primary blue
    const accuracyValue = page.locator('p:has-text("Avg Accuracy") + div h4');
    if (await accuracyValue.isVisible()) {
        const classAttribute = await accuracyValue.getAttribute('class');
        expect(classAttribute).toContain('text-[var(--mac-text-primary)]');
    }
    
    // Verify icon container uses surface elevated
    const iconContainer = page.locator('.p-2.rounded-lg.bg-\[var\(--mac-surface-elevated\)\]').first();
    // Use a looser check if the selector is too specific due to dynamic classes
    const anyIconContainer = page.locator('.mac-card .p-2.rounded-lg').first();
    const bgClass = await anyIconContainer.getAttribute('class');
    expect(bgClass).toContain('bg-[var(--mac-surface-elevated)]');
  });

  test('Quick Feedback buttons should use MAC status variables', async ({ page }) => {
    // Ensure we are on the Feedback sub-tab
    const feedbackSubTab = page.locator('button:has-text("Feedback")').first();
    if (await feedbackSubTab.isVisible()) {
        await feedbackSubTab.click();
    }

    // Check for a feedback item (mock data should be present)
    const feedbackItem = page.locator('.mac-card-elevated').first();
    await expect(feedbackItem).toBeVisible({ timeout: 10000 });

    // Expand if needed or check existing visible buttons
    // Look for "Helpful" button
    const helpfulBtn = page.locator('button:has-text("Helpful")').first();
    if (await helpfulBtn.isVisible()) {
        const classAttribute = await helpfulBtn.getAttribute('class');
        // Should contain hover:bg-[var(--mac-status-connected)]/10 or similar
        expect(classAttribute).toContain('var(--mac-status-connected)');
        expect(classAttribute).not.toContain('bg-green-400'); // No hardcoded green
    }

    // Look for "Not Helpful" button
    const notHelpfulBtn = page.locator('button:has-text("Not Helpful")').first();
    if (await notHelpfulBtn.isVisible()) {
        const classAttribute = await notHelpfulBtn.getAttribute('class');
        expect(classAttribute).toContain('var(--mac-status-error-text)');
        expect(classAttribute).not.toContain('bg-red-400'); // No hardcoded red
    }
  });

  test('Sub-tabs should use MAC variables for active state', async ({ page }) => {
    // Check the sub-tab triggers
    const feedbackTab = page.locator('button:has-text("Feedback")').first();
    
    // Click it to make it active
    await feedbackTab.click();
    
    // Check styling
    const classAttribute = await feedbackTab.getAttribute('class');
    expect(classAttribute).toContain('bg-[var(--mac-primary-blue-400)]/10');
    expect(classAttribute).toContain('text-[var(--mac-primary-blue-400)]');
    expect(classAttribute).toContain('border-[var(--mac-primary-blue-400)]');
  });
});
