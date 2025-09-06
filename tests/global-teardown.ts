import { FullConfig } from '@playwright/test';

/**
 * Global teardown for all Playwright tests
 * Runs once after all tests complete
 */
async function globalTeardown(config: FullConfig) {
  console.log('\n🎭 Starting Playwright global teardown...');
  
  // Generate test summary if tests were run
  const fs = require('fs');
  const path = require('path');
  const testResultsDir = path.join(process.cwd(), 'test-results');
  
  if (fs.existsSync(testResultsDir)) {
    const resultFiles = fs.readdirSync(testResultsDir)
      .filter(f => f.endsWith('.json'));
    
    if (resultFiles.length > 0) {
      console.log(`📊 Found ${resultFiles.length} test result files`);
      
      // You could aggregate results here if needed
      // For now, just log the summary
      let passed = 0, failed = 0, skipped = 0;
      
      resultFiles.forEach(file => {
        try {
          const content = fs.readFileSync(
            path.join(testResultsDir, file), 
            'utf-8'
          );
          const data = JSON.parse(content);
          // Count results (structure depends on reporter)
          if (data.stats) {
            passed += data.stats.passed || 0;
            failed += data.stats.failed || 0;
            skipped += data.stats.skipped || 0;
          }
        } catch (e) {
          // Silent fail for malformed files
        }
      });
      
      console.log(`\n📈 Test Summary:`);
      console.log(`   ✅ Passed: ${passed}`);
      console.log(`   ❌ Failed: ${failed}`);
      console.log(`   ⏭️  Skipped: ${skipped}`);
    }
  }
  
  // Clean up any temporary files
  const tempFiles = [
    'test.log',
    'dev.log',
    '.test-auth-token'
  ];
  
  tempFiles.forEach(file => {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`🧹 Cleaned up: ${file}`);
    }
  });
  
  console.log('✅ Global teardown complete');
}

export default globalTeardown;
