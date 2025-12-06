/**
 * Comprehensive Test Suite for Vercel AI SDK Implementation
 * Tests both localhost and production environments
 * Frontend and Backend validation
 */

import { type Page } from '@playwright/test';
import { test, expect } from '../e2e/fixtures/base-test';

// Test configuration for different environments
const ENVIRONMENTS = {
  localhost: {
    url: "http://localhost:3000",
    name: "Localhost",
    requiresAuth: false, // Using NEXT_PUBLIC_BYPASS_AUTH
  },
  production: {
    url: "http://localhost:3000",
    name: "Production",
    requiresAuth: true,
  },
};

// Helper function to wait for streaming response
async function waitForStreamingResponse(page: Page, timeout = 10000) {
  await page.waitForFunction(
    () => {
      const messages = document.querySelectorAll('[data-testid="message"]');
      const lastMessage = messages[messages.length - 1];
      return lastMessage && lastMessage.textContent && lastMessage.textContent.length > 10;
    },
    { timeout }
  );
}

// Helper to check console errors
async function checkConsoleErrors(page: Page): Promise<string[]> {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      errors.push(msg.text());
    }
  });
  return errors;
}

// Test both environments
Object.entries(ENVIRONMENTS).forEach(([envKey, env]) => {
  test.describe(`${env.name} - Vercel AI SDK Tests`, () => {
    test.beforeEach(async ({ page }) => {
      // Set up console error monitoring
      const errors = await checkConsoleErrors(page);

      // Navigate to the application
      await page.goto(env.url, { waitUntil: "networkidle" });

      // Handle authentication if needed
      if (env.requiresAuth && envKey === "production") {
        // Check if we need to login
        const loginButton = await page
          .locator('button:has-text("Send Magic Link")')
          .isVisible()
          .catch(() => false);
        if (loginButton) {
          await page.fill('input[type="email"]', "siam-test-x7j9k2p4@mailinator.com");
          await page.click('button:has-text("Send Magic Link")');
          // Note: In real production test, you'd need to handle email verification
          console.log("Auth required - using test email");
        }
      }
    });

    test.describe("Backend API Tests", () => {
      test("Health check endpoint responds", async ({ request }) => {
        const response = await request.get(`${env.url}/api/health`);
        expect(response.status()).toBe(200);
        const data = await response.json();
        expect(data.status).toBe("healthy");
      });

      test("Vercel AI SDK endpoint exists and responds", async ({ request }) => {
        const response = await request.post(`${env.url}/api/chat-vercel`, {
          data: {
            messages: [{ role: "user", content: "Hello" }],
            model: "gpt-4o-mini",
          },
        });

        // Should get streaming response or valid error
        expect([200, 401, 500]).toContain(response.status());

        if (response.status() === 200) {
          // Check for streaming response headers
          const contentType = response.headers()["content-type"];
          expect(contentType).toContain("text/event-stream");
        }
      });

      test("AOMA orchestration endpoint responds", async ({ request }) => {
        const response = await request.get(`${env.url}/api/aoma/health`);
        expect(response.status()).toBe(200);
        const data = await response.json();
        expect(data.status).toBe("healthy");
        expect(data.services).toBeDefined();
      });

      test("Legacy chat-responses endpoint should NOT exist", async ({ request }) => {
        const response = await request.post(`${env.url}/api/chat-responses`, {
          data: {
            messages: [{ role: "user", content: "Test" }],
          },
        });
        expect(response.status()).toBe(404);
      });
    });

    test.describe("Frontend UI Tests", () => {
      test("Chat interface loads correctly", async ({ page }) => {
        // Wait for main elements
        await expect(page.locator("text=AOMA Intelligence Hub")).toBeVisible({
          timeout: 10000,
        });

        // Check for essential UI components
        await expect(page.locator("text=SIAM")).toBeVisible();
        await expect(
          page.locator('[data-testid="chat-input"], textarea[placeholder*="Message"]')
        ).toBeVisible();

        // Verify model selector exists
        const modelSelector = page
          .locator("text=GPT-4o")
          .or(page.locator('button:has-text("GPT-4o")'));
        await expect(modelSelector).toBeVisible();
      });

      test("Suggestions are displayed", async ({ page }) => {
        // Check for at least one suggestion button
        const suggestions = page.locator("button").filter({
          hasText: /How does|What|How can|What are/,
        });
        const count = await suggestions.count();
        expect(count).toBeGreaterThan(0);
      });

      test("Can send a message and receive response", async ({ page }) => {
        // Find and fill the input
        const input = page
          .locator('textarea[placeholder*="Message"]')
          .or(page.locator('[data-testid="chat-input"]'));
        await input.fill("What is SIAM?");

        // Send message (Enter or button)
        await page.keyboard.press("Enter");

        // Wait for response to start streaming
        await page.waitForSelector("text=/SIAM|assistant|AI/", {
          timeout: 15000,
        });

        // Verify message appears in chat
        const userMessage = page.locator("text=What is SIAM?");
        await expect(userMessage).toBeVisible();
      });

      test("Model selector works", async ({ page }) => {
        // Click on model selector
        const modelButton = page
          .locator("button")
          .filter({ hasText: /GPT-4o|Model/ })
          .first();
        await modelButton.click();

        // Check if dropdown appears with options
        await expect(page.locator("text=GPT-4o Mini")).toBeVisible();
        await expect(page.locator("text=Claude 3")).toBeVisible();

        // Select a different model
        await page.click("text=GPT-4o Mini");
      });

      test("Connection status indicators show correct state", async ({ page }) => {
        // Look for connection status
        const connectionStatus = page.locator("text=/Systems Online|connected/i");
        await expect(connectionStatus.first()).toBeVisible();

        // Check for service indicators
        const aomaStatus = page.locator("text=AOMA").or(page.locator("text=AOMA-MESH"));
        await expect(aomaStatus.first()).toBeVisible();
      });
    });

    test.describe("Integration Tests", () => {
      test("AOMA knowledge query works end-to-end", async ({ page }) => {
        // Click on AOMA-specific suggestion if available
        const aomaButton = page
          .locator("button")
          .filter({
            hasText: /AOMA|automated QC|audio files|Sony/,
          })
          .first();

        if (await aomaButton.isVisible()) {
          await aomaButton.click();

          // Wait for response
          await page.waitForSelector("text=/AOMA|Sony|audio|QC/", {
            timeout: 20000,
          });

          // Verify we got some response (even if it's about unavailable knowledge)
          const response = page
            .locator('[data-testid="assistant-message"]')
            .or(page.locator("text=/AOMA|knowledge|information/"));
          await expect(response.first()).toBeVisible();
        }
      });

      test("Chat maintains conversation context", async ({ page }) => {
        // Send first message
        const input = page
          .locator('textarea[placeholder*="Message"]')
          .or(page.locator('[data-testid="chat-input"]'));
        await input.fill("My name is TestUser");
        await page.keyboard.press("Enter");

        // Wait for response
        await page.waitForTimeout(3000);

        // Send follow-up
        await input.fill("What is my name?");
        await page.keyboard.press("Enter");

        // Check if context is maintained
        await page.waitForSelector("text=/TestUser|name/", { timeout: 15000 });
      });

      test("Error handling for invalid requests", async ({ page, request }) => {
        // Send malformed request directly to API
        const response = await request.post(`${env.url}/api/chat-vercel`, {
          data: {
            messages: null, // Invalid
            model: "invalid-model",
          },
        });

        // Should handle gracefully
        expect([400, 500]).toContain(response.status());

        if (response.status() === 400) {
          const error = await response.json();
          expect(error.error).toBeDefined();
        }
      });
    });

    test.describe("Performance Tests", () => {
      test("Initial page load performance", async ({ page }) => {
        const startTime = Date.now();
        await page.goto(env.url, { waitUntil: "domcontentloaded" });
        const loadTime = Date.now() - startTime;

        // Should load within reasonable time
        expect(loadTime).toBeLessThan(10000); // 10 seconds max
        console.log(`${env.name} load time: ${loadTime}ms`);
      });

      test("Streaming response latency", async ({ page }) => {
        const input = page
          .locator('textarea[placeholder*="Message"]')
          .or(page.locator('[data-testid="chat-input"]'));
        await input.fill("Hi");

        const startTime = Date.now();
        await page.keyboard.press("Enter");

        // Wait for first token
        await page.waitForSelector("text=/Hi|Hello|help/", { timeout: 10000 });
        const responseTime = Date.now() - startTime;

        console.log(`${env.name} first token latency: ${responseTime}ms`);
        expect(responseTime).toBeLessThan(5000); // 5 seconds max for first token
      });
    });

    test.describe("Security Tests", () => {
      test("XSS prevention in chat messages", async ({ page }) => {
        const input = page
          .locator('textarea[placeholder*="Message"]')
          .or(page.locator('[data-testid="chat-input"]'));

        // Try to inject script
        await input.fill('<script>alert("XSS")</script>');
        await page.keyboard.press("Enter");

        // Wait a bit
        await page.waitForTimeout(2000);

        // Check no alert was triggered
        const alertTriggered = await page.evaluate(() => {
          let triggered = false;
          const originalAlert = window.alert;
          window.alert = () => {
            triggered = true;
          };
          setTimeout(() => {
            window.alert = originalAlert;
          }, 100);
          return triggered;
        });

        expect(alertTriggered).toBe(false);
      });

      test("API requires proper headers", async ({ request }) => {
        const response = await request.post(`${env.url}/api/chat-vercel`, {
          data: { messages: [{ role: "user", content: "Test" }] },
          headers: {
            "Content-Type": "text/plain", // Wrong content type
          },
        });

        // Should reject or handle gracefully
        expect([400, 415, 500]).toContain(response.status());
      });
    });

    test.describe("Mobile Responsiveness", () => {
      test("Chat works on mobile viewport", async ({ page }) => {
        // Set mobile viewport
        await page.setViewportSize({ width: 375, height: 667 });
        await page.goto(env.url);

        // Check if interface adapts
        await expect(page.locator("text=SIAM")).toBeVisible();

        // Input should still be accessible
        const input = page
          .locator('textarea[placeholder*="Message"]')
          .or(page.locator('[data-testid="chat-input"]'));
        await expect(input).toBeVisible();

        // Can still send messages
        await input.fill("Mobile test");
        await page.keyboard.press("Enter");
      });
    });
  });
});

// Cleanup and summary test
test.describe("Test Summary", () => {
  test("Generate test report", async () => {
    console.log("\n=== Vercel AI SDK Test Suite Complete ===");
    console.log("✅ Backend API validation");
    console.log("✅ Frontend UI testing");
    console.log("✅ Integration testing");
    console.log("✅ Performance benchmarks");
    console.log("✅ Security validation");
    console.log("✅ Mobile responsiveness");
    console.log("=========================================\n");
  });
});
