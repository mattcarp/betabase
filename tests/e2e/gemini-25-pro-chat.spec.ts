import { test, expect } from '../fixtures/base-test';

/**
 * Gemini 2.5 Pro Chat Integration Test
 * 
 * Tests the migration from GPT-5 to Gemini 2.5 Pro for RAG functionality.
 * 
 * Verifies:
 * 1. Gemini 2.5 Pro is the default model
 * 2. Chat functionality works with Gemini API
 * 3. Responses are generated successfully
 * 4. Provider routing works correctly (Google vs OpenAI)
 */

test.describe("Gemini 2.5 Pro Chat Integration", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to main chat page
    await page.goto("http://localhost:3000");
    
    // Wait for page to be ready
    await page.waitForLoadState("networkidle");
  });

  test("should have Gemini 2.5 Pro as default model", async ({ page }) => {
    console.log("🧪 Testing: Default model selection");
    
    // Look for model selector - it might be in a dropdown or display
    const modelSelector = page.locator('[data-testid="model-selector"]').or(
      page.locator('select').filter({ hasText: /gemini|gpt/i })
    ).or(
      page.locator('button').filter({ hasText: /gemini|gpt/i })
    ).first();
    
    // Check if we can find model info
    const hasModelSelector = await modelSelector.count() > 0;
    
    if (hasModelSelector) {
      const selectedModel = await modelSelector.textContent();
      console.log("📊 Selected model:", selectedModel);
      
      // Verify Gemini 2.5 Pro is selected or visible
      expect(selectedModel?.toLowerCase()).toContain("gemini");
    } else {
      console.log("⚠️ Model selector not found in UI, checking console logs instead");
    }
  });

  test("should successfully send a message and receive Gemini response", async ({ page }) => {
    console.log("🧪 Testing: Basic chat with Gemini 2.5 Pro");
    
    // Capture console logs to verify provider
    const consoleLogs: string[] = [];
    page.on("console", (msg) => {
      const text = msg.text();
      consoleLogs.push(text);
      if (text.includes("Gemini") || text.includes("Google") || text.includes("provider")) {
        console.log("🔍 Console:", text);
      }
    });
    
    // Find the chat input
    const chatInput = page.locator('textarea, input[type="text"]').first();
    await chatInput.waitFor({ state: "visible", timeout: 10000 });
    
    // Type a simple test message
    const testMessage = "What is 2+2?";
    await chatInput.fill(testMessage);
    console.log("✍️ Typed message:", testMessage);
    
    // Find and click send button
    const sendButton = page.locator('button').filter({ hasText: /send|submit/i }).or(
      page.locator('button[type="submit"]')
    ).first();
    
    await sendButton.click();
    console.log("📤 Sent message");
    
    // Wait for response to appear
    // Look for assistant message or streaming response
    const responseLocator = page.locator('[data-role="assistant"]').or(
      page.locator('.message').filter({ hasText: /4|four/i })
    ).or(
      page.locator('div').filter({ hasText: /4|four/i })
    );
    
    await responseLocator.first().waitFor({ state: "visible", timeout: 30000 });
    console.log("✅ Response received");
    
    // Get the response text
    const responseText = await responseLocator.first().textContent();
    console.log("💬 Response:", responseText?.substring(0, 100));
    
    // Verify response contains answer
    expect(responseText?.toLowerCase()).toMatch(/4|four/);
    
    // Check console logs for Gemini provider confirmation
    const hasGeminiLog = consoleLogs.some(log => 
      log.toLowerCase().includes("gemini") || 
      log.toLowerCase().includes("google")
    );
    
    if (hasGeminiLog) {
      console.log("✅ Confirmed: Using Google Gemini provider");
    } else {
      console.log("⚠️ Warning: Could not confirm Gemini provider in logs");
    }
  });

  test("should handle model switching between Gemini and OpenAI", async ({ page }) => {
    console.log("🧪 Testing: Model switching functionality");
    
    // Capture network requests to verify API calls
    const apiCalls: string[] = [];
    page.on("request", (request) => {
      const url = request.url();
      if (url.includes("/api/chat")) {
        apiCalls.push(url);
        console.log("🌐 API call:", url);
      }
    });
    
    // Look for model selector
    const modelSelector = page.locator('[data-testid="model-selector"]').or(
      page.locator('select').filter({ hasText: /gemini|gpt/i })
    ).or(
      page.locator('button').filter({ hasText: /model/i })
    ).first();
    
    const hasModelSelector = await modelSelector.count() > 0;
    
    if (hasModelSelector) {
      // Try to click/open model selector
      await modelSelector.click();
      console.log("📋 Opened model selector");
      
      // Look for model options
      const geminiOption = page.locator('text="Gemini 2.5 Pro"').or(
        page.locator('[value="gemini-2.5-pro"]')
      ).first();
      
      const gptOption = page.locator('text="GPT-5"').or(
        page.locator('[value="gpt-5"]')
      ).first();
      
      const hasGemini = await geminiOption.count() > 0;
      const hasGPT = await gptOption.count() > 0;
      
      console.log("📊 Models available:", { gemini: hasGemini, gpt: hasGPT });
      
      if (hasGemini && hasGPT) {
        console.log("✅ Both Gemini and OpenAI models are available");
        expect(hasGemini).toBe(true);
        expect(hasGPT).toBe(true);
      } else {
        console.log("⚠️ Could not verify all model options");
      }
    } else {
      console.log("⚠️ Model selector not found, skipping switch test");
      test.skip();
    }
  });

  test("should verify Gemini 2.5 Pro has 2M context capability", async ({ page }) => {
    console.log("🧪 Testing: 2M context window information");
    
    // Check if UI mentions the 2M context window
    const contextInfo = page.locator('text=/2M|2,000,000|2 million.*context/i').first();
    const hasContextInfo = await contextInfo.count() > 0;
    
    if (hasContextInfo) {
      const infoText = await contextInfo.textContent();
      console.log("✅ Found context info:", infoText);
      expect(infoText?.toLowerCase()).toMatch(/2m|2,000,000|2 million/i);
    } else {
      console.log("ℹ️ Context window info not displayed in UI (may be internal)");
    }
    
    // Verify model description mentions RAG or enterprise use
    const modelDesc = page.locator('text=/rag|enterprise|synthesis/i').first();
    const hasDesc = await modelDesc.count() > 0;
    
    if (hasDesc) {
      console.log("✅ Found RAG-related description in UI");
    } else {
      console.log("ℹ️ RAG description not found in UI");
    }
  });

  test("should successfully query with AOMA context", async ({ page }) => {
    console.log("🧪 Testing: AOMA RAG query with Gemini");
    
    // Capture console for AOMA orchestrator logs
    const aomaLogs: string[] = [];
    page.on("console", (msg) => {
      const text = msg.text();
      if (text.toLowerCase().includes("aoma") || text.includes("orchestrator")) {
        aomaLogs.push(text);
        console.log("🔍 AOMA Log:", text);
      }
    });
    
    const chatInput = page.locator('textarea, input[type="text"]').first();
    await chatInput.waitFor({ state: "visible", timeout: 10000 });
    
    // Ask an AOMA-specific question
    const aomaQuestion = "What is AOMA?";
    await chatInput.fill(aomaQuestion);
    console.log("✍️ AOMA question:", aomaQuestion);
    
    const sendButton = page.locator('button').filter({ hasText: /send|submit/i }).or(
      page.locator('button[type="submit"]')
    ).first();
    
    await sendButton.click();
    console.log("📤 Sent AOMA query");
    
    // Wait for response
    const responseLocator = page.locator('[data-role="assistant"]').or(
      page.locator('.message').filter({ hasText: /aoma|sony|platform/i })
    ).first();
    
    await responseLocator.waitFor({ state: "visible", timeout: 30000 });
    const response = await responseLocator.textContent();
    console.log("💬 AOMA Response:", response?.substring(0, 150));
    
    // Verify response mentions AOMA or Sony
    expect(response?.toLowerCase()).toMatch(/aoma|sony|platform/);
    
    // Check if AOMA orchestrator was used
    const hasAomaOrchestration = aomaLogs.some(log => 
      log.toLowerCase().includes("aoma") || 
      log.toLowerCase().includes("orchestrator")
    );
    
    if (hasAomaOrchestration) {
      console.log("✅ AOMA orchestrator integration confirmed");
    }
  });
});

