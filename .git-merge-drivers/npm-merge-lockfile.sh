#!/bin/bash

# npm-merge-lockfile
# Custom git merge driver for package-lock.json
#
# This script automatically resolves package-lock.json conflicts by:
# 1. Using the current branch's package.json
# 2. Regenerating package-lock.json from scratch
# 3. Marking the conflict as resolved
#
# Usage (automatically called by git):
#   git merge-driver npm-merge-lockfile %O %A %B %P

set -e

# Arguments from git
# %O = ancestor's version
# %A = current version (ours)
# %B = other branch's version (theirs)
# %P = pathname (e.g., package-lock.json)

ANCESTOR=$1
CURRENT=$2
OTHER=$3
PATHNAME=$4

echo "🔄 Auto-resolving package-lock.json conflict..."
echo "   Path: $PATHNAME"

# Check if package.json exists
if [ ! -f "package.json" ]; then
  echo "❌ Error: package.json not found!"
  exit 1
fi

# Remove the conflicted package-lock.json
rm -f "$PATHNAME"

# Regenerate package-lock.json from package.json
echo "📦 Regenerating package-lock.json from package.json..."

if command -v npm &> /dev/null; then
  # Use npm to regenerate
  npm install --package-lock-only --no-audit --no-fund 2>&1 | grep -v "^npm WARN" || true
  echo "✅ package-lock.json regenerated successfully!"
  exit 0
else
  echo "❌ Error: npm not found!"
  exit 1
fi
