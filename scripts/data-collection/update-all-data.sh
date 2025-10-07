#!/bin/bash

###############################################################################
# Master Data Update Script
#
# Orchestrates all data collection scrapers for the SIAM/BetaBase project.
# Runs JIRA, Confluence, and AOMA scrapers in sequence.
#
# Requirements:
# - Must be on corporate VPN
# - Microsoft SSO credentials in environment (AAD_USERNAME, AAD_PASSWORD)
# - 2FA device available for MFA approval
# - Node.js and required npm packages installed
#
# Usage:
#   ./scripts/data-collection/update-all-data.sh
#   ./scripts/data-collection/update-all-data.sh --headless  (runs all in background)
#
# Environment Variables:
#   NEXT_PUBLIC_SUPABASE_URL      - Supabase URL
#   SUPABASE_SERVICE_ROLE_KEY     - Supabase service role key
#   OPENAI_API_KEY                - OpenAI API key for embeddings
#   AAD_USERNAME                  - Microsoft SSO username
#   AAD_PASSWORD                  - Microsoft SSO password
#   JIRA_BASE_URL                 - JIRA base URL (optional)
#
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
LOG_DIR="$PROJECT_ROOT/logs"
LOG_FILE="$LOG_DIR/update-all-data-$(date +%Y%m%d-%H%M%S).log"

# Parse arguments
HEADLESS_FLAG=""
if [[ "$*" == *"--headless"* ]]; then
  HEADLESS_FLAG="--headless"
fi

# Create log directory
mkdir -p "$LOG_DIR"

# Logging function
log() {
  local message="$1"
  local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
  echo -e "${message}" | tee -a "$LOG_FILE"
}

log_success() {
  log "${GREEN}✅ $1${NC}"
}

log_error() {
  log "${RED}❌ $1${NC}"
}

log_warning() {
  log "${YELLOW}⚠️  $1${NC}"
}

log_info() {
  log "${BLUE}ℹ️  $1${NC}"
}

# Check environment variables
check_env() {
  log_info "Checking environment variables..."

  local missing=()

  if [[ -z "$NEXT_PUBLIC_SUPABASE_URL" ]]; then
    missing+=("NEXT_PUBLIC_SUPABASE_URL")
  fi

  if [[ -z "$SUPABASE_SERVICE_ROLE_KEY" ]]; then
    missing+=("SUPABASE_SERVICE_ROLE_KEY")
  fi

  if [[ -z "$OPENAI_API_KEY" ]]; then
    missing+=("OPENAI_API_KEY")
  fi

  if [[ -z "$AAD_USERNAME" ]]; then
    missing+=("AAD_USERNAME")
  fi

  if [[ -z "$AAD_PASSWORD" ]]; then
    missing+=("AAD_PASSWORD")
  fi

  if [[ ${#missing[@]} -gt 0 ]]; then
    log_error "Missing required environment variables:"
    for var in "${missing[@]}"; do
      echo "  - $var"
    done
    echo ""
    echo "Please set these variables and try again."
    exit 1
  fi

  log_success "All required environment variables are set"
}

# Run scraper with error handling
run_scraper() {
  local name="$1"
  local script="$2"
  local start_time=$(date +%s)

  log ""
  log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  log_info "Starting $name scraper..."
  log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

  if node "$script" $HEADLESS_FLAG >> "$LOG_FILE" 2>&1; then
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    log_success "$name scraper completed in ${duration}s"
    return 0
  else
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    log_error "$name scraper failed after ${duration}s"
    return 1
  fi
}

###############################################################################
# Main Script
###############################################################################

main() {
  local start_time=$(date +%s)

  log "🚀 SIAM Data Collection Pipeline"
  log "=================================="
  log "Started at: $(date)"
  log "Mode: ${HEADLESS_FLAG:-interactive}"
  log "Log file: $LOG_FILE"
  log ""

  # Check environment
  check_env

  # Change to project root
  cd "$PROJECT_ROOT"

  # Track results
  local total=0
  local succeeded=0
  local failed=0

  # Run JIRA scraper
  total=$((total + 1))
  if run_scraper "JIRA" "$SCRIPT_DIR/scrape-jira.js"; then
    succeeded=$((succeeded + 1))
  else
    failed=$((failed + 1))
    log_warning "Continuing with remaining scrapers..."
  fi

  # Run Confluence scraper (when created)
  # total=$((total + 1))
  # if run_scraper "Confluence" "$SCRIPT_DIR/scrape-confluence.js"; then
  #   succeeded=$((succeeded + 1))
  # else
  #   failed=$((failed + 1))
  #   log_warning "Continuing with remaining scrapers..."
  # fi

  # Run AOMA scraper (when created)
  # total=$((total + 1))
  # if run_scraper "AOMA" "$SCRIPT_DIR/scrape-aoma.js"; then
  #   succeeded=$((succeeded + 1))
  # else
  #   failed=$((failed + 1))
  #   log_warning "Continuing with remaining scrapers..."
  # fi

  # Summary
  local end_time=$(date +%s)
  local total_duration=$((end_time - start_time))

  log ""
  log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  log "📊 PIPELINE SUMMARY"
  log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  log "Completed at: $(date)"
  log "Total duration: ${total_duration}s"
  log ""
  log_success "Succeeded: $succeeded/$total"
  if [[ $failed -gt 0 ]]; then
    log_error "Failed: $failed/$total"
  fi
  log ""
  log "📝 Full log: $LOG_FILE"
  log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

  # Exit with error if any scrapers failed
  if [[ $failed -gt 0 ]]; then
    exit 1
  fi

  log_success "All scrapers completed successfully! Fuck yeah! 🎉"
}

# Run main function
main
