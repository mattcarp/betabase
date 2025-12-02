/**
 * Fiona's Comprehensive MAC Design System Audit
 * Systematic visual and code analysis of SIAM application
 *
 * PRODUCTION TESTING: This test runs against https://thebetabase.com
 * Uses Mailinator for magic link authentication
 */

import { Page } from '@playwright/test';
import { test, expect } from './fixtures/base-test';
import * as fs from "fs";
import * as path from "path";

const BASE_URL = "http://localhost:3000";
const AUDIT_DIR = "/Users/matt/Documents/projects/siam/audit-results";

// Ensure audit directory exists
if (!fs.existsSync(AUDIT_DIR)) {
  fs.mkdirSync(AUDIT_DIR, { recursive: true });
}

interface UISection {
  name: string;
  url: string;
  selector?: string;
  waitFor?: string;
}

const UI_SECTIONS: UISection[] = [
  { name: "login", url: "/", selector: "form", waitFor: 'input[type="email"]' },
  { name: "dashboard", url: "/dashboard", selector: ".mac-professional" },
  { name: "chat-interface", url: "/", selector: ".mac-glass" },
  { name: "settings", url: "/settings", selector: ".mac-card" },
];

/**
 * Mailinator Magic Link Authentication Helper
 * Retrieves magic link from Mailinator inbox for authentication
 */
async function getMagicLinkFromMailinator(page: Page, email: string): Promise<string> {
  const username = email.split("@")[0];

  console.log(`  📧 Checking Mailinator inbox for ${email}...`);

  await page.goto(`https://www.mailinator.com/v4/public/inboxes.jsp?to=${username}`, {
    waitUntil: "networkidle",
    timeout: 30000,
  });

  // Wait for email to arrive (poll for up to 30 seconds)
  await page.waitForSelector("tr.ng-scope", { timeout: 30000 });
  await page.waitForTimeout(2000); // Let inbox fully load

  // Click the first email in the inbox
  const firstEmail = page.locator("tr.ng-scope").first();
  await firstEmail.waitFor({ state: "visible", timeout: 10000 });
  await firstEmail.click();
  await page.waitForTimeout(3000);

  // Get the magic link from the email iframe
  const frame = page.frameLocator("#html_msg_body");
  const magicLink = await frame
    .locator('a:has-text("Sign In"), a:has-text("Verify"), a:has-text("Login")')
    .first()
    .getAttribute("href");

  if (!magicLink) {
    throw new Error("Magic link not found in email");
  }

  console.log(`  ✅ Magic link retrieved`);
  return magicLink;
}

