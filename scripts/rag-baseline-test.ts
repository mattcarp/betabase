#!/usr/bin/env npx tsx
/**
 * RAG Baseline Test Script v2
 * 
 * Purpose: Capture baseline metrics BEFORE implementing AI SDK v6 improvements
 * Fixed: Proper AI SDK streaming response parsing
 */

import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';
const API_ENDPOINT = `${BASE_URL}/api/chat`;

interface TestQuery {
  id: string;
  name: string;
  description: string;
  query: string;
  expectedBehavior: string;
}

interface TestResult {
  id: string;
  name: string;
  query: string;
  expectedBehavior: string;
  timestamp: string;
  httpStatus: number;
  ttfbMs: number;
  totalTimeMs: number;
  responseLength: number;
  fullResponse: string;
  ragMetadata: any;
  citationSources: any[];
  error?: string;
}

const TEST_QUERIES: TestQuery[] = [
  {
    id: 'exact-match-1',
    name: 'Application Name (Exact Match)',
    description: 'Tests if RAG can find exact string "AOMA" in knowledge base',
    query: 'What is the name of the application under test?',
    expectedBehavior: 'Should return "AOMA" or "Asset and Offering Management Application"',
  },
  {
    id: 'exact-match-2',
    name: 'Acronym Expansion',
    description: 'Tests exact match for acronym definition',
    query: 'What does AOMA stand for?',
    expectedBehavior: 'Should return "Asset and Offering Management Application"',
  },
  {
    id: 'semantic-1',
    name: 'How-To Question',
    description: 'Tests semantic understanding of procedural query',
    query: 'How do I log into AOMA?',
    expectedBehavior: 'Should provide login steps from knowledge base',
  },
  {
    id: 'semantic-2',
    name: 'Feature Discovery',
    description: 'Tests semantic search for feature information',
    query: 'What features does AOMA provide for asset management?',
    expectedBehavior: 'Should list key features from documentation',
  },
  {
    id: 'complex-1',
    name: 'Multi-Hop Reasoning',
    description: 'Tests ability to synthesize information from multiple sources',
    query: 'Explain the relationship between AOMA and the metadata validation process',
    expectedBehavior: 'Should connect concepts from multiple documents',
  },
  {
    id: 'factual-1',
    name: 'Quick Factual',
    description: 'Simple factual query that should be fast',
    query: 'What company developed AOMA?',
    expectedBehavior: 'Should quickly return "Sony Music" or similar',
  },
];

/**
 * Parse AI SDK streaming response format
 * Format: lines like "0:\"text content\"\n" for text deltas
 */
function parseAISDKStream(chunk: string): string {
  let result = '';
  const lines = chunk.split('\n');
  
  for (const line of lines) {
    // AI SDK format: TYPE:DATA
    // 0 = text delta, 2 = data, d = done, e = error
    if (line.startsWith('0:')) {
      try {
        // Remove the "0:" prefix and parse the JSON string
        const jsonStr = line.slice(2);
        const parsed = JSON.parse(jsonStr);
        if (typeof parsed === 'string') {
          result += parsed;
        }
      } catch {
        // Try direct extraction if JSON parse fails
        const match = line.match(/^0:"(.*)"/);
        if (match) {
          // Unescape the string
          result += match[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
        }
      }
    }
  }
  
  return result;
}

async function runSingleTest(testQuery: TestQuery): Promise<TestResult> {
  const startTime = performance.now();
  let ttfbTime = 0;
  let fullResponse = '';
  let ragMetadata = null;
  let citationSources: any[] = [];
  let httpStatus = 0;
  let error: string | undefined;

  try {
    console.log(`\n🧪 Running: ${testQuery.name}`);
    console.log(`   Query: "${testQuery.query}"`);

    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: testQuery.query,
          },
        ],
        model: 'gemini-2.5-flash',
      }),
    });

    httpStatus = response.status;
    ttfbTime = performance.now() - startTime;

    // Extract custom headers
    const ragMetadataHeader = response.headers.get('X-RAG-Metadata');
    const citationSourcesHeader = response.headers.get('X-Citation-Sources');

    if (ragMetadataHeader) {
      try {
        ragMetadata = JSON.parse(ragMetadataHeader);
      } catch (e) {
        console.warn('   ⚠️ Failed to parse RAG metadata header');
      }
    }

    if (citationSourcesHeader) {
      try {
        citationSources = JSON.parse(citationSourcesHeader);
      } catch (e) {
        console.warn('   ⚠️ Failed to parse citation sources header');
      }
    }

    if (!response.ok) {
      const errorBody = await response.text();
      error = `HTTP ${httpStatus}: ${errorBody}`;
      console.log(`   ❌ Error: ${error}`);
    } else {
      // Read streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        let done = false;
        while (!done) {
          const { value, done: readerDone } = await reader.read();
          done = readerDone;
          if (value) {
            const chunk = decoder.decode(value, { stream: true });
            const parsedText = parseAISDKStream(chunk);
            fullResponse += parsedText;
          }
        }
      }
    }
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
    console.log(`   ❌ Exception: ${error}`);
  }

  const totalTime = performance.now() - startTime;

  console.log(`   ⏱️  TTFB: ${ttfbTime.toFixed(0)}ms | Total: ${totalTime.toFixed(0)}ms`);
  console.log(`   📝 Response length: ${fullResponse.length} chars`);
  if (fullResponse.length > 0) {
    console.log(`   📄 Preview: "${fullResponse.substring(0, 100)}..."`);
  }
  if (ragMetadata) {
    console.log(`   📊 RAG: strategy=${ragMetadata.strategy}, confidence=${(ragMetadata.confidence * 100).toFixed(1)}%`);
  }
  if (citationSources.length > 0) {
    console.log(`   📎 Citations: ${citationSources.length} sources (${citationSources.map(s => s.sourceType).join(', ')})`);
  }

  return {
    id: testQuery.id,
    name: testQuery.name,
    query: testQuery.query,
    expectedBehavior: testQuery.expectedBehavior,
    timestamp: new Date().toISOString(),
    httpStatus,
    ttfbMs: Math.round(ttfbTime),
    totalTimeMs: Math.round(totalTime),
    responseLength: fullResponse.length,
    fullResponse,
    ragMetadata,
    citationSources,
    error,
  };
}

