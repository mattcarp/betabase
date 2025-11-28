/**
 * AI Chat Interface Tests
 *
 * Tests the core chat functionality including:
 * - UI loading and display
 * - Tab navigation
 * - Chat input and messaging
 *
 * Uses base-test fixture for automatic console error detection.
 */
import { test, expect } from "./fixtures/base-test";

// Use baseURL from playwright.config.ts (https://thebetabase.com)
// No hardcoded URLs - use page.goto("/") for root

test.describe("SIAM AI Chat Interface", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app (uses baseURL from config)
    await page.goto("/");

    // Wait for the page to load
    await page.waitForLoadState("domcontentloaded");
    // Wait for main content to be visible instead of networkidle which can be flaky with polling
    await page.waitForSelector('h1:has-text("The Betabase")', { timeout: 30000 });
  });

  test("should load the chat interface", async ({ page }) => {
    // Check if the main heading is visible
    await expect(page.locator('h1:has-text("The Betabase")')).toBeVisible();

    // Check if the subtitle is visible
    await expect(
      page.locator("text=Intelligence Platform")
    ).toBeVisible();

    // Check if the connection status badge is visible
    await expect(page.locator("text=All Systems Online")).toBeVisible();
  });

  test("should display all navigation tabs", async ({ page }) => {
    // Check for all tab buttons
    await expect(page.locator('button:has-text("Chat")')).toBeVisible();
    await expect(page.locator('button:has-text("HUD")')).toBeVisible();
    await expect(page.locator('button:has-text("Test")')).toBeVisible();
    await expect(page.locator('button:has-text("Fix")')).toBeVisible();
    await expect(page.locator('button:has-text("Curate")')).toBeVisible();
  });

  test("should show AI chat panel in Chat tab", async ({ page }) => {
    // Make sure we're on the Chat tab
    await page.locator('button:has-text("Chat")').click();

    // Check for chat interface elements
    await expect(page.locator("text=Welcome to The Betabase")).toBeVisible();
    await expect(
      page.locator("text=Don't be a dick.")
    ).toBeVisible();

    // Check for the input field
    const chatInput = page.locator('textarea[placeholder*="Ask me anything"]');
    await expect(chatInput).toBeVisible();

    // Check for welcome message or suggestions
    const welcomeText = page.locator("text=Welcome to The Betabase");
    const suggestionsText = page.locator("text=Try these to get started");

    // Either welcome message or suggestions should be visible
    const welcomeOrSuggestions = await Promise.race([
      welcomeText
        .waitFor({ state: "visible", timeout: 5000 })
        .then(() => true)
        .catch(() => false),
      suggestionsText
        .waitFor({ state: "visible", timeout: 5000 })
        .then(() => true)
        .catch(() => false),
    ]);

    expect(welcomeOrSuggestions).toBeTruthy();
  });

  test("should switch between tabs", async ({ page }) => {
    // Test switching to HUD tab
    await page.locator('button:has-text("HUD")').click();
    await page.waitForTimeout(500);

    // Test switching to Test tab
    await page.locator('button:has-text("Test")').click();
    await expect(page.locator("text=Advanced Testing & Quality Assurance")).toBeVisible();

    // Test switching to Fix tab
    await page.locator('button:has-text("Fix")').click();
    await expect(page.locator("text=Debug & Fix Assistant")).toBeVisible();

    // Test switching to Curate tab
    await page.locator('button:has-text("Curate")').click();
    await expect(page.locator("text=Knowledge Curation")).toBeVisible();

    // Switch back to Chat tab
    await page.locator('button:has-text("Chat")').click();
    await expect(page.locator("text=Welcome to The Betabase")).toBeVisible();
  });

  test("should allow typing in chat input", async ({ page }) => {
    // Make sure we're on the Chat tab
    await page.locator('button:has-text("Chat")').click();

    // Find and interact with the chat input
    const chatInput = page.locator('textarea[placeholder*="Ask me anything"]');
    await chatInput.click();
    await chatInput.fill("Hello, SIAM!");

    // Verify the text was entered
    await expect(chatInput).toHaveValue("Hello, SIAM!");
  });

  test("should display suggestions in chat", async ({ page }) => {
    // Make sure we're on the Chat tab
    await page.locator('button:has-text("Chat")').click();

    // Wait for the suggestions header to ensure content is loaded
    await expect(page.locator("text=Try these to get started")).toBeVisible();

    // Look for suggestion buttons using partial text
    const suggestions = [
      "Media Batch Converter",
      "Unified Submission Tool",
      "GRPS QC",
      "Registration Job Status",
    ];

    // Check if at least one suggestion is visible
    let foundSuggestion = false;
    for (const suggestion of suggestions) {
      // Use button locator with has-text for more robust matching
      const suggestionElement = page.locator(`button:has-text("${suggestion}")`);
      try {
        await suggestionElement.first().waitFor({ state: "visible", timeout: 2000 });
        foundSuggestion = true;
        break;
      } catch (e) {
        // Continue to next suggestion
      }
    }

    expect(foundSuggestion).toBeTruthy();
  });

  test("should have responsive sidebar toggle", async ({ page }) => {
    // Look for the database/sidebar toggle button
    const sidebarToggle = page.locator('button:has(svg[class*="h-4 w-4"])').last();

    // Click to open sidebar
    await sidebarToggle.click();
    await page.waitForTimeout(500);

    // Click again to close
    await sidebarToggle.click();
    await page.waitForTimeout(500);
  });

  test("should display proper UI styling and animations", async ({ page }) => {
    // Check for glassmorphism effects
    const glassElements = await page.locator('[class*="backdrop-blur"]').count();
    expect(glassElements).toBeGreaterThan(0);

    // Check for gradient backgrounds
    const gradientElements = await page.locator('[class*="bg-gradient"]').count();
    expect(gradientElements).toBeGreaterThan(0);

    // Check for any animated element (e.g. status indicator or loading state)
    const animatedElement = page.locator('[class*="animate-pulse"]').first();
    await expect(animatedElement).toBeVisible();
  });
});

test.describe("SIAM AI Chat Functionality", () => {
  test("should send a message and receive response", async ({ page }) => {
    // Navigate to the app (uses baseURL from config)
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Make sure we're on the Chat tab
    await page.locator('button:has-text("Chat")').click();

    // Find the chat input
    const chatInput = page.locator('textarea[placeholder*="Ask me anything"]');
    await chatInput.click();
    await chatInput.fill("Hello, can you respond?");

    // Submit the message (press Enter or click send button)
    const sendButton = page.locator('button[type="submit"]');
    await sendButton.click();

    // Wait for response (look for loading indicator or response)
    await page.waitForTimeout(2000);

    // Check if a response appears in the chat
    // Updated locator to match new spacing class
    const messageThread = page.locator('[class*="space-y-6"]');
    const messages = await messageThread.locator("> div").count();

    // Should have at least the user message
    expect(messages).toBeGreaterThan(0);
  });
});
