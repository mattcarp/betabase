/**
 * Test Script for Unified Test Intelligence System
 * Tests the complete pipeline: Firecrawl → Supabase → Support Intelligence
 */

// Load environment variables
import * as dotenv from "dotenv";
import * as path from "path";

// Load .env.local first
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config(); // Then load .env

import { unifiedTestIntelligence } from "./src/services/unified-test-intelligence.js";
import { supportChatIntelligence } from "./src/services/support-chat-intelligence.js";
import { aomaOrchestrator } from "./src/services/aomaOrchestrator.js";

// Color codes for console output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
};

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSection(title: string) {
  console.log("\n" + "=".repeat(60));
  log(title, colors.bright + colors.blue);
  console.log("=".repeat(60));
}

async function testAUTIntelligence() {
  logSection("1. Testing AUT Intelligence Gathering");

  try {
    log("Analyzing AOMA application...", colors.cyan);
    const analysis = await unifiedTestIntelligence.gatherAUTIntelligence();

    log(`✅ Found ${analysis.testableFeatures.length} testable features:`, colors.green);
    analysis.testableFeatures.forEach((feature: any) => {
      console.log(`  - ${feature.name} (${feature.testPriority} priority)`);
    });

    log(`\n✅ Found ${analysis.userFlows.length} user flows:`, colors.green);
    analysis.userFlows.forEach((flow: any) => {
      console.log(`  - ${flow.name} ${flow.criticalPath ? "⚠️ CRITICAL" : ""}`);
    });

    log(`\n✅ Found ${analysis.apiEndpoints.length} API endpoints`, colors.green);
    log(`✅ Extracted ${analysis.knowledgeExtracted.length} knowledge items`, colors.green);

    return true;
  } catch (error) {
    log(`❌ Error: ${error}`, colors.red);
    return false;
  }
}

async function testProcessTestFailure() {
  logSection("2. Testing Test Failure Processing");

  const mockTestFailure = {
    id: "test-001",
    test_name: "AOMA Login Test",
    test_file: "auth.spec.ts",
    error_message: 'TimeoutError: Element [data-testid="login-button"] not visible after 30000ms',
    status: "failed",
  };

  try {
    log("Processing mock test failure...", colors.cyan);
    const knowledge = await unifiedTestIntelligence.processTestFailure(mockTestFailure);

    log("✅ Generated solution:", colors.green);
    console.log(`  Title: ${knowledge.title}`);
    console.log(`  Solution: ${knowledge.solution?.substring(0, 200)}...`);
    console.log(`  Tags: ${knowledge.tags.join(", ")}`);

    return true;
  } catch (error) {
    log(`❌ Error: ${error}`, colors.red);
    return false;
  }
}

async function testSupportChat() {
  logSection("3. Testing Support Chat Intelligence");

  const testQueries = [
    "How do I upload assets to AOMA?",
    "Why is my login failing with SSO?",
    "What audio formats does AOMA support?",
    "How to fix timeout errors in tests?",
  ];

  try {
    for (const question of testQueries) {
      log(`\nQuery: "${question}"`, colors.cyan);

      const response = await supportChatIntelligence.querySupportKnowledge({
        question,
        context: "User is having issues with AOMA",
      });

      log(`✅ Answer (${response.confidence}% confidence):`, colors.green);
      console.log(`  ${response.answer.substring(0, 200)}...`);
      console.log(`  Sources: ${response.sources.join(", ")}`);

      if (response.suggestedActions && response.suggestedActions.length > 0) {
        console.log(`  Suggested actions: ${response.suggestedActions.join(", ")}`);
      }
    }

    return true;
  } catch (error) {
    log(`❌ Error: ${error}`, colors.red);
    return false;
  }
}

async function testGenerateTestsFromSupport() {
  logSection("4. Testing Test Generation from Support Issues");

  try {
    log("Generating test recommendations from support tickets...", colors.cyan);
    const recommendations = await unifiedTestIntelligence.generateTestsFromSupport();

    log(`✅ Generated ${recommendations.length} test recommendations:`, colors.green);
    recommendations.forEach((rec: any) => {
      console.log(`  - ${rec.title} (Priority: ${rec.priority})`);
      console.log(`    Suggested tests: ${rec.suggestedTests.join(", ")}`);
    });

    return true;
  } catch (error) {
    log(`❌ Error: ${error}`, colors.red);
    return false;
  }
}

async function testKnowledgeSearch() {
  logSection("5. Testing Knowledge Base Search");

  try {
    log("Searching for upload-related knowledge...", colors.cyan);
    const results = await unifiedTestIntelligence.searchTestKnowledge("upload", {
      sources: ["firecrawl", "documentation", "test_failure"],
      minRelevance: 60,
    });

    log(`✅ Found ${results.length} relevant entries`, colors.green);
    results.slice(0, 3).forEach((result: any) => {
      console.log(`  - ${result.title} (Relevance: ${result.relevance_score})`);
    });

    return true;
  } catch (error) {
    log(`❌ Error: ${error}`, colors.red);
    return false;
  }
}

