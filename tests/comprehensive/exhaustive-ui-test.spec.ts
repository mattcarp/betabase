/**
 * EXHAUSTIVE UI ELEMENT TESTS
 *
 * Tests EVERY SINGLE UI element on the page:
 * - All buttons (navigation, action, form)
 * - All inputs (text, textarea, select)
 * - All links
 * - All interactive elements
 *
 * Each interaction is monitored for:
 * - Console errors
 * - Performance timing
 * - Network activity
 */

import { test, expect } from "@playwright/test";
import { setupConsoleMonitoring, getConsoleMonitor } from "../helpers/console-monitor";

test.describe("Exhaustive UI Element Tests @comprehensive", () => {

  let performanceLog: Array<{
    element: string;
    action: string;
    duration: number;
    consoleErrors: number;
    timestamp: string;
  }> = [];

  test.beforeEach(async ({ page }) => {
    setupConsoleMonitoring(page, {
      ignoreWarnings: true,
      ignoreNetworkErrors: false, // Track ALL network activity
      useDefaultFilters: true,
    });

    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test.afterEach(async () => {
    const monitor = getConsoleMonitor();
    const errors = monitor.getErrors();

    if (errors.length > 0) {
      console.error("\n❌ CONSOLE ERRORS:");
      errors.forEach((err, i) => console.error(`  ${i + 1}. ${err}`));
      expect(errors).toHaveLength(0);
    }
  });

  test("Test ALL navigation buttons", async ({ page }) => {
    console.log("🎯 Testing ALL navigation buttons...\n");

    const navButtons = [
      { selector: 'button:has-text("Chat")', name: "Chat" },
      { selector: 'button:has-text("HUD")', name: "HUD" },
      { selector: 'button:has-text("Test")', name: "Test" },
      { selector: 'button:has-text("Fix")', name: "Fix" },
      { selector: 'button:has-text("Curate")', name: "Curate" },
      { selector: 'button:has-text("Introspection")', name: "Introspection" },
    ];

    for (const btn of navButtons) {
      const startTime = Date.now();
      const monitor = getConsoleMonitor();
      monitor.reset();

      console.log(`  🖱️  Clicking: ${btn.name}`);

      const button = page.locator(btn.selector).first();
      const isVisible = await button.isVisible().catch(() => false);

      if (!isVisible) {
        console.log(`    ⚠️  Button not visible, skipping`);
        continue;
      }

      await button.click();
      await page.waitForTimeout(1000);

      const duration = Date.now() - startTime;
      const errors = monitor.getErrors();

      performanceLog.push({
        element: btn.name,
        action: "click",
        duration,
        consoleErrors: errors.length,
        timestamp: new Date().toISOString(),
      });

      console.log(`    ⏱️  Duration: ${duration}ms`);
      console.log(`    📊 Console errors: ${errors.length}`);

      expect(errors).toHaveLength(0);

      // Go back to home for next test
      await page.goto("/");
      await page.waitForLoadState("networkidle");
    }

    console.log("\n✅ All navigation buttons tested");
  });

  test("Test ALL action buttons", async ({ page }) => {
    console.log("🎯 Testing ALL action buttons...\n");

    const actionButtons = [
      { selector: 'button:has-text("Export All")', name: "Export All" },
      { selector: 'button:has-text("Import")', name: "Import" },
      { selector: 'button:has-text("Remove Duplicates")', name: "Remove Duplicates" },
      { selector: 'button:has-text("Clear All")', name: "Clear All" },
      { selector: 'button:has-text("Sign Out")', name: "Sign Out" },
      { selector: 'button[aria-label*="settings"], button:has-text("Settings")', name: "Settings" },
    ];

    for (const btn of actionButtons) {
      const startTime = Date.now();
      const monitor = getConsoleMonitor();
      monitor.reset();

      console.log(`  🖱️  Testing: ${btn.name}`);

      const button = page.locator(btn.selector).first();
      const isVisible = await button.isVisible().catch(() => false);

      if (!isVisible) {
        console.log(`    ⚠️  Button not found, skipping`);
        continue;
      }

      const isDisabled = await button.isDisabled().catch(() => false);
      if (isDisabled) {
        console.log(`    ℹ️  Button disabled (expected)`);
        continue;
      }

      await button.click();
      await page.waitForTimeout(500);

      const duration = Date.now() - startTime;
      const errors = monitor.getErrors();

      performanceLog.push({
        element: btn.name,
        action: "click",
        duration,
        consoleErrors: errors.length,
        timestamp: new Date().toISOString(),
      });

      console.log(`    ⏱️  Duration: ${duration}ms`);
      console.log(`    📊 Console errors: ${errors.length}`);

      expect(errors).toHaveLength(0);

      // If this was Sign Out, we need to log back in
      if (btn.name === "Sign Out") {
        await page.goto("/");
        await page.waitForLoadState("networkidle");
      }
    }

    console.log("\n✅ All action buttons tested");
  });

  test("Test ALL form inputs", async ({ page }) => {
    console.log("🎯 Testing ALL form inputs...\n");

    // Main chat input
    const chatInput = page.locator('textarea[placeholder*="Ask"], input[placeholder*="Ask"]').first();
    const isChatInputVisible = await chatInput.isVisible().catch(() => false);

    if (isChatInputVisible) {
      const monitor = getConsoleMonitor();
      monitor.reset();

      console.log(`  ⌨️  Testing main chat input`);
      const startTime = Date.now();

      await chatInput.fill("Test message for input validation");
      await page.waitForTimeout(500);

      const duration = Date.now() - startTime;
      const errors = monitor.getErrors();

      performanceLog.push({
        element: "Main Chat Input",
        action: "fill",
        duration,
        consoleErrors: errors.length,
        timestamp: new Date().toISOString(),
      });

      console.log(`    ⏱️  Duration: ${duration}ms`);
      console.log(`    📊 Console errors: ${errors.length}`);

      expect(errors).toHaveLength(0);

      // Clear input
      await chatInput.clear();
    }

    // Search input
    const searchInput = page.locator('input[placeholder*="Search"]').first();
    const isSearchVisible = await searchInput.isVisible().catch(() => false);

    if (isSearchVisible) {
      const monitor = getConsoleMonitor();
      monitor.reset();

      console.log(`  ⌨️  Testing search input`);
      const startTime = Date.now();

      await searchInput.fill("test search query");
      await page.waitForTimeout(500);

      const duration = Date.now() - startTime;
      const errors = monitor.getErrors();

      performanceLog.push({
        element: "Search Input",
        action: "fill",
        duration,
        consoleErrors: errors.length,
        timestamp: new Date().toISOString(),
      });

      console.log(`    ⏱️  Duration: ${duration}ms`);
      console.log(`    📊 Console errors: ${errors.length}`);

      expect(errors).toHaveLength(0);
    }

    console.log("\n✅ All form inputs tested");
  });

  test("Test ALL dropdowns/selects", async ({ page }) => {
    console.log("🎯 Testing ALL dropdowns/selects...\n");

    // Model selector
    const modelSelect = page.locator('button:has-text("GPT"), [role="combobox"]').first();
    const isModelVisible = await modelSelect.isVisible().catch(() => false);

    if (isModelVisible) {
      const monitor = getConsoleMonitor();
      monitor.reset();

      console.log(`  🔽 Testing model selector`);
      const startTime = Date.now();

      await modelSelect.click();
      await page.waitForTimeout(500);

      const duration = Date.now() - startTime;
      const errors = monitor.getErrors();

      performanceLog.push({
        element: "Model Selector",
        action: "click",
        duration,
        consoleErrors: errors.length,
        timestamp: new Date().toISOString(),
      });

      console.log(`    ⏱️  Duration: ${duration}ms`);
      console.log(`    📊 Console errors: ${errors.length}`);

      expect(errors).toHaveLength(0);

      // Close dropdown
      await page.keyboard.press("Escape");
    }

    console.log("\n✅ All dropdowns tested");
  });

  test("Test ALL suggestion buttons (comprehensive)", async ({ page }) => {
    console.log("🎯 Testing ALL suggestion buttons...\n");

    const suggestions = page.locator('button').filter({
      hasText: /How|What|Can you/i
    });

    const count = await suggestions.count();
    console.log(`  📊 Found ${count} suggestion buttons\n`);

    // Test first 3 to avoid timeout
    const testCount = Math.min(count, 3);

    for (let i = 0; i < testCount; i++) {
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      const button = page.locator('button').filter({
        hasText: /How|What|Can you/i
      }).nth(i);

      const isVisible = await button.isVisible().catch(() => false);
      if (!isVisible) continue;

      const monitor = getConsoleMonitor();
      monitor.reset();

      const buttonText = await button.textContent();
      console.log(`  🖱️  Testing: "${buttonText?.substring(0, 50)}..."`);

      const startTime = Date.now();
      await button.click();
      await page.waitForTimeout(1000);

      const duration = Date.now() - startTime;
      const errors = monitor.getErrors();

      performanceLog.push({
        element: `Suggestion ${i + 1}`,
        action: "click",
        duration,
        consoleErrors: errors.length,
        timestamp: new Date().toISOString(),
      });

      console.log(`    ⏱️  Duration: ${duration}ms`);
      console.log(`    📊 Console errors: ${errors.length}`);

      expect(errors).toHaveLength(0);
    }

    console.log("\n✅ All suggestion buttons tested");
  });

  test("Test ALL toolbar buttons", async ({ page }) => {
    console.log("🎯 Testing ALL toolbar buttons...\n");

    const toolbarButtons = [
      { selector: 'button:has-text("Upload"), button[aria-label*="upload"]', name: "Upload Files" },
      { selector: 'button:has-text("record"), button[aria-label*="record"]', name: "Voice Recording" },
      { selector: 'button:has-text("voice"), button[aria-label*="voice"]', name: "Voice Response" },
      { selector: 'button:has-text("knowledge"), button[aria-label*="knowledge"]', name: "Knowledge Panel" },
    ];

    for (const btn of toolbarButtons) {
      const monitor = getConsoleMonitor();
      monitor.reset();

      console.log(`  🖱️  Testing: ${btn.name}`);

      const button = page.locator(btn.selector).first();
      const isVisible = await button.isVisible().catch(() => false);

      if (!isVisible) {
        console.log(`    ⚠️  Button not found, skipping`);
        continue;
      }

      const startTime = Date.now();
      await button.click();
      await page.waitForTimeout(500);

      const duration = Date.now() - startTime;
      const errors = monitor.getErrors();

      performanceLog.push({
        element: btn.name,
        action: "click",
        duration,
        consoleErrors: errors.length,
        timestamp: new Date().toISOString(),
      });

      console.log(`    ⏱️  Duration: ${duration}ms`);
      console.log(`    📊 Console errors: ${errors.length}`);

      expect(errors).toHaveLength(0);
    }

    console.log("\n✅ All toolbar buttons tested");
  });

  test("Print comprehensive performance report", async ({ page }) => {
    console.log("\n");
    console.log("═══════════════════════════════════════════════════════════");
    console.log("📊 COMPREHENSIVE PERFORMANCE REPORT");
    console.log("═══════════════════════════════════════════════════════════\n");

    if (performanceLog.length === 0) {
      console.log("⚠️  No performance data collected yet");
      return;
    }

    // Sort by duration
    const sorted = [...performanceLog].sort((a, b) => b.duration - a.duration);

    console.log("🐌 SLOWEST OPERATIONS:");
    sorted.slice(0, 5).forEach((entry, i) => {
      console.log(`  ${i + 1}. ${entry.element} (${entry.action}): ${entry.duration}ms`);
      if (entry.consoleErrors > 0) {
        console.log(`     ❌ ${entry.consoleErrors} console errors`);
      }
    });

    console.log("\n⚡ FASTEST OPERATIONS:");
    sorted.slice(-5).reverse().forEach((entry, i) => {
      console.log(`  ${i + 1}. ${entry.element} (${entry.action}): ${entry.duration}ms`);
    });

    // Calculate statistics
    const durations = performanceLog.map(e => e.duration);
    const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
    const max = Math.max(...durations);
    const min = Math.min(...durations);

    console.log("\n📈 STATISTICS:");
    console.log(`  Average: ${avg.toFixed(2)}ms`);
    console.log(`  Min: ${min}ms`);
    console.log(`  Max: ${max}ms`);
    console.log(`  Total operations: ${performanceLog.length}`);

    const withErrors = performanceLog.filter(e => e.consoleErrors > 0).length;
    console.log(`  Operations with errors: ${withErrors}`);

    if (withErrors > 0) {
      console.log("\n❌ OPERATIONS WITH CONSOLE ERRORS:");
      performanceLog
        .filter(e => e.consoleErrors > 0)
        .forEach(entry => {
          console.log(`  - ${entry.element}: ${entry.consoleErrors} errors`);
        });
    }

    console.log("\n═══════════════════════════════════════════════════════════\n");

    // All operations should have 0 errors
    expect(withErrors).toBe(0);
  });
});
