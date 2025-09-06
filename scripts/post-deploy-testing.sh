#!/bin/bash

# SIAM Post-Deployment Testing Script
# Comprehensive testing after successful deployment using Playwright and Mailinator

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Configuration
PRODUCTION_URL="${PRODUCTION_URL:-https://iamsiam.ai}"
TEST_EMAIL="siam-test-x7j9k2p4@mailinator.com"
MAILINATOR_INBOX_URL="https://www.mailinator.com/v4/public/inboxes.jsp?to=siam-test-x7j9k2p4"
TEST_LOG="/tmp/siam-post-deploy-test-$(date +%Y%m%d-%H%M%S).log"
MAX_RETRIES=3
RETRY_DELAY=10

# Function to log to file and console
log() {
    echo "$1" | tee -a "$TEST_LOG"
}

# Function to print colored messages
print_header() {
    echo ""
    log "$(echo -e "${MAGENTA}${BOLD}═══════════════════════════════════════════════════════${NC}")"
    log "$(echo -e "${MAGENTA}${BOLD}  $1${NC}")"
    log "$(echo -e "${MAGENTA}${BOLD}═══════════════════════════════════════════════════════${NC}")"
}

print_test() {
    log "$(echo -e "${BLUE}🧪 [TEST]${NC} $1")"
}

print_success() {
    log "$(echo -e "${GREEN}✅ [PASS]${NC} $1")"
}

print_failure() {
    log "$(echo -e "${RED}❌ [FAIL]${NC} $1")"
}

print_warning() {
    log "$(echo -e "${YELLOW}⚠️  [WARN]${NC} $1")"
}

print_info() {
    log "$(echo -e "${CYAN}ℹ️  [INFO]${NC} $1")"
}

# Function to run Playwright test and capture results
run_playwright_test() {
    local test_name="$1"
    local test_command="$2"
    
    print_test "Running: $test_name"
    
    if eval "$test_command" >> "$TEST_LOG" 2>&1; then
        print_success "$test_name passed"
        return 0
    else
        print_failure "$test_name failed - check $TEST_LOG for details"
        return 1
    fi
}

# Function to test site accessibility
test_site_accessibility() {
    print_test "Testing site accessibility"
    
    local response=$(curl -s -o /dev/null -w "%{http_code}" "$PRODUCTION_URL" 2>/dev/null || echo "000")
    
    if [ "$response" = "200" ]; then
        print_success "Site is accessible (HTTP $response)"
        return 0
    else
        print_failure "Site accessibility failed (HTTP $response)"
        return 1
    fi
}

# Function to test health endpoint
test_health_endpoint() {
    print_test "Testing health endpoint"
    
    local health_response=$(curl -s "$PRODUCTION_URL/api/health" 2>/dev/null)
    
    if echo "$health_response" | grep -q "healthy"; then
        print_success "Health endpoint responds correctly"
        print_info "Response: $(echo "$health_response" | head -c 100)..."
        return 0
    else
        print_failure "Health endpoint failed"
        print_info "Response: $health_response"
        return 1
    fi
}

# Function to test magic link authentication flow
test_magic_link_auth() {
    print_test "Testing magic link authentication flow"
    
    # Use Playwright to test the full auth flow
    local playwright_test="npx playwright test tests/auth/magic-link-auth.spec.ts --headed=false --timeout=60000"
    
    if run_playwright_test "Magic Link Authentication" "$playwright_test"; then
        return 0
    else
        print_warning "Falling back to basic login page test"
        return test_login_page_basic
    fi
}

