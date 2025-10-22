import { NextRequest, NextResponse } from "next/server";
import { aomaFirecrawl } from "@/src/services/aomaFirecrawlService";

export async function POST(request: NextRequest) {
  try {
    // Get crawl configuration from request body
    const config = await request.json().catch(() => ({}));

    // Execute crawl
    console.log("🚀 Starting AOMA crawl via API...");
    const result = await aomaFirecrawl.crawlAomaContent(config);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Crawl API error:", error);
    return NextResponse.json({ error: "Crawl failed", message: error.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Test endpoint - crawl a single page
    const url = request.nextUrl.searchParams.get("url") || "/";

    console.log(`🧪 Testing single page crawl: ${url}`);
    const result = await aomaFirecrawl.crawlSinglePage(url);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Test crawl error:", error);
    return NextResponse.json({ error: "Test failed", message: error.message }, { status: 500 });
  }
}
