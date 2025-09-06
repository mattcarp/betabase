#!/bin/bash

# Simple deployment script for Railway

echo "🚀 Starting simplified Railway deployment..."

# Set environment variables
echo "Setting environment variables..."
railway variables --set "NEXT_PUBLIC_BYPASS_AUTH=true"
railway variables --set "NODE_ENV=production"
railway variables --set "NEXT_PUBLIC_COGNITO_USER_POOL_ID=dummy"
railway variables --set "NEXT_PUBLIC_COGNITO_CLIENT_ID=dummy"
railway variables --set "PORT=3000"

# Remove any build artifacts
echo "Cleaning build artifacts..."
rm -rf .next
rm -rf out

# Create minimal railway.toml
cat > railway.toml << EOF
[build]
builder = "nixpacks"

[deploy]
startCommand = "npm start"
healthcheckPath = "/"
restartPolicyType = "ON_FAILURE"
EOF

echo "Deploying to Railway..."
railway up --detach

echo "✅ Deployment triggered!"
echo "Check build logs at: https://railway.com/project/12573897-7569-4887-89fa-55843ac7fab2/service/4a6df3ac-94eb-4069-82e6-5b71f95cbdca"