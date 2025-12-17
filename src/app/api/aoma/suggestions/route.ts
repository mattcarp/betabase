import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    let query;
    try {
      const body = await request.json();
      query = body.query;
    } catch (e) {
      // Empty body or invalid JSON
      query = null;
    }

    if (!query) {
      return NextResponse.json({ error: "Query parameter is required" }, { status: 400 });
    }

    // Premium suggested questions showcasing deep AOMA knowledge
    // Each triggers infographic generation and has pre-cached responses with Mermaid diagrams
    const aomaTopics = [
      "What are the different asset types in AOMA and how do they relate to each other?",
      "How does AOMA use AWS S3 storage tiers for long-term archiving?",
      "What's the difference between asset registration and master linking in AOMA?",
      "What are the permission levels in AOMA and what can each role do?",
      "What new UST features are being planned for the 2026 releases?",
      "How do I upload and archive digital assets in AOMA from preparation to storage?",
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
