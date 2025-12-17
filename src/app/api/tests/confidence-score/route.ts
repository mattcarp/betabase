import { NextRequest, NextResponse } from "next/server";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY,
});

const ConfidenceSchema = z.object({
  score: z.number().min(0).max(1).describe("Confidence score from 0 to 1"),
  rationale: z.string().describe("Brief explanation of the score"),
  recommendations: z.array(z.string()).describe("List of recommendations to improve the test"),
  automationFeasibility: z.enum(["high", "medium", "low"]).describe("How easy it would be to automate this test"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      testId, 
      testName, 
      description, 
      preconditions,
      app_under_test,
      execution_count,
      pass_count,
      last_executed_at,
    } = body;

    // Calculate base metrics
    const hasExecutions = execution_count > 0;
    const passRate = hasExecutions ? pass_count / execution_count : 0;
    const daysSinceExecution = last_executed_at 
      ? Math.floor((Date.now() - new Date(last_executed_at).getTime()) / (1000 * 60 * 60 * 24))
      : 999;

    const prompt = `Analyze this legacy test case and provide a confidence score for its reliability and automation potential.

**Test Information:**
- Test ID: ${testId}
- Test Name: ${testName}
- Description: ${description}
- Preconditions: ${preconditions || "None specified"}
- Application: ${app_under_test}

**Execution History:**
- Total executions: ${execution_count}
- Pass rate: ${hasExecutions ? (passRate * 100).toFixed(1) : "N/A"}%
- Days since last execution: ${daysSinceExecution === 999 ? "Never executed" : daysSinceExecution}

**Scoring Criteria:**
- How well-defined is the test? (clear steps, expected results)
- Is it suitable for automation?
- Based on execution history, how reliable is it?
- What's the business value/risk of this test?

Provide a confidence score (0-1), a brief rationale, recommendations for improvement, and automation feasibility assessment.`;

    const { object } = await generateObject({
      model: google("gemini-2.0-flash"),
      schema: ConfidenceSchema,
      prompt,
    });

    return NextResponse.json({
      success: true,
      testId,
      ...object,
      metrics: {
        executionCount: execution_count,
        passRate: hasExecutions ? passRate : null,
        daysSinceExecution: daysSinceExecution === 999 ? null : daysSinceExecution,
      },
    });
  } catch (error) {
    console.error("Error calculating confidence:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to calculate confidence",
        details: String(error),
      },
      { status: 500 }
    );
  }
}
