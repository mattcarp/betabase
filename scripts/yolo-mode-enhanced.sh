#!/bin/bash

# YOLO Mode ENHANCED - Now with Auto Git Worktree Protection!
# Usage: ./scripts/yolo-mode-enhanced.sh [on|off|status]

CLAUDE_SETTINGS=".claude/settings.json"
YOLO_CONFIG=".claude/yolo-mode.json"
YOLO_EXTREME_CONFIG=".claude/yolo-mode-extreme.json"
NORMAL_BACKUP=".claude/settings.normal.json"
YOLO_STATE_FILE=".claude/yolo-state.json"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

function check_git_status() {
    # Check if we're in a git repo
    if ! git rev-parse --git-dir > /dev/null 2>&1; then
        echo -e "${RED}❌ Not in a git repository!${NC}"
        exit 1
    fi
    
    # Get current branch
    CURRENT_BRANCH=$(git branch --show-current)
    CURRENT_DIR=$(pwd)
    PROJECT_NAME=$(basename "$CURRENT_DIR")
    
    # Check if we're in a worktree
    IS_WORKTREE=false
    if git worktree list | grep -q "$(pwd)"; then
        if [ "$(git worktree list | head -1 | awk '{print $1}')" != "$(pwd)" ]; then
            IS_WORKTREE=true
        fi
    fi
    
    echo "$CURRENT_BRANCH:$IS_WORKTREE:$PROJECT_NAME:$CURRENT_DIR"
}

function create_yolo_worktree() {
    local timestamp=$(date +%Y%m%d-%H%M%S)
    local yolo_branch="yolo-session-$timestamp"
    local worktree_dir="../${1}-yolo-$timestamp"
    
    echo -e "${YELLOW}🌳 Creating YOLO worktree for maximum safety...${NC}"
    
    # Create new branch and worktree
    git worktree add "$worktree_dir" -b "$yolo_branch" > /dev/null 2>&1
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓${NC} Worktree created: $worktree_dir"
        echo -e "${GREEN}✓${NC} Branch created: $yolo_branch"
        
        # Save YOLO state
        cat > "$YOLO_STATE_FILE" << EOF
{
  "originalDir": "$(pwd)",
  "worktreeDir": "$worktree_dir",
  "branch": "$yolo_branch",
  "timestamp": "$timestamp"
}
EOF
        
        echo
        echo -e "${CYAN}${BOLD}🚀 SWITCHING TO YOLO WORKTREE 🚀${NC}"
        echo -e "${YELLOW}Run these commands to enter your YOLO sandbox:${NC}"
        echo
        echo -e "${GREEN}${BOLD}1. cd $worktree_dir${NC}"
        echo -e "${GREEN}${BOLD}2. ./scripts/yolo-mode-enhanced.sh activate${NC}"
        echo -e "${GREEN}${BOLD}3. claude .  ${RED}← CRITICAL: MUST RESTART!${NC}"
        echo
        echo -e "${MAGENTA}Settings only take effect after Claude Code restarts!${NC}"
        return 0
    else
        echo -e "${RED}❌ Failed to create worktree${NC}"
        return 1
    fi
}

function yolo_on() {
    local git_info=$(check_git_status)
    local current_branch=$(echo "$git_info" | cut -d: -f1)
    local is_worktree=$(echo "$git_info" | cut -d: -f2)
    local project_name=$(echo "$git_info" | cut -d: -f3)
    
    echo -e "${YELLOW}${BOLD}🔥 YOLO MODE ACTIVATION SEQUENCE 🔥${NC}"
    echo -e "${RED}${BOLD}YOU ONLY LIVE ONCE!${NC}"
    echo -e "${YELLOW}═══════════════════════════════════════${NC}"
    
    # Check if we're on main/master
    if [[ "$current_branch" == "main" || "$current_branch" == "master" ]] && [ "$is_worktree" == "false" ]; then
        echo -e "${RED}${BOLD}⚠️  SAFETY PROTOCOL ENGAGED ⚠️${NC}"
        echo -e "${YELLOW}You're on the ${BOLD}$current_branch${NC}${YELLOW} branch!${NC}"
        echo
        echo -e "${CYAN}For maximum YOLO power with safety, we'll create a worktree.${NC}"
        echo -e "${CYAN}This gives you:${NC}"
        echo -e "  ${GREEN}•${NC} Complete freedom to break things"
        echo -e "  ${GREEN}•${NC} Zero risk to main branch"
        echo -e "  ${GREEN}•${NC} EXTREME YOLO MODE (no approvals at all)"
        echo -e "  ${GREEN}•${NC} Easy cleanup - just delete the worktree"
        echo
        read -p "$(echo -e ${YELLOW}Create YOLO worktree? [Y/n]: ${NC})" -n 1 -r
        echo
        
        if [[ $REPLY =~ ^[Yy]$ ]] || [[ -z $REPLY ]]; then
            create_yolo_worktree "$project_name"
        else
            echo -e "${YELLOW}⚠️  Activating YOLO mode on main branch (dangerous!)${NC}"
            echo -e "${YELLOW}Using standard YOLO config (with some safety)${NC}"
            activate_standard_yolo
        fi
    else
        # We're either on a feature branch or in a worktree - FULL YOLO!
        if [ "$is_worktree" == "true" ]; then
            echo -e "${GREEN}${BOLD}✅ IN WORKTREE - EXTREME YOLO MODE AVAILABLE!${NC}"
            echo -e "${RED}${BOLD}NO BRAKES, NO APPROVALS, PURE CHAOS!${NC}"
            activate_extreme_yolo
        else
            echo -e "${GREEN}✅ On branch: ${BOLD}$current_branch${NC}"
            echo -e "${YELLOW}Safe enough for standard YOLO mode${NC}"
            activate_standard_yolo
        fi
    fi
}

