import { expect, Page, APIRequestContext } from "@playwright/test";

export async function navigateTo(
  page: Page,
  url: string,
  waitFor: "load" | "domcontentloaded" | "networkidle" = "networkidle"
) {
  const res = await page.goto(url, { waitUntil: waitFor });
  expect(res?.ok(), `Failed to navigate to ${url}`).toBeTruthy();
}

export async function clickAndWait(page: Page, selector: string) {
  await page.waitForSelector(selector, { state: "visible" });
  await page.click(selector);
}

export async function typeAndSubmit(page: Page, selector: string, text: string) {
  await page.waitForSelector(selector, { state: "visible" });
  await page.fill(selector, text);
  await page.keyboard.press("Enter");
}

export async function waitForText(
  page: Page,
  selector: string,
  expected: string,
  timeoutMs = 10_000
) {
  await page.waitForSelector(selector, { state: "visible", timeout: timeoutMs });
  const content = await page.textContent(selector);
  expect(content ?? "").toContain(expected);
}

export async function bypassDevAuth(page: Page) {
  // Expect project to support a dev auth bypass route or cookie pattern.
  // Adjust if your app uses a different mechanism.
  await page.addInitScript(() => {
    try {
      localStorage.setItem("siam_dev_auth", "true");
    } catch {}
  });
}

export async function waitForNoConsoleErrors(page: Page) {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  // Give some time for potential errors to surface (used after navigation/critical ops)
  await page.waitForTimeout(250);
  expect(errors, `Console errors detected:\n${errors.join("\n")}`).toHaveLength(0);
}

export async function apiHealthCheck(request: APIRequestContext, url: string) {
  const res = await request.get(url);
  expect(res.ok()).toBeTruthy();
}

export async function reliableExpectVisible(page: Page, selector: string, timeoutMs = 10_000) {
  await page.waitForSelector(selector, { state: "visible", timeout: timeoutMs });
  await expect(page.locator(selector)).toBeVisible();
}

export async function ensureLoggedOut(page: Page) {
  try {
    await page.context().clearCookies();
    await page.evaluate(() => {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch {}
    });
  } catch {}
}


