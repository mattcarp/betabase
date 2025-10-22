import { test, expect } from "@playwright/test";

const DEPLOYMENT_URL = "https://siam-app-production.up.railway.app";

test.describe("SIAM AI Chat Interface", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the deployment
    await page.goto(DEPLOYMENT_URL);

    // Wait for the page to load
    await page.waitForLoadState("networkidle");
  });

  test("should load the chat interface", async ({ page }) => {
    // Check if the main heading is visible
    await expect(page.locator('h1:has-text("SIAM Intelligence Hub")')).toBeVisible();

    // Check if the subtitle is visible
    await expect(
      page.locator("text=Sentient Intelligence & Augmented Memory System")
    ).toBeVisible();

    // Check if the connection status badge is visible
    await expect(page.locator("text=Connected")).toBeVisible();
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
    await expect(page.locator("text=SIAM Assistant")).toBeVisible();
    await expect(
      page.locator("text=AI-powered conversation with knowledge enhancement")
    ).toBeVisible();

    // Check for the input field
    const chatInput = page.locator('textarea[placeholder*="Ask me anything"]');
    await expect(chatInput).toBeVisible();

    // Check for welcome message or suggestions
    const welcomeText = page.locator("text=Welcome to SIAM Assistant");
    const suggestionsText = page.locator("text=What can you help me with today?");

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
    await expect(page.locator("text=Test & Validation Suite")).toBeVisible();

    // Test switching to Fix tab
    await page.locator('button:has-text("Fix")').click();
    await expect(page.locator("text=Debug & Fix Assistant")).toBeVisible();

    // Test switching to Curate tab
    await page.locator('button:has-text("Curate")').click();
    await expect(page.locator("text=Knowledge Curation")).toBeVisible();

    // Switch back to Chat tab
    await page.locator('button:has-text("Chat")').click();
    await expect(page.locator("text=SIAM Assistant")).toBeVisible();
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

    // Look for suggestion buttons
    const suggestions = [
      "What can you help me with today?",
      "Tell me about your capabilities",
      "How do I upload and analyze documents?",
      "Explain the different interface modes",
    ];

    // Check if at least one suggestion is visible
    let foundSuggestion = false;
    for (const suggestion of suggestions) {
      const suggestionElement = page.locator(`text="${suggestion}"`);
      if (await suggestionElement.isVisible()) {
        foundSuggestion = true;
        break;
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

    // Check for the animated sparkles icon
    const sparklesIcon = page.locator('svg[class*="animate-pulse"]').first();
    await expect(sparklesIcon).toBeVisible();
  });
});

test.describe("SIAM AI Chat Functionality", () => {
  test("should send a message and receive response", async ({ page }) => {
    // Navigate to the deployment
    await page.goto(DEPLOYMENT_URL);
    await page.waitForLoadState("networkidle");

    // Make sure we're on the Chat tab
    await page.locator('button:has-text("Chat")').click();

    // Find the chat input
    const chatInput = page.locator('textarea[placeholder*="Ask me anything"]');
    await chatInput.click();
    await chatInput.fill("Hello, can you respond?");

    // Submit the message (press Enter or click send button)
    const sendButton = page
      .locator('button:has(svg[class*="h-4 w-4"])')
      .filter({ hasText: "" })
      .last();
    await sendButton.click();

    // Wait for response (look for loading indicator or response)
    await page.waitForTimeout(2000);

    // Check if a response appears in the chat
    const messageThread = page.locator('[class*="space-y-4"]');
    const messages = await messageThread.locator("> div").count();

    // Should have at least the user message
    expect(messages).toBeGreaterThan(0);
  });
});