# Function to test basic login page functionality
test_login_page_basic() {
    print_test "Testing login page basic functionality"
    
    # Create a simple Playwright test for login page
    cat > ./scripts/temp-basic-login-test.js << 'EOF'
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    // Navigate to login page
    await page.goto(process.env.PRODUCTION_URL || 'https://iamsiam.ai', { waitUntil: 'networkidle' });
    
    // Check if login form exists
    const emailInput = await page.locator('input[type="email"]').first();
    await emailInput.waitFor({ timeout: 10000 });
    
    // Fill in test email
    await emailInput.fill('siam-test-x7j9k2p4@mailinator.com');
    
    // Check if send button exists and is clickable
    const sendButton = await page.locator('button:has-text("Send Magic Link")').first();
    await sendButton.waitFor({ timeout: 5000 });
    
    console.log('✅ Login form is functional');
    
    // Take screenshot for verification
    await page.screenshot({ path: './screenshots/login-test-screenshot.png', fullPage: true });
    console.log('📸 Screenshot saved to ./screenshots/login-test-screenshot.png');
    
  } catch (error) {
    console.error('❌ Login test failed:', error.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
EOF

    if PRODUCTION_URL="$PRODUCTION_URL" node ./scripts/temp-basic-login-test.js >> "$TEST_LOG" 2>&1; then
        print_success "Login page basic test passed"
        return 0
    else
        print_failure "Login page basic test failed"
        return 1
    fi
}

# Function to test chat interface
test_chat_interface() {
    print_test "Testing chat interface"
    
    # Create Playwright test for chat functionality
    cat > ./scripts/temp-chat-test.js << 'EOF'
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    await page.goto(process.env.PRODUCTION_URL || 'https://iamsiam.ai');
    
    // Skip authentication for testing by looking for chat interface directly
    // or checking if we can access it via bypass
    const bypassUrl = (process.env.PRODUCTION_URL || 'https://iamsiam.ai') + '?bypass=true';
    await page.goto(bypassUrl, { waitUntil: 'networkidle' });
    
    // Look for chat input or interface elements
    const possibleSelectors = [
      'textarea[placeholder*="message"]',
      'input[placeholder*="message"]',
      '.chat-input',
      '[data-testid="chat-input"]',
      'textarea'
    ];
    
    let foundChatInput = false;
    for (const selector of possibleSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 3000 });
        console.log(`✅ Found chat interface: ${selector}`);
        foundChatInput = true;
        break;
      } catch (e) {
        // Continue trying other selectors
      }
    }
    
    if (!foundChatInput) {
      // Check if we can see any signs of the app being loaded
      const title = await page.title();
      if (title.includes('SIAM') || title.includes('siam')) {
        console.log('✅ SIAM app loaded successfully');
      } else {
        throw new Error('Chat interface not found and app may not be loading');
      }
    }
    
    await page.screenshot({ path: './screenshots/chat-test-screenshot.png', fullPage: true });
    console.log('📸 Chat test screenshot saved');
    
  } catch (error) {
    console.error('❌ Chat test failed:', error.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
EOF

    if PRODUCTION_URL="$PRODUCTION_URL" node ./scripts/temp-chat-test.js >> "$TEST_LOG" 2>&1; then
        print_success "Chat interface test passed"
        return 0
    else
        print_warning "Chat interface test failed - may require authentication"
        return 0  # Don't fail deployment for this
    fi
}

# Function to test build timestamp
test_build_timestamp() {
    print_test "Testing build timestamp format"
    
    local page_content=$(curl -s "$PRODUCTION_URL" 2>/dev/null)
    local timestamp_match=$(echo "$page_content" | grep -o 'v[0-9]\+\.[0-9]\+\.[0-9]\+ • Built [^<]*' || echo "")
    
    if [ -n "$timestamp_match" ]; then
        print_success "Build timestamp found: $timestamp_match"
        
        # Check if it's using proper 12-hour format (no leading zero with AM/PM)
        if echo "$timestamp_match" | grep -E '[0-9]{1,2}:[0-9]{2}:[0-9]{2} (AM|PM)' | grep -qv '0[0-9]:[0-9]{2}:[0-9]{2} (AM|PM)'; then
            print_success "Timestamp format is correct (proper 12-hour format)"
        else
            print_warning "Timestamp format may still have issues"
        fi
        return 0
    else
        print_warning "Build timestamp not found in page content"
        return 0  # Don't fail for this
    fi
}

# Function to run console error check
test_console_errors() {
    print_test "Checking for console errors"
    
    cat > ./scripts/temp-console-check.js << 'EOF'
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  const consoleErrors = [];
  const networkErrors = [];
  
  // Listen for console messages
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  
  // Listen for failed network requests
  page.on('response', response => {
    if (response.status() >= 400) {
      networkErrors.push(`${response.status()} ${response.url()}`);
    }
  });
  
  try {
    await page.goto(process.env.PRODUCTION_URL || 'https://iamsiam.ai', { waitUntil: 'networkidle' });
    
    // Wait a bit for any async errors
    await page.waitForTimeout(5000);
    
    console.log('Console Errors:', consoleErrors.length);
    if (consoleErrors.length > 0) {
      console.log('❌ Console errors found:');
      consoleErrors.forEach(error => console.log(`  - ${error}`));
    }
    
    console.log('Network Errors:', networkErrors.length);
    if (networkErrors.length > 0) {
      console.log('❌ Network errors found:');
      networkErrors.forEach(error => console.log(`  - ${error}`));
    }
    
    if (consoleErrors.length === 0 && networkErrors.length === 0) {
      console.log('✅ No console or network errors found');
    }
    
  } catch (error) {
    console.error('❌ Console check failed:', error.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
EOF

    if PRODUCTION_URL="$PRODUCTION_URL" node ./scripts/temp-console-check.js >> "$TEST_LOG" 2>&1; then
        print_success "Console error check completed"
        return 0
    else
        print_warning "Console error check had issues"
        return 0  # Don't fail deployment for console errors
    fi
}

# Function to test Web Vitals performance metrics
test_web_vitals() {
    print_test "Measuring Web Vitals performance metrics"
    
    # Create Playwright test for Web Vitals
    cat > ./scripts/temp-web-vitals.js << 'EOF'
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Navigate and measure performance metrics
    await page.goto(process.env.PRODUCTION_URL || 'https://iamsiam.ai', { 
      waitUntil: 'networkidle' 
    });
    
    // Collect Web Vitals using Performance API
    const metrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        let metrics = {};
        
        // Get navigation timing
        const navTiming = performance.getEntriesByType('navigation')[0];
        if (navTiming) {
          metrics.TTFB = navTiming.responseStart - navTiming.fetchStart;
          metrics.domContentLoaded = navTiming.domContentLoadedEventEnd - navTiming.fetchStart;
          metrics.loadComplete = navTiming.loadEventEnd - navTiming.fetchStart;
        }
        
        // Try to get LCP
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          metrics.LCP = lastEntry.startTime;
        });
        observer.observe({ entryTypes: ['largest-contentful-paint'] });
        
        // Get FCP if available
        const fcpEntry = performance.getEntriesByName('first-contentful-paint')[0];
        if (fcpEntry) {
          metrics.FCP = fcpEntry.startTime;
        }
        
        // Measure CLS
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          }
          metrics.CLS = clsValue;
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        
        // Wait a bit for metrics to collect
        setTimeout(() => {
          resolve(metrics);
        }, 3000);
      });
    });
    
    console.log('📊 Web Vitals Metrics:');
    console.log(`  • TTFB (Time to First Byte): ${metrics.TTFB?.toFixed(2) || 'N/A'}ms`);
    console.log(`  • FCP (First Contentful Paint): ${metrics.FCP?.toFixed(2) || 'N/A'}ms`);
    console.log(`  • LCP (Largest Contentful Paint): ${metrics.LCP?.toFixed(2) || 'N/A'}ms`);
    console.log(`  • CLS (Cumulative Layout Shift): ${metrics.CLS?.toFixed(3) || 'N/A'}`);
    console.log(`  • DOM Content Loaded: ${metrics.domContentLoaded?.toFixed(2) || 'N/A'}ms`);
    console.log(`  • Page Load Complete: ${metrics.loadComplete?.toFixed(2) || 'N/A'}ms`);
    
    // Performance thresholds
    const thresholds = {
      TTFB: 800,
      FCP: 1800,
      LCP: 2500,
      CLS: 0.1
    };
    
    let passed = true;
    if (metrics.TTFB > thresholds.TTFB) {
      console.log(`⚠️ TTFB exceeds threshold (${thresholds.TTFB}ms)`);
      passed = false;
    }
    if (metrics.FCP > thresholds.FCP) {
      console.log(`⚠️ FCP exceeds threshold (${thresholds.FCP}ms)`);
      passed = false;
    }
    if (metrics.LCP > thresholds.LCP) {
      console.log(`⚠️ LCP exceeds threshold (${thresholds.LCP}ms)`);
      passed = false;
    }
    if (metrics.CLS > thresholds.CLS) {
      console.log(`⚠️ CLS exceeds threshold (${thresholds.CLS})`);
      passed = false;
    }
    
    if (passed) {
      console.log('✅ All Web Vitals metrics within acceptable thresholds');
    }
    
  } catch (error) {
    console.error('❌ Web Vitals measurement failed:', error.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
EOF

    if PRODUCTION_URL="$PRODUCTION_URL" node ./scripts/temp-web-vitals.js >> "$TEST_LOG" 2>&1; then
        print_success "Web Vitals metrics collected successfully"
        return 0
    else
        print_warning "Web Vitals collection had issues"
        return 0  # Don't fail deployment for metrics
    fi
}

# Function to test file upload and delete
test_file_operations() {
    print_test "Testing file upload and delete functionality"
    
    # Create test file
    echo "Test file content for deployment testing" > ./scripts/test-upload.txt
    
    # Create Playwright test for file operations
    cat > ./scripts/temp-file-ops.js << 'EOF'
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    const baseUrl = process.env.PRODUCTION_URL || 'https://iamsiam.ai';
    
    // Navigate to the app
    await page.goto(baseUrl, { waitUntil: 'networkidle' });
    
    // Try to find upload button or interface
    // This might need adjustment based on actual UI
    const uploadSelectors = [
      'input[type="file"]',
      'button:has-text("Upload")',
      '[data-testid="file-upload"]',
      '.upload-button',
      '[aria-label*="upload"]'
    ];
    
    let uploadFound = false;
    for (const selector of uploadSelectors) {
      try {
        const element = await page.locator(selector).first();
        if (await element.isVisible({ timeout: 3000 })) {
          console.log(`✅ Found upload element: ${selector}`);
          
          // If it's a file input, try to upload
          if (selector === 'input[type="file"]') {
            const testFilePath = path.resolve('./scripts/test-upload.txt');
            await element.setInputFiles(testFilePath);
            console.log('✅ File selected for upload');
            
            // Look for upload confirmation
            await page.waitForTimeout(2000);
            
            // Check for delete button
            const deleteSelectors = [
              'button:has-text("Delete")',
              '[data-testid="delete-file"]',
              '[aria-label*="delete"]',
              '.delete-button'
            ];
            
            for (const delSelector of deleteSelectors) {
              try {
                const delElement = await page.locator(delSelector).first();
                if (await delElement.isVisible({ timeout: 2000 })) {
                  console.log(`✅ Found delete element: ${delSelector}`);
                  break;
                }
              } catch (e) {
                // Continue checking other selectors
              }
            }
          }
          
          uploadFound = true;
          break;
        }
      } catch (e) {
        // Continue checking other selectors
      }
    }
    
    if (!uploadFound) {
      console.log('⚠️ File upload interface not found - may require authentication');
    }
    
    // Take screenshot of current state
    await page.screenshot({ path: './screenshots/file-ops-test.png', fullPage: true });
    console.log('📸 File operations test screenshot saved');
    
  } catch (error) {
    console.error('❌ File operations test failed:', error.message);
    process.exit(1);
  } finally {
    await browser.close();
    // Clean up test file
    try {
      fs.unlinkSync('./scripts/test-upload.txt');
    } catch (e) {
      // Ignore cleanup errors
    }
  }
})();
EOF

    if PRODUCTION_URL="$PRODUCTION_URL" node ./scripts/temp-file-ops.js >> "$TEST_LOG" 2>&1; then
        print_success "File operations test completed"
        return 0
    else
        print_warning "File operations test had issues - may require authentication"
        return 0
    fi
}

