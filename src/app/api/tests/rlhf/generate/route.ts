/**
 * RLHF Test Generation API
 * Generates Playwright tests from curated feedback
 * Part of Testing Tab - Phase 5 (User Story 4)
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { streamText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);
const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_API_KEY!,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      source = "both", // "feedback" | "historical" | "both"
      limit = 5,
      minConfidence = 0.7 
    } = body;

    // Fetch curated feedback to generate tests from
    const { data: feedbackData, error: feedbackError } = await supabase
      .from("rlhf_feedback")
      .select("*")
      .not("curator_correction", "is", null)
      .gte("confidence_score", minConfidence)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (feedbackError && feedbackError.code !== "PGRST116") {
      throw new Error(`Failed to fetch feedback: ${feedbackError.message}`);
    }

    if (!feedbackData || feedbackData.length === 0) {
      return NextResponse.json({
        success: false,
        message: "No curated feedback available for test generation",
        tests: [],
      });
    }

    // Generate tests using Gemini
    const generatedTests: any[] = [];

    for (const feedback of feedbackData) {
      const prompt = `You are an expert Playwright test engineer. Generate a comprehensive E2E test based on this user interaction:

**Original Query:** ${feedback.query}

**AI Response:** ${feedback.actual_response}

**Curator Correction:** ${feedback.curator_correction}

Generate a Playwright test in TypeScript that:
1. Tests the correct behavior described in the curator correction
2. Uses proper data-testid selectors
3. Includes appropriate assertions and waits
4. Handles edge cases mentioned
5. Is idempotent and can run in CI/CD

Return ONLY valid TypeScript code, no markdown formatting or explanations.`;

      try {
        const result = await streamText({
          model: google("gemini-2.0-flash-exp"),
          prompt,
          temperature: 0.3,
          maxTokens: 2000,
        });

        let testCode = "";
        for await (const chunk of result.textStream) {
          testCode += chunk;
        }

        // Clean up the code (remove markdown if present)
        testCode = testCode.replace(/```typescript\n?/g, "").replace(/```\n?/g, "").trim();

        // Extract test name from code or generate one
        const testNameMatch = testCode.match(/test\.describe\(['"](.+?)['"]/);
        const testName = testNameMatch?.[1] || `Test for: ${feedback.query}`;

        // Calculate confidence based on curator correction clarity
        const confidence = feedback.confidence_score || 0.85;

        // Insert generated test
        const { data: insertedTest, error: insertError } = await supabase
          .from("rlhf_generated_tests")
          .insert({
            source_feedback_id: feedback.id,
            source_query: feedback.query,
            source_correction: feedback.curator_correction,
            test_name: testName,
            test_description: `Generated from curator feedback: ${feedback.query}`,
            test_code: testCode,
            test_language: "typescript",
            test_framework: "playwright",
            status: "pending",
            confidence: confidence,
            generation_model: "gemini-2.0-flash-exp",
            generation_prompt: prompt,
            generation_tokens: testCode.length / 4, // rough estimate
            generated_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (insertError) {
          console.error("Failed to insert test:", insertError);
          continue;
        }

        generatedTests.push(insertedTest);
      } catch (genError) {
        console.error("Error generating test:", genError);
        continue;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully generated ${generatedTests.length} test(s)`,
      tests: generatedTests,
      source: feedbackData.length,
    });
  } catch (error) {
    console.error("RLHF test generation error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

