import { NextRequest, NextResponse } from "next/server";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

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

    // Persist to Supabase
    const { data: insertedTest, error: insertError } = await supabase
      .from("rlhf_generated_tests")
      .insert({
        source_query: testName,
        source_correction: description,
        test_name: `Automated: ${testName}`,
        test_description: `Automatically generated from historical test #${testId}`,
        test_code: testCode,
        test_language: "typescript",
        test_framework: "playwright",
        status: "pending",
        confidence: 0.85, // Default confidence for AI-generated scripts
        generation_model: "gemini-2.0-flash",
        generation_prompt: prompt,
        generated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error("Failed to persist generated test:", insertError);
      // We still return the code even if persistence fails, but log it
    }

    return NextResponse.json({
      success: true,
      testCode,
      testId: testId,
      persistedId: insertedTest?.id,
      location: "rlhf_generated_tests",
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
