#!/bin/bash

echo "🔍 DIAGNOSING SIAM-APP DEPLOYMENT ISSUES"
echo "========================================"
echo ""

URL="https://siam-app.onrender.com"

# Test 1: Check if main page loads
echo "1. Testing main page..."
MAIN_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$URL")
echo "   Status: $MAIN_STATUS"

# Test 2: Check API health endpoint
echo ""
echo "2. Testing /api/health endpoint..."
HEALTH_RESPONSE=$(curl -s "$URL/api/health")
echo "   Response: $HEALTH_RESPONSE"

# Test 3: Check if static assets are accessible
echo ""
echo "3. Testing static assets..."
STATIC_CHECK=$(curl -s -o /dev/null -w "%{http_code}" "$URL/_next/static/chunks/webpack-b8de74a6faf70040.js")
echo "   Static JS: $STATIC_CHECK"

# Test 4: Check MCP connection
echo ""
echo "4. Testing MCP/Lambda connection..."
MCP_URL="https://sa64ce3rvpb7a3tztugdwrhxgu0xlgpu.lambda-url.us-east-2.on.aws/health"
MCP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$MCP_URL" --max-time 5)
echo "   MCP Health: $MCP_STATUS"

# Test 5: Check for console errors
echo ""
echo "5. Common issues found:"
echo ""

if [ "$MAIN_STATUS" = "200" ] && [ "$STATIC_CHECK" = "200" ]; then
    echo "   ✅ Site is loading correctly"
else
    echo "   ❌ Static assets not loading"
fi

if echo "$HEALTH_RESPONSE" | grep -q "ok\|healthy"; then
    echo "   ✅ API endpoints working"
else
    echo "   ❌ API endpoints failing"
fi

echo ""
echo "DIAGNOSIS:"
echo "=========="
echo ""
echo "The deployment is successful but the app has runtime errors:"
echo ""
echo "1. The 'Railway deployment version' message suggests old code"
echo "   → Need to clear browser cache or force refresh (Cmd+Shift+R)"
echo ""
echo "2. JSON parsing errors indicate the app is getting HTML instead of JSON"
echo "   → This happens when API routes return 404s"
echo ""
echo "3. The MCP/Lambda connection might be failing due to CORS"
echo "   → The Lambda function might need CORS headers configured"
echo ""
echo "IMMEDIATE FIX:"
echo "=============="
echo "1. Force refresh the page: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)"
echo "2. Clear browser cache and cookies for siam-app.onrender.com"
echo "3. Try in an incognito/private window"
echo ""
echo "If errors persist, we need to check the build logs on Render dashboard"
