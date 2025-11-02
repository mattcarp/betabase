/**
 * Sophisticated AOMA Chat Test - Production-Quality Questions
 * 
 * Based on expanded-knowledge-validation.spec.ts and comprehensive tests
 * Tests multi-tenant vector store with realistic Sony Music use cases
 */

import { test, expect } from '@playwright/test';

// Sophisticated AOMA questions from our actual test suites
const SOPHISTICATED_QUESTIONS = [
  {
    question: "What is the EOM Message Sender used for in AOMA?",
    expectedKeywords: ["eom", "message", "sender", "asset"],
    category: "Asset Administration",
    shouldHaveAnswer: true,
  },
  {
    question: "How do I track export status and delivery in AOMA?",
    expectedKeywords: ["export", "status", "delivery"],
    category: "Export Management",
    shouldHaveAnswer: true,
  },
  {
    question: "What is the Link Attempts feature in AOMA?",
    expectedKeywords: ["link", "attempt", "product"],
    category: "Product Linking",
    shouldHaveAnswer: true,
  },
  {
    question: "How can I view master event history in AOMA?",
    expectedKeywords: ["master", "event", "history"],
    category: "Event Tracking",
    shouldHaveAnswer: true,
  },
  {
    question: "What tools does AOMA provide for managing QC providers?",
    expectedKeywords: ["qc", "provider", "quality"],
    category: "Quality Control",
    shouldHaveAnswer: true,
  },
  {
    question: "How do I use the Media Batch Converter in AOMA?",
    expectedKeywords: ["media", "batch", "convert"],
    category: "Media Tools",
    shouldHaveAnswer: true,
  },
  {
    question: "What is the Digital Archive Batch Export feature?",
    expectedKeywords: ["digital", "archive", "batch", "export"],
    category: "Archive Management",
    shouldHaveAnswer: true,
  },
  {
    question: "How do I search for artists in AOMA?",
    expectedKeywords: ["artist", "search"],
    category: "Search Tools",
    shouldHaveAnswer: true,
  },
  {
    question: "What workflows does AOMA support for digital assets?",
    expectedKeywords: ["workflow", "digital", "asset"],
    category: "Workflow Management",
    shouldHaveAnswer: true,
  },
  {
    question: "Tell me about AOMA's integration with Sony Ci",
    expectedKeywords: ["sony", "ci", "integration"],
    category: "Integrations",
    shouldHaveAnswer: true,
  },
];

// Statistics/count questions (currently expected to fail gracefully)
const STATS_QUESTIONS = [
  {
    question: "How many Jira tickets are related to AOMA?",
    category: "Statistics",
    shouldAdmitLimitation: true, // Should say "I can't count" not hallucinate a number
  },
  {
    question: "What percentage of AOMA tickets are closed?",
    category: "Statistics",
    shouldAdmitLimitation: true,
  },
];

// Questions that should trigger "I don't know" responses
const UNKNOWN_QUESTIONS = [
  {
    question: "What is the weather in Tokyo today?",
    shouldSayIDontKnow: true,
  },
  {
    question: "What is a good recipe for chocolate chip cookies?",
    shouldSayIDontKnow: true,
  },
];

