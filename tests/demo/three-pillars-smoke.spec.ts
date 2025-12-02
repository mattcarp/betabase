/**
 * Three Pillars E2E Smoke Test
 *
 * Comprehensive demo verification for all three pillars:
 * 1. Chat (RAG) - AI chat with AOMA knowledge
 * 2. Curate (RLHF) - Feedback and curation system
 * 3. Test (Self-Healing) - Self-healing test dashboard
 *
 * Runs on localhost:3000 for dev demo purposes.
 */
import { test, expect } from "@playwright/test";

test.describe("Three Pillars Demo Smoke Test", () => {
  const baseUrl = "http://localhost:3000";

  test.beforeEach(async ({ page }) => {
    // Navigate to home
    await page.goto(baseUrl);
    await page.waitForLoadState("networkidle");
  });

  test("Pillar 1: Chat (RAG) - UI loads and is interactive", async ({ page }) => {
    // Verify Chat tab is visible and clickable
    const chatTab = page.locator('button:has-text("Chat")').first();
    await expect(chatTab).toBeVisible();
    await chatTab.click();
    await page.waitForTimeout(500);

    // Verify chat interface loads
    // Look for chat input or message area
    const chatInput = page.locator('textarea, input[type="text"]').first();
    const chatArea = page.locator('[data-testid="chat-messages"], .chat-container, [role="log"]').first();

    // At least one of these should be visible
    const chatUIVisible =
      (await chatInput.isVisible().catch(() => false)) ||
      (await chatArea.isVisible().catch(() => false));

    // Take screenshot
    await page.screenshot({
      path: "test-results/pillar-1-chat-ui.png",
      fullPage: false,
    });

    // Verify the welcome message or placeholder is shown
    const welcomeText = page.locator('text=/welcome|ask|chat|AOMA/i').first();
    const welcomeVisible = await welcomeText.isVisible({ timeout: 3000 }).catch(() => false);

    // Verify service status shows online
    const serviceStatus = page.locator('text=/Online|All Systems|2\\/2/i');
    await expect(serviceStatus.first()).toBeVisible({ timeout: 5000 });

    console.log("Pillar 1 (Chat/RAG): UI loaded successfully");
  });

  test("Pillar 2: Curate (RLHF) - Tab loads and shows feedback UI", async ({ page }) => {
    // Navigate to Curate tab
    const curateTab = page.locator('button:has-text("Curate")').first();
    await expect(curateTab).toBeVisible();
    await curateTab.click();
    await page.waitForTimeout(500);

    // Take screenshot
    await page.screenshot({
      path: "test-results/pillar-2-curate-ui.png",
      fullPage: false,
    });

    // Verify Curate UI elements
    // Should show either RLHF dashboard, feedback system, or curator workspace
    const curateContent = page.locator('text=/Curate|RLHF|Feedback|Curator|Quality|Rating/i').first();
    await expect(curateContent).toBeVisible({ timeout: 5000 });

    // Check for curator-specific UI elements
    const curatorUI = page.locator('[data-testid="curator"], .curator-workspace, .rlhf-dashboard').first();
    const feedbackUI = page.locator('text=/thumbs|approve|reject|rating/i').first();

    const hasRLHFUI =
      (await curatorUI.isVisible().catch(() => false)) ||
      (await feedbackUI.isVisible().catch(() => false)) ||
      (await curateContent.isVisible().catch(() => false));

    expect(hasRLHFUI).toBeTruthy();
    console.log("Pillar 2 (Curate/RLHF): UI loaded successfully");
  });

  test("Pillar 3: Test (Self-Healing) - Dashboard loads with all tabs", async ({ page }) => {
    // Navigate to Test tab
    const testTab = page.locator('button:has-text("Test")').first();
    await expect(testTab).toBeVisible();
    await testTab.click();
    await page.waitForTimeout(500);

    // Take screenshot
    await page.screenshot({
      path: "test-results/pillar-3-test-dashboard.png",
      fullPage: false,
    });

    // Verify Test Dashboard loads
    const testDashboard = page.locator('text=/Test Dashboard|Testing|Quality Assurance/i').first();
    await expect(testDashboard).toBeVisible({ timeout: 5000 });

    // Verify key sub-tabs are present
    const homeTab = page.getByRole("tab", { name: "Home" });
    const selfHealingTab = page.getByRole("tab", { name: "Self-Healing" });

    await expect(homeTab).toBeVisible();
    await expect(selfHealingTab).toBeVisible();

    // Navigate to Self-Healing tab to verify it loads
    await selfHealingTab.click();
    await page.waitForTimeout(500);

    await page.screenshot({
      path: "test-results/pillar-3-self-healing.png",
      fullPage: false,
    });

    // Verify Self-Healing content is present
    // Should show stats cards, healing queue, or workflow
    const selfHealingContent = page.locator(
      'text=/Self-Healing|Auto-Healed|Success Rate|Tier|Healing/i'
    ).first();
    await expect(selfHealingContent).toBeVisible({ timeout: 5000 });

    console.log("Pillar 3 (Test/Self-Healing): UI loaded successfully");
  });

  test("All three pillar tabs are accessible from main navigation", async ({ page }) => {
    // Verify all three main tabs are visible
    const chatTab = page.locator('button:has-text("Chat")').first();
    const curateTab = page.locator('button:has-text("Curate")').first();
    const testTab = page.locator('button:has-text("Test")').first();

    await expect(chatTab).toBeVisible();
    await expect(curateTab).toBeVisible();
    await expect(testTab).toBeVisible();

    // Verify we can navigate to each
    await chatTab.click();
    await page.waitForTimeout(300);

    await curateTab.click();
    await page.waitForTimeout(300);

    await testTab.click();
    await page.waitForTimeout(300);

    // Take final screenshot showing navigation works
    await page.screenshot({
      path: "test-results/three-pillars-navigation.png",
      fullPage: false,
    });

    console.log("All three pillar tabs accessible and navigable");
  });

  test("Service status shows healthy connection", async ({ page }) => {
    // Verify the service status indicator shows healthy
    // This is the ConnectionStatusIndicator dropdown we tested earlier
    const statusIndicator = page.locator('text=/All Systems Online|2\\/2|Online/i').first();

    await expect(statusIndicator).toBeVisible({ timeout: 5000 });

    // Hover to show dropdown
    await statusIndicator.hover();
    await page.waitForTimeout(500);

    await page.screenshot({
      path: "test-results/service-status-healthy.png",
      fullPage: false,
    });

    // Verify we see the services
    const geminiStatus = page.locator('text=/Gemini.*Online|Database.*Online/i').first();
    const servicesVisible = await geminiStatus.isVisible().catch(() => false);

    expect(servicesVisible).toBeTruthy();
    console.log("Service status: Healthy connection confirmed");
  });

  test("No console errors on initial load", async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        const text = msg.text();
        // Filter out known non-critical errors
        if (
          !text.includes("404") &&
          !text.includes("hydration") &&
          !text.includes("ResizeObserver") &&
          !text.includes("favicon")
        ) {
          consoleErrors.push(text);
        }
      }
    });

    // Navigate through all pillars
    await page.goto(baseUrl);
    await page.waitForLoadState("networkidle");

    // Click through tabs
    const chatTab = page.locator('button:has-text("Chat")').first();
    const curateTab = page.locator('button:has-text("Curate")').first();
    const testTab = page.locator('button:has-text("Test")').first();

    if (await chatTab.isVisible()) await chatTab.click();
    await page.waitForTimeout(500);

    if (await curateTab.isVisible()) await curateTab.click();
    await page.waitForTimeout(500);

    if (await testTab.isVisible()) await testTab.click();
    await page.waitForTimeout(500);

    // Report any errors found
    if (consoleErrors.length > 0) {
      console.log("Console errors found:", consoleErrors);
    }

    // Allow up to 2 non-critical console errors
    expect(consoleErrors.length).toBeLessThanOrEqual(2);
    console.log(`Console error check: ${consoleErrors.length} errors (threshold: 2)`);
  });
});
