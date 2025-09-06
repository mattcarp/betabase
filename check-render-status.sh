#!/bin/bash

echo "========================================="
echo "    RENDER.COM DEPLOYMENT STATUS CHECK   "
echo "========================================="
echo ""

# Check current status
echo "📊 Current Status:"
echo "  Service: siam"
echo "  URL: https://siam.onrender.com"
echo ""

# Health check
echo "🌐 Application Health Check:"
response=$(curl -s -o /dev/null -w "%{http_code}" https://siam.onrender.com)
if [ "$response" = "200" ]; then
    echo "  ✅ Application is running (HTTP $response)"
else
    echo "  ❌ Application may be down or starting (HTTP $response)"
fi

echo ""
echo "📝 To check deployment logs:"
echo "  Visit: https://dashboard.render.com"
echo ""
echo "========================================="
