#!/bin/bash

# SIAM Production Monitoring Script
# Tests all critical endpoints and functionality

echo "🚀 SIAM Production Monitoring - $(date)"
echo "========================================="

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

BASE_URL="https://thebetabase.com"

# Function to test endpoint
test_endpoint() {
    local endpoint=$1
    local expected_status=$2
    local description=$3
    
    echo -n "Testing $description... "
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$endpoint")
    
    if [ "$response" = "$expected_status" ]; then
        echo -e "${GREEN}✓${NC} ($response)"
        return 0
    else
        echo -e "${RED}✗${NC} (Expected: $expected_status, Got: $response)"
        return 1
    fi
}

# Function to test API response
test_api_json() {
    local endpoint=$1
    local description=$2
    
    echo -n "Testing $description... "
    
    response=$(curl -s "$BASE_URL$endpoint")
    
    if echo "$response" | jq empty 2>/dev/null; then
        echo -e "${GREEN}✓${NC} Valid JSON"
        echo "  Response: $(echo "$response" | jq -c '.')"
        return 0
    else
        echo -e "${RED}✗${NC} Invalid JSON or error"
        echo "  Response: $response"
        return 1
    fi
}

# Health Check
echo ""
echo "1️⃣  Health Checks"
echo "----------------"
test_api_json "/api/health" "Health endpoint"

# API Endpoints
echo ""
echo "2️⃣  API Endpoints"
echo "----------------"
test_endpoint "/api/chat" "405" "Chat API (GET should fail)"
test_endpoint "/api/chat-vercel" "405" "Vercel SDK API (GET should fail)"
test_endpoint "/api/chat-responses" "200" "Responses API (GET status)"

# Authentication Pages
echo ""
echo "3️⃣  Authentication"
echo "-----------------"
test_endpoint "/" "200" "Homepage/Login"
test_endpoint "/api/auth/magic-link" "405" "Magic Link API"

# Static Assets
echo ""
echo "4️⃣  Static Assets"
echo "----------------"
test_endpoint "/_next/static/css/" "404" "CSS bundle (404 expected for directory)"
test_endpoint "/favicon.ico" "200" "Favicon"

# Performance Check
echo ""
echo "5️⃣  Performance"
echo "--------------"
echo -n "Response time for health check... "
time_taken=$(curl -s -o /dev/null -w "%{time_total}" "$BASE_URL/api/health")
time_ms=$(echo "$time_taken * 1000" | bc)
if (( $(echo "$time_ms < 1000" | bc -l) )); then
    echo -e "${GREEN}✓${NC} ${time_ms}ms"
else
    echo -e "${YELLOW}⚠${NC} ${time_ms}ms (slow)"
fi

# Check for console errors (using curl to check HTML)
echo ""
echo "6️⃣  Frontend Check"
echo "----------------"
echo -n "Checking for obvious errors in HTML... "
html_content=$(curl -s "$BASE_URL")
if echo "$html_content" | grep -q "Error\|error\|Exception\|exception" | head -5; then
    echo -e "${YELLOW}⚠${NC} Potential errors found in HTML"
else
    echo -e "${GREEN}✓${NC} No obvious errors in HTML"
fi

# Summary
echo ""
echo "========================================="
echo "✅ Monitoring Complete - $(date)"
echo ""

# Live URL test
echo "7️⃣  Live Site Test"
echo "----------------"
echo "Visit: $BASE_URL"
echo ""

# Check Vercel SDK endpoint specifically
echo "8️⃣  Vercel AI SDK Status"
echo "---------------------"
response=$(curl -s "$BASE_URL/api/chat-vercel")
if echo "$response" | grep -q "404"; then
    echo -e "${RED}✗${NC} Vercel SDK endpoint not found"
    echo "  May need deployment or is protected"
else
    echo -e "${GREEN}✓${NC} Vercel SDK endpoint accessible"
fi

echo ""
echo "📊 All tests completed!"