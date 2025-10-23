#!/bin/bash
# Quick lint check script for Claude Code workflow
# Run this after writing code to catch errors before committing

set -e

echo "🔍 Running quick lint checks..."
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "❌ node_modules not found. Run 'npm install' first."
    exit 1
fi

# Track if any checks failed
FAILED=0

# 1. Check Prettier formatting
echo "📝 Checking Prettier formatting..."
if npm run format:check --silent 2>&1 | grep -q "Code style issues"; then
    echo "❌ Prettier formatting issues found"
    echo "   Run: npm run format"
    FAILED=1
else
    echo "✅ Prettier formatting looks good"
fi
echo ""

# 2. Run ESLint
echo "🔧 Running ESLint..."
if npm run lint --silent 2>&1 | grep -qE "error|warning"; then
    echo "❌ ESLint issues found"
    echo "   Run: npm run lint:fix"
    FAILED=1
else
    echo "✅ ESLint checks passed"
fi
echo ""

# 3. TypeScript type checking (optional, can be slow)
if [ "$1" == "--with-types" ]; then
    echo "📘 Running TypeScript type check..."
    if npm run type-check --silent 2>&1 | grep -q "error"; then
        echo "❌ TypeScript errors found"
        FAILED=1
    else
        echo "✅ TypeScript types are valid"
    fi
    echo ""
fi

# Summary
if [ $FAILED -eq 1 ]; then
    echo "❌ Some checks failed. Fix the issues or run:"
    echo "   npm run lint:fix-all"
    exit 1
else
    echo "✅ All checks passed! Ready to commit."
    exit 0
fi
