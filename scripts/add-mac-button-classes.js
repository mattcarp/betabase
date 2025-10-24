#!/usr/bin/env node

/**
 * Add MAC Design System classes to Button components
 *
 * This script adds appropriate .mac-button classes to Button components
 * based on their variant prop.
 */

const fs = require("fs");
const path = require("path");
const glob = require("glob");

// MAC button class mappings based on variant
const BUTTON_CLASS_MAP = {
  default: "mac-button mac-button-primary",
  primary: "mac-button mac-button-primary",
  secondary: "mac-button mac-button-secondary",
  outline: "mac-button mac-button-outline",
  ghost: "mac-button mac-button-outline",
  destructive: "mac-button mac-button-primary",
  link: "mac-button",
};

function addMacButtonClasses(content) {
  let modified = content;
  let changeCount = 0;

  // Pattern 1: <Button variant="X" className="existing">
  // Add mac-button classes if not present
  const buttonPatterns = [
    // With variant and className
    {
      pattern: /<Button\s+([^>]*?)variant="([^"]+)"([^>]*?)className="([^"]+)"/g,
      handler: (match, before, variant, after, className) => {
        const macClass = BUTTON_CLASS_MAP[variant] || "mac-button";
        if (className.includes("mac-button")) return match;

        const newClassName = `${macClass} ${className}`.trim();
        changeCount++;
        return `<Button ${before}variant="${variant}"${after}className="${newClassName}"`;
      },
    },
    // With variant, no className
    {
      pattern: /<Button\s+([^>]*?)variant="([^"]+)"(?![^>]*className)/g,
      handler: (match, before, variant) => {
        const macClass = BUTTON_CLASS_MAP[variant] || "mac-button";
        changeCount++;
        return `<Button ${before}variant="${variant}" className="${macClass}"`;
      },
    },
    // No variant, with className
    {
      pattern: /<Button\s+(?![^>]*variant)([^>]*?)className="([^"]+)"/g,
      handler: (match, before, className) => {
        if (className.includes("mac-button")) return match;

        const newClassName = `mac-button ${className}`.trim();
        changeCount++;
        return `<Button ${before}className="${newClassName}"`;
      },
    },
    // No variant, no className (but has other props)
    {
      pattern: /<Button\s+(?![^>]*variant)(?![^>]*className)([^>]+)>/g,
      handler: (match, props) => {
        changeCount++;
        return `<Button ${props} className="mac-button">`;
      },
    },
  ];

  buttonPatterns.forEach(({ pattern, handler }) => {
    modified = modified.replace(pattern, handler);
  });

  return { modified, changeCount };
}

function processFile(filePath, dryRun = false) {
  const content = fs.readFileSync(filePath, "utf8");
  const { modified, changeCount } = addMacButtonClasses(content);

  if (changeCount > 0) {
    console.log(`  ${filePath}: ${changeCount} button(s) updated`);

    if (!dryRun) {
      fs.writeFileSync(filePath, modified, "utf8");
    }
  }

  return changeCount;
}

function main() {
  const dryRun = process.argv.includes("--dry-run");

  console.log(dryRun ? "🔍 DRY RUN - Analyzing files...\n" : "🔧 Adding MAC button classes...\n");

  // Find all TSX files
  const files = glob.sync("src/**/*.{tsx,jsx}", {
    ignore: ["**/node_modules/**", "**/*.test.*", "**/*.spec.*"],
  });

  let totalChanges = 0;
  let filesModified = 0;

  files.forEach((file) => {
    const changes = processFile(file, dryRun);
    if (changes > 0) {
      totalChanges += changes;
      filesModified++;
    }
  });

  console.log(`\n✅ Summary:`);
  console.log(`   Files analyzed: ${files.length}`);
  console.log(`   Files modified: ${filesModified}`);
  console.log(`   Total changes: ${totalChanges}`);

  if (dryRun) {
    console.log("\n💡 Run without --dry-run to apply changes");
  } else {
    console.log("\n✅ Changes applied! Run prettier to format.");
  }
}

main();