test.describe("Fiona Design Audit - MAC Design System Compliance", () => {
  // Shared authentication - run once before all tests
  let authContext: any;
  let authenticated = false;

  // Increase timeout for authentication and audit operations
  test.setTimeout(120000); // 2 minutes per test

  test.beforeEach(async ({ browser, page }) => {
    // Set viewport to desktop
    await page.setViewportSize({ width: 1440, height: 900 });

    // Authenticate once for all tests (shared across workers)
    if (!authenticated) {
      console.log("\n🔐 Authenticating with production via Mailinator...");

      // Create a unique test email
      const testEmail = `siam-audit-${Date.now()}@mailinator.com`;
      console.log(`  📧 Using test email: ${testEmail}`);

      try {
        // 1. Navigate to login page
        await page.goto(BASE_URL, { waitUntil: "domcontentloaded", timeout: 60000 });
        await page.waitForTimeout(2000);

        // 2. Enter email and request magic link
        await page.fill('input[type="email"]', testEmail);
        await page.click('button:has-text("Send Magic Link"), button:has-text("Continue")');

        console.log(`  ⏳ Magic link sent, waiting for email...`);
        await page.waitForTimeout(5000);

        // 3. Open new page for Mailinator
        const mailinatorPage = await browser.newPage();
        const magicLink = await getMagicLinkFromMailinator(mailinatorPage, testEmail);
        await mailinatorPage.close();

        // 4. Navigate to magic link to authenticate
        await page.goto(magicLink, { waitUntil: "domcontentloaded", timeout: 60000 });
        await page.waitForTimeout(3000);

        console.log("  ✅ Authentication successful!\n");
        authenticated = true;
      } catch (error) {
        console.error("  ❌ Authentication failed:", error);
        // Don't throw - let individual tests handle auth failure
      }
    }
  });

  test("Phase 1: Visual UI/UX Scoring - Screenshot Capture", async ({ page }) => {
    const results: any[] = [];

    for (const section of UI_SECTIONS) {
      console.log(`\n📸 Capturing ${section.name}...`);

      try {
        await page.goto(`${BASE_URL}${section.url}`, {
          waitUntil: "networkidle",
          timeout: 30000,
        });

        // Wait for specific element if defined
        if (section.waitFor) {
          await page.waitForSelector(section.waitFor, { timeout: 10000 });
        }

        // Wait a bit for animations
        await page.waitForTimeout(1000);

        // Capture full page screenshot
        const screenshotPath = path.join(AUDIT_DIR, `${section.name}-desktop.png`);
        await page.screenshot({
          path: screenshotPath,
          fullPage: true,
        });

        // Capture console errors
        const consoleErrors: string[] = [];
        page.on("console", (msg) => {
          if (msg.type() === "error") {
            consoleErrors.push(msg.text());
          }
        });

        // Get computed styles for MAC compliance check
        const macCompliance = await page.evaluate(() => {
          const body = document.body;
          const computedStyle = window.getComputedStyle(body);

          return {
            backgroundColor: computedStyle.backgroundColor,
            color: computedStyle.color,
            fontFamily: computedStyle.fontFamily,
            fontWeight: computedStyle.fontWeight,
          };
        });

        // Check for MAC CSS variables
        const macVariables = await page.evaluate(() => {
          const root = document.documentElement;
          const computedStyle = window.getComputedStyle(root);

          const macVars: Record<string, string> = {};
          const relevantVars = [
            "--mac-surface-background",
            "--mac-surface-elevated",
            "--mac-text-primary",
            "--mac-text-secondary",
            "--mac-primary-blue-400",
            "--mac-accent-purple-400",
            "--mac-utility-border",
          ];

          relevantVars.forEach((varName) => {
            macVars[varName] = computedStyle.getPropertyValue(varName);
          });

          return macVars;
        });

        // Find all elements using hardcoded colors instead of MAC variables
        const hardcodedColors = await page.evaluate(() => {
          const elements = document.querySelectorAll("*");
          const violations: any[] = [];

          elements.forEach((el) => {
            const computed = window.getComputedStyle(el);
            const inlineStyle = (el as HTMLElement).style;

            // Check for hardcoded background colors
            if (
              inlineStyle.backgroundColor &&
              !inlineStyle.backgroundColor.includes("var(--mac-")
            ) {
              violations.push({
                tag: el.tagName,
                class: el.className,
                type: "backgroundColor",
                value: inlineStyle.backgroundColor,
              });
            }

            // Check for hardcoded colors
            if (inlineStyle.color && !inlineStyle.color.includes("var(--mac-")) {
              violations.push({
                tag: el.tagName,
                class: el.className,
                type: "color",
                value: inlineStyle.color,
              });
            }
          });

          return violations;
        });

        results.push({
          section: section.name,
          url: section.url,
          screenshot: screenshotPath,
          consoleErrors,
          macCompliance,
          macVariables,
          hardcodedColors: hardcodedColors.slice(0, 10), // First 10 violations
        });

        console.log(`✅ ${section.name} captured`);
        console.log(`   Console errors: ${consoleErrors.length}`);
        console.log(`   Hardcoded colors found: ${hardcodedColors.length}`);
      } catch (error) {
        console.error(`❌ Failed to capture ${section.name}:`, error);
        results.push({
          section: section.name,
          url: section.url,
          error: error.message,
        });
      }
    }

    // Save results
    const resultsPath = path.join(AUDIT_DIR, "visual-audit-results.json");
    fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
    console.log(`\n📊 Results saved to: ${resultsPath}`);
  });

  test("Phase 2: Responsive Testing", async ({ page }) => {
    const viewports = [
      { name: "mobile", width: 375, height: 667 },
      { name: "tablet", width: 768, height: 1024 },
      { name: "desktop", width: 1440, height: 900 },
    ];

    for (const viewport of viewports) {
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      });

      await page.goto(BASE_URL, {
        waitUntil: "networkidle",
        timeout: 30000,
      });

      const screenshotPath = path.join(AUDIT_DIR, `responsive-${viewport.name}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.log(`📱 ${viewport.name} screenshot captured`);
    }
  });

  test("Phase 3: Typography Weight Audit", async ({ page }) => {
    await page.goto(BASE_URL, {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    // Find all elements with font-weight not in [100, 200, 300, 400]
    const typographyViolations = await page.evaluate(() => {
      const elements = document.querySelectorAll("*");
      const violations: any[] = [];
      const allowedWeights = ["100", "200", "300", "400"];

      elements.forEach((el) => {
        const computed = window.getComputedStyle(el);
        const weight = computed.fontWeight;

        if (!allowedWeights.includes(weight)) {
          violations.push({
            tag: el.tagName,
            class: el.className,
            id: el.id,
            fontWeight: weight,
            text: el.textContent?.substring(0, 50),
          });
        }
      });

      return violations;
    });

    console.log(`\n🔤 Typography violations found: ${typographyViolations.length}`);

    const typographyPath = path.join(AUDIT_DIR, "typography-violations.json");
    fs.writeFileSync(typographyPath, JSON.stringify(typographyViolations, null, 2));
  });

  test("Phase 4: MAC Class Usage Audit", async ({ page }) => {
    await page.goto(BASE_URL, {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    const macClassUsage = await page.evaluate(() => {
      const macClasses = [
        "mac-professional",
        "mac-display-text",
        "mac-heading",
        "mac-title",
        "mac-body",
        "mac-button",
        "mac-button-primary",
        "mac-button-secondary",
        "mac-button-outline",
        "mac-input",
        "mac-card",
        "mac-card-elevated",
        "mac-glass",
        "mac-background",
      ];

      const usage: Record<string, number> = {};

      macClasses.forEach((className) => {
        const elements = document.querySelectorAll(`.${className}`);
        usage[className] = elements.length;
      });

      return usage;
    });

    console.log("\n🎨 MAC Class Usage:");
    Object.entries(macClassUsage).forEach(([className, count]) => {
      console.log(`   ${className}: ${count} instances`);
    });

    const macClassPath = path.join(AUDIT_DIR, "mac-class-usage.json");
    fs.writeFileSync(macClassPath, JSON.stringify(macClassUsage, null, 2));
  });

  test("Phase 5: Console Error Detection", async ({ page }) => {
    const consoleMessages: any[] = [];

    page.on("console", (msg) => {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text(),
        location: msg.location(),
      });
    });

    await page.goto(BASE_URL, {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    // Wait to collect console messages
    await page.waitForTimeout(5000);

    const errors = consoleMessages.filter((m) => m.type === "error");
    const warnings = consoleMessages.filter((m) => m.type === "warning");

    console.log(`\n⚠️  Console errors: ${errors.length}`);
    console.log(`⚠️  Console warnings: ${warnings.length}`);

    const consolePath = path.join(AUDIT_DIR, "console-messages.json");
    fs.writeFileSync(
      consolePath,
      JSON.stringify(
        {
          errors,
          warnings,
          all: consoleMessages,
        },
        null,
        2
      )
    );
  });
});
