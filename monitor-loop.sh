#!/bin/bash

echo "🔍 MONITORING RENDER DEPLOYMENT"
echo "================================"
echo "Started: $(date)"
echo ""

URL="https://siam.onrender.com"
CHECK=0
MAX=30

while [ $CHECK -lt $MAX ]; do
    CHECK=$((CHECK + 1))
    echo -n "[$CHECK/$MAX] $(date '+%H:%M:%S'): "
    
    RESPONSE=$(curl -s "$URL" 2>/dev/null | head -200)
    
    if echo "$RESPONSE" | grep -q "SIAM\|Smart In a Meeting"; then
        echo ""
        echo ""
        echo "🎉🎉🎉 SUCCESS! SIAM IS DEPLOYED! 🎉🎉🎉"
        echo "URL: $URL"
        echo ""
        curl -s "$URL" | grep -o "<title>.*</title>"
        exit 0
    elif echo "$RESPONSE" | grep -q "PIN"; then
        echo "❌ Still PIN login page"
    elif echo "$RESPONSE" | grep -q "deploy-check"; then
        echo "✅ Deploy file found - build may be in progress"
    else
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$URL")
        echo "HTTP $HTTP_CODE"
    fi
    
    if [ $CHECK -lt $MAX ]; then
        sleep 15
    fi
done

echo ""
echo "❌ Timeout after $MAX checks"
echo "Render is not picking up GitHub changes"
