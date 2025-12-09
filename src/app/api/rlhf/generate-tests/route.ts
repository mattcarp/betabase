import { NextRequest, NextResponse } from "next/server";
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Type for Supabase query results
interface PreferencePairResult {
  id: string;
  prompt: string;
  chosen: string;
  rejected: string;
  source_type: string;
  confidence: number;
}

interface FeedbackResult {
  id: string;
  query: string;
  response: string;
  correction: string | null;
  feedback_text: string | null;
}

/**
 * POST /api/rlhf/generate-tests
 *
 * Generates Playwright E2E tests from curated RLHF feedback.
 * Tests validate that the AI produces correct responses (chosen) not incorrect ones (rejected).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { source = "both", limit = 5 } = body;

    // Collect data from verified preference pairs AND corrected feedback
    const dataToProcess: Array<{
      id: string;
      prompt: string;
      expected_response: string;
      incorrect_response?: string;
      source_type: string;
    }> = [];

    // 1. Get verified preference pairs (if source includes 'pairs' or 'both')
    if (source === "pairs" || source === "both") {
      const { data: pairs, error: pairsError } = await supabase
        .from("preference_pairs")
        .select("id, prompt, chosen, rejected, source_type, confidence")
        .eq("curator_verified", true)
        .order("created_at", { ascending: false })
        .limit(Math.ceil(limit / 2));

      if (pairsError) {
        console.error("Error fetching preference pairs:", pairsError);
      } else if (pairs) {
        (pairs as PreferencePairResult[]).forEach((pair) => {
          dataToProcess.push({
            id: pair.id,
            prompt: pair.prompt,
            expected_response: pair.chosen,
            incorrect_response: pair.rejected,
            source_type: `preference_pair_${pair.source_type}`,
          });
        });
      }
    }

    // 2. Get corrected feedback (if source includes 'feedback' or 'both')
    if (source === "feedback" || source === "both") {
      const { data: feedback, error: feedbackError } = await supabase
        .from("rlhf_feedback")
        .select("id, query, response, correction, feedback_text")
        .eq("curator_approved", true)
        .not("correction", "is", null)
        .order("created_at", { ascending: false })
        .limit(Math.ceil(limit / 2));

      if (feedbackError) {
        console.error("Error fetching feedback:", feedbackError);
      } else if (feedback) {
        (feedback as FeedbackResult[]).forEach((fb) => {
          if (fb.correction) {
            dataToProcess.push({
              id: fb.id,
              prompt: fb.query,
              expected_response: fb.correction,
              incorrect_response: fb.response,
              source_type: "curator_correction",
            });
          }
        });
      }
    }

    if (dataToProcess.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "No curated data available. Please approve feedback or verify preference pairs first.",
          tests: [],
        },
        { status: 200 }
      );
    }

    // 3. Generate tests for each piece of curated data
    const generatedTests = [];

    for (const item of dataToProcess.slice(0, limit)) {
      try {
        const systemPrompt = `You are an expert test engineer specializing in AI response quality testing.
Generate a Playwright E2E test that validates an AI assistant produces the expected response.

Requirements:
- Use TypeScript and Playwright's test library
- Test should navigate to the chat interface
- Enter the user query
- Wait for and validate the AI response contains key elements from the expected response
- Include proper assertions and error handling
- Use semantic selectors when possible
- Do NOT use exact string matching - validate key concepts/phrases are present

Return ONLY the test code, no explanations.`;

        const prompt = `Generate a Playwright test for this AI interaction:

USER QUERY: ${item.prompt}

EXPECTED RESPONSE (key concepts to validate):
${item.expected_response.substring(0, 500)}

${
  item.incorrect_response
    ? `INCORRECT RESPONSE (should NOT contain these exact errors):
${item.incorrect_response.substring(0, 300)}`
    : ""
}

The test should validate the AI provides accurate information matching the expected response.`;

        const result = await generateText({
          model: openai("gpt-4o-mini"),
          system: systemPrompt,
          prompt,
          temperature: 0.5,
        });

        // Create test description
        const testDescription = `RLHF Test: Validate AI response for "${item.prompt.substring(0, 50)}..."`;

        // Save to database
        const { data: savedTest, error: saveError } = await supabase
          .from("rlhf_generated_tests")
          .insert({
            feedback_id: item.id,
            test_description: testDescription,
            test_code: result.text,
            original_query: item.prompt,
            curator_correction: item.expected_response,
            status: "pending",
            run_count: 0,
            pass_count: 0,
            fail_count: 0,
          })
          .select()
          .single();

        if (saveError) {
          console.error("Error saving test:", saveError);
          // Continue with next item even if save fails
          generatedTests.push({
            id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            test_description: testDescription,
            test_code: result.text,
            original_query: item.prompt,
            curator_correction: item.expected_response,
            status: "pending",
            source_type: item.source_type,
            saved: false,
          });
        } else {
          generatedTests.push({
            ...savedTest,
            source_type: item.source_type,
            saved: true,
          });
        }
      } catch (genError) {
        console.error("Error generating test for item:", item.id, genError);
        // Continue with next item
      }
    }

    return NextResponse.json({
      success: true,
      message: `Generated ${generatedTests.length} tests from ${dataToProcess.length} curated items`,
      tests: generatedTests,
      stats: {
        total_curated_items: dataToProcess.length,
        tests_generated: generatedTests.length,
        saved_to_database: generatedTests.filter((t: { saved: boolean }) => t.saved).length,
      },
    });
  } catch (error) {
    console.error("RLHF test generation error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate tests" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/rlhf/generate-tests
 *
 * Returns list of generated RLHF tests
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "50");

    let query = supabase
      .from("rlhf_generated_tests")
      .select("*")
      .order("generated_at", { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      // Table might not exist yet
      if (error.code === "42P01") {
        return NextResponse.json({
          tests: [],
          message: "No tests generated yet. Use POST to generate tests from curated feedback.",
        });
      }
      throw error;
    }

    return NextResponse.json({
      tests: data || [],
      total: data?.length || 0,
    });
  } catch (error) {
    console.error("Error fetching RLHF tests:", error);
    return NextResponse.json({ error: "Failed to fetch tests" }, { status: 500 });
  }
}
