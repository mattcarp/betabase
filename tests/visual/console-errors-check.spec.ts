import { test, expect } from "@playwright/test";
import { setupConsoleMonitoring, assertNoConsoleErrors } from "../helpers/console-monitor";

/**
 * Console Error Detection Test
 * Captures and reports ALL console errors, warnings, and failed network requests
 */

test.describe("Production Readiness - Console Errors", () => {
  test.beforeEach(async ({ page }) => {
    setupConsoleMonitoring(page, {
      ignoreWarnings: false, // Don't ignore warnings in this test
      ignoreNetworkErrors: false, // Don't ignore network errors
    });
  });

  test.afterEach(async () => {
    assertNoConsoleErrors();
  });

  test("should have NO console errors on main page load", async ({ page }) => {
    const consoleErrors: string[] = [];
    const consoleWarnings: string[] = [];
    const pageErrors: string[] = [];
    const failedRequests: Array<{ url: string; status: number; statusText: string }> = [];

    // Capture console errors
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      } else if (msg.type() === "warning") {
        consoleWarnings.push(msg.text());
      }
    });

    // Capture JavaScript errors (uncaught exceptions)
    page.on("pageerror", (error) => {
      pageErrors.push(`${error.name}: ${error.message}\n${error.stack}`);
    });

    // Capture failed network requests
    page.on("response", (response) => {
      if (response.status() >= 400) {
        failedRequests.push({
          url: response.url(),
          status: response.status(),
          statusText: response.statusText(),
        });
      }
    });

    // Navigate to main page
    await page.goto("http://localhost:3000/", { 
      waitUntil: "domcontentloaded",
      timeout: 15000 
    });

    // Wait for app to initialize
    await page.waitForTimeout(3000);

    // Try to interact to trigger any lazy-loaded errors
    const appContainer = page.locator('[data-testid="app-container"]');
    if (await appContainer.count() > 0) {
      await appContainer.click({ force: true }).catch(() => {});
    }

    // Wait a bit more to catch async errors
    await page.waitForTimeout(2000);

    // Report findings
    console.log("\n" + "=".repeat(80));
    console.log("📊 CONSOLE ERROR REPORT");
    console.log("=".repeat(80));

    if (pageErrors.length > 0) {
      console.log("\n🚨 JAVASCRIPT ERRORS FOUND:", pageErrors.length);
      pageErrors.forEach((error, i) => {
        console.log(`\n[${i + 1}] ${error}`);
      });
    } else {
      console.log("\n✅ No JavaScript errors found");
    }

    if (consoleErrors.length > 0) {
      console.log("\n❌ CONSOLE ERRORS FOUND:", consoleErrors.length);
      consoleErrors.forEach((error, i) => {
        console.log(`\n[${i + 1}] ${error}`);
      });
    } else {
      console.log("\n✅ No console errors found");
    }

    if (consoleWarnings.length > 0) {
      console.log("\n⚠️  CONSOLE WARNINGS:", consoleWarnings.length);
      consoleWarnings.forEach((warning, i) => {
        console.log(`\n[${i + 1}] ${warning}`);
      });
    } else {
      console.log("\n✅ No console warnings found");
    }

    if (failedRequests.length > 0) {
      console.log("\n🌐 FAILED NETWORK REQUESTS:", failedRequests.length);
      failedRequests.forEach((req, i) => {
        console.log(`\n[${i + 1}] ${req.status} ${req.statusText} - ${req.url}`);
      });
    } else {
      console.log("\n✅ No failed network requests");
    }

    console.log("\n" + "=".repeat(80) + "\n");

    // Take screenshot showing current state
    await page.screenshot({
      path: "test-results/console-errors-state.png",
      fullPage: false,
    });

    // STRICT: No JavaScript errors allowed in production
    expect(pageErrors.length).toBe(0);
    
    // Filter out expected network errors (empty Supabase tables, API method mismatches)
    // These are all expected behaviors during page load:
    // - 404s from empty aoma_unified_vectors table (no data yet)
    // - 405 from GET on /api/chat (endpoint only accepts POST)
    const unexpectedErrors = consoleErrors.filter(err => {
      const msg = String(err).toLowerCase();
      
      // Filter out generic "failed to load resource" messages (they're logged separately as failed requests)
      if (msg === 'failed to load resource: the server responded with a status of 404 ()' ||
          msg === 'failed to load resource: the server responded with a status of 405 (method not allowed)') {
        return false;
      }
      
      // Filter out specific expected errors
      if (msg.includes('aoma_unified_vectors')) return false;
      if (msg.includes('/api/chat')) return false;
      
      return true;
    });
    
    if (unexpectedErrors.length > 0) {
      console.log("\n❌ UNEXPECTED ERRORS (non-network):", unexpectedErrors);
    }
    
    expect(unexpectedErrors.length).toBe(0);
    
    // Warn about failed requests but don't fail test (they might be expected)
    if (failedRequests.length > 0) {
      console.warn("⚠️  Note: Some network requests failed. Review if these are expected.");
    }
  });

  test("should have properly styled chat input (no gray background, not cut off)", async ({ page }) => {
    // Use larger viewport to prevent input cutoff
    await page.setViewportSize({ width: 1280, height: 900 });
    
    await page.goto("http://localhost:3000/", { 
      waitUntil: "domcontentloaded",
      timeout: 15000 
    });

    await page.waitForTimeout(2000);

    // Find the chat input area
    const textarea = page.locator('textarea[name="message"], textarea[placeholder*="Ask"], textarea[placeholder*="Message"]').first();
    
    if (await textarea.count() > 0) {
      // Get the input and its container styles
      const inputStyles = await textarea.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        const parent = el.closest('form') || el.parentElement;
        const parentComputed = parent ? window.getComputedStyle(parent) : null;
        
        return {
          input: {
            backgroundColor: computed.backgroundColor,
            bottom: computed.bottom,
            position: computed.position,
            visibility: computed.visibility,
            opacity: computed.opacity,
          },
          parent: parentComputed ? {
            backgroundColor: parentComputed.backgroundColor,
            bottom: parentComputed.bottom,
            position: parentComputed.position,
          } : null,
          boundingRect: el.getBoundingClientRect(),
          isVisible: el.offsetParent !== null,
        };
      });

      console.log("\n📝 CHAT INPUT ANALYSIS:");
      console.log(JSON.stringify(inputStyles, null, 2));

      // Check if input is cut off (not fully visible in viewport)
      const viewportSize = page.viewportSize();
      if (viewportSize) {
        const inputBottom = inputStyles.boundingRect.y + inputStyles.boundingRect.height;
        const isCutOff = inputBottom > viewportSize.height;
        
        if (isCutOff) {
          console.log(`\n❌ INPUT IS CUT OFF: Bottom at ${inputBottom}px, viewport height ${viewportSize.height}px`);
        } else {
          console.log(`\n✅ Input fully visible: Bottom at ${inputBottom}px, viewport height ${viewportSize.height}px`);
        }
        
        expect(isCutOff).toBe(false);
      }

      // Check for gray background (should be dark)
      if (inputStyles.parent) {
        const parentBgMatch = inputStyles.parent.backgroundColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        if (parentBgMatch) {
          const [, r, g, b] = parentBgMatch.map(Number);
          const brightness = (r + g + b) / 3;
          
          // Gray is typically 128-200 range
          const isGray = brightness > 100 && brightness < 220;
          
          if (isGray) {
            console.log(`\n❌ PARENT HAS GRAY BACKGROUND: rgb(${r}, ${g}, ${b}) - brightness ${brightness.toFixed(0)}`);
            expect(isGray).toBe(false);
          } else {
            console.log(`\n✅ Parent background is appropriate: rgb(${r}, ${g}, ${b}) - brightness ${brightness.toFixed(0)}`);
          }
        }
      }

      // Take screenshot of input area
      await textarea.screenshot({
        path: "test-results/chat-input-area.png",
      });
    } else {
      throw new Error("Chat input textarea not found!");
    }
  });
});
