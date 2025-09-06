import { NextRequest, NextResponse } from "next/server";
import { firecrawlService } from "@/services/firecrawl-integration";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, action } = body;

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    switch (action) {
      case "analyze": {
        // Analyze the Application Under Test
        const analysis = await firecrawlService.analyzeAUT(url);

        return NextResponse.json(
          {
            success: true,
            analysis,
            timestamp: new Date().toISOString(),
            message: `Analyzed ${analysis.testableFeatures.length} features and ${analysis.userFlows.length} user flows`,
          },
          { status: 200 },
        );
      }

      case "research": {
        // Conduct deep research on a testing topic
        const { query } = body;
        if (!query) {
          return NextResponse.json(
            { error: "Query is required for research" },
            { status: 400 },
          );
        }

        const research = await firecrawlService.conductTestingResearch(query);

        return NextResponse.json(
          {
            success: true,
            research,
            timestamp: new Date().toISOString(),
          },
          { status: 200 },
        );
      }

      case "extract-patterns": {
        // Extract test patterns from documentation
        const { documentationUrls } = body;
        if (!documentationUrls || !Array.isArray(documentationUrls)) {
          return NextResponse.json(
            { error: "Documentation URLs array is required" },
            { status: 400 },
          );
        }

        const patterns =
          await firecrawlService.generateTestPatterns(documentationUrls);

        return NextResponse.json(
          {
            success: true,
            patterns,
            count: patterns.length,
            timestamp: new Date().toISOString(),
          },
          { status: 200 },
        );
      }

      default:
        return NextResponse.json(
          {
            error:
              "Invalid action. Use 'analyze', 'research', or 'extract-patterns'",
          },
          { status: 400 },
        );
    }
  } catch (error) {
    console.error("AUT analysis error:", error);
    return NextResponse.json(
      {
        error: "Failed to analyze AUT",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  // Return mock analysis for testing without Firecrawl API key
  const mockAnalysis = {
    testableFeatures: [
      {
        name: "Authentication Flow",
        description: "Magic link authentication with AWS Cognito",
        testPriority: "high",
        testTypes: ["e2e", "integration", "security"],
        selectors: [
          "[data-testid='email-input']",
          "[data-testid='send-magic-link']",
        ],
      },
      {
        name: "AI Chat Interface",
        description: "Streaming chat responses with multiple AI providers",
        testPriority: "high",
        testTypes: ["e2e", "integration", "performance"],
        selectors: [
          "[data-testid='chat-input']",
          "[data-testid='send-button']",
        ],
      },
      {
        name: "Test Dashboard",
        description: "Comprehensive testing command center with 8 panels",
        testPriority: "high",
        testTypes: ["e2e", "unit", "visual"],
        selectors: [
          "[data-testid='test-dashboard']",
          "[data-testid='run-tests']",
        ],
      },
      {
        name: "Document Upload",
        description: "File upload with multiple format support",
        testPriority: "medium",
        testTypes: ["e2e", "integration", "boundary"],
        selectors: [
          "[data-testid='file-upload']",
          "[data-testid='upload-button']",
        ],
      },
      {
        name: "AOMA Knowledge Panel",
        description: "Sony Music knowledge base integration",
        testPriority: "medium",
        testTypes: ["integration", "api"],
        selectors: ["[data-testid='aoma-panel']"],
      },
    ],
    userFlows: [
      {
        name: "User Authentication Journey",
        steps: [
          "Navigate to login page",
          "Enter email address",
          "Click send magic link",
          "Check email for magic link",
          "Click magic link",
          "Verify redirect to dashboard",
          "Confirm user session active",
        ],
        criticalPath: true,
      },
      {
        name: "AI Chat Interaction",
        steps: [
          "Navigate to chat interface",
          "Type message in input",
          "Send message",
          "Wait for AI response",
          "Verify streaming response",
          "Check response formatting",
          "Test follow-up questions",
        ],
        criticalPath: true,
      },
      {
        name: "Test Execution Flow",
        steps: [
          "Open Test Dashboard",
          "Select test suite",
          "Configure test options",
          "Click Run Tests",
          "Monitor execution progress",
          "View test results",
          "Export test report",
        ],
        criticalPath: true,
      },
      {
        name: "Document Processing",
        steps: [
          "Navigate to upload section",
          "Select file to upload",
          "Verify file preview",
          "Click upload button",
          "Monitor upload progress",
          "Verify processing complete",
          "Check document in library",
        ],
        criticalPath: false,
      },
    ],
    apiEndpoints: [
      "/api/auth/magic-link",
      "/api/chat",
      "/api/test/execute",
      "/api/test/results",
      "/api/test/generate",
      "/api/test/coverage",
      "/api/test/firecrawl",
      "/api/vector-store/files",
      "/api/aoma/health",
      "/api/health",
    ],
    documentationUrls: [
      "/docs/test-dashboard/README.md",
      "/docs/test-dashboard/PRD-unified-test-dashboard.md",
      "/CLAUDE.md",
    ],
    knowledgeExtracted: [
      {
        category: "authentication",
        content:
          "SIAM uses AWS Cognito for magic link authentication. Users enter their email and receive a secure link to login without passwords.",
        relevance: 95,
      },
      {
        category: "testing",
        content:
          "The Test Dashboard provides 8 specialized panels for comprehensive test management including execution, results, AI generation, trace viewing, coverage, flaky test detection, analytics, and Firecrawl integration.",
        relevance: 100,
      },
      {
        category: "ai-features",
        content:
          "SIAM integrates with multiple AI providers through Vercel AI SDK v5, supporting OpenAI, Anthropic, and other models for chat interactions and test generation.",
        relevance: 90,
      },
      {
        category: "knowledge-management",
        content:
          "AOMA Knowledge System provides Sony Music enterprise knowledge base integration with vector search and RAG capabilities.",
        relevance: 85,
      },
    ],
  };

  return NextResponse.json(
    {
      success: true,
      analysis: mockAnalysis,
      timestamp: new Date().toISOString(),
      message:
        "Mock analysis data (configure FIRECRAWL_API_KEY for real analysis)",
    },
    { status: 200 },
  );
}
