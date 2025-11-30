import { Page, expect } from "@playwright/test";

/**
 * Base Page Object - All page objects extend this
 * Provides common functionality for all pages
 */
export abstract class BasePage {
  protected readonly timeout = {
    short: 5000,
    medium: 15000,
    long: 30000,
  };

  constructor(protected readonly page: Page) {}

  /**
   * Navigate to the page
   */
  abstract navigate(): Promise<void>;

  /**
   * Wait for page to be ready
   * Uses domcontentloaded instead of load/networkidle - ElevenLabs widget
   * and other async resources prevent those events from firing reliably
   */
  async waitForLoad(): Promise<void> {
    await this.page.waitForLoadState("domcontentloaded");
  }

  /**
   * Navigate to a URL with domcontentloaded wait strategy
   * This is the preferred way to navigate in all tests
   */
  async navigateTo(url: string): Promise<void> {
    await this.page.goto(url, { waitUntil: 'domcontentloaded' });
  }

  /**
   * Take a screenshot for visual testing
   */
  async screenshot(name: string): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const path = `tests/04-visual/screenshots/${name}-${timestamp}.png`;
    await this.page.screenshot({ path, fullPage: true });
    return path;
  }

  /**
   * Check if element is visible
   */
  async isVisible(selector: string): Promise<boolean> {
    return this.page.isVisible(selector);
  }

  /**
   * Wait for element and get text
   */
  async getText(selector: string): Promise<string> {
    await this.page.waitForSelector(selector, { timeout: this.timeout.short });
    return this.page.textContent(selector) || "";
  }

  /**
   * Click element with retry
   */
  async clickWithRetry(selector: string, retries = 3): Promise<void> {
    for (let i = 0; i < retries; i++) {
      try {
        await this.page.click(selector, { timeout: this.timeout.short });
        return;
      } catch (error) {
        if (i === retries - 1) throw error;
        await this.page.waitForTimeout(1000);
      }
    }
  }
  /**
   * Fill input field
   */
  async fillInput(selector: string, value: string): Promise<void> {
    await this.page.waitForSelector(selector, { timeout: this.timeout.short });
    await this.page.fill(selector, value);
  }

  /**
   * Get current URL
   */
  getUrl(): string {
    return this.page.url();
  }

  /**
   * Wait for navigation
   */
  async waitForNavigation(urlPattern?: string | RegExp): Promise<void> {
    if (urlPattern) {
      await this.page.waitForURL(urlPattern, { timeout: this.timeout.medium });
    } else {
      await this.page.waitForLoadState("domcontentloaded");
    }
  }

  /**
   * Check for error messages
   */
  async hasError(): Promise<boolean> {
    const errorSelectors = [
      '[data-testid="error"]',
      ".error-message",
      '[role="alert"]',
      ".toast-error",
    ];

    for (const selector of errorSelectors) {
      if (await this.isVisible(selector)) {
        return true;
      }
    }
    return false;
  }
}
