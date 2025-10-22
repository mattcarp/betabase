/**
 * AOMA MCP Proxy API Route
 * Proxies AOMA MCP requests through Claude's MCP system for browser compatibility
 */

import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const response = NextResponse.json({
    status: "healthy",
    services: {
      aomaProxy: { status: true },
      claudeMcp: { status: true },
    },
    metrics: {
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    },
  });

  // Add CORS headers
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

  return response;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, tool, args } = body;

    console.log("🔧 AOMA MCP Proxy request:", { action, tool, args });

    switch (action) {
      case "health":
        const healthResponse = NextResponse.json({
          status: "healthy",
          services: {
            aomaProxy: { status: true },
            claudeMcp: { status: true },
          },
          metrics: {
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
          },
        });
        healthResponse.headers.set("Access-Control-Allow-Origin", "*");
        healthResponse.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        healthResponse.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
        return healthResponse;

      case "tools/list":
        const toolsResponse = NextResponse.json({
          tools: [
            {
              name: "query_aoma_knowledge",
              description: "Query Sony Music AOMA knowledge base",
              inputSchema: {
                type: "object",
                properties: {
                  query: { type: "string" },
                  strategy: {
                    type: "string",
                    enum: ["comprehensive", "focused", "rapid"],
                  },
                },
                required: ["query"],
              },
            },
            {
              name: "search_jira_tickets",
              description: "Search Sony Music Jira tickets",
              inputSchema: {
                type: "object",
                properties: {
                  query: { type: "string" },
                  maxResults: { type: "number" },
                },
                required: ["query"],
              },
            },
            {
              name: "analyze_development_context",
              description: "Analyze current development context",
              inputSchema: {
                type: "object",
                properties: {
                  currentTask: { type: "string" },
                  codeContext: { type: "string" },
                },
                required: ["currentTask"],
              },
            },
          ],
        });
        toolsResponse.headers.set("Access-Control-Allow-Origin", "*");
        toolsResponse.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        toolsResponse.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
        return toolsResponse;

      case "tools/call":
        // Proxy the request to the actual AOMA MCP Lambda server
        try {
          // Use the actual AOMA Lambda URL from environment
          const aomaUrl =
            process.env.NEXT_PUBLIC_AOMA_MESH_RPC_URL ||
            process.env.NEXT_PUBLIC_AOMA_MESH_RPC_URL ||
            "https://sa64ce3rvpb7a3tztugdwrhxgu0xlgpu.lambda-url.us-east-2.on.aws";

          console.log("🔧 Environment check:", {
            AOMA_URL: aomaUrl,
            NODE_ENV: process.env.NODE_ENV,
          });

          const rpcPayload = {
            jsonrpc: "2.0",
            id: 1,
            method: "tools/call",
            params: {
              name: tool,
              arguments: args || {},
            },
          };

          console.log("🔄 Proxying request to AOMA Lambda:", {
            aomaUrl,
            tool,
            args,
          });

          const aomaResponse = await fetch(aomaUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(rpcPayload),
            signal: AbortSignal.timeout(45000), // 45 second timeout for comprehensive queries
          });

          if (!aomaResponse.ok) {
            throw new Error(
              `AOMA request failed: ${aomaResponse.status} ${aomaResponse.statusText}`
            );
          }

          const aomaData = await aomaResponse.json();

          if (aomaData.error) {
            throw new Error(`AOMA RPC error: ${aomaData.error.message}`);
          }

          console.log("✅ AOMA response received successfully");

          const successResponse = NextResponse.json({
            success: true,
            data: aomaData.result,
          });
          successResponse.headers.set("Access-Control-Allow-Origin", "*");
          successResponse.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
          successResponse.headers.set(
            "Access-Control-Allow-Headers",
            "Content-Type, Authorization"
          );
          return successResponse;
        } catch (error) {
          console.error("❌ AOMA proxy failed:", error);

          // Return proper error response - no fake data
          const errorResponse = NextResponse.json(
            {
              success: false,
              error: "AOMA MCP server unavailable",
              message:
                "Sorry, I couldn't connect to the AOMA knowledge servers right now. Please try again later.",
              details: error instanceof Error ? error.message : "Connection failed",
              timestamp: new Date().toISOString(),
            },
            { status: 503 }
          );
          errorResponse.headers.set("Access-Control-Allow-Origin", "*");
          errorResponse.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
          errorResponse.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
          return errorResponse;
        }

      default:
        const invalidActionResponse = NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
        invalidActionResponse.headers.set("Access-Control-Allow-Origin", "*");
        invalidActionResponse.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        invalidActionResponse.headers.set(
          "Access-Control-Allow-Headers",
          "Content-Type, Authorization"
        );
        return invalidActionResponse;
    }
  } catch (error) {
    console.error("AOMA MCP Proxy Error:", error);
    const serverErrorResponse = NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
    serverErrorResponse.headers.set("Access-Control-Allow-Origin", "*");
    serverErrorResponse.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    serverErrorResponse.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    return serverErrorResponse;
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
