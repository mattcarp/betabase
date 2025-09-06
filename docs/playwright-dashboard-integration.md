# Playwright Test Dashboard Integration

This document explains how the SIAM Test Dashboard now integrates with real Playwright test execution.

## Overview

The Test Dashboard has been enhanced to display **live test results** from actual Playwright test runs instead of mock data. This provides real-time visibility into test execution progress, results, and logs.

## Features

### ✅ What's New

- **Real Playwright Integration**: Execute actual Playwright tests through the dashboard
- **Live Streaming Updates**: Real-time test progress using Server-Sent Events
- **Custom Reporter**: Purpose-built reporter streams test events to dashboard
- **Execution Tracking**: Unique execution IDs for tracking test runs
- **Dual Mode Support**: Choose between streaming and polling modes
- **Live Logs Display**: See test output in real-time
- **Results Persistence**: Test results saved to `.playwright-results/` directory

### 🚀 How to Use

#### 1. Start the Application
```bash
npm run dev
```

#### 2. Navigate to Test Dashboard
- Go to `http://localhost:3000`
- Click on the **Test** tab
- You'll see the enhanced Test Dashboard interface

#### 3. Run Tests
- Click the **"Run Tests"** button
- Watch live test execution with real-time updates
- See progress indicators, statistics, and logs

#### 4. Monitor Results
- **Statistics Cards**: Live counts of passed/failed/skipped tests
- **Progress Bar**: Visual execution progress
- **Live Logs**: Real-time test output with emojis
- **Execution ID**: Track specific test runs

## Technical Implementation

### Files Created/Modified

#### New Files:
- `playwright-dashboard-reporter.js` - Custom Playwright reporter
- `playwright.config.dashboard.ts` - Dashboard-specific Playwright config
- `tests/global-setup.ts` - Global setup for dashboard integration
- `tests/global-teardown.ts` - Global teardown and cleanup
- `app/api/test/ws/route.ts` - WebSocket/SSE API for real-time updates
- `tests/dashboard-integration-test.spec.ts` - Integration validation tests

#### Modified Files:
- `app/api/test/execute/route.ts` - Real Playwright execution instead of mocks
- `src/components/test-dashboard/TestDashboard.tsx` - Enhanced with streaming
- `package.json` - Added `test:e2e:dashboard` script

### Architecture

```mermaid
graph LR
    A[Test Dashboard UI] --> B[/api/test/execute]
    A --> C[/api/test/ws SSE Stream]
    B --> D[Playwright Process]
    D --> E[Custom Reporter]
    E --> F[.playwright-results/]
    E --> C
    C --> A
```

### Data Flow

1. **Test Initiation**: Dashboard calls `/api/test/execute` API
2. **Process Spawn**: API spawns Playwright with custom reporter
3. **Event Streaming**: Reporter outputs JSON events to stdout
4. **Real-time Updates**: SSE stream sends events to dashboard
5. **UI Updates**: Dashboard updates statistics, progress, and logs
6. **Results Persistence**: Final results saved to filesystem

## Configuration Options

### Playwright Dashboard Config
```typescript
// playwright.config.dashboard.ts
reporter: [
  ['./playwright-dashboard-reporter.js'],  // Custom reporter
  ['json', { outputFile: '.playwright-results/results.json' }],
  ['line'] // Console output
]
```

### API Options
```javascript
// Test execution options
{
  testSuite: "all",           // Test suite to run
  testFiles: [],              // Specific files (empty = all)
  options: {
    parallel: true,           // Enable parallel execution
    workers: 2,              // Number of workers
    skipWebServer: false     // Skip starting web server
  }
}
```

## Usage Examples

### Run All Tests via Dashboard
1. Open Test Dashboard
2. Click "Run Tests"
3. Watch real-time execution

### Run Specific Tests via CLI
```bash
npm run test:e2e:dashboard tests/dashboard-integration-test.spec.ts
```

### Enable/Disable Streaming
- Click the streaming toggle button (📡/🔄)
- **Streaming Mode**: Real-time Server-Sent Events
- **Polling Mode**: Traditional 2-second polling

## Troubleshooting

### Common Issues

#### Tests Not Starting
- Check if Playwright is installed: `npx playwright install`
- Verify Node.js version compatibility
- Check console logs for spawn errors

#### Streaming Not Working
- Browser may not support Server-Sent Events
- Toggle to polling mode (🔄 button)
- Check network tab for API errors

#### No Test Results
- Check `.playwright-results/` directory permissions
- Verify custom reporter is executable
- Look for execution errors in logs

### Debug Commands

```bash
# Test dashboard config
npx playwright test --config=playwright.config.dashboard.ts --list

# Run with debug output
DEBUG=playwright:* npm run test:e2e:dashboard

# Check reporter output
npx playwright test --config=playwright.config.dashboard.ts --reporter=./playwright-dashboard-reporter.js
```

## Development Notes

### Custom Reporter Events
- `begin` - Test execution starts
- `testBegin` - Individual test starts  
- `testEnd` - Individual test completes
- `end` - All tests complete
- `error` - Execution error

### Statistics Format
```javascript
{
  total: 12,     // Total tests discovered
  passed: 10,    // Tests that passed
  failed: 1,     // Tests that failed
  skipped: 1,    // Tests skipped
  running: 0,    // Currently running
  duration: 45   // Execution time (seconds)
}
```

## Future Enhancements

- WebSocket true bidirectional communication
- Test filtering and selection UI
- Screenshot/video integration in dashboard  
- Test history and analytics
- Parallel execution visualization
- Integration with CI/CD pipelines

---

## Quick Start Summary

1. **Install**: `npm install` (Playwright already included)
2. **Start App**: `npm run dev`  
3. **Open Dashboard**: Go to Test tab at `http://localhost:3000`
4. **Run Tests**: Click "Run Tests" button
5. **Watch Magic**: See live Playwright test execution! ✨