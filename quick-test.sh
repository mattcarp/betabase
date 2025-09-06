#!/bin/bash

# Quick Test Script for SIAM Implementation
# Run this after completing the database migration

echo "🧪 SIAM Quick Test Suite"
echo "========================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if server is running
check_server() {
    echo "1️⃣  Checking if dev server is running..."
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Dev server is running${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠️  Dev server not running. Starting it now...${NC}"
        npm run dev &
        SERVER_PID=$!
        sleep 5
        return 1
    fi
}

# Test GPT-5 Chat endpoint
test_gpt_chat() {
    echo ""
    echo "2️⃣  Testing GPT-5 Chat API..."
    
    RESPONSE=$(curl -s -X POST http://localhost:3000/api/gpt5-responses-fixed \
        -H "Content-Type: application/json" \
        -d '{"message": "Say hello", "conversationId": "test-123"}' \
        --max-time 10)
    
    if [[ $RESPONSE == *"data:"* ]]; then
        echo -e "${GREEN}✅ GPT-5 Chat API is working${NC}"
    else
        echo -e "${RED}❌ GPT-5 Chat API failed${NC}"
        echo "Response: $RESPONSE"
    fi
}

# Test Firecrawl endpoint
test_firecrawl() {
    echo ""
    echo "3️⃣  Testing Firecrawl API..."
    
    RESPONSE=$(curl -s -X GET "http://localhost:3000/api/firecrawl-crawl?url=https://example.com" \
        --max-time 10)
    
    if [[ $RESPONSE == *"error"* ]] && [[ $RESPONSE == *"No data found"* ]]; then
        echo -e "${GREEN}✅ Firecrawl API endpoint is responding${NC}"
        echo -e "${YELLOW}   (No data yet - run a crawl first)${NC}"
    elif [[ $RESPONSE == *"url"* ]]; then
        echo -e "${GREEN}✅ Firecrawl API has data!${NC}"
    else
        echo -e "${RED}❌ Firecrawl API may have issues${NC}"
        echo "Response: $RESPONSE"
    fi
}

# Test Supabase connection
test_supabase() {
    echo ""
    echo "4️⃣  Testing Supabase connection..."
    
    # Create a Node.js test
    cat > /tmp/test-supabase-quick.js << 'EOF'
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function test() {
    try {
        // Test if firecrawl_analysis table exists
        const { error } = await supabase
            .from('firecrawl_analysis')
            .select('count', { count: 'exact', head: true });
        
        if (error) {
            if (error.message.includes('does not exist')) {
                console.log('TABLE_MISSING');
            } else {
                console.log('ERROR:', error.message);
            }
        } else {
            console.log('TABLE_EXISTS');
        }
    } catch (err) {
        console.log('CONNECTION_ERROR');
    }
}
test();
EOF

    # Load env vars and run test
    cd /Users/matt/Documents/projects/siam
    source .env.local 2>/dev/null || true
    
    RESULT=$(node /tmp/test-supabase-quick.js 2>/dev/null)
    
    if [[ $RESULT == *"TABLE_EXISTS"* ]]; then
        echo -e "${GREEN}✅ Supabase connected & firecrawl_analysis table exists${NC}"
    elif [[ $RESULT == *"TABLE_MISSING"* ]]; then
        echo -e "${RED}❌ Supabase connected but firecrawl_analysis table missing${NC}"
        echo -e "${YELLOW}   Run the migration: /supabase/migrations/002_firecrawl_analysis.sql${NC}"
    else
        echo -e "${RED}❌ Supabase connection issue${NC}"
        echo "   Error: $RESULT"
    fi
    
    rm /tmp/test-supabase-quick.js
}

# Main execution
echo "Starting tests..."
echo ""

check_server
test_gpt_chat
test_firecrawl  
test_supabase

echo ""
echo "========================"
echo "📊 Test Summary"
echo "========================"
echo ""
echo "Next steps based on results:"
echo ""
echo "1. If Supabase table is missing:"
echo "   → Run migration at https://app.supabase.com/project/kfxetwuuzljhybfgmpuc"
echo ""
echo "2. If all tests pass:"
echo "   → Try crawling an AOMA page:"
echo "   curl -X POST http://localhost:3000/api/firecrawl-crawl \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"url\": \"https://aoma-app.com\"}'"
echo ""
echo "3. Test the chat UI:"
echo "   → Open http://localhost:3000/gpt5-chat"
echo ""

# Kill server if we started it
if [ ! -z "$SERVER_PID" ]; then
    echo "Stopping dev server..."
    kill $SERVER_PID 2>/dev/null
fi

echo "✅ Test complete!"