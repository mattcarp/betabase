#!/bin/bash

# Git workflow for production tests only
# This script helps commit only production-ready tests

echo "🎭 Preparing production tests for commit..."
echo "========================================="

# Add only production test files
echo "Adding production tests..."
git add tests/production/*.spec.ts
git add tests/auth/*mailinator*.spec.ts
git add tests/auth/*magic-link*.spec.ts

# Add test configurations
echo "Adding test configurations..."
git add playwright.config.ts
git add playwright.config.render.ts

# Add documentation
echo "Adding documentation..."
git add tests/README.md
git add .clinerules/testing.md

# Explicitly exclude local-only tests
echo "Excluding local-only tests..."
git reset tests/local/
git reset tests/*local*.spec.ts
git reset playwright.config.local.ts

# Show what will be committed
echo ""
echo "Files staged for commit:"
echo "------------------------"
git status --short | grep "^A\|^M"

echo ""
echo "Files explicitly excluded:"
echo "--------------------------"
git status --short | grep "tests/" | grep -v "^A\|^M"

echo ""
echo "Ready to commit! Use:"
echo "  git commit -m 'test: production tests with Mailinator authentication'"
echo ""
echo "Or to see the diff first:"
echo "  git diff --staged"
