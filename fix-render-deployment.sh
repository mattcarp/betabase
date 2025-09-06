#!/bin/bash

echo "🚀 Fixing Render deployment issues..."

# Remove the conflicting pages directory
if [ -d "pages" ]; then
    echo "📦 Removing conflicting pages directory..."
    rm -rf pages
    echo "✅ Pages directory removed"
fi

# Clean build artifacts
echo "🧹 Cleaning build artifacts..."
rm -rf .next
rm -rf node_modules/.cache

# Ensure correct Node version
echo "📌 Checking Node version..."
cat .nvmrc

# Commit the changes
echo "💾 Committing fixes..."
git add -A
git commit -m "fix: Remove conflicting pages directory for App Router deployment" || echo "No changes to commit"

echo "✨ Fixes applied! Ready to push and deploy."
echo ""
echo "Next steps:"
echo "1. git push origin main"
echo "2. Render should automatically redeploy"
echo ""
echo "The error was caused by having both /app (App Router) and /pages (Pages Router) directories."
echo "Next.js was trying to use Pages Router for 404 handling, which requires next/document imports."
