#!/usr/bin/env tsx

/**
 * Beta Base to SIAM Supabase Importer
 *
 * Imports AOMA scenarios from Beta Base (local Supabase) into SIAM production Supabase
 * with vector embeddings for similarity search.
 *
 * Usage:
 *   npx tsx scripts/import-to-supabase.ts [--dry-run] [--limit=100] [--batch-size=50]
 *
 * Requirements:
 *   - NEXT_PUBLIC_SUPABASE_URL in .env.local
 *   - SUPABASE_SERVICE_ROLE_KEY in .env.local
 *   - OPENAI_API_KEY in .env.local (for embeddings)
 *   - Local Beta Base Supabase running on port 54322
 */

import { createClient } from '@supabase/supabase-js';
import { parse } from 'node-html-parser';
import OpenAI from 'openai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const BETA_BASE_CONNECTION = {
  host: '127.0.0.1',
  port: 54322,
  database: 'postgres',
  user: 'postgres',
  password: 'postgres',
};

const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const limitArg = args.find(arg => arg.startsWith('--limit='));
const limit = limitArg ? parseInt(limitArg.split('=')[1]) : null;
const batchSizeArg = args.find(arg => arg.startsWith('--batch-size='));
const batchSize = batchSizeArg ? parseInt(batchSizeArg.split('=')[1]) : 50;

interface BetaBaseScenario {
  id: number;
  name: string;
  script: string;
  expected_result: string;
  created_by: string;
  updated_by: string;
  preconditions: string;
  created_at: string;
  updated_at: string;
  review_flag: number;
  flag_reason: string;
  app_under_test: string;
  tags: string;
  coverage: string;
  client_priority: number;
  is_security: number;
}

interface TestExecution {
  id: number;
  scenario_id: number;
  created_at: string;
  created_by: string;
  pass_fail: string;
  result: string;
  input: string;
  build: string;
  ticket: string;
  comments: string;
  browser_name: string;
  os_name: string;
}

interface ProcessedScenario {
  beta_base_id: number;
  name: string;
  script_text: string;
  expected_result_text: string;
  preconditions_text: string;
  created_at: string;
  created_by: string;
  updated_at: string | null;
  updated_by: string | null;
  tags: string[];
  relevance_score: number;
  tier: 'GOLD' | 'SILVER' | 'BRONZE' | 'TRASH';
  execution_count: number;
  pass_rate: number | null;
  last_execution_date: string | null;
  embedding: number[];
  metadata: Record<string, any>;
}

function stripHtml(html: string | null): string {
  if (!html) return '';
  try {
    const root = parse(html);
    return root.textContent || '';
  } catch {
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }
}

function calculateRelevanceScore(
  scenario: BetaBaseScenario,
  executions: TestExecution[]
): number {
  let score = 0;

  // Age factor (0-30)
  const createdDate = new Date(scenario.created_at);
  const yearsOld = (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
  if (yearsOld < 2) score += 30;
  else if (yearsOld < 5) score += 20;
  else if (yearsOld < 10) score += 10;
  else score += 5;

  // Execution history (0-30)
  if (executions.length >= 10) score += 30;
  else if (executions.length >= 5) score += 20;
  else if (executions.length >= 2) score += 10;
  else if (executions.length === 1) score += 5;

  // Pass rate (0-25)
  const passes = executions.filter(e => e.pass_fail === 'Pass').length;
  const passRate = executions.length > 0 ? passes / executions.length : 0;
  if (passRate >= 0.9) score += 25;
  else if (passRate >= 0.75) score += 20;
  else if (passRate >= 0.5) score += 10;
  else score += 5;

  // Content quality (0-15)
  if (scenario.script && scenario.script.length > 50) score += 5;
  if (scenario.expected_result && scenario.expected_result.length > 50) score += 5;
  if (scenario.preconditions && scenario.preconditions.length > 10) score += 5;

  return Math.min(100, score);
}

function classifyTier(score: number, yearsOld: number): 'GOLD' | 'SILVER' | 'BRONZE' | 'TRASH' {
  if (score >= 80 && yearsOld < 3) return 'GOLD';
  if (score >= 60 && yearsOld < 7) return 'SILVER';
  if (score >= 40) return 'BRONZE';
  return 'TRASH';
}

async function generateEmbedding(text: string, openai: OpenAI): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: text.substring(0, 8000), // OpenAI limit
  });
  return response.data[0].embedding;
}

async function connectToBetaBase() {
  const { Client } = await import('pg');
  const client = new Client({
    host: BETA_BASE_CONNECTION.host,
    port: BETA_BASE_CONNECTION.port,
    database: BETA_BASE_CONNECTION.database,
    user: BETA_BASE_CONNECTION.user,
    password: BETA_BASE_CONNECTION.password,
  });
  await client.connect();
  console.log('✅ Connected to Beta Base');
  return client;
}

