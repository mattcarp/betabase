import { Page, expect, BrowserContext } from "@playwright/test";

export const TEST_USERS = {
  admin: {
    email: "matt@mattcarpenter.com",
    name: "Matt Carpenter",
  },
  fiona: {
    email: "fiona@fionaburgess.com",
    name: "Fiona Burgess",
  },
  sony: {
    email: "fiona.burgess.ext@sonymusic.com",
    name: "Fiona Burgess (Sony)",
  },
  test: {
    email: "claude@test.siam.ai",
    name: "Claude Test",
  },
};

export class TestHelpers {
  constructor(private page: Page) {}

  async bypassAuth(userEmail: string = TEST_USERS.admin.email) {
    await this.page.evaluate((email) => {
      localStorage.setItem(
        "siam_user",
        JSON.stringify({
          email,
          authToken: "test-token-bypass",
          verifiedAt: new Date().toISOString(),
        }),
      );
    }, userEmail);
  }

  async waitForPageReady() {
    await this.page.waitForLoadState("networkidle");
    await this.page.waitForTimeout(1000);
  }

  async checkNoErrors() {
    const errors = await this.page.evaluate(() => {
      const errorDivs = document.querySelectorAll("[data-nextjs-error]");
      const consoleErrors = (window as any).__consoleErrors || [];
      return {
        nextjsErrors: errorDivs.length,
        consoleErrors,
      };
    });

    expect(errors.nextjsErrors).toBe(0);
    expect(errors.consoleErrors).toHaveLength(0);
  }

  async takeDebugScreenshot(name: string) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    await this.page.screenshot({
      path: `tests/screenshots/${name}-${timestamp}.png`,
      fullPage: true,
    });
  }

  async waitForElement(selector: string, options?: { timeout?: number }) {
    await this.page.waitForSelector(selector, {
      state: "visible",
      timeout: options?.timeout || 10000,
    });
  }

  async clickAndWait(selector: string, waitForSelector?: string) {
    await this.page.click(selector);
    if (waitForSelector) {
      await this.waitForElement(waitForSelector);
    } else {
      await this.page.waitForTimeout(500);
    }
  }

  async fillForm(fields: Record<string, string>) {
    for (const [selector, value] of Object.entries(fields)) {
      await this.page.fill(selector, value);
    }
  }

  async uploadFile(selector: string, filePath: string) {
    const fileInput = await this.page.$(selector);
    if (fileInput) {
      await fileInput.setInputFiles(filePath);
    }
  }

  async waitForAPIResponse(
    urlPattern: string | RegExp,
    options?: { status?: number },
  ) {
    return this.page.waitForResponse(
      (resp) => {
        const urlMatches =
          typeof urlPattern === "string"
            ? resp.url().includes(urlPattern)
            : urlPattern.test(resp.url());
        const statusMatches = options?.status
          ? resp.status() === options.status
          : true;
        return urlMatches && statusMatches;
      },
      { timeout: 30000 },
    );
  }

  async monitorConsoleErrors() {
    await this.page.evaluate(() => {
      (window as any).__consoleErrors = [];
      const originalError = console.error;
      console.error = (...args) => {
        (window as any).__consoleErrors.push(args.join(" "));
        originalError.apply(console, args);
      };
    });
  }

  async getConsoleErrors(): Promise<string[]> {
    return this.page.evaluate(() => (window as any).__consoleErrors || []);
  }

  async selectTab(tabName: string) {
    await this.page.click(`button[role="tab"]:has-text("${tabName}")`);
    await this.page.waitForTimeout(500);
  }

  async checkElementVisible(selector: string): Promise<boolean> {
    try {
      await this.page.waitForSelector(selector, {
        state: "visible",
        timeout: 5000,
      });
      return true;
    } catch {
      return false;
    }
  }

  async checkTextVisible(text: string): Promise<boolean> {
    try {
      await this.page.waitForSelector(`text="${text}"`, {
        state: "visible",
        timeout: 5000,
      });
      return true;
    } catch {
      return false;
    }
  }

  async waitForToast(text?: string) {
    const toastSelector = text
      ? `[role="status"]:has-text("${text}")`
      : '[role="status"]';
    await this.waitForElement(toastSelector);
  }
}
