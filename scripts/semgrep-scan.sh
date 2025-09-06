#!/bin/bash

# SIAM Semgrep Security Scanner
# Quick security scanning with Semgrep for the SIAM project

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔒 SIAM Security Scan with Semgrep${NC}"
echo "=================================================="

# Check if semgrep is installed
if ! command -v semgrep &> /dev/null; then
    echo -e "${RED}❌ Semgrep not found. Installing...${NC}"
    pip install semgrep
fi

# Get project root
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

echo -e "${BLUE}📁 Scanning directory: $PROJECT_ROOT${NC}"

# Run comprehensive security scan
echo -e "${YELLOW}🔍 Running security scan...${NC}"

# Create reports directory
mkdir -p .security-reports

# Run different security rulesets
echo -e "${BLUE}Running JavaScript/TypeScript security rules...${NC}"
semgrep --config=auto --lang=javascript,typescript \
    --output=.security-reports/js-security.json \
    --json \
    --exclude="node_modules" \
    --exclude=".next" \
    --exclude="build" \
    --exclude="dist" \
    . || true

echo -e "${BLUE}Running OWASP Top 10 rules...${NC}"
semgrep --config=p/owasp-top-ten \
    --output=.security-reports/owasp.json \
    --json \
    --exclude="node_modules" \
    --exclude=".next" \
    --exclude="build" \
    --exclude="dist" \
    . || true

echo -e "${BLUE}Running React security rules...${NC}"
semgrep --config=p/react \
    --output=.security-reports/react-security.json \
    --json \
    --exclude="node_modules" \
    --exclude=".next" \
    --exclude="build" \
    --exclude="dist" \
    . || true

echo -e "${BLUE}Running secrets detection...${NC}"
semgrep --config=p/secrets \
    --output=.security-reports/secrets.json \
    --json \
    --exclude="node_modules" \
    --exclude=".next" \
    --exclude="build" \
    --exclude="dist" \
    . || true

# Generate summary report
echo -e "${YELLOW}📊 Generating security report...${NC}"

# Count findings by severity
CRITICAL=$(jq -r '.results[] | select(.extra.severity == "ERROR") | .extra.severity' .security-reports/*.json 2>/dev/null | wc -l || echo "0")
HIGH=$(jq -r '.results[] | select(.extra.severity == "WARNING") | .extra.severity' .security-reports/*.json 2>/dev/null | wc -l || echo "0")
MEDIUM=$(jq -r '.results[] | select(.extra.severity == "INFO") | .extra.severity' .security-reports/*.json 2>/dev/null | wc -l || echo "0")

echo ""
echo -e "${BLUE}🛡️  SECURITY SCAN RESULTS${NC}"
echo "=============================="
echo -e "${RED}Critical Issues: $CRITICAL${NC}"
echo -e "${YELLOW}High Issues: $HIGH${NC}"
echo -e "${BLUE}Medium Issues: $MEDIUM${NC}"
echo ""

# Show top issues if any found
if [ "$CRITICAL" -gt 0 ] || [ "$HIGH" -gt 0 ]; then
    echo -e "${RED}⚠️  Critical Security Issues Found!${NC}"
    echo "Review the detailed reports in .security-reports/"
    echo ""
    echo "Top issues:"
    jq -r '.results[] | select(.extra.severity == "ERROR" or .extra.severity == "WARNING") | "• \(.extra.message) (\(.path):\(.start.line))"' .security-reports/*.json 2>/dev/null | head -5 || true
else
    echo -e "${GREEN}✅ No critical security issues found!${NC}"
fi

echo ""
echo -e "${BLUE}📁 Detailed reports saved to:${NC}"
echo "  • .security-reports/js-security.json"
echo "  • .security-reports/owasp.json"  
echo "  • .security-reports/react-security.json"
echo "  • .security-reports/secrets.json"
echo ""
echo -e "${GREEN}🎉 Security scan complete!${NC}"