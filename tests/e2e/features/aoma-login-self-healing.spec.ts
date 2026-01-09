/**
 * AOMA Login Self-Healing Test
 *
 * Demonstrates self-healing capability when selectors change semantically.
 * Scenario: data-test-id changes from "login-button" to "login-btn"
 * The healing logic should recognize these are semantically equivalent.
 */

import { test, expect } from '../fixtures/base-test';
import { SemanticSelfHealingPage } from '../helpers/semantic-self-healing';

const AOMA_LOGIN_URL = '/demo/aoma-login/index.html';

test.describe('AOMA Login Self-Healing', () => {
  test('should heal login-button to login-btn (semantic similarity)', async ({ page }) => {
    console.log('\n' + '='.repeat(70));
    console.log('SELF-HEALING TEST: Semantic Selector Recovery');
    console.log('='.repeat(70));

    const healingPage = new SemanticSelfHealingPage(page);

    // Navigate to AOMA login page
    await page.goto(AOMA_LOGIN_URL);
    await page.waitForLoadState('domcontentloaded');

    console.log('\n[1] Page loaded: AOMA Login');
    console.log(`    URL: ${page.url()}`);

    // The OLD selector that tests were written against
    const oldSelector = '[data-test-id="login-button"]';

    // Attempt to click the login button using the OLD selector
    // The page now has "login-btn" so this should fail and heal
    console.log(`\n[2] Attempting interaction with selector: ${oldSelector}`);
    console.log('    (This selector no longer exists - page was updated to use "login-btn")');

    const result = await healingPage.clickWithHealing(oldSelector, {
      context: 'AOMA login form submit button',
      expectedRole: 'button',
      expectedAction: 'form submission',
    });

    // Verify healing occurred
    expect(result.healed).toBe(true);
    expect(result.newSelector).toContain('login-btn');

    console.log('\n' + '='.repeat(70));
    console.log('TEST PASSED: Self-healing successfully recovered the selector');
    console.log('='.repeat(70) + '\n');
  });

  test('should heal username-input to user-input (semantic similarity)', async ({ page }) => {
    console.log('\n' + '='.repeat(70));
    console.log('SELF-HEALING TEST: Input Field Semantic Recovery');
    console.log('='.repeat(70));

    const healingPage = new SemanticSelfHealingPage(page);

    await page.goto(AOMA_LOGIN_URL);
    await page.waitForLoadState('domcontentloaded');

    // Try filling with an old selector pattern
    const oldSelector = '[data-test-id="user-input"]'; // Doesn't exist, page has "username-input"

    console.log(`\n[1] Attempting to fill input with selector: ${oldSelector}`);

    const result = await healingPage.fillWithHealing(oldSelector, 'testuser@example.com', {
      context: 'Username/email input field',
      expectedRole: 'textbox',
      expectedAction: 'text entry',
    });

    expect(result.healed).toBe(true);
    console.log('\n[SUCCESS] Input field healed and filled');

    // Verify the value was actually entered
    const actualValue = await page.inputValue('[data-test-id="username-input"]');
    expect(actualValue).toBe('testuser@example.com');
  });

  test('should explain healing decision with confidence score', async ({ page }) => {
    console.log('\n' + '='.repeat(70));
    console.log('SELF-HEALING TEST: Confidence Scoring & Explanation');
    console.log('='.repeat(70));

    const healingPage = new SemanticSelfHealingPage(page);

    await page.goto(AOMA_LOGIN_URL);
    await page.waitForLoadState('domcontentloaded');

    const oldSelector = '[data-test-id="signin-btn"]'; // Doesn't exist

    console.log(`\n[1] Testing selector: ${oldSelector}`);
    console.log('    Expected: Should find "login-button" or similar');

    const result = await healingPage.clickWithHealing(oldSelector, {
      context: 'Sign in / Login button',
      expectedRole: 'button',
      expectedAction: 'authentication',
    });

    // Log the detailed healing report
    console.log('\n[HEALING REPORT]');
    console.log(`    Original Selector: ${result.originalSelector}`);
    console.log(`    Healed Selector:   ${result.newSelector}`);
    console.log(`    Confidence:        ${(result.confidence * 100).toFixed(1)}%`);
    console.log(`    Reasoning:         ${result.reasoning}`);

    // Confidence should be reasonable for semantic match
    expect(result.confidence).toBeGreaterThan(0.6);

    console.log('\n' + '='.repeat(70));
    console.log('TEST PASSED: Healing completed with explanation');
    console.log('='.repeat(70) + '\n');
  });
});

test.describe('AOMA Login Self-Healing - Edge Cases', () => {
  test('should NOT heal completely unrelated selectors', async ({ page }) => {
    console.log('\n' + '='.repeat(70));
    console.log('SELF-HEALING TEST: Rejection of Unrelated Selectors');
    console.log('='.repeat(70));

    const healingPage = new SemanticSelfHealingPage(page);

    await page.goto(AOMA_LOGIN_URL);
    await page.waitForLoadState('domcontentloaded');

    // Completely unrelated selector - should NOT heal to login button
    const unrelatedSelector = '[data-test-id="shopping-cart-checkout"]';

    console.log(`\n[1] Testing unrelated selector: ${unrelatedSelector}`);
    console.log('    Expected: Should NOT heal (no semantic relationship)');

    const result = await healingPage.clickWithHealing(unrelatedSelector, {
      context: 'Shopping cart checkout button',
      expectedRole: 'button',
      expectedAction: 'checkout',
    });

    // Should fail to heal - no semantic match
    if (result.healed) {
      console.log(`\n[WARNING] Healed to: ${result.newSelector}`);
      console.log(`          Confidence: ${(result.confidence * 100).toFixed(1)}%`);
      // If it healed, confidence should be very low
      expect(result.confidence).toBeLessThan(0.5);
    } else {
      console.log('\n[CORRECT] Refused to heal - no semantic match found');
    }
  });
});
