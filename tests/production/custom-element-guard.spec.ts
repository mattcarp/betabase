import { test, expect } from '../fixtures/base-test';

/**
 * Production test to verify CustomElementGuard prevents web component conflicts
 * This test specifically checks for the issue that broke production in September 2024
 */

test.describe("Custom Element Guard - Localhost Multi-Tab", () => {
  test("should not throw duplicate custom element errors with multiple pages", async ({
    browser,
  }) => {
    // Track console errors across all pages
    const consoleErrors: { page: string; message: string }[] = [];

    // Create first page/tab
    const page1 = await browser.newPage();
    page1.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push({ page: "page1", message: msg.text() });
      }
    });
    page1.on("pageerror", (error) => {
      consoleErrors.push({ page: "page1", message: error.message });
    });

    // Create second page/tab
    const page2 = await browser.newPage();
    page2.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push({ page: "page2", message: msg.text() });
      }
    });
    page2.on("pageerror", (error) => {
      consoleErrors.push({ page: "page2", message: error.message });
    });

    // Navigate both pages to the app
    await Promise.all([
      page1.goto("http://localhost:3000"),
      page2.goto("http://localhost:3000"),
    ]);

    // Wait for pages to fully load
    await Promise.all([
      page1.waitForLoadState("networkidle"),
      page2.waitForLoadState("networkidle"),
    ]);

    // Give some time for any delayed scripts to run
    await page1.waitForTimeout(2000);
    await page2.waitForTimeout(2000);

    // Check for custom element errors
    const customElementErrors = consoleErrors.filter(
      (e) =>
        e.message.includes("already been defined") ||
        e.message.includes("already defined") ||
        e.message.includes("custom element") ||
        e.message.includes("mce-autosize")
    );

    console.log("All console errors:", consoleErrors);
    console.log("Custom element errors:", customElementErrors);

    // The guard should prevent these errors
    expect(
      customElementErrors.length,
      `Found custom element errors: ${JSON.stringify(customElementErrors)}`
    ).toBe(0);

    // Cleanup
    await page1.close();
    await page2.close();
  });

  test("should have inline custom element guard in HTML head", async ({
    page,
  }) => {
    await page.goto("http://localhost:3000", { waitUntil: 'domcontentloaded' });

    // Check that the inline script is present in the head
    const guardScript = await page.evaluate(() => {
      const scripts = document.querySelectorAll("head script");
      for (const script of scripts) {
        if (
          script.textContent &&
          script.textContent.includes("customElements.define")
        ) {
          return script.textContent;
        }
      }
      return null;
    });

    expect(guardScript).not.toBeNull();
    expect(guardScript).toContain("window.customElements.get(name)");
    console.log("Guard script found in head");
  });

  test("should gracefully handle duplicate custom element registration", async ({
    page,
  }) => {
    const consoleMessages: string[] = [];
    page.on("console", (msg) => {
      consoleMessages.push(msg.text());
    });

    await page.goto("http://localhost:3000", { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState("networkidle");

    // Try to register a custom element that may already exist
    const result = await page.evaluate(() => {
      try {
        // Try to define a test custom element twice
        class TestElement extends HTMLElement {}
        window.customElements.define("test-guard-element", TestElement);
        window.customElements.define("test-guard-element", TestElement);
        return { success: true, error: null };
      } catch (e: unknown) {
        const error = e as Error;
        return { success: false, error: error.message };
      }
    });

    // The guard should prevent the error
    expect(result.success).toBe(true);
    expect(result.error).toBeNull();

    // Should see the info message about skipping re-registration
    const skipMessage = consoleMessages.find((m) =>
      m.includes("already defined, skipping")
    );
    expect(skipMessage).toBeDefined();
  });
});

