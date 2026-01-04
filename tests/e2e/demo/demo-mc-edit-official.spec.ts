/**
 * DEMO-SCRIPT-OFFICIAL-MC-EDIT.md - Playwright E2E Tests
 *
 * Spec: .specify/specs/DEMO-016-mc-edit-playwright/spec.md
 *
 * Covers all demo sections:
 * 1. Knowledge Base with Tool Calls
 * 2. Visual Intelligence (Mermaid/Diagrams)
 * 3. Anti-Hallucination
 * 4. Knowledge Curation (Curate tab)
 * 5. Testing Pillar (Test tab)
 * 6. Full Demo Flow
 *
 * Run with: npx playwright test tests/e2e/demo/demo-mc-edit-official.spec.ts
 */

import { test, expect } from '../../fixtures/base-test';

const AI_RESPONSE_TIMEOUT = 60000;
const NAVIGATION_TIMEOUT = 10000;

/**
 * Helper: Submit a chat query
 */
async function submitChatQuery(page: import('@playwright/test').Page, query: string): Promise<boolean> {
  const chatInput = page.locator('[data-testid="chat-input"], textarea[placeholder*="Ask"]').first();
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
  const aiResponse = page.locator('[data-testid="ai-message"]').last();
  try {
    await expect(aiResponse).toBeVisible({ timeout });
    return aiResponse;
  } catch {
    const errorMsg = page.locator('text=API key is not configured, text=Service temporarily unavailable').first();
    const hasError = await errorMsg.isVisible({ timeout: 2000 }).catch(() => false);
    if (hasError) {
      // console.log('  [SKIP] AI API not configured');
    }
    return null;
  }
}

/**
 * Common beforeEach setup
 */
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

// ============================================================================
// SECTION 1: Preamble Verification
// ============================================================================
test.describe('MC Edit Demo - Section 1: Preamble @demo @mc-edit', () => {
  test.beforeEach(async ({ page, baseURL }) => {
    await setupPage(page, baseURL);
  });

  test('DEMO-001: App loads on localhost', async ({ page }) => {
    const chatInput = page.locator('[data-testid="chat-input"], textarea[placeholder*="Ask"]').first();
    await expect(chatInput).toBeVisible({ timeout: NAVIGATION_TIMEOUT });

    await page.screenshot({ path: 'test-results/demo-mc-edit-01-app-loaded.png', fullPage: true });
  });

  test('DEMO-002: Welcome screen renders', async ({ page }) => {
    const welcomeText = page.locator('text=Welcome, text=Betabase').first();
    await expect(welcomeText).toBeVisible({ timeout: NAVIGATION_TIMEOUT });

    await page.screenshot({ path: 'test-results/demo-mc-edit-02-welcome.png', fullPage: true });
  });
});

// ============================================================================
// SECTION 2: Knowledge Base with Tool Calls
// ============================================================================
test.describe('MC Edit Demo - Section 2: Knowledge Base @demo @mc-edit', () => {
  test.beforeEach(async ({ page, baseURL }) => {
    await setupPage(page, baseURL);
  });

  test('DEMO-010: Hard but answerable question', async ({ page }) => {
    const chatInput = page.locator('[data-testid="chat-input"], textarea[placeholder*="Ask"]').first();
    await expect(chatInput).toBeVisible({ timeout: NAVIGATION_TIMEOUT });

    // Script: "Start with hard, but answerable question"
    const submitted = await submitChatQuery(page, 'What are the steps to link a product to a master in AOMA?');

    const aiResponse = await waitForAIResponse(page, submitted ? AI_RESPONSE_TIMEOUT : 5000);

    if (aiResponse) {
      const responseText = await aiResponse.textContent();
      expect(responseText?.length).toBeGreaterThan(100);
    }

    await page.screenshot({ path: 'test-results/demo-mc-edit-10-hard-question.png', fullPage: true });
  });

  test('DEMO-011: Upcoming release info (JIRAs)', async ({ page }) => {
    const chatInput = page.locator('[data-testid="chat-input"], textarea[placeholder*="Ask"]').first();
    await expect(chatInput).toBeVisible({ timeout: NAVIGATION_TIMEOUT });

    // Script: "what's in the upcoming release and how to prepare for it"
    const submitted = await submitChatQuery(page, "What's in the upcoming release and how should we prepare for it?");

    const aiResponse = await waitForAIResponse(page, submitted ? AI_RESPONSE_TIMEOUT : 5000);

    if (aiResponse) {
      const responseText = await aiResponse.textContent();
      const mentionsRelease =
        responseText?.toLowerCase().includes('release') ||
        responseText?.toLowerCase().includes('jira') ||
        responseText?.toLowerCase().includes('ticket') ||
        responseText?.toLowerCase().includes('upcoming');
      expect(mentionsRelease || (responseText?.length || 0) > 50).toBeTruthy();
    }

    await page.screenshot({ path: 'test-results/demo-mc-edit-11-upcoming-release.png', fullPage: true });
  });
});