function activate_standard_yolo() {
    # Backup current settings
    if [ -f "$CLAUDE_SETTINGS" ]; then
        cp "$CLAUDE_SETTINGS" "$NORMAL_BACKUP"
        echo -e "${GREEN}✓${NC} Backed up normal settings"
    fi
    
    # Apply standard YOLO config
    if [ -f "$YOLO_CONFIG" ]; then
        cp "$YOLO_CONFIG" "$CLAUDE_SETTINGS"
        echo -e "${GREEN}✓${NC} Standard YOLO permissions activated!"
        show_yolo_status "STANDARD"
    else
        echo -e "${RED}✗${NC} YOLO config not found at $YOLO_CONFIG"
        exit 1
    fi
}

function activate_extreme_yolo() {
    # Backup current settings
    if [ -f "$CLAUDE_SETTINGS" ]; then
        cp "$CLAUDE_SETTINGS" "$NORMAL_BACKUP"
        echo -e "${GREEN}✓${NC} Backed up normal settings"
    fi
    
    # Create EXTREME YOLO config - FIXED WITH PROPER WILDCARD PERMISSIONS
    echo -e "${YELLOW}Creating EXTREME YOLO config with FULL POWER...${NC}"
    cat > "$YOLO_EXTREME_CONFIG" << 'EOF'
{
  "version": "1.0",
  "yolo_mode": "EXTREME",
  "approval_policy": "APPROVE_EVERYTHING",
  "permissions": {
    "allow": [
      "*",
      "Bash(*)"
    ],
    "deny": [
      "Bash(rm -rf /)",
      "Bash(rm -rf /*)",
      "Bash(:(){ :|:& };:)"
    ]
  },
  "autoApprove": true,
  "skipAllConfirmations": true,
  "message": "YOLO EXTREME - IN WORKTREE, NO RULES!"
}
EOF
    
    # Apply EXTREME YOLO config
    cp "$YOLO_EXTREME_CONFIG" "$CLAUDE_SETTINGS"
    echo -e "${GREEN}✓${NC} ${RED}${BOLD}EXTREME${NC}${GREEN} YOLO permissions activated!${NC}"
    
    # CRITICAL: Tell user to restart Claude Code
    echo
    echo -e "${RED}${BOLD}⚠️  CRITICAL: RESTART CLAUDE CODE NOW! ⚠️${NC}"
    echo -e "${YELLOW}The settings only take effect after restart!${NC}"
    echo -e "${CYAN}Run: ${BOLD}claude .${NC}"
    echo
    
    show_yolo_status "EXTREME"
}

function show_yolo_status() {
    local mode=$1
    echo
    if [ "$mode" == "EXTREME" ]; then
        echo -e "${RED}${BOLD}🔥🔥🔥 EXTREME YOLO MODE ACTIVE 🔥🔥🔥${NC}"
        echo -e "${MAGENTA}${BOLD}WORKTREE PROTECTION = UNLIMITED POWER${NC}"
        echo
        echo -e "${CYAN}${BOLD}NO LIMITS, NO APPROVALS:${NC}"
        echo -e "  ${RED}🔥${NC} EVERY tool pre-approved"
        echo -e "  ${RED}🔥${NC} EVERY command instant"
        echo -e "  ${RED}🔥${NC} File operations? INSTANT!"
        echo -e "  ${RED}🔥${NC} Git commits? INSTANT!"
        echo -e "  ${RED}🔥${NC} Deploy to production? WHY NOT!"
        echo -e "  ${RED}🔥${NC} rm -rf? Still blocked (we're not insane)"
        echo
        echo -e "${YELLOW}${BOLD}YOU ARE A GOD IN THIS WORKTREE!${NC}"
    else
        echo -e "${CYAN}${BOLD}STANDARD YOLO MODE Active:${NC}"
        echo -e "  ${GREEN}•${NC} Most tools pre-approved"
        echo -e "  ${GREEN}•${NC} File operations allowed"
        echo -e "  ${GREEN}•${NC} Build/test/deploy ready"
        echo -e "  ${GREEN}•${NC} Some safety still in place"
    fi
    echo
    echo -e "${MAGENTA}${BOLD}🚀 LET'S FUCKING GOOOOO! 🚀${NC}"
    echo -e "${RED}${BOLD}YOLO! YOLO! YOLO! 🔥🔥🔥${NC}"
}

