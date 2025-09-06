# SIAM Infrastructure Recovery and Testing Plan

## Fiona's Emergency Action Plan - 2025-08-08

### CURRENT STATUS: SYSTEM DOWN 🚨

The SIAM application is completely non-functional due to Next.js build system failure. This document outlines the recovery steps and comprehensive testing strategy.

## PHASE 1: IMMEDIATE INFRASTRUCTURE RECOVERY

### Step 1: Build System Repair

```bash
# Kill current broken processes
pkill -f "next"

# Clear corrupted build artifacts
rm -rf .next/
rm -rf node_modules/.cache/

# Rebuild dependencies
npm install

# Full clean rebuild
npm run build
npm run dev
```

### Step 2: Health Check Verification

```bash
# Verify health endpoint
curl http://localhost:3000/api/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2025-08-08T...",
  "service": "siam-api"
}
```

### Step 3: Frontend Accessibility

```bash
# Verify frontend loads
curl http://localhost:3000/

# Should return HTML with SIAM content, not error pages
```

## PHASE 2: MCP TESTING INFRASTRUCTURE SETUP

### Configured MCP Servers

1. **TestSprite MCP** ✅
   - API Key: Configured
   - Status: Ready for automated testing
   - Use: AI-powered test generation and execution

2. **Playwright MCP** ✅
   - Installation: Complete
   - Status: Ready for browser automation
   - Use: End-to-end testing, visual testing

3. **Browser Tools MCP** ✅
   - Package: @eqiz/browser-tools-mcp-enhanced
   - Status: Ready for browser manipulation
   - Use: Advanced browser testing and debugging

### MCP Configuration File

```json
{
  "mcpServers": {
    "testsprite": {
      "command": "npx",
      "args": ["@testsprite/testsprite-mcp@latest"],
      "env": {
        "NODE_ENV": "development",
        "TESTSPRITE_API_KEY": "sk-user-..."
      }
    },
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp"],
      "env": {
        "NODE_ENV": "development"
      }
    },
    "browser-tools": {
      "command": "npx",
      "args": ["@eqiz/browser-tools-mcp-enhanced"],
      "env": {
        "NODE_ENV": "development"
      }
    }
  }
}
```

## PHASE 3: COMPREHENSIVE P0 TESTING STRATEGY

### P0-1: Authentication System Testing

**Requirements**:

- Dual email magic link support (fiona.burgess.ext@sonymusic.com, fiona@fionaburgess.com)
- Test account password authentication (claude@test.siam.ai)
- Email validation and domain restrictions
- Session persistence

**Test Cases**:

```javascript
// Test file: /tests/auth-flow.spec.js (already created)
- P0-1: Login form visibility and functionality
- P0-2: Test account authentication works
- P0-3: Magic link flow for authorized emails
- P0-4: Email validation works correctly
- P0-5: Dual email support (Fiona's requirement)
```

### P0-2: Chat Interface Testing

**Requirements**:

- Direct landing on chat interface post-auth
- AOMA-related query handling via langchain
- Senior engineer-level response quality
- Complex multi-part question support

**Test Strategy**:

```javascript
// Visual tests using Playwright MCP
- Chat UI elements visible
- Input field functional
- Response generation works
- AOMA knowledge integration
- Response quality validation
```

### P0-3: Document Upload System Testing

**Requirements**:

- Upload to ChatGPT Assistant (ID ending in `2nfM`)
- Immediate availability in langchain
- Support PDF, DOCX, images
- Visual upload confirmation
- No silent failures

**Test Strategy**:

```javascript
// File upload tests using Browser Tools MCP
- Upload interface accessibility
- File type validation
- Upload progress indication
- Success confirmation
- Query uploaded content immediately
```

### P0-4: Knowledge Curation Interface Testing

**Requirements**:

- View all uploaded documents
- Add/delete documents with feedback
- Correct wrong AI answers
- Audit trail of corrections
- Visible "Curate" tab in expert mode

**Current Status**: EMPTY TAB - UNACCEPTABLE
**Test Strategy**:

```javascript
// Knowledge management tests
- Curate tab visibility
- Document list display
- Add/remove functionality
- Answer correction workflow
- Audit trail verification
```

### P0-5: Test Management Interface Testing

**Requirements**:

- Comprehensive test suite management
- Test execution history
- Coverage metrics
- Integration with user workflows
- Pass/fail criteria based on user needs

**Test Strategy**:

```javascript
// Meta-testing: tests that test the test system
- Test tab functionality
- Test execution interface
- Coverage reporting
- User workflow integration
- Results interpretation
```

### P0-6: Settings & Admin Interface Testing

**Requirements**:

- Upper-right settings menu
- Langsmith settings and monitoring
- System health indicators
- Configuration without terminal access
- User-friendly admin controls

**Test Strategy**:

```javascript
// Settings and admin tests
- Settings menu accessibility
- Langsmith integration
- Health monitoring display
- Configuration changes persist
- Admin control functionality
```

## PHASE 4: INTEGRATION AND WORKFLOW TESTING

### End-to-End User Workflows

1. **New User Onboarding**:
   - Email validation → Magic link → First login → Chat interface

2. **Daily Usage Pattern**:
   - Login → Upload document → Query AOMA knowledge → Get expert response

3. **Knowledge Curation Workflow**:
   - Identify wrong answer → Correct via curation → Verify fix → Audit

4. **System Administration**:
   - Access settings → Monitor health → Adjust configuration → Verify changes

### Performance and Reliability Testing

```javascript
// Performance benchmarks
- Page load times < 2 seconds
- API response times < 500ms
- File upload handling for large documents
- Concurrent user simulation
- Memory leak detection
- Error recovery testing
```

## PHASE 5: AUTOMATED TESTING EXECUTION

### TestSprite MCP Integration

```bash
# AI-powered test generation
npx @testsprite/testsprite-mcp@latest generateCodeAndExecute

# Automatically scans codebase
# Generates contextual tests
# Executes and reports results
```

### Playwright MCP Integration

```bash
# Visual regression testing
# Cross-browser compatibility
# Mobile responsive testing
# Accessibility compliance
```

### Browser Tools MCP Integration

```bash
# Advanced browser manipulation
# Network monitoring
# Performance profiling
# Debug information capture
```

## SUCCESS CRITERIA

### Infrastructure Recovery Success:

- ✅ Application starts without errors
- ✅ All API endpoints respond correctly
- ✅ Frontend loads and displays properly
- ✅ Build process completes successfully

### P0 Feature Success:

- ✅ All 6 P0 features fully functional
- ✅ No critical bugs or failures
- ✅ Performance meets expectations
- ✅ User workflows complete successfully

### Testing Infrastructure Success:

- ✅ All MCP servers operational
- ✅ Automated tests running and passing
- ✅ Visual tests capturing regression issues
- ✅ Performance tests within acceptable limits

## TIMELINE EXPECTATIONS

- **Hour 1-2**: Infrastructure recovery and basic functionality
- **Hour 3-4**: P0 feature validation and testing
- **Hour 5-6**: Integration testing and workflow validation
- **Hour 7-8**: Performance testing and optimization
- **End of Day**: Complete system validation or clear blocker identification

## ESCALATION TRIGGERS

If any of these conditions are met, escalate immediately:

1. Infrastructure cannot be recovered within 2 hours
2. Any P0 feature completely non-functional after fixes
3. Critical security vulnerabilities discovered
4. Data loss or corruption detected
5. Performance degradation beyond acceptable limits

---

**This plan ensures comprehensive testing while maintaining focus on user needs and real-world functionality. No feature ships until it passes Fiona's acceptance criteria.**
