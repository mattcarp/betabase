import { Page, Locator, test } from '@playwright/test';

/**
 * Self-Healing Page Wrapper
 * 
 * Intercepts Playwright actions and attempts to recover from selector failures
 * by analyzing the page content and finding alternative selectors.
 */
export class SelfHealingPage {
  constructor(private page: Page) {}

  /**
   * Navigate to a URL
   */
  async goto(url: string) {
    return this.page.goto(url);
  }

  /**
   * Wait for a selector to be visible
   */
  async waitForSelector(selector: string, options?: { timeout?: number }) {
    try {
      return await this.page.waitForSelector(selector, options);
    } catch (error) {
      console.log(`⚠️ Selector failed: "${selector}". Attempting self-healing...`);
      const healedSelector = await this.healSelector(selector);
      
      if (healedSelector) {
        console.log(`✨ Healed selector: "${healedSelector}"`);
        return await this.page.waitForSelector(healedSelector, options);
      }
      throw error;
    }
  }

  /**
   * Click an element
   */
  async click(selector: string, options?: { timeout?: number }) {
    try {
      await this.page.click(selector, { timeout: 2000, ...options });
    } catch (error) {
      console.log(`⚠️ Click failed on "${selector}". Attempting self-healing...`);
      const healedSelector = await this.healSelector(selector);
      
      if (healedSelector) {
        console.log(`✨ Retrying click with: "${healedSelector}"`);
        await this.page.click(healedSelector, options);
        return;
      }
      throw error;
    }
  }

  /**
   * Fill an input
   */
  async fill(selector: string, value: string, options?: { timeout?: number }) {
    try {
      await this.page.fill(selector, value, { timeout: 2000, ...options });
    } catch (error) {
      console.log(`⚠️ Fill failed on "${selector}". Attempting self-healing...`);
      const healedSelector = await this.healSelector(selector);
      
      if (healedSelector) {
        console.log(`✨ Retrying fill with: "${healedSelector}"`);
        await this.page.fill(healedSelector, value, options);
        return;
      }
      throw error;
    }
  }

  /**
   * Get input value
   */
  async inputValue(selector: string, options?: { timeout?: number }) {
    try {
      return await this.page.inputValue(selector, { timeout: 2000, ...options });
    } catch (error) {
      console.log(`⚠️ inputValue failed on "${selector}". Attempting self-healing...`);
      const healedSelector = await this.healSelector(selector);
      
      if (healedSelector) {
        return await this.page.inputValue(healedSelector, options);
      }
      throw error;
    }
  }

  /**
   * Attempt to find a working selector based on the broken one
   * This is a simplified heuristic-based approach. In a real system, 
   * this would call an LLM with the page HTML.
   */
  private async healSelector(brokenSelector: string): Promise<string | null> {
    // 1. Analyze the broken selector to guess intent
    
    // Case A: Data-testid changed (common in React apps)
    // e.g. [data-testid="chat-input-broken-v1"] -> look for other inputs
    if (brokenSelector.includes('input') || brokenSelector.includes('textarea')) {
      // Try to find any visible textarea or input
      const inputs = await this.page.$$('textarea, input[type="text"]');
      for (const input of inputs) {
        if (await input.isVisible()) {
          // If there's only one visible input/textarea, it's a safe bet
          // For chat apps, usually the main input is a textarea
          const tagName = await input.evaluate(el => el.tagName.toLowerCase());
          const placeholder = await input.getAttribute('placeholder');
          
          if (tagName === 'textarea' || (placeholder && placeholder.toLowerCase().includes('ask'))) {
            // Generate a robust selector for this element
            if (placeholder) {
              return `${tagName}[placeholder="${placeholder}"]`;
            }
            return tagName;
          }
        }
      }
    }

    // Case B: Button text changed or class changed
    // e.g. button.submit-btn -> look for button with "Send" or icon
    if (brokenSelector.includes('button') || brokenSelector.includes('btn')) {
      // Try to find buttons by common chat actions
      const commonActions = ['Send', 'Submit', 'Chat', 'Search'];
      for (const action of commonActions) {
        const el = this.page.getByRole('button', { name: action });
        if (await el.isVisible()) {
          return `button:has-text("${action}")`;
        }
      }
      
      // Look for submit buttons
      const submitBtn = this.page.locator('button[type="submit"]');
      if (await submitBtn.isVisible()) {
        return 'button[type="submit"]';
      }
    }

    // Case C: Text content search
    // If selector was ID or class based, try to find element by text if we can guess it
    // (This is hard without knowing expected text)

    return null;
  }
}
