import { NextRequest, NextResponse } from "next/server";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY,
});

/**
 * POST /api/test/generate-ai
 *
 * Generate real Playwright test code from a natural language description.
 * Used by the AI Test Generator in the Test pillar.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      prompt,
      testType = "e2e",
      language = "typescript",
      includeAssertions = true,
      includeErrorHandling = true,
      targetUrl,
    } = body;

    if (!prompt || prompt.trim().length < 10) {
      return NextResponse.json(
        { error: "Please provide a detailed test description (at least 10 characters)" },
        { status: 400 }
      );
    }

    // Build the AI prompt for test generation
    const systemPrompt = `You are an expert QA automation engineer specializing in Playwright test automation.

Your task is to generate REAL, RUNNABLE Playwright test code based on a natural language description.

**Guidelines:**
1. Generate complete, executable ${language === "typescript" ? "TypeScript" : "JavaScript"} code
2. Use Playwright's test framework (@playwright/test)
3. Use semantic selectors in this priority order:
   - data-testid attributes (most reliable)
   - ARIA roles and labels (accessible)
   - Text content with getByText/getByRole (readable)
   - CSS selectors only as last resort
4. ${includeAssertions ? "Include meaningful assertions to verify expected behavior" : "Minimal assertions"}
5. ${includeErrorHandling ? "Add try-catch for error handling and meaningful error messages" : "Basic error handling"}
6. Include comments explaining the test flow
7. Handle async operations with proper awaits
8. Use realistic timeouts and wait strategies
9. If a URL is mentioned, use it; otherwise use a placeholder that's clearly marked

**Test Type:** ${testType}
${targetUrl ? `**Target URL:** ${targetUrl}` : ""}

**IMPORTANT:** Generate ONLY the test code. No explanations, no markdown formatting, just pure executable code.`;

    const userPrompt = `Generate a Playwright ${testType} test for the following scenario:

${prompt}

Requirements:
- The test should be complete and runnable
- Use best practices for Playwright testing
- Include proper setup and assertions
- Make the test readable and maintainable`;

    const { text } = await generateText({
      model: google("gemini-2.0-flash"),
      system: systemPrompt,
      prompt: userPrompt,
      maxTokens: 3000,
      temperature: 0.7,
    });

    // Clean up the response - remove markdown code blocks if present
    let testCode = text.trim();

    if (testCode.startsWith("```")) {
      testCode = testCode.replace(/^```(?:typescript|ts|javascript|js)?\n?/, "");
      testCode = testCode.replace(/\n?```$/, "");
    }

    // Basic validation that we got actual code
    if (!testCode.includes("test(") && !testCode.includes("test.describe(")) {
      // If the response doesn't look like Playwright code, try to extract it
      const codeMatch = testCode.match(/import[\s\S]*?test[\s\S]*?\}\);?\s*$/);
      if (codeMatch) {
        testCode = codeMatch[0];
      }
    }

    // Generate a descriptive test name from the prompt
    const testName = generateTestName(prompt);

    return NextResponse.json({
      success: true,
      testCode,
      testName,
      testType,
      language,
      model: "gemini-2.0-flash",
      prompt: prompt,
    });

  } catch (error) {
    console.error("Error generating AI test:", error);

    // Check for specific error types
    const errorMessage = error instanceof Error ? error.message : String(error);

    if (errorMessage.includes("API key")) {
      return NextResponse.json(
        {
          success: false,
          error: "AI service configuration error",
          details: "API key not configured properly",
        },
        { status: 500 }
      );
    }

    if (errorMessage.includes("rate limit") || errorMessage.includes("quota")) {
      return NextResponse.json(
        {
          success: false,
          error: "AI service rate limited",
          details: "Please try again in a moment",
        },
        { status: 429 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate test",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}

/**
 * Generate a descriptive test name from the prompt
 */
function generateTestName(prompt: string): string {
  // Extract key action words and create a test name
  const words = prompt.toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter(w => w.length > 2);

  // Common verbs to look for
  const verbs = ["go", "click", "navigate", "submit", "fill", "enter", "verify", "check", "test", "validate"];
  const nouns = ["button", "form", "page", "link", "input", "menu", "modal", "dialog", "tab"];

  const foundVerbs = words.filter(w => verbs.some(v => w.includes(v)));
  const foundNouns = words.filter(w => nouns.some(n => w.includes(n)));

  if (foundVerbs.length > 0 && foundNouns.length > 0) {
    return `${capitalize(foundVerbs[0])} ${foundNouns[0]} test`;
  }

  // Fallback: use first few meaningful words
  const meaningful = words.filter(w => !["the", "and", "for", "with", "please", "then"].includes(w));
  if (meaningful.length >= 2) {
    return `${capitalize(meaningful[0])} ${meaningful[1]} test`;
  }

  return "Generated AI Test";
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
