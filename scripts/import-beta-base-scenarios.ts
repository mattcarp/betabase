#!/usr/bin/env tsx

/**
 * Beta Base Scenario Import Script
 *
 * Extracts AOMA scenarios from local Supabase Beta Base database
 * and imports them into SIAM for RLHF integration.
 *
 * Usage:
 *   npx tsx scripts/import-beta-base-scenarios.ts [--dry-run] [--limit=100]
 *
 * Source: postgresql://postgres:postgres@127.0.0.1:54322/postgres
 * Target: SIAM Supabase database (from .env.local)
 */

import { createClient } from '@supabase/supabase-js';
import { parse } from 'node-html-parser';

// Configuration
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
  mode: string;
  is_security: number;
  priority_sort_order: number;
  enhancement_sort_order: number;
  current_regression_sort_order: number;
  reviewed_flag: string;
}

interface TestExecution {
  id: number;
  scenario_id: number;
  created_at: string;
  pass_fail: string;
  result: string;
  input: string;
  build: string;
  ticket: string;
}

interface ProcessedScenario {
  beta_base_id: number;
  name: string;
  script_text: string;
  expected_result_text: string;
  preconditions_text: string;
  created_at: string;
  created_by: string;
  tags: string[];
  relevance_score: number;
  tier: 'GOLD' | 'SILVER' | 'BRONZE' | 'TRASH';
  execution_count: number;
  pass_rate: number;
  last_execution_date: string | null;
  metadata: {
    original_html_script: string;
    original_html_expected: string;
    original_html_preconditions: string;
    is_security: boolean;
    review_flag: boolean;
    flag_reason: string | null;
    coverage: string | null;
    client_priority: number | null;
  };
}

/**
 * Strip HTML tags from text content
 */
function stripHtml(html: string | null): string {
  if (!html) return '';

  try {
    const root = parse(html);
    return root.textContent || '';
  } catch (error) {
    console.warn('Failed to parse HTML, using fallback:', error);
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }
}

/**
 * Calculate relevance score based on multiple factors
 */
function calculateRelevanceScore(
  scenario: BetaBaseScenario,
  executions: TestExecution[]
): number {
  let score = 0;

  // Age factor (0-30 points)
  // Newer scenarios score higher
  const createdDate = new Date(scenario.created_at);
  const now = new Date();
  const yearsOld = (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24 * 365);

  if (yearsOld < 2) score += 30;
  else if (yearsOld < 5) score += 20;
  else if (yearsOld < 10) score += 10;
  else score += 5;

  // Execution history factor (0-30 points)
  const executionCount = executions.length;
  if (executionCount >= 10) score += 30;
  else if (executionCount >= 5) score += 20;
  else if (executionCount >= 2) score += 10;
  else if (executionCount === 1) score += 5;

  // Pass rate factor (0-25 points)
  const passes = executions.filter(e => e.pass_fail === 'Pass').length;
  const passRate = executionCount > 0 ? passes / executionCount : 0;

  if (passRate >= 0.9) score += 25;
  else if (passRate >= 0.75) score += 20;
  else if (passRate >= 0.5) score += 10;
  else score += 5;

  // Content quality factor (0-15 points)
  const hasScript = scenario.script && scenario.script.length > 50;
  const hasExpected = scenario.expected_result && scenario.expected_result.length > 50;
  const hasPreconditions = scenario.preconditions && scenario.preconditions.length > 10;

  if (hasScript) score += 5;
  if (hasExpected) score += 5;
  if (hasPreconditions) score += 5;

  return Math.min(100, score);
}

/**
 * Classify scenario into tier based on relevance score
 */
function classifyTier(score: number, yearsOld: number): 'GOLD' | 'SILVER' | 'BRONZE' | 'TRASH' {
  if (score >= 80 && yearsOld < 3) return 'GOLD';
  if (score >= 60 && yearsOld < 7) return 'SILVER';
  if (score >= 40) return 'BRONZE';
  return 'TRASH';
}

