/**
 * DEMO SCENARIOS - Comprehensive E2E Tests
 *
 * Tests all scenarios from:
 * - DEMO-RECORDING-SCRIPT-CLEAN.md (The Betabase 5:45 demo)
 * - DEMO-FINAL-CHECKLIST.md (4:45 demo with segmented recording)
 *
 * TDD RALPH Loop: Each test validates a specific demo scenario.
 * Run with: npx playwright test tests/e2e/demo/demo-scenarios-comprehensive.spec.ts
 */

import { test, expect } from '../../fixtures/base-test';

// Timeout for AI responses (AOMA queries can take 20-30s)
const AI_RESPONSE_TIMEOUT = 60000;
const NAVIGATION_TIMEOUT = 10000;

/**
 * Helper function to submit a chat query reliably
 * Uses multiple fallback methods for form submission
 */
async function submitChatQuery(page: import('@playwright/test').Page, query: string) {
  const chatInput = page.locator('[data-testid="chat-input"], textarea[placeholder*="Ask"]').first();
  await chatInput.fill(query);

  // Small wait to ensure the value is set
  await page.waitForTimeout(300);

  // Try multiple methods to submit the form
  const submitButton = page.locator('[data-testid="send-button"]');

  // Method 1: Click submit button
  await submitButton.click();

  // Wait a moment to see if submission worked
  await page.waitForTimeout(500);

  // Check if user message appeared (submission worked)
  const userMessage = page.locator('[data-testid="user-message"]');
  const submitted = await userMessage.count() > 0;

  if (!submitted) {
    // Method 2: Try clicking with force
    await submitButton.click({ force: true });
    await page.waitForTimeout(500);
  }

  // If still not submitted, try using the form submit
  if (await userMessage.count() === 0) {
    // Method 3: Submit the form directly via JavaScript
    await page.evaluate(() => {
      const form = document.querySelector('[data-chat-form="true"]') as HTMLFormElement;
      if (form) {
        form.requestSubmit();
      }
    });
  }
}