async function fetchScenarios(client: any, limit: number | null): Promise<BetaBaseScenario[]> {
  const limitClause = limit ? `LIMIT ${limit}` : '';
  const query = `
    SELECT *
    FROM scenario
    WHERE app_under_test = 'AOMA'
    ORDER BY created_at DESC
    ${limitClause}
  `;
  const result = await client.query(query);
  console.log(`✅ Fetched ${result.rows.length} scenarios`);
  return result.rows;
}

async function fetchExecutions(client: any, scenarioIds: number[]): Promise<Map<number, TestExecution[]>> {
  if (scenarioIds.length === 0) return new Map();
  const query = `
    SELECT *
    FROM test
    WHERE scenario_id = ANY($1::int[])
    ORDER BY created_at DESC
  `;
  const result = await client.query(query, [scenarioIds]);
  console.log(`✅ Fetched ${result.rows.length} executions`);

  const map = new Map<number, TestExecution[]>();
  for (const exec of result.rows) {
    if (!map.has(exec.scenario_id)) map.set(exec.scenario_id, []);
    map.get(exec.scenario_id)!.push(exec);
  }
  return map;
}

async function processWithEmbeddings(
  scenarios: BetaBaseScenario[],
  executionMap: Map<number, TestExecution[]>,
  openai: OpenAI
): Promise<ProcessedScenario[]> {
  const processed: ProcessedScenario[] = [];
  let count = 0;

  for (const scenario of scenarios) {
    count++;
    const executions = executionMap.get(scenario.id) || [];
    const relevanceScore = calculateRelevanceScore(scenario, executions);

    const createdDate = new Date(scenario.created_at);
    const yearsOld = (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24 * 365);

    const passes = executions.filter(e => e.pass_fail === 'Pass').length;
    const passRate = executions.length > 0 ? passes / executions.length : null;

    const lastExecution = executions.length > 0
      ? executions.reduce((latest, curr) =>
          new Date(curr.created_at) > new Date(latest.created_at) ? curr : latest
        )
      : null;

    // Generate embedding from scenario content
    const embeddingText = [
      scenario.name,
      stripHtml(scenario.script),
      stripHtml(scenario.expected_result),
    ].filter(Boolean).join(' ');

    console.log(`Generating embedding ${count}/${scenarios.length}...`);
    const embedding = await generateEmbedding(embeddingText, openai);

    processed.push({
      beta_base_id: scenario.id,
      name: scenario.name || '',
      script_text: stripHtml(scenario.script),
      expected_result_text: stripHtml(scenario.expected_result),
      preconditions_text: stripHtml(scenario.preconditions),
      created_at: scenario.created_at || new Date().toISOString(),
      created_by: scenario.created_by || '',
      updated_at: scenario.updated_at || null,
      updated_by: scenario.updated_by || null,
      tags: scenario.tags ? scenario.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      relevance_score: relevanceScore,
      tier: classifyTier(relevanceScore, yearsOld),
      execution_count: executions.length,
      pass_rate: passRate,
      last_execution_date: lastExecution ? lastExecution.created_at : null,
      embedding,
      metadata: {
        original_html_script: scenario.script || '',
        original_html_expected: scenario.expected_result || '',
        original_html_preconditions: scenario.preconditions || '',
        is_security: scenario.is_security === 1,
        review_flag: scenario.review_flag === 1,
        flag_reason: scenario.flag_reason || null,
        coverage: scenario.coverage || null,
        client_priority: scenario.client_priority || null,
      },
    });

    // Rate limit: 3000 RPM for ada-002 = ~50/sec, so small delay
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  return processed;
}

async function insertIntoSupabase(
  scenarios: ProcessedScenario[],
  executions: Map<number, TestExecution[]>,
  supabase: any
): Promise<void> {
  console.log(`\n📊 Inserting ${scenarios.length} scenarios into Supabase...`);

  // Insert scenarios in batches
  for (let i = 0; i < scenarios.length; i += batchSize) {
    const batch = scenarios.slice(i, i + batchSize);
    const { data, error } = await supabase
      .from('beta_base_scenarios')
      .insert(batch.map(s => ({
        beta_base_id: s.beta_base_id,
        name: s.name,
        script_text: s.script_text,
        expected_result_text: s.expected_result_text,
        preconditions_text: s.preconditions_text,
        created_at: s.created_at,
        created_by: s.created_by,
        updated_at: s.updated_at,
        updated_by: s.updated_by,
        tags: s.tags,
        relevance_score: s.relevance_score,
        tier: s.tier,
        execution_count: s.execution_count,
        pass_rate: s.pass_rate,
        last_execution_date: s.last_execution_date,
        embedding: s.embedding,
        metadata: s.metadata,
      })))
      .select('id, beta_base_id');

    if (error) {
      console.error(`❌ Error inserting batch ${i / batchSize + 1}:`);
      console.error('Error details:', JSON.stringify(error, null, 2));
      console.error('Sample data from batch:', JSON.stringify(batch[0], null, 2));
      throw error;
    }

    console.log(`✅ Inserted batch ${i / batchSize + 1}/${Math.ceil(scenarios.length / batchSize)} (${batch.length} scenarios)`);

    // Insert executions for this batch
    const scenarioIdMap = new Map(data.map((s: any) => [s.beta_base_id, s.id]));
    const executionsToInsert = [];

    for (const scenario of batch) {
      const scenarioUuid = scenarioIdMap.get(scenario.beta_base_id);
      if (!scenarioUuid) continue;

      const execs = executions.get(scenario.beta_base_id) || [];
      for (const exec of execs) {
        executionsToInsert.push({
          beta_base_id: exec.id,
          scenario_id: scenarioUuid,
          executed_at: exec.created_at,
          executed_by: exec.created_by,
          pass_fail: exec.pass_fail,
          input_text: exec.input,
          result_text: exec.result,
          comments: exec.comments,
          build: exec.build,
          ticket: exec.ticket,
          browser_name: exec.browser_name,
          os_name: exec.os_name,
        });
      }
    }

    if (executionsToInsert.length > 0) {
      const { error: execError } = await supabase
        .from('beta_base_executions')
        .insert(executionsToInsert);

      if (execError) {
        console.error(`⚠️  Error inserting executions for batch ${i / batchSize + 1}:`, execError);
      } else {
        console.log(`✅ Inserted ${executionsToInsert.length} executions`);
      }
    }
  }
}

function printSummary(scenarios: ProcessedScenario[]) {
  const tierCounts = {
    GOLD: scenarios.filter(s => s.tier === 'GOLD').length,
    SILVER: scenarios.filter(s => s.tier === 'SILVER').length,
    BRONZE: scenarios.filter(s => s.tier === 'BRONZE').length,
    TRASH: scenarios.filter(s => s.tier === 'TRASH').length,
  };

  const avgScore = scenarios.reduce((sum, s) => sum + s.relevance_score, 0) / scenarios.length;
  const avgPassRate = scenarios.filter(s => s.pass_rate !== null).reduce((sum, s) => sum + (s.pass_rate || 0), 0) / scenarios.filter(s => s.pass_rate !== null).length;

  console.log('\n📊 Import Summary:');
  console.log(`Total scenarios: ${scenarios.length}`);
  console.log(`Average relevance: ${avgScore.toFixed(1)}/100`);
  console.log(`Average pass rate: ${(avgPassRate * 100).toFixed(1)}%`);
  console.log('\nTier Distribution:');
  console.log(`  GOLD: ${tierCounts.GOLD} (${((tierCounts.GOLD / scenarios.length) * 100).toFixed(1)}%)`);
  console.log(`  SILVER: ${tierCounts.SILVER} (${((tierCounts.SILVER / scenarios.length) * 100).toFixed(1)}%)`);
  console.log(`  BRONZE: ${tierCounts.BRONZE} (${((tierCounts.BRONZE / scenarios.length) * 100).toFixed(1)}%)`);
  console.log(`  TRASH: ${tierCounts.TRASH} (${((tierCounts.TRASH / scenarios.length) * 100).toFixed(1)}%)`);
}

async function main() {
  console.log('🚀 Beta Base to SIAM Import Starting...\n');

  if (isDryRun) console.log('⚠️  DRY RUN MODE\n');
  if (limit) console.log(`⚠️  LIMIT: ${limit} scenarios\n`);

  // Validate environment
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  }
  if (!openaiKey) {
    throw new Error('Missing OPENAI_API_KEY in .env.local');
  }

  try {
    // Initialize clients
    const betaBaseClient = await connectToBetaBase();
    const supabase = createClient(supabaseUrl, supabaseKey);
    const openai = new OpenAI({ apiKey: openaiKey });

    // Fetch data
    const scenarios = await fetchScenarios(betaBaseClient, limit);
    const scenarioIds = scenarios.map(s => s.id);
    const executionMap = await fetchExecutions(betaBaseClient, scenarioIds);

    // Process with embeddings
    console.log('\n🔄 Processing scenarios and generating embeddings...');
    const processed = await processWithEmbeddings(scenarios, executionMap, openai);

    // Print summary
    printSummary(processed);

    // Insert into Supabase
    if (!isDryRun) {
      await insertIntoSupabase(processed, executionMap, supabase);
      console.log('\n✅ Import complete!');
    } else {
      console.log('\n⚠️  DRY RUN - No data inserted');
    }

    // Cleanup
    await betaBaseClient.end();

  } catch (error) {
    console.error('\n❌ Import failed:', error);
    process.exit(1);
  }
}

main();
