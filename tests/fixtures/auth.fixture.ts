import { test as base } from "./base-test";
import { Page } from "@playwright/test";

/**
 * Test user credentials for different environments
 */
export const TEST_USERS = {
  // Primary test accounts
  primary: {
    email: "matt@mattcarpenter.com",
    name: "Matt Carpenter",
  },
  fiona: {
    email: "fiona.burgess.ext@sonymusic.com",
    name: "Fiona Burgess",
  },
  claude: {
    email: "claude@test.siam.ai",
    name: "Claude Test",
  },

  // Mailinator test account for magic link testing
  mailinator: {
    email: "siam-test-x7j9k2p4@mailinator.com",
    inboxUrl: "https://www.mailinator.com/v4/public/inboxes.jsp?to=siam-test-x7j9k2p4",
  },
} as const;

/**
 * Auth helper functions
 */
export class AuthHelper {
  constructor(private page: Page) {}

  /**
   * Login with magic link
   */
  async loginWithMagicLink(email: string) {
    await this.page.goto("/", { waitUntil: 'domcontentloaded' });
    await this.page.fill('input[type="email"]', email);
    await this.page.click('button:has-text("Send Magic Link")');

    // Wait for success message
    await this.page.waitForSelector("text=/Magic link sent|Check your email/i", {
      timeout: 30000,
    });
  }

  /**
   * Bypass auth for local development
   */
  async bypassAuth() {
    // Set bypass cookie or header
    await this.page.context().addCookies([
      {
        name: "bypass-auth",
        value: "true",
        domain: new URL(this.page.url()).hostname,
        path: "/",
      },
    ]);

    // Reload to apply bypass
    await this.page.reload();
  }

  /**
   * Wait for authenticated state
   */
  async waitForAuth() {
    // Wait for auth to complete - look for authenticated UI elements
    await Promise.race([
      this.page.waitForSelector('[data-testid="user-menu"]', { timeout: 30000 }),
      this.page.waitForSelector(".mac-professional", { timeout: 30000 }),
      this.page.waitForURL("**/dashboard", { timeout: 30000 }),
    ]);
  }

  /**
   * Logout from current session
   */
  async logout() {
    // Click user menu if exists
    const userMenu = this.page.locator('[data-testid="user-menu"]');
    if (await userMenu.isVisible()) {
      await userMenu.click();
      await this.page.click("text=/Logout|Sign out/i");
    }

    // Clear storage
    await this.page.context().clearCookies();
    await this.page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  }
}

/**
 * Extended test with auth helpers
 */
export const test = base.extend<{
  authHelper: AuthHelper;
  authenticatedPage: Page;
}>({
  authHelper: async ({ page }, use) => {
    const helper = new AuthHelper(page);
    await use(helper);
  },

  authenticatedPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const authHelper = new AuthHelper(page);

    // Bypass auth for testing
    if (process.env.NEXT_PUBLIC_BYPASS_AUTH === "true") {
      await page.goto("/", { waitUntil: 'domcontentloaded' });
      await authHelper.bypassAuth();
    } else {
      // Use real auth
      await authHelper.loginWithMagicLink(TEST_USERS.primary.email);
      await authHelper.waitForAuth();
    }

    await use(page);
    await context.close();
  },
});

export { expect } from "@playwright/test";
