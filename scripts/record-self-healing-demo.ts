/**
 * Record Self-Healing Demo
 *
 * This script captures a video of the self-healing test demonstration.
 *
 * ============================================================================
 * WHAT THE DEMO SHOWS
 * ============================================================================
 *
 * THE SCENARIO:
 * A developer refactors a checkout button during a code cleanup sprint.
 * The button's ID changes from "#submit-btn" to "#order-submit-button".
 * This is a VERY common real-world scenario that breaks automated tests.
 *
 * THE PROBLEM:
 * The Playwright test uses `page.click('#submit-btn')` to complete checkout.
 * After the refactor, this selector no longer exists - test fails with timeout.
 * Traditionally, a QA engineer would need to:
 *   1. Notice the failure
 *   2. Investigate the cause
 *   3. Find the new selector
 *   4. Update the test
 *   5. Commit and push
 * This takes 15-30 minutes per broken test, and there could be dozens.
 *
 * THE SOLUTION (Self-Healing):
 * 1. AI detects the test failure
 * 2. AI loads the DOM snapshot from the last passing run
 * 3. AI compares with current DOM to find what changed
 * 4. AI identifies the button by: text content, role, position, siblings
 * 5. AI finds a match: same text "Complete Purchase", same position
 * 6. AI calculates confidence: 94% (above 90% = Tier 1 = auto-heal)
 * 7. AI updates the test selector automatically
 * 8. AI re-runs the test to verify the fix works
 * 9. Test passes - NO HUMAN INTERVENTION REQUIRED
 *
 * TIME SAVED: 15-30 minutes per test × dozens of tests = HOURS saved per sprint
 *
 * ============================================================================
 * DEMO FLOW (approximately 55 seconds)
 * ============================================================================
 *
 * 0:00 - 0:05  Navigate to the Test tab and Self-Healing section
 * 0:05 - 0:08  Show the Interactive Demo ready state
 * 0:08 - 0:14  Original test runs against TechStore checkout (PASSES)
 * 0:14 - 0:22  UI CHANGED: Developer renamed button ID
 *              (iframe shows the change in the Element Inspector)
 * 0:22 - 0:30  Test runs again and FAILS (can't find #submit-btn)
 * 0:30 - 0:42  Self-Healing AI analyzes the DOM:
 *              - Loads previous DOM snapshot
 *              - Compares with current state
 *              - Analyzes by text, role, position
 *              - Finds candidate match
 * 0:42 - 0:48  AI applies fix: #submit-btn -> #order-submit-button (94% confidence)
 * 0:48 - 0:55  Healed test runs and PASSES
 *
 * ============================================================================
 * OUTPUT
 * ============================================================================
 *
 * Video saved to: ~/Desktop/playwright-screencasts/self-healing-demo-{timestamp}.webm
 *
 * ============================================================================
 */

import { chromium } from 'playwright';
import * as path from 'path';
import * as os from 'os';

async function recordSelfHealingDemo() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const outputDir = path.join(os.homedir(), 'Desktop', 'playwright-screencasts');
  const videoPath = path.join(outputDir, `self-healing-demo-${timestamp}`);

  console.log('='.repeat(70));
  console.log('SELF-HEALING DEMO RECORDING');
  console.log('='.repeat(70));
  console.log('');
  console.log('This will record the self-healing test demonstration showing:');
  console.log('  1. Original test passing with #submit-btn');
  console.log('  2. Developer refactors button ID to #order-submit-button');
  console.log('  3. Test fails - selector not found');
  console.log('  4. AI analyzes DOM, finds match with 94% confidence');
  console.log('  5. AI auto-heals the test');
  console.log('  6. Healed test passes - no human intervention');
  console.log('');
  console.log(`Video will be saved to: ${videoPath}.webm`);
  console.log('='.repeat(70));
  console.log('');

  const browser = await chromium.launch({
    headless: false, // Show the browser so user can see the demo
    channel: 'chrome',
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    recordVideo: {
      dir: outputDir,
      size: { width: 1920, height: 1080 },
    },
  });

  const page = await context.newPage();

  try {
    // Step 1: Navigate to the app
    console.log('Step 1: Navigating to localhost:3000...');
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(3000); // Give extra time for React to hydrate

    // Step 2: Click Test tab in the right sidebar
    console.log('Step 2: Clicking Test tab...');
    await page.click('button:has-text("Test")');
    await page.waitForTimeout(2000);

    // Step 3: Click Self-Healing subtab (it's a TabsTrigger with value="self-healing")
    console.log('Step 3: Clicking Self-Healing subtab...');
    // Use text matching since Radix UI TabsTrigger renders as button with text
    await page.click('button:has-text("Self-Healing")');
    await page.waitForTimeout(2000);

    // Step 4: Click Interactive Demo tab (TabsTrigger with value="demo")
    console.log('Step 4: Clicking Interactive Demo tab...');
    // The Interactive Demo tab is inside the SelfHealingTestViewer
    await page.click('button:has-text("Interactive Demo")');
    await page.waitForTimeout(1500);

    // Step 5: Scroll down to make the demo visible
    console.log('Step 5: Scrolling down to show the demo area...');
    await page.evaluate(() => {
      // Find the iframe that shows the demo app and scroll it into view
      const demoIframe = document.querySelector('iframe[src*="self-healing"]');
      if (demoIframe) {
        demoIframe.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        // Fallback: scroll down by 500px
        window.scrollBy(0, 500);
      }
    });
    await page.waitForTimeout(1000);

    // Step 6: Click Run Demo button
    console.log('Step 6: Clicking Run Demo button...');
    const runDemoButton = page.locator('button:has-text("Run Demo")').first();
    await runDemoButton.click();

    // Step 7: Wait for demo to complete (now ~55 seconds with slower timing)
    console.log('Step 7: Waiting for demo to complete (~55 seconds)...');
    console.log('');
    console.log('Demo stages:');
    console.log('  [0:00] Original test running...');
    await page.waitForTimeout(6000);
    console.log('  [0:06] Original test PASSED');
    await page.waitForTimeout(4000);
    console.log('  [0:10] UI CHANGED - Developer renamed button ID');
    await page.waitForTimeout(6000);
    console.log('  [0:16] Test running against updated UI...');
    await page.waitForTimeout(6000);
    console.log('  [0:22] TEST FAILED - Selector not found');
    await page.waitForTimeout(8000);
    console.log('  [0:30] Self-Healing AI analyzing DOM...');
    await page.waitForTimeout(10000);
    console.log('  [0:40] Match found with 94% confidence');
    await page.waitForTimeout(6000);
    console.log('  [0:46] Auto-heal applied');
    await page.waitForTimeout(6000);
    console.log('  [0:52] Healed test PASSED!');
    await page.waitForTimeout(5000);

    // Step 8: Hold on the final state
    console.log('Step 8: Holding on final state...');
    await page.waitForTimeout(3000);

    console.log('');
    console.log('='.repeat(70));
    console.log('Demo recording complete!');
    console.log('='.repeat(70));

  } catch (error) {
    console.error('Error during recording:', error);
  } finally {
    // Close context to finalize video
    await context.close();
    await browser.close();
  }

  console.log(`\nVideo saved to: ${outputDir}/`);
  console.log('Look for the most recent .webm file');
}

recordSelfHealingDemo().catch(console.error);
