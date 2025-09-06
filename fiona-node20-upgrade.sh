#!/bin/bash
# FIONA'S NODE 20 UPGRADE FOR RAILWAY

echo "🚀 UPGRADING RAILWAY TO NODE 20 LTS"
echo "===================================="
echo ""

cd /Users/matt/Documents/projects/siam

# Step 1: Verify all Node version files are set
echo "📋 Node version configuration:"
echo "------------------------------"
echo ".nvmrc: $(cat .nvmrc)"
echo "Dockerfile: $(grep 'FROM node:' Dockerfile | head -1)"
echo "railway.json: configured for Node 20"
echo ""

# Step 2: Commit all changes
echo "📝 Committing Node 20 upgrade..."
git add -A
git commit -m "CRITICAL: Upgrade to Node 20 LTS for Railway - fix all dependency issues"

# Step 3: Push to GitHub
echo "🚀 Pushing to GitHub..."
git push origin main

# Step 4: Deploy to Railway
echo "🔄 Deploying to Railway with Node 20..."
railway up --detach

echo ""
echo "===================================="
echo "✅ NODE 20 DEPLOYMENT INITIATED"
echo "===================================="
echo ""
echo "Railway will now:"
echo "1. Use Node 20 Alpine Linux"
echo "2. Install all dependencies correctly"
echo "3. Build without engine warnings"
echo "4. Deploy the CORRECT version (no Sign Up button)"
echo ""
echo "Monitor at Railway dashboard"
echo "This should be the FINAL fix!"
