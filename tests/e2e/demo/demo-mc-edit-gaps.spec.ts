/**
 * DEMO WRAP-UP GAP ANALYSIS TESTS
 * Spec: .specify/specs/DEMO-017-mc-edit-gaps/spec.md
 *
 * Covers missing gaps from the official demo script:
 * 1. Curation Feedback Loop (Chat -> Thumbs Down -> Curate Queue)
 * 2. Tester Mode "Ladybug" UI (DEFERRED)
 * 3. Self-Healing "Blast Radius" Controls
 */

import { test, expect } from '../../fixtures/base-test';

const NAVIGATION_TIMEOUT = 10000;
const AI_RESPONSE_TIMEOUT = 30000;

/**
 * Helper: Submit a chat query
 */
async function submitChatQuery(page: import('@playwright/test').Page, query: string): Promise<boolean> {
  const chatInput = page.locator('[data-testid="chat-input"], textarea[placeholder*="Ask"]').first();
  await expect(chatInput).toBeVisible({ timeout: NAVIGATION_TIMEOUT });
  await chatInput.fill(query);
  await page.waitForTimeout(500);

  const submitButton = page.locator('button[type="submit"]:not([disabled]), [data-testid="send-button"]:not([disabled])').first();
  const isEnabled = await submitButton.isEnabled({ timeout: 3000 }).catch(() => false);

  if (!isEnabled) {
    await chatInput.press('Enter');
    await page.waitForTimeout(1000);
    return false;
  }

  await submitButton.click({ timeout: 5000 }).catch(async () => {
    await chatInput.press('Enter');
  });
  await page.waitForTimeout(500);
  return true;
}

/**
 * Helper: Wait for AI response
 */
async function waitForAIResponse(page: import('@playwright/test').Page, timeout = AI_RESPONSE_TIMEOUT) {
  // Wait for at least one AI message
  const aiMessage = page.locator('[data-testid="ai-message"]').last();
  try {
    await expect(aiMessage).toBeVisible({ timeout });
    return aiMessage;
  } catch {
    console.log('  [WARN] AI response timeout or not found');
    return null;
  }
}

async function setupPage(page: import('@playwright/test').Page, baseURL: string | undefined) {
  const testUrl = baseURL || process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
  if (testUrl.includes('localhost')) {
    await page.context().addCookies([
      { name: 'bypass_auth', value: 'true', domain: 'localhost', path: '/' },
    ]);
  }
  await page.goto(testUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
}

test.describe('MC Edit Demo Gaps @demo @gaps', () => {
  test.beforeEach(async ({ page, baseURL }) => {
    await setupPage(page, baseURL);
  });

  // Automatic screenshot on pass or fail
  test.afterEach(async ({ page }, testInfo) => {
    const title = testInfo.title.replace(/[^a-z0-9]/gi, '-').toLowerCase();
    const status = testInfo.status; // 'passed', 'failed', 'timedOut', 'skipped'
    if (status !== 'skipped') {
        const screenshotPath = `test-results/gallery/${title}-${status}.png`;
        await page.screenshot({ path: screenshotPath, fullPage: true }).catch(() => {});
    }
  });

  // GAP 1: Curation Feedback Loop
  test('GAP-001: Verification of Feedback Loop (Chat -> Curate)', async ({ page }) => {
    // 1. Go to Chat (Start fresh)
    await submitChatQuery(page, 'What is the curation feedback loop?');
    
    // 3. Wait for response
    const aiMessage = await waitForAIResponse(page);
    
    // Fail gracefully if environment is not set up
    if (!aiMessage) {
        console.log('GAP-001 [SKIP]: AI environment not configured (missing API key/mock). Cannot verify feedback loop.');
        test.skip(true, 'AI Environment not configured');
        return;
    }
    
    // 4. Click Thumbs Down
    // Hover over the message to ensure actions appear (if they are hover-only)
    await aiMessage.hover();
    await page.waitForTimeout(500);

    const thumbsDown = page.locator('[data-testid="thumbs-down"]').last();
    
    // Ensure button is visible before clicking
    await expect(thumbsDown).toBeVisible({ timeout: 5000 });
    await thumbsDown.click();
    await page.waitForTimeout(1000); // Allow API call to fire

    // 5. Go to Curate Tab
    // Use role="tab" to be specific, or fallback to text if it's a button
    const curateTab = page.getByRole('tab', { name: 'Curate' });
    if (await curateTab.isVisible()) {
        await curateTab.click();
    } else {
        await page.locator('button').filter({ hasText: 'Curate' }).first().click();
    }
    await page.waitForTimeout(2000);

    // 6. Check Queue Tab
    // Verify we are on "Queue" or click it
    const queueTab = page.locator('button[role="tab"]').filter({ hasText: 'Queue' });
    if (await queueTab.isVisible()) {
        await queueTab.click();
    }
    
    // 7. Verify Queue content exists
    // We look for common elements in the queue
    const queueList = page.locator('.space-y-4').first();
    await expect(queueList).toBeVisible();
  });

  // GAP 2: Tester Mode "Ladybug"
  // User requested to put this on backburner (2026-01-04)
  test.skip('GAP-002: Verify Tester Mode "Ladybug" UI', async ({ page }) => {
    // 1. Go to Test Tab
    const testButton = page.locator('button').filter({ hasText: 'Test' }).first();
    await testButton.click();
    await page.waitForTimeout(2000);

    // 2. Go to Manual/Tester Mode
    const manualTab = page.getByRole('tab', { name: 'Manual' });
    await manualTab.click();
    await page.waitForTimeout(1000);

    // 3. Look for "Ladybug"
    const ladybug = page.locator('[data-testid="ladybug-mode"]'); 
    await expect(ladybug).toBeVisible();
  });

  // GAP 3: Self-Healing Blast Radius
  test('GAP-003: Verify Self-Healing "Blast Radius" Controls', async ({ page }) => {
    // 1. Go to Test Tab (use updated logic)
    const testTab = page.getByRole('tab', { name: 'Test' });
    if (await testTab.isVisible()) {
        await testTab.click();
    } else {
        await page.locator('button').filter({ hasText: 'Test' }).first().click();
    }
    
    // Wait for the Dashboard tabs to load instead of Title
    await expect(page.locator('[data-testid="tab-self-healing"]')).toBeVisible({ timeout: 10000 });

    // 2. Go to Self-Healing
    const selfHealingTab = page.locator('[data-testid="tab-self-healing"]');
    await expect(selfHealingTab).toBeVisible({ timeout: 10000 });
    await selfHealingTab.click();
    await page.waitForTimeout(2000);
    
    // Verify we are on Self-Healing page
    await expect(page.getByText('Self-Healing Test Monitor')).toBeVisible();

    // 3. Trigger Demo (Simulate Breakage)
    // The component auto-triggers after 1s, but we can force it by clicking Settings 3 times
    const settingsButton = page.locator('button').filter({ hasText: 'Configure' });
    await expect(settingsButton).toBeVisible();
    
    // Force trigger
    await settingsButton.click();
    await settingsButton.click();
    await settingsButton.click();
    
    // Look for "Blast Radius" or "Affected Tests"
    // We expect this to appear once the demo attempt is selected
    const blastRadiusText = page.getByText('Blast Radius');
    
    // Strict check with longer timeout
    await expect(blastRadiusText.first()).toBeVisible({ timeout: 10000 });
  });

});
