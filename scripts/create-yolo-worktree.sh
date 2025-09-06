#!/bin/bash

# Create YOLO Worktree with Meaningful Names
# Usage: ./scripts/create-yolo-worktree.sh "fix-langsmith-and-icons"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# Get the mission name or use default
MISSION="${1:-yolo-session}"
# Sanitize the mission name (replace spaces with dashes, remove special chars)
CLEAN_MISSION=$(echo "$MISSION" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9-]/-/g' | sed 's/--*/-/g')

# Create timestamp
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

# Create names
BRANCH_NAME="yolo-${CLEAN_MISSION}-${TIMESTAMP}"
WORKTREE_DIR="../siam-yolo-${CLEAN_MISSION}"

echo -e "${YELLOW}${BOLD}🔥 CREATING YOLO WORKTREE 🔥${NC}"
echo -e "${RED}${BOLD}MISSION: ${MISSION}${NC}"
echo -e "${YELLOW}═══════════════════════════════════════${NC}"

# Check if worktree with this mission already exists
if [ -d "$WORKTREE_DIR" ]; then
    echo -e "${YELLOW}⚠️  Worktree for '${CLEAN_MISSION}' already exists!${NC}"
    read -p "$(echo -e ${YELLOW}Delete and recreate? [y/N]: ${NC})" -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Removing old worktree...${NC}"
        git worktree remove "$WORKTREE_DIR" --force 2>/dev/null
        # Also try to delete the branch
        git branch -D $(git branch -a | grep "yolo-${CLEAN_MISSION}" | head -1 | sed 's/^[* ]*//' | sed 's/remotes\/origin\///') 2>/dev/null
    else
        echo -e "${RED}Aborting...${NC}"
        exit 1
    fi
fi

# Create the worktree
echo -e "${GREEN}Creating worktree: ${BOLD}$WORKTREE_DIR${NC}"
git worktree add "$WORKTREE_DIR" -b "$BRANCH_NAME"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Worktree created successfully!${NC}"
    
    # Copy the enhanced YOLO script
    if [ -f "scripts/yolo-mode-enhanced.sh" ]; then
        cp scripts/yolo-mode-enhanced.sh "$WORKTREE_DIR/scripts/"
        chmod +x "$WORKTREE_DIR/scripts/yolo-mode-enhanced.sh"
        echo -e "${GREEN}✅ Enhanced YOLO script copied${NC}"
    fi
    
    # Copy any other YOLO configs
    if [ -d ".claude" ]; then
        cp -r .claude "$WORKTREE_DIR/"
        echo -e "${GREEN}✅ Claude configs copied${NC}"
    fi
    
    echo
    echo -e "${CYAN}${BOLD}🚀 YOUR YOLO SANDBOX IS READY! 🚀${NC}"
    echo
    echo -e "${GREEN}${BOLD}Step 1: Enter the worktree${NC}"
    echo -e "  ${YELLOW}cd $WORKTREE_DIR${NC}"
    echo
    echo -e "${GREEN}${BOLD}Step 2: Activate EXTREME YOLO${NC}"
    echo -e "  ${YELLOW}./scripts/yolo-mode-enhanced.sh activate${NC}"
    echo
    echo -e "${GREEN}${BOLD}Step 3: Restart Claude Code${NC}"
    echo -e "  ${YELLOW}claude .${NC}"
    echo
    echo -e "${MAGENTA}${BOLD}MISSION: ${MISSION}${NC}"
    echo -e "${RED}${BOLD}YOLO MODE: ENGAGED! 🔥🔥🔥${NC}"
else
    echo -e "${RED}❌ Failed to create worktree${NC}"
    exit 1
fi