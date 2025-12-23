/**
 * Self-Healing Page Object
 *
 * Wraps Playwright page with self-healing selector capabilities.
 * When a selector fails, it attempts to find alternative selectors.
 */

import { Page } from '@playwright/test';

interface SelectorAlternatives {
  [broken: string]: string[];
}

// Map of known broken selectors to their working alternatives
const SELECTOR_ALTERNATIVES: SelectorAlternatives = {
  '[data-testid="chat-input-broken-v1"]': [
    'textarea[name="message"]',
    'textarea[placeholder*="Ask"]',
    'textarea',
  ],
};

export class SelfHealingPage {
  private page: Page;
  private healingLog: string[] = [];

  constructor(page: Page) {
    this.page = page;
  }

  async goto(path: string): Promise<void> {
    await this.page.goto(path);
    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * Self-healing fill operation.
   * Tries the provided selector first, then falls back to alternatives.
   */
  async fill(selector: string, value: string): Promise<void> {
    // Try the original selector first
    try {
      const element = this.page.locator(selector);
      if (await element.isVisible({ timeout: 2000 })) {
        await element.fill(value);
        return;
      }
    } catch {
      this.healingLog.push(`Selector "${selector}" failed, attempting healing...`);
    }

    // Try alternatives if original failed
    const alternatives = SELECTOR_ALTERNATIVES[selector] || [];
    for (const alt of alternatives) {
      try {
        const element = this.page.locator(alt);
        if (await element.isVisible({ timeout: 2000 })) {
          this.healingLog.push(`Healed: "${selector}" -> "${alt}"`);
          console.log(`Self-healed selector: ${selector} -> ${alt}`);
          await element.fill(value);
          return;
        }
      } catch {
        continue;
      }
    }

    // If no alternatives worked, try common fallbacks
    const commonSelectors = [
      'textarea[name="message"]',
      'textarea[placeholder*="Ask"]',
      'input[type="text"]',
      'textarea',
    ];

    for (const fallback of commonSelectors) {
      try {
        const element = this.page.locator(fallback).first();
        if (await element.isVisible({ timeout: 1000 })) {
          this.healingLog.push(`Fallback healed: "${selector}" -> "${fallback}"`);
          console.log(`Self-healed with fallback: ${selector} -> ${fallback}`);
          await element.fill(value);
          return;
        }
      } catch {
        continue;
      }
    }

    throw new Error(`Self-healing failed for selector: ${selector}`);
  }

  /**
   * Self-healing click operation.
   */
  async click(selector: string): Promise<void> {
    try {
      await this.page.click(selector, { timeout: 5000 });
    } catch {
      this.healingLog.push(`Click on "${selector}" failed, attempting healing...`);
      // Try alternatives or throw
      throw new Error(`Self-healing failed for click on: ${selector}`);
    }
  }

  getHealingLog(): string[] {
    return [...this.healingLog];
  }
}
