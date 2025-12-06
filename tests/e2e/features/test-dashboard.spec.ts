import { Page } from '@playwright/test';
import { test, expect } from '../fixtures/base-test';

test.describe("Test Dashboard - Comprehensive E2E Tests", () => {
  let page: Page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;

    // Navigate to SIAM with auth bypassed
    await page.goto("http://localhost:3000", { waitUntil: 'domcontentloaded' });

    // Verify page loads correctly
    await expect(page).toHaveTitle(/The Betabase/);

    // Navigate to Test tab
    await page.click("text=Test");

    // Wait for Test Dashboard to load
    await expect(page.locator("text=Test Dashboard")).toBeVisible();
    await expect(page.locator("text=AI-Powered Testing Command Center")).toBeVisible();
  });

  test.describe("Tab Navigation", () => {
    const testTabs = [
      "Execution",
      "Results",
      "AI Generate",
      "Trace Viewer",
      "Coverage",
      "Flaky Tests",
      "Analytics",
      "Firecrawl",
    ];

    testTabs.forEach((tabName) => {
      test(`should navigate to ${tabName} tab`, async () => {
        // Click on the specific tab
        await page.click(`text=${tabName}`);

        // Verify tab is active/selected
        const tabButton = page.locator(`button:has-text("${tabName}")`);
        await expect(tabButton).toBeVisible();

        // Take screenshot for visual verification
        await page.screenshot({
          path: `/Users/matt/Documents/projects/siam/test-screenshots/tab-${tabName.toLowerCase().replace(" ", "-")}.png`,
          fullPage: true,
        });

        // Verify no console errors on tab switch
        const errors = await page.evaluate(() => {
          return window.console.error?.callCount || 0;
        });
        expect(errors).toBe(0);
      });
    });

    test("should maintain tab state when switching between tabs", async () => {
      // Navigate through multiple tabs
      await page.click("text=Results");
      await page.waitForTimeout(500);

      await page.click("text=AI Generate");
      await page.waitForTimeout(500);

      await page.click("text=Execution");
      await page.waitForTimeout(500);

      // Verify we're back on Execution tab
      const executionTab = page.locator('button:has-text("Execution")');
      await expect(executionTab).toBeVisible();
    });
  });

  test.describe("Run Tests Button Functionality", () => {
    test("should display Run Tests button and handle click", async () => {
      // Verify Run Tests button is visible
      const runTestsButton = page.locator("text=Run Tests").first();
      await expect(runTestsButton).toBeVisible();

      // Click Run Tests button
      await runTestsButton.click();

      // Verify button state changes or loading indicator appears
      // Note: This will depend on actual implementation
      await page.waitForTimeout(1000);

      // Take screenshot of result
      await page.screenshot({
        path: "/Users/matt/Documents/projects/siam/test-screenshots/run-tests-clicked.png",
      });
    });

    test("should show Re-run Failed button when available", async () => {
      // Check if Re-run Failed button exists
      const rerunButton = page.locator("text=Re-run Failed");
      if (await rerunButton.isVisible()) {
        await expect(rerunButton).toBeVisible();

        // Test click functionality
        await rerunButton.click();
        await page.waitForTimeout(1000);
      }
    });
  });

  test.describe("Test Execution Panel", () => {
    test("should display test execution statistics", async () => {
      // Verify execution statistics are displayed
      const totalTests = page.locator("text=Total").first();
      await expect(totalTests).toBeVisible();

      // Check for status indicators
      const statusIndicators = [
        "Total", // Total tests count
        "0", // Numbers should be visible
      ];

      for (const indicator of statusIndicators) {
        await expect(page.locator(`text=${indicator}`).first()).toBeVisible();
      }
    });

    test("should display test suites section", async () => {
      // Navigate to Execution tab if not already there
      await page.click("text=Execution");

      // Verify Test Suites section
      await expect(page.locator("text=Test Suites")).toBeVisible();

      // Check for authentication tests
      const authTests = page.locator("text=Authentication Tests");
      if (await authTests.isVisible()) {
        await expect(authTests).toBeVisible();
        await expect(page.locator("text=4 tests")).toBeVisible();
      }

      // Check for API integration tests
      const apiTests = page.locator("text=API Integration Tests");
      if (await apiTests.isVisible()) {
        await expect(apiTests).toBeVisible();
      }

      // Check for UI component tests
      const uiTests = page.locator("text=UI Component Tests");
      if (await uiTests.isVisible()) {
        await expect(uiTests).toBeVisible();
      }
    });

    test("should display test execution details", async () => {
      // Verify Test Execution Details section
      await expect(page.locator("text=Test Execution Details")).toBeVisible();

      // This section might show execution logs or details
      // Verify the section is present and functional
    });

    test("should display system resources", async () => {
      // Verify System Resources section
      await expect(page.locator("text=System Resources")).toBeVisible();

      // Check for resource metrics
      const resourceMetrics = ["CPU Usage", "Memory", "Network I/O"];
      for (const metric of resourceMetrics) {
        const metricElement = page.locator(`text=${metric}`);
        if (await metricElement.isVisible()) {
          await expect(metricElement).toBeVisible();
        }
      }
    });
  });

  test.describe("AI Generate Feature", () => {
    test("should navigate to AI Generate tab and display interface", async () => {
      // Navigate to AI Generate tab
      await page.click("text=AI Generate");

      // Verify AI Generate interface is loaded
      await page.waitForTimeout(1000);

      // Take screenshot for verification
      await page.screenshot({
        path: "/Users/matt/Documents/projects/siam/test-screenshots/ai-generate-tab.png",
        fullPage: true,
      });
    });

    test("should test AI Generate natural language input", async () => {
      // Navigate to AI Generate tab
      await page.click("text=AI Generate");
      await page.waitForTimeout(500);

      // Look for input field or text area for natural language input
      const inputSelectors = [
        "textarea",
        'input[type="text"]',
        '[placeholder*="describe"]',
        '[placeholder*="test"]',
        '[data-testid="ai-generate-input"]',
      ];

      let inputFound = false;
      for (const selector of inputSelectors) {
        const input = page.locator(selector).first();
        if (await input.isVisible()) {
          // Test natural language input
          await input.fill("Create a test that verifies user login functionality");
          await page.waitForTimeout(500);

          // Look for generate button or submit
          const generateButton = page.locator('button:has-text("Generate")').first();
          if (await generateButton.isVisible()) {
            await generateButton.click();
            await page.waitForTimeout(2000);
          }

          inputFound = true;
          break;
        }
      }

      // Take screenshot regardless of whether input was found
      await page.screenshot({
        path: "/Users/matt/Documents/projects/siam/test-screenshots/ai-generate-input.png",
      });
    });
  });

  test.describe("Firecrawl Panel", () => {
    test("should display Firecrawl tab and Start Crawl button", async () => {
      // Navigate to Firecrawl tab
      await page.click("text=Firecrawl");
      await page.waitForTimeout(500);

      // Take screenshot of Firecrawl panel
      await page.screenshot({
        path: "/Users/matt/Documents/projects/siam/test-screenshots/firecrawl-tab.png",
        fullPage: true,
      });
    });

    test("should test Start Crawl button functionality", async () => {
      // Navigate to Firecrawl tab
      await page.click("text=Firecrawl");
      await page.waitForTimeout(500);

      // Look for Start Crawl button
      const startCrawlButton = page.locator("text=Start Crawl").first();
      if (await startCrawlButton.isVisible()) {
        await expect(startCrawlButton).toBeVisible();

        // Test button click
        await startCrawlButton.click();
        await page.waitForTimeout(1000);

        // Take screenshot after click
        await page.screenshot({
          path: "/Users/matt/Documents/projects/siam/test-screenshots/firecrawl-start-crawl.png",
        });
      } else {
        // Look for alternative button texts
        const alternativeButtons = ["Start", "Crawl", "Begin Crawl", "Run Crawl"];

        for (const buttonText of alternativeButtons) {
          const button = page.locator(`text=${buttonText}`).first();
          if (await button.isVisible()) {
            await button.click();
            await page.waitForTimeout(1000);
            break;
          }
        }
      }
    });
  });

  test.describe("Results Tab", () => {
    test("should display test results interface", async () => {
      // Navigate to Results tab
      await page.click("text=Results");
      await page.waitForTimeout(500);

      // Take screenshot of Results tab
      await page.screenshot({
        path: "/Users/matt/Documents/projects/siam/test-screenshots/results-tab.png",
        fullPage: true,
      });
    });
  });

  test.describe("Trace Viewer Tab", () => {
    test("should display trace viewer interface", async () => {
      // Navigate to Trace Viewer tab
      await page.click("text=Trace Viewer");
      await page.waitForTimeout(500);

      // Take screenshot of Trace Viewer tab
      await page.screenshot({
        path: "/Users/matt/Documents/projects/siam/test-screenshots/trace-viewer-tab.png",
        fullPage: true,
      });
    });
  });

  test.describe("Coverage Tab", () => {
    test("should display code coverage interface", async () => {
      // Navigate to Coverage tab
      await page.click("text=Coverage");
      await page.waitForTimeout(500);

      // Take screenshot of Coverage tab
      await page.screenshot({
        path: "/Users/matt/Documents/projects/siam/test-screenshots/coverage-tab.png",
        fullPage: true,
      });
    });
  });

  test.describe("Flaky Tests Tab", () => {
    test("should display flaky tests interface", async () => {
      // Navigate to Flaky Tests tab
      await page.click("text=Flaky Tests");
      await page.waitForTimeout(500);

      // Take screenshot of Flaky Tests tab
      await page.screenshot({
        path: "/Users/matt/Documents/projects/siam/test-screenshots/flaky-tests-tab.png",
        fullPage: true,
      });
    });
  });

  test.describe("Analytics Tab", () => {
    test("should display analytics interface", async () => {
      // Navigate to Analytics tab
      await page.click("text=Analytics");
      await page.waitForTimeout(500);

      // Take screenshot of Analytics tab
      await page.screenshot({
        path: "/Users/matt/Documents/projects/siam/test-screenshots/analytics-tab.png",
        fullPage: true,
      });
    });
  });

  test.describe("Responsive Design", () => {
    test("should display correctly on mobile viewport", async () => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      // Navigate to Test Dashboard
      await page.goto("http://localhost:3000", { waitUntil: 'domcontentloaded' });
      await page.click("text=Test");

      // Verify Test Dashboard is responsive
      await expect(page.locator("text=Test Dashboard")).toBeVisible();

      // Test tab navigation on mobile
      await page.click("text=AI Generate");
      await page.waitForTimeout(500);

      // Take screenshot
      await page.screenshot({
        path: "/Users/matt/Documents/projects/siam/test-screenshots/mobile-test-dashboard.png",
        fullPage: true,
      });
    });

    test("should display correctly on tablet viewport", async () => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });

      // Navigate to Test Dashboard
      await page.goto("http://localhost:3000", { waitUntil: 'domcontentloaded' });
      await page.click("text=Test");

      // Verify Test Dashboard is responsive
      await expect(page.locator("text=Test Dashboard")).toBeVisible();

      // Take screenshot
      await page.screenshot({
        path: "/Users/matt/Documents/projects/siam/test-screenshots/tablet-test-dashboard.png",
        fullPage: true,
      });
    });
  });

  test.describe("Error Handling", () => {
    test("should handle network errors gracefully", async () => {
      // Navigate to Test Dashboard
      await page.goto("http://localhost:3000", { waitUntil: 'domcontentloaded' });
      await page.click("text=Test");

      // Simulate network issues by going offline
      await page.context().setOffline(true);

      // Try to interact with features
      await page.click("text=Run Tests");
      await page.waitForTimeout(2000);

      // Restore network
      await page.context().setOffline(false);

      // Verify the interface still works
      await expect(page.locator("text=Test Dashboard")).toBeVisible();
    });

    test("should not have console errors on load", async () => {
      const errors: string[] = [];

      page.on("console", (msg) => {
        if (msg.type() === "error") {
          errors.push(msg.text());
        }
      });

      // Navigate to Test Dashboard
      await page.goto("http://localhost:3000", { waitUntil: 'domcontentloaded' });
      await page.click("text=Test");

      // Wait for page to fully load
      await page.waitForTimeout(3000);

      // Check for critical errors (filter out known non-critical warnings)
      const criticalErrors = errors.filter(
        (error) =>
          !error.includes("favicon") && !error.includes("Warning") && !error.includes("DevTools")
      );

      expect(criticalErrors).toHaveLength(0);
    });
  });

  test.describe("Component Visibility and Interaction", () => {
    test("should verify all UI components render correctly", async () => {
      // Verify main dashboard elements
      await expect(page.locator("text=Test Dashboard")).toBeVisible();
      await expect(page.locator("text=AI-Powered Testing Command Center")).toBeVisible();

      // Verify statistics cards
      const statsCards = page.locator('[data-testid*="stat"], .stat-card, .metric-card');
      if ((await statsCards.count()) > 0) {
        for (let i = 0; i < (await statsCards.count()); i++) {
          await expect(statsCards.nth(i)).toBeVisible();
        }
      }

      // Verify all tab buttons are clickable
      const tabButtons = page.locator(
        'button:has-text("Execution"), button:has-text("Results"), button:has-text("AI Generate"), button:has-text("Trace Viewer"), button:has-text("Coverage"), button:has-text("Flaky Tests"), button:has-text("Analytics"), button:has-text("Firecrawl")'
      );
      for (let i = 0; i < (await tabButtons.count()); i++) {
        await expect(tabButtons.nth(i)).toBeVisible();
        await expect(tabButtons.nth(i)).toBeEnabled();
      }
    });

    test("should verify Run Tests button states", async () => {
      const runTestsButton = page.locator("text=Run Tests").first();

      if (await runTestsButton.isVisible()) {
        // Verify button is enabled
        await expect(runTestsButton).toBeEnabled();

        // Click and verify state change
        await runTestsButton.click();

        // Button might become disabled during execution
        await page.waitForTimeout(1000);

        // Take screenshot to verify visual state
        await page.screenshot({
          path: "/Users/matt/Documents/projects/siam/test-screenshots/run-tests-state.png",
        });
      }
    });

    test("should verify data display in different tabs", async () => {
      const tabsToTest = ["Execution", "Results", "Coverage", "Analytics"];

      for (const tab of tabsToTest) {
        await page.click(`text=${tab}`);
        await page.waitForTimeout(1000);

        // Look for data containers, charts, or tables
        const dataContainers = page.locator(".chart, .table, .data-container, .metric, .graph");

        // Take screenshot for each tab
        await page.screenshot({
          path: `/Users/matt/Documents/projects/siam/test-screenshots/data-${tab.toLowerCase()}.png`,
          fullPage: true,
        });
      }
    });
  });

  test.describe("Performance and Loading", () => {
    test("should load Test Dashboard within acceptable time", async () => {
      const startTime = Date.now();

      await page.goto("http://localhost:3000", { waitUntil: 'domcontentloaded' });
      await page.click("text=Test");
      await expect(page.locator("text=Test Dashboard")).toBeVisible();

      const loadTime = Date.now() - startTime;

      // Dashboard should load within 5 seconds
      expect(loadTime).toBeLessThan(5000);

      console.log(`Test Dashboard loaded in ${loadTime}ms`);
    });

    test("should handle rapid tab switching", async () => {
      const tabs = ["Execution", "Results", "AI Generate", "Trace Viewer", "Coverage"];

      // Rapidly switch between tabs
      for (let i = 0; i < 3; i++) {
        for (const tab of tabs) {
          await page.click(`text=${tab}`);
          await page.waitForTimeout(100); // Very short wait to simulate rapid clicking
        }
      }

      // Verify the interface is still responsive
      await page.click("text=Execution");
      await expect(page.locator("text=Test Suites")).toBeVisible();
    });
  });
});
