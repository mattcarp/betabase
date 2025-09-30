import { expect, Page } from "@playwright/test";

export async function expectMacDesignTokensLoaded(page: Page) {
  const tokens = await page.evaluate(() => {
    const style = getComputedStyle(document.documentElement);
    return {
      primary: style.getPropertyValue("--mac-primary-500"),
      spacing: style.getPropertyValue("--mac-spacing-4"),
      fontWeight: style.getPropertyValue("--mac-font-weight-400"),
    };
  });

  expect(tokens.primary.trim(), "Missing --mac-primary-500 token").not.toHaveLength(0);
  expect(tokens.spacing.trim(), "Missing --mac-spacing-4 token").not.toHaveLength(0);
  expect(tokens.fontWeight.trim(), "Missing --mac-font-weight-400 token").not.toHaveLength(0);
}

export async function expectMacClassPresence(page: Page, minimum = 1) {
  const count = await page.locator('[class*="mac-"]').count();
  expect(count, "Expected MAC design classes on the page").toBeGreaterThanOrEqual(minimum);
}

export async function expectMacTypographyWeights(page: Page, selector: string) {
  const weights = await page.locator(selector).evaluateAll((nodes) =>
    nodes.map((node) => getComputedStyle(node as HTMLElement).fontWeight),
  );

  for (const weight of weights) {
    const normalized = weight === "normal" ? "400" : weight;
    const parsed = Number(normalized);
    expect(
      [100, 200, 300, 400].includes(parsed),
      `Unexpected typography weight ${weight} for selector ${selector}`,
    ).toBeTruthy();
  }
}
