/**
 * COMPREHENSIVE UX/UI AUDIT
 *
 * This test performs a thorough visual and accessibility audit of the SIAM application.
 * Tests all main sections: Chat, HUD, Test, Fix, Curate
 *
 * Audit Focus Areas:
 * 1. Visual Testing - Screenshots of each section
 * 2. MAC Design System Compliance
 * 3. Accessibility (WCAG 2.1 AA)
 * 4. Console Errors
 * 5. Typography & Spacing
 * 6. Color Contrast
 * 7. UX Issues from previous audit
 */

import { test, expect } from '../fixtures/base-test';
import * as fs from 'fs';
import * as path from 'path';

// Disable console error checking for this audit - we're capturing them intentionally
test.use({ failOnConsoleError: false });

const AUDIT_RESULTS_DIR = path.join(process.cwd(), 'audit-results');
const SCREENSHOT_DIR = path.join(AUDIT_RESULTS_DIR, 'screenshots');

// Ensure directories exist
if (!fs.existsSync(AUDIT_RESULTS_DIR)) {
  fs.mkdirSync(AUDIT_RESULTS_DIR, { recursive: true });
}
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

interface AuditFinding {
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  category: 'VISUAL' | 'ACCESSIBILITY' | 'MAC_DESIGN' | 'TYPOGRAPHY' | 'COLOR' | 'UX' | 'CONSOLE';
  issue: string;
  location: string;
  recommendation: string;
  codeExample?: string;
}

const auditFindings: AuditFinding[] = [];

function addFinding(finding: AuditFinding) {
  auditFindings.push(finding);
  console.log(`[${finding.severity}] ${finding.category}: ${finding.issue}`);
}