function yolo_off() {
    echo -e "${BLUE}${BOLD}🛡️  DEACTIVATING YOLO MODE 🛡️${NC}"
    echo -e "${BLUE}═══════════════════════════════════════${NC}"
    
    # Check if we should cleanup worktree
    if [ -f "$YOLO_STATE_FILE" ]; then
        echo -e "${YELLOW}Found YOLO worktree state${NC}"
        local original_dir=$(grep '"originalDir"' "$YOLO_STATE_FILE" | cut -d'"' -f4)
        local worktree_dir=$(grep '"worktreeDir"' "$YOLO_STATE_FILE" | cut -d'"' -f4)
        local branch=$(grep '"branch"' "$YOLO_STATE_FILE" | cut -d'"' -f4)
        
        echo
        read -p "$(echo -e ${YELLOW}Delete YOLO worktree and branch? [y/N]: ${NC})" -n 1 -r
        echo
        
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo -e "${YELLOW}Cleaning up YOLO worktree...${NC}"
            
            # If we're IN the worktree, we need to leave first
            if [[ "$(pwd)" == *"$worktree_dir"* ]]; then
                echo -e "${CYAN}Switching back to original directory...${NC}"
                cd "$original_dir"
            fi
            
            # Remove worktree
            git worktree remove "$worktree_dir" --force 2>/dev/null
            
            # Delete branch
            git branch -D "$branch" 2>/dev/null
            
            # Clean up state file
            rm -f "$YOLO_STATE_FILE"
            
            echo -e "${GREEN}✓${NC} YOLO worktree cleaned up"
        else
            echo -e "${YELLOW}Worktree preserved at: $worktree_dir${NC}"
        fi
    fi
    
    # Restore normal settings
    if [ -f "$NORMAL_BACKUP" ]; then
        cp "$NORMAL_BACKUP" "$CLAUDE_SETTINGS"
        echo -e "${GREEN}✓${NC} Normal settings restored"
        rm "$NORMAL_BACKUP"
        echo
        echo -e "${CYAN}${BOLD}Normal Mode Active:${NC}"
        echo -e "  ${BLUE}•${NC} Standard approval workflow restored"
        echo -e "  ${BLUE}•${NC} Safety checks enabled"
        echo
        echo -e "${GREEN}✅ Safe mode restored.${NC}"
    else
        echo -e "${YELLOW}⚠️${NC}  No backup found. YOLO may not have been active."
    fi
}

function yolo_status() {
    echo -e "${CYAN}${BOLD}📊 YOLO MODE STATUS 📊${NC}"
    echo -e "${CYAN}═══════════════════════════════════════${NC}"
    
    local git_info=$(check_git_status)
    local current_branch=$(echo "$git_info" | cut -d: -f1)
    local is_worktree=$(echo "$git_info" | cut -d: -f2)
    
    echo -e "${CYAN}Git Status:${NC}"
    echo -e "  Branch: ${BOLD}$current_branch${NC}"
    echo -e "  Worktree: $is_worktree"
    echo
    
    if [ -f "$NORMAL_BACKUP" ]; then
        if [ "$is_worktree" == "true" ]; then
            echo -e "${RED}${BOLD}🔥 EXTREME YOLO MODE ACTIVE! 🔥${NC}"
            echo -e "${MAGENTA}IN WORKTREE - NO RULES!${NC}"
        else
            echo -e "${YELLOW}${BOLD}🔥 STANDARD YOLO MODE ACTIVE 🔥${NC}"
        fi
    else
        echo -e "${BLUE}${BOLD}🛡️  YOLO MODE: OFF 🛡️${NC}"
        echo -e "Run ${BOLD}./scripts/yolo-mode-enhanced.sh on${NC} to activate"
    fi
    
    if [ -f "$YOLO_STATE_FILE" ]; then
        echo
        echo -e "${CYAN}YOLO Worktree Info:${NC}"
        cat "$YOLO_STATE_FILE" | grep -E '"(worktreeDir|branch)"' | sed 's/[",]//g' | sed 's/^/  /'
    fi
}

# Special command to activate in worktree (called after cd)
function activate_in_worktree() {
    echo -e "${RED}${BOLD}🔥 ACTIVATING EXTREME YOLO IN WORKTREE 🔥${NC}"
    activate_extreme_yolo
}

# Main script logic
case "$1" in
    on)
        yolo_on
        ;;
    off)
        yolo_off
        ;;
    activate)
        activate_in_worktree
        ;;
    status|"")
        yolo_status
        ;;
    *)
        echo -e "${BOLD}YOLO Mode ENHANCED - With Git Worktree Protection${NC}"
        echo
        echo "Usage: $0 [on|off|status]"
        echo
        echo "Commands:"
        echo "  on      - Activate YOLO (creates worktree if on main)"
        echo "  off     - Deactivate YOLO (optional worktree cleanup)"
        echo "  status  - Check current YOLO status"
        echo
        echo "Features:"
        echo "  • Auto-creates Git worktree when on main branch"
        echo "  • EXTREME mode in worktrees (no approvals at all)"
        echo "  • Standard mode on feature branches"
        echo "  • Easy cleanup when done"
        ;;
esac