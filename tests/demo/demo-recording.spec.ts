import { test, expect } from '@playwright/test';

/**
 * Demo Recording Script for Technical Presentation
 * 
 * Run with: npx playwright test tests/demo/demo-recording.spec.ts --headed --project=chromium
 * 
 * Adjust pause times as needed for your narration pace
 */

// Helper: Configurable pause for narrator control
const narratorPause = async (page: any, seconds: number) => {
  await page.waitForTimeout(seconds * 1000);
  console.log(`⏸️  Narrator pause: ${seconds}s`);
};

// Helper: Type slowly for natural appearance
const typeNaturally = async (page: any, selector: string, text: string) => {
  await page.fill(selector, text, { delay: 50 }); // 50ms between characters
};

test.describe('SIAM Demo Recording', () => {
  test.setTimeout(180000); // 3 minutes max per test
  
  test.beforeEach(async ({ page }) => {
    // Navigate to production site
    await page.goto('https://thebetabase.com');
    
    // Handle authentication if needed
    // TODO: Add your auth flow here if not already logged in
    // For now, assumes you're already authenticated
    
    await narratorPause(page, 2);
  });

  test('Demo Sequence 1: Basic RAG Query', async ({ page }) => {
    console.log('\n🎬 DEMO 1: Basic RAG Query - "What is AOMA?"');
    
    // Navigate to chat interface
    await page.waitForSelector('[data-testid="chat-input"]', { timeout: 10000 });
    
    await narratorPause(page, 2);
    console.log('💬 Narrator: Introduce the basic query...');
    
    // Type the question
    await typeNaturally(page, '[data-testid="chat-input"]', 'What is AOMA?');
    
    await narratorPause(page, 3);
    console.log('💬 Narrator: Explain what we\'re about to see...');
    
    // Send query
    await page.click('[data-testid="send"]');
    
    // Wait for streaming response to start
    await page.waitForSelector('[data-testid="streaming-response"]', { timeout: 5000 });
    
    await narratorPause(page, 6);
    console.log('💬 Narrator: Point out streaming response, response time...');
    
    // Highlight source citations (hover over first citation)
    const firstCitation = page.locator('[data-testid="citation"]').first();
    if (await firstCitation.count() > 0) {
      await firstCitation.hover();
      await narratorPause(page, 3);
      console.log('💬 Narrator: Show citation source...');
    }
    
    console.log('✅ Demo 1 complete');
  });

  test('Demo Sequence 2: MCP Integration', async ({ page }) => {
    console.log('\n🎬 DEMO 2: MCP Integration - JIRA tickets');
    
    await page.waitForSelector('[data-testid="chat-input"]');
    
    await narratorPause(page, 2);
    console.log('💬 Narrator: Introduce MCP integration...');
    
    // Type JIRA query
    await typeNaturally(
      page, 
      '[data-testid="chat-input"]', 
      'Show me JIRA tickets related to AOMA migration'
    );
    
    await narratorPause(page, 3);
    console.log('💬 Narrator: Explain what makes this different...');
    
    // Send query
    await page.click('[data-testid="send"]');
    
    // Wait for response
    await page.waitForSelector('[data-testid="streaming-response"]', { timeout: 10000 });
    
    await narratorPause(page, 8);
    console.log('💬 Narrator: Point out live data integration, MCP server logs...');
    
    console.log('✅ Demo 2 complete');
  });

  test('Demo Sequence 3: Cross-Reference Query', async ({ page }) => {
    console.log('\n🎬 DEMO 3: Cross-Reference - AOMA2 vs AOMA3');
    
    await page.waitForSelector('[data-testid="chat-input"]');
    
    await narratorPause(page, 2);
    console.log('💬 Narrator: Introduce synthesis capability...');
    
    // Type comparison query
    await typeNaturally(
      page,
      '[data-testid="chat-input"]',
      'Compare AOMA2 vs AOMA3 architecture'
    );
    
    await narratorPause(page, 3);
    console.log('💬 Narrator: Explain multi-source synthesis...');
    
    // Send query
    await page.click('[data-testid="send"]');
    
    // Wait for response
    await page.waitForSelector('[data-testid="streaming-response"]', { timeout: 10000 });
    
    await narratorPause(page, 8);
    console.log('💬 Narrator: Highlight structured comparison, multiple citations...');
    
    console.log('✅ Demo 3 complete');
  });

  test('Demo Sequence 4: Anti-Hallucination Test', async ({ page }) => {
    console.log('\n🎬 DEMO 4: Anti-Hallucination - Trick Question');
    
    await page.waitForSelector('[data-testid="chat-input"]');
    
    await narratorPause(page, 2);
    console.log('💬 Narrator: Set up the trick question...');
    
    // Type the trick question
    await typeNaturally(
      page,
      '[data-testid="chat-input"]',
      'Does AOMA have a blockchain integration?'
    );
    
    await narratorPause(page, 3);
    console.log('💬 Narrator: Explain this is testing anti-hallucination...');
    
    // Send query
    await page.click('[data-testid="send"]');
    
    // Wait for response
    await page.waitForSelector('[data-testid="streaming-response"]', { timeout: 10000 });
    
    await narratorPause(page, 6);
    console.log('💬 Narrator: Point out honest "I don\'t know" response...');
    
    // Verify response contains some variation of "no information"
    // This is a check for testing, not for display
    const responseText = await page.locator('[data-testid="streaming-response"]').textContent();
    console.log('Response preview:', responseText?.substring(0, 100));
    
    console.log('✅ Demo 4 complete');
  });

  test('Demo Sequence 5: Code Integration (Optional)', async ({ page }) => {
    console.log('\n🎬 DEMO 5: Code Integration - GitHub MCP');
    
    await page.waitForSelector('[data-testid="chat-input"]');
    
    await narratorPause(page, 2);
    console.log('💬 Narrator: Introduce code search capability...');
    
    // Type code search query
    await typeNaturally(
      page,
      '[data-testid="chat-input"]',
      'Find the authentication implementation in our codebase'
    );
    
    await narratorPause(page, 3);
    console.log('💬 Narrator: Explain GitHub MCP integration...');
    
    // Send query
    await page.click('[data-testid="send"]');
    
    // Wait for response
    await page.waitForSelector('[data-testid="streaming-response"]', { timeout: 15000 });
    
    await narratorPause(page, 10);
    console.log('💬 Narrator: Show code snippets, file locations...');
    
    console.log('✅ Demo 5 complete');
  });
});

/**
 * USAGE INSTRUCTIONS:
 * 
 * 1. Update data-testid selectors to match your actual app
 * 2. Adjust narratorPause durations to match your speaking pace
 * 3. Run in headed mode: npx playwright test tests/demo/demo-recording.spec.ts --headed
 * 4. Start Descript recording, run Playwright, narrate over it
 * 5. Edit narration timing in Descript afterward
 * 
 * TIPS:
 * - Run each test separately to record in segments
 * - Use --project=chromium for consistent rendering
 * - Add slowMo option if typing is too fast: test.use({ launchOptions: { slowMo: 100 } })
 * - Console logs help you track where you are during recording
 */
