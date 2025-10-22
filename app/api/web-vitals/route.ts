/**
 * Web Vitals API Endpoint
 *
 * Receives and logs Core Web Vitals metrics from the client
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, value, rating, delta, id, navigationType } = body;

    // Log the metric (in production, you would send this to your analytics service)
    console.log(`[Web Vitals] ${name}:`, {
      value,
      rating,
      delta,
      id,
      navigationType,
    });

    // Here you could send to analytics services like:
    // - Google Analytics
    // - Vercel Analytics
    // - Custom analytics endpoint
    // - Supabase for storage

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('[Web Vitals] Error processing metric:', error);
    return NextResponse.json(
      { error: 'Failed to process metric' },
      { status: 500 }
    );
  }
}

// Support GET for health check
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Web Vitals endpoint is active',
  });
}
