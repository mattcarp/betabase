import { NextRequest, NextResponse } from "next/server";

interface CrawlSource {
  id: string;
  name: string;
  url: string;
  type: "documentation" | "api-spec" | "github" | "confluence";
  status: "active" | "paused" | "error";
  documentsCount: number;
  lastSync: string;
  schedule: string;
}

interface CrawledDocument {
  id: string;
  url: string;
  title: string;
  content: string;
  extractedTests: string[];
  relevanceScore: number;
  lastCrawled: string;
  status: "success" | "partial" | "failed";
  linkedTests: number;
  size: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, url, sourceId } = body;

    switch (action) {
      case "crawl": {
        // Mock crawl initiation
        const crawlId = `crawl_${Date.now()}`;

        return NextResponse.json(
          {
            crawlId,
            status: "started",
            url,
            message: "Crawl initiated successfully",
            estimatedTime: 30, // seconds
          },
          { status: 200 }
        );
      }

      case "add-source": {
        // Mock adding a new crawl source
        const newSource: CrawlSource = {
          id: `source_${Date.now()}`,
          name: body.name || "New Documentation Source",
          url,
          type: body.type || "documentation",
          status: "active",
          documentsCount: 0,
          lastSync: new Date().toISOString(),
          schedule: body.schedule || "Daily",
        };

        return NextResponse.json(newSource, { status: 201 });
      }

      case "sync": {
        // Mock syncing a source
        return NextResponse.json(
          {
            sourceId,
            status: "syncing",
            message: "Sync started for source",
            timestamp: new Date().toISOString(),
          },
          { status: 200 }
        );
      }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Firecrawl operation error:", error);
    return NextResponse.json({ error: "Failed to perform Firecrawl operation" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const crawlId = searchParams.get("crawlId");

    if (crawlId) {
      // Mock crawl status
      return NextResponse.json(
        {
          crawlId,
          status: "completed",
          progress: 100,
          documentsFound: 15,
          patternsExtracted: 8,
          completedAt: new Date().toISOString(),
        },
        { status: 200 }
      );
    }

    if (type === "sources") {
      // Mock crawl sources
      const sources: CrawlSource[] = [
        {
          id: "1",
          name: "API Documentation",
          url: "https://docs.api.example.com",
          type: "documentation",
          status: "active",
          documentsCount: 145,
          lastSync: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          schedule: "Every 6 hours",
        },
        {
          id: "2",
          name: "GitHub Repository",
          url: "https://github.com/example/repo",
          type: "github",
          status: "active",
          documentsCount: 89,
          lastSync: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
          schedule: "Daily",
        },
        {
          id: "3",
          name: "Confluence Wiki",
          url: "https://example.atlassian.net/wiki",
          type: "confluence",
          status: "paused",
          documentsCount: 234,
          lastSync: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
          schedule: "Weekly",
        },
      ];

      return NextResponse.json(sources, { status: 200 });
    }

    // Default: return crawled documents
    const documents: CrawledDocument[] = [
      {
        id: "1",
        url: "https://docs.api.example.com/authentication",
        title: "Authentication Guide",
        content:
          "Complete guide for implementing authentication with magic links, OAuth, and JWT tokens...",
        extractedTests: [
          "Test magic link generation",
          "Verify OAuth flow",
          "Validate JWT token expiry",
          "Check session persistence",
        ],
        relevanceScore: 95,
        lastCrawled: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        status: "success",
        linkedTests: 12,
        size: "24 KB",
      },
      {
        id: "2",
        url: "https://docs.api.example.com/file-upload",
        title: "File Upload API",
        content:
          "API documentation for file upload endpoints including multipart form data handling...",
        extractedTests: [
          "Test file size limits",
          "Verify MIME type validation",
          "Check concurrent uploads",
          "Test progress tracking",
        ],
        relevanceScore: 88,
        lastCrawled: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        status: "success",
        linkedTests: 8,
        size: "18 KB",
      },
      {
        id: "3",
        url: "https://github.com/example/repo/blob/main/TESTING.md",
        title: "Testing Best Practices",
        content:
          "Repository testing guidelines including unit test patterns, integration test setup...",
        extractedTests: [
          "Unit test structure",
          "Mock service patterns",
          "Test data factories",
          "Assertion helpers",
        ],
        relevanceScore: 92,
        lastCrawled: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        status: "partial",
        linkedTests: 15,
        size: "32 KB",
      },
    ];

    return NextResponse.json(
      {
        documents,
        total: documents.length,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching Firecrawl data:", error);
    return NextResponse.json({ error: "Failed to fetch Firecrawl data" }, { status: 500 });
  }
}
