#!/bin/bash

echo "🚀 Deploying SIAM to Render.com"
echo "================================"
echo ""

# Check if we're in a git repo
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "❌ Not in a git repository!"
    exit 1
fi

echo "📝 Current git status:"
git status --short

echo ""
echo "📦 Committing all changes..."
git add -A
git commit -m "Deploy to Render: Remove Railway, update all configs" || echo "No changes to commit"

echo ""
echo "🔄 Pushing to origin..."
git push origin main || git push origin master || echo "Push failed - check your remote"

echo ""
echo "================================"
echo "✅ Code pushed to repository!"
echo ""
echo "📊 Next steps:"
echo "1. Go to https://dashboard.render.com"
echo "2. Check your service 'siam-app'"
echo "3. It should auto-deploy from the latest push"
echo "4. Monitor the deployment logs"
echo ""
echo "🔗 Your app will be available at: https://siam.onrender.com"
echo ""
