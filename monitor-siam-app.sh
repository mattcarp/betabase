#!/bin/bash

echo "🚀 MONITORING SIAM-APP DEPLOYMENT ON RENDER"
echo "==========================================="
echo "Started: $(date)"
echo "URL: https://siam-app.onrender.com"
echo ""
echo "Build should take 3-5 minutes..."
echo ""

URL="https://siam-app.onrender.com"
CHECK=0
MAX_CHECKS=40
SUCCESS=false

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

while [ $CHECK -lt $MAX_CHECKS ]; do
    CHECK=$((CHECK + 1))
    
    # Progress indicator
    echo -n "[$CHECK/$MAX_CHECKS] $(date '+%H:%M:%S'): "
    
    # Check main site
    RESPONSE=$(curl -s -o /tmp/siam-check.html -w "%{http_code}" "$URL" 2>/dev/null)
    CONTENT=$(cat /tmp/siam-check.html 2>/dev/null | head -500)
    
    # Check for success indicators
    if echo "$CONTENT" | grep -q "SIAM\|Smart In a Meeting"; then
        echo -e "${GREEN}✅ SIAM DETECTED! Deployment successful!${NC}"
        SUCCESS=true
        break
    elif echo "$CONTENT" | grep -q "Sign In\|sign-in\|email.*password"; then
        echo -e "${GREEN}✅ Auth page detected! App is running!${NC}"
        SUCCESS=true
        break
    elif [ "$RESPONSE" = "404" ] || [ "$RESPONSE" = "502" ]; then
        echo -e "${YELLOW}⏳ Building... (HTTP $RESPONSE)${NC}"
    elif echo "$CONTENT" | grep -q "PIN"; then
        echo -e "${RED}❌ Old app still showing${NC}"
    elif [ "$RESPONSE" = "200" ]; then
        echo -e "${YELLOW}🔍 Got response, checking content...${NC}"
        # Try API endpoint
        API_CHECK=$(curl -s "$URL/api/health" 2>/dev/null)
        if echo "$API_CHECK" | grep -q "ok\|healthy"; then
            echo -e "${GREEN}   ✅ API is responding!${NC}"
            SUCCESS=true
            break
        fi
    else
        echo "HTTP $RESPONSE"
    fi
    
    if [ $CHECK -eq 10 ]; then
        echo ""
        echo "💡 Tip: The build usually takes 3-5 minutes"
    fi
    
    if [ $CHECK -eq 20 ]; then
        echo ""
        echo "📊 Still building... This is normal for Next.js apps"
    fi
    
    sleep 15
done

echo ""
if [ "$SUCCESS" = true ]; then
    echo -e "${GREEN}🎉🎉🎉 DEPLOYMENT SUCCESSFUL! 🎉🎉🎉${NC}"
    echo ""
    echo "Your SIAM app is now live at:"
    echo -e "${GREEN}https://siam-app.onrender.com${NC}"
    echo ""
    echo "Testing endpoints:"
    echo -n "  Main page: "
    curl -s -o /dev/null -w "%{http_code}\n" "$URL"
    echo -n "  Health check: "
    curl -s -o /dev/null -w "%{http_code}\n" "$URL/api/health"
    echo ""
    echo "Page title:"
    curl -s "$URL" | grep -o "<title>.*</title>" | head -1
else
    echo -e "${RED}❌ Timeout after $MAX_CHECKS checks${NC}"
    echo "Check the Render dashboard for build logs"
fi
