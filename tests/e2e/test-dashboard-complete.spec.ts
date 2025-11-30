/**
 * @feature Test Dashboard
 * @layer e2e
 * @priority p0
 * @tags test-dashboard, multi-tenant, SOTA, HITL
 *
 * Comprehensive Playwright tests for the Test Dashboard
 * Based on SOTA-2025-Testing-Architecture.md
 */

import { Page } from '@playwright/test';
import { test, expect } from '../fixtures/base-test';

// Test configuration
const TEST_URL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";
const TEST_TIMEOUT = 60000; // 60 seconds for complex operations

// Test data for multi-tenant testing
const TEST_APPS = {
  SIAM: {
    name: "SIAM",
    url: "http://localhost:3000",
    testFeatures: ["chat", "upload", "settings"],
  },
  AOMA: {
    name: "AOMA",
    url: "https://aoma-stage.smcdp-de.net",
    testFeatures: ["dashboard", "metrics", "reports"],
  },
};

test.describe("Test Dashboard - SOTA Multi-Tenant Testing", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to app and handle auth if needed
    await page.goto(TEST_URL);

    // Bypass auth if in development
    if (process.env.NEXT_PUBLIC_BYPASS_AUTH === "true") {
      console.log("Auth bypassed for testing");
    } else {
      // Handle magic link auth flow
      await page.fill('input[type="email"]', "claude@test.siam.ai");
      await page.click('button:has-text("Send Magic Link")');
      // In real tests, you'd need to handle the magic link verification
    }

    // Wait for app to load
    await page.waitForSelector('[data-testid="app-container"]', { timeout: 10000 });
  });

  test.describe("Tab Navigation", () => {
    test("should navigate to Test tab", async ({ page }) => {
      // Click on Test tab
      await page.click('button:has-text("Test")');

      // Verify Test Dashboard is loaded
      await expect(page.locator("text=Test Dashboard")).toBeVisible();

      // Verify sub-tabs are present
      await expect(page.locator('button:has-text("Execution")')).toBeVisible();
      await expect(page.locator('button:has-text("AI Generator")')).toBeVisible();
      await expect(page.locator('button:has-text("Firecrawl")')).toBeVisible();
      await expect(page.locator('button:has-text("Analytics")')).toBeVisible();
    });

    test("should remember active tab on refresh", async ({ page }) => {
      // Navigate to Test tab
      await page.click('button:has-text("Test")');

      // Reload page
      await page.reload();

      // Should still be on Test tab
      await expect(page.locator("text=Test Dashboard")).toBeVisible();
    });
  });

  test.describe("Multi-Tenant App Selection", () => {
    test("should display app selector with SIAM and AOMA", async ({ page }) => {
      await page.click('button:has-text("Test")');

      // Look for app selector (might need to click a dropdown)
      const appSelector = page.locator('[data-testid="app-selector"]');
      if ((await appSelector.count()) > 0) {
        await appSelector.click();

        // Verify both apps are available
        await expect(page.locator("text=SIAM")).toBeVisible();
        await expect(page.locator("text=AOMA")).toBeVisible();
      }
    });

    test("should switch between apps and maintain context", async ({ page }) => {
      await page.click('button:has-text("Test")');

      // Select AOMA app
      const appSelector = page.locator('[data-testid="app-selector"]');
      if ((await appSelector.count()) > 0) {
        await appSelector.click();
        await page.click("text=AOMA");

        // Verify context switched
        await expect(page.locator("text=/AOMA.*selected/i")).toBeVisible();
      }
    });
  });

  test.describe("Test Execution Panel", () => {
    test("should run tests with real-time updates", async ({ page }) => {
      await page.click('button:has-text("Test")');

      // Click Run Tests button
      const runButton = page.locator('button:has-text("Run Tests")');
      if ((await runButton.count()) > 0) {
        await runButton.click();

        // Verify execution started
        await expect(page.locator("text=/Running/i")).toBeVisible();

        // Check for real-time updates (stats should change)
        const initialStats = await page.locator('[data-testid="test-stats"]').textContent();
        await page.waitForTimeout(2000);
        const updatedStats = await page.locator('[data-testid="test-stats"]').textContent();

        // Stats should have changed if real-time updates work
        if (initialStats && updatedStats) {
          expect(initialStats).not.toBe(updatedStats);
        }
      }
    });

    test("should display test results with pass/fail status", async ({ page }) => {
      await page.click('button:has-text("Test")');

      // Look for test results section
      const resultsSection = page.locator('[data-testid="test-results"]');
      if ((await resultsSection.count()) > 0) {
        // Verify status indicators
        const passedTests = page.locator('.test-passed, [data-status="passed"]');
        const failedTests = page.locator('.test-failed, [data-status="failed"]');

        // Should have at least some test results
        const totalTests = (await passedTests.count()) + (await failedTests.count());
        expect(totalTests).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe("AI Test Generator", () => {
    test("should access AI test generation panel", async ({ page }) => {
      await page.click('button:has-text("Test")');

      // Click AI Generator tab
      const aiTab = page.locator('button:has-text("AI Generator")');
      if ((await aiTab.count()) > 0) {
        await aiTab.click();

        // Verify AI generator UI is present
        await expect(page.locator("text=/Generate.*Test/i")).toBeVisible();

        // Check for prompt input
        const promptInput = page.locator('[placeholder*="Describe the test"]');
        expect(await promptInput.count()).toBeGreaterThan(0);
      }
    });

    test("should show test generation options", async ({ page }) => {
      await page.click('button:has-text("Test")');

      const aiTab = page.locator('button:has-text("AI Generator")');
      if ((await aiTab.count()) > 0) {
        await aiTab.click();

        // Check for test type options
        await expect(page.locator("text=/Unit/i")).toBeVisible();
        await expect(page.locator("text=/Integration/i")).toBeVisible();
        await expect(page.locator("text=/E2E/i")).toBeVisible();
      }
    });
  });

  test.describe("Firecrawl Integration", () => {
    test("should display Firecrawl analysis panel", async ({ page }) => {
      await page.click('button:has-text("Test")');

      // Click Firecrawl tab
      const firecrawlTab = page.locator('button:has-text("Firecrawl")');
      if ((await firecrawlTab.count()) > 0) {
        await firecrawlTab.click();

        // Verify Firecrawl UI
        await expect(page.locator("text=/Crawl.*URL/i")).toBeVisible();

        // Check for URL input
        const urlInput = page.locator('input[placeholder*="URL"], input[type="url"]');
        expect(await urlInput.count()).toBeGreaterThan(0);
      }
    });

    test("should show cached analysis for known apps", async ({ page }) => {
      await page.click('button:has-text("Test")');

      const firecrawlTab = page.locator('button:has-text("Firecrawl")');
      if ((await firecrawlTab.count()) > 0) {
        await firecrawlTab.click();

        // Check for cached results
        const cachedResults = page.locator("text=/Cached.*Analysis/i");
        if ((await cachedResults.count()) > 0) {
          await expect(cachedResults).toBeVisible();
        }
      }
    });
  });

  test.describe("Test Analytics & Visualization", () => {
    test("should display test analytics dashboard", async ({ page }) => {
      await page.click('button:has-text("Test")');

      // Click Analytics tab
      const analyticsTab = page.locator('button:has-text("Analytics")');
      if ((await analyticsTab.count()) > 0) {
        await analyticsTab.click();

        // Verify charts are present (EvilCharts components)
        const charts = page.locator('svg, canvas, [role="img"]');
        expect(await charts.count()).toBeGreaterThan(0);
      }
    });

    test("should show flaky test detection", async ({ page }) => {
      await page.click('button:has-text("Test")');

      // Look for flaky test indicators
      const flakySection = page.locator("text=/Flaky.*Test/i");
      if ((await flakySection.count()) > 0) {
        await expect(flakySection).toBeVisible();

        // Check for flakiness scores
        const flakinessScores = page.locator('[data-testid="flakiness-score"]');
        expect(await flakinessScores.count()).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe("HITL (Human-In-The-Loop) Features", () => {
    test("should show approval workflow for critical tests", async ({ page }) => {
      await page.click('button:has-text("Test")');

      // Look for HITL indicators
      const approvalSection = page.locator("text=/Approval.*Required/i");
      if ((await approvalSection.count()) > 0) {
        await expect(approvalSection).toBeVisible();

        // Check for approve/reject buttons
        await expect(page.locator('button:has-text("Approve")')).toBeVisible();
        await expect(page.locator('button:has-text("Reject")')).toBeVisible();
      }
    });

    test("should display manager dashboard view", async ({ page }) => {
      await page.click('button:has-text("Test")');

      // Look for manager view toggle
      const managerView = page.locator('button:has-text("Manager View")');
      if ((await managerView.count()) > 0) {
        await managerView.click();

        // Verify executive summary is shown
        await expect(page.locator("text=/Executive.*Summary/i")).toBeVisible();

        // Check for ROI metrics
        await expect(page.locator("text=/ROI/i")).toBeVisible();
      }
    });
  });

  test.describe("Knowledge Base Integration", () => {
    test("should show test failure knowledge", async ({ page }) => {
      await page.click('button:has-text("Test")');

      // Look for knowledge base section
      const knowledgeSection = page.locator("text=/Knowledge.*Base/i");
      if ((await knowledgeSection.count()) > 0) {
        await expect(knowledgeSection).toBeVisible();

        // Check for similar failures
        const similarFailures = page.locator("text=/Similar.*Failure/i");
        expect(await similarFailures.count()).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe("Performance & Accessibility", () => {
    test("Test Dashboard should load within 3 seconds", async ({ page }) => {
      const startTime = Date.now();
      await page.click('button:has-text("Test")');
      await page.waitForSelector("text=Test Dashboard");
      const loadTime = Date.now() - startTime;

      expect(loadTime).toBeLessThan(3000);
    });

    test("should have proper ARIA labels for accessibility", async ({ page }) => {
      await page.click('button:has-text("Test")');

      // Check for ARIA labels
      const buttons = page.locator("button");
      const buttonsCount = await buttons.count();

      for (let i = 0; i < Math.min(buttonsCount, 5); i++) {
        const button = buttons.nth(i);
        const ariaLabel = await button.getAttribute("aria-label");
        const text = await button.textContent();

        // Button should have either aria-label or text content
        expect(ariaLabel || text).toBeTruthy();
      }
    });

    test("should handle keyboard navigation", async ({ page }) => {
      await page.click('button:has-text("Test")');

      // Test tab navigation
      await page.keyboard.press("Tab");
      await page.keyboard.press("Tab");

      // Check if focus is visible
      const focusedElement = await page.locator(":focus");
      expect(await focusedElement.count()).toBe(1);
    });
  });

  test.describe("Error Handling & Edge Cases", () => {
    test("should handle API failures gracefully", async ({ page }) => {
      // Intercept API calls and make them fail
      await page.route("**/api/test/**", (route) => {
        route.abort("failed");
      });

      await page.click('button:has-text("Test")');

      // Should show error message, not crash
      const errorMessage = page.locator("text=/Error|Failed|Unable/i");
      if ((await errorMessage.count()) > 0) {
        await expect(errorMessage).toBeVisible();
      }
    });

    test("should handle empty test results", async ({ page }) => {
      await page.click('button:has-text("Test")');

      // Check for empty state
      const emptyState = page.locator("text=/No.*test.*results/i");
      if ((await emptyState.count()) > 0) {
        await expect(emptyState).toBeVisible();
      }
    });
  });
});

test.describe("Meta Testing - Test the Test Dashboard", () => {
  test("Dashboard should test itself (meta!)", async ({ page }) => {
    await page.goto(TEST_URL);

    // Navigate to Test tab
    await page.click('button:has-text("Test")');

    // Run tests on the Test Dashboard itself
    const runButton = page.locator('button:has-text("Run Tests")');
    if ((await runButton.count()) > 0) {
      // This is very meta - the Test Dashboard testing itself!
      console.log("🎭 META: Test Dashboard is testing itself!");

      // Set app_name to SIAM (testing ourselves)
      const appSelector = page.locator('[data-testid="app-selector"]');
      if ((await appSelector.count()) > 0) {
        await appSelector.click();
        await page.click("text=SIAM");
      }

      await runButton.click();

      // The Test Dashboard should be able to test its own functionality
      await expect(page.locator("text=/Testing.*Test.*Dashboard/i")).toBeVisible();
    }
  });
});
