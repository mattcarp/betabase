#!/bin/bash

echo "🔧 RENDER AUTO-DEPLOY FIXER"
echo "============================"
echo ""

# First, let's check if we have a render.yaml
if [ -f "render.yaml" ]; then
    echo "✅ render.yaml found"
    echo ""
    echo "Current configuration:"
    cat render.yaml | head -10
    echo ""
fi

# Check GitHub webhook
echo "Checking GitHub repository webhooks..."
echo "Repository: mattcarp/siam"
echo ""

# Check if RENDER_API_KEY is set
if [ -z "$RENDER_API_KEY" ]; then
    echo "⚠️  RENDER_API_KEY not found in environment"
    echo ""
    echo "To get your API key:"
    echo "1. Go to https://dashboard.render.com/settings"
    echo "2. Click 'API Keys'"
    echo "3. Create or copy an existing key"
    echo "4. Run: export RENDER_API_KEY='your-key-here'"
    echo ""
else
    echo "✅ RENDER_API_KEY found"
    echo ""
    
    # Use Render API to check services
    echo "Fetching Render services..."
    SERVICES=$(curl -s -H "Authorization: Bearer $RENDER_API_KEY" \
        "https://api.render.com/v1/services?limit=20" | \
        python3 -m json.tool 2>/dev/null || echo "Failed to parse")
    
    if echo "$SERVICES" | grep -q "siam"; then
        echo "✅ Found 'siam' service on Render"
        
        # Extract service ID
        SERVICE_ID=$(echo "$SERVICES" | grep -B2 -A2 '"name": "siam"' | \
            grep '"id"' | head -1 | cut -d'"' -f4)
        
        if [ ! -z "$SERVICE_ID" ]; then
            echo "Service ID: $SERVICE_ID"
            echo ""
            
            # Check auto-deploy settings
            echo "Checking auto-deploy settings..."
            SERVICE_DETAILS=$(curl -s -H "Authorization: Bearer $RENDER_API_KEY" \
                "https://api.render.com/v1/services/$SERVICE_ID")
            
            if echo "$SERVICE_DETAILS" | grep -q '"autoDeploy": false'; then
                echo "❌ Auto-deploy is DISABLED!"
                echo ""
                echo "Enabling auto-deploy..."
                
                # Enable auto-deploy
                curl -X PATCH \
                    -H "Authorization: Bearer $RENDER_API_KEY" \
                    -H "Content-Type: application/json" \
                    -d '{"autoDeploy": true}' \
                    "https://api.render.com/v1/services/$SERVICE_ID"
                
                echo "✅ Auto-deploy enabled!"
            else
                echo "✅ Auto-deploy is already enabled"
            fi
            
            echo ""
            echo "Triggering manual deploy of latest commit..."
            
            # Trigger deploy
            DEPLOY_RESPONSE=$(curl -s -X POST \
                -H "Authorization: Bearer $RENDER_API_KEY" \
                -H "Content-Type: application/json" \
                -d '{"clearCache": false}' \
                "https://api.render.com/v1/services/$SERVICE_ID/deploys")
            
            if echo "$DEPLOY_RESPONSE" | grep -q '"id"'; then
                DEPLOY_ID=$(echo "$DEPLOY_RESPONSE" | grep '"id"' | head -1 | cut -d'"' -f4)
                echo "✅ Deploy triggered! ID: $DEPLOY_ID"
                echo ""
                echo "Monitoring deployment..."
                echo ""
                
                # Monitor deploy
                for i in {1..30}; do
                    DEPLOY_STATUS=$(curl -s -H "Authorization: Bearer $RENDER_API_KEY" \
                        "https://api.render.com/v1/deploys/$DEPLOY_ID" | \
                        grep '"status"' | cut -d'"' -f4)
                    
                    echo "[$i/30] Deploy status: $DEPLOY_STATUS"
                    
                    if [ "$DEPLOY_STATUS" = "live" ]; then
                        echo ""
                        echo "🎉 DEPLOYMENT SUCCESSFUL!"
                        break
                    elif [ "$DEPLOY_STATUS" = "build_failed" ] || [ "$DEPLOY_STATUS" = "deploy_failed" ]; then
                        echo ""
                        echo "❌ Deployment failed!"
                        echo "Check logs at: https://dashboard.render.com/web/$SERVICE_ID/logs"
                        break
                    fi
                    
                    sleep 10
                done
            else
                echo "❌ Failed to trigger deploy"
                echo "$DEPLOY_RESPONSE"
            fi
        fi
    else
        echo "❌ 'siam' service not found on Render"
        echo ""
        echo "Available services:"
        echo "$SERVICES" | grep '"name"' | head -5
    fi
fi

echo ""
echo "Alternative: Manual fix via Dashboard"
echo "======================================"
echo "1. Go to: https://dashboard.render.com"
echo "2. Click on your 'siam' service"
echo "3. Go to Settings → Build & Deploy"
echo "4. Ensure 'Auto-Deploy' is set to 'Yes'"
echo "5. Check GitHub repo is: mattcarp/siam"
echo "6. Click 'Manual Deploy' → 'Clear cache & deploy'"
