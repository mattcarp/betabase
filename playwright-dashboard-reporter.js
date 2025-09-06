/**
 * Custom Playwright Reporter for SIAM Test Dashboard Integration
 * Streams test execution events to the Test Dashboard via WebSocket
 */
class DashboardReporter {
  constructor(options = {}) {
    this.options = options;
    this.startTime = null;
    this.testResults = [];
    this.executionId = process.env.EXECUTION_ID || `exec_${Date.now()}`;
    this.stats = {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      running: 0,
      duration: 0
    };
  }

  printsToStdio() {
    return false;
  }

  onBegin(config, suite) {
    this.startTime = Date.now();
    this.stats.total = suite.allTests().length;
    this.stats.running = this.stats.total;
    
    console.log(JSON.stringify({
      type: 'begin',
      executionId: this.executionId,
      timestamp: new Date().toISOString(),
      stats: this.stats,
      totalTests: this.stats.total
    }));
  }

  onTestBegin(test, result) {
    console.log(JSON.stringify({
      type: 'testBegin',
      executionId: this.executionId,
      timestamp: new Date().toISOString(),
      test: {
        id: test.id,
        title: test.title,
        location: test.location,
        timeout: test.timeout
      }
    }));
  }

  onTestEnd(test, result) {
    // Update stats
    this.stats.running = Math.max(0, this.stats.running - 1);
    
    if (result.status === 'passed') {
      this.stats.passed++;
    } else if (result.status === 'failed') {
      this.stats.failed++;
    } else if (result.status === 'skipped') {
      this.stats.skipped++;
    }

    const testResult = {
      id: test.id,
      title: test.title,
      fullTitle: test.titlePath().join(' › '),
      status: result.status,
      duration: result.duration,
      error: result.error ? {
        message: result.error.message,
        stack: result.error.stack
      } : null,
      attachments: result.attachments || []
    };

    this.testResults.push(testResult);

    console.log(JSON.stringify({
      type: 'testEnd',
      executionId: this.executionId,
      timestamp: new Date().toISOString(),
      test: testResult,
      stats: { ...this.stats }
    }));
  }

  onStepBegin(test, result, step) {
    console.log(JSON.stringify({
      type: 'stepBegin',
      executionId: this.executionId,
      timestamp: new Date().toISOString(),
      test: {
        id: test.id,
        title: test.title
      },
      step: {
        title: step.title,
        category: step.category
      }
    }));
  }

  onStepEnd(test, result, step) {
    console.log(JSON.stringify({
      type: 'stepEnd',
      executionId: this.executionId,
      timestamp: new Date().toISOString(),
      test: {
        id: test.id,
        title: test.title
      },
      step: {
        title: step.title,
        category: step.category,
        duration: step.duration,
        error: step.error ? {
          message: step.error.message,
          stack: step.error.stack
        } : null
      }
    }));
  }

  onEnd(result) {
    const endTime = Date.now();
    this.stats.duration = Math.floor((endTime - this.startTime) / 1000);
    
    const finalResult = {
      type: 'end',
      executionId: this.executionId,
      timestamp: new Date().toISOString(),
      status: result.status,
      startTime: new Date(this.startTime).toISOString(),
      endTime: new Date(endTime).toISOString(),
      duration: this.stats.duration,
      stats: { ...this.stats },
      results: this.testResults
    };

    console.log(JSON.stringify(finalResult));
    
    // Write final results to a temporary file that the API can read
    const fs = require('fs');
    const path = require('path');
    const resultsDir = path.join(process.cwd(), '.playwright-results');
    
    try {
      if (!fs.existsSync(resultsDir)) {
        fs.mkdirSync(resultsDir, { recursive: true });
      }
      
      fs.writeFileSync(
        path.join(resultsDir, `${this.executionId}.json`),
        JSON.stringify(finalResult, null, 2)
      );
    } catch (error) {
      console.error('Failed to write results file:', error);
    }
  }

  onError(error) {
    console.log(JSON.stringify({
      type: 'error',
      executionId: this.executionId,
      timestamp: new Date().toISOString(),
      error: {
        message: error.message,
        stack: error.stack
      }
    }));
  }
}

module.exports = DashboardReporter;