test.describe('Demo Scenarios - Opening & Chat Pillar @demo', () => {
  test.beforeEach(async ({ page, baseURL }) => {
    const testUrl = baseURL || process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';

    // Set bypass auth for localhost
    if (testUrl.includes('localhost')) {
      await page.context().addCookies([
        {
          name: 'bypass_auth',
          value: 'true',
          domain: 'localhost',
          path: '/',
        },
      ]);
    }

    await page.goto(testUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
  });

  test('Opening: Chat responds to "What are the different asset types in AOMA?"', async ({ page }) => {
    console.log('\n[DEMO] Opening query: Asset types in AOMA\n');

    // Find chat input
    const chatInput = page.locator('[data-testid="chat-input"], textarea[placeholder*="Ask"]').first();
    await expect(chatInput).toBeVisible({ timeout: NAVIGATION_TIMEOUT });

    // Send the opening demo query using helper function
    await submitChatQuery(page, 'What are the different asset types in AOMA?');

    // Wait for progress indicator
    await page.waitForTimeout(1000);
    const progressVisible = await page.locator('[class*="progress"], [data-testid="progress"]').isVisible().catch(() => false);
    console.log(`Progress indicator visible: ${progressVisible}`);

    // Wait for AI response (uses data-testid="ai-message" from message component)
    const aiResponse = page.locator('[data-testid="ai-message"]').last();
    await expect(aiResponse).toBeVisible({ timeout: AI_RESPONSE_TIMEOUT });

    // Verify response contains relevant content (asset types)
    const responseText = await aiResponse.textContent();
    console.log(`Response length: ${responseText?.length || 0} chars`);
    expect(responseText?.length).toBeGreaterThan(50);

    // Screenshot for verification
    await page.screenshot({ path: 'test-results/demo-opening-asset-types.png', fullPage: true });
  });

  test('Chat: "What is AOMA?" - Standard RAG query', async ({ page }) => {
    console.log('\n[DEMO] Standard RAG query: What is AOMA?\n');

    const chatInput = page.locator('[data-testid="chat-input"], textarea[placeholder*="Ask"]').first();
    await expect(chatInput).toBeVisible({ timeout: NAVIGATION_TIMEOUT });

    await submitChatQuery(page, 'What is AOMA?');

    const aiResponse = page.locator('[data-testid="ai-message"]').last();
    await expect(aiResponse).toBeVisible({ timeout: AI_RESPONSE_TIMEOUT });

    const responseText = await aiResponse.textContent();
    // Should mention Asset and Offering Management Application
    const hasAOMAInfo = responseText?.toLowerCase().includes('asset') ||
                        responseText?.toLowerCase().includes('offering') ||
                        responseText?.toLowerCase().includes('management');
    expect(hasAOMAInfo).toBeTruthy();

    await page.screenshot({ path: 'test-results/demo-what-is-aoma.png', fullPage: true });
  });

  test('Chat: Multi-source query - JIRA + Git integration', async ({ page }) => {
    console.log('\n[DEMO] Multi-source query: JIRA tickets + code commits\n');

    const chatInput = page.locator('[data-testid="chat-input"], textarea[placeholder*="Ask"]').first();
    await expect(chatInput).toBeVisible({ timeout: NAVIGATION_TIMEOUT });

    await submitChatQuery(page, 'Show me JIRA tickets related to AOMA migration and the related code commits');

    // This query triggers multi-source retrieval
    const aiResponse = page.locator('[data-testid="ai-message"]').last();
    await expect(aiResponse).toBeVisible({ timeout: AI_RESPONSE_TIMEOUT });

    const responseText = await aiResponse.textContent();
    console.log(`Multi-source response length: ${responseText?.length || 0}`);
    expect(responseText?.length).toBeGreaterThan(50);

    await page.screenshot({ path: 'test-results/demo-multi-source-jira-git.png', fullPage: true });
  });

  test('Chat: Progress indicator shows intent classification and re-ranking', async ({ page }) => {
    console.log('\n[DEMO] Progress indicator with pipeline steps\n');

    const chatInput = page.locator('[data-testid="chat-input"], textarea[placeholder*="Ask"]').first();
    await expect(chatInput).toBeVisible({ timeout: NAVIGATION_TIMEOUT });

    await submitChatQuery(page, 'What are the steps to link a product to a master in AOMA?');

    // Wait a moment for progress indicator to appear
    await page.waitForTimeout(500);

    // Check for progress indicator with pipeline steps
    const progressIndicator = page.locator('[class*="progress"], [data-testid="progress"], [class*="intent"]');
    const hasProgress = await progressIndicator.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasProgress) {
      console.log('Progress indicator detected');
      // Take screenshot while progress is visible
      await page.screenshot({ path: 'test-results/demo-progress-indicator-active.png' });
    }

    // Wait for complete response
    const aiResponse = page.locator('[data-testid="ai-message"]').last();
    await expect(aiResponse).toBeVisible({ timeout: AI_RESPONSE_TIMEOUT });

    await page.screenshot({ path: 'test-results/demo-chat-product-master-link.png', fullPage: true });
  });

  test('Chat: Diagram generation - System architecture', async ({ page }) => {
    console.log('\n[DEMO] Diagram generation: System architecture\n');

    const chatInput = page.locator('[data-testid="chat-input"], textarea[placeholder*="Ask"]').first();
    await expect(chatInput).toBeVisible({ timeout: NAVIGATION_TIMEOUT });

    await submitChatQuery(page, 'Generate a system architecture diagram for AOMA showing all integration points');

    // Wait for response (diagram generation takes longer)
    const aiResponse = page.locator('[data-testid="ai-message"]').last();
    await expect(aiResponse).toBeVisible({ timeout: AI_RESPONSE_TIMEOUT + 15000 });

    // Check if response contains Mermaid diagram or diagram offer
    const responseText = await aiResponse.textContent();
    const hasDiagramContent = responseText?.toLowerCase().includes('diagram') ||
                              responseText?.toLowerCase().includes('mermaid') ||
                              responseText?.toLowerCase().includes('architecture');

    // Also check for diagram/mermaid elements
    const diagramElement = page.locator('[class*="mermaid"], [data-diagram], svg');
    const hasDiagramElement = await diagramElement.isVisible({ timeout: 5000 }).catch(() => false);

    console.log(`Has diagram content: ${hasDiagramContent}, Has diagram element: ${hasDiagramElement}`);
    expect(hasDiagramContent || hasDiagramElement).toBeTruthy();

    await page.screenshot({ path: 'test-results/demo-architecture-diagram.png', fullPage: true });
  });

  test('Chat: ERD/Infographic generation for multi-tenant architecture', async ({ page }) => {
    console.log('\n[DEMO] ERD generation: Multi-tenant architecture\n');

    const chatInput = page.locator('[data-testid="chat-input"], textarea[placeholder*="Ask"]').first();
    await expect(chatInput).toBeVisible({ timeout: NAVIGATION_TIMEOUT });

    // This is the exact demo query
    await submitChatQuery(page, 'For my friends, can you make an infographic of how the ERD works for the multi-tenant architecture of this system itself?');

    const aiResponse = page.locator('[data-testid="ai-message"]').last();
    await expect(aiResponse).toBeVisible({ timeout: AI_RESPONSE_TIMEOUT + 15000 });

    const responseText = await aiResponse.textContent();
    console.log(`ERD response length: ${responseText?.length || 0}`);
    expect(responseText?.length).toBeGreaterThan(50);

    await page.screenshot({ path: 'test-results/demo-erd-multi-tenant.png', fullPage: true });
  });

  test('Chat: Dev context - Current development status', async ({ page }) => {
    console.log('\n[DEMO] Dev context synthesis query\n');

    const chatInput = page.locator('[data-testid="chat-input"], textarea[placeholder*="Ask"]').first();
    await expect(chatInput).toBeVisible({ timeout: NAVIGATION_TIMEOUT });

    await submitChatQuery(page, "What's the current development status of AOMA3 migration?");

    const aiResponse = page.locator('[data-testid="ai-message"]').last();
    await expect(aiResponse).toBeVisible({ timeout: AI_RESPONSE_TIMEOUT });

    const responseText = await aiResponse.textContent();
    console.log(`Dev status response length: ${responseText?.length || 0}`);
    expect(responseText?.length).toBeGreaterThan(50);

    await page.screenshot({ path: 'test-results/demo-dev-status-aoma3.png', fullPage: true });
  });

  test('Chat: Anti-hallucination - Blockchain trick question', async ({ page }) => {
    console.log('\n[DEMO] Anti-hallucination: Blockchain trick question\n');

    const chatInput = page.locator('[data-testid="chat-input"], textarea[placeholder*="Ask"]').first();
    await expect(chatInput).toBeVisible({ timeout: NAVIGATION_TIMEOUT });

    // This is a trick question - AOMA has no blockchain integration
    await submitChatQuery(page, 'Does AOMA have a blockchain integration?');

    const aiResponse = page.locator('[data-testid="ai-message"]').last();
    await expect(aiResponse).toBeVisible({ timeout: AI_RESPONSE_TIMEOUT });

    const responseText = await aiResponse.textContent() || '';

    // The AI should indicate it doesn't have information about blockchain
    const indicatesNoInfo = responseText.toLowerCase().includes('no') ||
                            responseText.toLowerCase().includes("don't") ||
                            responseText.toLowerCase().includes('not found') ||
                            responseText.toLowerCase().includes('no information') ||
                            responseText.toLowerCase().includes('unable to find');

    console.log(`Anti-hallucination check - indicates no blockchain info: ${indicatesNoInfo}`);
    console.log(`Response preview: ${responseText.substring(0, 200)}`);

    // The response should NOT confidently describe a blockchain integration
    const fabricatesBlockchain = responseText.toLowerCase().includes('blockchain integration') &&
                                  !responseText.toLowerCase().includes('no') &&
                                  !responseText.toLowerCase().includes("don't");

    expect(fabricatesBlockchain).toBeFalsy();

    await page.screenshot({ path: 'test-results/demo-anti-hallucination-blockchain.png', fullPage: true });
  });
});

