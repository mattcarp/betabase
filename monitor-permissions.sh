#!/bin/bash

echo "🔍 Monitoring Railway deployment for permission fixes..."
echo "Waiting for new deployment to start building..."
sleep 10

# Monitor for 5 minutes
for i in {1..30}; do
  echo ""
  echo "=== Check $i/30 ($(date)) ==="
  
  # Get recent logs
  railway logs 2>/dev/null | tail -20 | grep -E "EACCES|permission|Error|Starting|Ready|mkdir|\.next" || echo "No permission errors found in recent logs"
  
  # Check deployment status
  railway status 2>/dev/null || echo "Status check failed"
  
  # Check if site is responding
  curl -s -o /dev/null -w "Health check: %{http_code}\n" https://iamsiam.ai/api/health
  
  sleep 10
done

echo "✅ Monitoring complete"