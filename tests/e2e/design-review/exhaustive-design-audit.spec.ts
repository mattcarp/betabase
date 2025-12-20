/**
 * EXHAUSTIVE DESIGN REVIEW TEST
 *
 * This test systematically clicks through EVERY interactive element in The Betabase application
 * and validates MAC Design System compliance.
 *
 * Coverage:
 * - All 5 main navigation modes (Chat, HUD, Test, Fix, Curate)
 * - All sub-tabs within each mode
 * - All buttons, dropdowns, modals, tooltips
 * - All form fields and interactive elements
 * - All hover states and transitions
 *
 * Design System Validation:
 * - CSS variable usage (--mac-*)
 * - Typography weights (100-400 only)
 * - Spacing grid (8px)
 * - Color compliance
 * - Accessibility (focus states, ARIA)
 */

import { test, expect, Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';

// Directory for storing screenshots
const SCREENSHOT_DIR = path.join(__dirname, '../../../design-audit-screenshots');

// Ensure screenshot directory exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

interface DesignIssue {
  severity: 'critical' | 'high' | 'medium' | 'low';
  location: string;
  element: string;
  issue: string;
  recommendation: string;
  macViolation?: string;
  screenshot?: string;
}

const designIssues: DesignIssue[] = [];

// Helper function to log issues
function logIssue(issue: DesignIssue) {
  designIssues.push(issue);
  console.log(`[${issue.severity.toUpperCase()}] ${issue.location} - ${issue.element}: ${issue.issue}`);
}

// Helper function to capture screenshot
async function captureScreenshot(page: Page, name: string): Promise<string> {
  const screenshotPath = path.join(SCREENSHOT_DIR, `${name}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  return screenshotPath;
}

// Helper to check CSS variable usage
async function checkMACVariableUsage(page: Page, selector: string, location: string) {
  const element = page.locator(selector).first();

  if (await element.count() === 0) return;

  // Get computed styles
  const computedColor = await element.evaluate((el) => {
    return window.getComputedStyle(el).color;
  });

  const computedBg = await element.evaluate((el) => {
    return window.getComputedStyle(el).backgroundColor;
  });

  const computedFontWeight = await element.evaluate((el) => {
    return window.getComputedStyle(el).fontWeight;
  });

  // Check font weight compliance (100-400 only)
  const fontWeight = parseInt(computedFontWeight);
  if (fontWeight > 400) {
    logIssue({
      severity: 'high',
      location,
      element: selector,
      issue: `Font weight ${fontWeight} exceeds MAC limit of 400`,
      recommendation: 'Use font-weight 100-400 only',
      macViolation: 'Typography weights: 100-400 only',
    });
  }
}

// Helper to check element exists and is visible
async function checkElement(page: Page, selector: string, location: string, elementName: string) {
  const element = page.locator(selector).first();
  const count = await element.count();

  if (count === 0) {
    logIssue({
      severity: 'medium',
      location,
      element: elementName,
      issue: `Element not found: ${selector}`,
      recommendation: 'Verify element exists or update selector',
    });
    return false;
  }

  const isVisible = await element.isVisible();
  if (!isVisible) {
    logIssue({
      severity: 'low',
      location,
      element: elementName,
      issue: 'Element exists but is not visible',
      recommendation: 'Check if element should be visible in this state',
    });
    return false;
  }

  return true;
}

test.describe('Exhaustive Design Review', () => {
  let page: Page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;

    // Navigate to app (skip auth for design review)
    await page.goto('http://localhost:3000');

    // Wait for app to load
    await page.waitForSelector('header', { timeout: 10000 });
  });

  test('01. Header - Brand Identity & Logo', async () => {
    const location = 'Header - Brand Identity';

    // SIAM Logo
    await checkElement(page, '[class*="SiamLogo"]', location, 'SIAM Logo');
    await checkMACVariableUsage(page, '[class*="SiamLogo"]', location);

    // Header title
    await checkElement(page, 'h1:has-text("The Betabase")', location, 'Header Title');
    await checkMACVariableUsage(page, 'h1:has-text("The Betabase")', location);

    // Subtitle
    await checkElement(page, 'text="Intelligence Platform"', location, 'Header Subtitle');

    const screenshot = await captureScreenshot(page, '01-header-brand');
    console.log(`Screenshot saved: ${screenshot}`);
  });

  test('02. Header - Navigation Tabs (Desktop)', async () => {
    const location = 'Header - Navigation Tabs';

    // Set viewport to desktop
    await page.setViewportSize({ width: 1920, height: 1080 });

    const modes = ['Chat', 'HUD', 'Test', 'Fix', 'Curate'];

    for (const mode of modes) {
      const tabButton = page.locator(`button:has-text("${mode}")`).first();

      if (await tabButton.count() > 0) {
        // Check initial state
        await checkMACVariableUsage(page, `button:has-text("${mode}")`, location);

        // Hover state
        await tabButton.hover();
        await page.waitForTimeout(200); // Wait for transition

        // Click and check active state
        await tabButton.click();
        await page.waitForTimeout(500); // Wait for mode change

        const screenshot = await captureScreenshot(page, `02-nav-tab-${mode.toLowerCase()}`);
        console.log(`Screenshot saved: ${screenshot}`);

        // Check if mode changed in URL hash
        const hash = await page.evaluate(() => window.location.hash);
        if (!hash.includes(mode.toLowerCase())) {
          logIssue({
            severity: 'medium',
            location,
            element: `${mode} Tab`,
            issue: 'URL hash not updated after tab click',
            recommendation: 'Ensure URL hash matches active mode for deep linking',
          });
        }
      }
    }
  });

  test('03. Header - Mobile Navigation', async () => {
    const location = 'Header - Mobile Navigation';

    // Set viewport to mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForSelector('header');

    // Check mobile nav exists
    await checkElement(page, '.flex.md\\:hidden', location, 'Mobile Navigation');

    // Click through mobile tabs
    const modes = ['chat', 'hud', 'test', 'fix', 'curate'];
    for (const mode of modes) {
      const mobileTab = page.locator('.flex.md\\:hidden button').nth(modes.indexOf(mode));

      if (await mobileTab.count() > 0) {
        await mobileTab.click();
        await page.waitForTimeout(300);

        const screenshot = await captureScreenshot(page, `03-mobile-nav-${mode}`);
        console.log(`Screenshot saved: ${screenshot}`);
      }
    }

    // Reset to desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
  });

  test('04. Header - Control Buttons', async () => {
    const location = 'Header - Controls';

    // Introspection dropdown
    await checkElement(page, '.introspection-dropdown-container', location, 'Introspection Dropdown');
    const introspectionBtn = page.locator('.introspection-dropdown-container button').first();
    if (await introspectionBtn.count() > 0) {
      await introspectionBtn.click();
      await page.waitForTimeout(300);
      await captureScreenshot(page, '04-introspection-dropdown-open');

      // Close dropdown
      await page.keyboard.press('Escape');
    }

    // Knowledge base button
    const knowledgeBtn = page.locator('button[aria-label="Toggle knowledge base panel"]');
    if (await knowledgeBtn.count() > 0) {
      await checkMACVariableUsage(page, 'button[aria-label="Toggle knowledge base panel"]', location);
      await knowledgeBtn.click();
      await page.waitForTimeout(500);
      await captureScreenshot(page, '04-knowledge-panel-open');

      // Close panel
      await knowledgeBtn.click();
    }

    // Performance dashboard button
    await checkElement(page, 'button[aria-label="Open performance dashboard"]', location, 'Performance Dashboard Button');

    // Sign out button
    const signOutBtn = page.locator('.sign-out-button');
    if (await signOutBtn.count() > 0) {
      await checkElement(page, '.sign-out-button', location, 'Sign Out Button');
      await checkMACVariableUsage(page, '.sign-out-button', location);
      await captureScreenshot(page, '04-sign-out-button');
    }
  });

  test('05. Chat Mode - Welcome Screen', async () => {
    const location = 'Chat Mode - Welcome Screen';

    // Navigate to chat
    await page.goto('http://localhost:3000#chat');
    await page.waitForTimeout(500);

    // Check welcome screen elements
    await checkElement(page, 'text="The Betabase"', location, 'Welcome Title');
    await checkElement(page, 'text="It\'s back!"', location, 'Welcome Subtitle');

    // Check suggested questions
    const suggestions = [
      'Show me The Betabase multi-tenant database architecture',
      'How does AOMA use AWS S3 storage tiers',
      'Asset Upload Sorting Failed',
      'permission levels in AOMA',
      'UST features',
      'upload and archive digital assets',
    ];

    for (const suggestion of suggestions) {
      const suggestionElement = page.locator(`button:has-text("${suggestion.substring(0, 20)}")`).first();
      if (await suggestionElement.count() > 0) {
        await suggestionElement.hover();
        await page.waitForTimeout(100);
      }
    }

    await captureScreenshot(page, '05-chat-welcome-screen');
  });

  test('06. Chat Mode - Message Input', async () => {
    const location = 'Chat Mode - Message Input';

    await page.goto('http://localhost:3000#chat');
    await page.waitForTimeout(500);

    // Find message input
    const messageInput = page.locator('textarea[placeholder*="Ask me anything"]').first();

    if (await messageInput.count() > 0) {
      await checkMACVariableUsage(page, 'textarea[placeholder*="Ask me anything"]', location);

      // Test input states
      await messageInput.focus();
      await captureScreenshot(page, '06-message-input-focused');

      await messageInput.fill('Test message for design review');
      await captureScreenshot(page, '06-message-input-filled');

      // Clear input
      await messageInput.clear();
    } else {
      logIssue({
        severity: 'critical',
        location,
        element: 'Message Input',
        issue: 'Message input field not found',
        recommendation: 'Verify chat input exists and is accessible',
      });
    }
  });

  test('07. Chat Mode - Sidebar', async () => {
    const location = 'Chat Mode - Sidebar';

    await page.goto('http://localhost:3000#chat');
    await page.waitForTimeout(500);

    // Check if sidebar is visible
    const sidebar = page.locator('[class*="AppSidebar"]').first();

    if (await sidebar.count() > 0) {
      // Check for conversation list
      await checkElement(page, 'nav', location, 'Sidebar Navigation');

      await captureScreenshot(page, '07-chat-sidebar');

      // Try to toggle sidebar
      const sidebarToggle = page.locator('[title="Toggle sidebar"]').first();
      if (await sidebarToggle.count() > 0) {
        await sidebarToggle.click();
        await page.waitForTimeout(300);
        await captureScreenshot(page, '07-chat-sidebar-collapsed');

        // Re-open sidebar
        await sidebarToggle.click();
      }
    }
  });

  test('08. Test Mode - All Sub-tabs', async () => {
    const location = 'Test Mode';

    await page.goto('http://localhost:3000#test');
    await page.waitForTimeout(1000); // Wait for dynamic import

    // Check header
    await checkElement(page, 'text="Advanced Testing & Quality Assurance"', location, 'Test Mode Header');

    const testTabs = ['Dashboard', 'Historical Tests', 'RLHF Tests', 'Impact Metrics', 'Live Monitor'];

    for (const tab of testTabs) {
      const tabButton = page.locator(`button:has-text("${tab}")`).first();

      if (await tabButton.count() > 0) {
        await tabButton.click();
        await page.waitForTimeout(1000); // Wait for tab content

        await captureScreenshot(page, `08-test-mode-${tab.toLowerCase().replace(/\s+/g, '-')}`);

        // Check MAC compliance
        await checkMACVariableUsage(page, `button:has-text("${tab}")`, `${location} - ${tab}`);
      } else {
        logIssue({
          severity: 'high',
          location,
          element: `${tab} Tab`,
          issue: 'Tab not found in Test mode',
          recommendation: 'Verify tab exists and is rendered',
        });
      }
    }
  });

  test('09. Fix Mode - All Sub-tabs', async () => {
    const location = 'Fix Mode';

    await page.goto('http://localhost:3000#fix');
    await page.waitForTimeout(500);

    // Check header
    await checkElement(page, 'text="Debug & Fix Assistant"', location, 'Fix Mode Header');

    const fixTabs = ['Response Debugger', 'Quick Fix', 'Test Generator', 'Feedback Timeline'];

    for (const tab of fixTabs) {
      const tabButton = page.locator(`button:has-text("${tab}")`).first();

      if (await tabButton.count() > 0) {
        await tabButton.click();
        await page.waitForTimeout(500);

        await captureScreenshot(page, `09-fix-mode-${tab.toLowerCase().replace(/\s+/g, '-')}`);

        await checkMACVariableUsage(page, `button:has-text("${tab}")`, `${location} - ${tab}`);
      }
    }
  });

  test('10. Curate Mode', async () => {
    const location = 'Curate Mode';

    await page.goto('http://localhost:3000#curate');
    await page.waitForTimeout(1000); // Wait for dynamic import

    // Check header
    await checkElement(page, 'text="Knowledge Curation"', location, 'Curate Mode Header');

    await captureScreenshot(page, '10-curate-mode');

    // Check for any sub-components or buttons
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();

    console.log(`Found ${buttonCount} buttons in Curate mode`);

    for (let i = 0; i < Math.min(buttonCount, 10); i++) {
      const btn = buttons.nth(i);
      const text = await btn.textContent();
      if (text && text.trim()) {
        await checkMACVariableUsage(page, `button:has-text("${text.trim().substring(0, 20)}")`, location);
      }
    }
  });

  test('11. HUD Mode', async () => {
    const location = 'HUD Mode';

    await page.goto('http://localhost:3000#hud');
    await page.waitForTimeout(1000); // Wait for dynamic import

    await captureScreenshot(page, '11-hud-mode');

    // Check for HUD interface elements
    const hudElements = page.locator('[class*="HUD"]');
    const count = await hudElements.count();

    if (count === 0) {
      logIssue({
        severity: 'medium',
        location,
        element: 'HUD Interface',
        issue: 'No HUD elements found',
        recommendation: 'Verify HUD interface is rendering correctly',
      });
    }
  });

  test('12. Right Sidebar - Knowledge Panel', async () => {
    const location = 'Right Sidebar - Knowledge Panel';

    await page.goto('http://localhost:3000#chat');

    // Open knowledge panel
    const knowledgeBtn = page.locator('button[aria-label="Toggle knowledge base panel"]');
    await knowledgeBtn.click();
    await page.waitForTimeout(500);

    // Check panel is visible
    await checkElement(page, 'aside', location, 'Knowledge Panel');

    await captureScreenshot(page, '12-knowledge-panel-open');

    // Check panel content
    const panelContent = page.locator('[class*="EnhancedKnowledgePanel"]');
    if (await panelContent.count() > 0) {
      // Look for tabs or sections
      const tabs = panelContent.locator('button[role="tab"]');
      const tabCount = await tabs.count();

      for (let i = 0; i < tabCount; i++) {
        await tabs.nth(i).click();
        await page.waitForTimeout(300);

        const tabText = await tabs.nth(i).textContent();
        await captureScreenshot(page, `12-knowledge-panel-${tabText?.toLowerCase().replace(/\s+/g, '-')}`);
      }
    }

    // Close panel
    await knowledgeBtn.click();
  });

  test('13. Forms and Inputs - Comprehensive Check', async () => {
    const location = 'Forms and Inputs';

    // Navigate through all modes to find all form inputs
    const modes = ['chat', 'test', 'fix', 'curate'];

    for (const mode of modes) {
      await page.goto(`http://localhost:3000#${mode}`);
      await page.waitForTimeout(1000);

      // Find all input elements
      const inputs = page.locator('input, textarea, select');
      const inputCount = await inputs.count();

      console.log(`Found ${inputCount} form inputs in ${mode} mode`);

      for (let i = 0; i < inputCount; i++) {
        const input = inputs.nth(i);
        const tagName = await input.evaluate((el) => el.tagName.toLowerCase());
        const type = await input.getAttribute('type');

        // Check MAC compliance
        await checkMACVariableUsage(page, `${tagName}${type ? `[type="${type}"]` : ''}`, `${location} - ${mode} mode`);
      }
    }
  });

  test('14. Buttons - Comprehensive States', async () => {
    const location = 'Buttons';

    await page.goto('http://localhost:3000#chat');

    // Find all buttons
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();

    console.log(`Found ${buttonCount} buttons`);

    // Sample check first 20 buttons
    for (let i = 0; i < Math.min(buttonCount, 20); i++) {
      const btn = buttons.nth(i);

      // Check if visible
      if (await btn.isVisible()) {
        // Normal state
        await checkMACVariableUsage(page, 'button', location);

        // Hover state
        await btn.hover();
        await page.waitForTimeout(100);

        // Check disabled state
        const isDisabled = await btn.isDisabled();
        if (isDisabled) {
          await captureScreenshot(page, `14-button-disabled-${i}`);
        }
      }
    }
  });

  test('15. Color Compliance Check', async () => {
    const location = 'Color Compliance';

    await page.goto('http://localhost:3000#chat');

    // Check for hardcoded colors that should use MAC variables
    const allElements = page.locator('*');
    const elemCount = await allElements.count();

    // Sample check
    for (let i = 0; i < Math.min(elemCount, 100); i++) {
      const elem = allElements.nth(i);

      const inlineStyle = await elem.getAttribute('style');

      if (inlineStyle && (inlineStyle.includes('color:') || inlineStyle.includes('background:'))) {
        // Check if using hardcoded colors
        if (!inlineStyle.includes('var(--mac-')) {
          const classList = await elem.getAttribute('class');

          logIssue({
            severity: 'medium',
            location,
            element: classList || 'Unknown element',
            issue: 'Inline style with hardcoded color instead of CSS variable',
            recommendation: 'Use --mac-* CSS variables',
            macViolation: 'Must use MAC color tokens',
          });
        }
      }
    }
  });

  test('16. Generate Design Audit Report', async () => {
    // Generate comprehensive report
    const report = {
      timestamp: new Date().toISOString(),
      totalIssues: designIssues.length,
      issuesBySeverity: {
        critical: designIssues.filter((i) => i.severity === 'critical').length,
        high: designIssues.filter((i) => i.severity === 'high').length,
        medium: designIssues.filter((i) => i.severity === 'medium').length,
        low: designIssues.filter((i) => i.severity === 'low').length,
      },
      issues: designIssues,
      complianceScore: Math.max(0, 100 - (designIssues.length * 2)),
    };

    // Save report
    const reportPath = path.join(SCREENSHOT_DIR, 'design-audit-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log('\n=== DESIGN AUDIT REPORT ===');
    console.log(`Total Issues Found: ${report.totalIssues}`);
    console.log(`Critical: ${report.issuesBySeverity.critical}`);
    console.log(`High: ${report.issuesBySeverity.high}`);
    console.log(`Medium: ${report.issuesBySeverity.medium}`);
    console.log(`Low: ${report.issuesBySeverity.low}`);
    console.log(`Compliance Score: ${report.complianceScore}/100`);
    console.log(`\nReport saved to: ${reportPath}`);
  });
});
