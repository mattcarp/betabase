#!/bin/bash

# Manual Render deployment script
# Use this when auto-deploy fails

echo "🚀 Triggering manual Render deployment..."
echo ""
echo "Since Render CLI is broken, please:"
echo "1. Go to https://dashboard.render.com"
echo "2. Find the 'siam-app' service"
echo "3. Click 'Manual Deploy' → 'Deploy latest commit'"
echo ""
echo "Latest commit pushed:"
git log --oneline -1
echo ""
echo "Waiting for deployment... Check status at:"
echo "https://dashboard.render.com/web/srv-cr43kl2j1k6c73b0vqog"