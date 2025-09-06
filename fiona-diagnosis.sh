#!/bin/bash
# FIONA'S COMPREHENSIVE DEPLOYMENT DIAGNOSIS
# This will tell us EXACTLY what's wrong

echo "====================================="
echo "🔍 FIONA'S DEPLOYMENT INVESTIGATION"
echo "====================================="
echo ""

cd /Users/matt/Documents/projects/siam

echo "📋 1. Current Git Status:"
echo "-------------------------"
git status --short
echo ""

echo "📋 2. Last 3 Commits:"
echo "--------------------"
git log --oneline -3
echo ""

echo "📋 3. Check if LoginForm has Sign Up:"
echo "-------------------------------------"
grep -n "Sign Up" src/components/auth/LoginForm.tsx 2>/dev/null || echo "✅ No 'Sign Up' in LoginForm"
echo ""

echo "📋 4. Check MagicLinkLoginForm:"
echo "-------------------------------"
grep -n "Sign Up" src/components/auth/MagicLinkLoginForm.tsx 2>/dev/null || echo "✅ No 'Sign Up' in MagicLinkLoginForm"
echo ""

echo "📋 5. Find ANY file with Sign Up:"
echo "---------------------------------"
grep -r "Sign Up" --include="*.tsx" --include="*.jsx" src/ 2>/dev/null | head -5 || echo "✅ No 'Sign Up' found in src/"
echo ""

echo "📋 6. Railway Environment Check:"
echo "--------------------------------"
railway variables 2>&1 | grep -E "(COGNITO|NEXT_PUBLIC)" | head -10
echo ""

echo "📋 7. Check package.json build script:"
echo "--------------------------------------"
grep -A2 '"build"' package.json
echo ""

echo "📋 8. Check if there's a different deployed branch:"
echo "---------------------------------------------------"
railway status 2>&1 | grep -E "(branch|Branch)"
echo ""

echo "====================================="
echo "🎯 DIAGNOSIS COMPLETE"
echo "====================================="
