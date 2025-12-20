import { NextRequest, NextResponse } from "next/server";
import { metrics, trackRequest, trackError, updatePerformanceMetrics } from "@/lib/metrics";
import {
  getRecentTraces,
  getTraceObservations,
  isLangfuseAvailable,
} from "@/lib/introspection/langfuse-query";

// Introspection API endpoint for SIAM internal monitoring
export async function GET(_request: NextRequest) {
  try {
    // Track this introspection request
    const startTime = Date.now();

    // Update system metrics
    metrics.system.memoryUsage = process.memoryUsage();
    metrics.system.uptime = process.uptime();

    let recentActivity: any[] = [];

    // Try to get real Langfuse traces first
    const hasLangfuse = isLangfuseAvailable();
    if (hasLangfuse) {
      const traces = await getRecentTraces(20);
      if (traces && traces.length > 0) {
        console.log(`[INTROSPECTION] Found ${traces.length} Langfuse traces`);

        // Transform Langfuse traces to match UI format
        recentActivity = await Promise.all(
          traces.map(async (trace: any) => {
            // Get observations for this trace to extract detailed info
            const observations = await getTraceObservations(trace.id);

            // Find the main LLM generation
            const llmGeneration = observations?.find((obs: any) => obs.type === "GENERATION");

            // Find vector search spans
            const vectorSpans = observations?.filter(
              (obs: any) => obs.type === "SPAN" && obs.name?.toLowerCase().includes("vector")
            );

            // Determine run type
            let runType = "chain";
            if (llmGeneration) runType = "llm";
            else if (vectorSpans && vectorSpans.length > 0) runType = "retriever";
            else if (trace.name?.toLowerCase().includes("tool")) runType = "tool";

            // Calculate duration
            const startTime = trace.timestamp ? new Date(trace.timestamp).getTime() : Date.now();
            const endTime =
              llmGeneration?.endTime || trace.endTime
                ? new Date(llmGeneration?.endTime || trace.endTime).getTime()
                : startTime;
            const duration = endTime - startTime;

            // Determine status
            const hasError = trace.level === "ERROR" || llmGeneration?.level === "ERROR";
            const status = hasError ? "error" : "success";

            return {
              id: trace.id,
              name: trace.name || "Unnamed Trace",
              runType,
              startTime: trace.timestamp || new Date().toISOString(),
              endTime: llmGeneration?.endTime || trace.endTime,
              duration,
              status,
              error: hasError ? trace.statusMessage : undefined,
              inputs: trace.input || llmGeneration?.input,
              outputs: trace.output || llmGeneration?.output,
              metadata: {
                model: llmGeneration?.model,
                promptTokens: llmGeneration?.usage?.promptTokens,
                completionTokens: llmGeneration?.usage?.completionTokens,
                totalTokens: llmGeneration?.usage?.totalTokens,
                vectorSearchCount: vectorSpans?.length || 0,
                similarityScores: vectorSpans?.map((span: any) => span.output?.similarity),
                observationCount: observations?.length || 0,
              },
            };
          })
        );
      } else {
        console.log("[INTROSPECTION] No Langfuse traces available");
      }
    }

    // Fallback to in-memory metrics if no Langfuse data
    if (recentActivity.length === 0 && metrics.requests.length > 0) {
      console.log("[INTROSPECTION] Using fallback in-memory metrics");
      recentActivity = metrics.requests
        .slice(-20)
        .reverse()
        .map((req) => ({
          id: `req_${req.timestamp}`,
          name: `${req.method} ${req.path}`,
          runType: req.path.includes("/chat") ? "llm" : req.path.includes("/api/") ? "tool" : "chain",
          startTime: new Date(req.timestamp).toISOString(),
          endTime: new Date(req.timestamp + req.duration).toISOString(),
          duration: req.duration,
          status: req.status >= 400 ? "error" : "success",
          error: req.error,
          inputs: { method: req.method, path: req.path },
          outputs: { status: req.status },
          metadata: {
            responseTime: `${req.duration}ms`,
            statusCode: req.status,
          },
        }));
    }

    // Track this request completion
    const endTime = Date.now();
    trackRequest("/api/introspection", "GET", endTime - startTime, 200);

    // App health status based on service availability
    const hasSupabase = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
    const hasGemini = !!process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    const hasOpenAI = !!process.env.OPENAI_API_KEY;
    const isHealthy = hasSupabase && (hasGemini || hasOpenAI);

    // Format response for IntrospectionDropdown - App Health focused
    return NextResponse.json({
      status: {
        enabled: true,
        project: hasLangfuse ? "Langfuse Traces" : "SIAM Application Health",
        environment: process.env.NODE_ENV || "development",
        tracingEnabled: isHealthy,
        hasSupabase,
        hasAIProvider: hasGemini || hasOpenAI,
        hasLangfuse,
      },
      traces: recentActivity,
      metrics: {
        performance: metrics.performance,
        system: {
          ...metrics.system,
          memoryUsageMB: {
            rss: Math.round(metrics.system.memoryUsage.rss / 1024 / 1024),
            heapTotal: Math.round(metrics.system.memoryUsage.heapTotal / 1024 / 1024),
            heapUsed: Math.round(metrics.system.memoryUsage.heapUsed / 1024 / 1024),
            external: Math.round(metrics.system.memoryUsage.external / 1024 / 1024),
          },
          uptimeHours: Math.round((metrics.system.uptime / 3600) * 10) / 10,
        },
        recentErrors: metrics.errors.slice(-10).reverse(),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[INTROSPECTION] Error getting metrics:", error);
    trackError(
      error instanceof Error ? error.message : "Unknown introspection error",
      error instanceof Error ? error.stack : undefined,
      "/api/introspection"
    );

    return NextResponse.json(
      {
        error: "Failed to get introspection data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// POST endpoint to manually track events
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, ...data } = body;

    if (type === "request") {
      trackRequest(data.path, data.method, data.duration, data.status, data.error);
    } else if (type === "error") {
      trackError(data.message, data.stack, data.path);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[INTROSPECTION] Error tracking event:", error);
    return NextResponse.json(
      {
        error: "Failed to track event",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
