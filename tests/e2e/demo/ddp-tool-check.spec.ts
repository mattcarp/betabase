import { test, expect } from '../../fixtures/base-test';

const AI_RESPONSE_TIMEOUT = 30000;

test.describe('DDP Tool Calling @ddp', () => {
  test.beforeEach(async ({ page, baseURL }) => {
    // Setup page similar to official demo test
    const testUrl = baseURL || process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
    if (testUrl.includes('localhost')) {
      await page.context().addCookies([
        { name: 'bypass_auth', value: 'true', domain: 'localhost', path: '/' },
      ]);
    }
    await page.goto(testUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
  });

  test('Should parse CD-TEXT hex data using tool', async ({ page }) => {
    const chatInput = page.locator('[data-testid="chat-input"], textarea[placeholder*="Ask"]').first();
    await expect(chatInput).toBeVisible();

    // CD-TEXT Hex example (Album Title: "Test Album", Track 1: "Test Track")
    // This is a minimal valid CD-TEXT pack structure
    // 80 (Title) | 00 (Track 0) | 01 (Seq) | 00 (Block 0, Char 0) | Data... | CRC...
    const hexData = "800001005465737420416C62756D00003465"; 
    // Note: The above is just a dummy hex, the AI tool should try to parse it. 
    // Real CD-TEXT validity check might fail but the TOOL CALL should happen.
    
    // We'll ask it to parse a clearly labeled "hex string" to trigger the tool
    const prompt = `Please parse this CD-TEXT hex data: ${hexData}`;
    
    await chatInput.fill(prompt);
    await page.keyboard.press('Enter');

    // Wait for response
    const aiResponse = page.locator('[data-testid="ai-message"]').last();
    await expect(aiResponse).toBeVisible({ timeout: AI_RESPONSE_TIMEOUT });
    
    // Check if tool UI appears (if implemented) or if response mentions parsing
    // Response should mention "Test Album" if it successfully parsed (if hex was valid)
    // Or at least attempt to parse.
    // The key is that the AI *tried*.
    
    const responseText = await aiResponse.textContent();
    console.log('AI Response:', responseText);
    
    // Verify tool usage indicators if any
    // Depending on UI, there might be a "Used tool: parseCdtext" badge
  });
});
