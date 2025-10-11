#!/bin/bash

# Monitor Render deployment and test when ready
# Usage: ./scripts/monitor-deployment.sh

echo "🔍 MONITORING RENDER DEPLOYMENT"
echo "=" | tr "=" "=" | head -c 70 && echo ""
echo ""

SERVICE_NAME="siam"
PROD_URL="https://thebetabase.com"
CHECK_INTERVAL=10  # seconds
MAX_WAIT=300      # 5 minutes

echo "📡 Service: $SERVICE_NAME"
echo "🌐 URL: $PROD_URL"
echo "⏱️  Check interval: ${CHECK_INTERVAL}s"
echo ""

# Function to check deployment status
check_deployment() {
    echo "⏳ Checking deployment status..."

    # Check if site responds
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$PROD_URL/api/chat" -X GET)

    if [ "$HTTP_CODE" = "200" ]; then
        echo "✅ Site is responding (HTTP $HTTP_CODE)"
        return 0
    else
        echo "⚠️  Site returned HTTP $HTTP_CODE"
        return 1
    fi
}

# Function to test chat endpoint
test_chat() {
    echo ""
    echo "🧪 TESTING CHAT ENDPOINT"
    echo "=" | tr "=" "=" | head -c 70 && echo ""

    TEST_QUERY="How do I search for assets in AOMA?"
    echo "Query: \"$TEST_QUERY\""
    echo ""

    # Create temp file for response
    TEMP_FILE=$(mktemp)

    # Test chat endpoint
    echo "⏳ Sending test request..."
    HTTP_CODE=$(curl -s -w "%{http_code}" -o "$TEMP_FILE" \
        "$PROD_URL/api/chat" \
        -H 'Content-Type: application/json' \
        -d "{\"messages\":[{\"role\":\"user\",\"content\":\"$TEST_QUERY\"}],\"model\":\"gpt-4o-mini\"}")

    echo "Response code: $HTTP_CODE"
    echo ""

    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "000" ]; then
        # Stream response - get first chunk
        RESPONSE=$(cat "$TEMP_FILE" | head -c 500)
        echo "📄 Response preview:"
        echo "$RESPONSE" | head -c 300
        echo "..."
        echo ""

        # Check for regression
        if echo "$RESPONSE" | grep -q "I don't have that information"; then
            echo "❌ REGRESSION DETECTED: Still refusing to answer!"
            rm "$TEMP_FILE"
            return 1
        else
            echo "✅ Response looks good (no refusal detected)"
            rm "$TEMP_FILE"
            return 0
        fi
    else
        echo "❌ HTTP Error $HTTP_CODE"
        cat "$TEMP_FILE"
        rm "$TEMP_FILE"
        return 1
    fi
}

# Main monitoring loop
echo "🚀 Starting deployment monitor..."
echo ""

ELAPSED=0
while [ $ELAPSED -lt $MAX_WAIT ]; do
    echo "[$(date +%H:%M:%S)] Checking deployment (${ELAPSED}s elapsed)..."

    if check_deployment; then
        echo ""
        echo "✅ Deployment appears ready!"
        echo "⏳ Waiting 10s for full propagation..."
        sleep 10

        # Run test
        if test_chat; then
            echo ""
            echo "=" | tr "=" "=" | head -c 70 && echo ""
            echo "🎉 DEPLOYMENT SUCCESSFUL AND TESTED!"
            echo "=" | tr "=" "=" | head -c 70 && echo ""
            exit 0
        else
            echo ""
            echo "⚠️  Deployment live but test failed. Retrying in ${CHECK_INTERVAL}s..."
        fi
    fi

    echo ""
    sleep $CHECK_INTERVAL
    ELAPSED=$((ELAPSED + CHECK_INTERVAL))
done

echo ""
echo "=" | tr "=" "=" | head -c 70 && echo ""
echo "⏰ Timeout reached (${MAX_WAIT}s)"
echo "Deployment may still be in progress. Check manually:"
echo "  - Render dashboard: https://dashboard.render.com"
echo "  - Site: $PROD_URL"
echo "=" | tr "=" "=" | head -c 70 && echo ""
exit 1
