import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Chat Page Object
 * Handles all chat-related interactions
 */
export class ChatPage extends BasePage {
  private readonly selectors = {
    // Input area
    chatInput: '[data-testid="chat-input"], textarea[placeholder*="Message"], #message-input',
    sendButton: '[data-testid="send-button"], button[aria-label="Send"], button:has-text("Send")',
    
    // Messages
    messageContainer: '[data-testid="messages"], .messages-container, [role="log"]',
    message: '[data-testid="message"], .message, [role="article"]',
    userMessage: '[data-testid="user-message"], .user-message',
    aiMessage: '[data-testid="ai-message"], .ai-message, .assistant-message',
    
    // UI elements
    clearButton: '[data-testid="clear-chat"], button:has-text("Clear")',
    newChatButton: '[data-testid="new-chat"], button:has-text("New Chat")',
    
    // Tab navigation
    chatTab: 'button[role="tab"]:has-text("Chat")'
  };

  constructor(page: Page) {
    super(page);
  }

  async navigate(): Promise<void> {
    await this.page.goto('/');
    await this.selectChatTab();
  }
  async selectChatTab(): Promise<void> {
    await this.page.click(this.selectors.chatTab);
    await this.page.waitForTimeout(500); // Brief wait for tab animation
  }

  async sendMessage(message: string): Promise<void> {
    await this.fillInput(this.selectors.chatInput, message);
    await this.page.click(this.selectors.sendButton);
    await this.waitForResponse();
  }

  async waitForResponse(): Promise<void> {
    // Wait for AI message to appear
    await this.page.waitForSelector(this.selectors.aiMessage, {
      timeout: this.timeout.long
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
    return await lastMessage.textContent() || '';
  }

  async getLastAIMessage(): Promise<string> {
    const aiMessages = this.page.locator(this.selectors.aiMessage);
    const lastAI = aiMessages.last();
    return await lastAI.textContent() || '';
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
    return await this.page.getAttribute(this.selectors.chatInput, 'placeholder') || '';
  }
}