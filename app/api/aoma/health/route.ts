import { NextResponse } from "next/server";

export async function GET() {
  try {
    // REAL HEALTH CHECK: Actually test the AOMA MCP server connection
    const mcpEndpoint = process.env.NODE_ENV === 'production'
      ? 'https://luminous-dedication-production.up.railway.app/rpc'
      : 'http://localhost:3333/rpc';

    console.log(`[Health] Testing AOMA MCP at: ${mcpEndpoint}`);

    const healthCheck = await fetch(mcpEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "health-check",
        method: "tools/call",
        params: {
          name: "get_system_health",
          arguments: {}
        }
      }),
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    const healthResult = await healthCheck.json();
    console.log('[Health] MCP response:', JSON.stringify(healthResult).substring(0, 300));

    if (healthCheck.ok && !healthResult.error) {
      // Parse the health status from the MCP response
      try {
        const healthContent = healthResult.result?.content?.[0]?.text;
        if (healthContent) {
          const healthData = JSON.parse(healthContent);
          console.log('[Health] Parsed health data:', healthData);

          // Check if OpenAI is working
          if (healthData.services?.openai?.status === false) {
            console.error('[Health] 🔑 CRITICAL: OpenAI service is down in AOMA MCP');
            return NextResponse.json(
              {
                status: "degraded",
                service: "AOMA-MESH",
                error: "OpenAI API authentication failed",
                errorType: "auth_error",
                timestamp: new Date().toISOString(),
                endpoint: mcpEndpoint,
                message: "🔑 CRITICAL: Update the OpenAI API key in AOMA MCP server",
                services: healthData.services
              },
              { status: 503 }
            );
          }

          // Check overall status
          if (healthData.status === "degraded") {
            const failedServices = Object.entries(healthData.services || {})
              .filter(([_, service]: [string, any]) => service.status === false)
              .map(([name]) => name);

            return NextResponse.json(
              {
                status: "degraded",
                service: "AOMA-MESH",
                error: `Services down: ${failedServices.join(', ')}`,
                errorType: "service_degraded",
                timestamp: new Date().toISOString(),
                endpoint: mcpEndpoint,
                message: `⚠️ AOMA MCP is degraded - ${failedServices.join(', ')} not responding`,
                services: healthData.services
              },
              { status: 503 }
            );
          }
        }
      } catch (parseError) {
        console.warn('[Health] Could not parse health response:', parseError);
      }

      console.log('[Health] ✅ AOMA MCP server is healthy');
      return NextResponse.json({
        status: "healthy",
        service: "AOMA-MESH",
        timestamp: new Date().toISOString(),
        endpoint: mcpEndpoint,
        message: "MCP server is responding",
        mcp_response: healthResult.result ? "success" : "partial"
      });
    } else {
      const errorMsg = healthResult.error?.message || healthResult.message || 'Unknown error';
      console.error('[Health] ❌ AOMA MCP server error:', errorMsg);

      // Detect specific errors
      if (errorMsg.includes('401') || errorMsg.includes('API key')) {
        return NextResponse.json(
          {
            status: "error",
            service: "AOMA-MESH",
            error: "Authentication error - OpenAI API key is invalid or expired",
            errorType: "auth_error",
            timestamp: new Date().toISOString(),
            endpoint: mcpEndpoint,
            message: "🔑 CRITICAL: Update the OpenAI API key in AOMA MCP server",
          },
          { status: 503 },
        );
      }

      return NextResponse.json(
        {
          status: "error",
          service: "AOMA-MESH",
          error: errorMsg,
          errorType: "mcp_error",
          timestamp: new Date().toISOString(),
          endpoint: mcpEndpoint,
          message: "MCP server returned an error",
        },
        { status: 503 },
      );
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[Health] ❌ AOMA health check failed:", errorMessage);

    // Detect connection errors
    if (errorMessage.includes('fetch') || errorMessage.includes('ECONNREFUSED') || errorMessage.includes('timeout')) {
      return NextResponse.json(
        {
          status: "error",
          service: "AOMA-MESH",
          error: "Cannot connect to AOMA MCP server",
          errorType: "connection_error",
          timestamp: new Date().toISOString(),
          message: "🔌 CRITICAL: AOMA MCP server is not reachable",
        },
        { status: 503 },
      );
    }

    return NextResponse.json(
      {
        status: "error",
        service: "AOMA-MESH",
        error: errorMessage,
        errorType: "unknown_error",
        timestamp: new Date().toISOString(),
        message: "Health check failed",
      },
      { status: 503 },
    );
  }
}
