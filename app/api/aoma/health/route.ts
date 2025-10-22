import { NextResponse } from "next/server";

// Health check cache configuration
const CACHE_DURATION_MS = 30000; // 30 seconds
let healthCache: {
  data: any;
  timestamp: number;
} | null = null;

/**
 * Cached health check for AOMA MCP server
 *
 * Caching strategy:
 * - Cache health check results for 30 seconds
 * - Reduces load on MCP server
 * - Improves response time for health monitoring tools
 * - Still detects issues within reasonable timeframe
 */
export async function GET() {
  try {
    // Check if we have a valid cached response
    const now = Date.now();
    if (healthCache && now - healthCache.timestamp < CACHE_DURATION_MS) {
      console.log(
        `[Health] ⚡ Returning cached health check (${Math.round((now - healthCache.timestamp) / 1000)}s old)`
      );
      return NextResponse.json({
        ...healthCache.data,
        cached: true,
        cache_age_seconds: Math.round((now - healthCache.timestamp) / 1000),
      });
    }

    // Cache miss or expired - perform actual health check
    console.log("[Health] 🔄 Performing fresh health check (cache expired or missing)");

    const mcpEndpoint =
      process.env.NODE_ENV === "production"
        ? "https://luminous-dedication-production.up.railway.app/rpc"
        : "http://localhost:3333/rpc";

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
          arguments: {},
        },
      }),
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    const healthResult = await healthCheck.json();
    console.log("[Health] MCP response:", JSON.stringify(healthResult).substring(0, 300));

    let responseData: any;

    if (healthCheck.ok && !healthResult.error) {
      // Parse the health status from the MCP response
      try {
        const healthContent = healthResult.result?.content?.[0]?.text;
        if (healthContent) {
          const healthData = JSON.parse(healthContent);
          console.log("[Health] Parsed health data:", healthData);

          // Check if OpenAI is working
          if (healthData.services?.openai?.status === false) {
            console.error("[Health] 🔑 CRITICAL: OpenAI service is down in AOMA MCP");
            responseData = {
              status: "degraded",
              service: "AOMA-MESH",
              error: "OpenAI API authentication failed",
              errorType: "auth_error",
              timestamp: new Date().toISOString(),
              endpoint: mcpEndpoint,
              message: "🔑 CRITICAL: Update the OpenAI API key in AOMA MCP server",
              services: healthData.services,
              cached: false,
            };

            // Cache error state too (so we don't hammer a failing service)
            healthCache = {
              data: responseData,
              timestamp: now,
            };

            return NextResponse.json(responseData, { status: 503 });
          }

          // Check overall status
          if (healthData.status === "degraded") {
            const failedServices = Object.entries(healthData.services || {})
              .filter(([_, service]: [string, any]) => service.status === false)
              .map(([name]) => name);

            responseData = {
              status: "degraded",
              service: "AOMA-MESH",
              error: `Services down: ${failedServices.join(", ")}`,
              errorType: "service_degraded",
              timestamp: new Date().toISOString(),
              endpoint: mcpEndpoint,
              message: `⚠️ AOMA MCP is degraded - ${failedServices.join(", ")} not responding`,
              services: healthData.services,
              cached: false,
            };

            // Cache degraded state
            healthCache = {
              data: responseData,
              timestamp: now,
            };

            return NextResponse.json(responseData, { status: 503 });
          }
        }
      } catch (parseError) {
        console.warn("[Health] Could not parse health response:", parseError);
      }

      console.log("[Health] ✅ AOMA MCP server is healthy");
      responseData = {
        status: "healthy",
        service: "AOMA-MESH",
        timestamp: new Date().toISOString(),
        endpoint: mcpEndpoint,
        message: "MCP server is responding",
        mcp_response: healthResult.result ? "success" : "partial",
        cached: false,
      };

      // Cache healthy state
      healthCache = {
        data: responseData,
        timestamp: now,
      };

      return NextResponse.json(responseData);
    } else {
      const errorMsg = healthResult.error?.message || healthResult.message || "Unknown error";
      console.error("[Health] ❌ AOMA MCP server error:", errorMsg);

      // Detect specific errors
      if (errorMsg.includes("401") || errorMsg.includes("API key")) {
        responseData = {
          status: "error",
          service: "AOMA-MESH",
          error: "Authentication error - OpenAI API key is invalid or expired",
          errorType: "auth_error",
          timestamp: new Date().toISOString(),
          endpoint: mcpEndpoint,
          message: "🔑 CRITICAL: Update the OpenAI API key in AOMA MCP server",
          cached: false,
        };

        // Cache auth error
        healthCache = {
          data: responseData,
          timestamp: now,
        };

        return NextResponse.json(responseData, { status: 503 });
      }

      responseData = {
        status: "error",
        service: "AOMA-MESH",
        error: errorMsg,
        errorType: "mcp_error",
        timestamp: new Date().toISOString(),
        endpoint: mcpEndpoint,
        message: "MCP server returned an error",
        cached: false,
      };

      // Cache error state
      healthCache = {
        data: responseData,
        timestamp: now,
      };

      return NextResponse.json(responseData, { status: 503 });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[Health] ❌ AOMA health check failed:", errorMessage);

    const now = Date.now();
    let responseData: any;

    // Detect connection errors
    if (
      errorMessage.includes("fetch") ||
      errorMessage.includes("ECONNREFUSED") ||
      errorMessage.includes("timeout")
    ) {
      responseData = {
        status: "error",
        service: "AOMA-MESH",
        error: "Cannot connect to AOMA MCP server",
        errorType: "connection_error",
        timestamp: new Date().toISOString(),
        message: "🔌 CRITICAL: AOMA MCP server is not reachable",
        cached: false,
      };

      // Cache connection error
      healthCache = {
        data: responseData,
        timestamp: now,
      };

      return NextResponse.json(responseData, { status: 503 });
    }

    responseData = {
      status: "error",
      service: "AOMA-MESH",
      error: errorMessage,
      errorType: "unknown_error",
      timestamp: new Date().toISOString(),
      message: "Health check failed",
      cached: false,
    };

    // Cache unknown error
    healthCache = {
      data: responseData,
      timestamp: now,
    };

    return NextResponse.json(responseData, { status: 503 });
  }
}
