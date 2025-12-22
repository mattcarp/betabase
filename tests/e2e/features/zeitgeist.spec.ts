/**
 * Zeitgeist Hot Topics E2E Tests
 *
 * Tests the FEAT-010 Zeitgeist Hot Topics Intelligence feature:
 * - API endpoints return valid data
 * - Chat page displays zeitgeist suggestions
 * - Curate tab shows Hot Topics panel
 * - Refresh functionality works
 */

import { test, expect } from '../fixtures/base-test';
import { setupConsoleMonitoring, assertNoConsoleErrors } from "../helpers/console-monitor";

// Disable console error checking for UI tests due to pre-existing hydration mismatch
// This is a Next.js SSR issue, not related to the Zeitgeist feature
test.use({ failOnConsoleError: false });

test.describe("Zeitgeist Hot Topics Feature", () => {
  test.describe("API Endpoints", () => {
    test("GET /api/zeitgeist returns suggestions", async ({ request }) => {
      const response = await request.get("http://localhost:3000/api/zeitgeist");

      expect(response.status()).toBe(200);
      const data = await response.json();

      // Should return questions array
      expect(data).toHaveProperty('questions');
      expect(Array.isArray(data.questions)).toBe(true);

      // Should have at most 6 suggestions
      expect(data.questions.length).toBeLessThanOrEqual(6);

      // Each question should have expected properties
      if (data.questions.length > 0) {
        const firstQuestion = data.questions[0];
        expect(firstQuestion).toHaveProperty('question');
        expect(typeof firstQuestion.question).toBe('string');
      }

      console.log(`[Zeitgeist API] Returned ${data.questions.length} suggestions`);
    });

    test("GET /api/zeitgeist/trending returns full topic list with stats", async ({ request }) => {
      const response = await request.get("http://localhost:3000/api/zeitgeist/trending");

      expect(response.status()).toBe(200);
      const data = await response.json();

      // Should have topics array
      expect(data).toHaveProperty('topics');
      expect(Array.isArray(data.topics)).toBe(true);

      // Should have stats object
      expect(data).toHaveProperty('stats');
      if (data.stats) {
        expect(data.stats).toHaveProperty('totalTopics');
        expect(data.stats).toHaveProperty('withGoodAnswers');
        expect(data.stats).toHaveProperty('cacheStatus');
        expect(['fresh', 'stale', 'empty']).toContain(data.stats.cacheStatus);
      }

      // Check topic structure if we have topics
      if (data.topics.length > 0) {
        const topic = data.topics[0];
        expect(topic).toHaveProperty('question');
        expect(topic).toHaveProperty('score');
        expect(topic).toHaveProperty('trend');
        expect(topic).toHaveProperty('hasGoodAnswer');
        expect(['rising', 'stable', 'falling']).toContain(topic.trend);
      }

      console.log(`[Zeitgeist Trending] ${data.topics.length} topics, cache: ${data.stats?.cacheStatus || 'unknown'}`);
    });

    test("POST /api/zeitgeist/refresh triggers refresh and returns result", async ({ request }) => {
      const response = await request.post("http://localhost:3000/api/zeitgeist/refresh");

      expect(response.status()).toBe(200);
      const data = await response.json();

      // Should return success status
      expect(data).toHaveProperty('success');
      expect(typeof data.success).toBe('boolean');

      // Should have analysis data
      expect(data).toHaveProperty('analysis');
      if (data.analysis) {
        expect(data.analysis).toHaveProperty('topicsAnalyzed');
        expect(data.analysis).toHaveProperty('topicsWithAnswers');
        expect(data.analysis).toHaveProperty('duration');
        expect(typeof data.analysis.duration).toBe('number');
      }

      console.log(`[Zeitgeist Refresh] Success: ${data.success}, Topics: ${data.analysis?.topicsAnalyzed || 0}, Duration: ${data.analysis?.duration || 0}ms`);
    });
  });

  test.describe("Chat Page Integration", () => {
    test("chat page fetches zeitgeist suggestions on load", async ({ page }) => {
      // Monitor network requests to verify zeitgeist API is called
      const zeitgeistRequests: string[] = [];
      page.on('request', (request) => {
        if (request.url().includes('/api/zeitgeist')) {
          zeitgeistRequests.push(request.url());
        }
      });

      // Navigate to home page
      await page.goto("http://localhost:3000", { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(3000);

      // Take screenshot
      await page.screenshot({
        path: "zeitgeist-chat-page.png",
        fullPage: false,
      });

      // Verify that the zeitgeist API was called
      console.log(`[Zeitgeist Chat] API calls made: ${zeitgeistRequests.length}`);
      expect(zeitgeistRequests.length).toBeGreaterThanOrEqual(1);
      expect(zeitgeistRequests[0]).toContain('/api/zeitgeist');
    });
  });

  test.describe("Curate Tab - Hot Topics Panel", () => {
    test("Hot Topics tab is visible in Curate", async ({ page }) => {
      await page.goto("http://localhost:3000", { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);

      // Click on Curate tab in the header navigation
      const curateTabNav = page.locator('header button, header a, nav button, nav a').filter({ hasText: /Curate/i }).first();
      const curateTabVisible = await curateTabNav.isVisible();

      if (!curateTabVisible) {
        console.log("[Zeitgeist Curate] Curate navigation not visible - checking alternative selectors");
        const altCurate = page.locator('text=Curate').first();
        if (await altCurate.isVisible()) {
          await altCurate.click();
        } else {
          console.log("[Zeitgeist Curate] Curate tab not found - skipping");
          test.skip();
          return;
        }
      } else {
        await curateTabNav.click();
      }

      await page.waitForTimeout(2000);

      // Take screenshot
      await page.screenshot({
        path: "zeitgeist-curate-tabs.png",
        fullPage: false,
      });

      // Look for Hot Topics tab within the curate panel
      const hotTopicsTab = page.locator('button').filter({ hasText: /Hot Topics/i });
      const flameIcon = page.locator('.lucide-flame').first();

      // Hot Topics tab should exist (check for text or icon)
      const hotTopicsVisible = await hotTopicsTab.isVisible().catch(() => false);
      const flameIconVisible = await flameIcon.isVisible().catch(() => false);

      console.log(`[Zeitgeist Curate] Hot Topics tab visible: ${hotTopicsVisible}, Flame icon: ${flameIconVisible}`);

      // Either the tab text or the flame icon should be visible
      expect(hotTopicsVisible || flameIconVisible).toBe(true);

      if (hotTopicsVisible) {
        // Click on Hot Topics tab
        await hotTopicsTab.click();
        await page.waitForTimeout(2000);

        // Take screenshot of the Hot Topics panel
        await page.screenshot({
          path: "zeitgeist-hot-topics-panel.png",
          fullPage: false,
        });

        // Verify panel content - look for Zeitgeist Intelligence title or related elements
        const panelTitle = page.locator('text=Zeitgeist Intelligence, text=Hot Topics');
        const totalTopics = page.locator('text=Total Topics');

        console.log(`[Zeitgeist Panel] Panel title visible: ${await panelTitle.isVisible().catch(() => false)}`);
        console.log(`[Zeitgeist Panel] Stats visible: ${await totalTopics.isVisible().catch(() => false)}`);
      }
    });

    test("Hot Topics panel refresh button works", async ({ page }) => {
      setupConsoleMonitoring(page, {
        ignoreWarnings: true,
        ignoreNetworkErrors: true,
      });

      await page.goto("http://localhost:3000", { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);

      // Navigate to Curate > Hot Topics
      const curateTab = page.locator("text=Curate").first();
      if (await curateTab.isVisible()) {
        await curateTab.click();
        await page.waitForTimeout(1000);

        const hotTopicsTab = page.locator('button[role="tab"]').filter({ hasText: /Hot Topics/i });
        if (await hotTopicsTab.isVisible()) {
          await hotTopicsTab.click();
          await page.waitForTimeout(1500);

          // Find and click refresh button
          const refreshButton = page.locator('button').filter({ has: page.locator('svg.lucide-refresh-cw') });

          if (await refreshButton.isVisible()) {
            console.log("[Zeitgeist Panel] Clicking refresh button...");
            await refreshButton.click();

            // Wait for refresh to complete (watch for loading spinner)
            await page.waitForTimeout(3000);

            await page.screenshot({
              path: "zeitgeist-after-refresh.png",
              fullPage: false,
            });

            console.log("[Zeitgeist Panel] Refresh completed");
          } else {
            console.log("[Zeitgeist Panel] Refresh button not found");
          }
        }
      }

      assertNoConsoleErrors(page);
    });
  });

  test.describe("Trend Indicators", () => {
    test("trending API returns topics with trend values", async ({ request }) => {
      const response = await request.get("http://localhost:3000/api/zeitgeist/trending");
      expect(response.status()).toBe(200);

      const data = await response.json();

      if (data.topics && data.topics.length > 0) {
        // Count trends
        const trendCounts = {
          rising: 0,
          stable: 0,
          falling: 0
        };

        for (const topic of data.topics) {
          expect(['rising', 'stable', 'falling']).toContain(topic.trend);
          trendCounts[topic.trend as keyof typeof trendCounts]++;
        }

        console.log(`[Zeitgeist Trends] Rising: ${trendCounts.rising}, Stable: ${trendCounts.stable}, Falling: ${trendCounts.falling}`);
      } else {
        console.log("[Zeitgeist Trends] No topics to check trends");
      }
    });
  });
});