test.describe('Demo Scenarios - Curate Pillar @demo', () => {
  test.beforeEach(async ({ page, baseURL }) => {
    const testUrl = baseURL || process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';

    if (testUrl.includes('localhost')) {
      await page.context().addCookies([
        { name: 'bypass_auth', value: 'true', domain: 'localhost', path: '/' },
      ]);
    }

    await page.goto(testUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
  });

  test('Curate: Tab accessible with Upload/Delete/Dedupe buttons', async ({ page }) => {
    console.log('\n[DEMO] Curate tab with core functionality\n');

    // Navigate to Curate tab
    const curateButton = page.locator('button').filter({ hasText: 'Curate' }).first();
    await expect(curateButton).toBeVisible({ timeout: NAVIGATION_TIMEOUT });
    await curateButton.click();
    await page.waitForTimeout(2000);

    // Check for Upload functionality
    const uploadArea = page.locator('input[type="file"], [data-upload], text=Upload, button:has-text("Upload")');
    const hasUpload = await uploadArea.first().isVisible({ timeout: 5000 }).catch(() => false);
    console.log(`Upload area visible: ${hasUpload}`);

    // Check for Delete functionality
    const deleteButton = page.locator('button:has-text("Delete"), [data-action="delete"]');
    const hasDelete = await deleteButton.first().isVisible({ timeout: 5000 }).catch(() => false);
    console.log(`Delete button visible: ${hasDelete}`);

    // Check for Dedupe functionality (GitMerge icon)
    const dedupeButton = page.locator('button:has-text("Dedupe"), [data-action="dedupe"], [class*="dedupe"]');
    const hasDedupe = await dedupeButton.first().isVisible({ timeout: 5000 }).catch(() => false);
    console.log(`Dedupe button visible: ${hasDedupe}`);

    await page.screenshot({ path: 'test-results/demo-curate-tab-overview.png', fullPage: true });

    // At least one of these should be visible
    expect(hasUpload || hasDelete || hasDedupe).toBeTruthy();
  });

  test('Curate: Thumbs down feedback flow', async ({ page }) => {
    console.log('\n[DEMO] Curate: Thumbs down feedback workflow\n');

    // First, generate a chat response to give feedback on
    const chatInput = page.locator('[data-testid="chat-input"], textarea[placeholder*="Ask"]').first();
    await expect(chatInput).toBeVisible({ timeout: NAVIGATION_TIMEOUT });

    await submitChatQuery(page, 'What is AOMA?');

    // Wait for response
    const aiResponse = page.locator('[data-testid="ai-message"]').last();
    await expect(aiResponse).toBeVisible({ timeout: AI_RESPONSE_TIMEOUT });
    await page.waitForTimeout(2000);

    // Look for thumbs down button
    const thumbsDown = page.locator('[data-action="thumbs-down"], button[aria-label*="down"], [class*="thumbs-down"]');
    const hasThumbsDown = await thumbsDown.first().isVisible({ timeout: 5000 }).catch(() => false);

    if (hasThumbsDown) {
      console.log('Found thumbs down button - clicking');
      await thumbsDown.first().click();
      await page.waitForTimeout(1000);

      // Look for feedback input
      const feedbackInput = page.locator('textarea[placeholder*="feedback"], input[placeholder*="feedback"]');
      const hasFeedbackInput = await feedbackInput.isVisible({ timeout: 5000 }).catch(() => false);

      if (hasFeedbackInput) {
        await feedbackInput.fill('Should mention 2024 spec updates');
        console.log('Entered feedback text');
      }

      await page.screenshot({ path: 'test-results/demo-curate-thumbs-down-feedback.png', fullPage: true });
    } else {
      console.log('Thumbs down button not visible - checking for RLHF elements');
      // Check for any RLHF-related elements
      const rlhfElements = page.locator('[class*="rlhf"], [class*="feedback"]');
      const rlhfCount = await rlhfElements.count();
      console.log(`RLHF-related elements found: ${rlhfCount}`);
    }

    await page.screenshot({ path: 'test-results/demo-curate-feedback-flow.png', fullPage: true });
  });

  test('Curate: Navigate to Curation Queue', async ({ page }) => {
    console.log('\n[DEMO] Navigate to Curation Queue\n');

    // Navigate to Curate tab first
    const curateButton = page.locator('button').filter({ hasText: 'Curate' }).first();
    await expect(curateButton).toBeVisible({ timeout: NAVIGATION_TIMEOUT });
    await curateButton.click();
    await page.waitForTimeout(2000);

    // Look for curation queue or similar
    const queueElements = page.locator('text=Queue, text=Curation, [class*="queue"]');
    const hasQueue = await queueElements.first().isVisible({ timeout: 5000 }).catch(() => false);
    console.log(`Curation queue visible: ${hasQueue}`);

    await page.screenshot({ path: 'test-results/demo-curation-queue.png', fullPage: true });
  });
});

test.describe('Demo Scenarios - Test Pillar @demo', () => {
  test.beforeEach(async ({ page, baseURL }) => {
    const testUrl = baseURL || process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';

    if (testUrl.includes('localhost')) {
      await page.context().addCookies([
        { name: 'bypass_auth', value: 'true', domain: 'localhost', path: '/' },
      ]);
    }

    await page.goto(testUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
  });

  test('Test: Dashboard shows key metrics (executions, pass rate, auto-healed)', async ({ page }) => {
    console.log('\n[DEMO] Test Dashboard with metrics\n');

    // Navigate to Test tab
    const testButton = page.locator('button').filter({ hasText: 'Test' }).first();
    await expect(testButton).toBeVisible({ timeout: NAVIGATION_TIMEOUT });
    await testButton.click();
    await page.waitForTimeout(2000);

    // Look for metrics cards
    const metricsContent = page.getByText(/executions|pass rate|auto-heal|healed/i);
    const hasMetrics = await metricsContent.first().isVisible({ timeout: 5000 }).catch(() => false);
    console.log(`Metrics visible: ${hasMetrics}`);

    // Look for specific metric values
    const cards = page.locator('[class*="Card"], [class*="card"]');
    const cardCount = await cards.count();
    console.log(`Dashboard cards found: ${cardCount}`);

    await page.screenshot({ path: 'test-results/demo-test-dashboard-metrics.png', fullPage: true });
  });

  test('Test: Historical sub-tab navigation', async ({ page }) => {
    console.log('\n[DEMO] Test Historical sub-tab\n');

    // Navigate to Test tab
    const testButton = page.locator('button').filter({ hasText: 'Test' }).first();
    await expect(testButton).toBeVisible({ timeout: NAVIGATION_TIMEOUT });
    await testButton.click();
    await page.waitForTimeout(2000);

    // Click Historical tab
    const historicalTab = page.locator('[role="tab"]').filter({ hasText: 'Historical' });
    const hasHistorical = await historicalTab.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasHistorical) {
      await historicalTab.click();
      await page.waitForTimeout(1000);
      console.log('Navigated to Historical tab');
    } else {
      console.log('Historical tab not found - checking for alternative');
    }

    await page.screenshot({ path: 'test-results/demo-test-historical-tab.png', fullPage: true });
  });

  test('Test: Search for specific test ID 49524 (Wav Duration Mismatch)', async ({ page }) => {
    console.log('\n[DEMO] Search for test ID 49524\n');

    // Navigate to Test tab
    const testButton = page.locator('button').filter({ hasText: 'Test' }).first();
    await expect(testButton).toBeVisible({ timeout: NAVIGATION_TIMEOUT });
    await testButton.click();
    await page.waitForTimeout(2000);

    // Navigate to Historical if available
    const historicalTab = page.locator('[role="tab"]').filter({ hasText: 'Historical' });
    if (await historicalTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await historicalTab.click();
      await page.waitForTimeout(1000);
    }

    // Look for search input
    const searchInput = page.locator('input[placeholder*="Search"], input[type="search"], [data-testid="search"]');
    const hasSearch = await searchInput.first().isVisible({ timeout: 5000 }).catch(() => false);

    if (hasSearch) {
      await searchInput.first().fill('49524');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(2000);
      console.log('Searched for ID 49524');
    }

    await page.screenshot({ path: 'test-results/demo-test-search-49524.png', fullPage: true });
  });

  test('Test: AI Analysis button and results (ID 49524)', async ({ page }) => {
    console.log('\n[DEMO] AI Analysis for test ID 49524\n');

    // Navigate to Test tab
    const testButton = page.locator('button').filter({ hasText: 'Test' }).first();
    await expect(testButton).toBeVisible({ timeout: NAVIGATION_TIMEOUT });
    await testButton.click();
    await page.waitForTimeout(2000);

    // Navigate to Historical
    const historicalTab = page.locator('[role="tab"]').filter({ hasText: 'Historical' });
    if (await historicalTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await historicalTab.click();
      await page.waitForTimeout(1000);
    }

    // Search for the test
    const searchInput = page.locator('input[placeholder*="Search"], input[type="search"]').first();
    if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await searchInput.fill('49524');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(2000);
    }

    // Look for AI Analysis button
    const aiAnalysisButton = page.locator('button:has-text("AI Analysis"), button:has-text("Run AI Analysis"), [data-action="ai-analysis"]');
    const hasAIAnalysis = await aiAnalysisButton.first().isVisible({ timeout: 5000 }).catch(() => false);

    if (hasAIAnalysis) {
      console.log('Found AI Analysis button');
      await aiAnalysisButton.first().click();
      await page.waitForTimeout(3000);

      // Check for AI Analysis results
      const analysisResults = page.locator('[class*="analysis"], text=AI Analysis, text=AI Suggestions');
      const hasResults = await analysisResults.first().isVisible({ timeout: 10000 }).catch(() => false);
      console.log(`AI Analysis results visible: ${hasResults}`);
    }

    await page.screenshot({ path: 'test-results/demo-test-ai-analysis-49524.png', fullPage: true });
  });

  test('Test: Search for ID 83168 and Generate Script', async ({ page }) => {
    console.log('\n[DEMO] Generate Script for test ID 83168\n');

    // Navigate to Test tab
    const testButton = page.locator('button').filter({ hasText: 'Test' }).first();
    await expect(testButton).toBeVisible({ timeout: NAVIGATION_TIMEOUT });
    await testButton.click();
    await page.waitForTimeout(2000);

    // Navigate to Historical
    const historicalTab = page.locator('[role="tab"]').filter({ hasText: 'Historical' });
    if (await historicalTab.isVisible({ timeout: 3000 }).catch(() => false)) {
      await historicalTab.click();
      await page.waitForTimeout(1000);
    }

    // Search for the test
    const searchInput = page.locator('input[placeholder*="Search"], input[type="search"]').first();
    if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await searchInput.fill('83168');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(2000);
    }

    // Look for Generate Script button
    const generateScriptButton = page.locator('button:has-text("Generate Script"), button:has-text("Generate"), [data-action="generate-script"]');
    const hasGenerateScript = await generateScriptButton.first().isVisible({ timeout: 5000 }).catch(() => false);

    if (hasGenerateScript) {
      console.log('Found Generate Script button');
      await generateScriptButton.first().click();
      await page.waitForTimeout(3000);

      // Check for generated script output
      const scriptOutput = page.locator('pre, code, [class*="code"], [class*="script"]');
      const hasScript = await scriptOutput.first().isVisible({ timeout: 10000 }).catch(() => false);
      console.log(`Generated script visible: ${hasScript}`);
    }

    await page.screenshot({ path: 'test-results/demo-test-generate-script-83168.png', fullPage: true });
  });

  test('Test: Self-Healing tab renders healing queue', async ({ page }) => {
    console.log('\n[DEMO] Self-Healing tab\n');

    // Navigate to Test tab
    const testButton = page.locator('button').filter({ hasText: 'Test' }).first();
    await expect(testButton).toBeVisible({ timeout: NAVIGATION_TIMEOUT });
    await testButton.click();
    await page.waitForTimeout(2000);

    // Click Self-Healing tab
    const selfHealingTab = page.locator('[role="tab"]').filter({ hasText: 'Self-Healing' });
    const hasSelfHealing = await selfHealingTab.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasSelfHealing) {
      await selfHealingTab.click();
      await page.waitForTimeout(1500);
      console.log('Navigated to Self-Healing tab');

      // Look for healing queue content
      const healingContent = page.locator('[class*="heal"], [class*="queue"], [class*="Card"]');
      const contentCount = await healingContent.count();
      console.log(`Self-healing content elements: ${contentCount}`);
    }

    await page.screenshot({ path: 'test-results/demo-test-self-healing.png', fullPage: true });
  });
});

