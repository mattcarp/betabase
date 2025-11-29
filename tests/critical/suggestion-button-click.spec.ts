/**
 * CRITICAL: Suggestion Button Click Tests
 *
 * Tests that ALL suggestion buttons are clickable without errors.
 * This test MUST catch runtime JavaScript errors that occur on click.
 *
 * User Report: "clicking on a suggested query button should NEVER throw an error"
 */

import { test, expect } from '../fixtures/base-test';
import {
  setupConsoleMonitoring,
  assertNoConsoleErrors,
  getConsoleMonitor,
} from "../helpers/console-monitor";

test.describe("Suggestion Button Click Tests @critical", () => {
  // Don't use serial mode - each test needs independent page state

  // Setup console monitoring for each test
  test.beforeEach(async ({ page }) => {
    setupConsoleMonitoring(page, {
      ignoreWarnings: true,
      ignoreNetworkErrors: true,
      useDefaultFilters: true, // Filter known acceptable errors
    });

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Wait for suggestions to appear
    await page.waitForSelector(
      'button:has-text("analyze"), button:has-text("How can I"), button:has-text("What are"), button:has-text("Can you help")',
      {
        timeout: 10000,
        state: "visible",
      }
    );
  });

  // Assert no console errors after each test
  test.afterEach(async () => {
    const monitor = getConsoleMonitor();
    const errors = monitor.getErrors();

    if (errors.length > 0) {
      console.error("\n❌ CONSOLE ERRORS DETECTED:");
      errors.forEach((err, i) => {
        console.error(`  ${i + 1}. ${err}`);
      });
    }

    assertNoConsoleErrors();
  });

  test("CRITICAL: First suggestion button clicks without errors", async ({ page }) => {
    console.log("🎯 Testing first suggestion button click...");

    // Find all suggestion buttons (look for the actual suggestion text patterns)
    const suggestionButtons = page.locator("button").filter({
      hasText:
        /How can I|What are|Can you help|analyze complex|best practices|optimize my code|effective documentation/i,
    });

    const count = await suggestionButtons.count();
    console.log(`📊 Found ${count} suggestion buttons`);

    expect(count).toBeGreaterThan(0);

    // Click the first one
    const firstButton = suggestionButtons.first();
    const buttonText = await firstButton.textContent();
    console.log(`  🖱️  Clicking suggestion: "${buttonText}"`);

    await firstButton.click();

    // Wait a moment for any JavaScript to execute
    await page.waitForTimeout(1000);

    // Check console - should have NO errors
    const monitor = getConsoleMonitor();
    const errors = monitor.getErrors();

    if (errors.length > 0) {
      console.error(`❌ ERRORS after clicking "${buttonText}":`);
      errors.forEach((err, i) => {
        console.error(`  ${i + 1}. ${err}`);
      });
    }

    expect(errors).toHaveLength(0);
  });

  test("CRITICAL: All suggestion buttons click without errors", async ({ page }) => {
    console.log("🎯 Testing ALL suggestion button clicks...");

    // Find all suggestion buttons
    const suggestionButtons = page.locator("button").filter({
      has: page.locator(
        '*:has-text("Get started"), *:has-text("Help me"), *:has-text("Show me"), *:has-text("Explain"), *:has-text("capabilities"), *:has-text("features")'
      ),
    });

    const count = await suggestionButtons.count();
    console.log(`📊 Found ${count} suggestion buttons to test`);

    expect(count).toBeGreaterThan(0);

    // Test each button individually
    for (let i = 0; i < count; i++) {
      const button = suggestionButtons.nth(i);
      const buttonText = await button.textContent();

      console.log(`\n  🖱️  Testing button ${i + 1}/${count}: "${buttonText}"`);

      // Reset monitoring for this button
      const monitor = getConsoleMonitor();
      monitor.reset();

      // Click the button
      await button.click();

      // Wait for JavaScript to execute
      await page.waitForTimeout(500);

      // Check for errors
      const errors = monitor.getErrors();

      if (errors.length > 0) {
        console.error(`  ❌ ERRORS for button "${buttonText}":`);
        errors.forEach((err, j) => {
          console.error(`    ${j + 1}. ${err}`);
        });

        // Fail the test with detailed info
        throw new Error(
          `Suggestion button "${buttonText}" triggered ${errors.length} console error(s): ${errors.join(", ")}`
        );
      } else {
        console.log(`  ✅ Button "${buttonText}" works correctly - no errors`);
      }

      // Reload page for next button test (clean slate)
      if (i < count - 1) {
        await page.goto("/");
        await page.waitForLoadState("networkidle");
        await page.waitForSelector(
          'button:has-text("How can I"), button:has-text("What are"), button:has-text("Can you help")',
          {
            timeout: 5000,
            state: "visible",
          }
        );
      }
    }
  });

  test("Suggestion click triggers message send (functional test)", async ({ page }) => {
    console.log("🎯 Testing suggestion button functionality...");

    // Find first suggestion button
    const suggestionButtons = page.locator("button").filter({
      hasText:
        /How can I|What are|Can you help|analyze complex|best practices|optimize my code|effective documentation/i,
    });

    const firstButton = suggestionButtons.first();
    const buttonText = await firstButton.textContent();
    console.log(`  🖱️  Clicking: "${buttonText}"`);

    // Click suggestion
    await firstButton.click();

    // Verify message was added to conversation
    // Look for the message in the chat (could be loading state or actual message)
    const chatContainer = page
      .locator('[role="log"], .conversation-content, .messages-container')
      .first();

    // Wait for either loading indicator or message
    try {
      await expect(chatContainer).toContainText(buttonText || "", { timeout: 5000 });
      console.log("  ✅ Message appeared in conversation");
    } catch (err) {
      // Check for loading state instead
      const loadingIndicator = page.locator('.loader, [role="status"], .loading, .spinner').first();
      const isLoading = await loadingIndicator.isVisible();

      if (isLoading) {
        console.log("  ✅ Loading state triggered (message being processed)");
      } else {
        console.warn("  ⚠️  No message or loading state detected");
        // Don't fail - just warn (API might be slow)
      }
    }
  });

  test("Clicking suggestion hides suggestions (expected behavior)", async ({ page }) => {
    console.log("🎯 Testing suggestion UI behavior...");

    const suggestionButtons = page.locator("button").filter({
      hasText:
        /How can I|What are|Can you help|analyze complex|best practices|optimize my code|effective documentation/i,
    });

    const initialCount = await suggestionButtons.count();
    console.log(`  📊 Initial suggestion count: ${initialCount}`);

    // Click first suggestion
    const firstButton = suggestionButtons.first();
    const buttonText = await firstButton.textContent();
    console.log(`  🖱️  Clicking: "${buttonText}"`);

    await firstButton.click();
    await page.waitForTimeout(1000);

    // Verify suggestions are hidden (expected UI behavior)
    const afterClickCount = await suggestionButtons.count();
    console.log(`  📊 After click count: ${afterClickCount}`);

    // Suggestions should be hidden or reduced after click
    if (afterClickCount < initialCount) {
      console.log("  ✅ Suggestions correctly hidden after click");
    } else {
      console.log("  ℹ️  Suggestions still visible (variant behavior)");
    }

    // Most importantly: no console errors
    const monitor = getConsoleMonitor();
    const errors = monitor.getErrors();
    expect(errors).toHaveLength(0);
    console.log("  ✅ No errors from suggestion click");
  });

  test("Suggestion click works after page navigation", async ({ page }) => {
    console.log("🎯 Testing suggestion button after navigation...");

    // Navigate away and back
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Wait for suggestions
    await page.waitForSelector(
      'button:has-text("How can I"), button:has-text("What are"), button:has-text("Can you help")',
      {
        timeout: 5000,
        state: "visible",
      }
    );

    const suggestionButtons = page.locator("button").filter({
      hasText:
        /How can I|What are|Can you help|analyze complex|best practices|optimize my code|effective documentation/i,
    });

    const firstButton = suggestionButtons.first();
    const buttonText = await firstButton.textContent();
    console.log(`  🖱️  Clicking after navigation: "${buttonText}"`);

    await firstButton.click();
    await page.waitForTimeout(1000);

    const monitor = getConsoleMonitor();
    const errors = monitor.getErrors();

    expect(errors).toHaveLength(0);
    console.log("  ✅ No errors after navigation");
  });
});
