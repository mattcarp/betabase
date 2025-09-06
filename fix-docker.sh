#!/bin/bash

# 🔧 Docker Desktop Recovery Script

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔧 Docker Desktop Recovery Tool${NC}"
echo -e "${YELLOW}════════════════════════════════════${NC}"

# 1. Kill all Docker processes
echo -e "\n${CYAN}Step 1: Killing Docker processes...${NC}"
pkill -f Docker 2>/dev/null
pkill -f docker 2>/dev/null
pkill -f com.docker 2>/dev/null
sleep 2
echo -e "${GREEN}✓ Processes killed${NC}"

# 2. Clean up Docker socket and symlinks
echo -e "\n${CYAN}Step 2: Cleaning Docker sockets...${NC}"
rm -f ~/.docker/run/docker.sock 2>/dev/null
rm -f /var/run/docker.sock 2>/dev/null
sudo rm -f /var/run/docker.sock 2>/dev/null || true
echo -e "${GREEN}✓ Sockets cleaned${NC}"

# 3. Reset Docker Desktop permissions
echo -e "\n${CYAN}Step 3: Resetting permissions...${NC}"
rm -rf ~/Library/Containers/com.docker.docker/Data/vms 2>/dev/null
echo -e "${GREEN}✓ VM data reset${NC}"

# 4. Clear Docker Desktop cache
echo -e "\n${CYAN}Step 4: Clearing cache...${NC}"
rm -rf ~/Library/Containers/com.docker.docker/Data/com.docker.driver.amd64-linux 2>/dev/null
rm -rf ~/Library/Containers/com.docker.docker/Data/docker.raw.lock 2>/dev/null
echo -e "${GREEN}✓ Cache cleared${NC}"

# 5. Try to start Docker Desktop
echo -e "\n${CYAN}Step 5: Starting Docker Desktop...${NC}"
open -a Docker

echo -e "\n${YELLOW}Waiting for Docker to initialize (this may take 30-60 seconds)...${NC}"

# Wait for Docker to be ready
for i in {1..60}; do
    if docker info > /dev/null 2>&1; then
        echo -e "\n${GREEN}${BOLD}✅ Docker Desktop is running!${NC}"
        docker version
        exit 0
    fi
    printf "."
    sleep 2
done

echo -e "\n${RED}❌ Docker failed to start after 2 minutes${NC}"
echo -e "\n${YELLOW}Additional troubleshooting steps:${NC}"
echo "1. Open Docker Desktop manually from Applications"
echo "2. Check 'Preferences > Reset' > 'Reset to factory defaults'"
echo "3. Reinstall Docker Desktop from https://www.docker.com/products/docker-desktop/"
echo "4. Reboot your Mac (last resort)"

echo -e "\n${BLUE}Alternative: Use Docker alternatives:${NC}"
echo "• Colima: brew install colima && colima start"
echo "• Podman: brew install podman && podman machine init && podman machine start"
echo "• Rancher Desktop: brew install --cask rancher"

exit 1