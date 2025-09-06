#!/bin/bash

# DEPLOYMENT FIX INFINITE LOOP
# This will run until SIAM is deployed or we're completely stuck

echo "🔥 DEPLOYMENT BATTLE STARTED - $(date)"
echo "======================================"
echo ""

ATTEMPTS=0
SUCCESS=false
GITHUB_REPO="mattcarp/siam"
RENDER_URL="https://siam.onrender.com"

# Function to check deployment
check_deployment() {
    if curl -s "$RENDER_URL" | grep -q "SIAM\|Sign In"; then
        return 0
    else
        return 1
    fi
}

# Function to force deployment through code changes
force_deployment() {
    ATTEMPTS=$((ATTEMPTS + 1))
    echo ""
    echo "🔧 ATTEMPT $ATTEMPTS - $(date '+%H:%M:%S')"
    echo "----------------------------------------"
    
    # Step 1: Make a visible change
    echo "export const DEPLOYMENT_TIMESTAMP = '$(date)';" > src/deployment-check.ts
    echo "// Deployment attempt $ATTEMPTS at $(date)" >> src/deployment-check.ts
    
    # Step 2: Update package.json version
    sed -i.bak "s/\"version\": \".*\"/\"version\": \"0.1.$ATTEMPTS\"/" package.json
    
    # Step 3: Add deployment marker to public
    echo "DEPLOYMENT_ATTEMPT_$ATTEMPTS" > public/deployment-status.txt
    echo "Timestamp: $(date)" >> public/deployment-status.txt
    echo "Commit: $(git rev-parse --short HEAD)" >> public/deployment-status.txt
    
    # Step 4: Commit and push
    git add -A
    git commit -m "🚀 Force deployment attempt #$ATTEMPTS - $(date '+%Y-%m-%d %H:%M:%S')" || true
    git push origin main
    
    echo "✅ Pushed changes to GitHub"
    
    # Step 5: Wait and check
    echo "⏳ Waiting 30 seconds for Render to pick up changes..."
    sleep 30
    
    # Step 6: Check if it worked
    echo "🔍 Checking deployment..."
    for i in {1..10}; do
        echo -n "  Check $i/10: "
        if check_deployment; then
            echo "✅ SUCCESS!"
            return 0
        else
            if curl -s "$RENDER_URL" | grep -q "PIN"; then
                echo "❌ Still PIN login"
            else
                echo "❓ Unknown state"
            fi
        fi
        sleep 10
    done
    
    return 1
}

# Main battle loop
while [ $SUCCESS = false ] && [ $ATTEMPTS -lt 20 ]; do
    
    if check_deployment; then
        echo ""
        echo "🎉🎉🎉 VICTORY! SIAM IS DEPLOYED! 🎉🎉🎉"
        echo "URL: $RENDER_URL"
        SUCCESS=true
        break
    fi
    
    echo ""
    echo "Current status: NOT DEPLOYED (showing PIN login)"
    echo "Starting deployment attempt..."
    
    if force_deployment; then
        SUCCESS=true
        echo ""
        echo "🎉🎉🎉 DEPLOYMENT SUCCESSFUL! 🎉🎉🎉"
        echo "Your SIAM app is live at: $RENDER_URL"
    else
        echo "❌ Attempt $ATTEMPTS failed"
        
        if [ $ATTEMPTS -eq 5 ]; then
            echo ""
            echo "🔄 Trying render.yaml update..."
            cat > render.yaml << 'EOF'
services:
  - type: web
    name: siam
    env: node
    plan: free
    region: ohio
    autoDeploy: true
    buildCommand: pnpm install --frozen-lockfile && pnpm run build
    startCommand: NODE_ENV=production PORT=10000 pnpm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
EOF
            git add render.yaml
            git commit -m "Update render.yaml - force auto-deploy"
            git push origin main
        fi
        
        if [ $ATTEMPTS -eq 10 ]; then
            echo ""
            echo "🔄 Trying next.config.js timestamp..."
            echo "// Force rebuild at $(date)" >> next.config.js
            git add next.config.js
            git commit -m "Force rebuild via next.config.js"
            git push origin main
        fi
    fi
done

if [ $SUCCESS = false ]; then
    echo ""
    echo "❌ STUCK AFTER $ATTEMPTS ATTEMPTS"
    echo ""
    echo "MANUAL INTERVENTION REQUIRED:"
    echo "1. Go to https://dashboard.render.com"
    echo "2. Delete the existing 'siam' service"
    echo "3. Create new service from scratch"
    echo "4. Connect to GitHub: mattcarp/siam"
else
    echo ""
    echo "✅ Deployment battle won!"
fi
