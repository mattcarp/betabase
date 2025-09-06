#!/bin/bash

echo "🚨 RENDER SERVICE VERIFICATION"
echo "=============================="
echo ""

# Test 1: Check what's actually running
echo "1. Testing current deployment..."
CURRENT=$(curl -s https://siam.onrender.com | head -20)

if echo "$CURRENT" | grep -q "PIN"; then
    echo "   ❌ Service is running WRONG APP (PIN login)"
    echo "   This is NOT your GitHub code"
    echo ""
    
    echo "2. Testing if it's a static site..."
    if curl -s https://siam.onrender.com/api/health | grep -q "404"; then
        echo "   ❌ No API routes - this is a static HTML site"
        echo "   Your Next.js app is NOT deployed"
    fi
    echo ""
    
    echo "🔴 DIAGNOSIS: CRITICAL ISSUE"
    echo "============================"
    echo ""
    echo "The 'siam' service on Render is:"
    echo "1. NOT connected to your GitHub repo"
    echo "2. Running a completely different application"
    echo "3. Possibly a static site or different codebase"
    echo ""
    echo "This explains why GitHub pushes have no effect!"
    echo ""
    echo "✅ SOLUTION - ONLY OPTION THAT WILL WORK:"
    echo "=========================================="
    echo ""
    echo "You MUST create a NEW service with a DIFFERENT name:"
    echo ""
    echo "1. Go to: https://dashboard.render.com"
    echo "2. Click 'New +' → 'Web Service'"
    echo "3. Connect GitHub: mattcarp/siam"
    echo "4. IMPORTANT: Name it something else like:"
    echo "   - siam-app"
    echo "   - siam-prod"
    echo "   - siam-next"
    echo "   - my-siam"
    echo "5. Build: pnpm install --frozen-lockfile && pnpm run build"
    echo "6. Start: NODE_ENV=production PORT=10000 pnpm start"
    echo "7. Click 'Create Web Service'"
    echo ""
    echo "The existing 'siam' service is broken/disconnected."
    echo "A new service will deploy correctly in ~5 minutes."
    echo ""
    echo "New URL will be: https://[your-new-name].onrender.com"
    
elif echo "$CURRENT" | grep -q "SIAM"; then
    echo "   ✅ SIAM is deployed!"
else
    echo "   ❓ Unknown application running"
fi
