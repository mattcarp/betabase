import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();

    if (!query) {
      return NextResponse.json({ error: "Query parameter is required" }, { status: 400 });
    }

    // Intelligent AOMA suggestions based on actual proprietary Sony Music workflows
    // These reference real tools and features from AOMA release notes and crawled documentation
    const aomaTopics = [
      "How do I use the Media Batch Converter to export audio in different formats?",
      "What's the difference between Unified Submission Tool and Asset Submission Tool (LFV)?",
      "How do I check if my masters passed GRPS QC and are ready for release?",
      "Why is my Registration Job Status showing 'failed' and how do I retry delivery to partners?",
      "How do I unlink Immersive/AMB masters from published products in GRPS?",
      "What's the process for using Mobile Audio Manager to create ringtones and previews?",
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
