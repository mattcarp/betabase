#!/usr/bin/env node
/**
 * AOMA Performance Diagnostic Tool
 * Run: node scripts/diagnose-aoma-performance.js
 */

const AOMA_URL =
  process.env.NEXT_PUBLIC_AOMA_MESH_SERVER_URL ||
  "https://luminous-dedication-production.up.railway.app";

async function measureLatency(name, fn) {
  const start = performance.now();
  let status = "pass";
  let details = {};

  try {
    const result = await fn();
    const duration = performance.now() - start;

    if (duration > 10000) status = "fail";
    else if (duration > 3000) status = "warn";

    details = { success: true, result };
    return { name, duration, status, details };
  } catch (error) {
    const duration = performance.now() - start;
    details = { success: false, error: error.message };
    return { name, duration, status: "fail", details };
  }
}

async function main() {
  console.log("🔍 AOMA PERFORMANCE DIAGNOSTIC TOOL\n");
  console.log(`Testing: ${AOMA_URL}\n`);
  console.log("─".repeat(60));

  const metrics = [];

  // Test 1: Network
  console.log("\n1️⃣  Testing network connectivity...");
  const m1 = await measureLatency("Network RTT", async () => {
    const response = await fetch(`${AOMA_URL}/health`);
    return await response.json();
  });
  metrics.push(m1);
  console.log(`   ✓ ${m1.duration.toFixed(0)}ms`);

  // Test 2: RPC
  console.log("\n2️⃣  Testing RPC endpoint...");
  const m2 = await measureLatency("RPC Overhead", async () => {
    const response = await fetch(`${AOMA_URL}/rpc`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: { name: "get_system_health", arguments: {} },
      }),
    });
    return await response.json();
  });
  metrics.push(m2);
  console.log(`   ✓ ${m2.duration.toFixed(0)}ms`);

  // Test 3: AOMA Knowledge (THE SLOW ONE)
  console.log("\n3️⃣  Testing AOMA Knowledge Query (this WILL be slow)...");
  const m3 = await measureLatency("AOMA Knowledge Query", async () => {
    const response = await fetch(`${AOMA_URL}/rpc`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: {
          name: "query_aoma_knowledge",
          arguments: {
            query: "diagnostic test",
            strategy: "rapid",
          },
        },
      }),
    });
    return await response.json();
  });
  metrics.push(m3);
  console.log(
    `   ${m3.status === "fail" ? "✗" : "✓"} ${m3.duration.toFixed(0)}ms ${m3.duration > 15000 ? "🔴 CRITICAL" : ""}`
  );

  // Analysis
  console.log("\n" + "─".repeat(60));
  console.log("\n📊 PERFORMANCE ANALYSIS\n");

  metrics.forEach((m) => {
    const icon = m.status === "pass" ? "✅" : m.status === "warn" ? "⚠️ " : "❌";
    console.log(`  ${icon} ${m.name.padEnd(30)} ${m.duration.toFixed(0).padStart(6)}ms`);
  });

  // Find the problem
  const slowest = metrics.reduce((a, b) => (a.duration > b.duration ? a : b));

  console.log("\n🔍 ROOT CAUSE ANALYSIS:\n");
  console.log(`Slowest: ${slowest.name} (${slowest.duration.toFixed(0)}ms)\n`);

  if (slowest.name.includes("Knowledge") && slowest.duration > 15000) {
    console.log("🔴 FOUND THE PROBLEM: query_aoma_knowledge is taking 15-25 seconds!\n");
    console.log("This tool calls OpenAI Assistant API which is SLOW because:");
    console.log("  1. Railway cold start (free tier)");
    console.log("  2. OpenAI Assistant API inherent latency (10-15s)");
    console.log("  3. Vector store search complexity");
    console.log("  4. Multiple round-trips: Railway → OpenAI → Vector Store → Back\n");
    console.log("SOLUTIONS:");
    console.log("  • Keep Railway warm (cron ping every 5 min)");
    console.log("  • Optimize OpenAI Assistant settings");
    console.log("  • Add aggressive caching");
    console.log("  • Upgrade Railway plan for faster CPU");
    console.log("  • Consider switching from Assistant API to direct completions");
  }

  console.log("\n" + "─".repeat(60) + "\n");
}

main().catch(console.error);
