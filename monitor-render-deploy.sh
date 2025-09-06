#!/bin/bash

# Render Deployment Monitor
# Checks deployment status every 15 seconds

echo "🚀 Render Deployment Monitor"
echo "============================"
echo "Last commit pushed: $(git rev-parse --short HEAD)"
echo "Time: $(date)"
echo ""

RENDER_URL="https://siam.onrender.com"
CHECK_COUNT=0
MAX_CHECKS=40
SUCCESS=false

while [ $CHECK_COUNT -lt $MAX_CHECKS ]; do
    CHECK_COUNT=$((CHECK_COUNT + 1))
    echo "Check $CHECK_COUNT/$MAX_CHECKS at $(date '+%H:%M:%S')"
    
    # Check main page
    RESPONSE=$(curl -s -o /tmp/render-check.html -w "%{http_code}" "$RENDER_URL")
    
    if [ "$RESPONSE" = "200" ]; then
        echo "✅ Site is responding (HTTP 200)"
        
        # Check for the Html error
        if grep -q "Html should not be imported" /tmp/render-check.html; then
            echo "❌ HTML import error still present!"
            echo "Build failed with the same error"
        else
            # Check for auth form
            if grep -q 'type="email"' /tmp/render-check.html || grep -q "Sign In" /tmp/render-check.html; then
                echo "✅ Auth form detected - site looks functional!"
                SUCCESS=true
                break
            else
                echo "⚠️ Page loaded but no auth form found"
            fi
        fi
    else
        echo "⚠️ Site returned HTTP $RESPONSE"
    fi
    
    # Check health endpoint
    HEALTH=$(curl -s -w "\n%{http_code}" "$RENDER_URL/api/health" | tail -1)
    if [ "$HEALTH" = "200" ]; then
        echo "✅ Health endpoint responding"
    else
        echo "⚠️ Health endpoint returned $HEALTH"
    fi
    
    echo ""
    
    if [ $CHECK_COUNT -lt $MAX_CHECKS ]; then
        echo "Waiting 15 seconds..."
        sleep 15
    fi
done

if [ "$SUCCESS" = true ]; then
    echo "🎉🎉🎉 DEPLOYMENT SUCCESSFUL! 🎉🎉🎉"
    echo "Site is live at: $RENDER_URL"
    exit 0
else
    echo "❌ Deployment monitoring timeout"
    echo "Check https://dashboard.render.com for details"
    exit 1
fi
