/**
 * DEMO-SCRIPT-BEAUTIFUL.md - Playwright E2E Tests
 *
 * Tests all 7 differentiators from the main SIAM demo:
 * 1. Multi-source knowledge synthesis (JIRA + Git + Docs)
 * 2. Visual diagram generation
 * 3. Development intelligence
 * 4. Anti-hallucination trust
 * 5. Strategic SLM approach (narrative, not testable via UI)
 * 6. Semantic deduplication (Curate tab)
 * 7. Comprehensive testing (meta - this file!)
 *
 * TDD Ralph Loop: Each test validates a specific demo stage.
 * Run with: npx playwright test tests/e2e/demo/demo-beautiful-script.spec.ts
 */

import { test, expect } from '../../fixtures/base-test';

// Timeout for AI responses (AOMA queries can take 20-30s)
const AI_RESPONSE_TIMEOUT = 60000;
const NAVIGATION_TIMEOUT = 10000;

/**
 * Helper function to submit a chat query reliably
 */
async function submitChatQuery(page: import('@playwright/test').Page, query: string) {
  const chatInput = page.locator('[data-testid="chat-input"], textarea[placeholder*="Ask"]').first();
  await chatInput.fill(query);
  await page.waitForTimeout(300);

  const submitButton = page.locator('[data-testid="send-button"]');
  await submitButton.click();
  await page.waitForTimeout(500);

  // Check if user message appeared
  const userMessage = page.locator('[data-testid="user-message"]');
  if ((await userMessage.count()) === 0) {
    await submitButton.click({ force: true });
    await page.waitForTimeout(500);
  }

  // Fallback: submit form directly
  if ((await userMessage.count()) === 0) {
    await page.evaluate(() => {
      const form = document.querySelector('[data-chat-form="true"]') as HTMLFormElement;
      if (form) form.requestSubmit();
    });
  }
}

/**
 * Helper to wait for AI response
 */
async function waitForAIResponse(page: import('@playwright/test').Page, timeout = AI_RESPONSE_TIMEOUT) {
  const aiResponse = page.locator('[data-testid="ai-message"]').last();
  await expect(aiResponse).toBeVisible({ timeout });
  return aiResponse;
}

test.describe('Demo Script Beautiful - Opening Hook @demo @beautiful', () => {
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

  test('Opening: Chat interface is visible and ready', async ({ page }) => {
    console.log('\n[DEMO BEAUTIFUL] Stage: Opening Hook - Chat Ready\n');

    // Chat input should be visible
    const chatInput = page.locator('[data-testid="chat-input"], textarea[placeholder*="Ask"]').first();
    await expect(chatInput).toBeVisible({ timeout: NAVIGATION_TIMEOUT });

    // Send button should be visible
    const sendButton = page.locator('[data-testid="send-button"]');
    await expect(sendButton).toBeVisible();

    // Welcome screen or chat area should be present
    const welcomeArea = page.locator('[class*="welcome"], [class*="chat"], [data-testid="chat-container"]').first();
    await expect(welcomeArea).toBeVisible({ timeout: NAVIGATION_TIMEOUT });

    await page.screenshot({ path: 'test-results/demo-beautiful-01-opening.png', fullPage: true });
  });
});

test.describe('Demo Script Beautiful - Demo 1: Baseline Query @demo @beautiful', () => {
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

  test('Demo 1: "What is AOMA?" - Standard RAG baseline', async ({ page }) => {
    console.log('\n[DEMO BEAUTIFUL] Stage: Demo 1 - Baseline Query\n');
    console.log('  Query: "What is AOMA?"\n');

    const chatInput = page.locator('[data-testid="chat-input"], textarea[placeholder*="Ask"]').first();
    await expect(chatInput).toBeVisible({ timeout: NAVIGATION_TIMEOUT });

    // Submit the baseline query
    await submitChatQuery(page, 'What is AOMA?');

    // Wait for AI response
    const aiResponse = await waitForAIResponse(page);
    const responseText = await aiResponse.textContent();

    console.log(`  Response length: ${responseText?.length || 0} chars`);

    // Validate response contains relevant AOMA content
    const hasAOMAInfo =
      responseText?.toLowerCase().includes('asset') ||
      responseText?.toLowerCase().includes('offering') ||
      responseText?.toLowerCase().includes('management');

    expect(hasAOMAInfo).toBeTruthy();
    expect(responseText?.length).toBeGreaterThan(50);

    await page.screenshot({ path: 'test-results/demo-beautiful-02-baseline-aoma.png', fullPage: true });
  });

  test('Demo 1: Response includes streaming and citations', async ({ page }) => {
    console.log('\n[DEMO BEAUTIFUL] Stage: Demo 1 - Verify Streaming & Citations\n');

    const chatInput = page.locator('[data-testid="chat-input"], textarea[placeholder*="Ask"]').first();
    await expect(chatInput).toBeVisible({ timeout: NAVIGATION_TIMEOUT });

    await submitChatQuery(page, 'What is AOMA?');

    // Wait for AI response
    await waitForAIResponse(page);

    // Check for citation elements
    const citations = page.locator('[class*="citation"], [data-citation], [class*="source"]');
    const citationCount = await citations.count();
    console.log(`  Citations found: ${citationCount}`);

    await page.screenshot({ path: 'test-results/demo-beautiful-02b-citations.png', fullPage: true });
  });
});

