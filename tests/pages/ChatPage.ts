import { Page, expect } from "@playwright/test";
import { BasePage } from "./BasePage";

/**
 * Chat Page Object
 * Handles all chat-related interactions
 *
 * IMPORTANT: All selectors use data-testid attributes for stability.
 * If a selector breaks, update the source component first, then this file.
 */
export class ChatPage extends BasePage {
  // Primary selectors (stable, using data-testid)
  private readonly selectors = {
    // Input area - STABLE: defined in prompt-input.tsx
    chatForm: '[data-testid="chat-form"]',
    chatInput: '[data-testid="chat-input"]',
    sendButton: '[data-testid="send-button"]',
    fileUploadInput: '[data-testid="file-upload-input"]',

    // Messages - STABLE: defined in message.tsx
    userMessage: '[data-testid="user-message"]',
    aiMessage: '[data-testid="ai-message"]',

    // Fallback selectors for older code paths
    messageContainer: '[data-testid="messages"], .messages-container, [role="log"]',
    message: '[data-testid="user-message"], [data-testid="ai-message"]',

    // UI elements (these may need data-testid added later)
    clearButton: '[data-testid="clear-chat"], button:has-text("Clear")',
    newChatButton: '[data-testid="new-chat"], button:has-text("New Chat")',

    // Tab navigation - flexible selector for different tab implementations
    chatTab: 'button:has-text("Chat"), [data-testid="chat-tab"], a:has-text("Chat")',

    // Loading/streaming indicators
    loadingIndicator: '.loading, .typing-indicator, [data-loading="true"], [data-testid="loading"]',
    streamingIndicator: '[data-streaming="true"]',
  };

  constructor(page: Page) {
    super(page);
  }

  async navigate(): Promise<void> {
    await this.navigateTo("/");
    await this.selectChatTab();
  }

  async selectChatTab(): Promise<void> {
    // Check if chat input is already visible (we're already on chat view)
    const chatInputVisible = await this.page.locator(this.selectors.chatInput).isVisible().catch(() => false);
    if (chatInputVisible) {
      return; // Already on chat view, no need to click tab
    }

    // Try to find and click the chat tab
    const chatTab = this.page.locator(this.selectors.chatTab).first();
    if (await chatTab.isVisible().catch(() => false)) {
      await chatTab.click();
      await this.page.waitForTimeout(500); // Brief wait for tab animation
    }
  }

  async sendMessage(message: string): Promise<void> {
    await this.fillInput(this.selectors.chatInput, message);
    await this.page.click(this.selectors.sendButton);
    await this.waitForResponse();
  }

  async waitForResponse(): Promise<void> {
    // Wait for AI message to appear
    await this.page.waitForSelector(this.selectors.aiMessage, {
      timeout: this.timeout.long,
    });

    // Wait for streaming to complete (no loading indicators)
    await this.page.waitForFunction(
      () => !document.querySelector('.loading, .typing-indicator, [data-loading="true"]'),
      { timeout: this.timeout.long }
    );
  }

  async getLastMessage(): Promise<string> {
    const messages = this.page.locator(this.selectors.message);
    const lastMessage = messages.last();
    return (await lastMessage.textContent()) || "";
  }

  async getLastAIMessage(): Promise<string> {
    const aiMessages = this.page.locator(this.selectors.aiMessage);
    const lastAI = aiMessages.last();
    return (await lastAI.textContent()) || "";
  }
  async getAllMessages(): Promise<string[]> {
    const messages = this.page.locator(this.selectors.message);
    const count = await messages.count();
    const allMessages: string[] = [];

    for (let i = 0; i < count; i++) {
      const text = await messages.nth(i).textContent();
      if (text) allMessages.push(text);
    }

    return allMessages;
  }

  async clearChat(): Promise<void> {
    await this.page.click(this.selectors.clearButton);
    // Wait for confirmation or messages to clear
    await this.page.waitForFunction(
      () => document.querySelectorAll('[data-testid="message"]').length === 0,
      { timeout: this.timeout.short }
    );
  }

  async startNewChat(): Promise<void> {
    await this.page.click(this.selectors.newChatButton);
    await this.waitForLoad();
  }

  async isInputEnabled(): Promise<boolean> {
    return this.page.isEnabled(this.selectors.chatInput);
  }

  async getInputPlaceholder(): Promise<string> {
    return (await this.page.getAttribute(this.selectors.chatInput, "placeholder")) || "";
  }

  // ============================================================================
  // Enhanced methods for regression testing
  // ============================================================================

  /**
   * Verifies the chat form is ready for input
   */
  async assertChatFormReady(): Promise<void> {
    await expect(this.page.locator(this.selectors.chatForm)).toBeVisible();
    await expect(this.page.locator(this.selectors.chatInput)).toBeVisible();
    await expect(this.page.locator(this.selectors.sendButton)).toBeVisible();
  }

  /**
   * Gets the current text in the chat input
   */
  async getInputValue(): Promise<string> {
    return await this.page.locator(this.selectors.chatInput).inputValue();
  }

  /**
   * Counts the number of messages in the chat
   */
  async getMessageCount(): Promise<{ user: number; ai: number; total: number }> {
    const userCount = await this.page.locator(this.selectors.userMessage).count();
    const aiCount = await this.page.locator(this.selectors.aiMessage).count();
    return {
      user: userCount,
      ai: aiCount,
      total: userCount + aiCount,
    };
  }

  /**
   * Waits for a specific number of AI messages
   */
  async waitForAIMessageCount(count: number): Promise<void> {
    await expect(this.page.locator(this.selectors.aiMessage)).toHaveCount(count, {
      timeout: this.timeout.long,
    });
  }

  /**
   * Checks if the AI is currently streaming a response
   */
  async isStreaming(): Promise<boolean> {
    const loading = await this.page.locator(this.selectors.loadingIndicator).count();
    return loading > 0;
  }

  /**
   * Waits for streaming to complete
   */
  async waitForStreamingComplete(): Promise<void> {
    // Wait for loading indicators to disappear
    await this.page.waitForFunction(
      (selector) => document.querySelectorAll(selector).length === 0,
      this.selectors.loadingIndicator,
      { timeout: this.timeout.long }
    );
  }

  /**
   * Sends a message and waits for the AI response
   * Returns the AI response text
   */
  async sendMessageAndWaitForResponse(message: string): Promise<string> {
    const initialCount = await this.page.locator(this.selectors.aiMessage).count();

    await this.sendMessage(message);

    // Wait for a new AI message to appear
    await expect(this.page.locator(this.selectors.aiMessage)).toHaveCount(initialCount + 1, {
      timeout: this.timeout.long,
    });

    // Wait for streaming to complete
    await this.waitForStreamingComplete();

    return this.getLastAIMessage();
  }

  /**
   * Verifies an AI response contains expected text
   */
  async assertAIResponseContains(text: string): Promise<void> {
    const lastMessage = await this.getLastAIMessage();
    expect(lastMessage.toLowerCase()).toContain(text.toLowerCase());
  }

  /**
   * Takes a screenshot of the current chat state
   */
  async screenshotChat(name: string): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const path = `tests/e2e/visual/screenshots/chat-${name}-${timestamp}.png`;
    await this.page.screenshot({ path, fullPage: false });
    return path;
  }
}
