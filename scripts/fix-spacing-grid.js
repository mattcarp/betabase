#!/usr/bin/env node

/**
 * Fix Spacing Grid Violations
 *
 * Converts non-8px spacing values to 8px grid (Tailwind 2, 4, 6, 8...)
 *
 * Conversions:
 * - 1 (4px) → 2 (8px)
 * - 3 (12px) → 4 (16px)
 * - 5 (20px) → 6 (24px)
 * - 7 (28px) → 8 (32px)
 */

const fs = require("fs");
const { execSync } = require("child_process");

const DRY_RUN = process.argv.includes("--dry-run");
const VERBOSE = process.argv.includes("--verbose");

let filesModified = 0;
let violationsFixed = 0;

// Mapping of violations to fixes
const SPACING_FIXES = {
  // gap violations
  "gap-1": "gap-2",
  "gap-3": "gap-4",
  "gap-5": "gap-6",
  "gap-7": "gap-8",

  // padding violations
  "p-1": "p-2",
  "p-3": "p-4",
  "p-5": "p-6",
  "p-7": "p-8",

  "px-1": "px-2",
  "px-3": "px-4",
  "px-5": "px-6",
  "px-7": "px-8",

  "py-1": "py-2",
  "py-3": "py-4",
  "py-5": "py-6",
  "py-7": "py-8",

  "pt-1": "pt-2",
  "pt-3": "pt-4",
  "pt-5": "pt-6",
  "pt-7": "pt-8",

  "pb-1": "pb-2",
  "pb-3": "pb-4",
  "pb-5": "pb-6",
  "pb-7": "pb-8",

  "pl-1": "pl-2",
  "pl-3": "pl-4",
  "pl-5": "pl-6",
  "pl-7": "pl-8",

  "pr-1": "pr-2",
  "pr-3": "pr-4",
  "pr-5": "pr-6",
  "pr-7": "pr-8",

  // margin violations
  "m-1": "m-2",
  "m-3": "m-4",
  "m-5": "m-6",
  "m-7": "m-8",

  "mx-1": "mx-2",
  "mx-3": "mx-4",
  "mx-5": "mx-6",
  "mx-7": "mx-8",

  "my-1": "my-2",
  "my-3": "my-4",
  "my-5": "my-6",
  "my-7": "my-8",

  "mt-1": "mt-2",
  "mt-3": "mt-4",
  "mt-5": "mt-6",
  "mt-7": "mt-8",

  "mb-1": "mb-2",
  "mb-3": "mb-4",
  "mb-5": "mb-6",
  "mb-7": "mb-8",

  "ml-1": "ml-2",
  "ml-3": "ml-4",
  "ml-5": "ml-6",
  "ml-7": "ml-8",

  "mr-1": "mr-2",
  "mr-3": "mr-4",
  "mr-5": "mr-6",
  "mr-7": "mr-8",
};

function fixSpacingInFile(filePath) {
  let content = fs.readFileSync(filePath, "utf8");
  let originalContent = content;
  let fileViolations = 0;

  // Replace each violation
  for (const [violation, fix] of Object.entries(SPACING_FIXES)) {
    // Use word boundary to match complete class names
    const regex = new RegExp(`\\b${violation}\\b`, "g");
    const matches = content.match(regex);

    if (matches) {
      content = content.replace(regex, fix);
      fileViolations += matches.length;
    }
  }

  if (fileViolations > 0) {
    if (!DRY_RUN) {
      fs.writeFileSync(filePath, content, "utf8");
    }
    filesModified++;
    violationsFixed += fileViolations;

    if (VERBOSE || DRY_RUN) {
      console.log(
        `${DRY_RUN ? "[DRY RUN] " : ""}Fixed ${fileViolations} violations in: ${filePath}`
      );
    }
  }
}

async function main() {
  console.log("🔧 Fixing spacing grid violations (8px grid)...\n");

  if (DRY_RUN) {
    console.log("⚠️  DRY RUN MODE - No files will be modified\n");
  }

  // Find all TSX and CSS files
  const findCommand =
    'find src app -type f \\( -name "*.tsx" -o -name "*.css" \\) 2>/dev/null || true';
  const filesOutput = execSync(findCommand, { encoding: "utf8" });
  const files = filesOutput
    .trim()
    .split("\n")
    .filter((f) => f && !f.includes("node_modules") && !f.includes(".next"));

  console.log(`Found ${files.length} files to check...\n`);

  for (const file of files) {
    fixSpacingInFile(file);
  }

  console.log("\n📊 Summary:");
  console.log(`   Files modified: ${filesModified}`);
  console.log(`   Violations fixed: ${violationsFixed}`);

  if (DRY_RUN) {
    console.log("\n💡 Run without --dry-run to apply changes");
  } else {
    console.log("\n✅ Spacing grid violations fixed!");
    console.log("   Run visual tests to verify layouts are not broken");
  }
}

main().catch(console.error);
