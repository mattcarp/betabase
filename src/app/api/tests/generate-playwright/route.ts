import { NextRequest, NextResponse } from "next/server";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { testId, testName, description, preconditions, app_under_test } = body;

    if (!testName && !description) {
      return NextResponse.json(
        { error: "Test name or description required" },
        { status: 400 }
      );
    }

    const prompt = `You are an expert QA automation engineer. Generate a Playwright test for the following legacy test case.

**Test Information:**
- Test ID: ${testId}
- Test Name: ${testName}
- Description: ${description}
- Preconditions: ${preconditions || "None specified"}
- Application: ${app_under_test}

**Requirements:**
1. Use TypeScript with Playwright's test framework
2. Include proper setup/teardown if preconditions exist
3. Use semantic selectors (data-testid, role, text) over CSS/XPath
4. Add meaningful assertions
5. Include comments explaining each step
6. Handle async operations properly
7. Use Page Object Model patterns where appropriate

Generate ONLY the test code, no explanations:`;

    const { text } = await generateText({
      model: google("gemini-2.0-flash"),
      prompt,
      maxTokens: 2000,
    });

    // Clean up the response
    let testCode = text.trim();
    
    // Remove markdown code blocks if present
    if (testCode.startsWith("```")) {
      testCode = testCode.replace(/^```(?:typescript|ts|javascript|js)?\n?/, "");
      testCode = testCode.replace(/\n?```$/, "");
    }

    return NextResponse.json({
      success: true,
      testCode,
      testId,
      model: "gemini-2.0-flash",
    });
  } catch (error) {
    console.error("Error generating Playwright test:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to generate test",
        details: String(error),
      },
      { status: 500 }
    );
  }
}