async function runAllTests(): Promise<TestResult[]> {
  console.log('='.repeat(70));
  console.log('RAG BASELINE TEST v2');
  console.log(`Target: ${API_ENDPOINT}`);
  console.log(`Time: ${new Date().toISOString()}`);
  console.log('='.repeat(70));

  // Check if server is running
  try {
    const healthCheck = await fetch(`${BASE_URL}/api/chat`, { method: 'GET' });
    if (!healthCheck.ok) {
      throw new Error(`Health check failed: ${healthCheck.status}`);
    }
    console.log('✅ Server is running');
  } catch (e) {
    console.error('❌ Server is not running at', BASE_URL);
    console.error('   Please start the dev server with: pnpm dev');
    process.exit(1);
  }

  const results: TestResult[] = [];

  for (const query of TEST_QUERIES) {
    const result = await runSingleTest(query);
    results.push(result);
    
    // Small delay between tests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  return results;
}

function generateMarkdownReport(results: TestResult[], phase: string): string {
  const timestamp = new Date().toISOString();
  
  let md = `# RAG Test Results - ${phase}\n\n`;
  md += `**Generated:** ${timestamp}\n`;
  md += `**Target:** ${API_ENDPOINT}\n`;
  md += `**Test Count:** ${results.length}\n\n`;

  // Summary table
  md += `## Summary\n\n`;
  md += `| Test | Status | TTFB (ms) | Total (ms) | Response Length | Confidence | Sources |\n`;
  md += `|------|--------|-----------|------------|-----------------|------------|----------|\n`;

  for (const r of results) {
    const status = r.error ? '❌ FAIL' : '✅ PASS';
    const confidence = r.ragMetadata?.confidence 
      ? `${(r.ragMetadata.confidence * 100).toFixed(1)}%` 
      : 'N/A';
    const sources = r.citationSources?.length 
      ? r.citationSources.map(s => s.sourceType).join(', ')
      : 'none';
    md += `| ${r.name} | ${status} | ${r.ttfbMs} | ${r.totalTimeMs} | ${r.responseLength} | ${confidence} | ${sources} |\n`;
  }

  // Aggregate stats
  const successfulTests = results.filter(r => !r.error);
  if (successfulTests.length > 0) {
    const avgTTFB = successfulTests.reduce((s, r) => s + r.ttfbMs, 0) / successfulTests.length;
    const avgTotal = successfulTests.reduce((s, r) => s + r.totalTimeMs, 0) / successfulTests.length;
    const avgConfidence = successfulTests
      .filter(r => r.ragMetadata?.confidence)
      .reduce((s, r) => s + (r.ragMetadata?.confidence || 0), 0) / 
      successfulTests.filter(r => r.ragMetadata?.confidence).length;
    const avgRAGTime = successfulTests
      .filter(r => r.ragMetadata?.timeMs)
      .reduce((s, r) => s + (r.ragMetadata?.timeMs || 0), 0) / 
      successfulTests.filter(r => r.ragMetadata?.timeMs).length;

    md += `\n### Aggregate Metrics\n\n`;
    md += `| Metric | Value |\n`;
    md += `|--------|-------|\n`;
    md += `| Average TTFB | ${avgTTFB.toFixed(0)}ms |\n`;
    md += `| Average Total Time | ${avgTotal.toFixed(0)}ms |\n`;
    md += `| Average Confidence | ${(avgConfidence * 100).toFixed(1)}% |\n`;
    md += `| Average RAG Time | ${avgRAGTime.toFixed(0)}ms |\n`;
    
    // Source type breakdown
    const allSources = results.flatMap(r => r.citationSources || []);
    const sourceTypeCounts: Record<string, number> = {};
    for (const src of allSources) {
      sourceTypeCounts[src.sourceType] = (sourceTypeCounts[src.sourceType] || 0) + 1;
    }
    
    md += `\n### Source Type Distribution\n\n`;
    md += `| Source Type | Count | Percentage |\n`;
    md += `|-------------|-------|------------|\n`;
    for (const [type, count] of Object.entries(sourceTypeCounts).sort((a, b) => b[1] - a[1])) {
      md += `| ${type} | ${count} | ${((count / allSources.length) * 100).toFixed(1)}% |\n`;
    }
  }

  // Detailed results
  md += `\n## Detailed Results\n\n`;

  for (const r of results) {
    md += `### ${r.name}\n\n`;
    md += `**Query:** ${r.query}\n\n`;
    md += `**Expected:** ${r.expectedBehavior}\n\n`;
    md += `**Metrics:**\n`;
    md += `- HTTP Status: ${r.httpStatus}\n`;
    md += `- TTFB: ${r.ttfbMs}ms\n`;
    md += `- Total Time: ${r.totalTimeMs}ms\n`;
    md += `- Response Length: ${r.responseLength} chars\n`;

    if (r.ragMetadata) {
      md += `\n**RAG Metadata:**\n`;
      md += `- Strategy: ${r.ragMetadata.strategy}\n`;
      md += `- Confidence: ${(r.ragMetadata.confidence * 100).toFixed(1)}%\n`;
      md += `- Documents Retrieved: ${r.ragMetadata.initialDocs || 'N/A'}\n`;
      md += `- RAG Time: ${typeof r.ragMetadata.timeMs === 'number' ? r.ragMetadata.timeMs.toFixed(0) : 'N/A'}ms\n`;
    }

    if (r.citationSources?.length > 0) {
      md += `\n**Citation Sources (${r.citationSources.length}):**\n`;
      for (const src of r.citationSources) {
        md += `- \`${src.title}\` (${src.sourceType}, ${src.confidence}% confidence)\n`;
      }
    }

    if (r.error) {
      md += `\n**Error:** \`${r.error}\`\n`;
    }

    // Quality assessment based on response content
    const responseText = r.fullResponse.toLowerCase();
    const mentionsAOMA = responseText.includes('aoma');
    const mentionsSony = responseText.includes('sony');
    
    md += `\n**Quality Signals:**\n`;
    md += `- Mentions AOMA: ${mentionsAOMA ? '✅ Yes' : '❌ No'}\n`;
    md += `- Mentions Sony: ${mentionsSony ? '✅ Yes' : '❌ No'}\n`;

    md += `\n**Full Response:**\n\n`;
    md += `\`\`\`\n${r.fullResponse || '(empty response)'}\n\`\`\`\n\n`;
    md += `---\n\n`;
  }

  return md;
}

async function main() {
  const phase = process.argv[2] || 'BASELINE';
  
  console.log(`\n🚀 Starting RAG ${phase} Test v2...\n`);

  const results = await runAllTests();

  // Generate markdown report
  const report = generateMarkdownReport(results, phase);

  // Save to file
  const filename = `RAG-TEST-${phase}-${new Date().toISOString().replace(/[:.]/g, '-')}.md`;
  const filepath = path.join(process.cwd(), filename);
  fs.writeFileSync(filepath, report);

  console.log('\n' + '='.repeat(70));
  console.log(`📄 Report saved to: ${filename}`);
  console.log('='.repeat(70));

  // Print summary
  const failures = results.filter(r => r.error);
  const avgTTFB = results.reduce((s, r) => s + r.ttfbMs, 0) / results.length;
  const avgTotal = results.reduce((s, r) => s + r.totalTimeMs, 0) / results.length;

  console.log(`\n📊 BASELINE SUMMARY:`);
  console.log(`   Average TTFB: ${avgTTFB.toFixed(0)}ms`);
  console.log(`   Average Total: ${avgTotal.toFixed(0)}ms`);
  
  if (failures.length > 0) {
    console.log(`\n❌ ${failures.length}/${results.length} tests failed`);
    process.exit(1);
  } else {
    console.log(`\n✅ All ${results.length} tests completed`);
  }
}

main().catch(console.error);
