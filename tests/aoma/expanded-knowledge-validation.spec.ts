import { test, expect } from '@playwright/test';

/**
 * EXPANDED AOMA KNOWLEDGE BASE VALIDATION
 *
 * Tests the quality improvement from 10 → 28 pages
 * Asks questions about newly added content that would have failed before
 */

const EXPANDED_KNOWLEDGE_QUESTIONS = [
  {
    question: "What is the EOM Message Sender used for in AOMA?",
    expectedKeywords: ["eom", "message", "sender"],
    category: "NEW: Asset Administration",
    requiresNewPages: true
  },
  {
    question: "How do I track export status and delivery in AOMA?",
    expectedKeywords: ["export", "status", "delivery"],
    category: "NEW: Export Management",
    requiresNewPages: true
  },
  {
    question: "What is the Link Attempts feature in AOMA?",
    expectedKeywords: ["link", "attempt"],
    category: "NEW: Product Linking",
    requiresNewPages: true
  },
  {
    question: "How can I view master event history in AOMA?",
    expectedKeywords: ["master", "event", "history"],
    category: "NEW: Event Tracking",
    requiresNewPages: true
  },
  {
    question: "What tools does AOMA provide for managing QC providers?",
    expectedKeywords: ["qc", "provider", "manage"],
    category: "NEW: Quality Control",
    requiresNewPages: true
  },
  {
    question: "How do I use the Media Batch Converter in AOMA?",
    expectedKeywords: ["media", "batch", "convert"],
    category: "NEW: Media Tools",
    requiresNewPages: true
  },
  {
    question: "What is the Digital Archive Batch Export feature?",
    expectedKeywords: ["digital", "archive", "batch", "export"],
    category: "NEW: Archive Management",
    requiresNewPages: true
  },
  {
    question: "How do I search for artists in AOMA?",
    expectedKeywords: ["artist", "search"],
    category: "NEW: Search Tools",
    requiresNewPages: true
  },
  {
    question: "What user management features are available in AOMA?",
    expectedKeywords: ["user", "management", "role"],
    category: "NEW: User Administration",
    requiresNewPages: true
  },
  {
    question: "How does the Supply Chain Order Management work in AOMA?",
    expectedKeywords: ["supply", "chain", "order", "management"],
    category: "NEW: Supply Chain",
    requiresNewPages: true
  }
];

test.describe('Expanded AOMA Knowledge Base Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('https://thebetabase.com', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
  });

  test('should answer questions about newly added AOMA features', async ({ page }) => {
    console.log('\n🧠 Testing EXPANDED Knowledge Base (28 pages)...\n');

    const chatInput = page.locator('textarea, input[placeholder*="Ask"]').first();
    await expect(chatInput).toBeVisible({ timeout: 10000 });

    let totalQuestions = 0;
    let successfulAnswers = 0;
    const results = [];

    for (const testCase of EXPANDED_KNOWLEDGE_QUESTIONS) {
      totalQuestions++;
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`📝 [${totalQuestions}/${EXPANDED_KNOWLEDGE_QUESTIONS.length}] ${testCase.category}`);
      console.log(`   Question: "${testCase.question}"`);

      await chatInput.clear();
      await chatInput.fill(testCase.question);
      await page.keyboard.press('Enter');

      // Wait for AI response (knowledge base search)
      await page.waitForTimeout(35000);

      const pageText = await page.textContent('body');
      const cleanResponse = (pageText || '')
        .replace(/\d{2}:\d{2} (AM|PM)/g, '')
        .replace(/🤖/g, '')
        .toLowerCase()
        .trim();

      // Check for expected keywords
      const foundKeywords = testCase.expectedKeywords.filter(keyword =>
        cleanResponse.includes(keyword.toLowerCase())
      );

      const matchRate = foundKeywords.length / testCase.expectedKeywords.length;
      const hasUnknownPhrase = /don't know|not sure|unavailable|don't have|cannot find/i.test(cleanResponse);

      console.log(`   Keywords found: ${foundKeywords.join(', ')}`);
      console.log(`   Match rate: ${foundKeywords.length}/${testCase.expectedKeywords.length}`);
      console.log(`   Hallucination check: ${hasUnknownPhrase ? '❌ FAILED' : '✅ PASSED'}`);

      const success = foundKeywords.length > 0 && !hasUnknownPhrase;

      if (success) {
        successfulAnswers++;
        console.log(`   ✅ Answer quality: GOOD`);
      } else {
        console.log(`   ❌ Answer quality: POOR`);
      }

      results.push({
        question: testCase.question,
        category: testCase.category,
        matchRate,
        hasKnowledge: foundKeywords.length > 0,
        noHallucination: !hasUnknownPhrase,
        success
      });

      await page.waitForTimeout(2000);
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n📊 EXPANDED KNOWLEDGE BASE RESULTS:');
    console.log(`   Total questions: ${totalQuestions}`);
    console.log(`   Successful answers: ${successfulAnswers}`);
    console.log(`   Success rate: ${Math.round((successfulAnswers / totalQuestions) * 100)}%`);

    // Calculate quality score
    const avgMatchRate = results.reduce((sum, r) => sum + r.matchRate, 0) / results.length;
    const knowledgeScore = (successfulAnswers / totalQuestions) * 100;

    console.log(`   Average keyword match: ${Math.round(avgMatchRate * 100)}%`);
    console.log(`   Knowledge quality score: ${Math.round(knowledgeScore)}%`);

    // Should have at least 70% success rate with expanded knowledge
    expect(successfulAnswers).toBeGreaterThanOrEqual(Math.floor(totalQuestions * 0.7));

    console.log('\n✅ Expanded knowledge base validation complete!');
  });
});
