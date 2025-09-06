# SIAM TestSprite Comprehensive Testing Suite

This directory contains comprehensive TestSprite tests for the SIAM (Sentient Intelligence and Augmented Memory) AI chat interface. The tests combine Playwright functional testing with TestSprite visual regression testing to ensure both functionality and visual consistency.

## 🎯 Test Coverage

### 1. Authentication Flow Tests (`auth-flow.test.js`)

- **Magic Link Login Form Display**: Tests login form rendering and layout
- **Email Validation**: Tests email input validation and error states
- **Quick Access Buttons**: Tests Fiona's email quick-select functionality
- **Form Validation**: Tests error handling for invalid emails and domains
- **Loading States**: Tests authentication loading indicators
- **Success Flow Simulation**: Tests authenticated state transitions
- **Responsive Design**: Tests authentication UI across different screen sizes

### 2. AI Chat Interface Tests (`ai-chat-interface.test.js`)

- **Complete Interface Loading**: Tests main chat interface with all tabs
- **Tab Navigation**: Tests switching between Chat, HUD, Test, Fix, and Curate tabs
- **Chat Functionality**: Tests AI chat interaction and message sending
- **Suggestions System**: Tests chat suggestion buttons and interactions
- **Document Upload Interface**: Tests the Curate tab's document upload features
- **Responsive Design**: Tests UI across desktop, tablet, and mobile viewports
- **Loading & Error States**: Tests loading indicators and error handling
- **Complete User Workflow**: Tests end-to-end user journey through all features

### 3. Chat Functionality Tests (`chat-functionality.test.js`)

- **Chat Components**: Tests individual chat interface components
- **Message Sending**: Tests AI message sending and response flow
- **Input Behaviors**: Tests chat input field behaviors and validation
- **Specialized Assistants**: Tests Test, Debug, and Curation chat assistants
- **Message Formatting**: Tests different message types and formatting
- **Chat Persistence**: Tests conversation persistence across tab switches and refreshes

## 🏗️ Test Architecture

### Visual Regression Testing

- **TestSprite Integration**: Each test creates visual checkpoints using TestSprite
- **Baseline Management**: Visual baselines stored and compared automatically
- **Threshold Configuration**: 0.1 threshold for visual change detection
- **Multi-Viewport**: Tests across desktop (1440x900), tablet (768x1024), mobile (375x667)

### Functional Testing

- **Playwright Foundation**: Built on Playwright for robust browser automation
- **MAC Design Validation**: Ensures compliance with MAC Design System (no gradients, light typography)
- **User Journey Testing**: Tests complete workflows from authentication to AI interaction
- **Error State Coverage**: Tests loading states, error conditions, and edge cases

### Test Organization

```
testsprite_tests/
├── auth-flow.test.js              # Authentication testing
├── ai-chat-interface.test.js      # Main interface testing
├── chat-functionality.test.js     # Chat-specific functionality
├── run-comprehensive-tests.js     # Test runner script
├── validate-deployment.js         # Pre-flight validation
└── README.md                      # This documentation
```

## 🚀 Running the Tests

### Prerequisites

```bash
# Ensure Playwright is installed
npx playwright install

# Ensure TestSprite is available (optional but recommended)
npm install @testsprite/playwright
```

### Local Testing (Recommended)

```bash
# Start local development server
npm run dev

# Run all tests against local server
cd testsprite_tests
node run-comprehensive-tests.js
```

### Remote Testing

```bash
# Test against specific deployment
export SIAM_TEST_URL="https://your-deployment-url.com"
cd testsprite_tests
node run-comprehensive-tests.js
```

### Individual Test Suites

```bash
# Run specific test suite
npx playwright test auth-flow.test.js
npx playwright test ai-chat-interface.test.js
npx playwright test chat-functionality.test.js
```

### Update Visual Baselines

```bash
# When UI changes are intentional
export UPDATE_BASELINES=true
node run-comprehensive-tests.js
```

