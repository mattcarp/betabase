#!/usr/bin/env node

/**
 * Add aria-labels to Button components for WCAG accessibility compliance
 *
 * Priority 1: Icon-only buttons (MUST have aria-labels)
 * Priority 2: Buttons with unclear text
 * Priority 3: All other buttons
 */

const fs = require("fs");
const path = require("path");
const glob = require("glob");

// Common icon to action mappings
const ICON_TO_ARIA_LABEL = {
  ChevronRight: "Submit",
  ChevronLeft: "Go back",
  ChevronDown: "Expand",
  ChevronUp: "Collapse",
  X: "Close",
  XCircle: "Close",
  Plus: "Add",
  PlusCircle: "Add",
  Minus: "Remove",
  Edit: "Edit",
  Pencil: "Edit",
  Trash: "Delete",
  Trash2: "Delete",
  Check: "Confirm",
  CheckCircle: "Confirm",
  Save: "Save",
  Download: "Download",
  Upload: "Upload",
  Search: "Search",
  Filter: "Filter",
  Settings: "Settings",
  SettingsIcon: "Settings",
  Menu: "Menu",
  MoreVertical: "More options",
  MoreHorizontal: "More options",
  Copy: "Copy",
  ExternalLink: "Open in new tab",
  Eye: "View",
  EyeOff: "Hide",
  Lock: "Lock",
  Unlock: "Unlock",
  Star: "Favorite",
  Heart: "Like",
  Share: "Share",
  Send: "Send",
  Mail: "Send email",
  MessageSquare: "Comment",
  Bell: "Notifications",
  User: "User profile",
  Home: "Go to home",
  ArrowLeft: "Go back",
  ArrowRight: "Go forward",
  RefreshCw: "Refresh",
  RotateCw: "Refresh",
  Loader: "Loading",
  Loader2: "Loading",
  Play: "Play",
  Pause: "Pause",
  Stop: "Stop",
  Volume: "Volume",
  VolumeX: "Mute",
  Mic: "Microphone",
  MicOff: "Mute microphone",
  Camera: "Camera",
  CameraOff: "Turn off camera",
  Info: "Information",
  HelpCircle: "Help",
  AlertCircle: "Alert",
  Zap: "Quick action",
  BookOpen: "Open",
  FileText: "View file",
  Folder: "Open folder",
  Link: "Copy link",
  Maximize: "Maximize",
  Minimize: "Minimize",
  SkipBack: "Skip back",
  SkipForward: "Skip forward",
};

// Extract text content from button (excluding icon components)
function extractButtonText(buttonContent) {
  // Remove icon components
  let text = buttonContent.replace(/<\w+\s+className="[^"]*"\s*\/>/g, "");
  text = text.replace(/<\w+[^>]*>.*?<\/\w+>/g, "");
  // Remove JSX expressions that are just icons
  text = text.replace(/\{.*?<\w+.*?\/>\}/g, "");
  // Extract plain text
  text = text.replace(/[{}]/g, "").trim();
  return text;
}

// Detect if button is icon-only
function isIconOnly(buttonContent) {
  const textContent = extractButtonText(buttonContent);
  return !textContent || textContent.length === 0;
}

// Extract icon name from button content
function extractIconName(buttonContent) {
  const iconMatch = buttonContent.match(/<(\w+)\s+className="[^"]*"\s*\/>/);
  if (iconMatch) {
    return iconMatch[1];
  }
  return null;
}

// Generate aria-label based on context
function generateAriaLabel(buttonContent, context) {
  const iconName = extractIconName(buttonContent);
  const textContent = extractButtonText(buttonContent);

  // If icon-only, use icon mapping
  if (isIconOnly(buttonContent) && iconName && ICON_TO_ARIA_LABEL[iconName]) {
    return ICON_TO_ARIA_LABEL[iconName];
  }

  // If has text, use the text
  if (textContent) {
    return textContent;
  }

  // Check for onClick handler name for context
  const onClickMatch = context.match(/onClick=\{(\w+)\}/);
  if (onClickMatch) {
    const handlerName = onClickMatch[1];
    // Convert camelCase to readable label
    const label = handlerName
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
    return label;
  }

  return null;
}

function addAriaLabels(content, filePath) {
  let modified = content;
  let changeCount = 0;

  const lines = content.split("\n");
  const buttonStarts = [];

  // Find all Button opening tags
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("<Button") && !lines[i].includes("aria-label")) {
      buttonStarts.push(i);
    }
  }

  // Process each button
  buttonStarts.forEach((lineNum) => {
    let buttonBlock = "";
    let depth = 0;
    let endLine = lineNum;

    // Extract full button block
    for (let i = lineNum; i < Math.min(lineNum + 20, lines.length); i++) {
      buttonBlock += lines[i] + "\n";
      depth += (lines[i].match(/<Button/g) || []).length;
      depth -= (lines[i].match(/<\/Button>/g) || []).length;

      if (depth === 0 && lines[i].includes("</Button>")) {
        endLine = i;
        break;
      }
      if (depth === 0 && lines[i].includes("/>")) {
        endLine = i;
        break;
      }
    }

    // Get context (surrounding lines for onClick, etc.)
    const contextStart = Math.max(0, lineNum - 3);
    const contextEnd = Math.min(lines.length, endLine + 3);
    const context = lines.slice(contextStart, contextEnd).join("\n");

    // Generate aria-label
    const ariaLabel = generateAriaLabel(buttonBlock, context);

    if (ariaLabel && !buttonBlock.includes("aria-label")) {
      // Find where to insert aria-label (after <Button)
      const buttonOpenTag = lines[lineNum];
      if (buttonOpenTag.includes("<Button")) {
        const insertPoint =
          buttonOpenTag.indexOf(">") === -1 ? buttonOpenTag.length : buttonOpenTag.indexOf(">");

        let newButtonTag = buttonOpenTag;

        // If single-line button, insert before >
        if (buttonOpenTag.includes(">")) {
          newButtonTag = buttonOpenTag.replace(
            /<Button([^>]*)(\/?)>/,
            `<Button$1 aria-label="${ariaLabel}"$2>`
          );
        } else {
          // Multi-line button, add to first line
          newButtonTag = buttonOpenTag.replace(
            /<Button(.*)/,
            `<Button$1\n            aria-label="${ariaLabel}"`
          );
        }

        if (newButtonTag !== buttonOpenTag) {
          lines[lineNum] = newButtonTag;
          changeCount++;
        }
      }
    }
  });

  return { modified: lines.join("\n"), changeCount };
}

function processFile(filePath, dryRun = false) {
  const content = fs.readFileSync(filePath, "utf8");

  const result = addAriaLabels(content, filePath);

  if (result.changeCount > 0) {
    console.log(`  ${filePath}: ${result.changeCount} aria-labels added`);

    if (!dryRun) {
      fs.writeFileSync(filePath, result.modified, "utf8");
    }
  }

  return result.changeCount;
}

function main() {
  const dryRun = process.argv.includes("--dry-run");

  console.log(
    dryRun ? "🔍 DRY RUN - Analyzing buttons...\n" : "🏷️  Adding aria-labels to buttons...\n"
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
  console.log(`   Total aria-labels added: ${totalChanges}`);

  if (dryRun) {
    console.log("\n💡 Run without --dry-run to apply changes");
  } else {
    console.log("\n✅ Changes applied! Run prettier to format.");
  }
}

main();
