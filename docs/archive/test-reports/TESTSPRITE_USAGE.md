# TestSprite Testing Guide for SIAM

## ✅ TestSprite Setup Complete

TestSprite has been fully configured for automated testing of SIAM. All necessary files and configurations are in place.

## 📁 Created Files

1. **`testsprite-config.json`** - Main TestSprite configuration
   - Defines project settings, test environment, and API endpoints
   - Configured for localhost:3001 (update if using different port)

2. **`testsprite_tests/standard-prd.json`** - Product Requirements Document
   - Comprehensive PRD for TestSprite to understand SIAM's features
   - Includes all P0 requirements and success criteria

3. **`testsprite_tests/test-plan.md`** - Human-readable test plan
   - 18 test cases covering critical paths, features, and error handling
   - Includes code examples for each test

4. **`testsprite_tests/siam.test.js`** - Executable test suite
   - Ready-to-run JavaScript tests
   - Covers API endpoints, UI components, and performance

## 🚀 How to Run TestSprite Tests

### Option 1: Using TestSprite MCP (Recommended)

```bash
# TestSprite MCP is already configured in .mcp.json
# Simply restart Claude Code to load the MCP server
# Then use TestSprite commands in Claude

# Or run directly:
npx @testsprite/testsprite-mcp@latest
```

### Option 2: Using TestSprite CLI

```bash
# Install TestSprite CLI globally (if not installed)
npm install -g @testsprite/cli

# Run the test suite
testsprite test --config testsprite-config.json

# Run with specific test plan
testsprite run --plan testsprite_tests/test-plan.md
```

### Option 3: Manual Execution

```bash
# Bootstrap TestSprite (initializes testing environment)
testsprite bootstrap

# Generate code summary
testsprite generate-summary

# Run tests
testsprite execute --project siam
```

## 🔍 What TestSprite Will Test

### P0 Features (Critical Path)

- ✅ Application loads without errors
- ✅ API health endpoints respond (200 status)
- ✅ Chat interface accepts messages
- ✅ Navigation tabs are functional
- ✅ Document upload button is accessible
- ✅ Voice controls are present
- ✅ Live insights panel displays

### API Endpoints

- `/api/health` - Health check endpoint
- `/api/rpc` - RPC communication endpoint
- `/api/aoma-mcp` - AOMA integration endpoint

### Performance Metrics

- Page load time < 3 seconds
- API response time < 1 second
- No console errors
- Graceful error handling

## 🛠️ TestSprite Commands in Claude Code

When TestSprite MCP is active, you can use these commands:

```javascript
// Bootstrap testing environment
testsprite_bootstrap_tests();

// Generate code summary
testsprite_generate_code_summary();

// Generate normalized PRD
testsprite_generate_prd();

// Generate test plan
testsprite_generate_frontend_test_plan();
testsprite_generate_backend_test_plan();

// Execute tests
testsprite_generate_code_and_execute();

// Fix issues automatically
testsprite_fix_codebase();
```

## ⚠️ Current Issues to Fix

1. **Server Build Error**: The Next.js build has issues with missing modules
   - Run `rm -rf .next && npm run dev` to rebuild
2. **AOMA Backend**: Railway server connectivity issues
   - Check Railway deployment status
   - Verify environment variables

3. **Port Configuration**: Server may be on port 3000 or 3001
   - Update `testsprite-config.json` if needed

## 📊 Expected Test Results

When all tests pass, you should see:

- 18/18 tests passing
- 0 console errors
- All API endpoints returning 200
- UI components rendering correctly
- Performance within budget

## 🔧 Troubleshooting

If tests fail:

1. Check server is running (`npm run dev`)
2. Verify correct port in config
3. Check API endpoints manually:
   ```bash
   curl http://localhost:3001/api/health
   ```
4. Review TestSprite logs for detailed errors
5. Use `testsprite_fix_codebase()` for automatic fixes

## 📈 Next Steps

1. Fix the server build issues
2. Run TestSprite comprehensive test suite
3. Review test results and fix any failures
4. Re-run tests to verify fixes
5. Deploy with confidence!

TestSprite will automatically:

- Identify bugs and issues
- Suggest code fixes
- Re-run tests after fixes
- Generate comprehensive reports

**TestSprite is ready to validate SIAM and ensure it meets all requirements!**
