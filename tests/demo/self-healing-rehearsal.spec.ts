/**
 * Self-Healing Three-Tier Demo Rehearsal
 *
 * This spec rehearses the three-tier self-healing demo for the North Star presentation.
 * It triggers each tier scenario and verifies the UI displays correctly.
 *
 * Run with: npx playwright test tests/demo/self-healing-rehearsal.spec.ts --headed
 *
 * Demo Scenarios:
 * - Tier 1: Simple ID change (button -> login-button) - Auto-heals
 * - Tier 2: Position shift within tolerance - Review queue
 * - Tier 3: Complete relocation to sidebar - Architect review
 */

import { test, expect } from "@playwright/test";

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";

test.describe("Self-Healing Demo Rehearsal", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the Test dashboard (Pillar 3)
    await page.goto(`${BASE_URL}/`);
    await page.waitForLoadState("networkidle");

    // Navigate to the Test pillar - may need to click through
    const testTab = page.locator('[data-testid="test-tab"], [aria-label*="Test"], button:has-text("Test")').first();
    if (await testTab.isVisible()) {
      await testTab.click();
      await page.waitForTimeout(500);
    }
  });

  test("API returns demo scenarios with correct structure", async ({ request }) => {
    // Verify the demo API returns all scenarios
    const response = await request.get(`${BASE_URL}/api/self-healing/demo`);
    expect(response.ok()).toBeTruthy();

    const data = await response.json();

    // Should have AOMA scenarios
    expect(data.aomaScenarios).toBe(3);
    expect(data.scenarios.length).toBeGreaterThanOrEqual(3);

    // Verify first three are AOMA login scenarios
    expect(data.scenarios[0].testName).toContain("AOMA Login Button");
    expect(data.scenarios[0].tier).toBe(1);
    expect(data.scenarios[1].tier).toBe(2);
    expect(data.scenarios[2].tier).toBe(3);

    // Log scenarios for demo prep
    console.log("\n=== DEMO SCENARIOS ===\n");
    data.scenarios.slice(0, 3).forEach((s: any, i: number) => {
      console.log(`Scenario ${i + 1}: ${s.testName}`);
      console.log(`  Tier: ${s.tier} - ${s.tierDescription}`);
      console.log(`  Original: ${s.originalSelector}`);
      console.log(`  Scenario: ${s.scenario}`);
      console.log(`  Narrative: ${s.demoNarrative}\n`);
    });
  });

  test("Trigger Tier 1 - Auto-Heal (ID Change)", async ({ request }) => {
    // Trigger Tier 1 demo scenario
    const response = await request.post(`${BASE_URL}/api/self-healing/demo`, {
      data: { tier: 1, useRealAI: false },
    });

    expect(response.ok()).toBeTruthy();
    const result = await response.json();

    // Verify Tier 1 behavior
    expect(result.tier).toBe(1);
    expect(result.status).toBe("success"); // Auto-healed
    expect(result.confidence).toBeGreaterThan(0.9);
    expect(result.test_name).toContain("AOMA Login Button");

    console.log("\n=== TIER 1 RESULT ===");
    console.log(`Test: ${result.test_name}`);
    console.log(`Status: ${result.status}`);
    console.log(`Tier: ${result.tier} - ${result.tierDescription}`);
    console.log(`Confidence: ${(result.confidence * 100).toFixed(0)}%`);
    console.log(`Original: ${result.original_selector}`);
    console.log(`Suggested: ${result.suggested_selector}`);
    console.log(`Similar tests affected: ${result.similar_tests_affected}`);
    console.log(`\nNarrative: ${result.demoNarrative}`);
  });

  test("Trigger Tier 2 - Review Queue (Position Shift)", async ({ request }) => {
    // Trigger Tier 2 demo scenario
    const response = await request.post(`${BASE_URL}/api/self-healing/demo`, {
      data: { tier: 2, useRealAI: false },
    });

    expect(response.ok()).toBeTruthy();
    const result = await response.json();

    // Verify Tier 2 behavior
    expect(result.tier).toBe(2);
    expect(result.status).toBe("review"); // Queued for review
    expect(result.confidence).toBeGreaterThan(0.6);
    expect(result.confidence).toBeLessThanOrEqual(0.9);

    console.log("\n=== TIER 2 RESULT ===");
    console.log(`Test: ${result.test_name}`);
    console.log(`Status: ${result.status}`);
    console.log(`Tier: ${result.tier} - ${result.tierDescription}`);
    console.log(`Confidence: ${(result.confidence * 100).toFixed(0)}%`);
    console.log(`Original: ${result.original_selector}`);
    console.log(`Suggested: ${result.suggested_selector}`);
    console.log(`Similar tests affected: ${result.similar_tests_affected}`);
    console.log(`\nNarrative: ${result.demoNarrative}`);
  });

  test("Trigger Tier 3 - Architect Review (Relocation)", async ({ request }) => {
    // Trigger Tier 3 demo scenario
    const response = await request.post(`${BASE_URL}/api/self-healing/demo`, {
      data: { tier: 3, useRealAI: false },
    });

    expect(response.ok()).toBeTruthy();
    const result = await response.json();

    // Verify Tier 3 behavior
    expect(result.tier).toBe(3);
    expect(result.status).toBe("review"); // Needs architect review
    expect(result.confidence).toBeLessThan(0.6);

    console.log("\n=== TIER 3 RESULT ===");
    console.log(`Test: ${result.test_name}`);
    console.log(`Status: ${result.status}`);
    console.log(`Tier: ${result.tier} - ${result.tierDescription}`);
    console.log(`Confidence: ${(result.confidence * 100).toFixed(0)}%`);
    console.log(`Original: ${result.original_selector}`);
    console.log(`Suggested: ${result.suggested_selector}`);
    console.log(`Healing strategy: ${result.healing_strategy}`);
    console.log(`\nNarrative: ${result.demoNarrative}`);
    console.log(`\n** This scenario shows a MAJOR change requiring human judgment **`);
  });

  test("Full Demo Walkthrough - All Three Tiers", async ({ page, request }) => {
    console.log("\n" + "=".repeat(60));
    console.log("NORTH STAR DEMO - SELF-HEALING TEST WALKTHROUGH");
    console.log("=".repeat(60) + "\n");

    // Step 1: Show the Test Dashboard
    console.log("STEP 1: Navigate to Test Dashboard");
    await page.goto(`${BASE_URL}/`);
    await page.waitForLoadState("networkidle");

    // Take screenshot of initial state
    await page.screenshot({ path: "test-results/demo-1-initial.png" });
    console.log("  - Screenshot saved: demo-1-initial.png\n");

    // Step 2: Trigger Tier 1 scenario
    console.log("STEP 2: Trigger Tier 1 - Simple ID Change");
    console.log("  Scenario: Developer renamed data-testid='button' to 'login-button'");
    console.log("  Expected: Auto-heal with >90% confidence\n");

    const tier1Response = await request.post(`${BASE_URL}/api/self-healing/demo`, {
      data: { tier: 1, useRealAI: false },
    });
    const tier1 = await tier1Response.json();
    console.log(`  Result: ${tier1.status} with ${(tier1.confidence * 100).toFixed(0)}% confidence`);
    console.log(`  Similar tests healed: ${tier1.similar_tests_affected}\n`);

    // Wait and take screenshot
    await page.waitForTimeout(1000);
    await page.screenshot({ path: "test-results/demo-2-tier1.png" });

    // Step 3: Trigger Tier 2 scenario
    console.log("STEP 3: Trigger Tier 2 - Position Shift");
    console.log("  Scenario: Button moved into a row with sibling");
    console.log("  Expected: Review queue with 60-90% confidence\n");

    const tier2Response = await request.post(`${BASE_URL}/api/self-healing/demo`, {
      data: { tier: 2, useRealAI: false },
    });
    const tier2 = await tier2Response.json();
    console.log(`  Result: ${tier2.status} with ${(tier2.confidence * 100).toFixed(0)}% confidence`);
    console.log(`  Similar tests affected: ${tier2.similar_tests_affected}\n`);

    await page.waitForTimeout(1000);
    await page.screenshot({ path: "test-results/demo-3-tier2.png" });

    // Step 4: Trigger Tier 3 scenario
    console.log("STEP 4: Trigger Tier 3 - Major Relocation");
    console.log("  Scenario: Login button moved from form to sidebar");
    console.log("  Expected: Architect review with <60% confidence\n");

    const tier3Response = await request.post(`${BASE_URL}/api/self-healing/demo`, {
      data: { tier: 3, useRealAI: false },
    });
    const tier3 = await tier3Response.json();
    console.log(`  Result: ${tier3.status} with ${(tier3.confidence * 100).toFixed(0)}% confidence`);
    console.log(`  This requires HUMAN JUDGMENT - queued for architect review\n`);

    await page.waitForTimeout(1000);
    await page.screenshot({ path: "test-results/demo-4-tier3.png" });

    // Step 5: Summary
    console.log("=".repeat(60));
    console.log("DEMO SUMMARY");
    console.log("=".repeat(60));
    console.log("\nThree-Tier Self-Healing System:");
    console.log(`  Tier 1 (Auto): ${tier1.status} - ${(tier1.confidence * 100).toFixed(0)}% confidence`);
    console.log(`  Tier 2 (Review): ${tier2.status} - ${(tier2.confidence * 100).toFixed(0)}% confidence`);
    console.log(`  Tier 3 (Architect): ${tier3.status} - ${(tier3.confidence * 100).toFixed(0)}% confidence`);
    console.log("\nKey Talking Points:");
    console.log("  - Trivial changes (ID renames) auto-heal immediately");
    console.log("  - Structural changes go to QA review queue");
    console.log("  - Major relocations need architect judgment");
    console.log("  - Human-in-the-loop ensures quality feedback");
    console.log("  - Cascade healing fixes multiple similar tests");
    console.log("=".repeat(60) + "\n");
  });

  test("Visual Check - Self-Healing Dashboard UI", async ({ page }) => {
    // Navigate to Test dashboard
    await page.goto(`${BASE_URL}/`);
    await page.waitForLoadState("networkidle");

    // Look for self-healing related elements
    const selfHealingTab = page.locator('button:has-text("Self-Healing"), [data-testid*="self-healing"]').first();

    if (await selfHealingTab.isVisible()) {
      await selfHealingTab.click();
      await page.waitForTimeout(500);

      // Check for key UI elements
      const statsVisible = await page.locator('text=/Total Tests|Auto-Healed|Success Rate/i').first().isVisible();
      const tierBadges = await page.locator('text=/Tier 1|Tier 2|Tier 3/i').count();

      console.log("\n=== UI VERIFICATION ===");
      console.log(`Stats visible: ${statsVisible}`);
      console.log(`Tier badges found: ${tierBadges}`);

      // Take screenshot of self-healing dashboard
      await page.screenshot({ path: "test-results/demo-self-healing-ui.png" });
      console.log("Screenshot saved: demo-self-healing-ui.png\n");
    }
  });
});

