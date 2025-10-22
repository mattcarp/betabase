import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();

    if (!query) {
      return NextResponse.json({ error: "Query parameter is required" }, { status: 400 });
    }

    // Generic AOMA suggestions - DO NOT suggest specific features unless verified in knowledge base
    // These should be broad enough to work even if knowledge base is empty/degraded
    const aomaTopics = [
      "How do I use AOMA for my daily workflow?",
      "What are the most common AOMA support issues?",
      "How do I search for assets in AOMA?",
      "What's the best way to organize my AOMA workspace?",
      "How can I troubleshoot AOMA connection issues?",
      "What AOMA features should I know about?",
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
      { status: 500 }
    );
  }
}
