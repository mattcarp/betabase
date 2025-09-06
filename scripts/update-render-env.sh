#!/bin/bash

# Script to update Render environment variables for SIAM
# This needs to be run manually or the variables need to be set in Render dashboard

echo "================================================"
echo "RENDER ENVIRONMENT VARIABLES UPDATE"
echo "================================================"
echo ""
echo "Please update the following environment variables in your Render dashboard:"
echo "https://dashboard.render.com/web/srv-d2es6heuk2gs73bpq6pg/env"
echo ""
echo "CRITICAL MCP SERVER VARIABLES (Railway):"
echo "----------------------------------------"
echo "NEXT_PUBLIC_AOMA_ENDPOINT=https://luminous-dedication-production.up.railway.app"
echo "NEXT_PUBLIC_AOMA_MESH_SERVER_URL=https://luminous-dedication-production.up.railway.app"
echo "NEXT_PUBLIC_AOMA_MESH_RPC_URL=https://luminous-dedication-production.up.railway.app/rpc"
echo "NEXT_PUBLIC_AOMA_MESH_HEALTH_URL=https://luminous-dedication-production.up.railway.app/health"
echo ""
echo "MCP INTEGRATION FLAGS:"
echo "----------------------"
echo "NEXT_PUBLIC_ENABLE_MCP_INTEGRATION=true"
echo "NEXT_PUBLIC_MCP_AUTO_REGISTER=true"
echo "NEXT_PUBLIC_MCP_HEALTH_CHECK_INTERVAL=30000"
echo ""
echo "OTHER REQUIRED VARIABLES:"
echo "-------------------------"
echo "NODE_ENV=production"
echo "NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-2_A0veaJRLo"
echo "NEXT_PUBLIC_COGNITO_CLIENT_ID=5c6ll37299p351to549lkg3o0d"
echo "NEXT_PUBLIC_AWS_REGION=us-east-2"
echo "NEXT_PUBLIC_ELEVENLABS_AGENT_ID=agent_01jz1ar6k2e8tvst14g6cbgc7m"
echo ""
echo "IMPORTANT: After updating, trigger a new deployment!"
echo "================================================"

# If render CLI is available, show current env vars
if command -v render &> /dev/null; then
    echo ""
    echo "Current environment variables on Render:"
    echo "----------------------------------------"
    render env --service srv-d2es6heuk2gs73bpq6pg -o json 2>/dev/null | jq -r '.[] | select(.key | contains("AOMA") or contains("MCP")) | "\(.key)=\(.value)"' || echo "Unable to fetch current env vars"
fi