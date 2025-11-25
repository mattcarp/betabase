import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";

/**
 * System Health Check Endpoint
 * Checks: Supabase connection, Gemini LLM availability
 */
export async function GET() {
  const health: {
    status: "ok" | "degraded" | "error";
    timestamp: string;
    services: {
      supabase: { status: string; latency?: number; error?: string };
      gemini: { status: string; latency?: number; error?: string };
    };
  } = {
    status: "ok",
    timestamp: new Date().toISOString(),
    services: {
      supabase: { status: "unknown" },
      gemini: { status: "unknown" },
    },
  };

  // Check Supabase
  try {
    const start = Date.now();
    const { error } = await supabase.from("siam_vectors").select("id").limit(1);
    const latency = Date.now() - start;

    if (error) {
      health.services.supabase = { status: "error", error: error.message, latency };
      health.status = "degraded";
    } else {
      health.services.supabase = { status: "ok", latency };
    }
  } catch (e) {
    health.services.supabase = { status: "error", error: String(e) };
    health.status = "degraded";
  }

  // Check Gemini LLM
  try {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      health.services.gemini = { status: "error", error: "GOOGLE_API_KEY not configured" };
      health.status = "degraded";
    } else {
      const google = createGoogleGenerativeAI({ apiKey });
      const start = Date.now();
      await generateText({
        model: google("gemini-2.0-flash"),
        prompt: "Reply with only: ok",
        maxTokens: 5,
      });
      const latency = Date.now() - start;
      health.services.gemini = { status: "ok", latency };
    }
  } catch (e) {
    health.services.gemini = { status: "error", error: String(e) };
    health.status = "degraded";
  }

  // Overall status
  if (health.services.supabase.status === "error" && health.services.gemini.status === "error") {
    health.status = "error";
  }

  return NextResponse.json(health);
}