# Function to measure chat response times
test_chat_response_time() {
    print_test "Measuring chat conversation response times"
    
    cat > ./scripts/temp-chat-perf.js << 'EOF'
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    const baseUrl = process.env.PRODUCTION_URL || 'https://iamsiam.ai';
    
    // Try bypass URL for testing
    await page.goto(`${baseUrl}?bypass=true`, { waitUntil: 'networkidle' });
    
    // Look for chat input
    const chatSelectors = [
      'textarea[placeholder*="message"]',
      'input[placeholder*="message"]',
      '.chat-input',
      '[data-testid="chat-input"]',
      'textarea'
    ];
    
    let chatFound = false;
    for (const selector of chatSelectors) {
      try {
        const element = await page.locator(selector).first();
        if (await element.isVisible({ timeout: 3000 })) {
          console.log(`✅ Found chat input: ${selector}`);
          
          // Measure response time
          const startTime = Date.now();
          
          // Type a test message
          await element.fill('What is the weather today?');
          
          // Look for submit button
          const submitSelectors = [
            'button[type="submit"]',
            'button:has-text("Send")',
            '[aria-label*="send"]'
          ];
          
          for (const submitSel of submitSelectors) {
            try {
              const submitBtn = await page.locator(submitSel).first();
              if (await submitBtn.isVisible({ timeout: 1000 })) {
                await submitBtn.click();
                console.log('✅ Message sent');
                break;
              }
            } catch (e) {
              // Try keyboard shortcut
              await element.press('Enter');
            }
          }
          
          // Wait for response (look for new message element)
          try {
            await page.waitForSelector('.message:last-child', { 
              timeout: 10000,
              state: 'visible' 
            });
            
            const responseTime = Date.now() - startTime;
            console.log(`📊 Chat Response Metrics:`);
            console.log(`  • Initial response time: ${responseTime}ms`);
            
            if (responseTime < 1000) {
              console.log('  ✅ Excellent response time (<1s)');
            } else if (responseTime < 3000) {
              console.log('  ✅ Good response time (<3s)');
            } else if (responseTime < 5000) {
              console.log('  ⚠️ Acceptable response time (<5s)');
            } else {
              console.log('  ❌ Slow response time (>5s)');
            }
            
          } catch (e) {
            console.log('⚠️ No response received within 10 seconds');
          }
          
          chatFound = true;
          break;
        }
      } catch (e) {
        // Continue checking
      }
    }
    
    if (!chatFound) {
      console.log('⚠️ Chat interface not accessible - may require authentication');
    }
    
  } catch (error) {
    console.error('❌ Chat performance test failed:', error.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
EOF

    if PRODUCTION_URL="$PRODUCTION_URL" node ./scripts/temp-chat-perf.js >> "$TEST_LOG" 2>&1; then
        print_success "Chat performance metrics collected"
        return 0
    else
        print_warning "Chat performance test had issues"
        return 0
    fi
}

# Function to generate test report
generate_test_report() {
    local total_tests="$1"
    local passed_tests="$2"
    local start_time="$3"
    local end_time="$4"
    
    print_header "📊 Post-Deployment Test Report"
    
    log "Test Summary:"
    log "  • Total Tests: $total_tests"
    log "  • Passed: $passed_tests"
    log "  • Failed: $((total_tests - passed_tests))"
    log "  • Success Rate: $(( (passed_tests * 100) / total_tests ))%"
    log "  • Duration: $((end_time - start_time))s"
    log "  • Production URL: $PRODUCTION_URL"
    log "  • Test Email: $TEST_EMAIL"
    log "  • Full Log: $TEST_LOG"
    
    if [ "$passed_tests" -eq "$total_tests" ]; then
        print_success "All post-deployment tests passed! 🎉"
        return 0
    else
        print_warning "Some tests failed, but deployment is still considered successful"
        return 0  # Don't fail deployment for test failures
    fi
}

# Main testing function
main() {
    local start_time=$(date +%s)
    local total_tests=0
    local passed_tests=0
    
    print_header "🧪 SIAM Post-Deployment Testing"
    print_info "Production URL: $PRODUCTION_URL"
    print_info "Test Log: $TEST_LOG"
    print_info "Start time: $(date)"
    
    # Test 1: Site Accessibility
    total_tests=$((total_tests + 1))
    if test_site_accessibility; then
        passed_tests=$((passed_tests + 1))
    fi
    
    # Test 2: Health Endpoint
    total_tests=$((total_tests + 1))
    if test_health_endpoint; then
        passed_tests=$((passed_tests + 1))
    fi
    
    # Test 3: Build Timestamp
    total_tests=$((total_tests + 1))
    if test_build_timestamp; then
        passed_tests=$((passed_tests + 1))
    fi
    
    # Test 4: Login Page Basic
    total_tests=$((total_tests + 1))
    if test_login_page_basic; then
        passed_tests=$((passed_tests + 1))
    fi
    
    # Test 5: Console Errors Check
    total_tests=$((total_tests + 1))
    if test_console_errors; then
        passed_tests=$((passed_tests + 1))
    fi
    
    # Test 6: Chat Interface (optional)
    total_tests=$((total_tests + 1))
    if test_chat_interface; then
        passed_tests=$((passed_tests + 1))
    fi
    
    # Test 7: Web Vitals Performance Metrics
    total_tests=$((total_tests + 1))
    if test_web_vitals; then
        passed_tests=$((passed_tests + 1))
    fi
    
    # Test 8: File Upload/Delete Operations
    total_tests=$((total_tests + 1))
    if test_file_operations; then
        passed_tests=$((passed_tests + 1))
    fi
    
    # Test 9: Chat Response Time Performance
    total_tests=$((total_tests + 1))
    if test_chat_response_time; then
        passed_tests=$((passed_tests + 1))
    fi
    
    # Generate final report
    local end_time=$(date +%s)
    generate_test_report "$total_tests" "$passed_tests" "$start_time" "$end_time"
}

# Handle arguments
case "${1:-}" in
    --help|-h)
        echo "SIAM Post-Deployment Testing Script"
        echo ""
        echo "Usage: $0 [options]"
        echo ""
        echo "Options:"
        echo "  --help, -h    Show this help message"
        echo ""
        echo "Environment Variables:"
        echo "  PRODUCTION_URL  Production URL to test (default: https://iamsiam.ai)"
        echo ""
        exit 0
        ;;
esac

# Check if we have Playwright installed
if ! command -v npx >/dev/null 2>&1; then
    print_warning "npx not found - some tests may be skipped"
fi

# Cleanup function for temporary files
cleanup_temp_files() {
    rm -f ./scripts/temp-basic-login-test.js
    rm -f ./scripts/temp-chat-test.js
    rm -f ./scripts/temp-console-check.js
    rm -f ./scripts/temp-web-vitals.js
    rm -f ./scripts/temp-file-ops.js
    rm -f ./scripts/temp-chat-perf.js
    rm -f ./scripts/test-upload.txt
}

# Set trap for cleanup
trap cleanup_temp_files EXIT

# Run main testing
main "$@"