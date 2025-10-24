#!/usr/bin/env node

/**
 * Add MAC Typography Classes
 * Adds .mac-heading, .mac-title, and .mac-body classes to elements
 */

const fs = require("fs");
const path = require("path");

// Patterns to add MAC typography classes
const TYPOGRAPHY_PATTERNS = [
  // h1, h2 should use .mac-heading
  {
    // Match h1 and h2 tags that don't already have mac-heading
    pattern: /<(h1|h2)(\s+[^>]*?)className="([^"]*?)"/g,
    replacement: (match, tag, attrs, className) => {
      if (className.includes("mac-heading")) return match;
      const newClassName = `mac-heading ${className}`.trim();
      return `<${tag}${attrs}className="${newClassName}"`;
    },
    description: "Add mac-heading to h1/h2 tags",
  },
  {
    // Match h1 and h2 without className at all
    pattern: /<(h1|h2)(\s+[^>]*?)(?!className)/g,
    replacement: (match, tag, attrs) => {
      if (match.includes("className")) return match;
      return `<${tag}${attrs} className="mac-heading"`;
    },
    description: "Add mac-heading className to h1/h2 without className",
  },

  // h3, h4 should use .mac-title
  {
    pattern: /<(h3|h4)(\s+[^>]*?)className="([^"]*?)"/g,
    replacement: (match, tag, attrs, className) => {
      if (className.includes("mac-title")) return match;
      const newClassName = `mac-title ${className}`.trim();
      return `<${tag}${attrs}className="${newClassName}"`;
    },
    description: "Add mac-title to h3/h4 tags",
  },
  {
    pattern: /<(h3|h4)(\s+[^>]*?)(?!className)/g,
    replacement: (match, tag, attrs) => {
      if (match.includes("className")) return match;
      return `<${tag}${attrs} className="mac-title"`;
    },
    description: "Add mac-title className to h3/h4 without className",
  },

  // p tags with significant text should use .mac-body
  {
    pattern: /<p(\s+[^>]*?)className="([^"]*?)"/g,
    replacement: (match, attrs, className) => {
      if (className.includes("mac-body")) return match;
      // Don't add to paragraphs that already have specific font/text classes
      if (className.match(/text-(xs|sm|base|lg|xl)/)) return match;
      const newClassName = `mac-body ${className}`.trim();
      return `<p${attrs}className="${newClassName}"`;
    },
    description: "Add mac-body to p tags",
  },
];

const SKIP_PATHS = ["node_modules", ".next", "build", "dist", ".git", "public"];

class MACTypographyAdder {
  constructor(dryRun = false) {
    this.dryRun = dryRun;
    this.filesChanged = [];
    this.totalChanges = 0;
  }

  shouldProcess(filePath) {
    if (!/\.(tsx|jsx)$/.test(filePath)) return false;
    return !SKIP_PATHS.some((skipPath) => filePath.includes(skipPath));
  }

  processFile(filePath) {
    if (!this.shouldProcess(filePath)) return;

    const content = fs.readFileSync(filePath, "utf8");
    let newContent = content;
    let changeCount = 0;

    TYPOGRAPHY_PATTERNS.forEach(({ pattern, replacement, description }) => {
      const originalContent = newContent;
      newContent = newContent.replace(pattern, (...args) => {
        const result = typeof replacement === "function" ? replacement(...args) : replacement;
        if (result !== args[0]) {
          changeCount++;
        }
        return result;
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
    console.log(`\n🎨 MAC Typography Class Adder`);
    console.log(`Mode: ${this.dryRun ? "DRY RUN" : "LIVE"}\n`);

    this.processDirectory(rootDir);

    console.log(`\n📊 Summary:`);
    console.log(`Files modified: ${this.filesChanged.length}`);
    console.log(`Total changes: ${this.totalChanges}`);

    if (this.filesChanged.length > 0) {
      console.log(`\n📝 Modified files:`);
      this.filesChanged.slice(0, 20).forEach(({ file, changes }) => {
        console.log(`  ${file.replace(rootDir + "/", "")}: ${changes} change(s)`);
      });

      if (this.filesChanged.length > 20) {
        console.log(`  ... and ${this.filesChanged.length - 20} more files`);
      }
    }

    if (this.dryRun) {
      console.log(`\n✅ Dry run complete. Run without --dry-run to apply changes.`);
    } else {
      console.log(`\n✅ Changes applied successfully!`);
    }

    return this.totalChanges;
  }
}

// Main execution
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const rootDir = path.join(__dirname, "..");

const adder = new MACTypographyAdder(dryRun);
const changeCount = adder.run(path.join(rootDir, "src"));

process.exit(changeCount > 0 ? 0 : 0);
