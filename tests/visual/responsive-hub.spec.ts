import { expect, test } from "@playwright/test";
import { expectMacClassPresence } from "../helpers/design-system";

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

    test(`renders SIAM hub without regressions @visual @smoke`, async ({ page }, testInfo) => {
      const consoleErrors: string[] = [];
      page.on("console", (msg) => {
        if (msg.type() === "error") {
          const text = msg.text();
          if (
            !text.includes("AOMA health check") &&
            !text.includes("Maximum update depth")
          ) {
            consoleErrors.push(text);
          }
        }
      });

      await page.goto("/", { waitUntil: "networkidle" });
      await page.waitForTimeout(500);

      await expect(page.getByTestId("app-container"), "App container missing").toBeVisible();
      await expectMacClassPresence(page, 1);

      const panelLocator = page.locator("[data-testid='app-container'] main").last();
      await expect(panelLocator, "Chat main panel not found").toBeVisible();

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

      expect(consoleErrors, `Console errors in ${testInfo.title}`).toHaveLength(0);

      await expect(page).toHaveScreenshot(`responsive-hub-${config.name}.png`, {
        fullPage: true,
      });
    });
  });
}
