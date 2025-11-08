/**
 * AOMA MCP Proxy API Route
 * Proxies AOMA MCP requests through Claude's MCP system for browser compatibility
 */

import { NextRequest, NextResponse } from "next/server";

export async function GET(_request: NextRequest) {
  return NextResponse.json({
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
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, tool, args } = body;

    console.log("🔧 AOMA MCP Proxy request:", { action, tool, args });

    switch (action) {
      case "health":
        return NextResponse.json({
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

      case "tools/list":
        return NextResponse.json({
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

      case "tools/call":
        // Proxy the request to the AOMA MCP Railway server
        try {
          const railwayUrl =
            process.env.MCP_RAILWAY_URL || "https://luminous-dedication-production.up.railway.app";

          console.log("🔧 Environment check:", {
            MCP_RAILWAY_URL: process.env.MCP_RAILWAY_URL,
            NODE_ENV: process.env.NODE_ENV,
            finalUrl: railwayUrl,
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

          console.log("🔄 Proxying request to Railway:", {
            railwayUrl,
            tool,
            args,
          });

          const railwayResponse = await fetch(`${railwayUrl}/rpc`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(rpcPayload),
            signal: AbortSignal.timeout(25000), // Reduced to 25 seconds for better UX
          });

          if (!railwayResponse.ok) {
            throw new Error(
              `Railway request failed: ${railwayResponse.status} ${railwayResponse.statusText}`
            );
          }

          const railwayData = await railwayResponse.json();

          if (railwayData.error) {
            throw new Error(`Railway RPC error: ${railwayData.error.message}`);
          }

          console.log("✅ Railway response received successfully");

          return NextResponse.json({
            success: true,
            data: railwayData.result,
          });
        } catch (error) {
          console.error("❌ Railway proxy failed:", error);

          // Return proper error response - no fake data
          return NextResponse.json(
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
        }

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("AOMA MCP Proxy Error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  // YOLO SECURITY FIX: Lock down CORS to specific origins only
  const allowedOrigins =
    process.env.NODE_ENV === "production"
      ? ["https://thebetabase.com"]
      : ["http://localhost:3000", "http://127.0.0.1:3000"];

  const origin = request.headers.get("origin");
  const corsOrigin = origin && allowedOrigins.includes(origin) ? origin : "null";

  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": corsOrigin,
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Credentials": "true",
    },
  });
}
