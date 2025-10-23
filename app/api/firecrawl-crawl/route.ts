import { NextRequest, NextResponse } from "next/server";
import Firecrawl from "@mendable/firecrawl-js";
import { storeFirecrawlData, getFirecrawlAnalysis } from "../../../lib/supabase";
import OpenAI from "openai";
import { aomaStageAuthenticator } from "../../../src/services/aomaStageAuthenticator";
import { aomaUIAnalyzer } from "../../../src/services/aomaUIAnalyzer";

// Force dynamic mode to prevent build-time evaluation
export const dynamic = "force-dynamic";
// Only allow crawling against the AOMA staging host (from env or default)
const STAGE_URL = process.env.AOMA_STAGE_URL || "https://aoma-stage.smcdp-de.net";
let ALLOWED_STAGE_HOST = "aoma-stage.smcdp-de.net";
try {
  ALLOWED_STAGE_HOST = new URL(STAGE_URL).host;
} catch (_) {
  // Fallback to default host
}

function assertStageUrl(targetUrl: string) {
  try {
    const { host } = new URL(targetUrl);
    if (host !== ALLOWED_STAGE_HOST) {
      throw new Error(`Only staging host is allowed: ${ALLOWED_STAGE_HOST}`);
    }
  } catch (e) {
    throw new Error("Invalid or disallowed URL for staging crawl");
  }
}

/**
 * Firecrawl → Supabase Integration for AOMA UI Analysis
 *
 * This crawls AOMA pages, analyzes the UI structure, and stores
 * the data in Supabase for Computer Use training enhancement.
 *
 * Expected improvement: 38% → 70-80% success rate
 */

// Initialize clients lazily to avoid build-time errors
let firecrawl: Firecrawl | null = null;
let openai: OpenAI | null = null;

const getClients = () => {
  if (!firecrawl && process.env.FIRECRAWL_API_KEY) {
    firecrawl = new Firecrawl({
      apiKey: process.env.FIRECRAWL_API_KEY,
    });
  }
  if (!openai && process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return { firecrawl, openai };
};

// POST /api/firecrawl-crawl - Crawl and analyze a URL
export async function POST(req: NextRequest) {
  try {
    const { firecrawl: firecrawlClient } = getClients();

    // Require Firecrawl only; OpenAI is optional (embeddings skipped if absent)
    if (!firecrawlClient) {
      return NextResponse.json({ error: "Firecrawl API key not configured" }, { status: 500 });
    }
    const { url, options = {} } = await req.json();

    // Enforce staging-only crawls
    assertStageUrl(url);

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Check if we already have recent data for this URL
    const existingData = await getFirecrawlAnalysis(url);
    if (existingData) {
      const hoursSinceCrawl =
        (Date.now() - new Date(existingData.crawled_at).getTime()) / (1000 * 60 * 60);
      if (hoursSinceCrawl < 24) {
        return NextResponse.json({
          message: "Using cached data",
          data: existingData,
          cached: true,
        });
      }
    }
    // Build Cookie header from forwarded header or authenticator
    const forwardedCookie = req.headers.get("x-forward-cookie") || undefined;
    let cookieHeader = forwardedCookie || undefined;
    if (!cookieHeader) {
      try {
        cookieHeader = await aomaStageAuthenticator.getCookieHeader();
      } catch (e) {
        // No cookie available; proceed and let Firecrawl fail with 401/403
      }
    }

    // Crawl the page with Firecrawl (pass auth cookies)
    console.log(`Crawling ${url} with Firecrawl...`);
    let crawlData: any = await firecrawlClient.scrape(url, {
      formats: ["markdown", "html", "summary"],
      headers: cookieHeader ? { Cookie: cookieHeader } : undefined,
      ...options,
    });

    // If unauthorized, attempt one re-auth + retry
    const unauthorized = (d: any) => {
      const code = (d?.status || d?.statusCode || d?.status_code) as number | undefined;
      const msg = (d?.error || d?.message || "") as string;
      return code === 401 || code === 403 || /401|403|unauthor/i.test(msg || "");
    };
    if (!crawlData?.success && unauthorized(crawlData)) {
      try {
        const refreshedCookie = await aomaStageAuthenticator.ensureAuthenticated();
        crawlData = await firecrawlClient.scrape(url, {
          formats: ["markdown", "html", "summary"],
          headers: { Cookie: refreshedCookie },
          ...options,
        });
      } catch (_) {}
    }

    if (!crawlData.success) {
      throw new Error("Failed to crawl URL");
    }

    // Analyze via aomaUIAnalyzer
    const htmlForAnalysis = crawlData.html || "";
    const analysis = aomaUIAnalyzer.analyze(url, htmlForAnalysis || crawlData);

    // Generate embeddings for semantic search
    const embedding = await generateEmbedding(analysis.summary);

    // Store in Supabase
    const storedData = await storeFirecrawlData(
      url,
      {
        title: analysis.title || crawlData.metadata?.title || "Untitled",
        elements: analysis.elements,
        selectors: analysis.selectors,
        navigationPaths: analysis.navigationPaths,
        testableFeatures: analysis.testableFeatures,
        userFlows: analysis.userFlows,
        metadata: {
          ...(crawlData.metadata || {}),
          markdown: crawlData.markdown,
          analysisVersion: "1.0",
          crawledAt: new Date().toISOString(),
        },
      },
      embedding
    );

    return NextResponse.json({
      message: "Successfully crawled and analyzed",
      data: storedData,
      cached: false,
    });
  } catch (error: any) {
    console.error("Firecrawl error:", error);
    return NextResponse.json(
      { error: "Failed to crawl URL", details: error.message },
      { status: 500 }
    );
  }
}

// Inline analyzer removed in favor of aomaUIAnalyzer

// Generate embeddings using OpenAI
async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const { openai: openaiClient } = getClients();
    if (!openaiClient) {
      throw new Error("OpenAI client not initialized");
    }
    const response = await openaiClient.embeddings.create({
      model: "text-embedding-ada-002",
      input: text,
    });
    return response.data[0].embedding;
  } catch (error) {
    console.error("Error generating embedding:", error);
    return [];
  }
}

// GET /api/firecrawl-crawl - Get crawled data for a URL
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "URL parameter is required" }, { status: 400 });
  }

  // Enforce staging-only reads by URL
  try {
    assertStageUrl(url);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Disallowed URL" }, { status: 400 });
  }

  try {
    const data = await getFirecrawlAnalysis(url);
    if (!data) {
      return NextResponse.json({ error: "No data found for this URL" }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to retrieve data", details: error.message },
      { status: 500 }
    );
  }
}