## 📊 Test Results

### Output Files

- `testsprite_results/` - Individual test results and visual diffs
- `comprehensive-test-report-{timestamp}.json` - Complete test execution summary
- Visual baselines stored by TestSprite for regression testing

### Success Criteria

- ✅ **100% Authentication Flow**: Magic link login works for Fiona's emails
- ✅ **Complete Tab Navigation**: All 5 tabs (Chat, HUD, Test, Fix, Curate) functional
- ✅ **AI Chat Interaction**: Message sending and AI response handling
- ✅ **Visual Consistency**: No unintended visual regressions
- ✅ **Responsive Design**: Works across all target viewport sizes
- ✅ **MAC Design Compliance**: No gradients, proper typography, dark theme

### Performance Benchmarks

- Page load time: < 3 seconds
- Tab switch time: < 500ms
- Chat response time: Variable (depends on AI backend)
- Visual rendering: Smooth animations and transitions

## 🎨 Visual Testing Strategy

### TestSprite Checkpoints

Each test creates multiple visual checkpoints:

- **Initial State**: Page/component first load
- **Interaction States**: During user interactions
- **Final States**: After actions complete
- **Error States**: When errors occur
- **Loading States**: During processing

### Baseline Management

- Initial baselines created on first run
- Automatic comparison on subsequent runs
- Manual baseline updates when changes are intentional
- Version control integration for baseline tracking

## 🔧 Configuration

### Environment Variables

- `SIAM_TEST_URL` - Target deployment URL (default: http://localhost:3000)
- `UPDATE_BASELINES` - Update visual baselines (default: false)
- `PLAYWRIGHT_HEADLESS` - Run tests headless (default: true)

### TestSprite Settings

- Project IDs: `siam-auth-flow`, `siam-chat-interface`, `siam-chat-functionality`
- Threshold: 0.1 (10% visual difference tolerance)
- Viewports: Desktop, tablet, mobile testing

## 📈 CI/CD Integration

### GitHub Actions Example

```yaml
name: SIAM TestSprite Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run build
      - run: npm run dev &
      - run: sleep 10
      - run: cd testsprite_tests && node run-comprehensive-tests.js
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: test-results
          path: testsprite_tests/testsprite_results/
```

## 🐛 Troubleshooting

### Common Issues

1. **Deployment 404**: Check if the target URL is accessible
2. **TestSprite Not Found**: Tests run without visual regression if package missing
3. **Timeout Errors**: Increase timeout for slower deployments
4. **Visual Differences**: Review and approve intentional UI changes

### Debug Mode

```bash
# Run with debug output
DEBUG=pw:api npx playwright test auth-flow.test.js --headed

# Run single test with full debugging
npx playwright test auth-flow.test.js --debug --headed
```

## 📋 Test Checklist

Before deploying, ensure:

- [ ] All authentication flows work for authorized emails
- [ ] Chat interface loads with all tabs functional
- [ ] AI chat interactions respond appropriately
- [ ] Document upload interface is accessible
- [ ] Visual baselines are current and approved
- [ ] Responsive design works across all viewport sizes
- [ ] No console errors or broken functionality
- [ ] Performance benchmarks are met

## 🔄 Maintenance

### Regular Tasks

- **Weekly**: Run full test suite against staging
- **Before releases**: Update baselines if UI changes made
- **After deployments**: Validate production deployment
- **Monthly**: Review and update test coverage

### Test Updates

Update tests when:

- New features are added
- UI components change significantly
- User workflows are modified
- New error states are introduced

---

## 📞 Support

For issues with the TestSprite test suite:

1. Check the troubleshooting section above
2. Review test output in `testsprite_results/`
3. Validate deployment accessibility with `validate-deployment.js`
4. Run individual test suites to isolate issues

**Remember**: These tests ensure Fiona can use SIAM effectively every day. Every test represents a real user need and workflow that must work reliably.
