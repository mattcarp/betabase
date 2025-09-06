#!/bin/bash
# FIONA'S COMPLETE BUILD FIX - React 19 Compatible

echo "🔧 COMPLETE BUILD FIX FOR REACT 19"
echo "===================================="
echo ""

cd /Users/matt/Documents/projects/siam

# Step 1: Generate fresh package-lock.json
echo "📦 Generating package-lock.json..."
npm install

# Step 2: Update build script to not use npm ci
echo "📝 Updating build script..."
npm pkg set scripts.build="rm -rf .next && next build"

# Step 3: Remove the .npmrc that might cause issues
echo "🧹 Cleaning up .npmrc..."
rm -f .npmrc

# Step 4: Test the build locally
echo "🔨 Testing build..."
npm run build

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ BUILD SUCCESSFUL!"
  echo ""
  
  # Step 5: Commit and deploy
  echo "📝 Committing fix..."
  git add -A
  git commit -m "Fix: React 19 compatibility - upgraded dependencies, fixed build"
  
  echo "🚀 Deploying to Railway..."
  railway up --detach
  
  echo ""
  echo "===================================="
  echo "✅ DEPLOYMENT INITIATED"
  echo "===================================="
else
  echo ""
  echo "❌ Build failed. Checking for issues..."
  npm ls react
fi
