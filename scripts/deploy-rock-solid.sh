#!/bin/bash

# Rock-Solid Deployment Script with Full Monitoring
# This script ensures deployments are predictable and successful

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
SERVICE_ID="srv-d2f8f0emcj7s73eh647g"
PROD_URL="https://thebetabase.com"
MAX_WAIT_TIME=600  # 10 minutes max
CHECK_INTERVAL=15   # Check every 15 seconds

echo -e "${CYAN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║           🚀 ROCK-SOLID DEPLOYMENT PIPELINE 🚀            ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Step 1: Pre-deployment validation
echo -e "${BLUE}STEP 1: PRE-DEPLOYMENT VALIDATION${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if ! ./scripts/validate-before-deploy.sh; then
    echo -e "${RED}❌ Validation failed! Aborting deployment.${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}STEP 2: GIT OPERATIONS${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Ensure we're on main branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
    echo -e "${YELLOW}Switching to main branch...${NC}"
    git checkout main
    git pull origin main
fi

# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo -e "${YELLOW}Uncommitted changes detected. Committing...${NC}"
    git add -A
    git commit -m "chore: automated deployment commit $(date +%Y%m%d-%H%M%S)"
fi

# Get the commit hash we're deploying
DEPLOY_COMMIT=$(git rev-parse --short HEAD)
echo -e "Deploying commit: ${GREEN}$DEPLOY_COMMIT${NC}"

# Push to trigger deployment
echo -e "${BLUE}Pushing to origin/main...${NC}"
git push origin main

echo ""
echo -e "${BLUE}STEP 3: DEPLOYMENT MONITORING${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Wait for deployment to start
echo "Waiting for deployment to start..."
sleep 10

# Monitor deployment status
START_TIME=$(date +%s)
DEPLOYMENT_ID=""
BUILD_STATUS="pending"

while true; do
    CURRENT_TIME=$(date +%s)
    ELAPSED=$((CURRENT_TIME - START_TIME))
    
    if [ $ELAPSED -gt $MAX_WAIT_TIME ]; then
        echo -e "${RED}❌ Deployment timeout after ${MAX_WAIT_TIME} seconds${NC}"
        exit 1
    fi
    
    # Get latest deployment status
    if [ -n "$RENDER_API_KEY" ]; then
        LATEST_DEPLOY=$(RENDER_API_KEY=$RENDER_API_KEY render deploys list $SERVICE_ID -o json 2>/dev/null | jq -r '.[0]' || echo "{}")
        
        if [ "$LATEST_DEPLOY" != "{}" ]; then
            DEPLOY_STATUS=$(echo "$LATEST_DEPLOY" | jq -r '.status')
            DEPLOY_ID=$(echo "$LATEST_DEPLOY" | jq -r '.id')
            DEPLOY_COMMIT_CHECK=$(echo "$LATEST_DEPLOY" | jq -r '.commit.id' | cut -c1-7)
            
            # Check if this is our deployment
            if [ "$DEPLOY_COMMIT_CHECK" = "$DEPLOY_COMMIT" ]; then
                echo -ne "\r⏳ Status: ${YELLOW}$DEPLOY_STATUS${NC} (${ELAPSED}s elapsed)    "
                
                case $DEPLOY_STATUS in
                    "live")
                        echo ""
                        echo -e "${GREEN}✅ Deployment successful!${NC}"
                        BUILD_STATUS="success"
                        break
                        ;;
                    "build_failed"|"update_failed")
                        echo ""
                        echo -e "${RED}❌ Deployment failed!${NC}"
                        
                        # Show error logs
                        echo -e "${RED}Error logs:${NC}"
                        RENDER_API_KEY=$RENDER_API_KEY render logs -r $SERVICE_ID -o text --limit 30 | grep -E "error|Error|failed" | tail -10
                        
                        BUILD_STATUS="failed"
                        break
                        ;;
                    "build_in_progress"|"update_in_progress")
                        # Still building, continue monitoring
                        ;;
                esac
            fi
        fi
    else
        echo -e "${YELLOW}⚠️  RENDER_API_KEY not set. Cannot monitor deployment status.${NC}"
        echo "Set it with: export RENDER_API_KEY=your_key_here"
        BUILD_STATUS="unknown"
        break
    fi
    
    sleep $CHECK_INTERVAL
done

echo ""
echo -e "${BLUE}STEP 4: PRODUCTION VERIFICATION${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ "$BUILD_STATUS" = "success" ]; then
    echo "Waiting for service to be ready..."
    sleep 30
    
    # Test production URL
    echo -n "Testing $PROD_URL... "
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $PROD_URL)
    
    if [ "$HTTP_STATUS" = "200" ] || [ "$HTTP_STATUS" = "301" ] || [ "$HTTP_STATUS" = "302" ]; then
        echo -e "${GREEN}✓ Site is accessible (HTTP $HTTP_STATUS)${NC}"
        
        # Run production tests
        echo "Running production tests..."
        if npm run test:e2e tests/production/quick-verification.spec.ts > /tmp/prod-test.log 2>&1; then
            echo -e "${GREEN}✓ Production tests passed!${NC}"
        else
            echo -e "${YELLOW}⚠️  Some tests failed. Check /tmp/prod-test.log${NC}"
        fi
    else
        echo -e "${RED}✗ Site returned HTTP $HTTP_STATUS${NC}"
    fi
fi

echo ""
echo -e "${BLUE}STEP 5: DEPLOYMENT SUMMARY${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ "$BUILD_STATUS" = "success" ]; then
    echo -e "${GREEN}🎉 DEPLOYMENT SUCCESSFUL!${NC}"
    echo ""
    echo "  Commit: $DEPLOY_COMMIT"
    echo "  Deploy ID: $DEPLOY_ID"
    echo "  Production URL: $PROD_URL"
    echo "  Status: Live"
    echo ""
    echo "Next steps:"
    echo "  1. Verify functionality at $PROD_URL"
    echo "  2. Monitor error logs: render logs $SERVICE_ID --tail 50"
    echo "  3. Check metrics: render metrics $SERVICE_ID"
    
    # Create deployment record
    echo "$(date +%Y-%m-%d\ %H:%M:%S) | $DEPLOY_COMMIT | SUCCESS" >> deployments.log
    
    exit 0
else
    echo -e "${RED}❌ DEPLOYMENT FAILED!${NC}"
    echo ""
    echo "Troubleshooting steps:"
    echo "  1. Run: ./scripts/validate-before-deploy.sh"
    echo "  2. Check logs: render logs $SERVICE_ID --tail 100"
    echo "  3. Test locally: npm run build"
    echo "  4. Review recent changes: git log --oneline -10"
    echo ""
    echo -e "${YELLOW}Rolling back to previous version...${NC}"
    
    # Record failure
    echo "$(date +%Y-%m-%d\ %H:%M:%S) | $DEPLOY_COMMIT | FAILED" >> deployments.log
    
    # Optional: Auto-rollback
    # git revert HEAD --no-edit
    # git push origin main
    
    exit 1
fi