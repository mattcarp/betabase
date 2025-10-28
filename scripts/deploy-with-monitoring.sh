#!/bin/bash

# SIAM Deployment Script with Full Monitoring
# Rock-solid deployment with Render MCP and GitHub Actions integration

set -e  # Exit on error
trap 'cleanup' EXIT ERR INT TERM

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Configuration
RENDER_SERVICE_ID="srv-d2f8f0emcj7s73eh647g"
PRODUCTION_URL="https://thebetabase.com"
MAX_DEPLOY_WAIT=600
HEALTH_CHECK_RETRIES=30
HEALTH_CHECK_DELAY=10
LOG_FILE="/tmp/siam-deploy-$(date +%Y%m%d-%H%M%S).log"

# Track deployment state
DEPLOY_STATE="starting"
CURRENT_BRANCH=""
ORIGINAL_BRANCH=""
DEPLOY_ID=""
GH_RUN_ID=""

# Function to log to file and console
log() {
    echo "$1" | tee -a "$LOG_FILE"
}

# Function to print colored messages
print_status() {
    log "$(echo -e "${BLUE}[DEPLOY]${NC} $1")"
}

print_success() {
    log "$(echo -e "${GREEN}✅ [SUCCESS]${NC} $1")"
}

print_warning() {
    log "$(echo -e "${YELLOW}⚠️  [WARNING]${NC} $1")"
}

print_error() {
    log "$(echo -e "${RED}❌ [ERROR]${NC} $1")"
}

print_info() {
    log "$(echo -e "${CYAN}ℹ️  [INFO]${NC} $1")"
}

print_header() {
    echo ""
    log "$(echo -e "${MAGENTA}${BOLD}═══════════════════════════════════════════════════════${NC}")"
    log "$(echo -e "${MAGENTA}${BOLD}  $1${NC}")"
    log "$(echo -e "${MAGENTA}${BOLD}═══════════════════════════════════════════════════════${NC}")"
    echo ""
}

# Cleanup function
cleanup() {
    if [ "$DEPLOY_STATE" = "failed" ]; then
        print_error "Deployment failed! Check log at: $LOG_FILE"
        
        # Attempt to restore original branch if we switched
        if [ -n "$ORIGINAL_BRANCH" ] && [ "$ORIGINAL_BRANCH" != "main" ]; then
            print_warning "Restoring original branch: $ORIGINAL_BRANCH"
            git checkout "$ORIGINAL_BRANCH" 2>/dev/null || true
        fi
    elif [ "$DEPLOY_STATE" = "success" ]; then
        print_success "Deployment log saved to: $LOG_FILE"
    fi
}

