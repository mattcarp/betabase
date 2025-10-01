#!/usr/bin/env tsx
/**
 * AOMA Performance Diagnostic Tool
 * 
 * Deep dive into AOMA Mesh MCP server performance to find bottlenecks.
 * Run this when performance degrades to identify the root cause.
 */

const AOMA_URL = process.env.NEXT_PUBLIC_AOMA_MESH_SERVER_URL || 
  'https://luminous-dedication-production.up.railway.app';

interface PerformanceMetric {
  name: string;
  duration: number;
  status: 'pass' | 'warn' | 'fail';
  details?: any;
}

async function measureLatency(name: string, fn: () => Promise<any>): Promise<PerformanceMetric> {
  const start = performance.now();
  let status: 'pass' | 'warn' | 'fail' = 'pass';
  let details: any = {};
  
  try {
    const result = await fn();
    const duration = performance.now() - start;
    
    // Categorize performance
    if (duration > 10000) status = 'fail';
    else if (duration > 3000) status = 'warn';
    
    details = { success: true, result };
    
    return { name, duration, status, details };
  } catch (error) {
    const duration = performance.now() - start;
    details = { success: false, error: error instanceof Error ? error.message : String(error) };
    return { name, duration, status: 'fail', details };
  }
}

async function main() {
  console.log('🔍 AOMA PERFORMANCE DIAGNOSTIC TOOL\n');
  console.log(`Testing: ${AOMA_URL}\n`);
  console.log('─'.repeat(60));
  
  const metrics: PerformanceMetric[] = [];
  
  // Test 1: Basic Network Connectivity
  console.log('\n1️⃣  Testing network connectivity...');
  metrics.push(await measureLatency('Network RTT', async () => {
    const response = await fetch(`${AOMA_URL}/health`);
    return await response.json();
  }));
  console.log(`   ✓ ${metrics[metrics.length - 1].duration.toFixed(0)}ms`);
  
  // Test 2: RPC Endpoint Response
  console.log('\n2️⃣  Testing RPC endpoint...');
  metrics.push(await measureLatency('RPC Overhead', async () => {
    const response = await fetch(`${AOMA_URL}/rpc`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: { name: 'get_system_health', arguments: {} }
      })
    });
    return await response.json();
  }));
  console.log(`   ✓ ${metrics[metrics.length - 1].duration.toFixed(0)}ms`);
  
  // Test 3: OpenAI Connection (via AOMA)
  console.log('\n3️⃣  Testing OpenAI Assistant API (this may take time)...');
  metrics.push(await measureLatency('AOMA Knowledge Query', async () => {
    const response = await fetch(`${AOMA_URL}/rpc`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: {
          name: 'query_aoma_knowledge',
          arguments: {
            query: 'diagnostic test query',
            strategy: 'rapid'
          }
        }
      })
    });
    return await response.json();
  }));
  console.log(`   ${metrics[metrics.length - 1].status === 'fail' ? '✗' : '✓'} ${metrics[metrics.length - 1].duration.toFixed(0)}ms`);
  
  // Test 4: Vector Search Performance
  console.log('\n4️⃣  Testing vector search (Jira)...');
  metrics.push(await measureLatency('Jira Search', async () => {
    const response = await fetch(`${AOMA_URL}/rpc`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: {
          name: 'search_jira_tickets',
          arguments: {
            query: 'test',
            limit: 5
          }
        }
      })
    });
    return await response.json();
  }));
  console.log(`   ${metrics[metrics.length - 1].status === 'fail' ? '✗' : '✓'} ${metrics[metrics.length - 1].duration.toFixed(0)}ms`);
  
  // Analysis
  console.log('\n' + '─'.repeat(60));
  console.log('\n📊 PERFORMANCE ANALYSIS\n');
  
  const totalTime = metrics.reduce((sum, m) => sum + m.duration, 0);
  const failures = metrics.filter(m => m.status === 'fail').length;
  const warnings = metrics.filter(m => m.status === 'warn').length;
  
  console.log(`Total Test Time: ${totalTime.toFixed(0)}ms`);
  console.log(`Tests Run: ${metrics.length}`);
  console.log(`Failures: ${failures}`);
  console.log(`Warnings: ${warnings}\n`);
  
  // Detailed breakdown
  console.log('Detailed Metrics:');
  metrics.forEach(m => {
    const icon = m.status === 'pass' ? '✅' : m.status === 'warn' ? '⚠️ ' : '❌';
    console.log(`  ${icon} ${m.name.padEnd(30)} ${m.duration.toFixed(0).padStart(6)}ms`);
  });
  
  // Find bottlenecks
  console.log('\n🔍 BOTTLENECK ANALYSIS:\n');
  
  const sortedMetrics = [...metrics].sort((a, b) => b.duration - a.duration);
  const slowest = sortedMetrics[0];
  
  console.log(`Slowest Operation: ${slowest.name} (${slowest.duration.toFixed(0)}ms)`);
  
  if (slowest.name.includes('Knowledge Query') && slowest.duration > 15000) {
    console.log('\n🔴 CRITICAL ISSUE: OpenAI Assistant API is extremely slow\n');
    console.log('Possible causes:');
    console.log('  1. Railway cold start (free tier spins down)');
    console.log('  2. OpenAI Assistant API latency');
    console.log('  3. Vector store query complexity');
    console.log('  4. Network issues between Railway ↔ OpenAI');
    console.log('  5. Resource constraints (CPU/Memory on Railway)');
    console.log('\nRecommended actions:');
    console.log('  • Check Railway metrics dashboard');
    console.log('  • Review OpenAI Assistant logs');
    console.log('  • Optimize vector store settings');
    console.log('  • Consider upgrading Railway plan');
    console.log('  • Add keep-alive pings to prevent cold starts');
  }
  
  if (slowest.name.includes('Network RTT') && slowest.duration > 1000) {
    console.log('\n⚠️  High network latency detected');
    console.log('Consider:');
    console.log('  • Check your internet connection');
    console.log('  • Railway region may be far from you');
    console.log('  • Try from different network');
  }
  
  // Export results
  console.log('\n💾 Full Results (JSON):\n');
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    server: AOMA_URL,
    metrics,
    summary: {
      totalTime,
      failures,
      warnings,
      slowest: {
        name: slowest.name,
        duration: slowest.duration
      }
    }
  }, null, 2));
  
  console.log('\n' + '─'.repeat(60));
  
  // Exit code based on failures
  if (failures > 0) {
    console.log('\n❌ Diagnostics FAILED - performance issues detected\n');
    process.exit(1);
  } else if (warnings > 0) {
    console.log('\n⚠️  Diagnostics completed with warnings\n');
    process.exit(0);
  } else {
    console.log('\n✅ All diagnostics passed\n');
    process.exit(0);
  }
}

main().catch(error => {
  console.error('\n💥 Diagnostic tool crashed:', error);
  process.exit(1);
});
