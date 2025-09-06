import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // For now, return a basic MCP response structure
    return NextResponse.json({
      jsonrpc: "2.0",
      id: body.id || 1,
      result: {
        tools: [],
        serverInfo: {
          name: "siam-mcp-local",
          version: "1.0.0",
        },
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        error: {
          code: -32700,
          message: "Parse error",
        },
      },
      { status: 400 },
    );
  }
}