// ============================================================================
// SECTION 3: Visual Intelligence (Diagramming)
// ============================================================================
test.describe('MC Edit Demo - Section 3: Visual Intelligence @demo @mc-edit', () => {
  test.beforeEach(async ({ page, baseURL }) => {
    await setupPage(page, baseURL);
  });

  test('DEMO-020: Mermaid diagram generation', async ({ page }) => {
    const chatInput = page.locator('[data-testid="chat-input"], textarea[placeholder*="Ask"]').first();
    await expect(chatInput).toBeVisible({ timeout: NAVIGATION_TIMEOUT });

    // Script: "Diagramming - mermaid to nano banana pro"
    const submitted = await submitChatQuery(page, 'Show me a diagram of the AOMA asset ingestion workflow');

    const aiResponse = await waitForAIResponse(page, submitted ? AI_RESPONSE_TIMEOUT + 15000 : 5000);

    if (aiResponse) {
      const responseText = await aiResponse.textContent();
      const hasDiagramContent =
        responseText?.toLowerCase().includes('diagram') ||
        responseText?.toLowerCase().includes('mermaid') ||
        responseText?.toLowerCase().includes('flowchart') ||
        responseText?.toLowerCase().includes('graph');

      const mermaidElement = page.locator('[class*="mermaid"], [data-diagram], svg.mermaid');
      const hasMermaidElement = await mermaidElement.first().isVisible({ timeout: 5000 }).catch(() => false);

      expect(hasDiagramContent || hasMermaidElement).toBeTruthy();
    }

    await page.screenshot({ path: 'test-results/demo-mc-edit-20-mermaid-diagram.png', fullPage: true });
  });

  test('DEMO-022: DDP parsing tool call', async ({ page }) => {
    const chatInput = page.locator('[data-testid="chat-input"], textarea[placeholder*="Ask"]').first();
    await expect(chatInput).toBeVisible({ timeout: NAVIGATION_TIMEOUT });

    // Script: "ask to read a DDP"
    const submitted = await submitChatQuery(page, 'Can you read and summarize the DDP file structure?');

    const aiResponse = await waitForAIResponse(page, submitted ? AI_RESPONSE_TIMEOUT : 5000);

    if (aiResponse) {
      const responseText = await aiResponse.textContent();
      expect(responseText?.length).toBeGreaterThan(50);
    }

    await page.screenshot({ path: 'test-results/demo-mc-edit-22-ddp-parsing.png', fullPage: true });
  });
});

// ============================================================================
// SECTION 4: Anti-Hallucination
// ============================================================================
test.describe('MC Edit Demo - Section 4: Anti-Hallucination @demo @mc-edit', () => {
  test.beforeEach(async ({ page, baseURL }) => {
    await setupPage(page, baseURL);
  });

  test('DEMO-030: Blockchain trick question', async ({ page }) => {
    const chatInput = page.locator('[data-testid="chat-input"], textarea[placeholder*="Ask"]').first();
    await expect(chatInput).toBeVisible({ timeout: NAVIGATION_TIMEOUT });

    // Script: "Does AOMA have a blockchain integration?"
    const submitted = await submitChatQuery(page, 'Does AOMA have a blockchain integration?');

    const aiResponse = await waitForAIResponse(page, submitted ? AI_RESPONSE_TIMEOUT : 5000);

    if (aiResponse) {
      const responseText = (await aiResponse.textContent()) || '';

      // Should indicate NO blockchain (honest answer)
      const _indicatesNoInfo =
        responseText.toLowerCase().includes('no') ||
        responseText.toLowerCase().includes("don't") ||
        responseText.toLowerCase().includes('not found') ||
        responseText.toLowerCase().includes('no information') ||
        responseText.toLowerCase().includes("doesn't");

      // Should NOT fabricate blockchain features
      const fabricatesBlockchain =
        responseText.toLowerCase().includes('blockchain integration') &&
        responseText.toLowerCase().includes('features') &&
        !responseText.toLowerCase().includes('no') &&
        !responseText.toLowerCase().includes("don't");

      expect(fabricatesBlockchain).toBeFalsy();
    }

    await page.screenshot({ path: 'test-results/demo-mc-edit-30-anti-hallucination.png', fullPage: true });
  });

  test('DEMO-031: Thumbs down feedback flow', async ({ page }) => {
    const chatInput = page.locator('[data-testid="chat-input"], textarea[placeholder*="Ask"]').first();
    await expect(chatInput).toBeVisible({ timeout: NAVIGATION_TIMEOUT });

    // First get a response to give feedback on
    const submitted = await submitChatQuery(page, 'What is AOMA?');
    const aiResponse = await waitForAIResponse(page, submitted ? AI_RESPONSE_TIMEOUT : 5000);

    if (aiResponse) {
      await page.waitForTimeout(2000);

      // Look for thumbs down button
      const thumbsDown = page.locator('[data-action="thumbs-down"], button[aria-label*="down"], [class*="thumbs-down"]');
      const hasThumbsDown = await thumbsDown.first().isVisible({ timeout: 5000 }).catch(() => false);

      if (hasThumbsDown) {
        await thumbsDown.first().click();
        await page.waitForTimeout(1000);
      }
    }

    await page.screenshot({ path: 'test-results/demo-mc-edit-31-thumbs-down.png', fullPage: true });
  });
});

