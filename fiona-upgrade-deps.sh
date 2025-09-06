#!/bin/bash
# FIONA'S MODERN FIX - Upgrade Dependencies for React 19

echo "🚀 MODERN FIX - UPGRADE DEPENDENCIES FOR REACT 19"
echo "================================================="
echo ""

cd /Users/matt/Documents/projects/siam

# Step 1: Check current versions
echo "📋 Current dependency versions:"
echo "--------------------------------"
grep -E '"react"|"next-themes"' package.json

# Step 2: Upgrade next-themes to latest version that supports React 19
echo ""
echo "📦 Upgrading next-themes to latest version..."
npm install next-themes@latest --save

# Step 3: Check for other incompatible packages
echo ""
echo "🔍 Checking for other React 18 dependencies..."
npm ls react 2>&1 | grep -E "UNMET|peer" | head -20

# Step 4: Update any other problematic packages
echo ""
echo "📦 Updating other dependencies if needed..."

# Update floating-ui packages if they exist
if grep -q "@floating-ui/react" package.json; then
  echo "Updating @floating-ui/react..."
  npm install @floating-ui/react@latest --save
fi

# Update ai-sdk packages if they exist
if grep -q "@ai-sdk/react" package.json; then
  echo "Updating @ai-sdk/react..."
  npm install @ai-sdk/react@latest --save
fi

# Step 5: Clean install with new dependencies
echo ""
echo "🧹 Clean install with updated dependencies..."
rm -rf node_modules package-lock.json
npm install

# Step 6: Verify build works locally
echo ""
echo "🔨 Testing local build..."
npm run build

echo ""
echo "================================================="
echo "✅ DEPENDENCIES UPGRADED FOR REACT 19"
echo "================================================="
echo ""
echo "If build succeeds, commit and deploy with:"
echo "  git add -A"
echo "  git commit -m 'Fix: Upgrade dependencies for React 19 compatibility'"
echo "  git push origin main"
echo "  railway up"
