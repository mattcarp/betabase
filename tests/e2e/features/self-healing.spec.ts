import { test, expect } from './fixtures/base-test';
import { SelfHealingPage } from './helpers/self-healing';

test.describe('Self-Healing Test Suite', () => {
  test('should self-heal broken selectors during execution', async ({ page }) => {
    console.log('🔄 Starting Self-Healing Test: Chat Input Interaction');
    
    // Initialize Self-Healing Page
    const healingPage = new SelfHealingPage(page);
    
    await healingPage.goto('/');
    
    // Define a BROKEN selector that doesn't exist
    const brokenSelector = '[data-testid="chat-input-broken-v1"]';
    
    // Attempt interaction with broken selector using the healing wrapper
    console.log(`⚠️ Attempting interaction with broken selector: ${brokenSelector}`);
    
    // This should fail internally, trigger healing, and succeed
    await healingPage.fill(brokenSelector, 'What is AOMA?');
    
    console.log('✅ Interaction successful (healed)');
    
    // Verify the input was filled (using a known good selector for verification)
    const realSelector = 'textarea[placeholder*="Ask"]';
    const inputValue = await page.inputValue(realSelector);
    expect(inputValue).toBe('What is AOMA?');
    
    console.log('🎉 Test passed with self-healing');
  });
});
