#!/bin/bash

echo "🚀 Monitoring production deployment..."
echo "Last commit: $(git log -1 --oneline)"
echo ""
echo "Checking production build time..."

while true; do
    # Fetch the production page and extract build time
    RESPONSE=$(curl -s https://thebetabase.com)
    BUILD_TIME=$(echo "$RESPONSE" | grep -oE 'Built[^<]*' | head -1)
    
    if [[ "$BUILD_TIME" == *"08/23/2025, 08"* ]] || [[ "$BUILD_TIME" == *"08/23/2025, 09"* ]] || [[ "$BUILD_TIME" == *"08/23/2025, 10"* ]]; then
        echo "✅ NEW DEPLOYMENT DETECTED!"
        echo "Build time: $BUILD_TIME"
        echo "Deployment complete!"
        break
    else
        echo "⏳ Current build: $BUILD_TIME (waiting for new deployment...)"
        sleep 30
    fi
done