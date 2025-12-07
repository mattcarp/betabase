/**
 * RAG Comparison API Endpoint
 *
 * Provides A/B testing comparison between basic and advanced RAG
 */

import { NextRequest, NextResponse } from "next/server";
import { compareRAGStrategies } from "@/services/ragComparison";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query, sessionId } = body;

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { error: "Query parameter is required and must be a string" },
        { status: 400 }
      );
    }

    console.log("[RAG-Compare] Running comparison for query:", query.substring(0, 100));

    const results = await compareRAGStrategies(query, sessionId);

    return NextResponse.json(results);
  } catch (error: any) {
    console.error("[RAG-Compare] Error:", error);
    return NextResponse.json(
      { error: "Failed to compare RAG strategies", details: error.message },
      { status: 500 }
    );
  }
}