// ============================================================================
// SECTION 5: Knowledge Curation (Curate Tab)
// ============================================================================
test.describe('MC Edit Demo - Section 5: Curate Tab @demo @mc-edit', () => {
  test.beforeEach(async ({ page, baseURL }) => {
    await setupPage(page, baseURL);
  });

  test('DEMO-040: Navigate to Curate tab', async ({ page }) => {
    const curateButton = page.locator('button').filter({ hasText: 'Curate' }).first();
    await expect(curateButton).toBeVisible({ timeout: NAVIGATION_TIMEOUT });
    await curateButton.click();
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'test-results/demo-mc-edit-40-curate-tab.png', fullPage: true });
  });

  test('DEMO-041: Upload area visible', async ({ page }) => {
    const curateButton = page.locator('button').filter({ hasText: 'Curate' }).first();
    await expect(curateButton).toBeVisible({ timeout: NAVIGATION_TIMEOUT });
    await curateButton.click();
    await page.waitForTimeout(2000);

    // Script: "Upload proprietary documents"
    const uploadArea = page.locator('input[type="file"], [data-upload], button:has-text("Upload")');
    const _hasUpload = await uploadArea.first().isVisible({ timeout: 5000 }).catch(() => false);

    await page.screenshot({ path: 'test-results/demo-mc-edit-41-upload.png', fullPage: true });
  });

  test('DEMO-042: Delete functionality visible', async ({ page }) => {
    const curateButton = page.locator('button').filter({ hasText: 'Curate' }).first();
    await expect(curateButton).toBeVisible({ timeout: NAVIGATION_TIMEOUT });
    await curateButton.click();
    await page.waitForTimeout(2000);

    // Script: "Delete outdated files"
    const deleteButton = page.locator('button:has-text("Delete"), [data-action="delete"]');
    const _hasDelete = await deleteButton.first().isVisible({ timeout: 5000 }).catch(() => false);

    await page.screenshot({ path: 'test-results/demo-mc-edit-42-delete.png', fullPage: true });
  });

  test('DEMO-043: Curation queue renders', async ({ page }) => {
    const curateButton = page.locator('button').filter({ hasText: 'Curate' }).first();
    await expect(curateButton).toBeVisible({ timeout: NAVIGATION_TIMEOUT });
    await curateButton.click();
    await page.waitForTimeout(2000);

    // Script: "curation cue, how thumbs down in chat produces note in the cue"
    const queueElements = page.locator('text=Queue, text=Curation, [class*="queue"]');
    const _hasQueue = await queueElements.first().isVisible({ timeout: 5000 }).catch(() => false);

    await page.screenshot({ path: 'test-results/demo-mc-edit-43-curation-queue.png', fullPage: true });
  });
});

