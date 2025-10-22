import { NextRequest, NextResponse } from "next/server";

/**
 * Web Vitals API Endpoint
 *
 * Receives Core Web Vitals metrics from the client and stores them
 * for analysis and dashboard display.
 *
 * This endpoint is called via sendBeacon or fetch from the WebVitals component.
 */

interface WebVitalMetric {
  name: string;
  value: number;
  rating: "good" | "needs-improvement" | "poor";
  id: string;
  navigationType: string;
  timestamp: number;
  url: string;
  userAgent: string;
}

export async function POST(request: NextRequest) {
  try {
    const metric: WebVitalMetric = await request.json();

    // Log in development
    if (process.env.NODE_ENV === "development") {
      console.log("📊 Web Vital received:", {
        name: metric.name,
        value: metric.value,
        rating: metric.rating,
      });
    }

    // TODO: Store in database or send to monitoring service
    // For now, we'll just acknowledge receipt
    // Future: Store in Supabase performance_metrics table

    // Example: Store in Supabase
    /*
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    await supabase.from("web_vitals").insert({
      metric_name: metric.name,
      metric_value: metric.value,
      rating: metric.rating,
      metric_id: metric.id,
      navigation_type: metric.navigationType,
      url: metric.url,
      user_agent: metric.userAgent,
      recorded_at: new Date(metric.timestamp).toISOString(),
    });
    */

    return NextResponse.json({ success: true, message: "Web Vital recorded" }, { status: 200 });
  } catch (error) {
    console.error("Error processing Web Vital:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process metric" },
      { status: 500 }
    );
  }
}

// Support GET for health check
export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "Web Vitals endpoint is active",
  });
}

// Support OPTIONS for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
