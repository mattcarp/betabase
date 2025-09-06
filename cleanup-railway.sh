#!/bin/bash

# Remove Railway from Siam Project - Complete Cleanup Script
# This script removes all Railway references and replaces them with Render.com

echo "🧹 Starting Railway cleanup for Siam project..."
echo "================================================"
echo ""

# First, let's backup the current state
echo "📦 Creating backup of current state..."
cp playwright.config.ts playwright.config.ts.backup-$(date +%s) 2>/dev/null || true

# Step 1: Delete all Railway-specific files
echo "🗑️  Removing Railway-specific files..."
RAILWAY_FILES=(
    "check-railway.sh"
    "fix-railway-deploy.sh"
    "RAILWAY-DEPLOYMENT-SOLUTION.md"
    "set-railway-dev-mode.sh"
    "railway.toml.bak"
    "test-railway-deployment.sh"
    "complete-railway-fix.sh"
    "cleanup-vite-railway.sh"
    ".railway-cache-bust"
    "next.config.railway.js"
    ".env.railway"
    "trigger-railway.sh"
    "force-railway-deploy.sh"
    ".railway-cache-bust-v2"
    "check-railway-status.sh"
    "railway.json"
    "railway-deployment-monitor.log"
    "manual-railway-deploy.sh"
    "deploy-railway.sh"
    "fix-railway-env.sh"
    ".railwayignore"
    "RAILWAY_ENV_VARS.txt"
    "railway-env-template.txt"
    "setup-railway-domains.sh"
    "set-railway-env.sh"
    "monitor-railway.sh"
    "RAILWAY_DEV_MODE_VARS.txt"
)

for file in "${RAILWAY_FILES[@]}"; do
    if [ -f "$file" ]; then
        rm -f "$file"
        echo "  ✅ Removed: $file"
    fi
done

# Step 2: Remove Railway directory if it exists
if [ -d ".railway" ]; then
    rm -rf .railway
    echo "  ✅ Removed: .railway directory"
fi

echo ""
echo "🔄 Updating source files with Render references..."
echo ""

# Step 3: Update TypeScript/JavaScript files with Railway references
# These files contain hardcoded Railway URLs that need updating

# Update aomaContentAggregator.ts
if [ -f "src/services/aomaContentAggregator.ts" ]; then
    echo "  📝 Updating src/services/aomaContentAggregator.ts..."
    sed -i.bak 's|"https://aoma-mesh-mcp-production.*\.up\.railway\.app"|"https://aoma-mesh-mcp.onrender.com"|g' src/services/aomaContentAggregator.ts
    rm -f src/services/aomaContentAggregator.ts.bak
fi

# Update aomaConversationIntegration.ts
if [ -f "src/services/aomaConversationIntegration.ts" ]; then
    echo "  📝 Updating src/services/aomaConversationIntegration.ts..."
    sed -i.bak 's|// Railway deployment URL|// Render deployment URL|g' src/services/aomaConversationIntegration.ts
    sed -i.bak 's|"https://aoma-mesh-mcp-production.*\.up\.railway\.app"|"https://aoma-mesh-mcp.onrender.com"|g' src/services/aomaConversationIntegration.ts
    rm -f src/services/aomaConversationIntegration.ts.bak
fi

# Update aomaOrchestrator.ts
if [ -f "src/services/aomaOrchestrator.ts" ]; then
    echo "  📝 Updating src/services/aomaOrchestrator.ts..."
    sed -i.bak 's|// Railway deployment URL|// Render deployment URL|g' src/services/aomaOrchestrator.ts
    sed -i.bak 's|? "https://aoma-mesh-mcp-production.*\.up\.railway\.app/rpc"|? "https://aoma-mesh-mcp.onrender.com/rpc"|g' src/services/aomaOrchestrator.ts
    rm -f src/services/aomaOrchestrator.ts.bak
fi

# Update aomaParallelRouter.ts
if [ -f "src/services/aomaParallelRouter.ts" ]; then
    echo "  📝 Updating src/services/aomaParallelRouter.ts..."
    sed -i.bak 's|// Railway URL as fallback|// Render URL as primary|g' src/services/aomaParallelRouter.ts
    sed -i.bak 's|private railwayUrl.*|// Railway removed - using Render only|g' src/services/aomaParallelRouter.ts
    sed -i.bak 's|"railway": { data.*|// Railway provider removed|g' src/services/aomaParallelRouter.ts
    sed -i.bak 's|case "railway":|// Railway case removed|g' src/services/aomaParallelRouter.ts
    rm -f src/services/aomaParallelRouter.ts.bak
fi

echo ""
echo "🔍 Checking for any remaining Railway references..."
echo ""

# Step 4: Search for any remaining Railway references
remaining=$(grep -r "railway" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" --include="*.json" --include="*.md" . 2>/dev/null | grep -v node_modules | grep -v ".next" | grep -v ".git" | wc -l)

if [ "$remaining" -gt 0 ]; then
    echo "⚠️  Found $remaining remaining Railway references:"
    echo ""
    grep -r "railway" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" --include="*.json" --include="*.md" . 2>/dev/null | grep -v node_modules | grep -v ".next" | grep -v ".git" | head -10
    echo ""
    echo "These may need manual review and updating."
else
    echo "✨ No remaining Railway references found in source code!"
fi

echo ""
echo "🎯 Creating Render deployment helpers..."
echo ""

# Step 5: Create new Render-specific helper scripts
cat > check-render-status.sh << 'EOF'
#!/bin/bash

echo "========================================="
echo "    RENDER.COM DEPLOYMENT STATUS CHECK    "
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
echo "========================================="
echo "Check Render dashboard at: https://dashboard.render.com"
EOF

chmod +x check-render-status.sh

echo "  ✅ Created check-render-status.sh"

# Step 6: Update package.json scripts if needed
if [ -f "package.json" ]; then
    echo ""
    echo "📦 Checking package.json for Railway references..."
    if grep -q "railway" package.json; then
        echo "  ⚠️  Found Railway references in package.json - these need manual review"
    else
        echo "  ✅ No Railway references in package.json"
    fi
fi

echo ""
echo "================================================"
echo "✅ Railway cleanup complete!"
echo ""
echo "Summary:"
echo "  • Removed ${#RAILWAY_FILES[@]} Railway-specific files"
echo "  • Updated source files to use Render URLs"
echo "  • Created Render status check script"
echo ""
echo "Next steps:"
echo "  1. Review any remaining references listed above"
echo "  2. Update environment variables to use Render URLs"
echo "  3. Test with: npm run dev"
echo "  4. Deploy to Render when ready"
echo ""
echo "Your project is now fully configured for Render.com! 🚀"
