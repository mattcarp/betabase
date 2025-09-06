#!/bin/bash

clear
echo "======================================================"
echo "     RENDER DEPLOYMENT MANUAL INTERVENTION GUIDE     "
echo "======================================================"
echo ""
echo "🚨 CRITICAL: Render is NOT auto-deploying from GitHub"
echo ""
echo "Current Status:"
echo "- GitHub Repo: mattcarp/siam ✅"
echo "- Latest Commit: $(git rev-parse --short HEAD) ✅"
echo "- Local Build: WORKING ✅"
echo "- Render Site: SHOWING WRONG APP ❌"
echo ""
echo "======================================================"
echo "IMMEDIATE ACTIONS REQUIRED:"
echo "======================================================"
echo ""
echo "1. OPEN RENDER DASHBOARD:"
echo "   👉 https://dashboard.render.com"
echo ""
echo "2. FIND YOUR SERVICE:"
echo "   Look for service named 'siam'"
echo ""
echo "3. CHECK CONNECTION:"
echo "   - Is it connected to GitHub?"
echo "   - Repository should be: mattcarp/siam"
echo "   - If not connected, click 'Connect GitHub'"
echo ""
echo "4. TRIGGER MANUAL DEPLOY:"
echo "   - Click 'Manual Deploy' button"
echo "   - Select 'Deploy latest commit'"
echo "   - Or click 'Clear build cache & deploy'"
echo ""
echo "5. ALTERNATIVE - CREATE NEW SERVICE:"
echo "   If the above doesn't work:"
echo "   - Click 'New +' → 'Web Service'"
echo "   - Connect GitHub repo: mattcarp/siam"
echo "   - Name: siam-fixed"
echo "   - Use these settings:"
echo "     • Runtime: Docker (we have Dockerfile now)"
echo "     • Or Runtime: Node"
echo "     • Build Command: pnpm install --frozen-lockfile && pnpm run build"
echo "     • Start Command: pnpm run start:prod"
echo ""
echo "======================================================"
echo "MONITORING WHILE YOU WORK:"
echo "======================================================"
echo ""
echo "I'll check the deployment every 10 seconds..."
echo ""

# Start monitoring
RENDER_URL="https://siam.onrender.com"
CHECK_COUNT=0

while true; do
    CHECK_COUNT=$((CHECK_COUNT + 1))
    echo -n "[$CHECK_COUNT] Checking $(date '+%H:%M:%S'): "
    
    # Quick check for SIAM
    if curl -s "$RENDER_URL" | grep -q "SIAM\|Sign In"; then
        echo ""
        echo ""
        echo "🎉🎉🎉 SUCCESS! SIAM IS NOW DEPLOYED! 🎉🎉🎉"
        echo "Your app is live at: $RENDER_URL"
        echo ""
        
        # Final test
        echo "Testing authentication..."
        curl -s "$RENDER_URL" | grep -o "SIAM.*" | head -1
        echo ""
        echo "✅ Deployment complete and verified!"
        exit 0
    elif curl -s "$RENDER_URL" | grep -q "PIN"; then
        echo "❌ Still showing wrong app (PIN login)"
    else
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$RENDER_URL")
        echo "Response: $HTTP_CODE"
    fi
    
    sleep 10
done
