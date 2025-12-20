#!/bin/bash
# MAC Design System Compliance Checker
# Detects hardcoded CSS values that should use design system variables

set -e

RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

echo "MAC Design System Compliance Check"
echo "==================================="
echo ""

ISSUES_FOUND=0

# Check for hardcoded zinc border colors
echo "Checking for hardcoded zinc borders..."
ZINC_BORDERS=$(grep -r "border-zinc-\|border-b-zinc-\|border-t-zinc-\|border-l-zinc-\|border-r-zinc-" --include="*.tsx" --include="*.jsx" src/ 2>/dev/null | grep -v node_modules || true)
if [ -n "$ZINC_BORDERS" ]; then
    echo -e "${RED}FAIL: Found hardcoded zinc borders (use border-border instead):${NC}"
    echo "$ZINC_BORDERS" | head -20
    ISSUES_FOUND=$((ISSUES_FOUND + $(echo "$ZINC_BORDERS" | wc -l)))
    echo ""
fi

# Check for hardcoded gray borders
echo "Checking for hardcoded gray borders..."
GRAY_BORDERS=$(grep -r "border-gray-\|border-b-gray-\|border-t-gray-" --include="*.tsx" --include="*.jsx" src/ 2>/dev/null | grep -v node_modules || true)
if [ -n "$GRAY_BORDERS" ]; then
    echo -e "${RED}FAIL: Found hardcoded gray borders (use border-border instead):${NC}"
    echo "$GRAY_BORDERS" | head -20
    ISSUES_FOUND=$((ISSUES_FOUND + $(echo "$GRAY_BORDERS" | wc -l)))
    echo ""
fi

# Check for hardcoded hex colors in className
echo "Checking for hardcoded hex colors in className..."
HEX_COLORS=$(grep -r "className=.*#[0-9a-fA-F]\{3,6\}" --include="*.tsx" --include="*.jsx" src/ 2>/dev/null | grep -v node_modules || true)
if [ -n "$HEX_COLORS" ]; then
    echo -e "${RED}FAIL: Found hardcoded hex colors (use CSS variables instead):${NC}"
    echo "$HEX_COLORS" | head -20
    ISSUES_FOUND=$((ISSUES_FOUND + $(echo "$HEX_COLORS" | wc -l)))
    echo ""
fi

# Check for inline style colors
echo "Checking for inline style colors..."
INLINE_COLORS=$(grep -r "style={{.*color.*#\|style={{.*border.*#\|style={{.*background.*#" --include="*.tsx" --include="*.jsx" src/ 2>/dev/null | grep -v node_modules || true)
if [ -n "$INLINE_COLORS" ]; then
    echo -e "${YELLOW}WARN: Found inline styles with hardcoded colors:${NC}"
    echo "$INLINE_COLORS" | head -10
    ISSUES_FOUND=$((ISSUES_FOUND + $(echo "$INLINE_COLORS" | wc -l)))
    echo ""
fi

# Check for bg-zinc-* (common offender)
echo "Checking for hardcoded zinc backgrounds..."
ZINC_BG=$(grep -r "bg-zinc-[0-9]" --include="*.tsx" --include="*.jsx" src/ 2>/dev/null | grep -v node_modules | grep -v "bg-zinc-800/50" || true)
if [ -n "$ZINC_BG" ]; then
    echo -e "${YELLOW}WARN: Found hardcoded zinc backgrounds (consider using bg-background or mac-* classes):${NC}"
    echo "$ZINC_BG" | head -20
    echo ""
fi

# Summary
echo "==================================="
if [ $ISSUES_FOUND -eq 0 ]; then
    echo -e "${GREEN}PASS: No critical design system violations found${NC}"
    exit 0
else
    echo -e "${RED}FAIL: Found $ISSUES_FOUND potential design system violations${NC}"
    echo ""
    echo "Quick fixes:"
    echo "  - Replace border-zinc-* with border-border"
    echo "  - Replace bg-zinc-* with bg-background or mac-card-static"
    echo "  - Replace hardcoded hex colors with CSS variables"
    echo ""
    echo "See CLAUDE.md 'MAC Design System - MANDATORY CSS RULES' for details"
    exit 1
fi