# Function to check prerequisites
check_prerequisites() {
    print_header "Checking Prerequisites"
    
    local missing_tools=()
    
    # Check required tools
    command -v git >/dev/null 2>&1 || missing_tools+=("git")
    command -v node >/dev/null 2>&1 || missing_tools+=("node")
    command -v npm >/dev/null 2>&1 || missing_tools+=("npm")
    command -v curl >/dev/null 2>&1 || missing_tools+=("curl")
    command -v jq >/dev/null 2>&1 || missing_tools+=("jq")
    
    if [ ${#missing_tools[@]} -gt 0 ]; then
        print_error "Missing required tools: ${missing_tools[*]}"
        exit 1
    fi
    
    # Check optional tools
    if command -v render >/dev/null 2>&1; then
        print_success "Render CLI found"
    else
        print_warning "Render CLI not found - will use API fallback"
    fi
    
    if command -v gh >/dev/null 2>&1; then
        print_success "GitHub CLI found"
    else
        print_warning "GitHub CLI not found - GitHub Actions monitoring disabled"
    fi
    
    # Check Render API key
    if [ -n "$RENDER_API_KEY" ]; then
        print_success "Render API key configured"
    else
        print_warning "RENDER_API_KEY not set - some features may be limited"
    fi
}

# Function to check git status
check_git_status() {
    print_header "Git Status Check"
    
    ORIGINAL_BRANCH=$(git rev-parse --abbrev-ref HEAD)
    CURRENT_BRANCH=$ORIGINAL_BRANCH
    
    print_info "Current branch: $CURRENT_BRANCH"
    
    # Check for uncommitted changes
    if ! git diff-index --quiet HEAD --; then
        print_error "Uncommitted changes detected!"
        print_info "Changed files:"
        git status --short
        
        read -p "Do you want to commit these changes? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            print_status "Committing changes..."
            git add -A
            git commit -m "chore: pre-deployment changes"
            print_success "Changes committed"
        else
            print_error "Deployment cancelled - please commit or stash changes"
            exit 1
        fi
    else
        print_success "Working tree clean"
    fi
    
    # Check if we're on a worktree
    if git rev-parse --is-inside-work-tree &>/dev/null && [ -f .git ]; then
        print_warning "🔥 YOLO MODE - Working in git worktree!"
    fi
}

# Function to merge to main
merge_to_main() {
    if [ "$CURRENT_BRANCH" != "main" ]; then
        print_header "Merging to Main Branch"
        
        print_status "Switching to main branch..."
        git checkout main
        
        print_status "Pulling latest changes..."
        git pull origin main --ff-only || {
            print_warning "Fast-forward not possible, attempting merge..."
            git pull origin main --no-edit
        }
        
        print_status "Merging $ORIGINAL_BRANCH into main..."
        git merge "$ORIGINAL_BRANCH" --no-edit || {
            print_error "Merge conflict detected!"
            print_info "Please resolve conflicts and run deployment again"
            exit 1
        }
        
        print_success "Successfully merged $ORIGINAL_BRANCH into main"
        CURRENT_BRANCH="main"
    else
        print_status "Already on main branch, pulling latest..."
        git pull origin main --ff-only || {
            print_warning "Fast-forward not possible, attempting merge..."
            git pull origin main --no-edit
        }
    fi
}

# Function to bump version
bump_version() {
    print_header "Version Bump"
    
    CURRENT_VERSION=$(node -p "require('./package.json').version")
    
    # Bump minor version
    npm version minor --no-git-tag-version
    
    NEW_VERSION=$(node -p "require('./package.json').version")
    print_success "Version bumped: $CURRENT_VERSION → $NEW_VERSION"
}

# Function to commit and push
commit_and_push() {
    print_header "Committing and Pushing"
    
    local version=$(node -p "require('./package.json').version")
    local commit_msg="chore: deploy v${version} to production

Deployment triggered via deploy script
Previous branch: $ORIGINAL_BRANCH
Author: Matt Carpenter"
    
    # Use git acm if available
    if git config --get-regexp alias.acm > /dev/null 2>&1; then
        git acm "$commit_msg"
    else
        git add -A
        git commit -m "$commit_msg"
    fi
    
    print_status "Pushing to origin main..."
    git push origin main || {
        print_error "Failed to push to origin"
        exit 1
    }
    
    print_success "Changes pushed successfully"
    
    # Get commit SHA
    COMMIT_SHA=$(git rev-parse HEAD)
    print_info "Commit SHA: $COMMIT_SHA"
}

# Function to monitor GitHub Actions
monitor_github_actions() {
    if ! command -v gh >/dev/null 2>&1; then
        return 0
    fi
    
    print_header "GitHub Actions Monitoring"
    
    print_status "Waiting for workflow to start..."
    sleep 5
    
    # Get the latest workflow run
    local run_info=$(gh run list --limit 1 --json databaseId,status,conclusion,headSha 2>/dev/null | jq -r '.[0]')
    
    if [ -n "$run_info" ] && [ "$run_info" != "null" ]; then
        GH_RUN_ID=$(echo "$run_info" | jq -r '.databaseId')
        local run_sha=$(echo "$run_info" | jq -r '.headSha')
        
        if [ "${run_sha:0:7}" = "${COMMIT_SHA:0:7}" ]; then
            print_info "GitHub Actions run: #$GH_RUN_ID"
            
            # Monitor the run
            print_status "Monitoring GitHub Actions..."
            gh run watch "$GH_RUN_ID" --exit-status || {
                print_warning "GitHub Actions workflow failed or was cancelled"
                return 1
            }
            
            print_success "GitHub Actions workflow completed successfully"
        else
            print_warning "No matching GitHub Actions run found for this commit"
        fi
    else
        print_warning "Could not fetch GitHub Actions status"
    fi
    
    return 0
}

# Function to get Render deployment ID
get_render_deploy_id() {
    print_status "Getting Render deployment ID..."
    
    # Try multiple methods to get deployment ID
    
    # Method 1: Render CLI
    if command -v render >/dev/null 2>&1; then
        DEPLOY_ID=$(render deploys list -s "$RENDER_SERVICE_ID" -o json --limit 1 2>/dev/null | jq -r '.[0].id' || echo "")
        
        if [ -n "$DEPLOY_ID" ]; then
            print_success "Got deployment ID via Render CLI: $DEPLOY_ID"
            return 0
        fi
    fi
    
    # Method 2: Render API
    if [ -n "$RENDER_API_KEY" ]; then
        local response=$(curl -s -H "Authorization: Bearer $RENDER_API_KEY" \
            "https://api.render.com/v1/services/$RENDER_SERVICE_ID/deploys?limit=1" 2>/dev/null)
        
        DEPLOY_ID=$(echo "$response" | jq -r '.[0].deploy.id' 2>/dev/null || echo "")
        
        if [ -n "$DEPLOY_ID" ]; then
            print_success "Got deployment ID via Render API: $DEPLOY_ID"
            return 0
        fi
    fi
    
    print_warning "Could not get deployment ID"
    return 1
}

# Function to monitor Render deployment
monitor_render_deployment() {
    print_header "Render Deployment Monitoring"
    
    # Wait for deployment to start
    print_status "Waiting for Render to detect push..."
    sleep 15
    
    # Get deployment ID
    if ! get_render_deploy_id; then
        print_warning "Monitoring via logs instead..."
        
        # Fallback to log monitoring
        if command -v render >/dev/null 2>&1; then
            print_status "Streaming deployment logs..."
            timeout 300 render logs "$RENDER_SERVICE_ID" --tail 100 --follow || true
        fi
        
        return 0
    fi
    
    # Use Python monitor if available
    if [ -f "scripts/monitor-deployment.py" ]; then
        print_status "Using advanced monitoring..."
        python3 scripts/monitor-deployment.py || {
            print_error "Deployment monitoring reported failure"
            return 1
        }
    else
        # Basic monitoring loop
        local start_time=$(date +%s)
        local last_status=""
        
        while true; do
            local elapsed=$(($(date +%s) - start_time))
            
            if [ $elapsed -gt $MAX_DEPLOY_WAIT ]; then
                print_error "Deployment timed out after ${MAX_DEPLOY_WAIT}s"
                return 1
            fi
            
            # Get deployment status
            local status="unknown"
            if command -v render >/dev/null 2>&1; then
                status=$(render deploys show -s "$RENDER_SERVICE_ID" -d "$DEPLOY_ID" -o json 2>/dev/null | jq -r '.status' || echo "unknown")
            fi
            
            if [ "$status" != "$last_status" ]; then
                case $status in
                    "live")
                        print_success "Deployment is live!"
                        return 0
                        ;;
                    "failed"|"canceled")
                        print_error "Deployment $status"
                        return 1
                        ;;
                    *)
                        print_status "Status: $status (${elapsed}s elapsed)"
                        ;;
                esac
                last_status=$status
            fi
            
            sleep 5
        done
    fi
}

