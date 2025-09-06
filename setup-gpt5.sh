#!/bin/bash

echo "🚀 Starting GPT-5 Responses API Migration"
echo "========================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Install dependencies
echo -e "${YELLOW}Step 1: Ensuring latest OpenAI SDK...${NC}"
npm install openai@latest

# Step 2: Check if installation was successful
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Package installed successfully${NC}"
else
    echo "❌ Installation failed. Please check your npm configuration."
    exit 1
fi

# Step 3: Display next steps
echo ""
echo -e "${GREEN}✅ Migration Setup Complete!${NC}"
echo ""
echo "📝 Next Steps:"
echo "1. Start your development server:"
echo "   npm run dev"
echo ""
echo "2. Test the corrected GPT-5 Responses API endpoint:"
echo "   curl -X POST http://localhost:3000/api/gpt5-responses \\"
echo "     -H \"Content-Type: application/json\" \\"
echo "     -d '{\"message\": \"Hello GPT-5!\", \"conversationId\": \"test-123\"}'"
echo ""
echo "3. Try the new chat interface:"
echo "   http://localhost:3000/gpt5-chat"
echo ""
echo "4. Read the migration guide:"
echo "   MIGRATION-GPT5-RESPONSES.md"
echo ""
echo "📚 Documentation:"
echo "- Corrected API Route: /app/api/gpt5-responses/route.ts (uses ACTUAL Responses API)"
echo "- Alternative API Route: /app/api/gpt5-responses-proper/route.ts (also correct)"
echo "- Updated React Hook: /hooks/useGPT5Responses.ts"
echo "- Example Component: /app/gpt5-chat/page.tsx"
echo ""
echo "🔧 GPT-5 Model Options:"
echo "- gpt-5 (full): \$1.25/1M input, \$10/1M output"
echo "- gpt-5-mini: \$0.25/1M input, \$2/1M output"
echo "- gpt-5-nano: \$0.05/1M input, \$0.40/1M output"
echo ""
echo "Happy coding with GPT-5! 🎉"
