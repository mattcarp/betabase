#!/bin/bash

# Fix className typo across all TypeScript/TSX files
# This script replaces "cclassName" with "className" everywhere

echo "🔧 Fixing cclassName typo in all source files..."

# Count occurrences before
echo "📊 Counting occurrences before fix..."
BEFORE=$(grep -r "cclassName" src --include="*.tsx" --include="*.ts" | wc -l | tr -d ' ')
echo "Found $BEFORE occurrences of 'cclassName'"

# Fix the typo using sed
# macOS requires '' after -i for in-place editing
find src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' 's/cclassName/className/g' {} +

# Count occurrences after
echo "📊 Counting occurrences after fix..."
AFTER=$(grep -r "cclassName" src --include="*.tsx" --include="*.ts" | wc -l | tr -d ' ')
echo "Remaining occurrences: $AFTER"

echo "✅ Fixed $((BEFORE - AFTER)) occurrences!"
echo "🎯 Done! Please rebuild and test the application."
