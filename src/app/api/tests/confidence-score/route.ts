import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const geminiApiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;

interface ConfidenceRequest {
  testId: number;
  testName: string;
  description: string;
  preconditions?: string;
  app_under_test?: string;
  execution_count?: number;
  pass_count?: number;
  last_executed_at?: string;
}

interface ConfidenceResult {
  score: number;
  level: "high" | "medium" | "low";
  rationale: string;
  automationCandidate: boolean;
  suggestedPriority: "P1" | "P2" | "P3" | "P4";
  factors: {
    name: string;
    impact: "positive" | "negative" | "neutral";
    weight: number;
    explanation: string;
  }[];
}

export async function POST(request: NextRequest) {
  try {
    const body: ConfidenceRequest = await request.json();
    const { testId, testName, description, preconditions, app_under_test, execution_count, pass_count, last_executed_at } = body;

    if (!testName && !description) {
      return NextResponse.json(
        { error: "testName or description is required" },
        { status: 400 }
      );
    }

    // Calculate base confidence from execution history
    let baseConfidence = 0.3;
    const factors: ConfidenceResult["factors"] = [];

    // Factor 1: Execution history
    if (execution_count && execution_count > 0) {
      const passRate = (pass_count || 0) / execution_count;
      if (passRate > 0.8) {
        baseConfidence += 0.3;
        factors.push({
          name: "High Pass Rate",
          impact: "positive",
          weight: 0.3,
          explanation: `${Math.round(passRate * 100)}% pass rate from ${execution_count} executions`,
        });
      } else if (passRate > 0.5) {
        baseConfidence += 0.15;
        factors.push({
          name: "Moderate Pass Rate",
          impact: "neutral",
          weight: 0.15,
          explanation: `${Math.round(passRate * 100)}% pass rate - may need review`,
        });
      } else {
        factors.push({
          name: "Low Pass Rate",
          impact: "negative",
          weight: -0.1,
          explanation: `${Math.round(passRate * 100)}% pass rate - likely outdated or flaky`,
        });
      }
    } else {
      factors.push({
        name: "Never Executed",
        impact: "neutral",
        weight: 0,
        explanation: "No execution history available",
      });
    }

    // Factor 2: Recency
    if (last_executed_at) {
      const daysSince = (Date.now() - new Date(last_executed_at).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince < 30) {
        baseConfidence += 0.15;
        factors.push({
          name: "Recently Executed",
          impact: "positive",
          weight: 0.15,
          explanation: `Last run ${Math.round(daysSince)} days ago`,
        });
      } else if (daysSince > 365) {
        baseConfidence -= 0.1;
        factors.push({
          name: "Stale Test",
          impact: "negative",
          weight: -0.1,
          explanation: `Not run in ${Math.round(daysSince / 30)} months`,
        });
      }
    }

    // Factor 3: Description quality
    const descLength = (description || "").length + (preconditions || "").length;
    if (descLength > 200) {
      baseConfidence += 0.1;
      factors.push({
        name: "Detailed Description",
        impact: "positive",
        weight: 0.1,
        explanation: "Well-documented test case",
      });
    } else if (descLength < 30) {
      baseConfidence -= 0.1;
      factors.push({
        name: "Sparse Description",
        impact: "negative",
        weight: -0.1,
        explanation: "Limited documentation may affect automation accuracy",
      });
    }

    // Use Gemini for semantic analysis if available
    let aiAnalysis: { automationCandidate: boolean; rationale: string } | null = null;

    if (geminiApiKey && description) {
      try {
        const genAI = new GoogleGenerativeAI(geminiApiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });

        const prompt = `You are a QA automation expert. Analyze this test case and determine:
1. Is this a good candidate for Playwright automation? (true/false)
2. Brief rationale (2-3 sentences)

Test Name: ${testName}
Description: ${description}
${preconditions ? `Preconditions: ${preconditions}` : ""}
Application: ${app_under_test || "Unknown"}
${execution_count ? `Execution History: ${execution_count} runs, ${pass_count || 0} passed` : "No execution history"}

Respond ONLY in this JSON format:
{"automationCandidate": boolean, "rationale": "string"}`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        
        // Parse JSON from response
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          aiAnalysis = JSON.parse(jsonMatch[0]);
          
          if (aiAnalysis?.automationCandidate) {
            baseConfidence += 0.1;
            factors.push({
              name: "AI: Good Automation Candidate",
              impact: "positive",
              weight: 0.1,
              explanation: aiAnalysis.rationale.substring(0, 100),
            });
          } else if (aiAnalysis) {
            factors.push({
              name: "AI: Limited Automation Potential",
              impact: "neutral",
              weight: 0,
              explanation: aiAnalysis.rationale.substring(0, 100),
            });
          }
        }
      } catch (aiError) {
        console.warn("AI analysis failed, using heuristic-only scoring:", aiError);
      }
    }

    // Clamp score between 0 and 1
    const finalScore = Math.max(0, Math.min(1, baseConfidence));

    // Determine level
    let level: ConfidenceResult["level"] = "low";
    if (finalScore >= 0.7) level = "high";
    else if (finalScore >= 0.4) level = "medium";

    // Determine priority
    let suggestedPriority: ConfidenceResult["suggestedPriority"] = "P4";
    if (finalScore >= 0.8) suggestedPriority = "P1";
    else if (finalScore >= 0.6) suggestedPriority = "P2";
    else if (finalScore >= 0.4) suggestedPriority = "P3";

    const result: ConfidenceResult = {
      score: Math.round(finalScore * 100) / 100,
      level,
      rationale: aiAnalysis?.rationale || generateHeuristicRationale(factors),
      automationCandidate: aiAnalysis?.automationCandidate ?? (finalScore >= 0.5),
      suggestedPriority,
      factors,
    };

    // Optionally save to database
    if (testId) {
      try {
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        // Store in a confidence_scores table or update bb_case metadata
        // For now, we'll just log it
        console.log(`[CONFIDENCE] Test ${testId}: ${result.score} (${result.level})`);
      } catch (dbError) {
        console.warn("Failed to save confidence score:", dbError);
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error calculating confidence:", error);
    return NextResponse.json(
      { error: "Failed to calculate confidence score", details: String(error) },
      { status: 500 }
    );
  }
}

function generateHeuristicRationale(factors: ConfidenceResult["factors"]): string {
  const positives = factors.filter(f => f.impact === "positive").map(f => f.name);
  const negatives = factors.filter(f => f.impact === "negative").map(f => f.name);

  if (positives.length > negatives.length) {
    return `Good automation candidate based on: ${positives.join(", ")}. ${negatives.length > 0 ? `Consider: ${negatives.join(", ")}.` : ""}`;
  } else if (negatives.length > 0) {
    return `Limited automation potential due to: ${negatives.join(", ")}. ${positives.length > 0 ? `Strengths: ${positives.join(", ")}.` : ""}`;
  }
  return "Moderate automation potential. Manual review recommended.";
}

