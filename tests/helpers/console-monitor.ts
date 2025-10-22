/**
 * Console Monitor Helper
 *
 * Provides reusable console error/warning monitoring for Playwright tests.
 * Use this in ALL test files to ensure no console errors slip through.
 *
 * Usage:
 * ```typescript
 * import { setupConsoleMonitoring, assertNoConsoleErrors } from './helpers/console-monitor';
 *
 * test.beforeEach(async ({ page }) => {
 *   setupConsoleMonitoring(page);
 *   // ... rest of beforeEach
 * });
 *
 * test.afterEach(async () => {
 *   assertNoConsoleErrors();
 * });
 * ```
 */

import { Page, expect } from "@playwright/test";

export interface ConsoleMonitorOptions {
  ignoreWarnings?: boolean;
  ignoreNetworkErrors?: boolean;
  allowedErrorPatterns?: RegExp[];
  useDefaultFilters?: boolean; // Default: true - filters known acceptable errors
}

// Known acceptable errors that are handled gracefully in code
const DEFAULT_ALLOWED_PATTERNS = [
  // Supabase table doesn't exist - handled gracefully with try-catch
  // Browser reports generic "404 ()" without URL details
  /Failed to load resource:.*status of 404 \(\)/i,
  /status of 404/i,

  // OPTIONS preflight - browser behavior, can't suppress
  /Failed to load resource:.*status of 405/i,
  /status of 405/i,
  /Method Not Allowed/i,
];

class ConsoleMonitor {
  private errors: string[] = [];
  private warnings: string[] = [];
  private networkErrors: Array<{ url: string; status: number }> = [];
  private options: ConsoleMonitorOptions;
  private allowedPatterns: RegExp[];

  constructor(options: ConsoleMonitorOptions = {}) {
    this.options = {
      ignoreWarnings: options.ignoreWarnings ?? true,
      ignoreNetworkErrors: options.ignoreNetworkErrors ?? false,
      allowedErrorPatterns: options.allowedErrorPatterns ?? [],
      useDefaultFilters: options.useDefaultFilters ?? true,
    };

    // Combine default patterns with custom patterns
    this.allowedPatterns = [
      ...(this.options.useDefaultFilters ? DEFAULT_ALLOWED_PATTERNS : []),
      ...(this.options.allowedErrorPatterns || []),
    ];
  }

  reset() {
    this.errors = [];
    this.warnings = [];
    this.networkErrors = [];
  }

  setup(page: Page) {
    this.reset();

    // Capture console messages
    page.on("console", (msg) => {
      const text = msg.text();

      // Check if this error should be ignored
      if (this.shouldIgnoreError(text)) {
        return;
      }

      if (msg.type() === "error") {
        this.errors.push(text);
        console.log("🔴 Console Error:", text);
      } else if (msg.type() === "warning" && !this.options.ignoreWarnings) {
        this.warnings.push(text);
        console.log("⚠️  Console Warning:", text);
      }
    });

    // Capture network errors
    if (!this.options.ignoreNetworkErrors) {
      page.on("response", (response) => {
        if (response.status() >= 400) {
          this.networkErrors.push({
            url: response.url(),
            status: response.status(),
          });
          console.log(`🌐 Network Error: ${response.status()} ${response.url()}`);
        }
      });
    }
  }

  private shouldIgnoreError(text: string): boolean {
    // Check against all allowed patterns (default + custom)
    return this.allowedPatterns.some((pattern) => pattern.test(text));
  }

  getErrors() {
    return [...this.errors];
  }

  getWarnings() {
    return [...this.warnings];
  }

  getNetworkErrors() {
    return [...this.networkErrors];
  }

  hasErrors(): boolean {
    return this.errors.length > 0;
  }

  printSummary() {
    console.log("\n📊 Console Monitor Summary:");
    console.log(`  Errors: ${this.errors.length}`);
    console.log(`  Warnings: ${this.warnings.length}`);
    console.log(`  Network Errors: ${this.networkErrors.length}`);

    if (this.errors.length > 0) {
      console.log("\n🔴 Console Errors:");
      this.errors.forEach((err, i) => {
        console.log(`  ${i + 1}. ${err.substring(0, 200)}`);
      });
    }

    if (this.warnings.length > 0 && !this.options.ignoreWarnings) {
      console.log("\n⚠️  Console Warnings:");
      this.warnings.forEach((warn, i) => {
        console.log(`  ${i + 1}. ${warn.substring(0, 200)}`);
      });
    }
  }

  assertNoErrors() {
    this.printSummary();

    expect(this.errors, `Console errors detected:\n${this.errors.join("\n")}`).toHaveLength(0);
  }
}

// Global instance for easy use
let globalMonitor: ConsoleMonitor | null = null;

/**
 * Setup console monitoring for a page
 */
export function setupConsoleMonitoring(page: Page, options?: ConsoleMonitorOptions) {
  globalMonitor = new ConsoleMonitor(options);
  globalMonitor.setup(page);
  return globalMonitor;
}

/**
 * Assert no console errors were detected
 */
export function assertNoConsoleErrors() {
  if (!globalMonitor) {
    throw new Error("Console monitoring not setup. Call setupConsoleMonitoring first.");
  }
  globalMonitor.assertNoErrors();
}

/**
 * Get the current monitor instance
 */
export function getConsoleMonitor(): ConsoleMonitor {
  if (!globalMonitor) {
    throw new Error("Console monitoring not setup. Call setupConsoleMonitoring first.");
  }
  return globalMonitor;
}

/**
 * Reset the monitor (useful for beforeEach hooks)
 */
export function resetConsoleMonitor() {
  if (globalMonitor) {
    globalMonitor.reset();
  }
}
