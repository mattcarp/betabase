#!/usr/bin/env node
/**
 * Fiona's MAC Design System Violation Scanner
 * Scans all component files for violations of the MAC Design System
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const AUDIT_DIR = path.join(process.cwd(), "audit-results");
const SRC_DIR = path.join(process.cwd(), "src");
// APP_DIR removed as it is likely inside SRC_DIR or handled separately if needed, but 'siam/app' was invalid.
// const APP_DIR = "/Users/matt/Documents/projects/siam/app";

// Ensure audit directory exists
if (!fs.existsSync(AUDIT_DIR)) {
  fs.mkdirSync(AUDIT_DIR, { recursive: true });
}

const violations = {
  hardcodedColors: [],
  nonMACTypography: [],
  missingMACClasses: [],
  hardcodedSpacing: [],
  nonMACAnimations: [],
};

// Regex patterns for violations
const patterns = {
  // Hardcoded colors (hex, rgb, rgba) not using CSS variables
  hardcodedColors:
    /(?:background(?:-color)?|color|border(?:-color)?)\s*:\s*(?:#[0-9a-fA-F]{3,8}|rgba?\([^)]+\))/g,

  // Font weights outside MAC standard (100-400)
  nonMACFontWeight: /font-weight\s*:\s*(?:500|600|700|800|900|bold|bolder)/g,

  // Hardcoded spacing values instead of using 8px grid
  hardcodedSpacing: /(?:padding|margin|gap|width|height)\s*:\s*(?:(?:[0-9.]+(?:px|rem)))/g,

  // Non-MAC animation timings (should be 150-300ms)
  nonMACAnimation:
    /(?:transition|animation)(?:-duration)?\s*:\s*(?:[4-9][0-9]{2,}ms|[1-9][0-9]{3,}ms|[0-9]+\.?[0-9]*s)/g,
};

function scanFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const relativePath = filePath.replace(process.cwd() + "/", "");

    // Check for hardcoded colors
    let match;
    while ((match = patterns.hardcodedColors.exec(content)) !== null) {
      // Ignore if it uses a CSS variable
      if (match[0].includes("var(")) continue;

      const lineNumber = content.substring(0, match.index).split("\n").length;
      violations.hardcodedColors.push({
        file: relativePath,
        line: lineNumber,
        code: match[0],
        suggestion: "Use --mac-* CSS variables",
      });
    }

    // Check for non-MAC font weights
    patterns.nonMACFontWeight.lastIndex = 0;
    while ((match = patterns.nonMACFontWeight.exec(content)) !== null) {
      const lineNumber = content.substring(0, match.index).split("\n").length;
      violations.nonMACTypography.push({
        file: relativePath,
        line: lineNumber,
        code: match[0],
        suggestion: "Use font-weight: 100, 200, 300, or 400 only",
      });
    }

    // Check for hardcoded spacing
    patterns.hardcodedSpacing.lastIndex = 0;
    while ((match = patterns.hardcodedSpacing.exec(content)) !== null) {
      // Extract value with unit
      const value = match[0].split(":")[1].trim();
      if (value && !isMultipleOfEight(value)) {
        const lineNumber = content.substring(0, match.index).split("\n").length;
        violations.hardcodedSpacing.push({
          file: relativePath,
          line: lineNumber,
          code: match[0],
          suggestion: "Use spacing values that are multiples of 8px",
        });
      }
    }

    // Check for non-MAC animations
    patterns.nonMACAnimation.lastIndex = 0;
    while ((match = patterns.nonMACAnimation.exec(content)) !== null) {
      const lineNumber = content.substring(0, match.index).split("\n").length;
      violations.nonMACAnimations.push({
        file: relativePath,
        line: lineNumber,
        code: match[0],
        suggestion: "Use animation timing: 150ms, 200ms, or 300ms",
      });
    }

    // Check for components that should use MAC classes
    if (content.includes("className=") || content.includes("class=")) {
      const hasButton = content.match(/<button|<Button/i);
      const hasInput = content.match(/<input|<Input/i);
      const hasCard = content.match(/<div[^>]*card/i);

      if (hasButton && !content.includes("mac-button")) {
        violations.missingMACClasses.push({
          file: relativePath,
          line: 0,
          code: "Button without mac-button class",
          suggestion: "Add mac-button, mac-button-primary, or mac-button-secondary class",
        });
      }

      if (hasInput && !content.includes("mac-input")) {
        violations.missingMACClasses.push({
          file: relativePath,
          line: 0,
          code: "Input without mac-input class",
          suggestion: "Add mac-input class",
        });
      }
    }
  } catch (error) {
    console.error(`Error scanning ${filePath}:`, error.message);
  }
}

function isMultipleOfEight(value) {
  const num = parseFloat(value);
  if (isNaN(num)) return true; // Skip if not a number

  // Convert rem to px (assuming 1rem = 16px)
  const px = value.includes("rem") ? num * 16 : num;

  // Allow small values (<= 4px) for borders, separators, etc.
  if (px <= 4) return true;

  // Check if it's a multiple of 8 (with tolerance for floating point)
  return Math.abs(px % 8) < 0.1;
}

function scanDirectory(dir) {
  try {
    const files = fs.readdirSync(dir);

    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        // Skip node_modules, .next, etc.
        if (!file.startsWith(".") && file !== "node_modules") {
          scanDirectory(filePath);
        }
      } else if (file.endsWith(".tsx") || file.endsWith(".ts") || file.endsWith(".css")) {
        scanFile(filePath);
      }
    }
  } catch (error) {
    console.error(`Error scanning directory ${dir}:`, error.message);
  }
}

console.log("🔍 Scanning for MAC Design System violations...\n");

// Scan source and app directories
scanDirectory(SRC_DIR);
// scanDirectory(APP_DIR); // Removed as app dir is likely within src or incorrectly addressed

// Generate summary
const totalViolations =
  violations.hardcodedColors.length +
  violations.nonMACTypography.length +
  violations.missingMACClasses.length +
  violations.hardcodedSpacing.length +
  violations.nonMACAnimations.length;

console.log("\n📊 SCAN SUMMARY:");
console.log(`   Hardcoded Colors: ${violations.hardcodedColors.length}`);
console.log(`   Non-MAC Typography: ${violations.nonMACTypography.length}`);
console.log(`   Missing MAC Classes: ${violations.missingMACClasses.length}`);
console.log(`   Hardcoded Spacing: ${violations.hardcodedSpacing.length}`);
console.log(`   Non-MAC Animations: ${violations.nonMACAnimations.length}`);
console.log(`   TOTAL VIOLATIONS: ${totalViolations}\n`);

// Save detailed results
const resultsPath = path.join(AUDIT_DIR, "mac-violations-detailed.json");
fs.writeFileSync(resultsPath, JSON.stringify(violations, null, 2));
console.log(`📝 Detailed results saved to: ${resultsPath}`);

// Generate markdown report
const mdReport = generateMarkdownReport(violations);
const mdPath = path.join(AUDIT_DIR, "mac-violations-report.md");
fs.writeFileSync(mdPath, mdReport);
console.log(`📄 Markdown report saved to: ${mdPath}\n`);

function generateMarkdownReport(violations) {
  let md = "# MAC Design System Violations Report\n\n";
  md += `Generated: ${new Date().toLocaleString()}\n\n`;

  md += "## Summary\n\n";
  md += `- **Hardcoded Colors**: ${violations.hardcodedColors.length}\n`;
  md += `- **Non-MAC Typography**: ${violations.nonMACTypography.length}\n`;
  md += `- **Missing MAC Classes**: ${violations.missingMACClasses.length}\n`;
  md += `- **Hardcoded Spacing**: ${violations.hardcodedSpacing.length}\n`;
  md += `- **Non-MAC Animations**: ${violations.nonMACAnimations.length}\n\n`;

  if (violations.hardcodedColors.length > 0) {
    md += "## 🎨 Hardcoded Colors (should use --mac-* variables)\n\n";
    violations.hardcodedColors.slice(0, 20).forEach((v) => {
      md += `- **${v.file}:${v.line}** - \`${v.code}\`\n`;
      md += `  - ${v.suggestion}\n\n`;
    });
    if (violations.hardcodedColors.length > 20) {
      md += `... and ${violations.hardcodedColors.length - 20} more\n\n`;
    }
  }

  if (violations.nonMACTypography.length > 0) {
    md += "## 🔤 Non-MAC Typography Weights\n\n";
    violations.nonMACTypography.slice(0, 20).forEach((v) => {
      md += `- **${v.file}:${v.line}** - \`${v.code}\`\n`;
      md += `  - ${v.suggestion}\n\n`;
    });
    if (violations.nonMACTypography.length > 20) {
      md += `... and ${violations.nonMACTypography.length - 20} more\n\n`;
    }
  }

  if (violations.missingMACClasses.length > 0) {
    md += "## 🏷️ Missing MAC Classes\n\n";
    violations.missingMACClasses.forEach((v) => {
      md += `- **${v.file}** - ${v.code}\n`;
      md += `  - ${v.suggestion}\n\n`;
    });
  }

  return md;
}
