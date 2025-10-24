#!/bin/bash
# Lint a specific file or directory
# Usage: ./scripts/lint-file.sh <path>
# Example: ./scripts/lint-file.sh src/components/MyComponent.tsx

set -e

if [ -z "$1" ]; then
    echo "Usage: ./scripts/lint-file.sh <file-or-directory>"
    echo "Example: ./scripts/lint-file.sh src/components/MyComponent.tsx"
    exit 1
fi

TARGET="$1"

echo "🔍 Checking $TARGET..."
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "❌ node_modules not found. Run 'npm install' first."
    exit 1
fi

FAILED=0

# Run Prettier on the file/directory
echo "📝 Checking Prettier formatting..."
if npx prettier --check "$TARGET" 2>&1 | grep -q "Code style issues"; then
    echo "❌ Prettier issues found"
    echo "   Fix with: npx prettier --write $TARGET"
    FAILED=1
else
    echo "✅ Prettier formatting looks good"
fi
echo ""

# Run ESLint on the file/directory
echo "🔧 Running ESLint..."
if npx eslint "$TARGET" --max-warnings=0 2>&1 | grep -qE "error|warning"; then
    echo "❌ ESLint issues found"
    echo "   Fix with: npx eslint --fix $TARGET"
    FAILED=1
else
    echo "✅ ESLint checks passed"
fi
echo ""

# Summary
if [ $FAILED -eq 1 ]; then
    echo "❌ Issues found in $TARGET"
    echo "   Auto-fix: npx eslint --fix $TARGET && npx prettier --write $TARGET"
    exit 1
else
    echo "✅ $TARGET looks good!"
    exit 0
fi