test.describe("CustomElementGuard Protection", () => {
  test.beforeEach(async ({ page }) => {
    // Monitor console for errors
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        console.error("Console error:", msg.text());
      }
    });
  });

  test("No web component registration errors on login page", async ({ page }) => {
    const errors: string[] = [];

    // Capture all console errors
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });

    // Navigate to production
    await page.goto("/", {
      waitUntil: "networkidle",
    });

    // Wait for page to fully load
    await page.waitForTimeout(2000);

    // Check for the specific error that was breaking production
    const hasCustomElementError = errors.some(
      (error) =>
        error.includes("CustomElementRegistry") ||
        error.includes("ace-autosize-textarea") ||
        error.includes("Failed to execute 'define'")
    );

    expect(hasCustomElementError).toBeFalsy();
  });

  test("Authentication flow completes without component errors", async ({ page }) => {
    const errors: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });

    page.on("pageerror", (error) => {
      errors.push(error.message);
    });

    // Navigate to login
    await page.goto("/", { waitUntil: 'domcontentloaded' });

    // Check login form is present
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 10000 });

    // Enter test email
    await page.fill('input[type="email"]', "siam-test-x7j9k2p4@mailinator.com");

    // Click send magic link
    await page.click('button:has-text("Send Magic Link")');

    // Wait for response
    await page.waitForTimeout(3000);

    // Verify no critical errors occurred
    const criticalErrors = errors.filter(
      (error) =>
        !error.includes("Failed to load resource") && // Ignore CDN issues
        !error.includes("ResizeObserver") && // Ignore browser quirk
        !error.includes("Non-Error promise rejection") // Ignore promise warnings
    );

    // Log any errors for debugging
    if (criticalErrors.length > 0) {
      console.log("Critical errors found:", criticalErrors);
    }

    expect(criticalErrors).toHaveLength(0);
  });

  test("CustomElementGuard prevents duplicate registrations", async ({ page }) => {
    await page.goto("/", { waitUntil: 'domcontentloaded' });

    // Try to register a custom element that might conflict
    const registrationResult = await page.evaluate(() => {
      try {
        // Attempt to define a test custom element
        class TestElement extends HTMLElement {}

        // Try to define it twice (guard should silently skip the second registration)
        customElements.define("test-element-guard", TestElement);

        // Try again - CustomElementGuard should silently skip (no error thrown)
        try {
          customElements.define("test-element-guard", TestElement);
          return "duplicate-silently-skipped"; // Expected with guard
        } catch (e) {
          return "duplicate-threw-error"; // Would happen without guard
        }
      } catch (e) {
        return "initial-registration-failed";
      }
    });

    // The guard should silently skip duplicate registrations (not throw errors)
    expect(registrationResult).toBe("duplicate-silently-skipped");
  });

  test("Page loads without Supabase reference errors", async ({ page }) => {
    const errors: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });

    await page.goto("/", { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState("networkidle");

    // Check for Supabase-related errors that were in the original bug
    const hasSupabaseError = errors.some(
      (error) =>
        error.includes("SupabaseVectorStore") ||
        error.includes("ReferenceError") ||
        error.includes("AISaChatPanel")
    );

    expect(hasSupabaseError).toBeFalsy();
  });

  test("Health endpoint confirms application is running", async ({ request }) => {
    const response = await request.get("http://localhost:3000/api/health");

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.status).toBe("healthy");
  });
});

test.describe("Production Smoke Tests", () => {
  test("Critical user journey works end-to-end", async ({ page }) => {
    // Navigate to home
    await page.goto("/", { waitUntil: 'domcontentloaded' });

    // Verify page loaded
    await expect(page).toHaveTitle(/Betabase/i);

    // Check login form is functional
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();
    await expect(emailInput).toBeEnabled();

    // Check send button is functional
    const sendButton = page.locator('button:has-text("Send Magic Link")');
    await expect(sendButton).toBeVisible();
    await expect(sendButton).toBeEnabled();

    // Verify no JavaScript errors on page
    const jsErrors = await page.evaluate(() => {
      return window.console.error ? false : true;
    });

    expect(jsErrors).toBeTruthy();
  });

  test("Application responds quickly", async ({ page }) => {
    const startTime = Date.now();

    const response = await page.goto("/", {
      waitUntil: "domcontentloaded",
    });

    const loadTime = Date.now() - startTime;

    // Page should load in under 5 seconds
    expect(loadTime).toBeLessThan(5000);

    // Response should be successful
    expect(response?.status()).toBeLessThan(400);
  });
});
