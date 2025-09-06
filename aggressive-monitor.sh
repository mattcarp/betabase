#!/bin/bash

echo "🚨 AGGRESSIVE RENDER DEPLOYMENT MONITOR 🚨"
echo "========================================="
echo ""
echo "Latest commit: $(git rev-parse --short HEAD)"
echo "Repository: mattcarp/siam"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

RENDER_URL="https://siam.onrender.com"
CHECK_COUNT=0
MAX_CHECKS=60  # 15 minutes
SUCCESS=false

echo -e "${YELLOW}Starting aggressive monitoring...${NC}"
echo ""

# First, check current state
echo "Initial check of $RENDER_URL..."
INITIAL_RESPONSE=$(curl -s "$RENDER_URL" | head -100)

if echo "$INITIAL_RESPONSE" | grep -q "PIN"; then
    echo -e "${RED}❌ WRONG APP DETECTED!${NC}"
    echo "Render is serving a PIN login page, not SIAM"
    echo ""
    echo -e "${YELLOW}MANUAL INTERVENTION REQUIRED:${NC}"
    echo "1. Go to https://dashboard.render.com"
    echo "2. Find your 'siam' service"
    echo "3. Check if it's connected to GitHub repo: mattcarp/siam"
    echo "4. Click 'Manual Deploy' → 'Deploy latest commit'"
    echo ""
    echo "While you do that, I'll keep monitoring..."
    echo ""
fi

while [ $CHECK_COUNT -lt $MAX_CHECKS ]; do
    CHECK_COUNT=$((CHECK_COUNT + 1))
    
    # More detailed check
    echo -e "Check $CHECK_COUNT/$MAX_CHECKS at $(date '+%H:%M:%S')"
    
    # Check main page
    RESPONSE=$(curl -s -o /tmp/render-check.html -w "%{http_code}" "$RENDER_URL" 2>/dev/null)
    CONTENT=$(cat /tmp/render-check.html 2>/dev/null)
    
    # Look for SIAM indicators
    if echo "$CONTENT" | grep -q "SIAM"; then
        echo -e "${GREEN}✅ SIAM DETECTED IN RESPONSE!${NC}"
        SUCCESS=true
        break
    fi
    
    # Check for specific error
    if echo "$CONTENT" | grep -q "Html should not be imported"; then
        echo -e "${RED}❌ HTML IMPORT ERROR STILL PRESENT${NC}"
        echo "Build is failing with the same error"
    elif echo "$CONTENT" | grep -q "PIN"; then
        echo -e "${YELLOW}⚠️ Still showing PIN login page${NC}"
    elif echo "$CONTENT" | grep -q 'type="email"'; then
        echo -e "${GREEN}✅ Email input detected!${NC}"
        SUCCESS=true
        break
    elif echo "$CONTENT" | grep -q "Sign In"; then
        echo -e "${GREEN}✅ Sign In form detected!${NC}"
        SUCCESS=true
        break
    else
        echo "Response code: $RESPONSE"
    fi
    
    # Check API health
    HEALTH_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$RENDER_URL/api/health" 2>/dev/null)
    if [ "$HEALTH_CODE" = "200" ]; then
        echo -e "${GREEN}✅ Health endpoint working (200)${NC}"
        # If health is working, the app is likely deployed
        SUCCESS=true
        break
    else
        echo "Health endpoint: $HEALTH_CODE"
    fi
    
    echo ""
    
    if [ $CHECK_COUNT -lt $MAX_CHECKS ]; then
        sleep 15
    fi
done

if [ "$SUCCESS" = true ]; then
    echo ""
    echo -e "${GREEN}🎉🎉🎉 DEPLOYMENT SUCCESSFUL! 🎉🎉🎉${NC}"
    echo -e "${GREEN}Your SIAM app is now live at: $RENDER_URL${NC}"
    echo ""
    
    # Final verification
    echo "Final verification:"
    curl -s "$RENDER_URL" | head -5
    
    # Test the app
    echo ""
    echo "Testing authentication page..."
    if curl -s "$RENDER_URL" | grep -q "SIAM\|Sign In\|email"; then
        echo -e "${GREEN}✅ Authentication page confirmed working!${NC}"
    fi
else
    echo ""
    echo -e "${RED}❌ TIMEOUT: Deployment did not complete${NC}"
    echo ""
    echo "TROUBLESHOOTING STEPS:"
    echo "1. Check https://dashboard.render.com for build logs"
    echo "2. Verify GitHub webhook is connected"
    echo "3. Try 'Manual Deploy' from Render dashboard"
    echo "4. Check if service is suspended (free tier limit)"
    echo ""
    echo "Last response saved in: /tmp/render-check.html"
fi
