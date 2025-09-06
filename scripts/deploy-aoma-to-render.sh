#!/bin/bash

# AOMA Mesh MCP - Deploy to Render with Performance Monitoring
# This script sets up parallel deployment for A/B testing

set -e

echo "🚀 AOMA Mesh MCP - Render Deployment Script"
echo "==========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Render CLI is installed
if ! command -v render &> /dev/null; then
    echo -e "${RED}❌ Render CLI not found!${NC}"
    echo "Installing Render CLI..."
    npm install -g @render-com/cli
fi

# Check for RENDER_API_KEY
if [ -z "$RENDER_API_KEY" ]; then
    echo -e "${YELLOW}⚠️  RENDER_API_KEY not found in environment${NC}"
    echo "Please set your Render API key first:"
    echo "  export RENDER_API_KEY=your_api_key_here"
    exit 1
fi

# Configuration
PROJECT_NAME="aoma-mesh-mcp"
RENDER_REGION="${RENDER_REGION:-oregon}"
RENDER_PLAN="${RENDER_PLAN:-starter}"
GITHUB_REPO="${GITHUB_REPO:-https://github.com/your-username/aoma-mesh-mcp}"
BRANCH="${BRANCH:-main}"

echo -e "${BLUE}📋 Configuration:${NC}"
echo "  Project: $PROJECT_NAME"
echo "  Region: $RENDER_REGION"
echo "  Plan: $RENDER_PLAN"
echo "  Repository: $GITHUB_REPO"
echo "  Branch: $BRANCH"
echo ""

# Function to check if service exists
check_service_exists() {
    render services list --json | jq -r ".[] | select(.name==\"$PROJECT_NAME\") | .id" 2>/dev/null || echo ""
}

# Check if service already exists
SERVICE_ID=$(check_service_exists)

if [ -n "$SERVICE_ID" ]; then
    echo -e "${YELLOW}⚠️  Service '$PROJECT_NAME' already exists (ID: $SERVICE_ID)${NC}"
    read -p "Do you want to update the existing service? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Deployment cancelled."
        exit 0
    fi
    ACTION="update"
else
    echo -e "${GREEN}✨ Creating new service '$PROJECT_NAME'${NC}"
    ACTION="create"
fi

# Create render.yaml configuration
echo -e "${BLUE}📝 Creating render.yaml configuration...${NC}"
cat > render.yaml << EOF
services:
  - type: web
    name: $PROJECT_NAME
    env: node
    region: $RENDER_REGION
    plan: $RENDER_PLAN
    buildCommand: npm ci && npm run build
    startCommand: npm start
    healthCheckPath: /api/health
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 3000
      - key: OPENAI_API_KEY
        sync: false
      - key: ANTHROPIC_API_KEY
        sync: false
      - key: PERPLEXITY_API_KEY
        sync: false
      - key: JIRA_API_TOKEN
        sync: false
      - key: GIT_API_TOKEN
        sync: false
      - key: OUTLOOK_API_TOKEN
        sync: false
      - key: ENABLE_PERFORMANCE_MONITORING
        value: true
      - key: METRICS_ENDPOINT
        value: /api/metrics
      - key: LOG_LEVEL
        value: info
    autoDeploy: true
    domains:
      - aoma-mesh-mcp.onrender.com
EOF

# Deploy or update the service
if [ "$ACTION" = "create" ]; then
    echo -e "${BLUE}🚀 Creating Render service...${NC}"
    
    # Create service using Render API
    SERVICE_RESPONSE=$(curl -s -X POST https://api.render.com/v1/services \
        -H "Authorization: Bearer $RENDER_API_KEY" \
        -H "Content-Type: application/json" \
        -d '{
            "type": "web_service",
            "name": "'$PROJECT_NAME'",
            "ownerId": "your-owner-id",
            "repo": "'$GITHUB_REPO'",
            "branch": "'$BRANCH'",
            "runtime": "node",
            "region": "'$RENDER_REGION'",
            "plan": "'$RENDER_PLAN'",
            "buildCommand": "npm ci && npm run build",
            "startCommand": "npm start",
            "healthCheckPath": "/api/health",
            "envVars": [
                {"key": "NODE_ENV", "value": "production"},
                {"key": "PORT", "value": "3000"},
                {"key": "ENABLE_PERFORMANCE_MONITORING", "value": "true"}
            ]
        }')
    
    SERVICE_ID=$(echo $SERVICE_RESPONSE | jq -r '.service.id')
    echo -e "${GREEN}✅ Service created with ID: $SERVICE_ID${NC}"
    
else
    echo -e "${BLUE}🔄 Updating existing service...${NC}"
    
    # Update service configuration
    curl -s -X PATCH "https://api.render.com/v1/services/$SERVICE_ID" \
        -H "Authorization: Bearer $RENDER_API_KEY" \
        -H "Content-Type: application/json" \
        -d '{
            "buildCommand": "npm ci && npm run build",
            "startCommand": "npm start",
            "healthCheckPath": "/api/health"
        }' > /dev/null
    
    echo -e "${GREEN}✅ Service configuration updated${NC}"
fi

# Set environment variables securely
echo -e "${BLUE}🔐 Setting environment variables...${NC}"

# Function to set env var
set_env_var() {
    local key=$1
    local value=$2
    local is_secret=$3
    
    if [ "$is_secret" = "true" ]; then
        echo -n "  Setting $key (secret)... "
    else
        echo -n "  Setting $key... "
    fi
    
    curl -s -X PUT "https://api.render.com/v1/services/$SERVICE_ID/env-vars" \
        -H "Authorization: Bearer $RENDER_API_KEY" \
        -H "Content-Type: application/json" \
        -d '[{"key": "'$key'", "value": "'$value'"}]' > /dev/null
    
    echo -e "${GREEN}✓${NC}"
}