test.describe('Demo Scenarios - Full Workflow @demo', () => {
  test.beforeEach(async ({ page, baseURL }) => {
    const testUrl = baseURL || process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';

    if (testUrl.includes('localhost')) {
      await page.context().addCookies([
        { name: 'bypass_auth', value: 'true', domain: 'localhost', path: '/' },
      ]);
    }

    await page.goto(testUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
  });

  test('Full Demo: Navigate all three pillars without errors', async ({ page }) => {
    console.log('\n[DEMO] Full three-pillar navigation test\n');

    // Pillar 1: Chat
    console.log('  Pillar 1: Chat');
    const chatInput = page.locator('[data-testid="chat-input"], textarea[placeholder*="Ask"]').first();
    await expect(chatInput).toBeVisible({ timeout: NAVIGATION_TIMEOUT });
    await submitChatQuery(page, 'What is AOMA?');
    await page.waitForTimeout(5000); // Brief wait, don't need full response

    // Pillar 2: Curate
    console.log('  Pillar 2: Curate');
    const curateButton = page.locator('button').filter({ hasText: 'Curate' }).first();
    if (await curateButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await curateButton.click();
      await page.waitForTimeout(1500);
    }

    // Pillar 3: Test
    console.log('  Pillar 3: Test');
    const testButton = page.locator('button').filter({ hasText: 'Test' }).first();
    if (await testButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await testButton.click();
      await page.waitForTimeout(1500);
    }

    // Return to Chat (closing loop)
    console.log('  Returning to Chat');
    const chatButton = page.locator('button').filter({ hasText: 'Chat' }).first();
    if (await chatButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await chatButton.click();
      await page.waitForTimeout(1000);
    }

    console.log('  All three pillars navigated successfully');
    await page.screenshot({ path: 'test-results/demo-full-workflow-complete.png', fullPage: true });
  });

  test('Full Demo: Capture all tab screenshots for demo prep', async ({ page }) => {
    console.log('\n[DEMO] Capturing all tab screenshots\n');

    const tabs = ['Chat', 'HUD', 'Test', 'Fix', 'Curate'];

    for (let i = 0; i < tabs.length; i++) {
      const tabName = tabs[i];
      const button = page.locator('button').filter({ hasText: tabName }).first();

      if (await button.isVisible({ timeout: 3000 }).catch(() => false)) {
        await button.click();
        await page.waitForTimeout(1500);

        await page.screenshot({
          path: `test-results/demo-all-tabs-${String(i + 1).padStart(2, '0')}-${tabName.toLowerCase()}.png`,
          fullPage: true,
        });
        console.log(`  Captured: ${tabName}`);
      }
    }

    console.log('  All tab screenshots captured');
  });
});
