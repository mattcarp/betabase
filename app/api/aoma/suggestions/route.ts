import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();

    if (!query) {
      return NextResponse.json(
        { error: "Query parameter is required" },
        { status: 400 },
      );
    }

    // High-confidence AOMA topics based on recent features and common support issues
    const aomaTopics = [
      "How does the new automated QC for audio files work?",
      "What's new with AOMA 3 linking and AMEBA service integration?",
      "How do I export assets to Sony Ci workspaces?",
      "What are the latest master details page enhancements?",
      "How can I use the new batch media converter?",
      "What are common AOMA support issues and solutions?",
    ];

    return NextResponse.json({
      suggestions: aomaTopics,
      source: "AOMA Knowledge Base",
      confidence: "high",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("AOMA suggestions error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch AOMA suggestions",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}
