#!/bin/bash

# Deployment Status Dashboard - Quick view of deployment status and health

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
SERVICE_ID="srv-d2f8f0emcj7s73eh647g"
PRODUCTION_URL="https://iamsiam.ai"
RENDER_URL="https://siam.onrender.com"

echo -e "${CYAN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║            📊 SIAM DEPLOYMENT STATUS DASHBOARD 📊        ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Function to check URL status
check_url() {
    local url=$1
    local name=$2
    
    echo -n "  $name: "
    
    if curl -s -o /dev/null -w "%{http_code}" "$url" | grep -q "200\|301\|302"; then
        echo -e "${GREEN}✓ Online${NC}"
        return 0
    else
        echo -e "${RED}✗ Offline or Error${NC}"
        return 1
    fi
}

# Section 1: Current Deployment Status
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  CURRENT DEPLOYMENT STATUS${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Check if Render CLI is available and API key is set
if command -v render &> /dev/null && [ -n "$RENDER_API_KEY" ]; then
    # Get latest deployment
    LATEST_DEPLOY=$(RENDER_API_KEY=$RENDER_API_KEY render deploys list $SERVICE_ID -o json 2>/dev/null | jq -r '.[0]' 2>/dev/null || echo "{}")
    
    if [ "$LATEST_DEPLOY" != "{}" ] && [ "$LATEST_DEPLOY" != "null" ]; then
        DEPLOY_ID=$(echo "$LATEST_DEPLOY" | jq -r '.id')
        DEPLOY_STATUS=$(echo "$LATEST_DEPLOY" | jq -r '.status')
        DEPLOY_COMMIT=$(echo "$LATEST_DEPLOY" | jq -r '.commit.id' | cut -c1-7)
        DEPLOY_TIME=$(echo "$LATEST_DEPLOY" | jq -r '.createdAt')
        
        # Color code the status
        case $DEPLOY_STATUS in
            "live")
                STATUS_COLOR=$GREEN
                STATUS_ICON="✓"
                ;;
            "build_in_progress"|"update_in_progress")
                STATUS_COLOR=$YELLOW
                STATUS_ICON="⟳"
                ;;
            "build_failed"|"update_failed"|"canceled")
                STATUS_COLOR=$RED
                STATUS_ICON="✗"
                ;;
            *)
                STATUS_COLOR=$NC
                STATUS_ICON="?"
                ;;
        esac
        
        echo -e "  Status: ${STATUS_COLOR}${STATUS_ICON} ${DEPLOY_STATUS}${NC}"
        echo -e "  Deploy ID: ${CYAN}${DEPLOY_ID}${NC}"
        echo -e "  Commit: ${MAGENTA}${DEPLOY_COMMIT}${NC}"
        echo -e "  Started: $DEPLOY_TIME"
    else
        echo -e "  ${YELLOW}⚠ Unable to fetch deployment status from Render${NC}"
    fi
else
    echo -e "  ${YELLOW}⚠ Render CLI not configured. Set RENDER_API_KEY to enable.${NC}"
fi

# Section 2: Site Health Check
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  SITE HEALTH CHECK${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

check_url "$PRODUCTION_URL" "Production (iamsiam.ai)"
check_url "$RENDER_URL" "Render URL"
check_url "$PRODUCTION_URL/api/health" "Health API"

# Section 3: Recent Deployments
if command -v render &> /dev/null && [ -n "$RENDER_API_KEY" ]; then
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  RECENT DEPLOYMENTS (Last 5)${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    RENDER_API_KEY=$RENDER_API_KEY render deploys list $SERVICE_ID -o json 2>/dev/null | \
    jq -r '.[:5] | .[] | "\(.status | .[0:15] | . + (" " * (15 - length))) | \(.commit.id[0:7]) | \(.createdAt)"' 2>/dev/null | \
    while IFS='|' read -r status commit time; do
        # Trim whitespace
        status=$(echo "$status" | xargs)
        commit=$(echo "$commit" | xargs)
        time=$(echo "$time" | xargs)
        
        # Color based on status
        case $status in
            *live*)
                echo -e "  ${GREEN}● $status${NC} | $commit | $time"
                ;;
            *progress*)
                echo -e "  ${YELLOW}● $status${NC} | $commit | $time"
                ;;
            *failed*|*canceled*)
                echo -e "  ${RED}● $status${NC} | $commit | $time"
                ;;
            *)
                echo -e "  ○ $status | $commit | $time"
                ;;
        esac
    done
fi

# Section 4: GitHub Actions Status
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  GITHUB ACTIONS STATUS${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if command -v gh &> /dev/null; then
    # Get latest workflow runs
    RUNS=$(gh run list --limit 3 2>/dev/null || echo "")
    
    if [ -n "$RUNS" ]; then
        echo "$RUNS" | head -3 | while read -r line; do
            if echo "$line" | grep -q "completed"; then
                if echo "$line" | grep -q "success"; then
                    echo -e "  ${GREEN}✓${NC} $line"
                else
                    echo -e "  ${RED}✗${NC} $line"
                fi
            elif echo "$line" | grep -q "in_progress"; then
                echo -e "  ${YELLOW}⟳${NC} $line"
            else
                echo "  $line"
            fi
        done
    else
        echo -e "  ${YELLOW}⚠ No recent GitHub Actions runs${NC}"
    fi
else
    echo -e "  ${YELLOW}⚠ GitHub CLI not installed${NC}"
fi

# Section 5: Quick Actions
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  QUICK ACTIONS${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

echo "  📦 Deploy now:           npm run deploy"
echo "  🚀 Quick deploy:         npm run deploy:quick"
echo "  📋 View logs:            render logs $SERVICE_ID --tail 50"
echo "  🔍 Monitor deployment:   npm run deploy:monitor"
echo "  🧪 Run tests:           npm run test:e2e"
echo "  🌐 Open production:      open $PRODUCTION_URL"

# Section 6: Troubleshooting
if [ "$DEPLOY_STATUS" = "build_failed" ] || [ "$DEPLOY_STATUS" = "update_failed" ]; then
    echo ""
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${RED}  ⚠ DEPLOYMENT FAILED - TROUBLESHOOTING${NC}"
    echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    echo "  1. Check logs: render logs $SERVICE_ID --tail 100"
    echo "  2. Check build errors: gh run view"
    echo "  3. Verify environment variables in Render dashboard"
    echo "  4. Check recent commits: git log --oneline -5"
    echo "  5. Roll back if needed: git revert HEAD && npm run deploy"
fi

echo ""
echo -e "${CYAN}Last checked: $(date '+%Y-%m-%d %H:%M:%S')${NC}"