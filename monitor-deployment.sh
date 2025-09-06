#!/bin/bash

# SIAM Deployment Monitor
# Continuously polls the Netlify URL until we get a definitive result

URL="https://siam-app-mc.netlify.app"
MAX_ATTEMPTS=60  # 10 minutes with 10-second intervals
ATTEMPT=0
SUCCESS=false

echo "🔍 SIAM Deployment Monitor Starting..."
echo "📍 URL: $URL"
echo "⏱️  Max attempts: $MAX_ATTEMPTS (10-second intervals)"
echo "🕐 Started at: $(date)"
echo ""

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    ATTEMPT=$((ATTEMPT + 1))
    echo "🔄 Attempt $ATTEMPT/$MAX_ATTEMPTS - $(date +%H:%M:%S)"
    
    # Use curl to check the URL
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}|%{time_total}|%{size_download}" "$URL" 2>/dev/null)
    HTTP_CODE=$(echo $RESPONSE | cut -d'|' -f1)
    TIME_TOTAL=$(echo $RESPONSE | cut -d'|' -f2)
    SIZE_DOWNLOAD=$(echo $RESPONSE | cut -d'|' -f3)
    
    echo "   📊 HTTP: $HTTP_CODE | Time: ${TIME_TOTAL}s | Size: ${SIZE_DOWNLOAD} bytes"
    
    if [ "$HTTP_CODE" = "200" ] && [ "$SIZE_DOWNLOAD" -gt "1000" ]; then
        echo ""
        echo "🎉 SUCCESS! SIAM is now live!"
        echo "✅ HTTP 200 response with substantial content ($SIZE_DOWNLOAD bytes)"
        echo "🌐 URL: $URL"
        echo "⏱️  Response time: ${TIME_TOTAL}s"
        echo "🕐 Success at: $(date)"
        
        # Get a sample of the content to verify it's the React app
        echo ""
        echo "📄 Content sample:"
        curl -s "$URL" | head -5
        echo ""
        
        SUCCESS=true
        break
    elif [ "$HTTP_CODE" = "404" ]; then
        echo "   ❌ Still getting 404 - CloudFront cache not updated yet"
    elif [ "$HTTP_CODE" = "200" ] && [ "$SIZE_DOWNLOAD" -le "1000" ]; then
        echo "   ⚠️  HTTP 200 but small content size - possible error page"
    else
        echo "   ⚠️  Unexpected response: HTTP $HTTP_CODE"
    fi
    
    if [ $ATTEMPT -lt $MAX_ATTEMPTS ]; then
        echo "   ⏳ Waiting 10 seconds..."
        sleep 10
    fi
    echo ""
done

if [ "$SUCCESS" = false ]; then
    echo "❌ TIMEOUT: No successful response after $MAX_ATTEMPTS attempts"
    echo "🕐 Ended at: $(date)"
    echo ""
    echo "🔍 Final diagnosis:"
    echo "   - Netlify cache may need manual invalidation"
    echo "   - Check Netlify console for deployment issues"
    echo "   - Verify buildSpec is actually using the updated configuration"
    exit 1
else
    echo "🚀 SIAM deployment verification complete!"
    exit 0
fi
