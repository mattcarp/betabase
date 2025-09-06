const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function performVisualAnalysis() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  // Create screenshots directory
  const screenshotsDir = path.join(__dirname, 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir);
  }

  const sections = [
    { name: 'login', url: 'http://localhost:3000/', description: 'Login page (/)' },
    { name: 'dashboard', url: 'http://localhost:3000/dashboard', description: 'Dashboard (/dashboard)' },
    { name: 'chat', url: 'http://localhost:3000/chat', description: 'Chat interface (/chat)' },
    { name: 'hud', url: 'http://localhost:3000/hud', description: 'HUD view (/hud)' },
    { name: 'test', url: 'http://localhost:3000/test', description: 'Test dashboard (/test)' },
    { name: 'fix', url: 'http://localhost:3000/fix', description: 'Fix interface (/fix)' },
    { name: 'curate', url: 'http://localhost:3000/curate', description: 'Curate view (/curate)' },
    { name: 'settings', url: 'http://localhost:3000/settings', description: 'Settings (/settings)' }
  ];

  const results = {};

  for (const section of sections) {
    try {
      console.log(`\n📸 Capturing ${section.description}...`);
      
      await page.goto(section.url, { waitUntil: 'networkidle', timeout: 10000 });
      
      // Wait for page to load
      await page.waitForTimeout(2000);
      
      // Check for console errors
      const consoleErrors = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });
      
      // Take screenshot
      const screenshotPath = path.join(screenshotsDir, `${section.name}.png`);
      await page.screenshot({
        path: screenshotPath,
        fullPage: true
      });
      
      // Get page title and basic info
      const title = await page.title();
      const url = page.url();
      
      // Check for accessibility issues (basic checks)
      const accessibilityIssues = await page.evaluate(() => {
        const issues = [];
        
        // Check for missing alt text on images
        const images = document.querySelectorAll('img');
        images.forEach((img, index) => {
          if (!img.alt) {
            issues.push(`Image ${index + 1} missing alt text`);
          }
        });
        
        // Check for missing form labels
        const inputs = document.querySelectorAll('input[type="text"], input[type="email"], input[type="password"], textarea');
        inputs.forEach((input, index) => {
          const hasLabel = document.querySelector(`label[for="${input.id}"]`) || input.closest('label');
          if (!hasLabel && !input.getAttribute('aria-label')) {
            issues.push(`Input ${index + 1} missing label or aria-label`);
          }
        });
        
        // Check for proper heading hierarchy
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        if (headings.length === 0) {
          issues.push('No headings found on page');
        }
        
        return issues;
      });
      
      // Check color contrast (basic check for text elements)
      const contrastIssues = await page.evaluate(() => {
        const issues = [];
        const textElements = document.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6, button, a');
        
        // This is a simplified contrast check - in production you'd use a proper contrast analyzer
        let lowContrastCount = 0;
        textElements.forEach((el) => {
          const styles = window.getComputedStyle(el);
          const color = styles.color;
          const backgroundColor = styles.backgroundColor;
          
          // Simple check for very dark text on dark backgrounds
          if (color.includes('rgb(') && backgroundColor.includes('rgb(')) {
            const colorMatch = color.match(/rgb\\((\\d+),\\s*(\\d+),\\s*(\\d+)\\)/);
            const bgMatch = backgroundColor.match(/rgb\\((\\d+),\\s*(\\d+),\\s*(\\d+)\\)/);
            
            if (colorMatch && bgMatch) {
              const [, r1, g1, b1] = colorMatch.map(Number);
              const [, r2, g2, b2] = bgMatch.map(Number);
              
              // Simple luminance check
              const lum1 = (r1 * 0.299 + g1 * 0.587 + b1 * 0.114) / 255;
              const lum2 = (r2 * 0.299 + g2 * 0.587 + b2 * 0.114) / 255;
              
              const contrast = Math.abs(lum1 - lum2);
              if (contrast < 0.3) {
                lowContrastCount++;
              }
            }
          }
        });
        
        if (lowContrastCount > 0) {
          issues.push(`${lowContrastCount} elements may have low contrast`);
        }
        
        return issues;
      });
      
      // Check for MAC Design System usage
      const macStylesUsage = await page.evaluate(() => {
        const usage = {
          macClasses: [],
          macVariables: [],
          customStyles: []
        };
        
        // Check for MAC CSS classes
        const elements = document.querySelectorAll('*');
        const macClasses = ['mac-professional', 'mac-display-text', 'mac-heading', 'mac-title', 'mac-body', 'mac-button', 'mac-input', 'mac-card', 'mac-glass', 'mac-background'];
        
        elements.forEach(el => {
          macClasses.forEach(macClass => {
            if (el.classList.contains(macClass)) {
              usage.macClasses.push(macClass);
            }
          });
        });
        
        // Check for CSS custom properties usage
        const stylesheets = Array.from(document.styleSheets);
        stylesheets.forEach(sheet => {
          try {
            const rules = Array.from(sheet.cssRules || []);
            rules.forEach(rule => {
              if (rule.style && rule.style.cssText) {
                if (rule.style.cssText.includes('--mac-')) {
                  usage.macVariables.push('MAC variables detected');
                }
              }
            });
          } catch (e) {
            // Cross-origin stylesheets may throw errors
          }
        });
        
        return usage;
      });
      
      results[section.name] = {
        title,
        url,
        screenshotPath,
        consoleErrors,
        accessibilityIssues,
        contrastIssues,
        macStylesUsage,
        timestamp: new Date().toISOString()
      };
      
      console.log(`✅ Captured ${section.name}: ${title}`);
      
    } catch (error) {
      console.log(`❌ Failed to capture ${section.name}: ${error.message}`);
      results[section.name] = {
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  await browser.close();
  
  // Save results to file
  const resultsPath = path.join(__dirname, 'visual-analysis-results.json');
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
  
  console.log(`\n📊 Visual analysis complete! Results saved to: ${resultsPath}`);
  console.log(`📁 Screenshots saved to: ${screenshotsDir}`);
  
  return results;
}

// Run the analysis
performVisualAnalysis().catch(console.error);