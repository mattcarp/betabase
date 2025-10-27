#!/bin/bash

echo "Starting active Railway deployment monitor..."
echo "Will check every 10 seconds for build completion"
echo ""

MAX_ATTEMPTS=60
ATTEMPT=0

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    ATTEMPT=$((ATTEMPT + 1))
    echo "=== Check $ATTEMPT/$MAX_ATTEMPTS at $(date '+%H:%M:%S') ==="
    
    # Check if site shows new build
    BUILD_TIME=$(curl -s https://thebetabase.com | grep -o "Built: [^<]*" | sed 's/Built: //')
    
    if [[ "$BUILD_TIME" == *"2025-08-14"* ]]; then
        echo "✅ SUCCESS! New build is live: $BUILD_TIME"
        echo "Deployment completed successfully!"
        exit 0
    elif [[ "$BUILD_TIME" == *"2025-08-13"* ]]; then
        echo "⏳ Still showing old build from Aug 13"
        echo "   Build is in progress or may have failed"
    else
        echo "❓ Could not detect build time"
    fi
    
    echo ""
    sleep 10
done

echo "❌ TIMEOUT: Build did not complete after 10 minutes"
exit 1
