#!/bin/bash

echo "🚀 RENDER BLUEPRINT AUTO-DEPLOY"
echo "================================"
echo ""
echo "This will create a properly connected Render service"
echo ""

# Ensure render.yaml is correct
cat > render.yaml << 'EOF'
services:
  - type: web
    name: siam
    env: node
    plan: free
    region: ohio
    buildCommand: pnpm install --frozen-lockfile && pnpm run build
    startCommand: NODE_ENV=production PORT=10000 pnpm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
      - key: NEXT_PUBLIC_ENABLE_MCP_INTEGRATION
        value: "true"
      - key: NEXT_PUBLIC_COGNITO_USER_POOL_ID
        value: us-east-2_A0veaJRLo
      - key: NEXT_PUBLIC_COGNITO_CLIENT_ID
        value: 5c6ll37299p351to549lkg3o0d
      - key: NEXT_PUBLIC_AWS_REGION
        value: us-east-2
EOF

echo "✅ Updated render.yaml"
echo ""

# Commit changes
git add render.yaml
git commit -m "Update render.yaml for Render Blueprint deployment" || echo "No changes to commit"
git push origin main

echo ""
echo "✅ Pushed to GitHub"
echo ""
echo "NOW FOLLOW THESE STEPS:"
echo "======================="
echo ""
echo "1. Open: https://dashboard.render.com/blueprints"
echo ""
echo "2. Click 'New Blueprint Instance'"
echo ""
echo "3. Connect your GitHub account if needed"
echo ""
echo "4. Select repository: mattcarp/siam"
echo ""
echo "5. Render will detect render.yaml automatically"
echo ""
echo "6. Click 'Apply'"
echo ""
echo "7. Wait for deployment (~5 minutes)"
echo ""
echo "Your app will be at: https://siam.onrender.com"
echo ""
echo "This WILL work because Blueprint deployment:"
echo "- Automatically sets up GitHub webhook"
echo "- Enables auto-deploy by default"
echo "- Uses render.yaml configuration"
echo ""
echo "Monitoring deployment..."
echo ""

# Monitor
CHECK=0
while [ $CHECK -lt 40 ]; do
    CHECK=$((CHECK + 1))
    echo -n "[$CHECK/40] Checking... "
    
    if curl -s https://siam.onrender.com | grep -q "SIAM\|Sign In"; then
        echo ""
        echo ""
        echo "🎉🎉🎉 SUCCESS! SIAM IS DEPLOYED! 🎉🎉🎉"
        echo "https://siam.onrender.com"
        exit 0
    else
        echo "not yet"
    fi
    
    sleep 15
done

echo "Timeout - check https://dashboard.render.com manually"
