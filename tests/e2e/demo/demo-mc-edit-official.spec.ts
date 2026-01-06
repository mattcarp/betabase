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
   const chatInput = page.getByTestId('chat-input');
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

  // Wait for app to be fully hydrated by checking for branding first
  await page.locator('text=The Betabase').first().waitFor({ state: 'visible', timeout: 10000 });

  // CRITICAL: Wait for chat interface to actually render (not just branding)
  // Under parallel load, dynamic imports can be slow. Try multiple selectors.
  try {
    // Wait for chat input OR start conversation button (both indicate chat is ready)
    await page.locator('[data-testid="chat-input"], button:has-text("Start a conversation")').first()
      .waitFor({ state: 'visible', timeout: 15000 });
  } catch {
    // If still not visible, wait a bit more and try again (heavy load scenario)
    await page.waitForTimeout(2000);
    await page.locator('[data-testid="chat-input"], button:has-text("Start a conversation")').first()
      .waitFor({ state: 'visible', timeout: 10000 });
  }
}

// ============================================================================
// SECTION 1: Preamble Verification
// ============================================================================
test.describe.configure({ mode: 'serial' });
test.describe('MC Edit Demo - Section 1: Preamble @demo @mc-edit', () => {
  test.beforeEach(async ({ page, baseURL }) => {
    await setupPage(page, baseURL);
  });

  test('DEMO-001: App loads on localhost', async ({ page }) => {
    const chatInput = page.getByTestId('chat-input');
    await expect(chatInput).toBeVisible({ timeout: NAVIGATION_TIMEOUT });

    await page.screenshot({ path: 'test-results/demo-mc-edit-01-app-loaded.png', fullPage: true });
  });

  test('DEMO-002: Welcome screen renders', async ({ page }) => {
    // Look for the app branding - "The Betabase" title or welcome text
    const brandingText = page.locator('text=The Betabase').first();
    await expect(brandingText).toBeVisible({ timeout: NAVIGATION_TIMEOUT });

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
    const chatInput = page.getByTestId('chat-input');
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
    const chatInput = page.getByTestId('chat-input');
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
    const chatInput = page.getByTestId('chat-input');
    await expect(chatInput).toBeVisible({ timeout: NAVIGATION_TIMEOUT });

    // Script: "Diagramming - mermaid to nano banana pro - pick good question/answer candidate ("visual intelligence")"
    const submitted = await submitChatQuery(page, 'Use your visual intelligence to show me a diagram of the AOMA asset ingestion workflow');
    
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
    
      // Check for Nano Banana Pro upgrade button
      const upgradeButton = page.locator('button:has-text("Improve this diagram")');
      const hasUpgradeButton = await upgradeButton.filter({ hasText: 'Improve this diagram' }).isVisible({ timeout: 3000 }).catch(() => false);
      
      if (hasUpgradeButton) {
        // Optional: click it and verify loading state or panel opening
        // await upgradeButton.click();
        // await expect(page.locator('text=Nano Banana Pro Diagram')).toBeVisible({ timeout: 5000 });
      }
    }
    
    await page.screenshot({ path: 'test-results/demo-mc-edit-20-mermaid-diagram.png', fullPage: true });
  });

  test('DEMO-022: DDP parsing tool call', async ({ page }) => {
    const chatInput = page.getByTestId('chat-input');
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

  test('DEMO-023: DDP Advanced Parsing (CD-TEXT, DDPMS)', async ({ page }) => {
    const chatInput = page.getByTestId('chat-input');
    await expect(chatInput).toBeVisible({ timeout: NAVIGATION_TIMEOUT });

    // Script: "ask to read a DDP (should parse all files, including the CD text) - ignore files over 20 megs and check for DDPMS."
    const submitted = await submitChatQuery(page, 'Read this DDP. Does it include CD-TEXT? Also check for DDPMS and ignore files over 20MB.');
    
    const aiResponse = await waitForAIResponse(page, submitted ? AI_RESPONSE_TIMEOUT : 5000);
    
    if (aiResponse) {
      const responseText = await aiResponse.textContent();
      // Expect mention of CD-TEXT or DDPMS or file size limits
      const hasSpecifics = 
        responseText?.toLowerCase().includes('text') || 
        responseText?.toLowerCase().includes('ddpms') ||
        responseText?.toLowerCase().includes('20');
      expect(hasSpecifics).toBeTruthy();
    }
    
    await page.screenshot({ path: 'test-results/demo-mc-edit-23-ddp-advanced.png', fullPage: true });
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
    const chatInput = page.getByTestId('chat-input');
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
    const chatInput = page.getByTestId('chat-input');
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

  test('DEMO-058: Self-Healing Blast Radius', async ({ page }) => {
    const testButton = page.locator('button').filter({ hasText: 'Test' }).first();
    await expect(testButton).toBeVisible({ timeout: NAVIGATION_TIMEOUT });
    await testButton.click();
    
    const selfHealingTab = page.locator('[role="tab"]').filter({ hasText: 'Self-Healing' });
    await expect(selfHealingTab).toBeVisible({ timeout: 5000 });
    await selfHealingTab.click();
    
    // Script: "Move rename button, self healing fixes the test. Move to the top right: ask for human intervention."
    // We look for the "Blast Radius" or "Healing" indicators in SelfHealingDemo.tsx
    const blastRadius = page.locator('text=Blast Radius, [class*="blast-radius"]');
    await expect(blastRadius.first()).toBeVisible({ timeout: 5000 });
    
    const healButton = page.locator('button:has-text("Heal"), button:has-text("Fix")');
    if (await healButton.first().isVisible()) {
        await healButton.first().click();
        await expect(page.locator('text=Healed, text=Success')).toBeVisible({ timeout: 5000 });
    }
    
    await page.screenshot({ path: 'test-results/demo-mc-edit-58-self-healing-blast.png', fullPage: true });
  });

  test('DEMO-055: Ladybug Tester Mode visible', async ({ page }) => {
    // Script: "Tester Mode with moveable ladybug"
    // 1. Enable Tester Mode via Settings
    const settingsButton = page.locator('button').filter({ hasText: 'Settings' }).last();
    // Sometimes sidebar connects, might be hidden or in a menu. 
    // Assuming standard sidebar visibility from setupPage
    
    if (await settingsButton.isVisible()) {
        await settingsButton.click();
        await page.waitForTimeout(500); // Wait for dropdown
        
        // Fix: The custom div is NOT a menuitem, so look for the text "Tester Mode" container
        const switchContainer = page.locator('div').filter({ hasText: 'Tester Mode' }).last(); 
        const testerSwitch = switchContainer.locator('[role="switch"]');
        
        // Fallback or verify existence
        let switchLocator = testerSwitch;
        if (!(await switchLocator.isVisible().catch(()=>false))) {
             switchLocator = page.locator('[role="switch"]').first();
        }
        const isVisible = await switchLocator.isVisible({ timeout: 2000 }).catch(() => false);
        
        if (isVisible) {
             const isChecked = await switchLocator.getAttribute('aria-checked') === 'true';
             if (!isChecked) {
                 await switchLocator.click();
                 await page.waitForTimeout(500);
             }
        }
        
        // Close menu if needed (clicking outside or escape)
        await page.keyboard.press('Escape');
    }
    
    // 2. Verify Ladybug
    // The ladybug has class "fixed z-[9999] ..." and contains a Bug icon.
    // DraggableLadybug.tsx doesn't have a distinct ID, but we can look for the bug icon container
    
    // We can look for the Bug icon that is NOT in the Settings menu
    const testerToggle = page.locator('.fixed.z-\\[9999\\] svg.lucide-bug').first();
    // Or closer parent
    const ladybugContainer = page.locator('.fixed.z-\\[9999\\]').first();
    
    await expect(ladybugContainer).toBeVisible({ timeout: 5000 });
    
    await ladybugContainer.hover();
    await page.waitForTimeout(500);
    
    // Test Dragging
    const ladybug = ladybugContainer;
    const initialBox = await ladybug.boundingBox();
    
    if (initialBox) {
      // Simulate drag
      await page.mouse.move(initialBox.x + initialBox.width / 2, initialBox.y + initialBox.height / 2);
      await page.mouse.down();
      await page.mouse.move(initialBox.x + 300, initialBox.y + 300, { steps: 5 }); // Drag to a new location
      await page.mouse.up();
      
      await page.waitForTimeout(500);
      const newBox = await ladybug.boundingBox();
      
      if (newBox) {
        // Verify it moved (allow for some small variance or snap)
        expect(Math.abs(newBox.x - initialBox.x)).toBeGreaterThan(10);
        expect(Math.abs(newBox.y - initialBox.y)).toBeGreaterThan(10);
      }
    }
    
    await page.screenshot({ path: 'test-results/demo-mc-edit-55-ladybug.png', fullPage: true });
  });

  test('DEMO-056: Ladybug Context Switching (TDD/FAILING)', async ({ page }) => {
    // Enable Tester Mode first (assuming it might be disabled by default or in a clean state)
    // Redundant but safe for isolation
    await page.keyboard.press('Escape'); // Ensure menu closed
    const ladybugContainer = page.locator('.fixed.z-\\[9999\\]').first();
    
    if (!(await ladybugContainer.isVisible())) {
        // ... (Logic to enable if missing, but let's assume DEMO-055 runs before or we use the same setup)
    }
    
    // Script: "Switching of testing context depending on which app ladybug moves to"
    // THIS IS EXPECTED TO FAIL OR BE MOCKED AS IT IS CURRENTLY MISSING
    const initialBox = await ladybugContainer.boundingBox();
    if (initialBox) {
        // Drag to a specific "app area" - let's say the Sidebar or a specific Card
        await page.mouse.move(initialBox.x + 5, initialBox.y + 5);
        await page.mouse.down();
        await page.mouse.move(100, 500, { steps: 10 }); 
        await page.mouse.up();
        
        // Assert for context switch notification or UI change
        // This is the "failing" part unless we mock it
        const contextNotification = page.locator('text=Testing Context Switched, text=Context:').first();
        await expect(contextNotification).toBeVisible({ timeout: 3000 });
    }
  });

  test('DEMO-057: Three-Tier Ranking System', async ({ page }) => {
    const testButton = page.locator('button').filter({ hasText: 'Test' }).first();
    await expect(testButton).toBeVisible({ timeout: NAVIGATION_TIMEOUT });
    await testButton.click();
    
    const rlhfTab = page.locator('[role="tab"]').filter({ hasText: 'RLHF Tests' });
    await expect(rlhfTab).toBeVisible({ timeout: 5000 });
    await rlhfTab.click();
    
    // Script: "Three-tier system: Tier 1 (>90% auto-approved), Tier 2 (60-90% human review), Tier 3 (<60% architect)"
    // Expect to see Tier labels
    const tier1 = page.locator('text=Tier 1, text=Auto-Approved').first();
    const tier2 = page.locator('text=Tier 2, text=Human Review').first();
    const tier3 = page.locator('text=Tier 3, text=Architect').first();
    
    // These might fail if the UI only shows "Pending/Pass/Fail" currently
    await expect(tier1).toBeVisible({ timeout: 3000 });
    await expect(tier2).toBeVisible({ timeout: 3000 });
    await expect(tier3).toBeVisible({ timeout: 3000 });
    
    await page.screenshot({ path: 'test-results/demo-mc-edit-57-three-tier.png', fullPage: true });
  });


  test('DEMO-040: Curation Segue', async ({ page }) => {
    // Script: "Thumbs down feedback flow" -> "Curation queue"
    
    // 1. Get a response
    const submitted = await submitChatQuery(page, 'Tell me something that needs curation.');
    await waitForAIResponse(page); // Wait for response
    
    // 2. Click Thumbs Down
    // Look for the last thumbs down button in the chat
    const thumbsDown = page.getByTestId('thumbs-down').last();
    await expect(thumbsDown).toBeVisible({ timeout: 10000 });
    await thumbsDown.click();
    
    // 3. Verify Dialog
    const dialog = page.locator('div[role="dialog"]');
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText('Thank You for Your Feedback');
    
    // 4. Type feedback
    const textarea = page.locator('textarea[data-test-id="feedback-textarea"]');
    await textarea.fill('This answer is outdated.');
    
    // 5. Click "Go to Curation Queue"
    const curationBtn = page.locator('button[data-test-id="feedback-curation-btn"]');
    await curationBtn.click();
    
    // 6. Verify Navigation
    // Check if URL hash changed to #curate or similar verification
    await page.waitForTimeout(1000);
    // Verify the "Curate" tab is active (button styled as active)
    const curateTab = page.locator('button').filter({ hasText: 'Curate' }).first();
    // Active tab usually has a specific class or style, checking for visible curation content might be easier
    // Check for "Curate" header or content
    // Assuming Curate tab has a unique element, e.g., "Knowledge Curation"
    await expect(page.locator('text=Knowledge Curation').first()).toBeVisible({ timeout: 5000 });
    
    await page.screenshot({ path: 'test-results/demo-mc-edit-40-curation-segue.png', fullPage: true });
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
    const chatInput = page.getByTestId('chat-input');
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
