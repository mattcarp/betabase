/**
 * API Endpoint for Test Intelligence System
 * Provides unified access to test analysis, knowledge search, and support intelligence
 */

import { NextRequest, NextResponse } from "next/server";
import { unifiedTestIntelligence } from "@/services/unified-test-intelligence";
import { supportChatIntelligence } from "@/services/support-chat-intelligence";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, params = {} } = body;

    console.log(`📊 Test Intelligence API: ${action}`, params);

    switch (action) {
      case "analyze-aut": {
        // Analyze Application Under Test
        const { url = "https://aoma-stage.smcdp-de.net" } = params;
        const analysis = await unifiedTestIntelligence.gatherAUTIntelligence(url);

        return NextResponse.json({
          success: true,
          data: analysis,
          message: `Analyzed ${analysis.testableFeatures.length} features and ${analysis.userFlows.length} flows`,
        });
      }

      case "process-failure": {
        // Process test failure and generate solution
        const { testResult } = params;
        if (!testResult) {
          return NextResponse.json(
            {
              success: false,
              error: "Test result data required",
            },
            { status: 400 }
          );
        }

        const knowledge = await unifiedTestIntelligence.processTestFailure(testResult);

        return NextResponse.json({
          success: true,
          data: knowledge,
          message: "Test failure processed and solution generated",
        });
      }

      case "search-knowledge": {
        // Search test knowledge base
        const { query, sources, minRelevance = 70, limit = 10 } = params;
        if (!query) {
          return NextResponse.json(
            {
              success: false,
              error: "Search query required",
            },
            { status: 400 }
          );
        }

        const results = await unifiedTestIntelligence.searchTestKnowledge(query, {
          sources,
          minRelevance,
          limit,
        });

        return NextResponse.json({
          success: true,
          data: results,
          message: `Found ${results.length} relevant knowledge entries`,
        });
      }

      case "support-query": {
        // Answer support question
        const { question, context } = params;
        if (!question) {
          return NextResponse.json(
            {
              success: false,
              error: "Question required",
            },
            { status: 400 }
          );
        }

        const response = await supportChatIntelligence.querySupportKnowledge({
          question,
          context,
        });

        return NextResponse.json({
          success: true,
          data: response,
          message: `Generated answer with ${response.confidence}% confidence`,
        });
      }

      case "generate-tests": {
        // Generate tests from support issues
        const recommendations = await unifiedTestIntelligence.generateTestsFromSupport();

        return NextResponse.json({
          success: true,
          data: recommendations,
          message: `Generated ${recommendations.length} test recommendations`,
        });
      }

      case "record-feedback": {
        // Record support interaction feedback
        const { question, answer, wasHelpful, feedback } = params;
        if (!question || !answer) {
          return NextResponse.json(
            {
              success: false,
              error: "Question and answer required",
            },
            { status: 400 }
          );
        }

        await supportChatIntelligence.learnFromInteraction(question, answer, wasHelpful, feedback);

        return NextResponse.json({
          success: true,
          message: `Recorded ${wasHelpful ? "helpful" : "unhelpful"} interaction`,
        });
      }

      case "common-issues": {
        // Get common support issues
        const { limit = 10 } = params;
        const issues = await supportChatIntelligence.getCommonIssues(limit);

        return NextResponse.json({
          success: true,
          data: issues,
          message: `Retrieved ${issues.length} common issues`,
        });
      }

      case "health": {
        // Health check
        return NextResponse.json({
          success: true,
          message: "Test Intelligence API is healthy",
          configuration: {
            firecrawl:
              !!process.env.FIRECRAWL_API_KEY && !process.env.FIRECRAWL_API_KEY.includes("YOUR_"),
            supabase: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
            aoma: !!process.env.NEXT_PUBLIC_AOMA_MESH_SERVER_URL,
          },
        });
      }

      default:
        return NextResponse.json(
          {
            success: false,
            error: `Unknown action: ${action}`,
            availableActions: [
              "analyze-aut",
              "process-failure",
              "search-knowledge",
              "support-query",
              "generate-tests",
              "record-feedback",
              "common-issues",
              "health",
            ],
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("❌ Test Intelligence API Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// GET endpoint for health check
export async function GET() {
  return NextResponse.json({
    success: true,
    message: "Test Intelligence API",
    version: "1.0.0",
    endpoints: {
      "POST /api/test-intelligence": {
        actions: [
          "analyze-aut - Analyze application for test generation",
          "process-failure - Process test failure and generate solution",
          "search-knowledge - Search test knowledge base",
          "support-query - Answer support questions",
          "generate-tests - Generate tests from support issues",
          "record-feedback - Record support interaction feedback",
          "common-issues - Get common support issues",
          "health - Check API health and configuration",
        ],
      },
    },
    configuration: {
      firecrawl:
        !!process.env.FIRECRAWL_API_KEY && !process.env.FIRECRAWL_API_KEY.includes("YOUR_"),
      supabase: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      aoma: !!process.env.NEXT_PUBLIC_AOMA_MESH_SERVER_URL,
    },
  });
}
