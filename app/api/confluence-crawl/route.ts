import { NextRequest, NextResponse } from 'next/server';
import { testConnection } from '@/services/confluenceAuthenticator';
import crawler from '@/services/confluenceCrawler';

// dynamic to ensure env available at runtime
export const dynamic = 'force-dynamic';

let lastSummary: { pagesCrawled: number; vectorsUpserted: number; at: string } | null = null;

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json().catch(() => ({}));
    const { spaces = undefined, maxPagesPerSpace = undefined } = payload || {};

    const auth = await testConnection();
    if (!auth.ok) {
      return NextResponse.json({ error: auth.message || 'Confluence auth failed' }, { status: auth.status || 500 });
    }

    const result = await crawler.crawlSpaces({ spaces, maxPagesPerSpace });
    lastSummary = { pagesCrawled: result.pagesCrawled, vectorsUpserted: result.vectorsUpserted, at: new Date().toISOString() };

    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Crawl failed' }, { status: 500 });
  }
}

export async function GET() {
  if (!lastSummary) {
    return NextResponse.json({ pagesCrawled: 0, vectorsUpserted: 0, at: null });
  }
  return NextResponse.json(lastSummary);
}