/**
 * Connect to Beta Base local Supabase
 */
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
  console.log('✅ Connected to Beta Base (local Supabase)');

  return client;
}

/**
 * Fetch AOMA scenarios from Beta Base
 */
async function fetchAomaScenarios(client: any, limit: number | null): Promise<BetaBaseScenario[]> {
  const limitClause = limit ? `LIMIT ${limit}` : '';

  const query = `
    SELECT *
    FROM scenario
    WHERE app_under_test = 'AOMA'
    ORDER BY created_at DESC
    ${limitClause}
  `;

  const result = await client.query(query);
  console.log(`✅ Fetched ${result.rows.length} AOMA scenarios`);

  return result.rows;
}

/**
 * Fetch test executions for given scenario IDs
 */
async function fetchTestExecutions(client: any, scenarioIds: number[]): Promise<Map<number, TestExecution[]>> {
  if (scenarioIds.length === 0) return new Map();

  const query = `
    SELECT *
    FROM test
    WHERE scenario_id = ANY($1::int[])
    ORDER BY created_at DESC
  `;

  const result = await client.query(query, [scenarioIds]);
  console.log(`✅ Fetched ${result.rows.length} test executions`);

  // Group by scenario_id
  const executionMap = new Map<number, TestExecution[]>();

  for (const execution of result.rows) {
    const scenarioId = execution.scenario_id;
    if (!executionMap.has(scenarioId)) {
      executionMap.set(scenarioId, []);
    }
    executionMap.get(scenarioId)!.push(execution);
  }

  return executionMap;
}

/**
 * Process scenarios and calculate relevance
 */
