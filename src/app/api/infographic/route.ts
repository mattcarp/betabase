/**
 * Infographic Generation API
 *
 * POST /api/infographic
 *
 * Generates an infographic using Nano Banana Pro (Gemini 3 Pro Image)
 * based on the question and RAG answer.
 *
 * This endpoint is designed to be called in PARALLEL with the chat response:
 * 1. Chat starts streaming text immediately
 * 2. This endpoint generates the infographic in the background
 * 3. Client displays infographic when ready
 */

import { NextResponse } from "next/server";
import { infographicService, type InfographicType } from "@/services/infographicService";

export const runtime = "nodejs";
export const maxDuration = 60; // Nano Banana Pro can take up to 30s

interface InfographicRequestBody {
  question: string;
  answer: string;
  type?: InfographicType;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as InfographicRequestBody;
    const { question, answer, type } = body;

    if (!question || !answer) {
      return NextResponse.json(
        { error: "Missing required fields: question and answer" },
        { status: 400 }
      );
    }

    // Check if service is available
    if (!infographicService.isAvailable()) {
      return NextResponse.json(
        { error: "Infographic generation not available (missing API key)" },
        { status: 503 }
      );
    }

    // Auto-detect type if not provided
    const { should, type: detectedType } = infographicService.shouldGenerateInfographic(question);

    if (!should && !type) {
      return NextResponse.json(
        {
          generated: false,
          reason: "Question does not appear to benefit from an infographic",
        },
        { status: 200 }
      );
    }

    const infographicType = type || detectedType || "explainer";

    // Generate the infographic
    const result = await infographicService.generate({
      question,
      answer,
      type: infographicType,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          generated: false,
          error: result.error,
          generationTimeMs: result.generationTimeMs,
        },
        { status: 200 } // Don't fail the request, just indicate no image
      );
    }

    return NextResponse.json({
      generated: true,
      imageData: result.imageData,
      mimeType: result.mimeType,
      type: infographicType,
      generationTimeMs: result.generationTimeMs,
    });
  } catch (error) {
    console.error("[API/Infographic] Error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        generated: false,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/infographic?question=...
 *
 * Check if a question would benefit from an infographic
 * (useful for client-side pre-check)
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const question = searchParams.get("question");

  if (!question) {
    return NextResponse.json({ error: "Missing question parameter" }, { status: 400 });
  }

  const { should, type } = infographicService.shouldGenerateInfographic(question);

  return NextResponse.json({
    shouldGenerate: should,
    type,
    available: infographicService.isAvailable(),
  });
}
