import { NextRequest, NextResponse } from 'next/server';
import FirecrawlApp from '@mendable/firecrawl-js';
import { storeFirecrawlData, getFirecrawlAnalysis } from '../../../lib/supabase';
import OpenAI from 'openai';

// Force dynamic mode to prevent build-time evaluation
export const dynamic = 'force-dynamic';
// Only allow crawling against the AOMA staging host (from env or default)
const STAGE_URL = process.env.AOMA_STAGE_URL || 'https://aoma-stage.smcdp-de.net';
let ALLOWED_STAGE_HOST = 'aoma-stage.smcdp-de.net';
try {
  ALLOWED_STAGE_HOST = new URL(STAGE_URL).host;
} catch (_) {
  // Fallback to default host
}

function assertStageUrl(targetUrl: string) {
  try {
    const { host } = new URL(targetUrl);
    if (host !== ALLOWED_STAGE_HOST) {
      throw new Error(`Only staging host is allowed: ${ALLOWED_STAGE_HOST}`);
    }
  } catch (e) {
    throw new Error('Invalid or disallowed URL for staging crawl');
  }
}

/**
 * Firecrawl → Supabase Integration for AOMA UI Analysis
 * 
 * This crawls AOMA pages, analyzes the UI structure, and stores
 * the data in Supabase for Computer Use training enhancement.
 * 
 * Expected improvement: 38% → 70-80% success rate
 */

// Initialize clients lazily to avoid build-time errors
let firecrawl: FirecrawlApp | null = null;
let openai: OpenAI | null = null;

const getClients = () => {
  if (!firecrawl && process.env.FIRECRAWL_API_KEY) {
    firecrawl = new FirecrawlApp({
      apiKey: process.env.FIRECRAWL_API_KEY
    });
  }
  if (!openai && process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }
  return { firecrawl, openai };
};

// POST /api/firecrawl-crawl - Crawl and analyze a URL
export async function POST(req: NextRequest) {
  try {
    const { firecrawl: firecrawlClient, openai: openaiClient } = getClients();
    
    // Require Firecrawl only; OpenAI is optional (embeddings skipped if absent)
    if (!firecrawlClient) {
      return NextResponse.json(
        { error: 'Firecrawl API key not configured' },
        { status: 500 }
      );
    }
    const { url, options = {} } = await req.json();

    // Enforce staging-only crawls
    assertStageUrl(url);

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Check if we already have recent data for this URL
    const existingData = await getFirecrawlAnalysis(url);
    if (existingData) {
      const hoursSinceCrawl = (Date.now() - new Date(existingData.crawled_at).getTime()) / (1000 * 60 * 60);
      if (hoursSinceCrawl < 24) {
        return NextResponse.json({
          message: 'Using cached data',
          data: existingData,
          cached: true
        });
      }
    }
    // Crawl the page with Firecrawl
    console.log(`Crawling ${url} with Firecrawl...`);
    const crawlData = await firecrawlClient.scrapeUrl(url, {
      formats: ['markdown', 'html'],
      ...options
    });

    if (!crawlData.success) {
      throw new Error('Failed to crawl URL');
    }

    // Analyze the crawled data for UI elements
    const analysis = await analyzeUIStructure(crawlData);

    // Generate embeddings for semantic search
    const embedding = await generateEmbedding(analysis.summary);

    // Store in Supabase
    const storedData = await storeFirecrawlData(url, {
      title: crawlData.metadata?.title || 'Untitled',
      elements: analysis.elements,
      selectors: analysis.selectors,
      navigationPaths: analysis.navigationPaths,
      testableFeatures: analysis.testableFeatures,
      userFlows: analysis.userFlows,
      metadata: {
        ...crawlData.metadata,
        markdown: crawlData.markdown,
        analysisVersion: '1.0',
        crawledAt: new Date().toISOString()
      }
    }, embedding);

    return NextResponse.json({
      message: 'Successfully crawled and analyzed',
      data: storedData,
      cached: false
    });

  } catch (error: any) {
    console.error('Firecrawl error:', error);
    return NextResponse.json(
      { error: 'Failed to crawl URL', details: error.message },
      { status: 500 }
    );
  }
}

// Helper function to analyze UI structure
async function analyzeUIStructure(crawlData: any) {
  const markdown = crawlData.markdown || '';
  const html = crawlData.html || '';
  
  // Parse UI elements from the crawled data
  const elements: Record<string, any> = {};
  const selectors: Record<string, any> = {};
  const navigationPaths: string[] = [];
  const testableFeatures: string[] = [];
  const userFlows: Record<string, any> = {};

  // Extract buttons
  const buttonMatches = html.match(/<button[^>]*>.*?<\/button>/gi) || [];
  elements.buttons = buttonMatches.map((btn: string) => {
    const text = btn.replace(/<[^>]*>/g, '').trim();
    const id = btn.match(/id="([^"]+)"/)?.[1];
    const className = btn.match(/class="([^"]+)"/)?.[1];
    return { text, id, className };
  });

  // Extract links
  const linkMatches = html.match(/<a[^>]*href="([^"]+)"[^>]*>.*?<\/a>/gi) || [];
  navigationPaths.push(...linkMatches.map((link: string) => {
    const href = link.match(/href="([^"]+)"/)?.[1] || '';
    return href;
  }).filter(Boolean));

  // Extract forms
  const formMatches = html.match(/<form[^>]*>.*?<\/form>/gsi) || [];
  elements.forms = formMatches.length;

  // Extract input fields
  const inputMatches = html.match(/<input[^>]*>/gi) || [];
  elements.inputs = inputMatches.map((input: string) => {
    const type = input.match(/type="([^"]+)"/)?.[1] || 'text';
    const name = input.match(/name="([^"]+)"/)?.[1];
    const id = input.match(/id="([^"]+)"/)?.[1];
    return { type, name, id };
  });

  // Identify testable features based on elements
  if (elements.buttons?.length > 0) testableFeatures.push('button_clicks');
  if (elements.forms > 0) testableFeatures.push('form_submission');
  if (elements.inputs?.length > 0) testableFeatures.push('text_input');
  if (navigationPaths.length > 0) testableFeatures.push('navigation');

  // Create a summary for embedding
  const summary = `
    Page with ${elements.buttons?.length || 0} buttons,
    ${elements.forms || 0} forms,
    ${elements.inputs?.length || 0} input fields,
    ${navigationPaths.length} navigation links.
    Testable features: ${testableFeatures.join(', ')}.
    ${markdown.substring(0, 500)}
  `.trim();

  return {
    elements,
    selectors,
    navigationPaths: [...new Set(navigationPaths)], // Remove duplicates
    testableFeatures,
    userFlows,
    summary
  };
}

// Generate embeddings using OpenAI
async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const { openai: openaiClient } = getClients();
    if (!openaiClient) {
      throw new Error('OpenAI client not initialized');
    }
    const response = await openaiClient.embeddings.create({
      model: 'text-embedding-ada-002',
      input: text,
    });
    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    return [];
  }
}

// GET /api/firecrawl-crawl - Get crawled data for a URL
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json(
      { error: 'URL parameter is required' },
      { status: 400 }
    );
  }

  // Enforce staging-only reads by URL
  try {
    assertStageUrl(url);
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || 'Disallowed URL' },
      { status: 400 }
    );
  }

  try {
    const data = await getFirecrawlAnalysis(url);
    if (!data) {
      return NextResponse.json(
        { error: 'No data found for this URL' },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to retrieve data', details: error.message },
      { status: 500 }
    );
  }
}