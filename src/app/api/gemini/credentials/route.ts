import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  // Prioritize server-side only key, fallback to public key
  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Gemini API key not configured in environment variables' },
      { status: 500 }
    );
  }
  
  // In a production environment, you might return an ephemeral token here instead of the raw key
  return NextResponse.json({ apiKey });
}
