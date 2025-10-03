import { expect, test } from "@playwright/test";
import { expectMacClassPresence } from "../helpers/design-system";
import { setupConsoleMonitoring, assertNoConsoleErrors } from "../helpers/console-monitor";

type ViewportConfig = {
  name: string;
  viewport: { width: number; height: number };
};

const viewports: ViewportConfig[] = [
  { name: "tablet", viewport: { width: 768, height: 1024 } },
  { name: "desktop", viewport: { width: 1440, height: 960 } },
];

for (const config of viewports) {
  test.describe(`${config.name} viewport`, () => {
    test.use({ viewport: config.viewport });

    test.beforeEach(async ({ page }) => {
      setupConsoleMonitoring(page, {
        ignoreWarnings: true,
        ignoreNetworkErrors: true,
      });
    });

    test.afterEach(async () => {
      assertNoConsoleErrors();
    });

    test(`renders SIAM hub without regressions @visual @smoke`, async ({ page }, testInfo) => {

      await page.goto("/", { waitUntil: "networkidle" });
      await page.waitForTimeout(500);

      // Check for either login form or app container (smoke test without auth)
      const hasLogin = await page.locator('input[type="email"]').isVisible({ timeout: 5000 }).catch(() => false);
      const hasApp = await page.getByTestId("app-container").isVisible({ timeout: 5000 }).catch(() => false);
      
      expect(hasLogin || hasApp, "Neither login nor app container found").toBeTruthy();
      
      // Only check MAC design if app is loaded (not login page)
      if (hasApp) {
        await expectMacClassPresence(page, 1);
      }

      // Only check panel color if app container is visible
      if (hasApp) {
        const panelLocator = page.locator("[data-testid='app-container'] main").last();
        const isPanelVisible = await panelLocator.isVisible({ timeout: 3000 }).catch(() => false);
        
        if (isPanelVisible) {
          const panelColor = await panelLocator.evaluate((node) =>
            window.getComputedStyle(node as HTMLElement).backgroundColor,
          );

          const rgbMatch = panelColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
          if (rgbMatch) {
            const r = Number(rgbMatch[1]);
            const g = Number(rgbMatch[2]);
            const b = Number(rgbMatch[3]);
            const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
            expect(luminance, "Center panel background should remain dark").toBeLessThan(80);
          }
        }
      }

      expect(consoleErrors, `Console errors in ${testInfo.title}`).toHaveLength(0);

      await expect(page).toHaveScreenshot(`responsive-hub-${config.name}.png`, {
        fullPage: true,
      });
    });
  });
}
