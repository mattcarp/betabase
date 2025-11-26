
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load env vars from .env.local
dotenv.config({ path: '.env.local' });

import { supabaseTestDB } from '../src/services/supabase-test-integration';

async function main() {
  console.log("Starting Phase 0 Evidence Capture...");
  const reportPath = path.join(process.cwd(), 'docs/demo-assets/evidence-report.md');
  let reportContent = "# Phase 0 Evidence Report\n\nGenerated at: " + new Date().toISOString() + "\n\n";

  // 1. Capture Chat Latency
  console.log("Running latency tests...");
  try {
    // Run the specific performance test
    const output = execSync('npx playwright test tests/e2e/siam-aoma-performance-validation.spec.ts --reporter=list', { encoding: 'utf-8' });
    
    // Extract latency from logs if possible, or just note pass/fail
    const latencyMatch = output.match(/Query completed in (\d+)ms/);
    const latency = latencyMatch ? latencyMatch[1] : "Unknown";
    
    reportContent += "## 1. Chat Experience\n";
    reportContent += `- **Latency Test**: ${output.includes('passed') ? '✅ PASS' : '❌ FAIL'}\n`;
    reportContent += `- **Measured Latency**: ${latency}ms\n`;
    reportContent += "\n```\n" + output.slice(0, 500) + "...\n```\n\n";
    
  } catch (error: any) {
    console.error("Latency test failed", error.message);
    reportContent += "## 1. Chat Experience\n- **Latency Test**: ❌ FAILED (Execution Error)\n\n";
  }

  // 2. Capture Test Counts from Supabase
  console.log("Fetching Supabase test stats...");
  try {
    // We can use the service we found
    const stats = await supabaseTestDB.getTestStatistics(30); // Last 30 days
    
    // Also try to get raw counts if possible, or just use what the service returns
    // The service returns { totalExecutions, successRate, averageDuration, failureRate }
    
    reportContent += "## 3. Automated Testing & HITL\n";
    if (stats) {
        reportContent += `- **Total Executions (30d)**: ${stats.totalExecutions}\n`;
        reportContent += `- **Success Rate**: ${stats.successRate.toFixed(2)}%\n`;
        reportContent += `- **Avg Duration**: ${stats.averageDuration.toFixed(0)}ms\n`;
    } else {
        reportContent += "- **Stats**: Failed to fetch from Supabase\n";
    }

    // Try to get specific counts for "Thousands of tests" requirement
    // We might need to query the table directly if the service doesn't expose count
    // But for now let's rely on the service
    
  } catch (error: any) {
    console.error("Supabase fetch failed", error);
    reportContent += "## 3. Automated Testing & HITL\n- **Stats**: ❌ FAILED to connect/fetch\n\n";
  }

  // 3. Curate Dashboard (Mock vs Real)
  console.log("Checking Curate Dashboard status...");
  reportContent += "## 2. Curate / RLHF\n";
  reportContent += "- **Status**: UI currently uses MOCK data (verified in `RLHFFeedbackTab.tsx`).\n";
  reportContent += "- **Action**: Need to connect `RLHFFeedbackTab.tsx` to `rlhf_feedback` table.\n\n";

  // Write Report
  fs.writeFileSync(reportPath, reportContent);
  console.log(`Report generated at ${reportPath}`);
}

main().catch(console.error);
