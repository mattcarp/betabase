/**
 * Zeitgeist API - Hot Topics Intelligence
 *
 * Returns the top suggested questions based on aggregated activity signals
 * from RLHF feedback, Jira tickets, test failures, and chat history.
 *
 * GET /api/zeitgeist - Returns top 6 suggestions for chat landing page
 */

import { NextResponse } from "next/server";
import { getSuggestions } from "@/services/zeitgeistService";

export const runtime = "nodejs";

const FALLBACK_QUESTIONS = [
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
];

export async function GET() {
  try {
    const suggestions = await getSuggestions();

    // If we got suggestions from zeitgeist service, format them
    if (suggestions && suggestions.length > 0) {
      return NextResponse.json({
        questions: suggestions.map((q, idx) => ({
          id: String(idx + 1),
          question: q,
          category: "zeitgeist", // Dynamic from aggregated signals
        })),
        generatedAt: new Date().toISOString(),
        count: suggestions.length,
        source: "zeitgeist_service",
      });
    }

    // Fallback to static questions
    return NextResponse.json({
      questions: FALLBACK_QUESTIONS,
      generatedAt: new Date().toISOString(),
      count: FALLBACK_QUESTIONS.length,
      fallback: true,
    });
  } catch (error) {
    console.error("[API] Error fetching zeitgeist suggestions:", error);

    // Return fallback questions on error (never fail the chat page)
    return NextResponse.json({
      questions: FALLBACK_QUESTIONS,
      generatedAt: new Date().toISOString(),
      count: FALLBACK_QUESTIONS.length,
      fallback: true,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
