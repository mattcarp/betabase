#!/usr/bin/env node

/**
 * Cache Warmup Script
 * Pre-populate cache with common AOMA queries for instant responses!
 */

import dotenv from "dotenv";
import path from "path";

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import { getAOMACacheService } from "../src/services/aomaCacheService";

// Common AOMA queries to cache
const COMMON_QUERIES = [
  // AOMA 3 Features
  "What are the new features in AOMA 3?",
  "How do I use the AOMA 3 export functionality?",
  "What is AOMA 3 pseudo video support?",
  "How does AOMA 3 handle permissions?",

  // USM Workflow
  "What is the USM workflow for audio assets?",
  "How do I export to iTunes from AOMA?",
  "What are the USM cover specifications?",
  "How does the unified session manager work?",

  // Cover Operations
  "How do I perform a cover hot swap?",
  "What are the requirements for album artwork?",
  "How to update cover art in AOMA?",
  "Cover image specifications for streaming platforms",

  // Archive & Registration
  "How do I register assets in AOMA?",
  "What is the AOMA archiving process?",
  "How to bulk ingest files into AOMA?",
  "Archive registration guidelines",

  // Dolby Atmos
  "What are the Dolby Atmos requirements?",
  "How to deliver Dolby Atmos content?",
  "Dolby Atmos specifications for AOMA",

  // Development & API
  "How do I integrate with AOMA API?",
  "What are the AOMA development priorities?",
  "AOMA Jira integration setup",
  "How to use AOMA webhooks?",

  // Support & Troubleshooting
  "AOMA support escalation process",
  "How to troubleshoot AOMA export issues?",
  "Common AOMA error messages",
  "AOMA performance optimization tips",
];

async function warmupCache() {
  console.log("🔥 AOMA Cache Warmup Starting!");
  console.log("================================");
  console.log(`Preparing to cache ${COMMON_QUERIES.length} common queries`);
  console.log();

  const cacheService = getAOMACacheService();

  // Check current cache stats
  const stats = await cacheService.getCacheStats();
  console.log("📊 Current Cache Stats:");
  console.log(`   Total Cached: ${stats?.totalCached || 0}`);
  console.log(`   Average Hit Rate: ${stats?.averageHitRate || 0}`);
  console.log();

  // Warm up the cache
  await cacheService.warmupCache(COMMON_QUERIES);

  console.log();
  console.log("✅ Cache warmup complete!");
  console.log("🚀 Ready for blazing fast responses!");
}

// Run the warmup
warmupCache().catch((error) => {
  console.error("Cache warmup failed:", error);
  process.exit(1);
});
