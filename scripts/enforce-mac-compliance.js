#!/usr/bin/env node

/**
 * Enforce MAC Design System Compliance
 *
 * This script is designed to be run by lint-staged.
 * It strictly enforces compliance by:
 * 1. Auto-fixing known violations (Typography weights, missing classes).
 * 2. Validating remaining violations (Hardcoded colors, spacing).
 * 3. Failing if critical violations remain.
 */

const fs = require("fs");
const path = require("path");

// --- Configuration ---

const SKIP_PATHS = ["node_modules", ".next", "build", "dist", "public", ".git"];

// Fixer Patterns
const TYPOGRAPHY_FIXES = [
  { pattern: /\bfont-medium\b/g, replacement: "font-normal" },    // 500 -> 400
  { pattern: /\bfont-semibold\b/g, replacement: "font-normal" },  // 600 -> 400
  { pattern: /\bfont-bold\b/g, replacement: "font-normal" },      // 700 -> 400
  { pattern: /\bfont-extrabold\b/g, replacement: "font-normal" }, // 800 -> 400
  { pattern: /\bfont-black\b/g, replacement: "font-normal" },     // 900 -> 400
];

const BUTTON_CLASS_MAP = {
  default: "mac-button mac-button-primary",
  primary: "mac-button mac-button-primary",
  secondary: "mac-button mac-button-secondary",
  outline: "mac-button mac-button-outline",
  ghost: "mac-button mac-button-outline",
  destructive: "mac-button mac-button-primary",
  link: "mac-button",
};

// --- Validator Patterns ---

const VALIDATION_CHECKS = [
  {
    type: "hardcoded-color",
    pattern: /#[0-9a-fA-F]{3,8}\b|rgb\([^)]+\)|hsl\([^)]+\)/g,
    message: "Hardcoded color detected. Use CSS variables (e.g. var(--mac-text-primary))."
  },
  {
    type: "spacing-violation",
    pattern: /\b(gap|p|px|py|pt|pb|pl|pr|m|mx|my|mt|mb|ml|mr)-[13579]\b/g,
    message: "Non-8px grid spacing detected. Use multiples of 2 (gap-2, p-4)."
  }
];

// --- Core Class ---

class ComplianceEnforcer {
  constructor(files) {
    this.files = files;
    this.fixedCount = 0;
    this.violations = [];
  }

  process() {
    console.log(`🛡️  Enforcing MAC Design Compliance on ${this.files.length} file(s)...`);

    for (const filePath of this.files) {
      if (this.shouldSkip(filePath)) continue;

      let content = "";
      try {
        content = fs.readFileSync(filePath, "utf8");
      } catch (e) {
        // File might have been deleted
        continue;
      }

      let newContent = content;
      let fileFixed = false;

      // 1. Apply Auto-Fixes
      const typoResult = this.fixTypography(newContent);
      if (typoResult.modified) {
        newContent = typoResult.content;
        fileFixed = true;
      }

      const buttonResult = this.fixButtons(newContent);
      if (buttonResult.modified) {
        newContent = buttonResult.content;
        fileFixed = true;
      }
      
      const cardResult = this.fixCards(newContent);
      if (cardResult.modified) {
        newContent = cardResult.content;
        fileFixed = true;
      }

      // Write changes if fixed
      if (fileFixed) {
        fs.writeFileSync(filePath, newContent, "utf8");
        this.fixedCount++;
        // console.log(`  ✨ Auto-fixed: ${path.basename(filePath)}`);
      }

      // 2. Validate Remaining Content
      this.validate(filePath, newContent);
    }

    this.report();
  }

  shouldSkip(filePath) {
    return SKIP_PATHS.some(p => filePath.includes(p)) || !/\.(tsx|jsx|ts|js)$/.test(filePath);
  }

  // --- Fixers ---

  fixTypography(content) {
    let newContent = content;
    let modified = false;
    TYPOGRAPHY_FIXES.forEach(({ pattern, replacement }) => {
        // specific check to avoid replacing inside comments or strings potentially? 
        // For now, strict replacement is acceptable per "Zero Tolerance"
        if (pattern.test(newContent)) {
             newContent = newContent.replace(pattern, replacement);
             modified = true;
        }
    });
    return { content: newContent, modified };
  }

  fixButtons(content) {
    let newContent = content;
    let modified = false;

    // Regex to find <Button ... variant="..." ...> and ensure class exists
    // Simplified pattern matching for performance in pre-commit
    // Find <Button> tags
    const buttonRegex = /<Button\s+([^>]*?)>/g;
    newContent = newContent.replace(buttonRegex, (match, props) => {
        if (props.includes("mac-button")) return match;
        
        // precise variant extraction is hard with just regex, assuming default or simple props
        let variant = "default";
        const variantMatch = props.match(/variant=['"]([^'"]+)['"]/);
        if (variantMatch) variant = variantMatch[1];
        
        const macClass = BUTTON_CLASS_MAP[variant] || "mac-button";
        
        modified = true;
        
        if (props.includes("className=")) {
             return `<Button ${props.replace(/className=(['"])/, `className=$1${macClass} `)}>`; // Prepend
        } else {
             return `<Button className="${macClass}" ${props}>`;
        }
    });

    return { content: newContent, modified };
  }
  
  fixCards(content) {
    let newContent = content;
    let modified = false;
    
    // <Card> -> <Card className="mac-card">
    newContent = newContent.replace(/<Card(\s+[^>]*?)?>/g, (match, props) => {
        const p = props || "";
        if (p.includes("mac-card")) return match;
        modified = true;
        if (p.includes("className=")) {
            return `<Card${p.replace(/className=(['"])/, `className=$1mac-card `)}>`;
        }
        return `<Card className="mac-card"${p}>`;
    });
    
    // <CardHeader> -> <CardHeader className="mac-card">
        newContent = newContent.replace(/<CardHeader(\s+[^>]*?)?>/g, (match, props) => {
        const p = props || "";
         if (p.includes("mac-card")) return match;
         modified = true;
         if (p.includes("className=")) {
             return `<CardHeader${p.replace(/className=(['"])/, `className=$1mac-card `)}>`;
         }
         return `<CardHeader className="mac-card"${p}>`;
     });

    return { content: newContent, modified };
  }

  // --- Validator ---

  validate(filePath, content) {
    VALIDATION_CHECKS.forEach(check => {
        const matches = content.match(check.pattern);
        if (matches) {
            // Filter out some false positives if needed (e.g. inside strings in tests)
            // For now, report all
            this.violations.push({
                file: filePath,
                type: check.type,
                message: check.message,
                count: matches.length,
                examples: matches.slice(0, 3)
            });
        }
    });
  }

  report() {
    if (this.fixedCount > 0) {
        console.log(`✅ Auto-fixed ${this.fixedCount} file(s).`);
    }

    if (this.violations.length > 0) {
        console.error(`\n❌ Validation Failed: Found ${this.violations.reduce((a, b) => a + b.count, 0)} violations.`);
        this.violations.forEach(v => {
            console.error(`\n📄 ${path.basename(v.file)}:`);
            console.error(`   ${v.message}`);
            console.error(`   Examples: ${v.examples.join(", ")}`);
        });
        console.error(`\nPlease fix these issues before committing.`);
        process.exit(1);
    } else {
        console.log("✅ Design Compliance Checked.");
        process.exit(0);
    }
  }
}

// Execution
const files = process.argv.slice(2);
if (files.length === 0) {
    // console.log("No files to check.");
    process.exit(0);
}

const enforcer = new ComplianceEnforcer(files);
enforcer.process();