test.describe('SIAM Chat - Sophisticated AOMA Questions', () => {
  test.setTimeout(300000); // 5 minutes

  test('should answer sophisticated AOMA knowledge questions with natural language', async ({ page }) => {
    console.log('\n🎯 Starting Sophisticated AOMA Chat Test...\n');

    // Navigate to chat
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // Wait for chat input
    const chatInput = page.locator('textarea, input[placeholder*="Ask"]').first();
    await expect(chatInput).toBeVisible({ timeout: 10000 });

    let passCount = 0;
    let failCount = 0;
    const failures: string[] = [];

    for (const testCase of SOPHISTICATED_QUESTIONS) {
      console.log(`\n${'='.repeat(70)}`);
      console.log(`📚 Category: ${testCase.category}`);
      console.log(`❓ Question: ${testCase.question}`);
      console.log('='.repeat(70));

      // Type and send question
      await chatInput.fill(testCase.question);
      await chatInput.press('Enter');

      // Wait for response
      await page.waitForTimeout(10000);

      // Get response text
      const messages = await page.locator('[class*="message"], [class*="chat"], article').allTextContents();
      const lastResponse = messages[messages.length - 1]?.toLowerCase() || "";

      console.log(`\n📝 Response Preview: ${lastResponse.substring(0, 200)}...\n`);

      // Quality checks
      const hasKeywords = testCase.expectedKeywords.some(keyword => 
        lastResponse.includes(keyword.toLowerCase())
      );

      const hasAwkwardLanguage = 
        lastResponse.includes("from the interface shown") ||
        lastResponse.includes("from the interface") ||
        lastResponse.includes("as shown in") ||
        lastResponse.includes("the interface shows");

      const admitsNotKnowing = 
        lastResponse.includes("i don't know") ||
        lastResponse.includes("not in my knowledge") ||
        lastResponse.includes("i don't have");

      // Evaluate
      let testPassed = false;
      
      if (testCase.shouldHaveAnswer) {
        if (hasKeywords && !admitsNotKnowing) {
          console.log('✅ PASS - Found expected keywords and provided answer');
          testPassed = true;
        } else if (admitsNotKnowing) {
          console.log('❌ FAIL - Incorrectly claimed not to know (should have answered from knowledge base)');
          failures.push(`${testCase.question} - Incorrectly said "I don't know"`);
        } else {
          console.log('❌ FAIL - Missing expected keywords');
          failures.push(`${testCase.question} - Missing keywords: ${testCase.expectedKeywords.join(', ')}`);
        }
      }

      // Check for awkward language
      if (hasAwkwardLanguage) {
        console.log('⚠️  WARNING - Response contains awkward phrases like "from the interface shown"');
        console.log('    This sounds unnatural to users. Consider improving system prompt.');
      }

      if (testPassed) {
        passCount++;
      } else {
        failCount++;
      }

      // Take screenshot
      await page.screenshot({ 
        path: `tests/manual/screenshots/sophisticated-${testCase.category.toLowerCase().replace(/\s+/g, '-')}.png`, 
        fullPage: true 
      });

      // Brief delay between questions
      await page.waitForTimeout(2000);
    }

    // Test statistics questions (should admit limitation)
    console.log('\n' + '='.repeat(70));
    console.log('📊 Testing Statistics Questions (should admit limitations gracefully)');
    console.log('='.repeat(70));

    for (const statsTest of STATS_QUESTIONS) {
      console.log(`\n❓ ${statsTest.question}`);
      
      await chatInput.fill(statsTest.question);
      await chatInput.press('Enter');
      await page.waitForTimeout(10000);

      const messages = await page.locator('[class*="message"], [class*="chat"], article').allTextContents();
      const lastResponse = messages[messages.length - 1]?.toLowerCase() || "";

      console.log(`\n📝 Response: ${lastResponse.substring(0, 300)}...\n`);

      const admitsLimitation = 
        lastResponse.includes("i can't count") ||
        lastResponse.includes("i don't have statistics") ||
        lastResponse.includes("not in my knowledge") ||
        lastResponse.includes("can't provide exact numbers");

      const hasNumber = /\d{2,}/.test(lastResponse); // Looking for made-up numbers

      if (admitsLimitation && !hasNumber) {
        console.log('✅ PASS - Correctly admitted limitation without hallucinating');
        passCount++;
      } else if (hasNumber) {
        console.log('❌ FAIL - Hallucinated a specific number');
        failures.push(`${statsTest.question} - Hallucinated number`);
        failCount++;
      } else {
        console.log('⚠️  UNCLEAR - Response unclear');
      }
    }

    // Final report
    console.log('\n' + '='.repeat(70));
    console.log('📊 TEST RESULTS');
    console.log('='.repeat(70));
    console.log(`✅ Passed: ${passCount}`);
    console.log(`❌ Failed: ${failCount}`);
    console.log(`📈 Success Rate: ${((passCount / (passCount + failCount)) * 100).toFixed(1)}%`);

    if (failures.length > 0) {
      console.log('\n❌ FAILURES:');
      failures.forEach((failure, i) => {
        console.log(`  ${i + 1}. ${failure}`);
      });
    }

    console.log('\n📸 Screenshots saved to tests/manual/screenshots/');
    console.log('='.repeat(70) + '\n');

    // Test should pass if > 80% success rate
    expect(passCount / (passCount + failCount)).toBeGreaterThanOrEqual(0.8);
  });
});


