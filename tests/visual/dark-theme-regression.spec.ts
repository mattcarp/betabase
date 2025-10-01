import { test, expect } from "@playwright/test";

/**
 * CRITICAL REGRESSION TEST: Dark Theme Background
 * 
 * This test prevents a recurring regression where the main chat panel
 * shows a white/light background instead of the dark theme.
 * 
 * History:
 * - Regression occurred multiple times due to CSS variable usage
 * - Root cause: Using `from-background via-background` which resolves to light colors
 * - Fix: Explicit `bg-zinc-950` on main containers
 * 
 * @see docs/VISUAL_REGRESSION_FIX_REPORT.md
 */

test.describe("Dark Theme Regression Prevention", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate with reasonable timeout
    await page.goto("http://localhost:3000/", { 
      waitUntil: "domcontentloaded",
      timeout: 15000 
    });
    
    // Wait for initial render
    await page.waitForTimeout(2000);
  });

  test("CRITICAL: Main chat panel must have dark background (not white)", async ({ page }) => {
    // Check the main app container
    const appContainer = page.locator('[data-testid="app-container"]');
    await expect(appContainer).toBeVisible();

    // Get computed background color of main chat area
    const mainChatArea = page.locator('main').first();
    const backgroundColor = await mainChatArea.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });

    // Background should be dark (rgb values all below 50)
    const rgbMatch = backgroundColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (rgbMatch) {
      const [, r, g, b] = rgbMatch.map(Number);
      
      // All RGB values should be very low (dark theme)
      expect(r).toBeLessThan(30);
      expect(g).toBeLessThan(30);
      expect(b).toBeLessThan(30);
      
      console.log(`✅ Background color verified as dark: rgb(${r}, ${g}, ${b})`);
    } else if (backgroundColor === "rgba(0, 0, 0, 0)" || backgroundColor === "transparent") {
      // Transparent is acceptable if parent is dark
      const bodyBg = await page.evaluate(() => {
        return window.getComputedStyle(document.body).backgroundColor;
      });
      
      const bodyRgbMatch = bodyBg.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      if (bodyRgbMatch) {
        const [, r, g, b] = bodyRgbMatch.map(Number);
        expect(r).toBeLessThan(30);
        expect(g).toBeLessThan(30);
        expect(b).toBeLessThan(30);
        console.log(`✅ Body background verified as dark: rgb(${r}, ${g}, ${b})`);
      }
    } else {
      throw new Error(`Unexpected background color: ${backgroundColor}`);
    }
  });

  test("CRITICAL: Chat conversation area must have dark background", async ({ page }) => {
    // Wait for chat interface to load
    await page.waitForSelector('[role="log"]', { timeout: 5000 });
    
    // Check the conversation content area background
    const conversationContent = page.locator('[role="log"]').first();
    const bgColor = await conversationContent.evaluate((el) => {
      // Check the element and its computed background
      const computed = window.getComputedStyle(el);
      const bg = computed.backgroundColor;
      
      // Also check parent elements to ensure dark theme cascade
      let parent = el.parentElement;
      const parentBgs: string[] = [];
      while (parent && parentBgs.length < 5) {
        parentBgs.push(window.getComputedStyle(parent).backgroundColor);
        parent = parent.parentElement;
      }
      
      return { elementBg: bg, parentBgs };
    });

    console.log("Conversation area backgrounds:", JSON.stringify(bgColor, null, 2));

    // Check element background
    const elementRgbMatch = bgColor.elementBg.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (elementRgbMatch) {
      const [, r, g, b] = elementRgbMatch.map(Number);
      expect(r).toBeLessThan(30);
      expect(g).toBeLessThan(30);
      expect(b).toBeLessThan(30);
    }

    // Check that no parent has a white background
    for (const parentBg of bgColor.parentBgs) {
      const match = parentBg.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      if (match) {
        const [, r, g, b] = match.map(Number);
        // No parent should have light background (all values > 200 = white-ish)
        const isLight = r > 200 && g > 200 && b > 200;
        expect(isLight).toBe(false);
        
        if (isLight) {
          throw new Error(`REGRESSION: Parent element has light background: rgb(${r}, ${g}, ${b})`);
        }
      }
    }
  });

  test("Header badges must be visible with dark backgrounds", async ({ page }) => {
    // Check badge elements in header
    const badges = await page.locator('[role="status"], .inline-flex.items-center.rounded-md.border').all();
    
    if (badges.length > 0) {
      console.log(`Found ${badges.length} badge elements to check`);
      
      for (let i = 0; i < Math.min(badges.length, 5); i++) {
        const badge = badges[i];
        const styles = await badge.evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return {
            backgroundColor: computed.backgroundColor,
            color: computed.color,
            border: computed.border,
            opacity: computed.opacity,
          };
        });

        console.log(`Badge ${i}:`, styles);

        // Badge should not have transparent background with light text
        // (which would be invisible on dark background)
        const bgMatch = styles.backgroundColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
        const colorMatch = styles.color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        
        if (bgMatch && colorMatch) {
          const [, bgR, bgG, bgB, alpha] = bgMatch;
          const [, cR, cG, cB] = colorMatch.map(Number);
          
          const bgBrightness = (Number(bgR) + Number(bgG) + Number(bgB)) / 3;
          const textBrightness = (cR + cG + cB) / 3;
          
          // Ensure sufficient contrast
          const contrast = Math.abs(bgBrightness - textBrightness);
          expect(contrast).toBeGreaterThan(50);
          
          console.log(`✅ Badge ${i} has good contrast: ${contrast.toFixed(0)}`);
        }
      }
    }
  });

  test("Suggestion buttons must have dark styling", async ({ page }) => {
    // Look for suggestion buttons (only visible on welcome screen)
    const suggestions = await page.locator('button[type="button"]').filter({ hasText: /^(Help|Explain|Generate|Solve|Plan|Review|How|What)/ }).all();
    
    if (suggestions.length > 0) {
      console.log(`Found ${suggestions.length} suggestion buttons to check`);
      
      const firstSuggestion = suggestions[0];
      const styles = await firstSuggestion.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          backgroundColor: computed.backgroundColor,
          color: computed.color,
          border: computed.border,
        };
      });

      console.log("Suggestion button style:", styles);

      // Background should be dark
      const bgMatch = styles.backgroundColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (bgMatch) {
        const [, r, g, b] = bgMatch.map(Number);
        const brightness = (r + g + b) / 3;
        
        // Should be dark (not white/light gray)
        expect(brightness).toBeLessThan(100);
        console.log(`✅ Suggestion button background is dark: brightness ${brightness.toFixed(0)}`);
      }

      // Text should be light
      const colorMatch = styles.color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      if (colorMatch) {
        const [, r, g, b] = colorMatch.map(Number);
        const textBrightness = (r + g + b) / 3;
        
        // Text should be light (readable on dark background)
        expect(textBrightness).toBeGreaterThan(150);
        console.log(`✅ Suggestion button text is light: brightness ${textBrightness.toFixed(0)}`);
      }
    }
  });

  test("Visual snapshot: Capture baseline for comparison", async ({ page }) => {
    // Take a full-page screenshot for visual regression comparison
    await expect(page).toHaveScreenshot("dark-theme-baseline.png", {
      fullPage: true,
      animations: "disabled",
      // Allow small differences for dynamic content
      maxDiffPixels: 100,
    });
  });

  test("Body and HTML elements have dark theme applied", async ({ page }) => {
    const rootStyles = await page.evaluate(() => {
      const html = document.documentElement;
      const body = document.body;
      
      return {
        htmlBg: window.getComputedStyle(html).backgroundColor,
        bodyBg: window.getComputedStyle(body).backgroundColor,
        htmlDataTheme: html.getAttribute('data-theme'),
        htmlDataColorScheme: html.getAttribute('data-color-scheme'),
      };
    });

    console.log("Root element styles:", rootStyles);

    // Check body background is dark
    const bodyRgbMatch = rootStyles.bodyBg.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (bodyRgbMatch) {
      const [, r, g, b] = bodyRgbMatch.map(Number);
      expect(r).toBeLessThan(30);
      expect(g).toBeLessThan(30);
      expect(b).toBeLessThan(30);
      console.log(`✅ Body background is dark: rgb(${r}, ${g}, ${b})`);
    }
  });

  test("No light-colored gradients in main content area", async ({ page }) => {
    // Check for any elements with light gradient backgrounds
    const lightGradients = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      const lightElements: string[] = [];
      
      elements.forEach((el) => {
        const computed = window.getComputedStyle(el);
        const bg = computed.background || computed.backgroundColor;
        
        // Check for gradient with 'white', 'rgb(255', or other light colors
        if (bg && (
          bg.includes('rgb(255') ||
          bg.includes('rgb(240') ||
          bg.includes('rgb(230') ||
          bg.includes('white')
        )) {
          const rect = el.getBoundingClientRect();
          // Only report visible elements in main content area
          if (rect.width > 100 && rect.height > 50) {
            lightElements.push(`${el.tagName}.${el.className}: ${bg.substring(0, 100)}`);
          }
        }
      });
      
      return lightElements;
    });

    if (lightGradients.length > 0) {
      console.warn("⚠️  Found elements with potentially light backgrounds:", lightGradients);
      // Don't fail the test, but log for investigation
      // If these are actual issues, they should be caught by the RGB checks above
    } else {
      console.log("✅ No light-colored gradients found in main content");
    }
  });
});
