#!/usr/bin/env node

/**
 * Safely add aria-labels to icon-only buttons
 *
 * Conservative approach: Only handle clear icon-only cases
 */

const fs = require("fs");
const glob = require("glob");

const ICON_LABELS = {
  ChevronRight: "Submit",
  ChevronLeft: "Go back",
  X: "Close",
  XCircle: "Close",
  Plus: "Add",
  Edit: "Edit",
  Pencil: "Edit",
  Trash: "Delete",
  Trash2: "Delete",
  Check: "Confirm",
  Save: "Save",
  Download: "Download",
  Upload: "Upload",
  Search: "Search",
  Settings: "Settings",
  Menu: "Menu",
  MoreVertical: "More options",
  MoreHorizontal: "More options",
  Copy: "Copy",
  ExternalLink: "Open in new tab",
  Eye: "View",
  EyeOff: "Hide",
  Lock: "Lock",
  Unlock: "Unlock",
  Send: "Send",
  Mail: "Send email",
  Bell: "Notifications",
  User: "User profile",
  Home: "Home",
  ArrowLeft: "Go back",
  ArrowRight: "Go forward",
  RefreshCw: "Refresh",
  Loader2: "Loading",
  Play: "Play",
  Pause: "Pause",
  Mic: "Microphone",
  MicOff: "Mute microphone",
  Info: "Information",
  HelpCircle: "Help",
  Zap: "Quick",
  FileText: "View file",
};

function processFile(filePath, dryRun) {
  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split("\n");
  let changeCount = 0;

  // Pattern: <Button...><IconName .../></Button> on single or few lines
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip if already has aria-label
    if (line.includes("aria-label")) continue;

    // Look for Button with single icon
    if (line.includes("<Button")) {
      // Check next few lines for icon-only pattern
      let block = "";
      for (let j = i; j < Math.min(i + 5, lines.length); j++) {
        block += lines[j];
        if (block.includes("</Button>") || block.includes("/>")) break;
      }

      // Find icon name
      const iconMatch = block.match(/<(\w+)\s+[^>]*className="[^"]*"[^>]*\/>/);
      if (!iconMatch) continue;

      const iconName = iconMatch[1];
      if (!ICON_LABELS[iconName]) continue;

      // Check it's icon-only (no text content between tags)
      const contentBetweenTags = block.match(/>([^<]*)</);
      if (contentBetweenTags && contentBetweenTags[1].trim().length > 2) continue;

      // Add aria-label to Button tag
      const ariaLabel = ICON_LABELS[iconName];

      if (line.includes(">")) {
        // Single line: <Button ...>
        lines[i] = line.replace(/(<Button[^>]*?)(>)/, `$1 aria-label="${ariaLabel}"$2`);
      } else {
        // Multi-line, add aria-label after Button tag
        lines[i] = line + `\n          aria-label="${ariaLabel}"`;
      }

      changeCount++;
    }
  }

  if (changeCount > 0) {
    console.log(`  ${filePath}: ${changeCount} aria-labels added`);

    if (!dryRun) {
      fs.writeFileSync(filePath, lines.join("\n"), "utf8");
    }
  }

  return changeCount;
}

function main() {
  const dryRun = process.argv.includes("--dry-run");

  console.log(dryRun ? "🔍 DRY RUN\n" : "🏷️  Adding aria-labels (icon-only buttons)\n");

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
  console.log(`   Files: ${filesModified}/${files.length}`);
  console.log(`   Aria-labels added: ${totalChanges}`);

  if (dryRun) {
    console.log("\n💡 Run without --dry-run to apply");
  }
}

main();
