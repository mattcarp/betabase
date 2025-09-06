#!/bin/bash
# test-claude-code-setup.sh - Comprehensive test for Claude Code configuration

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Claude Code Configuration Test Suite ===${NC}"
echo ""

# Test 1: Check if we're in SIAM directory
echo -e "${BLUE}Test 1: Project Detection${NC}"
if [[ -f "package.json" ]] && grep -q '"name": "siam"' package.json; then
    echo -e "${GREEN}✓${NC} In SIAM project directory"
else
    echo -e "${RED}✗${NC} Not in SIAM directory"
    exit 1
fi

# Test 2: Check symlinks
echo -e "\n${BLUE}Test 2: Design System Symlinks${NC}"
for file in .cursorrules .windsurfrules .vscode/design-system.md; do
    if [[ -L "$file" ]]; then
        target=$(readlink "$file")
        if [[ "$target" == *"design-system.md" ]]; then
            echo -e "${GREEN}✓${NC} $file → design-system.md"
        else
            echo -e "${RED}✗${NC} $file points to wrong target"
        fi
    else
        echo -e "${RED}✗${NC} $file is not a symlink"
    fi
done

# Test 3: Check Claude configuration
echo -e "\n${BLUE}Test 3: Claude Code Configuration${NC}"
if [[ -f ".claude/settings.json" ]]; then
    # Check for invalid fields
    if grep -q '"environment"' .claude/settings.json; then
        echo -e "${RED}✗${NC} Invalid 'environment' field found in settings.json"
    else
        echo -e "${GREEN}✓${NC} No invalid fields in settings.json"
    fi
    
    # Check for required sections
    if grep -q '"permissions"' .claude/settings.json; then
        echo -e "${GREEN}✓${NC} Permissions section exists"
    else
        echo -e "${YELLOW}⚠${NC} No permissions section"
    fi
    
    if grep -q '"hooks"' .claude/settings.json; then
        echo -e "${GREEN}✓${NC} Hooks section exists"
    else
        echo -e "${YELLOW}⚠${NC} No hooks section"
    fi
else
    echo -e "${RED}✗${NC} .claude/settings.json not found"
fi

# Test 4: Check subagents
echo -e "\n${BLUE}Test 4: Subagents${NC}"
expected_agents=("frontend-developer" "ui-designer" "code-reviewer" "voice-ui-specialist")
for agent in "${expected_agents[@]}"; do
    if [[ -f ".claude/agents/${agent}.md" ]]; then
        echo -e "${GREEN}✓${NC} ${agent} agent exists"
    else
        echo -e "${RED}✗${NC} ${agent} agent missing"
    fi
done

# Test 5: Check commands
echo -e "\n${BLUE}Test 5: Custom Commands${NC}"
expected_commands=("create-component" "review-design" "create-voice-component")
for cmd in "${expected_commands[@]}"; do
    if [[ -f ".claude/commands/${cmd}.md" ]]; then
        echo -e "${GREEN}✓${NC} /${cmd} command exists"
    else
        echo -e "${RED}✗${NC} /${cmd} command missing"
    fi
done

# Test 6: Check CLAUDE.md
echo -e "\n${BLUE}Test 6: Project Context${NC}"
if [[ -f "CLAUDE.md" ]]; then
    if grep -q "SIAM" CLAUDE.md && grep -q "Deepgram" CLAUDE.md; then
        echo -e "${GREEN}✓${NC} CLAUDE.md contains SIAM-specific context"
    else
        echo -e "${YELLOW}⚠${NC} CLAUDE.md exists but may need SIAM specifics"
    fi
else
    echo -e "${RED}✗${NC} CLAUDE.md not found"
fi

# Test 7: Check MCP configuration
echo -e "\n${BLUE}Test 7: MCP Configuration${NC}"
if [[ -f ".mcp.json" ]]; then
    if grep -q "aoma-mesh" .mcp.json; then
        echo -e "${GREEN}✓${NC} AOMA Mesh MCP configured"
    else
        echo -e "${YELLOW}⚠${NC} .mcp.json exists but no AOMA Mesh"
    fi
else
    echo -e "${YELLOW}⚠${NC} No .mcp.json file"
fi

echo -e "\n${BLUE}=== Test Summary ===${NC}"
echo "Run this in Claude Code to verify functionality:"
echo ""
echo "1. ${YELLOW}claude${NC} (start Claude Code)"
echo "2. ${YELLOW}/doctor${NC} (should show no errors)"
echo "3. ${YELLOW}Show me available subagents${NC}"
echo "4. ${YELLOW}What design system am I using?${NC}"
echo "5. ${YELLOW}@voice-ui-specialist create a voice indicator${NC}"
echo "6. ${YELLOW}/create-component TestButton${NC}"