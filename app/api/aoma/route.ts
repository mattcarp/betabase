import { NextResponse } from "next/server";

const RAILWAY_URL = "https://luminous-dedication-production.up.railway.app";

export async function POST(req: Request) {
  try {
    const { query, strategy = "focused" } = await req.json();

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    console.log("🎯 Direct AOMA Railway query:", query);

    // Call Railway AOMA server via RPC endpoint
    const response = await fetch(`${RAILWAY_URL}/rpc`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "User-Agent": "SIAM-AOMA-Client/1.0"
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: {
          name: "query_aoma_knowledge",
          arguments: {
            query: query,
            strategy: strategy
          }
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`Railway AOMA server responded with ${response.status}: ${response.statusText}`);
    }

    const rpcResponse = await response.json();
    
    console.log("✅ AOMA Railway query successful");

    // Extract the actual result from JSON-RPC wrapper
    const result = rpcResponse.result || rpcResponse;

    return NextResponse.json({
      success: true,
      result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    // BE HONEST about failures
    console.error("❌ AOMA Railway API error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "AOMA connection failed",
        message: "Unable to connect to AOMA knowledge base on Railway.",
        timestamp: new Date().toISOString(),
      },
      { status: 503 },
    );
  }
}

export async function GET() {
  // Health check for AOMA endpoint
  try {
    // Quick health check to Railway
    const response = await fetch(`${RAILWAY_URL}/health`, {
      method: "GET",
      headers: { 
        "User-Agent": "SIAM-AOMA-Client/1.0"
      },
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });

    if (response.ok) {
      return NextResponse.json({
        status: "healthy",
        service: "AOMA-MESH",
        railway_url: RAILWAY_URL,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error("Railway health check failed:", error);
  }

  return NextResponse.json(
    {
      status: "error",
      message: "AOMA Railway connection failed",
      railway_url: RAILWAY_URL,
      timestamp: new Date().toISOString(),
    },
    { status: 503 },
  );
}