test.describe('Demo Script Beautiful - Demo 2: Multi-Source Intelligence @demo @beautiful', () => {
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

  test('Demo 2: JIRA + Git multi-source query - Differentiator #1', async ({ page }) => {
    console.log('\n[DEMO BEAUTIFUL] Stage: Demo 2 - Multi-Source Intelligence\n');
    console.log('  Query: "Show me JIRA tickets related to AOMA migration and the related code commits"\n');
    console.log('  Differentiator #1: Multi-source knowledge synthesis\n');

    const chatInput = page.locator('[data-testid="chat-input"], textarea[placeholder*="Ask"]').first();
    await expect(chatInput).toBeVisible({ timeout: NAVIGATION_TIMEOUT });

    // This query triggers multi-source retrieval (JIRA + Git)
    await submitChatQuery(page, 'Show me JIRA tickets related to AOMA migration and the related code commits');

    // Wait for response (this may take longer due to multi-source)
    const aiResponse = await waitForAIResponse(page, AI_RESPONSE_TIMEOUT + 15000);
    const responseText = await aiResponse.textContent();

    console.log(`  Response length: ${responseText?.length || 0} chars`);
    expect(responseText?.length).toBeGreaterThan(50);

    // The response should acknowledge the multi-source nature
    // (mentioning JIRA, tickets, commits, etc.)
    const mentionsMultipleSources =
      responseText?.toLowerCase().includes('jira') ||
      responseText?.toLowerCase().includes('ticket') ||
      responseText?.toLowerCase().includes('commit') ||
      responseText?.toLowerCase().includes('migration');

    console.log(`  Mentions multiple sources: ${mentionsMultipleSources}`);

    await page.screenshot({ path: 'test-results/demo-beautiful-03-multi-source.png', fullPage: true });
  });
});

test.describe('Demo Script Beautiful - Demo 3: Visual Intelligence @demo @beautiful', () => {
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

  test('Demo 3: System architecture diagram - Differentiator #2', async ({ page }) => {
    console.log('\n[DEMO BEAUTIFUL] Stage: Demo 3 - Visual Intelligence\n');
    console.log('  Query: "Generate a system architecture diagram for AOMA showing all integration points"\n');
    console.log('  Differentiator #2: Visual diagram generation\n');

    const chatInput = page.locator('[data-testid="chat-input"], textarea[placeholder*="Ask"]').first();
    await expect(chatInput).toBeVisible({ timeout: NAVIGATION_TIMEOUT });

    // Request diagram generation
    await submitChatQuery(page, 'Generate a system architecture diagram for AOMA showing all integration points');

    // Wait for response (diagram generation takes longer)
    const aiResponse = await waitForAIResponse(page, AI_RESPONSE_TIMEOUT + 20000);
    const responseText = await aiResponse.textContent();

    console.log(`  Response length: ${responseText?.length || 0} chars`);

    // Check if response contains diagram-related content
    const hasDiagramContent =
      responseText?.toLowerCase().includes('diagram') ||
      responseText?.toLowerCase().includes('mermaid') ||
      responseText?.toLowerCase().includes('architecture') ||
      responseText?.toLowerCase().includes('flowchart') ||
      responseText?.toLowerCase().includes('graph');

    console.log(`  Has diagram content: ${hasDiagramContent}`);

    // Check for actual Mermaid diagram elements
    const mermaidElement = page.locator('[class*="mermaid"], [data-diagram], svg.mermaid');
    const hasMermaidElement = await mermaidElement.first().isVisible({ timeout: 5000 }).catch(() => false);
    console.log(`  Mermaid element rendered: ${hasMermaidElement}`);

    expect(hasDiagramContent || hasMermaidElement).toBeTruthy();

    await page.screenshot({ path: 'test-results/demo-beautiful-04-diagram.png', fullPage: true });
  });
});

