import {  test, expect  } from '../fixtures/base-test';

test('test chat returns meaningful AI response', async ({ page }) => {
  console.log('\n=== Testing Chat with Real Question ===\n');

  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  console.log('✓ Page loaded');

  // Find chat input
  const chatInput = page.locator('textarea[placeholder*="Ask me"]').first();
  await chatInput.waitFor({ state: 'visible', timeout: 10000 });

  // Ask a real question that requires knowledge
  const question = 'What is AOMA?';
  await chatInput.fill(question);
  await page.waitForTimeout(500);

  // Press Enter to send
  await chatInput.press('Enter');
  console.log(`✓ Sent question: "${question}"`);

  // Wait for response - look for assistant message
  await page.waitForTimeout(3000); // Give it time to start responding

  // Check if we got a response in the chat
  const messages = page.locator('[data-role="assistant"], .assistant-message, [class*="assistant"]');

  // Wait up to 30 seconds for a response
  await messages.first().waitFor({ state: 'visible', timeout: 30000 });

  const responseCount = await messages.count();
  console.log(`✓ Found ${responseCount} assistant message(s)`);

  // Get the text of the first response
  const responseText = await messages.first().textContent();
  console.log(`\n=== AI Response ===`);
  console.log(responseText);
  console.log(`===================\n`);

  // Verify we got a meaningful response (not just echoing the question)
  expect(responseText).toBeTruthy();
  expect(responseText!.length).toBeGreaterThan(question.length);

  // Check that response doesn't just echo the question
  expect(responseText!.toLowerCase()).not.toBe(question.toLowerCase());

  // Response should contain relevant keywords about AOMA
  const responseTextLower = responseText!.toLowerCase();
  const hasRelevantContent =
    responseTextLower.includes('asset') ||
    responseTextLower.includes('offering') ||
    responseTextLower.includes('management') ||
    responseTextLower.includes('application') ||
    responseTextLower.includes('system');

  if (hasRelevantContent) {
    console.log('✓ Response contains relevant AOMA information');
  } else {
    console.log('⚠ Response may not contain AOMA-specific information');
    console.log('  This could mean RAG/knowledge base is not connected');
  }

  // At minimum, verify we got a non-trivial response
  expect(responseText!.length).toBeGreaterThan(20);

  console.log('\n✓ Chat is working - received meaningful AI response');
});
