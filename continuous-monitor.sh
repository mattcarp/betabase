#!/bin/bash

echo "🔥 CONTINUOUS DEPLOYMENT MONITOR & LOGGER"
echo "========================================="
echo "Started: $(date)"
echo ""
echo "Monitoring: https://siam-app.onrender.com"
echo "Checking every 10 seconds..."
echo ""

# Log file
LOG_FILE="deployment-monitor.log"
echo "=== Monitor started at $(date) ===" > $LOG_FILE

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

URL="https://siam-app.onrender.com"
API_HEALTH="$URL/api/health"
CHECK=0

while true; do
    CHECK=$((CHECK + 1))
    TIMESTAMP=$(date '+%H:%M:%S')
    
    # Main site check
    RESPONSE=$(curl -s -o /tmp/siam-live.html -w "%{http_code}" "$URL" 2>/dev/null)
    CONTENT=$(cat /tmp/siam-live.html 2>/dev/null)
    
    # Log to file
    echo "[$TIMESTAMP] Check #$CHECK" >> $LOG_FILE
    echo "  HTTP Status: $RESPONSE" >> $LOG_FILE
    
    # Console output
    echo -n "[$CHECK] $TIMESTAMP: "
    
    # Check for Railway references (OLD CODE)
    if echo "$CONTENT" | grep -q "Railway"; then
        echo -e "${RED}❌ OLD CODE DETECTED - Still has Railway references${NC}"
        echo "  ERROR: Railway reference found" >> $LOG_FILE
        
        # Try to force clear
        echo "  Attempting cache clear..." >> $LOG_FILE
        curl -H "Cache-Control: no-cache" "$URL" > /dev/null 2>&1
        
    # Check for our deployment marker
    elif echo "$CONTENT" | grep -q "CORRECT deployment"; then
        echo -e "${GREEN}✅ NEW CODE DEPLOYED - Correct version running${NC}"
        echo "  SUCCESS: Correct deployment detected" >> $LOG_FILE
        
    # Check basic functionality
    elif [ "$RESPONSE" = "200" ]; then
        # Test API
        API_RESPONSE=$(curl -s "$API_HEALTH" 2>/dev/null)
        if echo "$API_RESPONSE" | grep -q "healthy"; then
            echo -e "${GREEN}✓ Site up, API healthy${NC}"
            echo "  API: healthy" >> $LOG_FILE
        else
            echo -e "${YELLOW}⚠ Site up, API issues${NC}"
            echo "  API: unhealthy or unreachable" >> $LOG_FILE
        fi
    else
        echo -e "${RED}✗ HTTP $RESPONSE${NC}"
        echo "  ERROR: HTTP $RESPONSE" >> $LOG_FILE
    fi
    
    # Every 10 checks, do deeper analysis
    if [ $((CHECK % 10)) -eq 0 ]; then
        echo ""
        echo "=== Detailed Check at $TIMESTAMP ===" | tee -a $LOG_FILE
        
        # Check static assets
        STATIC_CHECK=$(curl -s -o /dev/null -w "%{http_code}" "$URL/_next/static/chunks/main-app-7d77cd7d1bf739ba.js")
        echo "  Static assets: $STATIC_CHECK" | tee -a $LOG_FILE
        
        # Check MCP Lambda
        MCP_CHECK=$(curl -s -o /dev/null -w "%{http_code}" "https://sa64ce3rvpb7a3tztugdwrhxgu0xlgpu.lambda-url.us-east-2.on.aws/health" --max-time 3)
        echo "  MCP Lambda: $MCP_CHECK" | tee -a $LOG_FILE
        
        # Check for console errors by looking at page structure
        if echo "$CONTENT" | grep -q "BAILOUT_TO_CLIENT_SIDE_RENDERING"; then
            echo "  ⚠️ Client-side rendering bailout detected" | tee -a $LOG_FILE
        fi
        
        # Git status
        echo "  Latest commit: $(git rev-parse --short HEAD)" | tee -a $LOG_FILE
        echo ""
    fi
    
    sleep 10
done
