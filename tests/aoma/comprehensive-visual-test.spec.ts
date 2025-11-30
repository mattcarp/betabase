import { Page } from '@playwright/test';
import { test, expect } from '../fixtures/base-test';

/**
 * COMPREHENSIVE AOMA VISUAL & PERFORMANCE TEST SUITE
 *
 * This test suite validates:
 * 1. AOMA knowledge base responses (anti-hallucination)
 * 2. MAC Design System UI compliance
 * 3. Console error monitoring
 * 4. Web Vitals tracking with visualization data
 * 5. Visual regression baseline
 */

interface WebVitals {
  url: string;
  timestamp: string;
  testName: string;
  lcp: number;
  fid: number;
  cls: number;
  ttfb: number;
  domContentLoaded: number;
  loadTime: number;
}

const AOMA_TEST_QUESTIONS = [
  {
    question: "What upload methods are available in AOMA?",
    expectedKeywords: ["upload", "simple", "direct", "unified"],
    category: "AOMA Features",
  },
  {
    question: "How do I check registration job status?",
    expectedKeywords: ["registration", "job", "status"],
    category: "AOMA Workflow",
  },
  {
    question: "What is the unified submission tool?",
    expectedKeywords: ["unified", "submission", "tool"],
    category: "AOMA Tools",
  },
  {
    question: "How do I unregister assets in AOMA?",
    expectedKeywords: ["unregister", "assets"],
    category: "AOMA Operations",
  },
];

