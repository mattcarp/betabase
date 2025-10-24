#!/usr/bin/env node

/**
 * Add MAC Classes to Card Components
 *
 * Adds mac-card or mac-card-elevated classes to Card/CardHeader/CardContent
 * components that are missing them.
 */

const fs = require("fs");
const { execSync } = require("child_process");

let filesModified = 0;
let componentsUpdated = 0;

/**
 * Add MAC classes to Card components
 */
function addMACClassToCard(content) {
  let modified = false;
  let newContent = content;

  // Pattern: <Card ... > without mac-card class
  const cardPattern = /<Card\s+([^>]*?)>/g;

  newContent = content.replace(cardPattern, (match, props) => {
    // Skip if already has mac-card class
    if (props.includes("mac-card")) {
      return match;
    }

    modified = true;
    componentsUpdated++;

    const macClass = "mac-card";

    // Add or append to className
    if (props.includes("className=")) {
      // Use cn() if available, otherwise simple string concatenation
      if (props.includes("className={cn(")) {
        const newProps = props.replace(/className=\{cn\(/, `className={cn("${macClass}", `);
        return `<Card ${newProps}>`;
      } else if (props.includes('className="')) {
        const newProps = props.replace(/className="([^"]*)"/, (m, existingClasses) => {
          return `className="${macClass} ${existingClasses}"`;
        });
        return `<Card ${newProps}>`;
      } else if (props.includes("className={")) {
        // Dynamic className
        const newProps = props.replace(/className=\{([^}]*)\}/, (m, existingClasses) => {
          return `className={cn("${macClass}", ${existingClasses})}`;
        });
        return `<Card ${newProps}>`;
      }
    } else {
      // Add new className prop
      return `<Card className="${macClass}" ${props}>`;
    }

    return match;
  });

  return { content: newContent, modified };
}

/**
 * Process a single file
 */
async function processFile(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  let newContent = content;
  let fileModified = false;

  // Only process files that use Card component
  if (!content.includes("<Card")) {
    return;
  }

  // Make sure cn utility is imported if we'll be using it
  const needsCn = content.includes("className={") && !content.includes("import { cn }");
  if (needsCn && content.includes('from "react"')) {
    newContent = newContent.replace(
      'from "react";',
      'from "react";\nimport { cn } from "../../lib/utils";'
    );
    fileModified = true;
  }

  // Add MAC classes to Cards
  const cardResult = addMACClassToCard(newContent);
  newContent = cardResult.content;
  fileModified = fileModified || cardResult.modified;

  if (fileModified) {
    fs.writeFileSync(filePath, newContent, "utf8");
    filesModified++;
    console.log(`✅ Modified: ${filePath}`);
  }
}

/**
 * Main execution
 */
async function main() {
  console.log("🎨 Adding MAC classes to Card components...\n");

  // Find all TSX files using Card component
  const findCommand =
    'find src app -name "*.tsx" -type f -exec grep -l "<Card" {} \\; 2>/dev/null || true';
  const filesOutput = execSync(findCommand, { encoding: "utf8" });
  const files = filesOutput
    .trim()
    .split("\n")
    .filter((f) => f && !f.includes("node_modules") && !f.includes(".next"));

  console.log(`Found ${files.length} files with Card components...\n`);

  // Process each file
  for (const file of files) {
    await processFile(file);
  }

  // Summary
  console.log("\n📊 Summary:");
  console.log(`   Files modified: ${filesModified}`);
  console.log(`   Card components updated: ${componentsUpdated}`);

  console.log("\n✅ MAC classes added to Card components!");
}

main().catch(console.error);