# Function to verify deployment
verify_deployment() {
    print_header "Deployment Verification"
    
    local all_checks_passed=true
    
    # Check 1: Site accessibility
    print_status "Checking site accessibility..."
    if curl -s -I "$PRODUCTION_URL" | grep -q "200\|301\|302"; then
        print_success "Site is accessible"
    else
        print_error "Site is not accessible"
        all_checks_passed=false
    fi
    
    # Check 2: Health endpoint
    print_status "Checking health endpoint..."
    local health_ok=false
    for i in $(seq 1 $HEALTH_CHECK_RETRIES); do
        if curl -s -f "$PRODUCTION_URL/api/health" >/dev/null 2>&1; then
            print_success "Health check passed"
            health_ok=true
            break
        fi
        
        if [ $i -lt $HEALTH_CHECK_RETRIES ]; then
            print_warning "Health check attempt $i/$HEALTH_CHECK_RETRIES failed, retrying..."
            sleep $HEALTH_CHECK_DELAY
        fi
    done
    
    if ! $health_ok; then
        print_error "Health check failed"
        all_checks_passed=false
    fi
    
    # Check 3: Build timestamp
    print_status "Checking build timestamp..."
    local build_time=$(curl -s "$PRODUCTION_URL" | grep -oP 'Build Time: \K[^<]+' || echo "unknown")
    if [ "$build_time" != "unknown" ]; then
        print_success "Build timestamp: $build_time"
    else
        print_warning "Could not retrieve build timestamp"
    fi
    
    # Check 4: Console errors (if playwright is available)
    if command -v npx >/dev/null 2>&1 && [ -f "check-site-console.js" ]; then
        print_status "Checking for console errors..."
        if node check-site-console.js 2>/dev/null; then
            print_success "No console errors detected"
        else
            print_warning "Console check failed or found errors"
        fi
    fi
    
    return $([ "$all_checks_passed" = true ] && echo 0 || echo 1)
}