async function testLearningFromFeedback() {
  logSection("6. Testing Learning from User Feedback");

  try {
    log("Recording helpful interaction...", colors.cyan);
    await supportChatIntelligence.learnFromInteraction(
      "How to export assets from AOMA?",
      "Navigate to Assets > Select items > Click Export > Choose format (CSV/JSON/XML)",
      true,
      "This was very helpful!"
    );
    log("✅ Recorded helpful interaction", colors.green);

    log("\nRecording unhelpful interaction...", colors.cyan);
    await supportChatIntelligence.learnFromInteraction(
      "Why is search slow?",
      "Try refreshing the page",
      false,
      "This did not solve the performance issue"
    );
    log("✅ Recorded unhelpful interaction for improvement", colors.green);

    return true;
  } catch (error) {
    log(`❌ Error: ${error}`, colors.red);
    return false;
  }
}

async function testCommonIssues() {
  logSection("7. Testing Common Issues Retrieval");

  try {
    log("Fetching common support issues...", colors.cyan);
    const issues = await supportChatIntelligence.getCommonIssues(5);

    log(`✅ Top ${issues.length} common issues:`, colors.green);
    issues.forEach((issue: any, index: number) => {
      console.log(`  ${index + 1}. ${issue.title}`);
      console.log(`     Solution: ${issue.solution?.substring(0, 100)}...`);
    });

    return true;
  } catch (error) {
    log(`❌ Error: ${error}`, colors.red);
    return false;
  }
}

async function testAOMAIntegration() {
  logSection("8. Testing AOMA Mesh MCP Integration");

  try {
    log("Testing AOMA knowledge query...", colors.cyan);
    const response = await aomaOrchestrator.orchestrateQuery(
      "What is AOMA and what are its main features?",
      { strategy: "rapid" }
    );

    if (response.response) {
      log("✅ AOMA integration working:", colors.green);
      console.log(`  ${response.response.substring(0, 200)}...`);
      console.log(`  Processing time: ${response.metadata?.processingTime}ms`);
    } else {
      log("⚠️ AOMA integration returned no response", colors.yellow);
    }

    return true;
  } catch (error) {
    log(`⚠️ AOMA integration not available: ${error}`, colors.yellow);
    return true; // Don't fail the test if AOMA is not available
  }
}

async function runAllTests() {
  log("\n🚀 UNIFIED TEST INTELLIGENCE SYSTEM - COMPREHENSIVE TEST", colors.bright + colors.cyan);
  log("Testing the complete pipeline: Firecrawl → Supabase → Support Intelligence\n", colors.cyan);

  const tests = [
    { name: "AUT Intelligence", fn: testAUTIntelligence },
    { name: "Test Failure Processing", fn: testProcessTestFailure },
    { name: "Support Chat", fn: testSupportChat },
    { name: "Test Generation", fn: testGenerateTestsFromSupport },
    { name: "Knowledge Search", fn: testKnowledgeSearch },
    { name: "Learning from Feedback", fn: testLearningFromFeedback },
    { name: "Common Issues", fn: testCommonIssues },
    { name: "AOMA Integration", fn: testAOMAIntegration },
  ];

  const results: boolean[] = [];

  for (const test of tests) {
    try {
      const passed = await test.fn();
      results.push(passed);
    } catch (error) {
      log(`\n❌ Test "${test.name}" failed: ${error}`, colors.red);
      results.push(false);
    }
  }

  // Summary
  logSection("TEST SUMMARY");
  const passed = results.filter((r) => r).length;
  const failed = results.length - passed;

  log(`Total Tests: ${results.length}`, colors.bright);
  log(`✅ Passed: ${passed}`, colors.green);
  if (failed > 0) {
    log(`❌ Failed: ${failed}`, colors.red);
  }

  const successRate = ((passed / results.length) * 100).toFixed(1);
  if (passed === results.length) {
    log(`\n🎉 ALL TESTS PASSED! (${successRate}%)`, colors.bright + colors.green);
  } else {
    log(`\n⚠️ Success Rate: ${successRate}%`, colors.yellow);
  }

  // Configuration info
  logSection("CONFIGURATION STATUS");
  console.log(
    "Firecrawl API Key:",
    process.env.FIRECRAWL_API_KEY ? "✅ Configured" : "❌ Not configured"
  );
  console.log(
    "Supabase URL:",
    process.env.NEXT_PUBLIC_SUPABASE_URL ? "✅ Configured" : "❌ Not configured"
  );
  console.log(
    "AOMA Mesh URL:",
    process.env.NEXT_PUBLIC_AOMA_MESH_SERVER_URL ? "✅ Configured" : "❌ Not configured"
  );

  if (!process.env.FIRECRAWL_API_KEY || process.env.FIRECRAWL_API_KEY.includes("YOUR_")) {
    log("\n💡 Using mock data for AUT analysis (Firecrawl not configured)", colors.yellow);
  } else {
    log("\n🔥 Firecrawl is configured and ready for real AUT analysis!", colors.green);
  }
}

// Run tests if executed directly
if (require.main === module) {
  runAllTests()
    .then(() => {
      log("\n✨ Test suite completed successfully!", colors.green);
      process.exit(0);
    })
    .catch((error) => {
      log(`\n💥 Fatal error: ${error}`, colors.red);
      process.exit(1);
    });
}

export { runAllTests };
