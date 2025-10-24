#!/usr/bin/env node

/**
 * Add MAC Design System classes to Card and Input components
 *
 * This script adds .mac-card and .mac-input classes to components.
 */

const fs = require("fs");
const path = require("path");
const glob = require("glob");

function addMacCardClasses(content) {
  let modified = content;
  let changeCount = 0;

  // Pattern for Card components
  const cardPatterns = [
    // <Card className="existing">
    {
      pattern: /<Card\s+([^>]*?)className="([^"]+)"/g,
      handler: (match, before, className) => {
        if (className.includes("mac-card")) return match;

        const newClassName = `mac-card ${className}`.trim();
        changeCount++;
        return `<Card ${before}className="${newClassName}"`;
      },
    },
    // <Card> with no className
    {
      pattern: /<Card(?![^>]*className)([^>]*)>/g,
      handler: (match, props) => {
        changeCount++;
        return `<Card${props} className="mac-card">`;
      },
    },
    // <CardHeader className="existing">
    {
      pattern: /<CardHeader\s+([^>]*?)className="([^"]+)"/g,
      handler: (match, before, className) => {
        if (className.includes("mac-card")) return match;

        const newClassName = `mac-card ${className}`.trim();
        changeCount++;
        return `<CardHeader ${before}className="${newClassName}"`;
      },
    },
  ];

  cardPatterns.forEach(({ pattern, handler }) => {
    modified = modified.replace(pattern, handler);
  });

  return { modified, changeCount };
}

function addMacInputClasses(content) {
  let modified = content;
  let changeCount = 0;

  // Pattern for Input components
  const inputPatterns = [
    // <Input className="existing">
    {
      pattern: /<Input\s+([^>]*?)className="([^"]+)"/g,
      handler: (match, before, className) => {
        if (className.includes("mac-input")) return match;

        const newClassName = `mac-input ${className}`.trim();
        changeCount++;
        return `<Input ${before}className="${newClassName}"`;
      },
    },
    // <Input> with no className
    {
      pattern: /<Input(?![^>]*className)([^>]*)\/>/g,
      handler: (match, props) => {
        changeCount++;
        return `<Input${props} className="mac-input" />`;
      },
    },
    // <Textarea className="existing">
    {
      pattern: /<Textarea\s+([^>]*?)className="([^"]+)"/g,
      handler: (match, before, className) => {
        if (className.includes("mac-input")) return match;

        const newClassName = `mac-input ${className}`.trim();
        changeCount++;
        return `<Textarea ${before}className="${newClassName}"`;
      },
    },
  ];

  inputPatterns.forEach(({ pattern, handler }) => {
    modified = modified.replace(pattern, handler);
  });

  return { modified, changeCount };
}

function processFile(filePath, dryRun = false) {
  const content = fs.readFileSync(filePath, "utf8");

  let totalChanges = 0;
  let result = content;

  // Add Card classes
  const cardResult = addMacCardClasses(result);
  result = cardResult.modified;
  totalChanges += cardResult.changeCount;

  // Add Input classes
  const inputResult = addMacInputClasses(result);
  result = inputResult.modified;
  totalChanges += inputResult.changeCount;

  if (totalChanges > 0) {
    const cardChanges = cardResult.changeCount;
    const inputChanges = inputResult.changeCount;
    const changes = [];
    if (cardChanges > 0) changes.push(`${cardChanges} card(s)`);
    if (inputChanges > 0) changes.push(`${inputChanges} input(s)`);

    console.log(`  ${filePath}: ${changes.join(", ")} updated`);

    if (!dryRun) {
      fs.writeFileSync(filePath, result, "utf8");
    }
  }

  return totalChanges;
}

function main() {
  const dryRun = process.argv.includes("--dry-run");

  console.log(
    dryRun ? "🔍 DRY RUN - Analyzing files...\n" : "🔧 Adding MAC component classes...\n"
  );

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
