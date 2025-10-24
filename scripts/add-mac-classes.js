#!/usr/bin/env node

/**
 * Automated MAC Class Addition Script
 *
 * Adds MAC design system classes to Button and Input components
 * that are missing them.
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Configuration
const DRY_RUN = process.argv.includes("--dry-run");
const VERBOSE = process.argv.includes("--verbose");

let filesModified = 0;
let componentsUpdated = 0;

/**
 * Add MAC classes to a Button component
 * Determines the appropriate MAC class based on the variant prop
 */
function addMACClassToButton(content) {
  let modified = false;
  let newContent = content;

  // Pattern: <Button ... > without mac-button class
  const buttonPattern = /<Button\s+([^>]*?)>/g;

  newContent = content.replace(buttonPattern, (match, props) => {
    // Skip if already has mac-button class
    if (props.includes("mac-button")) {
      return match;
    }

    modified = true;
    componentsUpdated++;

    // Determine MAC class based on variant
    let macClass = "mac-button";

    if (
      props.includes('variant="default"') ||
      props.includes('variant={"default"}') ||
      !props.includes("variant=")
    ) {
      macClass += " mac-button-primary";
    } else if (props.includes('variant="outline"') || props.includes('variant={"outline"}')) {
      macClass += " mac-button-outline";
    } else if (props.includes('variant="secondary"') || props.includes('variant={"secondary"}')) {
      macClass += " mac-button-secondary";
    } else if (props.includes('variant="ghost"') || props.includes('variant={"ghost"}')) {
      macClass += " mac-button-outline"; // Ghost uses outline styling
    } else {
      macClass += " mac-button-primary"; // Default to primary
    }

    // Add or append to className
    if (props.includes("className=")) {
      // Append to existing className
      const newProps = props
        .replace(/className=["'`]([^"'`]*)["'`]/, (m, existingClasses) => {
          return `className="${existingClasses} ${macClass}"`;
        })
        .replace(/className=\{([^}]*)\}/, (m, existingClasses) => {
          // Handle template strings and dynamic classNames
          if (existingClasses.includes("cn(")) {
            return `className={cn(${existingClasses.replace("cn(", "")}, "${macClass}")}`;
          }
          return `className="${macClass} " + ${existingClasses}`;
        });
      return `<Button ${newProps}>`;
    } else {
      // Add new className prop
      return `<Button className="${macClass}" ${props}>`;
    }
  });

  return { content: newContent, modified };
}

/**
 * Add MAC classes to an Input component
 */
function addMACClassToInput(content) {
  let modified = false;
  let newContent = content;

  // Pattern: <Input ... > or <Input .../> without mac-input class
  const inputPattern = /<Input\s+([^>]*?)(\/?>)/g;

  newContent = content.replace(inputPattern, (match, props, closing) => {
    // Skip if already has mac-input class
    if (props.includes("mac-input")) {
      return match;
    }

    modified = true;
    componentsUpdated++;

    const macClass = "mac-input";

    // Add or append to className
    if (props.includes("className=")) {
      // Append to existing className
      const newProps = props
        .replace(/className=["'`]([^"'`]*)["'`]/, (m, existingClasses) => {
          return `className="${existingClasses} ${macClass}"`;
        })
        .replace(/className=\{([^}]*)\}/, (m, existingClasses) => {
          // Handle template strings and dynamic classNames
          if (existingClasses.includes("cn(")) {
            return `className={cn(${existingClasses.replace("cn(", "")}, "${macClass}")}`;
          }
          return `className="${macClass} " + ${existingClasses}`;
        });
      return `<Input ${newProps}${closing}`;
    } else {
      // Add new className prop
      return `<Input className="${macClass}" ${props}${closing}`;
    }
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

  // Add MAC classes to Buttons
  const buttonResult = addMACClassToButton(newContent);
  newContent = buttonResult.content;
  fileModified = fileModified || buttonResult.modified;

  // Add MAC classes to Inputs
  const inputResult = addMACClassToInput(newContent);
  newContent = inputResult.content;
  fileModified = fileModified || inputResult.modified;

  if (fileModified) {
    if (!DRY_RUN) {
      fs.writeFileSync(filePath, newContent, "utf8");
    }
    filesModified++;

    if (VERBOSE || DRY_RUN) {
      console.log(`${DRY_RUN ? "[DRY RUN] " : ""}Modified: ${filePath}`);
    }
  }
}

/**
 * Main execution
 */
async function main() {
  console.log("🔍 Scanning for components without MAC classes...\n");

  if (DRY_RUN) {
    console.log("⚠️  DRY RUN MODE - No files will be modified\n");
  }

  // Find all TSX files in src and app directories using find command
  const findCommand = 'find src app -name "*.tsx" -type f 2>/dev/null || true';
  const filesOutput = execSync(findCommand, { encoding: "utf8" });
  const files = filesOutput
    .trim()
    .split("\n")
    .filter((f) => f && !f.includes("node_modules") && !f.includes(".next"));

  console.log(`Found ${files.length} TSX files to process...\n`);

  // Process each file
  for (const file of files) {
    await processFile(file);
  }

  // Summary
  console.log("\n📊 Summary:");
  console.log(`   Files modified: ${filesModified}`);
  console.log(`   Components updated: ${componentsUpdated}`);

  if (DRY_RUN) {
    console.log("\n💡 Run without --dry-run to apply changes");
  } else {
    console.log("\n✅ MAC classes added successfully!");
    console.log('   Run "npm run lint:fix-all" to format the changes');
  }
}

main().catch(console.error);
