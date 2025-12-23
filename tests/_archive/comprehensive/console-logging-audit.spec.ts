/**
 * COMPREHENSIVE CONSOLE LOGGING AUDIT
 *
 * Monitors ALL console activity:
 * - console.log
 * - console.warn
 * - console.error
 * - console.info
 * - console.debug
 *
 * Tracks patterns, frequency, and sources
 */

import { test, expect } from "@playwright/test";

interface ConsoleEntry {
  type: string;
  text: string;
  timestamp: number;
  url: string;
}

test.describe("Console Logging Audit @comprehensive", () => {
  let allConsoleMessages: ConsoleEntry[] = [];

  test.beforeEach(async ({ page }) => {
    allConsoleMessages = [];

    // Capture ALL console messages (not just errors)
    page.on("console", (msg) => {
      allConsoleMessages.push({
        type: msg.type(),
        text: msg.text(),
        timestamp: Date.now(),
        url: page.url(),
      });
    });

    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("Audit page load console activity", async ({ page }) => {
    console.log("🔍 Auditing console activity during page load...\n");

    await page.waitForTimeout(3000); // Give time for all console messages

    const byType = {
      log: allConsoleMessages.filter((m) => m.type === "log"),
      warn: allConsoleMessages.filter((m) => m.type === "warning"),
      error: allConsoleMessages.filter((m) => m.type === "error"),
      info: allConsoleMessages.filter((m) => m.type === "info"),
      debug: allConsoleMessages.filter((m) => m.type === "debug"),
    };

    console.log("📊 Console Activity Summary:");
    console.log(`  Total messages: ${allConsoleMessages.length}`);
    console.log(`  Logs: ${byType.log.length}`);
    console.log(`  Warnings: ${byType.warn.length}`);
    console.log(`  Errors: ${byType.error.length}`);
    console.log(`  Info: ${byType.info.length}`);
    console.log(`  Debug: ${byType.debug.length}`);

    if (byType.log.length > 0) {
      console.log("\n📝 Sample Logs (first 5):");
      byType.log.slice(0, 5).forEach((msg, i) => {
        console.log(`  ${i + 1}. ${msg.text.substring(0, 100)}`);
      });
    }

    if (byType.warn.length > 0) {
      console.log("\n⚠️  Warnings:");
      byType.warn.forEach((msg, i) => {
        console.log(`  ${i + 1}. ${msg.text.substring(0, 100)}`);
      });
    }

    if (byType.error.length > 0) {
      console.log("\n❌ Errors:");
      byType.error.forEach((msg, i) => {
        console.log(`  ${i + 1}. ${msg.text}`);
      });
    }

    // Filter out known acceptable errors
    const unhandledErrors = byType.error.filter((msg) => {
      const text = msg.text.toLowerCase();
      return !(text.includes("404") || text.includes("405") || text.includes("method not allowed"));
    });

    expect(unhandledErrors).toHaveLength(0);
  });

  test("Audit console activity during user interactions", async ({ page }) => {
    console.log("🔍 Auditing console during interactions...\n");

    // Reset for this test
    allConsoleMessages = [];

    // Click a suggestion
    const suggestion = page
      .locator("button")
      .filter({
        hasText: /How|What/i,
      })
      .first();

    const isVisible = await suggestion.isVisible().catch(() => false);
    if (isVisible) {
      console.log("  🖱️  Clicking suggestion...");
      await suggestion.click();
      await page.waitForTimeout(2000);
    }

    // Type in input
    const chatInput = page
      .locator('textarea[placeholder*="Ask"], input[placeholder*="Ask"]')
      .first();
    const isInputVisible = await chatInput.isVisible().catch(() => false);
    if (isInputVisible) {
      console.log("  ⌨️  Typing in chat input...");
      await chatInput.fill("Test message");
      await page.waitForTimeout(1000);
    }

    console.log("\n📊 Console Activity During Interactions:");
    console.log(`  Total messages: ${allConsoleMessages.length}`);

    const errors = allConsoleMessages.filter((m) => m.type === "error");
    const warnings = allConsoleMessages.filter((m) => m.type === "warning");

    console.log(`  Errors: ${errors.length}`);
    console.log(`  Warnings: ${warnings.length}`);

    if (errors.length > 0) {
      console.log("\n❌ Errors during interactions:");
      errors.forEach((msg, i) => {
        console.log(`  ${i + 1}. ${msg.text}`);
      });
    }

    // Filter acceptable errors
    const unhandledErrors = errors.filter((msg) => {
      const text = msg.text.toLowerCase();
      return !(text.includes("404") || text.includes("405") || text.includes("method not allowed"));
    });

    expect(unhandledErrors).toHaveLength(0);
  });

  test("Detect console spam (excessive logging)", async ({ page }) => {
    console.log("🔍 Detecting console spam...\n");

    await page.waitForTimeout(5000); // Monitor for 5 seconds

    // Count messages per type
    const messagesByText = new Map<string, number>();
    allConsoleMessages.forEach((msg) => {
      const key = msg.text.substring(0, 50); // Group similar messages
      messagesByText.set(key, (messagesByText.get(key) || 0) + 1);
    });

    // Find spam (repeated messages)
    const spam = Array.from(messagesByText.entries())
      .filter(([_, count]) => count > 5)
      .sort((a, b) => b[1] - a[1]);

    if (spam.length > 0) {
      console.log("⚠️  Potential console spam detected:");
      spam.forEach(([text, count]) => {
        console.log(`  - "${text}..." repeated ${count} times`);
      });
    } else {
      console.log("✅ No console spam detected");
    }

    // Spam check: no message should repeat more than 10 times
    const maxRepeats = Math.max(...Array.from(messagesByText.values()));
    expect(maxRepeats).toBeLessThan(10);
  });
});
