#!/bin/bash

echo "🚀 FIXING RAILWAY DEPLOYMENT"
echo "============================"

# Ensure we have the correct environment variables
echo "📍 Setting up environment variables..."

# Create a proper .env.production.local for Railway
cat > .env.production.local << 'EOF'
# Cognito Configuration
NEXT_PUBLIC_COGNITO_REGION=us-east-1
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_VQTt5mEJa
NEXT_PUBLIC_COGNITO_CLIENT_ID=7gi90jqoc8pv63gkdlpqtgqfg9

# API Configuration  
NEXT_PUBLIC_API_URL=https://iamsiam.ai
NEXT_PUBLIC_AOMA_API_URL=https://luminous-dedication-production.up.railway.app

# Application
NEXT_PUBLIC_APP_NAME=SIAM
NEXT_PUBLIC_APP_VERSION=0.1.0
NODE_ENV=production
EOF

echo "✅ Environment variables configured"

# Test build locally first
echo -e "\n📍 Testing build locally..."
npm install
NODE_ENV=production npm run build

if [ $? -eq 0 ]; then
  echo "✅ Build successful!"
  
  # Deploy to Railway
  echo -e "\n📍 Deploying to Railway..."
  
  # Add and commit changes
  git add .
  git commit -m "🚀 Fix Railway deployment - restore package.json and env vars

- Restored package.json with all dependencies
- Fixed environment variables for production
- Added Railway configuration
- Password auth for claude@test.siam.ai ready"
  
  # Push to GitHub (Railway auto-deploys from GitHub)
  git push origin main
  
  # Also try direct Railway deployment
  railway up --detach
  
  echo -e "\n✅ Deployment triggered!"
  echo "📊 Check deployment at: https://railway.app/project/12573897-7569-4887-89fa-55843ac7fab2"
  echo "🌐 Site URL: https://iamsiam.ai"
  
else
  echo "❌ Build failed - check errors above"
fi