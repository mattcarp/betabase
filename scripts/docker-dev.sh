#!/bin/bash

# 🚀 Docker Development Helper Script

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🐳 SIAM Docker Development Script${NC}"
echo -e "${YELLOW}═══════════════════════════════════════${NC}"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running!${NC}"
    echo -e "${YELLOW}Please start Docker Desktop first.${NC}"
    
    # Try to open Docker Desktop on macOS
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo -e "${YELLOW}Attempting to start Docker Desktop...${NC}"
        open -a Docker
        echo -e "${YELLOW}Waiting for Docker to start...${NC}"
        
        # Wait for Docker to be ready
        while ! docker info > /dev/null 2>&1; do
            printf "."
            sleep 2
        done
        echo -e "\n${GREEN}✅ Docker is now running!${NC}"
    else
        exit 1
    fi
fi

# Check for .env file
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  No .env file found. Creating from example...${NC}"
    if [ -f .env.example ]; then
        cp .env.example .env
        echo -e "${GREEN}✅ Created .env file from .env.example${NC}"
    else
        echo -e "${RED}❌ No .env.example file found!${NC}"
    fi
fi

# Main menu
echo
echo -e "${BLUE}What would you like to do?${NC}"
echo "1) 🔥 Start development environment (hot reload)"
echo "2) 🏭 Test production build locally"
echo "3) 🧪 Run tests in container"
echo "4) 🧹 Clean up Docker resources"
echo "5) 📜 Show logs"
echo "6) 🐚 Open shell in container"
echo "7) 🚀 Build for Render deployment"
echo "8) 📊 Show container stats"
echo "9) ❌ Exit"

read -p "Select an option (1-9): " choice

case $choice in
    1)
        echo -e "${YELLOW}🔥 Starting development environment...${NC}"
        make dev
        ;;
    2)
        echo -e "${BLUE}🏭 Testing production build...${NC}"
        make prod-test
        ;;
    3)
        echo -e "${YELLOW}🧪 Running tests...${NC}"
        make test
        ;;
    4)
        echo -e "${RED}🧹 Cleaning up...${NC}"
        make clean
        ;;
    5)
        echo -e "${BLUE}📜 Showing logs...${NC}"
        make logs
        ;;
    6)
        echo -e "${BLUE}🐚 Opening shell...${NC}"
        make shell
        ;;
    7)
        echo -e "${YELLOW}🚀 Building for Render...${NC}"
        make render-build
        ;;
    8)
        echo -e "${BLUE}📊 Container stats...${NC}"
        make stats
        ;;
    9)
        echo -e "${GREEN}👋 Goodbye!${NC}"
        exit 0
        ;;
    *)
        echo -e "${RED}Invalid option!${NC}"
        exit 1
        ;;
esac