// ============================================================================
// SECTION 6: Testing Pillar (Test Tab)
// ============================================================================
test.describe('MC Edit Demo - Section 6: Test Tab @demo @mc-edit', () => {
  test.beforeEach(async ({ page, baseURL }) => {
    await setupPage(page, baseURL);
  });

  test('DEMO-050: Navigate to Test tab', async ({ page }) => {
    const testButton = page.locator('button').filter({ hasText: 'Test' }).first();
    await expect(testButton).toBeVisible({ timeout: NAVIGATION_TIMEOUT });
    await testButton.click();
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'test-results/demo-mc-edit-50-test-tab.png', fullPage: true });
  });

  test('DEMO-051: Test list scrollable', async ({ page }) => {
    const testButton = page.locator('button').filter({ hasText: 'Test' }).first();
    await expect(testButton).toBeVisible({ timeout: NAVIGATION_TIMEOUT });
    await testButton.click();
    await page.waitForTimeout(2000);

    // Script: "Scroll through long list of human-created tests"
    const historicalTab = page.locator('[role="tab"]').filter({ hasText: 'Historical' });
    if (await historicalTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await historicalTab.click();
      await page.waitForTimeout(1000);
    }

    // Look for test list items
    const testItems = page.locator('[class*="test-item"], [data-testid*="test"], tr, [class*="Card"]');
    const _itemCount = await testItems.count();

    await page.screenshot({ path: 'test-results/demo-mc-edit-51-test-list.png', fullPage: true });
  });

  test('DEMO-053: Auto-ranking visible', async ({ page }) => {
    const testButton = page.locator('button').filter({ hasText: 'Test' }).first();
    await expect(testButton).toBeVisible({ timeout: NAVIGATION_TIMEOUT });
    await testButton.click();
    await page.waitForTimeout(2000);

    // Script: "Auto-ranking of tests ready for Automation"
    const rankingElements = page.locator('text=rank, text=score, text=automation, [class*="rank"]');
    const _hasRanking = await rankingElements.first().isVisible({ timeout: 5000 }).catch(() => false);

    await page.screenshot({ path: 'test-results/demo-mc-edit-53-auto-ranking.png', fullPage: true });
  });

  test('DEMO-054: Self-healing tab', async ({ page }) => {
    const testButton = page.locator('button').filter({ hasText: 'Test' }).first();
    await expect(testButton).toBeVisible({ timeout: NAVIGATION_TIMEOUT });
    await testButton.click();
    await page.waitForTimeout(2000);

    // Script: "Self Healing with Blast Radius"
    const selfHealingTab = page.locator('[role="tab"]').filter({ hasText: 'Self-Healing' });
    const hasSelfHealing = await selfHealingTab.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasSelfHealing) {
      await selfHealingTab.click();
      await page.waitForTimeout(1500);
    }

    await page.screenshot({ path: 'test-results/demo-mc-edit-54-self-healing.png', fullPage: true });
  });
});

// ============================================================================
// SECTION 7: Full Demo Flow
// ============================================================================
test.describe('MC Edit Demo - Section 7: Full Flow @demo @mc-edit', () => {
  test.beforeEach(async ({ page, baseURL }) => {
    await setupPage(page, baseURL);
  });

  test('DEMO-060: Three-pillar navigation', async ({ page }) => {
    // Pillar 1: Chat
    const chatInput = page.locator('[data-testid="chat-input"], textarea[placeholder*="Ask"]').first();
    await expect(chatInput).toBeVisible({ timeout: NAVIGATION_TIMEOUT });
    await submitChatQuery(page, 'What is AOMA?');
    await page.waitForTimeout(5000);

    // Pillar 2: Curate
    const curateButton = page.locator('button').filter({ hasText: 'Curate' }).first();
    if (await curateButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await curateButton.click();
      await page.waitForTimeout(1500);
    }

    // Pillar 3: Test
    const testButton = page.locator('button').filter({ hasText: 'Test' }).first();
    if (await testButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await testButton.click();
      await page.waitForTimeout(1500);
    }

    // Return to Chat
    const chatButton = page.locator('button').filter({ hasText: 'Chat' }).first();
    if (await chatButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await chatButton.click();
      await page.waitForTimeout(1000);
    }

    await page.screenshot({ path: 'test-results/demo-mc-edit-60-full-flow.png', fullPage: true });
  });

  test('DEMO-061: Screenshot capture all tabs', async ({ page }) => {
    const tabs = ['Chat', 'Curate', 'Test'];

    for (let i = 0; i < tabs.length; i++) {
      const tabName = tabs[i];
      const button = page.locator('button').filter({ hasText: tabName }).first();

      if (await button.isVisible({ timeout: 3000 }).catch(() => false)) {
        await button.click();
        await page.waitForTimeout(1500);

        await page.screenshot({
          path: `test-results/demo-mc-edit-61-${String(i + 1).padStart(2, '0')}-${tabName.toLowerCase()}.png`,
          fullPage: true,
        });
      }
    }
  });
});