function processScenarios(
  scenarios: BetaBaseScenario[],
  executionMap: Map<number, TestExecution[]>
): ProcessedScenario[] {
  const processed: ProcessedScenario[] = [];

  for (const scenario of scenarios) {
    const executions = executionMap.get(scenario.id) || [];
    const relevanceScore = calculateRelevanceScore(scenario, executions);

    const createdDate = new Date(scenario.created_at);
    const now = new Date();
    const yearsOld = (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24 * 365);

    const passes = executions.filter(e => e.pass_fail === 'Pass').length;
    const passRate = executions.length > 0 ? passes / executions.length : 0;

    const lastExecution = executions.length > 0
      ? executions.reduce((latest, curr) =>
          new Date(curr.created_at) > new Date(latest.created_at) ? curr : latest
        )
      : null;

    processed.push({
      beta_base_id: scenario.id,
      name: scenario.name || '',
      script_text: stripHtml(scenario.script),
      expected_result_text: stripHtml(scenario.expected_result),
      preconditions_text: stripHtml(scenario.preconditions),
      created_at: scenario.created_at || '',
      created_by: scenario.created_by || '',
      tags: scenario.tags ? scenario.tags.split(',').map(t => t.trim()) : [],
      relevance_score: relevanceScore,
      tier: classifyTier(relevanceScore, yearsOld),
      execution_count: executions.length,
      pass_rate: passRate,
      last_execution_date: lastExecution ? lastExecution.created_at : null,
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
  }

  return processed;
}

/**
 * Print import summary
 */
function printSummary(scenarios: ProcessedScenario[]) {
  const tierCounts = {
    GOLD: scenarios.filter(s => s.tier === 'GOLD').length,
    SILVER: scenarios.filter(s => s.tier === 'SILVER').length,
    BRONZE: scenarios.filter(s => s.tier === 'BRONZE').length,
    TRASH: scenarios.filter(s => s.tier === 'TRASH').length,
  };

  const avgScore = scenarios.reduce((sum, s) => sum + s.relevance_score, 0) / scenarios.length;
  const avgPassRate = scenarios.reduce((sum, s) => sum + s.pass_rate, 0) / scenarios.length;

  console.log('\n📊 Import Summary:');
  console.log(`Total scenarios: ${scenarios.length}`);
  console.log(`Average relevance score: ${avgScore.toFixed(1)}/100`);
  console.log(`Average pass rate: ${(avgPassRate * 100).toFixed(1)}%`);
  console.log('\nTier Distribution:');
  console.log(`  GOLD: ${tierCounts.GOLD} (${((tierCounts.GOLD / scenarios.length) * 100).toFixed(1)}%)`);
  console.log(`  SILVER: ${tierCounts.SILVER} (${((tierCounts.SILVER / scenarios.length) * 100).toFixed(1)}%)`);
  console.log(`  BRONZE: ${tierCounts.BRONZE} (${((tierCounts.BRONZE / scenarios.length) * 100).toFixed(1)}%)`);
  console.log(`  TRASH: ${tierCounts.TRASH} (${((tierCounts.TRASH / scenarios.length) * 100).toFixed(1)}%)`);

  // Show top 5 scenarios
  const top5 = scenarios
    .sort((a, b) => b.relevance_score - a.relevance_score)
    .slice(0, 5);

  console.log('\n🏆 Top 5 Scenarios by Relevance:');
  top5.forEach((scenario, index) => {
    console.log(`\n${index + 1}. [${scenario.tier}] ${scenario.name.substring(0, 80)}...`);
    console.log(`   Score: ${scenario.relevance_score}/100 | Pass Rate: ${(scenario.pass_rate * 100).toFixed(0)}% | Executions: ${scenario.execution_count}`);
  });
}

/**
 * Save processed scenarios to JSON file
 */
async function saveToFile(scenarios: ProcessedScenario[], filename: string) {
  const fs = await import('fs/promises');

  const output = {
    exported_at: new Date().toISOString(),
    source: 'Beta Base (Local Supabase Docker)',
    connection: `postgresql://${BETA_BASE_CONNECTION.host}:${BETA_BASE_CONNECTION.port}/${BETA_BASE_CONNECTION.database}`,
    total_scenarios: scenarios.length,
    tier_distribution: {
      GOLD: scenarios.filter(s => s.tier === 'GOLD').length,
      SILVER: scenarios.filter(s => s.tier === 'SILVER').length,
      BRONZE: scenarios.filter(s => s.tier === 'BRONZE').length,
      TRASH: scenarios.filter(s => s.tier === 'TRASH').length,
    },
    scenarios,
  };

  await fs.writeFile(filename, JSON.stringify(output, null, 2));
  console.log(`\n✅ Saved to ${filename}`);
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Beta Base Scenario Import Starting...\n');

  if (isDryRun) {
    console.log('⚠️  DRY RUN MODE - No data will be imported to SIAM\n');
  }

  if (limit) {
    console.log(`⚠️  LIMIT MODE - Only importing ${limit} scenarios\n`);
  }

  try {
    // Connect to Beta Base
    const betaBaseClient = await connectToBetaBase();

    // Fetch AOMA scenarios
    const scenarios = await fetchAomaScenarios(betaBaseClient, limit);

    // Fetch test executions
    const scenarioIds = scenarios.map(s => s.id);
    const executionMap = await fetchTestExecutions(betaBaseClient, scenarioIds);

    // Process scenarios
    console.log('🔄 Processing scenarios...');
    const processedScenarios = processScenarios(scenarios, executionMap);

    // Print summary
    printSummary(processedScenarios);

    // Save to file
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `data/beta-base-scenarios-${timestamp}.json`;
    await saveToFile(processedScenarios, filename);

    // Close connection
    await betaBaseClient.end();
    console.log('\n✅ Beta Base connection closed');

    if (isDryRun) {
      console.log('\n⚠️  DRY RUN COMPLETE - No data was imported to SIAM');
      console.log('Remove --dry-run flag to actually import data');
    }

    console.log('\n✅ Import script completed successfully');

  } catch (error) {
    console.error('\n❌ Import failed:', error);
    process.exit(1);
  }
}

main();
