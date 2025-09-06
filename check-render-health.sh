#!/bin/bash

echo "🔍 Checking SIAM Render deployment status..."
echo "============================================"
echo ""

# Basic health check
echo "1. Testing HTTPS endpoint..."
response=$(curl -s -o /dev/null -w "%{http_code}" https://siam.onrender.com)
echo "   Response code: $response"

if [ "$response" = "200" ]; then
    echo "   ✅ Site is up and responding!"
elif [ "$response" = "301" ] || [ "$response" = "302" ] || [ "$response" = "307" ]; then
    echo "   ↩️  Site is redirecting (code: $response)"
    # Follow redirect
    final_url=$(curl -Ls -o /dev/null -w %{url_effective} https://siam.onrender.com)
    echo "   Redirects to: $final_url"
elif [ "$response" = "404" ]; then
    echo "   ❌ 404 Not Found - Check your Render deployment"
elif [ "$response" = "502" ] || [ "$response" = "503" ]; then
    echo "   ⚠️  Service temporarily unavailable (may be starting up)"
else
    echo "   ❌ Unexpected response: $response"
fi

echo ""
echo "2. Checking response time..."
time=$(curl -s -o /dev/null -w "%{time_total}" https://siam.onrender.com)
echo "   Response time: ${time}s"

echo ""
echo "3. Getting page title..."
title=$(curl -s https://siam.onrender.com | grep -o '<title>[^<]*</title>' | sed 's/<[^>]*>//g')
if [ -n "$title" ]; then
    echo "   Page title: $title"
else
    echo "   Could not retrieve page title"
fi

echo ""
echo "============================================"
echo "📊 Check full deployment at: https://dashboard.render.com"
echo ""
