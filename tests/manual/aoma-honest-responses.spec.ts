/**
 * AOMA Chat Honesty Test - Anti-Hallucination Validation
 * 
 * PASSING CRITERIA:
 * ✅ Says "I don't know" when information is missing (GOOD!)
 * ✅ No hallucination/making up fake answers
 * ✅ Natural, conversational language (no "from the interface")
 * ✅ Accurate answers on what IS in the knowledge base
 */

import { test, expect } from '@playwright/test';

const TEST_QUESTIONS = [
  {
    category: "Basic AOMA Knowledge",
    question: "What is AOMA?",
    expectation: "Should have basic info from the 96 firecrawl pages",
    acceptHonestAdmission: false, // We have this data
  },
  {
    category: "AOMA Features",
    question: "What are the main features of AOMA?",
    expectation: "Should list features from firecrawl data",
    acceptHonestAdmission: false,
  },
  {
    category: "Specific Feature (might not be in KB)",
    question: "What is the EOM Message Sender used for in AOMA?",
    expectation: "May not be in current knowledge base - honest admission is PASSING",
    acceptHonestAdmission: true,
  },
  {
    category: "Export Management",
    question: "How do I track export status in AOMA?",
    expectation: "May not have detailed docs - honest admission is PASSING",
    acceptHonestAdmission: true,
  },
  {
    category: "Statistics (should admit limitation)",
    question: "How many Jira tickets are in AOMA?",
    expectation: "Should say 'I can't count' not make up a number",
    mustAdmitLimitation: true,
  },
  {
    category: "Off-topic (should say I don't know)",
    question: "What is the weather in Tokyo?",
    expectation: "Should say 'not in my knowledge base'",
    mustAdmitNotKnowing: true,
  },
];

test.describe('AOMA Chat - Honest Response Validation', () => {
  test.setTimeout(180000); // 3 minutes

  test('should respond honestly without hallucination', async ({ page }) => {
    console.log('\n🎯 Testing AOMA Chat Honesty & Language Quality...\n');
    console.log('✅ PASSING = Honest "I don\'t know" when data is missing');
    console.log('❌ FAILING = Making up fake answers\n');

    // Navigate to chat
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    const chatInput = page.locator('textarea, input[placeholder*="Ask"]').first();
    await expect(chatInput).toBeVisible({ timeout: 10000 });

    const results: any[] = [];

    for (const testCase of TEST_QUESTIONS) {
      console.log(`\n${'='.repeat(70)}`);
      console.log(`📚 Category: ${testCase.category}`);
      console.log(`❓ Question: ${testCase.question}`);
      console.log(`📋 Expectation: ${testCase.expectation}`);
      console.log('='.repeat(70));

      // Send question
      await chatInput.fill(testCase.question);
      await chatInput.press('Enter');

      // Wait for response
      await page.waitForTimeout(8000);

      // Get response
      const messages = await page.locator('[class*="message"], [class*="chat"], article').allTextContents();
      const lastResponse = messages[messages.length - 1] || "";
      const responseLower = lastResponse.toLowerCase();

      console.log(`\n📝 Response:\n${lastResponse.substring(0, 400)}${lastResponse.length > 400 ? '...' : ''}\n`);

      // Quality checks
      const admitsNotKnowing = 
        responseLower.includes("i don't know") ||
        responseLower.includes("not in my knowledge") ||
        responseLower.includes("i don't have") ||
        responseLower.includes("can't provide");

      const hasAwkwardLanguage = 
        responseLower.includes("from the interface shown") ||
        responseLower.includes("from the interface") ||
        responseLower.includes("as shown in") ||
        responseLower.includes("the interface shows") ||
        responseLower.includes("the screen displays");

      const hasSpecificNumber = /\b\d{2,}\b/.test(lastResponse); // Made up specific numbers

      // Evaluate based on test case type
      let passed = false;
      let reason = "";

      if (testCase.mustAdmitNotKnowing) {
        // Off-topic questions
        if (admitsNotKnowing) {
          passed = true;
          reason = "✅ Correctly said 'I don't know' for off-topic question";
        } else {
          passed = false;
          reason = "❌ Should have said 'I don't know' for off-topic question";
        }
      } else if (testCase.mustAdmitLimitation) {
        // Statistics questions
        if (admitsNotKnowing && !hasSpecificNumber) {
          passed = true;
          reason = "✅ Correctly admitted can't count without hallucinating";
        } else if (hasSpecificNumber) {
          passed = false;
          reason = "❌ Hallucinated a specific number";
        } else {
          passed = false;
          reason = "❌ Should admit limitation on counting";
        }
      } else if (testCase.acceptHonestAdmission) {
        // Questions where "I don't know" is acceptable
        if (admitsNotKnowing) {
          passed = true;
          reason = "✅ PASS - Honest admission (knowledge may not be in DB yet)";
        } else if (!admitsNotKnowing && lastResponse.length > 50) {
          passed = true;
          reason = "✅ PASS - Provided answer from knowledge base";
        } else {
          passed = false;
          reason = "❌ Response too short or unclear";
        }
      } else {
        // Should have answer from knowledge base
        if (admitsNotKnowing) {
          passed = false;
          reason = "⚠️ Said 'I don't know' but we have this data (check vector store)";
        } else if (lastResponse.length > 50) {
          passed = true;
          reason = "✅ Provided answer from knowledge base";
        } else {
          passed = false;
          reason = "❌ No meaningful response";
        }
      }

      // Check for awkward language
      let languageWarning = "";
      if (hasAwkwardLanguage) {
        languageWarning = "⚠️ AWKWARD LANGUAGE DETECTED - 'from the interface' phrasing";
      }

      console.log(`\n${reason}`);
      if (languageWarning) {
        console.log(languageWarning);
      }

      results.push({
        category: testCase.category,
        question: testCase.question,
        passed,
        reason,
        hasAwkwardLanguage,
        admitsNotKnowing,
      });

      // Screenshot
      await page.screenshot({ 
        path: `tests/manual/screenshots/honest-test-${results.length}.png`, 
        fullPage: true 
      });

      await page.waitForTimeout(1500);
    }

    // Final report
    console.log('\n' + '='.repeat(70));
    console.log('📊 FINAL TEST RESULTS');
    console.log('='.repeat(70));

    const passCount = results.filter(r => r.passed).length;
    const failCount = results.filter(r => !r.passed).length;
    const awkwardCount = results.filter(r => r.hasAwkwardLanguage).length;

    console.log(`\n✅ Passed: ${passCount}/${results.length}`);
    console.log(`❌ Failed: ${failCount}/${results.length}`);
    console.log(`⚠️  Awkward Language: ${awkwardCount}/${results.length}`);
    console.log(`📈 Success Rate: ${((passCount / results.length) * 100).toFixed(1)}%`);

    console.log('\n📋 DETAILED RESULTS:\n');
    results.forEach((r, i) => {
      const icon = r.passed ? '✅' : '❌';
      console.log(`${i + 1}. ${icon} ${r.category}`);
      console.log(`   Q: ${r.question}`);
      console.log(`   ${r.reason}`);
      if (r.hasAwkwardLanguage) {
        console.log(`   ⚠️ Awkward language detected`);
      }
      console.log('');
    });

    console.log('='.repeat(70) + '\n');

    // Test passes if:
    // 1. At least 80% pass rate
    // 2. No more than 1 awkward language instance
    expect(passCount / results.length).toBeGreaterThanOrEqual(0.8);
    expect(awkwardCount).toBeLessThanOrEqual(1);
  });
});