# Set public environment variables
set_env_var "NODE_ENV" "production" false
set_env_var "ENABLE_PERFORMANCE_MONITORING" "true" false
set_env_var "METRICS_ENDPOINT" "/api/metrics" false
set_env_var "LOG_LEVEL" "info" false

# Check for secret environment variables
if [ -n "$OPENAI_API_KEY" ]; then
    set_env_var "OPENAI_API_KEY" "$OPENAI_API_KEY" true
fi

if [ -n "$ANTHROPIC_API_KEY" ]; then
    set_env_var "ANTHROPIC_API_KEY" "$ANTHROPIC_API_KEY" true
fi

if [ -n "$PERPLEXITY_API_KEY" ]; then
    set_env_var "PERPLEXITY_API_KEY" "$PERPLEXITY_API_KEY" true
fi

echo -e "${GREEN}✅ Environment variables configured${NC}"

# Trigger deployment
echo -e "${BLUE}🚀 Triggering deployment...${NC}"
DEPLOY_RESPONSE=$(curl -s -X POST "https://api.render.com/v1/services/$SERVICE_ID/deploys" \
    -H "Authorization: Bearer $RENDER_API_KEY" \
    -H "Content-Type: application/json" \
    -d '{"clearCache": false}')

DEPLOY_ID=$(echo $DEPLOY_RESPONSE | jq -r '.id')
echo -e "${GREEN}✅ Deployment started (ID: $DEPLOY_ID)${NC}"

# Monitor deployment
echo -e "${BLUE}📊 Monitoring deployment...${NC}"
echo "  You can monitor the deployment at:"
echo "  https://dashboard.render.com/web/$SERVICE_ID/deploys/$DEPLOY_ID"
echo ""

# Wait for deployment to complete
DEPLOY_STATUS="building"
COUNTER=0
MAX_WAIT=600 # 10 minutes max

while [ "$DEPLOY_STATUS" = "building" ] && [ $COUNTER -lt $MAX_WAIT ]; do
    sleep 10
    COUNTER=$((COUNTER + 10))
    
    STATUS_RESPONSE=$(curl -s "https://api.render.com/v1/services/$SERVICE_ID/deploys/$DEPLOY_ID" \
        -H "Authorization: Bearer $RENDER_API_KEY")
    
    DEPLOY_STATUS=$(echo $STATUS_RESPONSE | jq -r '.status')
    
    echo -ne "\r  Status: $DEPLOY_STATUS (${COUNTER}s elapsed)..."
done

echo ""

if [ "$DEPLOY_STATUS" = "live" ]; then
    echo -e "${GREEN}✅ Deployment successful!${NC}"
    
    # Test the deployment
    echo -e "${BLUE}🧪 Testing deployment...${NC}"
    HEALTH_URL="https://aoma-mesh-mcp.onrender.com/api/health"
    
    echo "  Testing health endpoint: $HEALTH_URL"
    HEALTH_RESPONSE=$(curl -s -w "\n%{http_code}" $HEALTH_URL)
    HTTP_CODE=$(echo "$HEALTH_RESPONSE" | tail -n1)
    BODY=$(echo "$HEALTH_RESPONSE" | head -n-1)
    
    if [ "$HTTP_CODE" = "200" ]; then
        echo -e "${GREEN}✅ Health check passed!${NC}"
        echo "  Response: $BODY"
    else
        echo -e "${YELLOW}⚠️  Health check returned status $HTTP_CODE${NC}"
        echo "  Response: $BODY"
    fi
    
    # Update environment variables for A/B testing
    echo ""
    echo -e "${BLUE}📝 Updating local environment for A/B testing...${NC}"
    
    # Add to .env.local
    if ! grep -q "NEXT_PUBLIC_RENDER_AOMA_URL" .env.local 2>/dev/null; then
        echo "" >> .env.local
        echo "# AOMA Render Deployment (for A/B testing)" >> .env.local
        echo "NEXT_PUBLIC_RENDER_AOMA_URL=https://aoma-mesh-mcp.onrender.com" >> .env.local
        echo "NEXT_PUBLIC_AOMA_AB_TEST=true" >> .env.local
        echo "NEXT_PUBLIC_RENDER_PERCENTAGE=10" >> .env.local
        echo "NEXT_PUBLIC_COMPARISON_MODE=false" >> .env.local
        echo "NEXT_PUBLIC_PERF_LOGGING=true" >> .env.local
        echo -e "${GREEN}✅ Environment variables added to .env.local${NC}"
    else
        echo -e "${YELLOW}ℹ️  Environment variables already exist in .env.local${NC}"
    fi
    
    echo ""
    echo -e "${GREEN}🎉 Deployment Complete!${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Run performance benchmarks:"
    echo "     npm run benchmark:aoma"
    echo ""
    echo "  2. Monitor with Render MCP:"
    echo "     'Check AOMA mesh performance on Render'"
    echo "     'Show AOMA deployment logs'"
    echo ""
    echo "  3. Adjust A/B test percentage:"
    echo "     Edit NEXT_PUBLIC_RENDER_PERCENTAGE in .env.local"
    echo ""
    echo "  4. Enable comparison mode for parallel testing:"
    echo "     Set NEXT_PUBLIC_COMPARISON_MODE=true"
    
else
    echo -e "${RED}❌ Deployment failed with status: $DEPLOY_STATUS${NC}"
    echo "Check the logs at: https://dashboard.render.com/web/$SERVICE_ID/deploys/$DEPLOY_ID"
    exit 1
fi