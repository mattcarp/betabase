#!/bin/bash
# Force Complete Railway Redeploy
# This will clear cache and force fresh build

echo "🔄 FORCING COMPLETE RAILWAY REDEPLOY"
echo "====================================="
echo ""

cd /Users/matt/Documents/projects/siam

# Create a deployment marker to force rebuild
echo "DEPLOYMENT_TIMESTAMP=$(date +%s)" > .deployment

# Add to git
git add .deployment
git commit -m "Force: Complete rebuild for auth fix - $(date)"
git push origin main

# Trigger Railway deployment
echo "🚀 Triggering Railway deployment..."
railway up --detach

echo ""
echo "⏳ Deployment triggered. This will take 3-5 minutes."
echo ""
echo "The deployment will:"
echo "1. Fix authentication (environment variables are now set)"
echo "2. Use the latest code from your repository"
echo ""
echo "Monitor at: https://railway.app/project/12573897-7569-4887-89fa-55843ac7fab2"
echo ""
echo "Or watch logs with: railway logs -f"
