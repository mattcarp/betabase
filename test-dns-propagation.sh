#!/bin/bash

echo "🔍 Testing DNS Propagation for SIAM Domains"
echo "==========================================="
echo ""

# Function to check DNS
check_dns() {
    local domain=$1
    echo "📡 Checking $domain..."
    
    # Check current DNS resolution
    echo -n "  DNS resolves to: "
    dig +short $domain | head -1
    
    # Check if it's pointing to Render
    if dig +short $domain | grep -q "216.24.57"; then
        echo "  ✅ DNS is pointing to Render!"
    elif dig +short $domain | grep -q "onrender.com"; then
        echo "  ✅ DNS is pointing to Render!"
    elif dig +short $domain | grep -q "66.33.22"; then
        echo "  ⚠️  DNS still pointing to Railway (old)"
    else
        echo "  ⏳ DNS propagation in progress..."
    fi
    
    # Test HTTP response
    echo -n "  HTTP status: "
    curl -s -o /dev/null -w "%{http_code}" -m 5 https://$domain 2>/dev/null || echo "timeout"
    
    echo ""
}

# Check both domains
check_dns "thebetabase.com"
check_dns "www.thebetabase.com"
check_dns "thebetabase.com"
check_dns "www.thebetabase.com"

echo "📊 DNS Propagation Status:"
echo "=========================="
echo ""
echo "If domains still show Railway IPs (66.33.22.x):"
echo "  → DNS hasn't propagated yet (wait 5-30 minutes)"
echo ""
echo "If domains show Render IPs (216.24.57.x):"
echo "  → DNS has propagated! Your sites should work."
echo ""
echo "You can also check propagation at:"
echo "  → https://dnschecker.org/#A/thebetabase.com"
echo "  → https://dnschecker.org/#A/thebetabase.com"