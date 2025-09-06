#!/bin/bash

# YOLO Mode Toggle Script for Claude Code
# Usage: ./scripts/yolo-mode.sh [on|off|status]

CLAUDE_SETTINGS=".claude/settings.json"
YOLO_CONFIG=".claude/yolo-mode.json"
NORMAL_BACKUP=".claude/settings.normal.json"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

function yolo_on() {
    echo -e "${YELLOW}${BOLD}🔥 HOLY SHIT, ACTIVATING YOLO MODE! 🔥${NC}"
    echo -e "${RED}${BOLD}YOU ONLY LIVE ONCE, MOTHERFUCKER!${NC}"
    echo -e "${YELLOW}═══════════════════════════════════════${NC}"
    
    # Backup current settings
    if [ -f "$CLAUDE_SETTINGS" ]; then
        cp "$CLAUDE_SETTINGS" "$NORMAL_BACKUP"
        echo -e "${GREEN}✓${NC} Backed up your boring-ass normal settings"
    fi
    
    # Apply YOLO config
    if [ -f "$YOLO_CONFIG" ]; then
        cp "$YOLO_CONFIG" "$CLAUDE_SETTINGS"
        echo -e "${GREEN}✓${NC} YOLO permissions fucking ACTIVATED!"
        echo
        echo -e "${CYAN}${BOLD}YOLO Mode Active - NO BRAKES ON THIS TRAIN:${NC}"
        echo -e "  ${GREEN}•${NC} All tools pre-approved - fuck asking permission!"
        echo -e "  ${GREEN}•${NC} File operations? Just fucking do it!"
        echo -e "  ${GREEN}•${NC} Build/test/deploy? Hell yes, ship that shit!"
        echo -e "  ${GREEN}•${NC} Git operations instant - commit like you mean it!"
        echo -e "  ${GREEN}•${NC} Package management - install ALL the things!"
        echo -e "  ${GREEN}•${NC} Web searches - scrape the whole damn internet!"
        echo -e "  ${GREEN}•${NC} MCP tools - unleash the fucking kraken!"
        echo -e "  ${GREEN}•${NC} NO APPROVALS - because YOLO, bitches!"
        echo
        echo -e "${YELLOW}⚠️  YOLO mode says: Fuck safety checks!${NC}"
        echo -e "${RED}${BOLD}   REMEMBER: YOU ONLY LIVE ONCE!${NC}"
        echo -e "${YELLOW}   Use ${BOLD}./scripts/yolo-mode.sh off${NC}${YELLOW} when you're done being awesome.${NC}"
        echo
        echo -e "${MAGENTA}${BOLD}🚀 LET'S FUCKING GOOOOO! BUILD FAST, BREAK THINGS! 🚀${NC}"
        echo -e "${RED}${BOLD}   YOLO! YOLO! YOLO! 🔥🔥🔥${NC}"
    else
        echo -e "${RED}✗${NC} YOLO config not found at $YOLO_CONFIG"
        echo -e "${RED}   Can't go YOLO without the fucking config, dumbass!${NC}"
        exit 1
    fi
}

function yolo_off() {
    echo -e "${BLUE}${BOLD}🛡️  DEACTIVATING YOLO MODE 🛡️${NC}"
    echo -e "${BLUE}═══════════════════════════════════════${NC}"
    
    # Restore normal settings
    if [ -f "$NORMAL_BACKUP" ]; then
        cp "$NORMAL_BACKUP" "$CLAUDE_SETTINGS"
        echo -e "${GREEN}✓${NC} Normal settings restored"
        rm "$NORMAL_BACKUP"
        echo
        echo -e "${CYAN}${BOLD}Normal Mode Active:${NC}"
        echo -e "  ${BLUE}•${NC} Standard approval workflow restored"
        echo -e "  ${BLUE}•${NC} Dangerous operations blocked"
        echo -e "  ${BLUE}•${NC} Safety checks enabled"
        echo
        echo -e "${GREEN}✅ Safe mode restored. Claude will ask before major operations.${NC}"
    else
        echo -e "${YELLOW}⚠️${NC}  No backup found. YOLO mode may not have been active."
        echo -e "    Current settings remain unchanged."
    fi
}

function yolo_status() {
    echo -e "${CYAN}${BOLD}📊 YOLO MODE STATUS CHECK 📊${NC}"
    echo -e "${CYAN}═══════════════════════════════════════${NC}"
    
    if [ -f "$NORMAL_BACKUP" ]; then
        echo -e "${YELLOW}${BOLD}🔥 YOLO MODE: FUCKING ACTIVE! 🔥${NC}"
        echo -e "${RED}${BOLD}YOU'RE LIVING DANGEROUSLY - YOLO!${NC}"
        echo
        echo -e "Currently approved operations (aka: EVERYTHING!):"
        if [ -f "$CLAUDE_SETTINGS" ]; then
            # Count the allow rules
            ALLOW_COUNT=$(grep -c '"Bash(' "$CLAUDE_SETTINGS" 2>/dev/null || echo "0")
            echo -e "  ${GREEN}•${NC} ~$ALLOW_COUNT Bash patterns - NO QUESTIONS ASKED!"
            echo -e "  ${GREEN}•${NC} File operations - JUST FUCKING DO IT!"
            echo -e "  ${GREEN}•${NC} Web tools - SCRAPE ALL THE THINGS!"
            echo -e "  ${GREEN}•${NC} MCP servers - FULL BEAST MODE!"
            echo -e "  ${GREEN}•${NC} Remember: YOU ONLY LIVE ONCE!"
        fi
        echo
        echo -e "${YELLOW}Getting scared? Run ${BOLD}./scripts/yolo-mode.sh off${NC}${YELLOW} to be a pussy again${NC}"
        echo -e "${RED}${BOLD}But why would you? YOLO! 🔥🔥🔥${NC}"
    else
        echo -e "${BLUE}${BOLD}🛡️  YOLO MODE: OFF (boring mode active) 🛡️${NC}"
        echo
        echo -e "Currently in safe mode like a fucking coward."
        echo -e "Claude will ask permission for everything like a needy child."
        echo
        echo -e "${CYAN}Ready to be awesome? Run ${BOLD}./scripts/yolo-mode.sh on${NC}"
        echo -e "${RED}${BOLD}REMEMBER: YOU ONLY LIVE ONCE!${NC}"
    fi
    
    echo
    echo -e "${MAGENTA}${BOLD}Current permissions file:${NC} $CLAUDE_SETTINGS"
    echo -e "${YELLOW}${BOLD}Life motto: YOLO - You Only Live Once!${NC}"
}

# Main script logic
case "$1" in
    on)
        yolo_on
        ;;
    off)
        yolo_off
        ;;
    status|"")
        yolo_status
        ;;
    *)
        echo -e "${BOLD}YOLO Mode Toggle for Claude Code${NC}"
        echo
        echo "Usage: $0 [on|off|status]"
        echo
        echo "Commands:"
        echo "  on      - Activate YOLO mode (pre-approve most operations)"
        echo "  off     - Deactivate YOLO mode (restore normal safety)"
        echo "  status  - Check current YOLO mode status"
        echo
        echo "Example:"
        echo "  $0 on     # Start working without interruptions"
        echo "  $0 off    # Return to safe mode when done"
        ;;
esac