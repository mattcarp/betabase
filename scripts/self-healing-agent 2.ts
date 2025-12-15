import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import 'dotenv/config';

async function runHealerAgent() {
  console.log('🚑 Starting Healer Agent...');

  // 1. Run Tests
  console.log('🧪 Running tests to detect failures...');
  try {
    execSync('npx playwright test --reporter=json > test-results.json', { stdio: 'inherit' });
    console.log('✅ All tests passed!');
  } catch (error) {
    console.log('❌ Tests failed. Analyzing failures...');
  }

  // 2. Analyze Results
  if (!fs.existsSync('test-results.json')) {
    console.error('❌ No test results found.');
    return;
  }

  const results = JSON.parse(fs.readFileSync('test-results.json', 'utf-8'));
  const failures = results.suites.flatMap((suite: any) => 
    suite.specs.flatMap((spec: any) => 
      spec.tests.flatMap((test: any) => 
        test.results.filter((r: any) => r.status === 'failed').map((r: any) => ({
          file: spec.file,
          title: spec.title,
          error: r.errors[0]?.message,
          stack: r.errors[0]?.stack
        }))
      )
    )
  );

  if (failures.length === 0) {
    console.log('✨ No failures to heal.');
    return;
  }

  console.log(`🔍 Found ${failures.length} failures. Attempting to heal...`);

  // 3. Heal Loop
  for (const failure of failures) {
    console.log(`\n🩺 Healing: ${failure.title}`);
    console.log(`   File: ${failure.file}`);
    
    // Extract selector from error (heuristic)
    const selectorMatch = failure.error.match(/locator\('([^']+)'\)/) || failure.error.match(/waiting for selector "([^"]+)"/);
    const selector = selectorMatch ? selectorMatch[1] : null;

    if (!selector) {
      console.log('   ⚠️ Could not identify broken selector. Skipping.');
      continue;
    }

    // Call Self-Healing API
    try {
      // Note: In a real script we would fetch from the running localhost API or call the service directly.
      // For this script, we assume the API is running at localhost:3000
      const apiRes = await fetch('http://localhost:3000/api/self-healing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testName: failure.title,
          testFile: failure.file,
          originalSelector: selector,
          errorMessage: failure.error,
          codeContext: failure.stack.split('\n').slice(0, 10).join('\n') // heuristic context
        })
      });

      const attempt = await apiRes.json();
      
      if (attempt.tier === 1 && attempt.status === 'success') {
          console.log(`   ✅ Auto-healed! Confidence: ${(attempt.confidence * 100).toFixed(0)}%`);
          console.log(`   📝 Applying fix: ${attempt.original_selector} -> ${attempt.suggested_selector}`);
          
          // Apply fix via API
          await fetch('http://localhost:3000/api/self-healing/apply-fix', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  file: failure.file.replace(process.cwd() + '/', ''), // relative path
                  replacements: [{
                      search: attempt.original_selector,
                      replace: attempt.suggested_selector
                  }]
              })
          });
          console.log('   💾 File updated.');
      } else {
          console.log(`   Example: Tier ${attempt.tier} - Added to review queue.`);
      }

    } catch (e) {
      console.error('   ❌ Failed to heal:', e);
    }
  }
}

// Run if called directly
if (require.main === module) {
  runHealerAgent();
}