test.describe("Demo Script Reference", () => {
  test("Print Demo Script", async () => {
    console.log(`
================================================================================
NORTH STAR DEMO SCRIPT - SELF-HEALING TESTS (PILLAR 3)
================================================================================

OPENING (30 seconds)
--------------------
"The Test pillar demonstrates our AI-powered self-healing test system.
When UI changes break our automated tests, the AI automatically repairs them."

SHOW STATS (30 seconds)
-----------------------
"We're monitoring 247 tests. 89 have been automatically healed, 12 are pending
review. Our success rate is 94.2% with an average heal time of 2.3 seconds."

THREE-TIER SYSTEM (45 seconds)
------------------------------
"The system uses a three-tier confidence model:

 TIER 1 (Green): Auto-heal
   - High confidence fixes (>90%)
   - No human intervention needed
   - Example: A developer renamed button ID from 'button' to 'login-button'
   - The AI recognizes same position, same function - trivial change

 TIER 2 (Yellow): Review Queue
   - Medium confidence (60-90%)
   - AI suggests fix, QA reviews
   - Example: Button moved into a row with siblings
   - Structure changed but element still findable

 TIER 3 (Red): Architect Review
   - Low confidence (<60%)
   - Major structural changes
   - Example: Login button moved from form to sidebar
   - This needs human judgment - is it intentional? Should test be rewritten?"

LIVE DEMO (60 seconds)
----------------------
"Let me trigger each scenario in sequence..."

[Trigger Tier 1]
"First, a simple ID change. The test expects 'button' but finds 'login-button'.
The AI scores 96% confidence and auto-heals immediately."

[Trigger Tier 2]
"Now a position shift. The button moved into a new container.
78% confidence - queued for QA review to verify this is intentional."

[Trigger Tier 3]
"Finally, a major relocation - button moved to the sidebar.
42% confidence - this needs architect review. The HITL queue captures
the context so a human can make the final call."

CASCADE HEALING (30 seconds)
----------------------------
"Notice Tier 1 also healed 5 other tests that used the same selector.
That's cascade healing - fix one, fix many. Major time saver."

CLOSING (15 seconds)
--------------------
"This means our QA team spends less time maintaining tests and more time
building new coverage. The AI handles routine maintenance; humans handle
the judgment calls. That's the power of human-in-the-loop AI."

================================================================================
`);
  });
});
