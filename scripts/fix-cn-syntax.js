#!/usr/bin/env node

/**
 * Fix cn() Syntax Errors
 *
 * Fixes the pattern where MAC classes were incorrectly placed outside cn():
 *
 * BEFORE: className={cn(...), "mac-button"}
 * AFTER:  className={cn("mac-button", ...)}
 */

const fs = require("fs");
const { execSync } = require("child_process");

// Find all TSX files with the problematic pattern
const findCommand = 'find src app -name "*.tsx" -type f 2>/dev/null || true';
const filesOutput = execSync(findCommand, { encoding: "utf8" });
const files = filesOutput
  .trim()
  .split("\n")
  .filter((f) => f && !f.includes("node_modules") && !f.includes(".next"));

let filesFixed = 0;

console.log("🔧 Fixing cn() syntax errors...\n");

files.forEach((filePath) => {
  let content = fs.readFileSync(filePath, "utf8");
  let modified = false;

  // Pattern 1: className={cn(...), "mac-button mac-button-primary")}
  // Fix: Move MAC class inside cn() as first argument
  const pattern1 = /className=\{cn\(([^)]+)\), "([^"]+)"\)}/g;

  if (pattern1.test(content)) {
    content = content.replace(
      /className=\{cn\(([^)]+)\), "([^"]+)"\)}/g,
      (match, cnArgs, macClass) => {
        modified = true;
        return `className={cn("${macClass}", ${cnArgs})}`;
      }
    );
  }

  // Pattern 2: className={cn(...), "mac-input")}
  const pattern2 = /className=\{cn\(([^)]+)\), "mac-input"\)}/g;

  if (pattern2.test(content)) {
    content = content.replace(/className=\{cn\(([^)]+)\), "mac-input"\)}/g, (match, cnArgs) => {
      modified = true;
      return `className={cn("mac-input", ${cnArgs})}`;
    });
  }

  if (modified) {
    fs.writeFileSync(filePath, content, "utf8");
    filesFixed++;
    console.log(`✅ Fixed: ${filePath}`);
  }
});

console.log(`\n📊 Summary: ${filesFixed} files fixed`);
console.log("\n✨ Running prettier to format...");

execSync('npx prettier --write "src/**/*.tsx" "app/**/*.tsx"', { stdio: "inherit" });

console.log("\n✅ All syntax errors fixed!");
