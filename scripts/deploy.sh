#!/bin/bash

# SIAM Deployment Script - Rock-solid deployment with monitoring
# This script handles the complete deployment process with comprehensive monitoring

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
RENDER_SERVICE_ID="srv-d2f8f0emcj7s73eh647g"  # SIAM production service
PRODUCTION_URL="https://iamsiam.ai"
MAX_DEPLOY_WAIT=600  # 10 minutes max wait
HEALTH_CHECK_RETRIES=30
HEALTH_CHECK_DELAY=10

# Function to print colored messages
print_status() {
    echo -e "${BLUE}[DEPLOY]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if we're on a git worktree
is_worktree() {
    git rev-parse --is-inside-work-tree &>/dev/null && [ -f .git ]
}

# Function to get current branch
get_current_branch() {
    git rev-parse --abbrev-ref HEAD
}

# Function to check for uncommitted changes
has_uncommitted_changes() {
    ! git diff-index --quiet HEAD --
}

# Function to bump version
bump_version() {
    print_status "Bumping minor version..."
    
    # Get current version from package.json
    CURRENT_VERSION=$(node -p "require('./package.json').version")
    
    # Bump minor version using npm
    npm version minor --no-git-tag-version
    
    NEW_VERSION=$(node -p "require('./package.json').version")
    print_success "Version bumped from $CURRENT_VERSION to $NEW_VERSION"
}

# Function to monitor Render deployment
monitor_render_deployment() {
    local deploy_id=$1
    print_status "Monitoring Render deployment: $deploy_id"
    
    local start_time=$(date +%s)
    local timeout=$MAX_DEPLOY_WAIT
    
    while true; do
        # Get deployment status using Render CLI
        local status=$(render deploys show -s "$RENDER_SERVICE_ID" -d "$deploy_id" -o json 2>/dev/null | jq -r '.status' || echo "unknown")
        
        case $status in
            "live")
                print_success "Deployment is live!"
                return 0
                ;;
            "failed"|"canceled")
                print_error "Deployment $status"
                return 1
                ;;
            "build_failed")
                print_error "Build failed! Checking logs..."
                render logs "$RENDER_SERVICE_ID" --tail 50
                return 1
                ;;
            *)
                local current_time=$(date +%s)
                local elapsed=$((current_time - start_time))
                
                if [ $elapsed -gt $timeout ]; then
                    print_error "Deployment timeout after ${timeout} seconds"
                    return 1
                fi
                
                print_status "Status: $status (${elapsed}s elapsed)..."
                sleep 5
                ;;
        esac
    done
}

# Function to check health endpoint
check_health() {
    print_status "Checking health endpoint..."
    
    for i in $(seq 1 $HEALTH_CHECK_RETRIES); do
        if curl -s -f "$PRODUCTION_URL/api/health" > /dev/null 2>&1; then
            print_success "Health check passed!"
            return 0
        fi
        
        print_warning "Health check attempt $i/$HEALTH_CHECK_RETRIES failed, waiting ${HEALTH_CHECK_DELAY}s..."
        sleep $HEALTH_CHECK_DELAY
    done
    
    print_error "Health check failed after $HEALTH_CHECK_RETRIES attempts"
    return 1
}

# Function to verify deployment
verify_deployment() {
    print_status "Verifying deployment..."
    
    # Check if site is accessible
    if ! curl -s -I "$PRODUCTION_URL" | grep -q "200\|301\|302"; then
        print_error "Production site is not accessible"
        return 1
    fi
    
    print_success "Production site is accessible"
    
    # Check health endpoint
    if ! check_health; then
        return 1
    fi
    
    # Get build timestamp
    local build_time=$(curl -s "$PRODUCTION_URL" | grep -oP 'Build Time: \K[^<]+' || echo "unknown")
    print_success "Build timestamp: $build_time"
    
    return 0
}

# Main deployment process
main() {
    echo ""
    print_status "🚀 Starting SIAM deployment process..."
    echo ""
    
    # Step 1: Check current state
    print_status "Checking git status..."
    CURRENT_BRANCH=$(get_current_branch)
    print_status "Current branch: $CURRENT_BRANCH"
    
    # Check for uncommitted changes
    if has_uncommitted_changes; then
        print_error "Uncommitted changes detected! Please commit or stash them first."
        git status --short
        exit 1
    fi
    
    # Check if we're on a worktree (YOLO mode)
    if is_worktree; then
        print_warning "YOLO MODE DETECTED! Working in git worktree - let's ship it! 🔥"
    fi
    
    # Step 2: Handle branch management
    if [ "$CURRENT_BRANCH" != "main" ]; then
        print_status "Not on main branch. Merging $CURRENT_BRANCH to main..."
        
        # Switch to main
        git checkout main
        
        # Pull latest changes
        git pull origin main
        
        # Merge current branch
        git merge "$CURRENT_BRANCH" --no-edit
        
        print_success "Merged $CURRENT_BRANCH into main"
    else
        # Pull latest if we're already on main
        print_status "Pulling latest changes..."
        git pull origin main
    fi
    
    # Step 3: Bump version (triggers deployment)
    bump_version
    
    # Step 4: Commit and push
    print_status "Committing changes..."
    
    # Generate commit message
    COMMIT_MSG="chore: deploy v$(node -p "require('./package.json').version") to production"
    
    # Use git acm alias if available, otherwise standard commit
    if git config --get-regexp alias.acm > /dev/null 2>&1; then
        git acm "$COMMIT_MSG"
    else
        git add -A
        git commit -m "$COMMIT_MSG"
    fi
    
    print_status "Pushing to origin main..."
    git push origin main
    
    print_success "Code pushed to main branch"
    
    # Step 5: Monitor deployment
    print_status "Waiting for Render to detect push and start deployment..."
    sleep 10  # Give Render time to detect the push
    
    # Get the latest deployment ID
    DEPLOY_ID=$(render deploys list -s "$RENDER_SERVICE_ID" -o json --limit 1 2>/dev/null | jq -r '.[0].id' || echo "")
    
    if [ -z "$DEPLOY_ID" ]; then
        print_warning "Could not get deployment ID, monitoring via logs instead..."
        
        # Monitor logs directly
        print_status "Monitoring deployment logs..."
        render logs "$RENDER_SERVICE_ID" --tail 100 --follow &
        LOG_PID=$!
        
        # Wait for deployment to complete
        sleep 60
        kill $LOG_PID 2>/dev/null || true
    else
        # Monitor specific deployment
        if ! monitor_render_deployment "$DEPLOY_ID"; then
            print_error "Deployment failed!"
            
            # Show recent logs
            print_status "Recent logs:"
            render logs "$RENDER_SERVICE_ID" --tail 50
            
            exit 1
        fi
    fi
    
    # Step 6: Verify deployment
    print_status "Waiting for service to be fully ready..."
    sleep 20  # Give the service time to fully start
    
    if ! verify_deployment; then
        print_error "Deployment verification failed!"
        exit 1
    fi
    
    # Step 7: Final success
    echo ""
    print_success "🎉 Deployment successful!"
    print_success "Site is live at: $PRODUCTION_URL"
    print_success "Version: $(node -p "require('./package.json').version")"
    echo ""
    
    # Optional: Check GitHub Actions if configured
    if command -v gh &> /dev/null; then
        print_status "Checking GitHub Actions status..."
        gh run list --limit 1 || true
    fi
}

# Run main function
main "$@"