#!/bin/bash

# SIAM Health Monitor
# Checks app status and alerts on issues

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🔍 SIAM Health Monitor"
echo "====================="
date

# Check main app
echo -e "\n📱 Checking main app..."
MAIN_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://siam-app.onrender.com)
if [ "$MAIN_STATUS" == "200" ]; then
    echo -e "${GREEN}✅ Main app is UP (Status: $MAIN_STATUS)${NC}"
else
    echo -e "${RED}❌ Main app is DOWN (Status: $MAIN_STATUS)${NC}"
fi

# Check API health
echo -e "\n🔧 Checking API health..."
API_RESPONSE=$(curl -s https://siam-app.onrender.com/api/health)
if [[ "$API_RESPONSE" == *"healthy"* ]]; then
    echo -e "${GREEN}✅ API is healthy${NC}"
    echo "   Response: $API_RESPONSE"
else
    echo -e "${RED}❌ API health check failed${NC}"
fi

# Check login page
echo -e "\n🔐 Checking login page..."
LOGIN_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://siam-app.onrender.com/emergency-login.html)
if [ "$LOGIN_STATUS" == "200" ]; then
    echo -e "${GREEN}✅ Login page is UP (Status: $LOGIN_STATUS)${NC}"
else
    echo -e "${RED}❌ Login page is DOWN (Status: $LOGIN_STATUS)${NC}"
fi

# Check authentication endpoint
echo -e "\n🔑 Checking auth endpoint..."
AUTH_TEST=$(curl -s -X POST https://siam-app.onrender.com/api/auth/magic-link \
  -H "Content-Type: application/json" \
  -d '{"action":"send","email":"test@example.com"}' | grep -c "not authorized")
  
if [ "$AUTH_TEST" == "1" ]; then
    echo -e "${GREEN}✅ Auth endpoint is working (correctly rejecting unauthorized email)${NC}"
else
    echo -e "${YELLOW}⚠️  Auth endpoint response unexpected${NC}"
fi

# Performance metrics
echo -e "\n📊 Performance Metrics:"
echo -n "   Main page load time: "
time=$(curl -s -o /dev/null -w "%{time_total}" https://siam-app.onrender.com)
echo "${time}s"

echo -n "   API response time: "
time=$(curl -s -o /dev/null -w "%{time_total}" https://siam-app.onrender.com/api/health)
echo "${time}s"

echo -e "\n✨ Health check complete!"
