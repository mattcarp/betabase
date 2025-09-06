#!/bin/bash

echo "🚀 MONITORING CLEAR CACHE REBUILD"
echo "=================================="
echo "Started: $(date)"
echo ""

URL="https://siam-app.onrender.com"
CHECK=0
SUCCESS=false

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "Checking every 15 seconds for new build..."
echo "This rebuild should take 3-5 minutes..."
echo ""

while [ $CHECK -lt 30 ]; do
    CHECK=$((CHECK + 1))
    echo -n "[$CHECK] $(date '+%H:%M:%S'): "
    
    # Check for the old Railway reference
    OLD_CODE=$(curl -s "$URL/_next/static/chunks/app/page-1c3ac580896f213d.js" 2>/dev/null | grep -c "Railway" || echo "0")
    
    # Check HTTP status
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$URL")
    
    if [ "$STATUS" = "502" ] || [ "$STATUS" = "503" ]; then
        echo -e "${YELLOW}🔨 Building... (HTTP $STATUS)${NC}"
    elif [ "$OLD_CODE" = "0" ]; then
        echo -e "${GREEN}🎉 SUCCESS! New code deployed! No Railway references!${NC}"
        SUCCESS=true
        break
    elif [ "$OLD_CODE" -gt "0" ]; then
        echo -e "${RED}Still old code (Railway found)${NC}"
    else
        echo "HTTP $STATUS"
    fi
    
    sleep 15
done

if [ "$SUCCESS" = true ]; then
    echo ""
    echo "========================================="
    echo -e "${GREEN}✅ DEPLOYMENT SUCCESSFUL!${NC}"
    echo "========================================="
    echo ""
    echo "Testing final deployment:"
    echo ""
    
    # Test API
    echo -n "API Health: "
    curl -s "$URL/api/health" | python3 -c "import sys, json; d=json.load(sys.stdin); print(f'✅ {d[\"status\"]}')" 2>/dev/null || echo "❌ Failed"
    
    # Test static files
    echo -n "Static assets: "
    STATIC=$(curl -s -o /dev/null -w "%{http_code}" "$URL/_next/static/chunks/webpack-e780f86667a65c9e.js")
    [ "$STATIC" = "200" ] && echo "✅ Working" || echo "❌ Failed ($STATIC)"
    
    # Check build time
    echo -n "Build timestamp: "
    curl -sI "$URL/_next/static/chunks/app/page-1c3ac580896f213d.js" | grep "last-modified" | cut -d' ' -f2-
    
    echo ""
    echo -e "${GREEN}Your app is live at: https://siam-app.onrender.com${NC}"
else
    echo ""
    echo -e "${RED}Timeout - build may still be in progress${NC}"
    echo "Check Render dashboard for build logs"
fi
