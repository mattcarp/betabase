/**
 * Zeitgeist Questions API
 *
 * Returns the cached suggested questions for the chat interface.
 * These are refreshed daily by the cron job.
 *
 * GET /api/zeitgeist - Returns 6 suggested questions
 */

import { NextResponse } from "next/server";
import { getZeitgeistQuestions } from "@/services/zeitgeistQuestionsService";

export const runtime = "nodejs";

export async function GET() {
  try {
    const questions = await getZeitgeistQuestions();

    return NextResponse.json({
      questions: questions.map((q) => ({
        id: q.id,
        question: q.question,
        category: q.category,
      })),
      generatedAt: questions[0]?.generatedAt || new Date().toISOString(),
      count: questions.length,
    });
  } catch (error) {
    console.error("[API] Error fetching zeitgeist questions:", error);

    // Return default questions on error (never fail the chat page)
    return NextResponse.json({
      questions: [
        {
          id: "1",
          question: "What are the steps to link a product to a master in AOMA?",
          category: "common_problem",
        },
        {
          id: "2",
          question: "What new features are in the latest AOMA release?",
          category: "new_feature",
        },
        {
          id: "3",
          question: "How do I register a short-form video in AOMA?",
          category: "common_problem",
        },
        {
          id: "4",
          question: "What video quality issues cause rejection from Select Partners?",
          category: "documentation",
        },
        {
          id: "5",
          question: "What permissions do I need for the Unified Submission Tool?",
          category: "common_problem",
        },
        {
          id: "6",
          question: "What's the difference between Full Master and Side Linking?",
          category: "documentation",
        },
      ],
      generatedAt: new Date().toISOString(),
      count: 6,
      fallback: true,
    });
  }
}
