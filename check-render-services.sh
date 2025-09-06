#!/bin/bash

echo "🔍 Checking for Render services..."
echo ""

# Check main URL
echo "1. Checking https://siam.onrender.com"
RESPONSE=$(curl -s https://siam.onrender.com | head -100)
if echo "$RESPONSE" | grep -q "SIAM"; then
    echo "   ✅ SIAM app found!"
elif echo "$RESPONSE" | grep -q "PIN"; then
    echo "   ❌ Still showing PIN login app"
else
    echo "   ❓ Unknown response"
fi

echo ""
echo "2. Checking potential new service URLs:"

# Check common variations
for url in "siam-blueprint" "siam-1" "siam-2" "siam-new"; do
    echo -n "   Trying https://${url}.onrender.com ... "
    CODE=$(curl -s -o /dev/null -w "%{http_code}" "https://${url}.onrender.com" --max-time 5)
    if [ "$CODE" = "200" ]; then
        echo "✅ Found! (HTTP 200)"
        if curl -s "https://${url}.onrender.com" | grep -q "SIAM"; then
            echo "   🎉 THIS IS YOUR SIAM APP!"
            echo "   URL: https://${url}.onrender.com"
            FOUND_URL="https://${url}.onrender.com"
            break
        fi
    else
        echo "($CODE)"
    fi
done

echo ""
echo "NEXT STEPS:"
echo "==========="
echo ""
echo "Since the Blueprint page seems stuck, try this:"
echo ""
echo "1. Go to main Render dashboard: https://dashboard.render.com"
echo ""
echo "2. Look for ANY of these:"
echo "   - A new service called 'siam' or 'siam-blueprint'"
echo "   - A service that's currently building"
echo "   - Any service connected to mattcarp/siam"
echo ""
echo "3. If you see a service building:"
echo "   - Click on it"
echo "   - Watch the build logs"
echo "   - It should show the Next.js build process"
echo ""
echo "4. If NO service exists:"
echo "   - Click 'New +' → 'Web Service' (not Blueprint)"
echo "   - Connect to GitHub repo: mattcarp/siam"
echo "   - Name: siam-working"
echo "   - Build: pnpm install --frozen-lockfile && pnpm run build"
echo "   - Start: NODE_ENV=production PORT=10000 pnpm start"
echo ""

if [ ! -z "$FOUND_URL" ]; then
    echo "🎉 YOUR APP IS LIVE AT: $FOUND_URL"
fi
