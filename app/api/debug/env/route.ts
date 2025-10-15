import { NextResponse } from "next/server";

/**
 * DEBUG ENDPOINT: Check environment configuration
 *
 * SECURITY: This endpoint only works in development mode
 * and only shows boolean presence, not actual values
 */
export async function GET() {
  // ONLY allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: "This endpoint is only available in development" },
      { status: 403 }
    );
  }

  return NextResponse.json({
    environment: process.env.NODE_ENV,
    env_checks: {
      OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      NEXT_PUBLIC_BYPASS_AUTH: process.env.NEXT_PUBLIC_BYPASS_AUTH,
      NEXT_PUBLIC_BYPASS_AOMA: process.env.NEXT_PUBLIC_BYPASS_AOMA,
    },
    supabase_url_preview: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...',
  });
}