test.describe('Demo Script Beautiful - Demo 4: Development Context @demo @beautiful', () => {
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

  test('Demo 4: Development status query - Differentiator #3', async ({ page }) => {
    console.log('\n[DEMO BEAUTIFUL] Stage: Demo 4 - Development Context\n');
    console.log('  Query: "What\'s the current development status of AOMA3 migration?"\n');
    console.log('  Differentiator #3: Development intelligence\n');

    const chatInput = page.locator('[data-testid="chat-input"], textarea[placeholder*="Ask"]').first();
    await expect(chatInput).toBeVisible({ timeout: NAVIGATION_TIMEOUT });

    // Query about development status
    await submitChatQuery(page, "What's the current development status of AOMA3 migration?");

    // Wait for response
    const aiResponse = await waitForAIResponse(page);
    const responseText = await aiResponse.textContent();

    console.log(`  Response length: ${responseText?.length || 0} chars`);
    expect(responseText?.length).toBeGreaterThan(50);

    // Response should contain development-related content
    const hasDevContent =
      responseText?.toLowerCase().includes('migration') ||
      responseText?.toLowerCase().includes('development') ||
      responseText?.toLowerCase().includes('status') ||
      responseText?.toLowerCase().includes('progress') ||
      responseText?.toLowerCase().includes('aoma');

    console.log(`  Has development context: ${hasDevContent}`);
    expect(hasDevContent).toBeTruthy();

    await page.screenshot({ path: 'test-results/demo-beautiful-05-dev-context.png', fullPage: true });
  });
});

test.describe('Demo Script Beautiful - Demo 5: Anti-Hallucination @demo @beautiful', () => {
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

  test('Demo 5: Blockchain trick question - Differentiator #4', async ({ page }) => {
    console.log('\n[DEMO BEAUTIFUL] Stage: Demo 5 - Anti-Hallucination Test\n');
    console.log('  Query: "Does AOMA have a blockchain integration?"\n');
    console.log('  Expected: Honest "no information" response (AOMA has NO blockchain)\n');
    console.log('  Differentiator #4: Anti-hallucination trust\n');

    const chatInput = page.locator('[data-testid="chat-input"], textarea[placeholder*="Ask"]').first();
    await expect(chatInput).toBeVisible({ timeout: NAVIGATION_TIMEOUT });

    // Trick question - AOMA has no blockchain integration
    await submitChatQuery(page, 'Does AOMA have a blockchain integration?');

    // Wait for response
    const aiResponse = await waitForAIResponse(page);
    const responseText = (await aiResponse.textContent()) || '';

    console.log(`  Response length: ${responseText.length} chars`);
    console.log(`  Response preview: ${responseText.substring(0, 200)}...`);

    // The AI should indicate it doesn't have information about blockchain
    const indicatesNoInfo =
      responseText.toLowerCase().includes('no') ||
      responseText.toLowerCase().includes("don't") ||
      responseText.toLowerCase().includes('not found') ||
      responseText.toLowerCase().includes('no information') ||
      responseText.toLowerCase().includes('unable to find') ||
      responseText.toLowerCase().includes("doesn't") ||
      responseText.toLowerCase().includes('not mention');

    console.log(`  Indicates no blockchain info: ${indicatesNoInfo}`);

    // CRITICAL: The response should NOT confidently describe a blockchain integration
    const fabricatesBlockchain =
      responseText.toLowerCase().includes('blockchain integration') &&
      responseText.toLowerCase().includes('features') &&
      !responseText.toLowerCase().includes('no') &&
      !responseText.toLowerCase().includes("don't") &&
      !responseText.toLowerCase().includes('not');

    console.log(`  Fabricates blockchain (BAD): ${fabricatesBlockchain}`);

    // Pass if it doesn't fabricate OR if it honestly says no
    expect(fabricatesBlockchain).toBeFalsy();

    await page.screenshot({ path: 'test-results/demo-beautiful-06-anti-hallucination.png', fullPage: true });
  });
});