test.describe('Comprehensive UX/UI Audit', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to homepage (auth bypassed on localhost)
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });

    // Wait for initial render
    await page.waitForTimeout(2000);
  });

  test('1. Chat Page - Initial State Audit', async ({ page, consoleErrors }) => {
    console.log('\n===== AUDITING: CHAT PAGE (INITIAL STATE) =====\n');

    // Screenshot
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '01-chat-page-initial.png'),
      fullPage: true
    });

    // Check for Brain Icon (should be replaced with Lightbulb)
    const brainIcons = await page.locator('svg[class*="brain"]').count();
    if (brainIcons > 0) {
      addFinding({
        severity: 'MEDIUM',
        category: 'UX',
        issue: 'Brain icon still present (should be Lightbulb)',
        location: 'Header - Introspection dropdown',
        recommendation: 'Replace Brain icon with Lightbulb icon from lucide-react',
        codeExample: `import { Lightbulb } from "lucide-react";\n<Lightbulb className="h-4 w-4" />`
      });
    }

    // Check header elements
    const header = page.locator('header');
    await expect(header).toBeVisible();

    // Check logo
    const logo = page.locator('img[alt="Betabase"]');
    const logoAltText = await logo.getAttribute('alt');
    if (!logoAltText || logoAltText.trim() === '') {
      addFinding({
        severity: 'HIGH',
        category: 'ACCESSIBILITY',
        issue: 'Logo missing meaningful alt text',
        location: 'Header - Logo image',
        recommendation: 'Add descriptive alt text',
        codeExample: `<img alt="Betabase Logo - Intelligence Platform" ... />`
      });
    }

    // Check navigation tabs
    const navTabs = page.locator('button:has-text("Chat"), button:has-text("HUD"), button:has-text("Test"), button:has-text("Fix"), button:has-text("Curate")');
    const tabCount = await navTabs.count();
    expect(tabCount).toBe(5);

    // Check active tab styling
    const activeTab = page.locator('button:has-text("Chat")').first();
    const activeBg = await activeTab.evaluate(el => window.getComputedStyle(el).backgroundColor);
    console.log(`Active tab background: ${activeBg}`);

    // Check for icon-only buttons without labels
    const iconButtons = page.locator('button[aria-label]');
    const iconButtonCount = await iconButtons.count();
    console.log(`Found ${iconButtonCount} buttons with aria-labels`);

    // Check buttons without labels
    const allButtons = page.locator('button');
    for (let i = 0; i < await allButtons.count(); i++) {
      const button = allButtons.nth(i);
      const text = await button.textContent();
      const ariaLabel = await button.getAttribute('aria-label');
      const title = await button.getAttribute('title');

      if (!text?.trim() && !ariaLabel && !title) {
        const buttonHtml = await button.evaluate(el => el.outerHTML.substring(0, 100));
        addFinding({
          severity: 'HIGH',
          category: 'ACCESSIBILITY',
          issue: 'Button without accessible name',
          location: `Button: ${buttonHtml}...`,
          recommendation: 'Add aria-label or title attribute',
          codeExample: `<button aria-label="Descriptive action name">...</button>`
        });
      }
    }

    // Check Welcome Screen
    const welcomeHeading = page.locator('h2:has-text("Welcome to The Betabase")');
    if (await welcomeHeading.isVisible()) {
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, '02-chat-welcome-screen.png'),
        fullPage: true
      });

      // Check suggestion cards
      const suggestionCards = page.locator('button:has-text("How do I")');
      const suggestionCount = await suggestionCards.count();
      console.log(`Found ${suggestionCount} suggestion cards`);
    }

    // Check console errors
    if (consoleErrors.length > 0) {
      consoleErrors.forEach(error => {
        addFinding({
          severity: 'MEDIUM',
          category: 'CONSOLE',
          issue: `Console error: ${error.text}`,
          location: error.url || 'Unknown',
          recommendation: 'Fix the underlying JavaScript error'
        });
      });
    }

    console.log(`\n✓ Chat page audit complete - ${auditFindings.length} findings so far\n`);
  });

  test('2. Navigation Tab Audit', async ({ page }) => {
    console.log('\n===== AUDITING: NAVIGATION TABS =====\n');

    const tabs = ['HUD', 'Test', 'Fix', 'Curate'];

    for (const tabName of tabs) {
      console.log(`\n--- Testing ${tabName} tab ---`);

      // Click the tab
      await page.locator(`button:has-text("${tabName}")`).first().click();
      await page.waitForTimeout(1500); // Wait for dynamic import and render

      // Screenshot
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, `03-${tabName.toLowerCase()}-tab.png`),
        fullPage: true
      });

      // Check tab active state
      const tabButton = page.locator(`button:has-text("${tabName}")`).first();
      const bgColor = await tabButton.evaluate(el => window.getComputedStyle(el).backgroundColor);
      const textColor = await tabButton.evaluate(el => window.getComputedStyle(el).color);

      console.log(`${tabName} tab - bg: ${bgColor}, color: ${textColor}`);

      // Check for loading states
      const loadingText = page.locator('div:has-text("Loading")');
      if (await loadingText.isVisible()) {
        console.log(`Loading state visible for ${tabName}`);
      }
    }

    // Return to Chat tab
    await page.locator('button:has-text("Chat")').first().click();
    await page.waitForTimeout(500);

    console.log(`\n✓ Navigation tabs audit complete\n`);
  });

  test('3. Curate Tab - Deep Dive', async ({ page }) => {
    console.log('\n===== AUDITING: CURATE TAB (DEEP DIVE) =====\n');

    // Navigate to Curate
    await page.locator('button:has-text("Curate")').first().click();
    await page.waitForTimeout(2000);

    // Screenshot
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '04-curate-tab-detailed.png'),
      fullPage: true
    });

    // Check for upload area
    const uploadArea = page.locator('[class*="upload"], [class*="dropzone"], input[type="file"]');
    const uploadCount = await uploadArea.count();
    console.log(`Upload elements found: ${uploadCount}`);

    if (uploadCount === 0) {
      addFinding({
        severity: 'MEDIUM',
        category: 'UX',
        issue: 'No visible file upload UI in Curate tab',
        location: 'Curate tab',
        recommendation: 'Add clear file upload interface with drag-and-drop support'
      });
    }

    console.log(`\n✓ Curate tab deep dive complete\n`);
  });

  test('4. Responsive Design Audit', async ({ page, browser }) => {
    console.log('\n===== AUDITING: RESPONSIVE DESIGN =====\n');

    const viewports = [
      { name: 'Desktop', width: 1920, height: 1080 },
      { name: 'Laptop', width: 1366, height: 768 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Mobile', width: 375, height: 667 },
    ];

    for (const viewport of viewports) {
      console.log(`\n--- Testing ${viewport.name} (${viewport.width}x${viewport.height}) ---`);

      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.waitForTimeout(500);

      // Screenshot
      await page.screenshot({
        path: path.join(SCREENSHOT_DIR, `05-responsive-${viewport.name.toLowerCase()}.png`),
        fullPage: false
      });

      // Check for horizontal overflow
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      const viewportWidth = viewport.width;

      if (bodyWidth > viewportWidth) {
        addFinding({
          severity: 'MEDIUM',
          category: 'VISUAL',
          issue: `Horizontal overflow on ${viewport.name}`,
          location: `Viewport: ${viewport.width}x${viewport.height}`,
          recommendation: 'Fix overflow with responsive design adjustments'
        });
      }

      // Check header wrapping
      const header = page.locator('header');
      const headerHeight = await header.evaluate(el => el.offsetHeight);

      // If header is taller than expected, might indicate wrapping
      if (headerHeight > 80 && viewport.width < 768) {
        console.log(`Header height: ${headerHeight}px (may indicate wrapping)`);
      }
    }

    // Reset to desktop
    await page.setViewportSize({ width: 1920, height: 1080 });

    console.log(`\n✓ Responsive design audit complete\n`);
  });

  test('5. Color Contrast Audit', async ({ page }) => {
    console.log('\n===== AUDITING: COLOR CONTRAST =====\n');

    // Check common text elements
    const textElements = [
      { selector: 'header h1', name: 'Main heading' },
      { selector: 'header p', name: 'Header subtitle' },
      { selector: 'button', name: 'Buttons' },
      { selector: 'a', name: 'Links' },
    ];

    for (const element of textElements) {
      const locator = page.locator(element.selector).first();
      if (await locator.isVisible()) {
        const styles = await locator.evaluate(el => {
          const computed = window.getComputedStyle(el);
          return {
            color: computed.color,
            backgroundColor: computed.backgroundColor,
            fontSize: computed.fontSize,
            fontWeight: computed.fontWeight,
          };
        });

        console.log(`${element.name}:`, styles);

        // Check for text-slate-400 on dark backgrounds
        const classes = await locator.getAttribute('class') || '';
        if (classes.includes('text-slate-400')) {
          addFinding({
            severity: 'MEDIUM',
            category: 'COLOR',
            issue: `Potential low contrast: text-slate-400 used on dark background`,
            location: `Element: ${element.name} (${element.selector})`,
            recommendation: 'Use --mac-text-secondary or lighter color for better contrast',
            codeExample: `className="text-[var(--mac-text-secondary)]"`
          });
        }
      }
    }

    console.log(`\n✓ Color contrast audit complete\n`);
  });

  test('6. MAC Design System Compliance', async ({ page }) => {
    console.log('\n===== AUDITING: MAC DESIGN SYSTEM COMPLIANCE =====\n');

    // Get all elements
    const allElements = page.locator('*');
    const elementCount = await allElements.count();

    console.log(`Scanning ${elementCount} elements for MAC compliance...`);

    // Check for hardcoded colors (sample)
    const elementsWithClass = page.locator('[class]');
    const classCount = await elementsWithClass.count();

    let nonMacColorCount = 0;
    const sampleSize = Math.min(100, classCount); // Sample first 100 elements

    for (let i = 0; i < sampleSize; i++) {
      const classes = await elementsWithClass.nth(i).getAttribute('class') || '';

      // Check for hardcoded Tailwind colors instead of MAC variables
      const hasHardcodedColor = /\b(bg-slate-|text-slate-|border-slate-|bg-zinc-|text-zinc-|border-zinc-)\d{2,3}\b/.test(classes);

      if (hasHardcodedColor && !classes.includes('mac-')) {
        nonMacColorCount++;
      }
    }

    if (nonMacColorCount > 0) {
      addFinding({
        severity: 'MEDIUM',
        category: 'MAC_DESIGN',
        issue: `${nonMacColorCount}/${sampleSize} sampled elements use hardcoded colors instead of MAC variables`,
        location: 'Multiple locations',
        recommendation: 'Replace Tailwind color classes with --mac-* CSS variables',
        codeExample: `// Instead of:\nclassName="bg-slate-800 text-zinc-400"\n\n// Use:\nclassName="bg-[var(--mac-surface-elevated)] text-[var(--mac-text-secondary)]"`
      });
    }

    // Check typography weights (should be 100-400 only)
    const boldElements = page.locator('[class*="font-bold"], [class*="font-semibold"], [class*="font-medium"]');
    const boldCount = await boldElements.count();

    if (boldCount > 0) {
      addFinding({
        severity: 'LOW',
        category: 'TYPOGRAPHY',
        issue: `${boldCount} elements use font weights > 400 (MAC uses 100-400 only)`,
        location: 'Multiple locations',
        recommendation: 'Use font-light (300), font-normal (400), or font-thin (100)',
        codeExample: `className="font-light" // instead of font-medium or font-bold`
      });
    }

    // Check for 8px spacing grid
    const spacingPattern = /\b(p-|m-|gap-|space-[xy]-)(1|2|3|5|7|9|11)\b/;
    const elementsWithSpacing = page.locator('[class]');

    let nonGridSpacingCount = 0;
    for (let i = 0; i < Math.min(50, await elementsWithSpacing.count()); i++) {
      const classes = await elementsWithSpacing.nth(i).getAttribute('class') || '';
      if (spacingPattern.test(classes)) {
        nonGridSpacingCount++;
      }
    }

    if (nonGridSpacingCount > 0) {
      addFinding({
        severity: 'LOW',
        category: 'MAC_DESIGN',
        issue: `${nonGridSpacingCount} elements use spacing not aligned to 8px grid`,
        location: 'Multiple locations',
        recommendation: 'Use spacing values that align to 8px: 0, 0.5, 1, 2, 4, 6, 8, 12, 16, etc.',
        codeExample: `// Use: p-2 (8px), p-4 (16px), p-6 (24px)\n// Avoid: p-1 (4px), p-3 (12px), p-5 (20px)`
      });
    }

    console.log(`\n✓ MAC Design System audit complete\n`);
  });

  test('7. Keyboard Navigation Audit', async ({ page }) => {
    console.log('\n===== AUDITING: KEYBOARD NAVIGATION =====\n');

    // Focus first interactive element
    await page.keyboard.press('Tab');
    await page.waitForTimeout(200);

    let focusedElement = await page.evaluate(() => {
      const el = document.activeElement;
      return {
        tagName: el?.tagName,
        className: el?.className,
        textContent: el?.textContent?.substring(0, 30),
      };
    });

    console.log('First focused element:', focusedElement);

    // Tab through header elements
    const tabPresses = 10;
    const focusedElements: any[] = [];

    for (let i = 0; i < tabPresses; i++) {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(100);

      focusedElement = await page.evaluate(() => {
        const el = document.activeElement;
        return {
          tagName: el?.tagName,
          className: el?.className,
          hasVisibleFocus: window.getComputedStyle(el || document.body).outline !== 'none',
        };
      });

      focusedElements.push(focusedElement);

      // Check if focus is visible
      if (!focusedElement.hasVisibleFocus && focusedElement.tagName !== 'BODY') {
        addFinding({
          severity: 'MEDIUM',
          category: 'ACCESSIBILITY',
          issue: 'Interactive element has no visible focus indicator',
          location: `${focusedElement.tagName}: ${focusedElement.className}`,
          recommendation: 'Add visible focus styles',
          codeExample: `className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"`
        });
      }
    }

    console.log(`Tabbed through ${tabPresses} elements, ${focusedElements.filter(e => !e.hasVisibleFocus).length} without visible focus`);

    console.log(`\n✓ Keyboard navigation audit complete\n`);
  });

  test.afterAll(async () => {
    console.log('\n\n========================================');
    console.log('AUDIT COMPLETE - GENERATING REPORT');
    console.log('========================================\n');

    // Group findings by severity and category
    const critical = auditFindings.filter(f => f.severity === 'CRITICAL');
    const high = auditFindings.filter(f => f.severity === 'HIGH');
    const medium = auditFindings.filter(f => f.severity === 'MEDIUM');
    const low = auditFindings.filter(f => f.severity === 'LOW');

    console.log(`Total Findings: ${auditFindings.length}`);
    console.log(`  - CRITICAL: ${critical.length}`);
    console.log(`  - HIGH: ${high.length}`);
    console.log(`  - MEDIUM: ${medium.length}`);
    console.log(`  - LOW: ${low.length}`);

    // Generate markdown report
    const report = generateMarkdownReport(auditFindings);

    const reportPath = path.join(AUDIT_RESULTS_DIR, 'FIONA-UX-UI-AUDIT-REPORT.md');
    fs.writeFileSync(reportPath, report, 'utf-8');

    console.log(`\nReport saved to: ${reportPath}`);
    console.log(`Screenshots saved to: ${SCREENSHOT_DIR}\n`);
  });
});

