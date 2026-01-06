#!/usr/bin/env node

/**
 * Fix MAC Typography Violations
 * Replaces illegal font weights with permissible ones (100-400).
 */

const fs = require("fs");
const path = require("path");

const REPLACEMENTS = [
  { pattern: /\bfont-medium\b/g, replacement: "font-normal" },    // 500 -> 400
  { pattern: /\bfont-semibold\b/g, replacement: "font-normal" },  // 600 -> 400
  { pattern: /\bfont-bold\b/g, replacement: "font-normal" },      // 700 -> 400
  { pattern: /\bfont-extrabold\b/g, replacement: "font-normal" }, // 800 -> 400
  { pattern: /\bfont-black\b/g, replacement: "font-normal" },     // 900 -> 400
];

const SKIP_PATHS = ["node_modules", ".next", "build", "dist", ".git", "public"];

class TypographyFixer {
  constructor(dryRun = false) {
    this.dryRun = dryRun;
    this.filesChanged = [];
    this.totalChanges = 0;
  }

  shouldProcess(filePath) {
    if (!/\.(tsx|jsx|ts|js)$/.test(filePath)) return false;
    return !SKIP_PATHS.some((skipPath) => filePath.includes(skipPath));
  }

  processFile(filePath) {
    if (!this.shouldProcess(filePath)) return;

    const content = fs.readFileSync(filePath, "utf8");
    let newContent = content;
    let changeCount = 0;

    REPLACEMENTS.forEach(({ pattern, replacement }) => {
      const originalContent = newContent;
      newContent = newContent.replace(pattern, (match) => {
        if (match !== replacement) {
          changeCount++;
          return replacement;
        }
        return match;
      });
    });

    if (changeCount > 0) {
      this.filesChanged.push({
        file: filePath,
        changes: changeCount,
      });
      this.totalChanges += changeCount;

      if (!this.dryRun) {
        fs.writeFileSync(filePath, newContent, "utf8");
      }
    }
  }

  processDirectory(dir) {
    const files = fs.readdirSync(dir);

    files.forEach((file) => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        if (!SKIP_PATHS.some((skipPath) => filePath.includes(skipPath))) {
          this.processDirectory(filePath);
        }
      } else {
        this.processFile(filePath);
      }
    });
  }

  run(rootDir) {
    console.log(`\nTypo Fixer`);
    console.log(`Mode: ${this.dryRun ? "DRY RUN" : "LIVE"}\n`);

    this.processDirectory(rootDir);

    console.log(`\nSummary:`);
    console.log(`Files modified: ${this.filesChanged.length}`);
    console.log(`Total changes: ${this.totalChanges}`);

    if (this.filesChanged.length > 0) {
        // console.log("Modified files:", this.filesChanged.map(f => f.file).join("\n"));
    }
  }
}

const rootDir = path.join(__dirname, "..");
const fixer = new TypographyFixer(false);
fixer.run(path.join(rootDir, "src"));