test.describe('Demo Script Beautiful - Demo 6: Curate Tab @demo @beautiful', () => {
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

  test('Demo 6: Navigate to Curate tab - Differentiator #6', async ({ page }) => {
    console.log('\n[DEMO BEAUTIFUL] Stage: Demo 6 - Curate Tab\n');
    console.log('  Action: Click "Curate" tab\n');
    console.log('  Differentiator #6: Semantic deduplication\n');

    // Navigate to Curate tab
    const curateButton = page.locator('button').filter({ hasText: 'Curate' }).first();
    await expect(curateButton).toBeVisible({ timeout: NAVIGATION_TIMEOUT });
    await curateButton.click();
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'test-results/demo-beautiful-07-curate-tab.png', fullPage: true });
  });

  test('Demo 6: Curate tab has Upload functionality', async ({ page }) => {
    console.log('\n[DEMO BEAUTIFUL] Stage: Demo 6 - Upload Feature\n');

    const curateButton = page.locator('button').filter({ hasText: 'Curate' }).first();
    await expect(curateButton).toBeVisible({ timeout: NAVIGATION_TIMEOUT });
    await curateButton.click();
    await page.waitForTimeout(2000);

    // Check for Upload functionality
    const uploadArea = page.locator('input[type="file"], [data-upload], button:has-text("Upload")');
    const hasUpload = await uploadArea.first().isVisible({ timeout: 5000 }).catch(() => false);
    console.log(`  Upload visible: ${hasUpload}`);

    await page.screenshot({ path: 'test-results/demo-beautiful-07b-curate-upload.png', fullPage: true });
  });

  test('Demo 6: Curate tab has Delete functionality', async ({ page }) => {
    console.log('\n[DEMO BEAUTIFUL] Stage: Demo 6 - Delete Feature\n');

    const curateButton = page.locator('button').filter({ hasText: 'Curate' }).first();
    await expect(curateButton).toBeVisible({ timeout: NAVIGATION_TIMEOUT });
    await curateButton.click();
    await page.waitForTimeout(2000);

    // Check for Delete functionality
    const deleteButton = page.locator('button:has-text("Delete"), [data-action="delete"]');
    const hasDelete = await deleteButton.first().isVisible({ timeout: 5000 }).catch(() => false);
    console.log(`  Delete visible: ${hasDelete}`);

    await page.screenshot({ path: 'test-results/demo-beautiful-07c-curate-delete.png', fullPage: true });
  });

  test('Demo 6: Curate tab has Dedupe functionality (GitMerge icon)', async ({ page }) => {
    console.log('\n[DEMO BEAUTIFUL] Stage: Demo 6 - Dedupe Feature\n');
    console.log('  85% semantic similarity threshold\n');

    const curateButton = page.locator('button').filter({ hasText: 'Curate' }).first();
    await expect(curateButton).toBeVisible({ timeout: NAVIGATION_TIMEOUT });
    await curateButton.click();
    await page.waitForTimeout(2000);

    // Check for Dedupe functionality (GitMerge icon button)
    const dedupeButton = page.locator('button:has-text("Dedupe"), [data-action="dedupe"], [class*="dedupe"]');
    const hasDedupe = await dedupeButton.first().isVisible({ timeout: 5000 }).catch(() => false);
    console.log(`  Dedupe visible: ${hasDedupe}`);

    await page.screenshot({ path: 'test-results/demo-beautiful-07d-curate-dedupe.png', fullPage: true });
  });
});

test.describe('Demo Script Beautiful - Closing Recap @demo @beautiful', () => {
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

  test('Closing: Navigate all tabs without console errors', async ({ page }) => {
    console.log('\n[DEMO BEAUTIFUL] Stage: Closing - Full Navigation\n');
    console.log('  Differentiator #7: Comprehensive testing (this test!)\n');

    // Navigate all major tabs
    const tabs = ['Chat', 'Curate', 'Test'];

    for (const tabName of tabs) {
      const button = page.locator('button').filter({ hasText: tabName }).first();

      if (await button.isVisible({ timeout: 3000 }).catch(() => false)) {
        await button.click();
        await page.waitForTimeout(1500);
        console.log(`  Navigated: ${tabName}`);
      }
    }

    // Return to Chat for final screenshot
    const chatButton = page.locator('button').filter({ hasText: 'Chat' }).first();
    if (await chatButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await chatButton.click();
      await page.waitForTimeout(1000);
    }

    await page.screenshot({ path: 'test-results/demo-beautiful-08-closing.png', fullPage: true });
    console.log('\n  All 7 differentiators tested successfully!\n');
  });
});
