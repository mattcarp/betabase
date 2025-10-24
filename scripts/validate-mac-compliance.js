#!/usr/bin/env node

/**
 * MAC Design System Compliance Validator
 * Runs as pre-commit hook to catch violations before they're committed
 */

const fs = require("fs");
const path = require("path");

// Color patterns that indicate hardcoded colors (violations)
const HARDCODED_COLOR_PATTERNS = [
  /#[0-9a-fA-F]{3,8}\b/g, // Hex colors: #fff, #ffffff, #ffffff80
  /rgb\([^)]+\)/g, // RGB: rgb(255, 255, 255)
  /rgba\([^)]+\)/g, // RGBA: rgba(255, 255, 255, 0.5)
  /hsl\([^)]+\)/g, // HSL: hsl(0, 0%, 100%)
  /hsla\([^)]+\)/g, // HSLA: hsla(0, 0%, 100%, 0.5)
];

// Spacing violations (non-8px grid)
const SPACING_VIOLATIONS = [
  /\bgap-[1357]\b/g,
  /\bp-[1357]\b/g,
  /\bpx-[1357]\b/g,
  /\bpy-[1357]\b/g,
  /\bpt-[1357]\b/g,
  /\bpb-[1357]\b/g,
  /\bpl-[1357]\b/g,
  /\bpr-[1357]\b/g,
  /\bm-[1357]\b/g,
  /\bmx-[1357]\b/g,
  /\bmy-[1357]\b/g,
  /\bmt-[1357]\b/g,
  /\bmb-[1357]\b/g,
  /\bml-[1357]\b/g,
  /\bmr-[1357]\b/g,
];

// Typography weight violations (only 100-400 allowed)
const TYPOGRAPHY_VIOLATIONS = [
  /\bfont-medium\b/g, // 500
  /\bfont-semibold\b/g, // 600
  /\bfont-bold\b/g, // 700
  /\bfont-extrabold\b/g, // 800
  /\bfont-black\b/g, // 900
];

// Allowlist: Files/paths to skip validation
const SKIP_PATHS = [
  "node_modules/",
  ".next/",
  "build/",
  "dist/",
  "scripts/", // Skip validation scripts themselves
  ".git/",
  "public/",
  "src/styles/mac-design-system.css", // Skip the design system file itself
];

class MACComplianceValidator {
  constructor(files) {
    this.files = files;
    this.violations = [];
  }

  shouldValidate(filePath) {
    // Only validate .ts, .tsx, .js, .jsx, .css files
    if (!/\.(tsx?|jsx?|css)$/.test(filePath)) return false;

    // Skip files in allowlist paths
    return !SKIP_PATHS.some((skipPath) => filePath.includes(skipPath));
  }

  validateFile(filePath) {
    if (!this.shouldValidate(filePath)) return;

    const content = fs.readFileSync(filePath, "utf8");
    const fileName = path.basename(filePath);
    const fileViolations = [];

    // 1. Check for hardcoded colors
    HARDCODED_COLOR_PATTERNS.forEach((pattern) => {
      const matches = content.match(pattern);
      if (matches) {
        fileViolations.push({
          type: "hardcoded-color",
          count: matches.length,
          examples: matches.slice(0, 3), // Show first 3 examples
        });
      }
    });

    // 2. Check for spacing violations
    SPACING_VIOLATIONS.forEach((pattern) => {
      const matches = content.match(pattern);
      if (matches) {
        fileViolations.push({
          type: "spacing-violation",
          count: matches.length,
          examples: matches.slice(0, 3),
        });
      }
    });

    // 3. Check for typography weight violations
    TYPOGRAPHY_VIOLATIONS.forEach((pattern) => {
      const matches = content.match(pattern);
      if (matches) {
        fileViolations.push({
          type: "typography-violation",
          count: matches.length,
          examples: matches.slice(0, 3),
        });
      }
    });

    if (fileViolations.length > 0) {
      this.violations.push({
        file: filePath,
        violations: fileViolations,
      });
    }
  }

  validate() {
    this.files.forEach((file) => this.validateFile(file));
    return this.violations;
  }

  formatReport() {
    if (this.violations.length === 0) {
      return "✅ MAC Design System compliance: All checks passed!";
    }

    let report = "\n❌ MAC Design System Violations Detected:\n\n";

    this.violations.forEach(({ file, violations }) => {
      report += `📄 ${file}\n`;

      violations.forEach(({ type, count, examples }) => {
        report += `  • ${this.getViolationMessage(type)}: ${count} violation(s)\n`;
        if (examples.length > 0) {
          report += `    Examples: ${examples.join(", ")}\n`;
        }
      });

      report += "\n";
    });

    report += this.getSuggestions();

    return report;
  }

  getViolationMessage(type) {
    switch (type) {
      case "hardcoded-color":
        return "Hardcoded colors (use --mac-* CSS variables)";
      case "spacing-violation":
        return "Non-8px spacing (use gap-2/4/6/8 instead of gap-1/3/5/7)";
      case "typography-violation":
        return "Invalid font weight (MAC only allows 100-400)";
      default:
        return type;
    }
  }

  getSuggestions() {
    return `
📚 MAC Design System Quick Fixes:

  Colors:
  ❌ background: #1a1a1a        ✅ background: var(--mac-bg-primary)
  ❌ color: rgb(255,255,255)    ✅ color: var(--mac-text-primary)

  Spacing (8px grid):
  ❌ gap-1 (4px)                ✅ gap-2 (8px)
  ❌ p-3 (12px)                 ✅ p-4 (16px)
  ❌ gap-5 (20px)               ✅ gap-6 (24px)

  Typography:
  ❌ font-bold (700)            ✅ font-normal (400)
  ❌ font-semibold (600)        ✅ font-light (300)

  🔧 Auto-fix spacing: npm run fix:spacing
  📖 Full design system: src/styles/mac-design-system.css
`;
  }

  getTotalViolationCount() {
    return this.violations.reduce((total, { violations }) => {
      return total + violations.reduce((sum, v) => sum + v.count, 0);
    }, 0);
  }
}

// Main execution
function main() {
  // Get files from command line args (passed by lint-staged)
  const files = process.argv.slice(2);

  if (files.length === 0) {
    console.log("✅ No files to validate");
    process.exit(0);
  }

  const validator = new MACComplianceValidator(files);
  validator.validate();

  const report = validator.formatReport();
  console.log(report);

  const totalViolations = validator.getTotalViolationCount();

  if (totalViolations > 0) {
    console.log(
      `\n⚠️  Found ${totalViolations} MAC Design System violation(s) across ${validator.violations.length} file(s)`
    );
    console.log(
      "💡 Fix violations before committing, or use --no-verify to bypass (not recommended)\n"
    );
    process.exit(1); // Block commit
  }

  process.exit(0); // Allow commit
}

main();
