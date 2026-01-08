import { NextRequest, NextResponse } from "next/server";
import { getSuggestions } from "@/services/zeitgeistService";

// Fallback suggestions if zeitgeist fails
const DEFAULT_SUGGESTIONS = [
  "What are the different asset types in AOMA and how do they relate to each other?",
  "How does AOMA use AWS S3 storage tiers for long-term archiving?",
  "What's the difference between asset registration and master linking in AOMA?",
  "What are the permission levels in AOMA and what can each role do?",
  "What new UST features are being planned for the 2026 releases?",
  "How do I upload and archive digital assets in AOMA from preparation to storage?",
];

export async function POST(request: NextRequest) {
  try {
    let query;
    try {
      const body = await request.json();
      query = body.query;
    } catch (_e) {
      // Empty body or invalid JSON
      query = null;
    }

    if (!query) {
      return NextResponse.json({ error: "Query parameter is required" }, { status: 400 });
    }

    // FEAT-010: Get dynamic suggestions from Zeitgeist service
    // Falls back to defaults if zeitgeist fails
    let suggestions: string[];
    let source: string;

    try {
      suggestions = await getSuggestions();
      source = suggestions.length > 0 ? "Zeitgeist" : "Default";

      // If zeitgeist returns empty, use defaults
      if (suggestions.length === 0) {
        suggestions = DEFAULT_SUGGESTIONS;
      }
    } catch (zeitgeistError) {
      console.warn("[Suggestions] Zeitgeist failed, using defaults:", zeitgeistError);
      suggestions = DEFAULT_SUGGESTIONS;
      source = "Default";
    }

    return NextResponse.json({
      suggestions,
      source,
      confidence: source === "Zeitgeist" ? "high" : "medium",
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