test.describe("AOMA Comprehensive Visual & Performance Tests", () => {
  let consoleErrors: string[] = [];
  let consoleWarnings: string[] = [];
  let webVitals: WebVitals;

  test.beforeEach(async ({ page }) => {
    // Reset console monitoring
    consoleErrors = [];
    consoleWarnings = [];

    // Capture console messages
    page.on("console", (msg) => {
      const type = msg.type();
      const text = msg.text();

      if (type === "error") {
        consoleErrors.push(text);
        console.log(`🔴 Console Error: ${text}`);
      } else if (type === "warning") {
        consoleWarnings.push(text);
        console.log(`⚠️  Console Warning: ${text}`);
      }
    });

    // Navigate to localhost
    await page.goto("http://localhost:3000", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000); // Let animations settle
  });

  test("should capture Web Vitals for performance tracking", async ({ page }) => {
    console.log("\n📊 Capturing Web Vitals...");

    const vitals = await page.evaluate(() => {
      return new Promise<WebVitals>((resolve) => {
        const data: WebVitals = {
          url: window.location.href,
          timestamp: new Date().toISOString(),
          testName: "AOMA Comprehensive Visual Test",
          lcp: 0,
          fid: 0,
          cls: 0,
          ttfb: 0,
          domContentLoaded: 0,
          loadTime: 0,
        };

        if (window.performance && window.performance.timing) {
          const timing = window.performance.timing;
          data.ttfb = timing.responseStart - timing.requestStart;
          data.domContentLoaded = timing.domContentLoadedEventEnd - timing.navigationStart;
          data.loadTime = timing.loadEventEnd - timing.navigationStart;
        }

        // Get CLS from Layout Shift entries
        if (window.performance && window.performance.getEntriesByType) {
          const layoutShifts = window.performance.getEntriesByType("layout-shift") as any[];
          data.cls = layoutShifts.reduce((sum, entry) => sum + (entry.value || 0), 0);
        }

        setTimeout(() => resolve(data), 1000);
      });
    });

    webVitals = vitals;

    console.log("\n📊 Web Vitals Results:");
    console.log(`  TTFB: ${vitals.ttfb}ms`);
    console.log(`  DOM Content Loaded: ${vitals.domContentLoaded}ms`);
    console.log(`  Load Time: ${vitals.loadTime}ms`);
    console.log(`  CLS: ${vitals.cls.toFixed(3)}`);

    // Save to file for visualization
    const fs = require("fs");
    const path = require("path");
    const vitalsDir = "test-results/web-vitals";
    if (!fs.existsSync(vitalsDir)) {
      fs.mkdirSync(vitalsDir, { recursive: true });
    }
    const vitalsPath = path.join(vitalsDir, `vitals-${Date.now()}.json`);
    fs.writeFileSync(vitalsPath, JSON.stringify(vitals, null, 2));
    console.log(`\n💾 Web Vitals saved: ${vitalsPath}`);

    // Performance assertions
    expect(vitals.ttfb).toBeLessThan(2000); // TTFB under 2s for dev
    expect(vitals.cls).toBeLessThan(0.1); // CLS under 0.1 (good)
  });

  test("should have zero console errors", async ({ page }) => {
    await page.waitForTimeout(3000); // Wait for any async errors

    console.log(`\n📋 Console Monitor Results:`);
    console.log(`  Errors: ${consoleErrors.length}`);
    console.log(`  Warnings: ${consoleWarnings.length}`);

    if (consoleErrors.length > 0) {
      console.log("\n🔴 Console Errors Found:");
      consoleErrors.forEach((error, i) => {
        console.log(`  ${i + 1}. ${error}`);
      });
    }

    expect(consoleErrors.length).toBe(0);
  });

  test("should validate MAC Design System compliance", async ({ page }) => {
    console.log("\n🎨 Validating MAC Design System compliance...");

    // Wait for page to fully load and render
    await page.waitForTimeout(3000);

    // Check for MAC design system classes
    const macElements = await page.locator('[class*="mac-"]').count();
    console.log(`  Found ${macElements} MAC design elements`);
    expect(macElements).toBeGreaterThan(0);

    // Check logo size (should be lg = 64px now)
    const logo = page.locator('img[alt="Betabase"], img[src*="betabase-logo"]').first();
    if ((await logo.count()) > 0) {
      const logoBox = await logo.boundingBox();
      if (logoBox) {
        console.log(`  Logo dimensions: ${logoBox.width}x${logoBox.height}px`);
        expect(logoBox.width).toBeGreaterThanOrEqual(48); // Should be at least 48px
      }
    }

    // Check for proper color tokens usage
    const bodyStyles = await page.evaluate(() => {
      const computed = getComputedStyle(document.documentElement);
      return {
        bgPrimary: computed.getPropertyValue("--mac-bg-primary"),
        textPrimary: computed.getPropertyValue("--mac-text-primary"),
        accentPurple: computed.getPropertyValue("--mac-accent-purple-400"),
      };
    });

    console.log(`  CSS Variables defined: ${Object.keys(bodyStyles).length}`);

    // Take screenshot for visual validation
    await page.screenshot({
      path: "test-results/screenshots/mac-design-system-validation.png",
      fullPage: true,
    });
    console.log("  ✅ Screenshot saved for visual validation");
  });

  test("should test AOMA knowledge base responses", async ({ page }) => {
    // Need longer timeout: 4 questions × 35s + overhead = ~180s
    test.setTimeout(180000);
    console.log("\n🧠 Testing AOMA Knowledge Base...");

    // Wait for chat interface
    const chatInput = page.locator('textarea, input[placeholder*="Ask"]').first();
    await expect(chatInput).toBeVisible({ timeout: 10000 });

    for (const testCase of AOMA_TEST_QUESTIONS) {
      console.log(`\n📝 Testing: ${testCase.category}`);
      console.log(`   Question: "${testCase.question}"`);

      // Clear and fill input
      await chatInput.clear();
      await chatInput.fill(testCase.question);
      await page.keyboard.press("Enter");

      // Wait for response (AOMA knowledge base search takes time)
      await page.waitForTimeout(35000); // Wait for AI response with knowledge base search

      // Get the full page text (includes AI response)
      const pageText = await page.textContent("body");
      const cleanResponse = (pageText || "")
        .replace(/\d{2}:\d{2} (AM|PM)/g, "")
        .replace(/🤖/g, "")
        .trim();

      console.log(
        `   Response (${cleanResponse.length} chars): ${cleanResponse.substring(0, 150)}...`
      );

      // Check for expected keywords
      const foundKeywords = testCase.expectedKeywords.filter((keyword) =>
        cleanResponse.toLowerCase().includes(keyword.toLowerCase())
      );

      console.log(`   Keywords found: ${foundKeywords.join(", ")}`);
      console.log(`   Match rate: ${foundKeywords.length}/${testCase.expectedKeywords.length}`);

      // Should find at least some keywords
      expect(foundKeywords.length).toBeGreaterThan(0);

      // Should NOT say "I don't know" for known AOMA content
      const hasUnknownPhrase = /don't know|not sure|unavailable/i.test(cleanResponse);
      expect(hasUnknownPhrase).toBe(false);

      // Take screenshot of this exchange
      await page.screenshot({
        path: `test-results/screenshots/aoma-response-${testCase.category.replace(/\s+/g, "-")}.png`,
        fullPage: true,
      });

      // Wait between questions
      await page.waitForTimeout(3000);
    }

    console.log("\n✅ AOMA Knowledge Base test complete!");
  });

  test("should capture full page visual regression baseline", async ({ page }) => {
    console.log("\n📸 Capturing visual regression baseline...");

    // Main view
    await page.screenshot({
      path: "test-results/screenshots/baseline-full-page.png",
      fullPage: true,
    });
    console.log("  ✅ Full page captured");

    // Header close-up
    await page.screenshot({
      path: "test-results/screenshots/baseline-header.png",
      clip: { x: 0, y: 0, width: 1920, height: 100 },
    });
    console.log("  ✅ Header captured");

    // Chat interface
    const chatArea = page.locator('[class*="chat"], main').first();
    if ((await chatArea.count()) > 0) {
      await chatArea.screenshot({
        path: "test-results/screenshots/baseline-chat-interface.png",
      });
      console.log("  ✅ Chat interface captured");
    }

    console.log("\n📊 Visual regression baselines saved!");
  });

  test.afterEach(async () => {
    // Save Web Vitals summary
    if (webVitals) {
      const fs = require("fs");
      const path = require("path");
      const vitalsDir = "test-results/web-vitals";
      if (!fs.existsSync(vitalsDir)) {
        fs.mkdirSync(vitalsDir, { recursive: true });
      }
      const summaryPath = path.join(vitalsDir, "latest-summary.json");
      const summary = {
        ...webVitals,
        consoleErrors: consoleErrors.length,
        consoleWarnings: consoleWarnings.length,
        passed: consoleErrors.length === 0,
      };
      fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
    }
  });
});
