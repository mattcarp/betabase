#!/bin/bash

echo "🔍 COMPREHENSIVE DEPLOYMENT TEST"
echo "================================"
echo "Time: $(date)"
echo ""

URL="https://siam-app.onrender.com"

echo "1. CHECKING BUILD VERSION:"
echo "--------------------------"
# Check if it's still the old build
OLD_BUILD=$(curl -s "$URL/_next/static/chunks/app/page-1c3ac580896f213d.js" | grep -c "Railway")
if [ "$OLD_BUILD" -gt 0 ]; then
    echo "❌ STILL RUNNING OLD CODE (Railway references found)"
    echo "   Manual deploy did NOT rebuild with latest code!"
else
    echo "✅ New code deployed (no Railway references)"
fi

echo ""
echo "2. API ENDPOINTS:"
echo "-----------------"
curl -s "$URL/api/health" | python3 -c "import sys, json; data=json.load(sys.stdin); print(f'✅ Health: {data[\"status\"]}')" 2>/dev/null || echo "❌ Health endpoint failed"

echo ""
echo "3. MCP LAMBDA STATUS:"
echo "--------------------"
MCP_URL="https://sa64ce3rvpb7a3tztugdwrhxgu0xlgpu.lambda-url.us-east-2.on.aws/health"
MCP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$MCP_URL" --max-time 5)
if [ "$MCP_STATUS" = "200" ]; then
    echo "✅ MCP Lambda is UP ($MCP_STATUS)"
else
    echo "❌ MCP Lambda is DOWN ($MCP_STATUS)"
fi

echo ""
echo "4. STATIC ASSETS:"
echo "-----------------"
WEBPACK=$(curl -s -o /dev/null -w "%{http_code}" "$URL/_next/static/chunks/webpack-e780f86667a65c9e.js")
echo "Webpack bundle: $WEBPACK"

echo ""
echo "5. CHECKING FOR ERRORS:"
echo "-----------------------"
# Simulate what the browser sees
MAIN_PAGE=$(curl -s "$URL")
if echo "$MAIN_PAGE" | grep -q "BAILOUT_TO_CLIENT_SIDE_RENDERING"; then
    echo "⚠️  Client-side rendering bailout detected"
    echo "   This causes hydration errors in the browser"
fi

echo ""
echo "6. GIT STATUS:"
echo "--------------"
CURRENT_COMMIT=$(git rev-parse --short HEAD)
echo "Local commit: $CURRENT_COMMIT"
echo "Local changes:"
git status --short

echo ""
echo "DIAGNOSIS:"
echo "=========="
echo ""
if [ "$OLD_BUILD" -gt 0 ]; then
    echo "🔴 CRITICAL: Render is stuck on an old build!"
    echo ""
    echo "Despite the manual deploy, Render is STILL serving code from"
    echo "an earlier commit that has Railway references."
    echo ""
    echo "SOLUTION:"
    echo "1. Go to Render dashboard"
    echo "2. Check the 'Events' tab to see what commit was deployed"
    echo "3. If it shows an old commit:"
    echo "   - Click Settings → Build & Deploy"
    echo "   - Verify GitHub repo is connected"
    echo "   - Click 'Clear build cache & deploy' again"
    echo "4. If it shows the latest commit but still has old code:"
    echo "   - The build cache is corrupted"
    echo "   - Delete this service and create a new one"
else
    echo "✅ Deployment successful!"
fi
