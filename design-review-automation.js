const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

async function performDesignReview() {
  // Launch browser with extended timeout for slow networks
  const browser = await chromium.launch({
    headless: true, // Running in headless mode for CI/CD
    devtools: false,
    timeout: 60000,
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }, // Desktop viewport
  });

  const page = await context.newPage();

  // Enable request/response tracking
  const requests = [];
  const responses = [];

  page.on("request", (req) => requests.push(req.url()));
  page.on("response", (res) => responses.push({ url: res.url(), status: res.status() }));

  const screenshots = [];
  const consoleMessages = [];
  const errors = [];

  // Track console messages and errors
  page.on("console", (msg) => consoleMessages.push({ type: msg.type(), text: msg.text() }));
  page.on("pageerror", (error) => errors.push(error.message));

  try {
    console.log("🎯 PHASE 0: Starting Design Review Environment Setup");

    // Navigate to the main page
    console.log("Navigating to http://localhost:3000...");
    await page.goto("http://localhost:3000", {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });

    // Wait for page to load
    await page.waitForTimeout(3000);

    // Phase 1: Login Page Analysis
    console.log("📸 Phase 1: Capturing Login Page");
    await page.screenshot({
      path: "design-review-screenshots/01-login-page-desktop.png",
      fullPage: true,
    });
    screenshots.push("01-login-page-desktop.png");

    // Check for gaming elements on login page
    const gamingElementsLogin = await page.evaluate(() => {
      const elements = [];

      // Check for floating orbs
      const orbs = document.querySelectorAll(".mac-floating-orb");
      if (orbs.length > 0) {
        elements.push(`Found ${orbs.length} floating orbs - GAMING AESTHETIC DETECTED`);
      }

      // Check for glow animations
      const glowElements = document.querySelectorAll('[class*="glow"], [class*="shimmer"]');
      if (glowElements.length > 0) {
        elements.push(
          `Found ${glowElements.length} glow/shimmer effects - GAMING AESTHETIC DETECTED`
        );
      }

      // Check for neon colors in computed styles
      const allElements = document.querySelectorAll("*");
      for (let el of allElements) {
        const style = getComputedStyle(el);
        const color = style.color || "";
        const bgColor = style.backgroundColor || "";
        const borderColor = style.borderColor || "";

        // Check for bright/neon colors (high saturation)
        if (color.includes("rgb(") || bgColor.includes("rgb(") || borderColor.includes("rgb(")) {
          // This is a simplified check - would need more sophisticated color analysis
          const hasNeonColor = color.includes("255") || bgColor.includes("255");
          if (hasNeonColor) {
            elements.push(`Potential neon color detected on ${el.tagName}`);
          }
        }
      }

      return elements;
    });

    // Phase 2: Mobile Responsiveness Check
    console.log("📱 Phase 2: Mobile Responsiveness Testing");

    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: "design-review-screenshots/02-login-mobile.png",
      fullPage: true,
    });
    screenshots.push("02-login-mobile.png");

    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: "design-review-screenshots/03-login-tablet.png",
      fullPage: true,
    });
    screenshots.push("03-login-tablet.png");

    // Return to desktop
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForTimeout(1000);

    // Phase 3: Try to navigate to other routes
    console.log("🧭 Phase 3: Route Discovery & Navigation");

    const routesToTest = ["/dashboard", "/chat", "/settings", "/test", "/hud", "/fix", "/curate"];

    for (let route of routesToTest) {
      try {
        console.log(`Navigating to ${route}...`);
        await page.goto(`http://localhost:3000${route}`, {
          waitUntil: "domcontentloaded",
          timeout: 8000,
        });
        await page.waitForTimeout(2000);

        const routeName = route.substring(1) || "home";
        const screenshotPath = `design-review-screenshots/04-${routeName}-page.png`;

        await page.screenshot({
          path: screenshotPath,
          fullPage: true,
        });
        screenshots.push(`04-${routeName}-page.png`);

        // Check for gaming elements on this page
        const gamingElements = await page.evaluate(() => {
          const elements = [];

          // Check for floating orbs
          const orbs = document.querySelectorAll(".mac-floating-orb");
          if (orbs.length > 0) {
            elements.push(`Floating orbs: ${orbs.length}`);
          }

          // Check for glow effects
          const glowElements = document.querySelectorAll(
            '[class*="glow"], [class*="shimmer"], [class*="pulse"]'
          );
          if (glowElements.length > 0) {
            elements.push(`Glow effects: ${glowElements.length}`);
          }

          return elements;
        });

        console.log(`Gaming elements found on ${route}:`, gamingElements);
      } catch (error) {
        console.log(`Could not access ${route}: ${error.message}`);
      }
    }

    // Phase 4: MAC Design System Validation
    console.log("🎨 Phase 4: MAC Design System Compliance Check");

    await page.goto("http://localhost:3000", {
      waitUntil: "domcontentloaded",
      timeout: 8000,
    });

    const designSystemAnalysis = await page.evaluate(() => {
      const analysis = {
        macClasses: [],
        colorTokens: [],
        fontWeights: [],
        animations: [],
        nonCompliantElements: [],
      };

      // Check for MAC design system classes
      const allElements = document.querySelectorAll("*");
      allElements.forEach((el) => {
        const classes = el.className || "";
        if (typeof classes === "string") {
          // Find MAC classes
          const macClasses = classes.split(" ").filter((cls) => cls.startsWith("mac-"));
          analysis.macClasses.push(...macClasses);

          // Check font weights
          const style = getComputedStyle(el);
          const fontWeight = style.fontWeight;
          if (fontWeight && !["100", "200", "300", "400", "normal", "bold"].includes(fontWeight)) {
            analysis.nonCompliantElements.push(
              `Heavy font weight (${fontWeight}) on ${el.tagName}`
            );
          }

          // Check for CSS custom properties (design tokens)
          const cssText = style.cssText;
          if (cssText.includes("--mac-")) {
            const tokens = cssText.match(/--mac-[a-z-]+/g);
            if (tokens) analysis.colorTokens.push(...tokens);
          }
        }
      });

      // Remove duplicates
      analysis.macClasses = [...new Set(analysis.macClasses)];
      analysis.colorTokens = [...new Set(analysis.colorTokens)];

      return analysis;
    });

    // Phase 5: Performance and Console Error Check
    console.log("⚡ Phase 5: Performance & Console Analysis");

    const performanceMetrics = await page.evaluate(() => {
      const paint = performance.getEntriesByType("paint");
      const navigation = performance.getEntriesByType("navigation")[0];

      return {
        firstContentfulPaint:
          paint.find((p) => p.name === "first-contentful-paint")?.startTime || 0,
        domContentLoaded:
          navigation?.domContentLoadedEventEnd - navigation?.domContentLoadedEventStart || 0,
        loadComplete: navigation?.loadEventEnd - navigation?.loadEventStart || 0,
      };
    });

    // Compile comprehensive report
    const report = {
      timestamp: new Date().toISOString(),
      url: page.url(),
      viewport: await page.viewportSize(),
      screenshots: screenshots,
      gamingElements: {
        loginPage: gamingElementsLogin,
        summary: "Gaming elements detected - review required",
      },
      designSystemCompliance: {
        macClassesFound: designSystemAnalysis.macClasses.length,
        macClasses: designSystemAnalysis.macClasses,
        colorTokens: designSystemAnalysis.colorTokens,
        nonCompliantElements: designSystemAnalysis.nonCompliantElements,
      },
      performance: performanceMetrics,
      console: {
        messages: consoleMessages,
        errors: errors,
        errorCount: errors.length,
      },
      network: {
        requestCount: requests.length,
        responses: responses.filter((r) => r.status >= 400),
      },
    };

    // Save detailed report
    fs.writeFileSync("design-review-report.json", JSON.stringify(report, null, 2));

    console.log("✅ Design Review Complete!");
    console.log(`📊 Report saved to: design-review-report.json`);
    console.log(`📸 Screenshots saved to: design-review-screenshots/`);
    console.log(`🎨 MAC classes found: ${designSystemAnalysis.macClasses.length}`);
    console.log(`❗ Gaming elements detected: ${gamingElementsLogin.length > 0 ? "YES" : "NO"}`);
    console.log(`🚨 Console errors: ${errors.length}`);

    return report;
  } catch (error) {
    console.error("Design review failed:", error);
    throw error;
  } finally {
    await browser.close();
  }
}

// Run the design review
if (require.main === module) {
  performDesignReview().catch(console.error);
}

module.exports = { performDesignReview };