# Main deployment process
main() {
    print_header "🚀 SIAM Production Deployment"
    print_info "Start time: $(date)"
    print_info "Log file: $LOG_FILE"
    
    # Step 1: Prerequisites
    check_prerequisites
    
    # Step 2: Git status
    check_git_status
    
    # Step 3: Merge to main
    merge_to_main
    
    # Step 4: Bump version
    bump_version
    
    # Step 5: Commit and push
    commit_and_push
    
    # Step 6: Monitor GitHub Actions (non-blocking)
    monitor_github_actions &
    GH_PID=$!
    
    # Step 7: Monitor Render deployment
    if monitor_render_deployment; then
        DEPLOY_STATE="deployed"
    else
        DEPLOY_STATE="failed"
        print_error "Render deployment failed"
        wait $GH_PID 2>/dev/null || true
        exit 1
    fi
    
    # Wait for GitHub Actions to complete
    wait $GH_PID 2>/dev/null || true
    
    # Step 8: Wait for service to stabilize
    print_status "Waiting for service to stabilize..."
    sleep 20
    
    # Step 9: Verify deployment
    if verify_deployment; then
        DEPLOY_STATE="success"
    else
        DEPLOY_STATE="failed"
        print_error "Deployment verification failed"
        exit 1
    fi
    
    # Success!
    print_header "🎉 Deployment Successful!"
    print_success "Site: $PRODUCTION_URL"
    print_success "Version: $(node -p "require('./package.json').version")"
    print_success "Commit: ${COMMIT_SHA:0:7}"
    [ -n "$DEPLOY_ID" ] && print_success "Render Deploy: $DEPLOY_ID"
    [ -n "$GH_RUN_ID" ] && print_success "GitHub Run: #$GH_RUN_ID"
    print_success "Deployment log saved to: $LOG_FILE"
    
    # Step 10: Post-deployment testing
    if [ "${SKIP_TESTING:-false}" != "true" ]; then
        print_status "Running post-deployment tests..."
        if ./scripts/post-deploy-testing.sh; then
            print_success "Post-deployment tests completed"
        else
            print_warning "Some post-deployment tests failed, but deployment is still successful"
        fi
    else
        print_info "Skipping post-deployment tests (--skip-tests flag)"
    fi
    
    # Calculate deployment time (macOS compatible)
    local end_time=$(date +%s)
    local start_time=$(stat -f %B "$LOG_FILE" 2>/dev/null || echo "$end_time")
    local duration=$((end_time - start_time))
    if [ "$duration" -gt 0 ]; then
        print_info "Total deployment time: ${duration}s"
    fi
}

# Handle arguments
case "${1:-}" in
    --help|-h)
        echo "SIAM Deployment Script"
        echo ""
        echo "Usage: $0 [options]"
        echo ""
        echo "Options:"
        echo "  --help, -h        Show this help message"
        echo "  --dry-run         Show what would be done without executing"
        echo "  --skip-tests      Skip GitHub Actions tests"
        echo "  --skip-testing    Skip post-deployment testing with Playwright"
        echo ""
        exit 0
        ;;
    --dry-run)
        print_info "DRY RUN MODE - No changes will be made"
        check_prerequisites
        check_git_status
        print_info "Would bump version, commit, push, and deploy"
        exit 0
        ;;
    --skip-testing)
        export SKIP_TESTING=true
        shift
        ;;
esac

# Run main deployment
main "$@"