#!/bin/bash
# FIONA'S NUCLEAR OPTION - FORCE COMPLETE REBUILD
# This will FORCE Railway to use the latest code

echo "🔥 FIONA'S NUCLEAR DEPLOYMENT OPTION"
echo "====================================="
echo ""

cd /Users/matt/Documents/projects/siam

# Step 1: Commit all pending changes
echo "📝 Committing all changes..."
git add -A
git commit -m "CRITICAL: Force Railway rebuild - Remove Sign Up button, fix timestamp - Fiona Nuclear Option"

# Step 2: Create a marker file to force cache invalidation
echo "🎯 Creating cache buster..."
echo "CACHE_BUST=$(date +%s)" > .railway-cache-bust
echo "DEPLOYMENT_FORCED=true" >> .railway-cache-bust
git add .railway-cache-bust
git commit -m "FORCE: Cache invalidation marker - $(date)"

# Step 3: Push to trigger deployment
echo "🚀 Pushing to GitHub..."
git push origin main --force-with-lease

# Step 4: Trigger Railway deployment with clean build
echo "🔄 Triggering Railway deployment..."
railway up --detach

echo ""
echo "====================================="
echo "✅ NUCLEAR DEPLOYMENT INITIATED"
echo "====================================="
echo ""
echo "This deployment will:"
echo "1. Use the LATEST code (no Sign Up button)"
echo "2. Include all environment variables"
echo "3. Force a complete rebuild"
echo ""
echo "⏳ Wait 3-5 minutes, then check:"
echo "   https://thebetabase.com"
echo "   https://thebetabase.com"
echo ""
echo "Monitor with: railway logs -f"