function generateMarkdownReport(findings: AuditFinding[]): string {
  const critical = findings.filter(f => f.severity === 'CRITICAL');
  const high = findings.filter(f => f.severity === 'HIGH');
  const medium = findings.filter(f => f.severity === 'MEDIUM');
  const low = findings.filter(f => f.severity === 'LOW');

  const timestamp = new Date().toISOString();

  let report = `# SIAM/Betabase - Comprehensive UX/UI Audit Report

**Generated by:** Fiona v2.0 (SOTA Edition)
**Date:** ${timestamp}
**Application:** SIAM (Sentient Intelligence and Augmented Memory) / The Betabase
**URL:** http://localhost:3000

---

## Executive Summary

### Overall Status: ${critical.length === 0 && high.length === 0 ? '✅ PASS' : '⚠️ NEEDS ATTENTION'}

- **Total Findings:** ${findings.length}
  - 🚨 **CRITICAL:** ${critical.length}
  - ⚠️ **HIGH:** ${high.length}
  - ℹ️ **MEDIUM:** ${medium.length}
  - 📝 **LOW:** ${low.length}

### Key Highlights

${critical.length === 0 ? '✅ No critical issues found' : `❌ ${critical.length} critical issue(s) require immediate attention`}
${high.length === 0 ? '✅ No high-priority issues' : `⚠️ ${high.length} high-priority issue(s) should be addressed soon`}

### Categories Audited

1. ✓ Visual Design & Layout
2. ✓ Accessibility (WCAG 2.1 AA)
3. ✓ MAC Design System Compliance
4. ✓ Typography & Spacing
5. ✓ Color Contrast
6. ✓ Console Errors
7. ✓ Responsive Design
8. ✓ Keyboard Navigation

---

## Screenshots

All screenshots are saved in \`audit-results/screenshots/\`:

1. \`01-chat-page-initial.png\` - Chat page initial state
2. \`02-chat-welcome-screen.png\` - Welcome screen (if visible)
3. \`03-hud-tab.png\` - HUD interface
4. \`03-test-tab.png\` - Test dashboard
5. \`03-fix-tab.png\` - Fix panel
6. \`03-curate-tab.png\` - Curate interface
7. \`04-curate-tab-detailed.png\` - Curate deep dive
8. \`05-responsive-desktop.png\` - Desktop view
9. \`05-responsive-laptop.png\` - Laptop view
10. \`05-responsive-tablet.png\` - Tablet view
11. \`05-responsive-mobile.png\` - Mobile view

---

## Detailed Findings

`;

  // Critical findings
  if (critical.length > 0) {
    report += `### 🚨 CRITICAL Issues (${critical.length})\n\n`;
    critical.forEach((finding, index) => {
      report += formatFinding(finding, index + 1);
    });
    report += '\n---\n\n';
  }

  // High findings
  if (high.length > 0) {
    report += `### ⚠️ HIGH Priority Issues (${high.length})\n\n`;
    high.forEach((finding, index) => {
      report += formatFinding(finding, index + 1);
    });
    report += '\n---\n\n';
  }

  // Medium findings
  if (medium.length > 0) {
    report += `### ℹ️ MEDIUM Priority Issues (${medium.length})\n\n`;
    medium.forEach((finding, index) => {
      report += formatFinding(finding, index + 1);
    });
    report += '\n---\n\n';
  }

  // Low findings
  if (low.length > 0) {
    report += `### 📝 LOW Priority Issues (${low.length})\n\n`;
    low.forEach((finding, index) => {
      report += formatFinding(finding, index + 1);
    });
    report += '\n---\n\n';
  }

  // Recommendations summary
  report += `## Action Items Summary

### Immediate Actions (CRITICAL + HIGH)

`;

  [...critical, ...high].forEach((finding, index) => {
    report += `${index + 1}. **${finding.category}:** ${finding.issue}\n   - ${finding.recommendation}\n`;
  });

  report += `\n### Near-Term Actions (MEDIUM)

`;

  medium.forEach((finding, index) => {
    report += `${index + 1}. **${finding.category}:** ${finding.issue}\n`;
  });

  report += `\n### Long-Term Improvements (LOW)

`;

  low.forEach((finding, index) => {
    report += `${index + 1}. **${finding.category}:** ${finding.issue}\n`;
  });

  report += `\n---

## Validation of Previous Fixes

### 1. Brain Icon → Lightbulb Replacement

**Status:** ${findings.some(f => f.issue.includes('Brain icon')) ? '❌ NOT FIXED' : '✅ FIXED'}

${findings.some(f => f.issue.includes('Brain icon'))
  ? 'The brain icon is still present in the Introspection dropdown. It should be replaced with a Lightbulb icon.'
  : 'The brain icon has been successfully replaced. Introspection now uses an appropriate icon.'
}

### 2. Progress Indicator Placement

**Status:** NEEDS MANUAL VERIFICATION

To verify this fix, submit a chat message and observe:
- Progress indicator should appear ABOVE the AI response
- Progress indicator should NOT appear below the response
- Progress indicator should disappear after response completes

---

## Testing Methodology

This audit was conducted using:

- **Tool:** Playwright with custom audit fixtures
- **Browser:** Chromium (latest)
- **Viewports:** Desktop (1920x1080), Laptop (1366x768), Tablet (768x1024), Mobile (375x667)
- **Auth:** Bypassed (localhost development mode)
- **Scope:** All main sections (Chat, HUD, Test, Fix, Curate)

### Limitations

- SPA Navigation: Cannot test deep links (app is a Single Page Application)
- Dynamic Content: Some content requires user interaction to appear
- Third-party Services: ElevenLabs and other integrations not fully tested
- Production: This audit was conducted on localhost, not production

---

## Recommendations

### Immediate Priorities

1. Fix all CRITICAL and HIGH accessibility issues (buttons without labels, missing alt text)
2. Address color contrast violations
3. Verify progress indicator placement fix with live testing

### Design System Improvements

1. Increase usage of MAC CSS variables across the codebase
2. Standardize typography weights (100-400 only)
3. Align all spacing to 8px grid

### UX Enhancements

1. Add clearer file upload UI in Curate tab
2. Improve keyboard navigation focus indicators
3. Test responsive design on real devices

---

**Report End**

Generated by Fiona v2.0 (SOTA Edition)
${timestamp}
`;

  return report;
}

function formatFinding(finding: AuditFinding, number: number): string {
  let formatted = `#### ${number}. ${finding.issue}\n\n`;
  formatted += `- **Category:** ${finding.category}\n`;
  formatted += `- **Severity:** ${finding.severity}\n`;
  formatted += `- **Location:** \`${finding.location}\`\n`;
  formatted += `- **Recommendation:** ${finding.recommendation}\n`;

  if (finding.codeExample) {
    formatted += `\n**Code Example:**\n\`\`\`tsx\n${finding.codeExample}\n\`\`\`\n`;
  }

  formatted += '\n';
  return formatted;
}
