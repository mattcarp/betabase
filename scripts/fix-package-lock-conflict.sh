#!/bin/bash

# fix-package-lock-conflict.sh
# Quick helper script to fix package-lock.json conflicts
#
# Usage:
#   ./scripts/fix-package-lock-conflict.sh

set -e

echo "🔧 Fixing package-lock.json conflict..."
echo ""

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
  echo "❌ Error: Not in a git repository!"
  exit 1
fi

# Check if there's a merge conflict
if ! git diff --name-only --diff-filter=U | grep -q "package-lock.json"; then
  echo "✅ No package-lock.json conflict detected!"
  exit 0
fi

echo "📦 Found package-lock.json conflict. Fixing..."
echo ""

# Remove the conflicted package-lock.json
rm -f package-lock.json

# Regenerate from package.json
echo "🔄 Regenerating package-lock.json from package.json..."
npm install --package-lock-only --no-audit --no-fund 2>&1 | tail -5

# Add the regenerated file
git add package-lock.json

echo ""
echo "✅ package-lock.json conflict resolved!"
echo ""
echo "Next steps:"
echo "  1. Review the changes: git diff --cached package-lock.json"
echo "  2. Continue your merge: git merge --continue"
echo "     (or commit if not in a merge)"
echo ""
