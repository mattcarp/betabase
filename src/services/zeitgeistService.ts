/**
 * Zeitgeist Service - FEAT-010
 *
 * Hot Topics Intelligence Service that aggregates activity signals
 * from multiple data sources to identify trending topics.
 *
 * Data Sources:
 * - RLHF feedback (query frequency, sentiment) - Weight 0.4
 * - Jira tickets (recent issues) - Weight 0.3
 * - Test results (failure patterns) - Weight 0.2
 * - Chat history (repeated queries) - Weight 0.1
 *
 * Features:
 * - Aggregates and scores topics
 * - Validates KB coverage (similarity > 0.70)
 * - Calculates trends (rising/stable/falling)
 * - Caches results in app_cache
 * - Provides top 6 for chat suggestions + full list for managers
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { searchKnowledge } from "./knowledgeSearchService";

// ============================================================================
// Types
// ============================================================================

export interface ZeitgeistTopic {
  id: string;
  question: string;
  rawScore: number;
  frequency: number;
  recencyWeight: number;
  trend: 'rising' | 'stable' | 'falling';
  hasGoodAnswer: boolean;
  answerConfidence: number;
  sources: ZeitgeistSource[];
  lastSeen: string;
  category: 'rlhf' | 'jira' | 'test_failure' | 'chat_history' | 'mixed';
}

export interface ZeitgeistSource {
  type: 'rlhf' | 'jira' | 'test' | 'chat';
  id: string;
  weight: number;
}

export interface ZeitgeistCache {
  suggestions: string[];           // Top 6 for chat page
  allTopics: ZeitgeistTopic[];     // Full list for dashboard
  generatedAt: string;
  dataRange: '48h';
  version: 1;
  stats: {
    rlhfCount: number;
    jiraCount: number;
    testFailureCount: number;
    topicsGenerated: number;
    topicsValidated: number;
  };
  // Track previous scores for trend calculation
  previousScores?: Record<string, number>;
}

export interface ZeitgeistRefreshResult {
  success: boolean;
  cache?: ZeitgeistCache | null;
  error?: string;
  // API-friendly fields
  topicsAnalyzed: number;
  topicsWithAnswers: number;
  sourceBreakdown: {
    rlhf: number;
    jira: number;
    test: number;
  };
  topQuestions: string[];
  duration: number;
}

// Source weights from spec
const SOURCE_WEIGHTS = {
  rlhf: 0.4,
  jira: 0.3,
  test: 0.2,
  chat: 0.1
};

// Cache TTL: 12 hours in milliseconds
const CACHE_TTL_MS = 12 * 60 * 60 * 1000;

// ============================================================================
// Supabase Client
// ============================================================================

function getSupabase(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("[Zeitgeist] Missing Supabase credentials");
  }

  return createClient(supabaseUrl, supabaseKey);
}

// ============================================================================
// Data Collection
// ============================================================================

interface RlhfSignal {
  query: string;
  count: number;
  positiveRate: number;
  lastSeen: string;
}

async function collectRlhfSignals(hoursAgo: number = 48): Promise<RlhfSignal[]> {
  const supabase = getSupabase();
  const cutoffDate = new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString();

  try {
    const { data, error } = await supabase
      .from("rlhf_feedback")
      .select("query, feedback_type, created_at")
      .gte("created_at", cutoffDate)
      .not("query", "is", null)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[Zeitgeist] Error fetching RLHF signals:", error);
      return [];
    }

    if (!data || data.length === 0) {
      console.log("[Zeitgeist] No RLHF feedback in last", hoursAgo, "hours");
      return [];
    }

    // Group by query and calculate stats
    const queryMap = new Map<string, { count: number; positive: number; lastSeen: string }>();

    for (const row of data) {
      const query = row.query?.trim();
      if (!query || query.length < 10) continue; // Skip very short queries

      const existing = queryMap.get(query) || { count: 0, positive: 0, lastSeen: row.created_at };
      existing.count++;
      if (row.feedback_type === 'thumbs_up') existing.positive++;
      queryMap.set(query, existing);
    }

    // Convert to array and sort by frequency
    const signals: RlhfSignal[] = Array.from(queryMap.entries())
      .map(([query, stats]) => ({
        query,
        count: stats.count,
        positiveRate: stats.count > 0 ? stats.positive / stats.count : 0,
        lastSeen: stats.lastSeen
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 50); // Top 50

    console.log(`[Zeitgeist] Collected ${signals.length} RLHF signals from ${data.length} feedback items`);
    return signals;
  } catch (err) {
    console.error("[Zeitgeist] RLHF collection failed:", err);
    return [];
  }
}

interface JiraSignal {
  summary: string;
  ticketKey: string;
  createdAt: string;
}

async function collectJiraSignals(daysAgo: number = 7): Promise<JiraSignal[]> {
  const supabase = getSupabase();
  const cutoffDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();

  try {
    // Get Jira tickets from siam_vectors
    const { data, error } = await supabase
      .from("siam_vectors")
      .select("source_id, content, metadata, created_at")
      .eq("source_type", "jira")
      .eq("organization", "sony-music")
      .gte("created_at", cutoffDate)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("[Zeitgeist] Error fetching Jira signals:", error);
      return [];
    }

    if (!data || data.length === 0) {
      console.log("[Zeitgeist] No Jira tickets in last", daysAgo, "days");
      return [];
    }

    const signals: JiraSignal[] = data.map(row => ({
      summary: row.metadata?.summary || row.content?.substring(0, 200) || row.source_id,
      ticketKey: row.source_id || 'unknown',
      createdAt: row.created_at
    }));

    console.log(`[Zeitgeist] Collected ${signals.length} Jira signals`);
    return signals;
  } catch (err) {
    console.error("[Zeitgeist] Jira collection failed:", err);
    return [];
  }
}

interface TestFailureSignal {
  testName: string;
  failCount: number;
  lastFailed: string;
  errorPattern: string;
}

async function collectTestFailureSignals(daysAgo: number = 7): Promise<TestFailureSignal[]> {
  const supabase = getSupabase();
  const cutoffDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();

  try {
    // Check if historical_tests table exists
    const { data, error } = await supabase
      .from("historical_tests")
      .select("test_name, error_message, created_at")
      .eq("status", "failed")
      .gte("created_at", cutoffDate)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      // Table might not exist - that's OK
      if (error.code === "42P01" || error.message?.includes("does not exist")) {
        console.log("[Zeitgeist] historical_tests table not found, skipping test signals");
        return [];
      }
      console.error("[Zeitgeist] Error fetching test signals:", error);
      return [];
    }

    if (!data || data.length === 0) {
      console.log("[Zeitgeist] No test failures in last", daysAgo, "days");
      return [];
    }

    // Group by test name
    const testMap = new Map<string, { count: number; lastFailed: string; errorPattern: string }>();

    for (const row of data) {
      const testName = row.test_name || 'unknown';
      const existing = testMap.get(testName) || {
        count: 0,
        lastFailed: row.created_at,
        errorPattern: row.error_message?.substring(0, 100) || ''
      };
      existing.count++;
      testMap.set(testName, existing);
    }

    // Only include tests that failed more than once
    const signals: TestFailureSignal[] = Array.from(testMap.entries())
      .filter(([_, stats]) => stats.count >= 2)
      .map(([testName, stats]) => ({
        testName,
        failCount: stats.count,
        lastFailed: stats.lastFailed,
        errorPattern: stats.errorPattern
      }))
      .sort((a, b) => b.failCount - a.failCount)
      .slice(0, 20);

    console.log(`[Zeitgeist] Collected ${signals.length} test failure signals`);
    return signals;
  } catch (err) {
    console.error("[Zeitgeist] Test failure collection failed:", err);
    return [];
  }
}

// ============================================================================
// Topic Generation & Scoring
// ============================================================================

function generateTopicsFromSignals(
  rlhfSignals: RlhfSignal[],
  jiraSignals: JiraSignal[],
  testSignals: TestFailureSignal[]
): ZeitgeistTopic[] {
  const topics: ZeitgeistTopic[] = [];

  // Generate topics from RLHF (highest weight)
  for (const signal of rlhfSignals.slice(0, 20)) {
    const recencyWeight = calculateRecency(signal.lastSeen, 48);
    topics.push({
      id: `rlhf-${Date.now()}-${topics.length}`,
      question: signal.query,
      rawScore: 0, // Calculated below
      frequency: signal.count,
      recencyWeight,
      trend: 'stable', // Calculated in trend task
      hasGoodAnswer: false, // Validated in KB task
      answerConfidence: 0,
      sources: [{ type: 'rlhf', id: signal.query.substring(0, 50), weight: SOURCE_WEIGHTS.rlhf }],
      lastSeen: signal.lastSeen,
      category: 'rlhf'
    });
  }

  // Generate topics from Jira
  for (const signal of jiraSignals.slice(0, 15)) {
    const recencyWeight = calculateRecency(signal.createdAt, 168); // 7 days
    const question = jiraToQuestion(signal.summary);
    if (!question) continue;

    topics.push({
      id: `jira-${Date.now()}-${topics.length}`,
      question,
      rawScore: 0,
      frequency: 1, // Jira tickets are unique
      recencyWeight,
      trend: 'stable',
      hasGoodAnswer: false,
      answerConfidence: 0,
      sources: [{ type: 'jira', id: signal.ticketKey, weight: SOURCE_WEIGHTS.jira }],
      lastSeen: signal.createdAt,
      category: 'jira'
    });
  }

  // Generate topics from test failures
  for (const signal of testSignals.slice(0, 10)) {
    const recencyWeight = calculateRecency(signal.lastFailed, 168);
    const question = testFailureToQuestion(signal.testName, signal.errorPattern);
    if (!question) continue;

    topics.push({
      id: `test-${Date.now()}-${topics.length}`,
      question,
      rawScore: 0,
      frequency: signal.failCount,
      recencyWeight,
      trend: 'stable',
      hasGoodAnswer: false,
      answerConfidence: 0,
      sources: [{ type: 'test', id: signal.testName, weight: SOURCE_WEIGHTS.test }],
      lastSeen: signal.lastFailed,
      category: 'test_failure'
    });
  }

  // Calculate raw scores
  for (const topic of topics) {
    topic.rawScore = calculateScore(topic);
  }

  // Sort by score and deduplicate similar questions
  const uniqueTopics = deduplicateTopics(topics);
  uniqueTopics.sort((a, b) => b.rawScore - a.rawScore);

  console.log(`[Zeitgeist] Generated ${uniqueTopics.length} unique topics from ${topics.length} raw signals`);
  return uniqueTopics;
}

function calculateRecency(dateStr: string, maxHours: number): number {
  const hoursAgo = (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60);
  return Math.max(0, 1 - (hoursAgo / maxHours));
}

function calculateScore(topic: ZeitgeistTopic): number {
  // From spec: frequency 0.3, recency 0.3, confidence 0.4
  // But confidence comes from KB validation, so for initial scoring:
  const frequencyScore = Math.min(topic.frequency / 10, 1.0) * 0.3;
  const recencyScore = topic.recencyWeight * 0.3;
  const sourceWeight = topic.sources.reduce((sum, s) => sum + s.weight, 0);

  return frequencyScore + recencyScore + (sourceWeight * 0.4);
}

function jiraToQuestion(summary: string): string | null {
  if (!summary || summary.length < 10) return null;

  // Clean up Jira summary to make a question
  const cleaned = summary.trim();

  // If it's already a question, use it
  if (cleaned.endsWith('?')) return cleaned;

  // Convert common patterns to questions
  if (cleaned.toLowerCase().startsWith('how to')) {
    return cleaned + '?';
  }

  if (cleaned.toLowerCase().includes('issue') || cleaned.toLowerCase().includes('error')) {
    return `How do I resolve: ${cleaned}?`;
  }

  if (cleaned.toLowerCase().includes('feature') || cleaned.toLowerCase().includes('request')) {
    return `What is the status of: ${cleaned}?`;
  }

  return `Can you help with: ${cleaned}?`;
}

function testFailureToQuestion(testName: string, errorPattern: string): string | null {
  if (!testName) return null;

  // Convert test name to human-readable question
  const readable = testName
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]/g, ' ')
    .trim()
    .toLowerCase();

  if (errorPattern && errorPattern.length > 10) {
    return `Why is the "${readable}" test failing with "${errorPattern.substring(0, 50)}"?`;
  }

  return `How do I fix the failing "${readable}" test?`;
}

function deduplicateTopics(topics: ZeitgeistTopic[]): ZeitgeistTopic[] {
  const seen = new Set<string>();
  const unique: ZeitgeistTopic[] = [];

  for (const topic of topics) {
    // Create a normalized key for comparison
    const key = topic.question
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 50);

    if (!seen.has(key)) {
      seen.add(key);
      unique.push(topic);
    }
  }

  return unique;
}

// ============================================================================
// KB Validation - Task 2
// ============================================================================

const KB_VALIDATION_THRESHOLD = 0.70; // Similarity threshold for "good answer"
const KB_VALIDATION_TIMEOUT_MS = 2000; // Timeout per topic validation

/**
 * Validate that we have good answers in the knowledge base for each topic.
 * Updates hasGoodAnswer and answerConfidence fields.
 */
async function validateKBCoverage(topics: ZeitgeistTopic[]): Promise<ZeitgeistTopic[]> {
  console.log(`[Zeitgeist] Validating KB coverage for ${topics.length} topics...`);

  // Process in parallel with timeout
  const validationPromises = topics.map(async (topic) => {
    try {
      const result = await Promise.race([
        searchKnowledge(topic.question, {
          matchThreshold: 0.50, // Lower threshold to get results
          matchCount: 3,
          timeoutMs: KB_VALIDATION_TIMEOUT_MS
        }),
        new Promise<null>((_, reject) =>
          setTimeout(() => reject(new Error('Validation timeout')), KB_VALIDATION_TIMEOUT_MS + 100)
        )
      ]);

      if (result && 'results' in result && result.results.length > 0) {
        const topResult = result.results[0];
        const confidence = topResult.similarity ?? 0;

        return {
          ...topic,
          hasGoodAnswer: confidence >= KB_VALIDATION_THRESHOLD,
          answerConfidence: confidence
        };
      }

      return { ...topic, hasGoodAnswer: false, answerConfidence: 0 };
    } catch (_err) {
      console.warn(`[Zeitgeist] KB validation failed for topic: ${topic.question.substring(0, 50)}...`);
      return { ...topic, hasGoodAnswer: false, answerConfidence: 0 };
    }
  });

  const validatedTopics = await Promise.all(validationPromises);

  const goodAnswerCount = validatedTopics.filter(t => t.hasGoodAnswer).length;
  console.log(`[Zeitgeist] KB validation complete: ${goodAnswerCount}/${topics.length} have good answers`);

  return validatedTopics;
}

/**
 * Recalculate score after KB validation (confidence affects final score)
 */
function recalculateScoreWithConfidence(topic: ZeitgeistTopic): number {
  // From spec: frequency 0.3, recency 0.3, confidence 0.4
  const frequencyScore = Math.min(topic.frequency / 10, 1.0) * 0.3;
  const recencyScore = topic.recencyWeight * 0.3;
  const confidenceScore = topic.answerConfidence * 0.4;

  return frequencyScore + recencyScore + confidenceScore;
}

// ============================================================================
// Trend Calculation - Task 7
// ============================================================================

const TREND_THRESHOLD = 0.10; // 10% change threshold for rising/falling

/**
 * Calculate trend based on score change from previous refresh
 * Rising: score increased by > 10%
 * Falling: score decreased by > 10%
 * Stable: otherwise
 */
function calculateTrend(
  currentScore: number,
  previousScore: number | undefined
): 'rising' | 'stable' | 'falling' {
  if (previousScore === undefined || previousScore === 0) {
    // New topic - mark as rising if it has a decent score
    return currentScore > 0.3 ? 'rising' : 'stable';
  }

  const changeRatio = (currentScore - previousScore) / previousScore;

  if (changeRatio > TREND_THRESHOLD) {
    return 'rising';
  } else if (changeRatio < -TREND_THRESHOLD) {
    return 'falling';
  }
  return 'stable';
}

/**
 * Create a normalized key for topic matching across refreshes
 */
function createTopicKey(question: string): string {
  return question
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .substring(0, 80);
}

/**
 * Apply trend calculation to all topics based on previous scores
 */
function applyTrends(
  topics: ZeitgeistTopic[],
  previousScores: Record<string, number> | undefined
): ZeitgeistTopic[] {
  return topics.map(topic => {
    const key = createTopicKey(topic.question);
    const previousScore = previousScores?.[key];
    const trend = calculateTrend(topic.rawScore, previousScore);

    return { ...topic, trend };
  });
}

/**
 * Build a score map for the next refresh cycle
 */
function buildScoreMap(topics: ZeitgeistTopic[]): Record<string, number> {
  const scoreMap: Record<string, number> = {};
  for (const topic of topics) {
    const key = createTopicKey(topic.question);
    scoreMap[key] = topic.rawScore;
  }
  return scoreMap;
}

// ============================================================================
// Caching (with in-memory fallback)
// ============================================================================

// In-memory cache for when Supabase app_cache table doesn't exist
let inMemoryCache: { cache: ZeitgeistCache; timestamp: number } | null = null;

async function saveToCache(cache: ZeitgeistCache): Promise<void> {
  // Always save to in-memory cache
  inMemoryCache = { cache, timestamp: Date.now() };

  // Try to save to Supabase
  try {
    const supabase = getSupabase();
    const { error } = await supabase
      .from("app_cache")
      .upsert({
        key: "zeitgeist_topics",
        value: JSON.stringify(cache),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "key"
      });

    if (error) {
      // Table might not exist - that's OK, we have in-memory fallback
      if (error.code === '42P01') {
        console.log("[Zeitgeist] app_cache table doesn't exist, using in-memory cache");
      } else {
        console.error("[Zeitgeist] Error saving to cache:", error);
      }
    } else {
      console.log("[Zeitgeist] Cache saved to Supabase");
    }
  } catch (_err) {
    console.log("[Zeitgeist] Cache saved to memory only");
  }
}

async function loadFromCache(): Promise<ZeitgeistCache | null> {
  // First try Supabase
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("app_cache")
      .select("value, updated_at")
      .eq("key", "zeitgeist_topics")
      .single();

    if (!error && data) {
      const cache = JSON.parse(data.value) as ZeitgeistCache;
      const updatedAt = new Date(data.updated_at);
      const hoursOld = (Date.now() - updatedAt.getTime()) / (1000 * 60 * 60);

      if (hoursOld <= 12) {
        console.log("[Zeitgeist] Loaded from Supabase cache (", hoursOld.toFixed(1), "hours old)");
        return cache;
      }
    }

    // Table might not exist (42P01) - fall through to in-memory
    if (error && error.code !== '42P01') {
      console.log("[Zeitgeist] Supabase cache error:", error.message);
    }
  } catch (_err) {
    // Fall through to in-memory cache
  }

  // Fall back to in-memory cache
  if (inMemoryCache) {
    const hoursOld = (Date.now() - inMemoryCache.timestamp) / (1000 * 60 * 60);
    if (hoursOld <= 12) {
      console.log("[Zeitgeist] Loaded from in-memory cache (", hoursOld.toFixed(1), "hours old)");
      return inMemoryCache.cache;
    }
  }

  console.log("[Zeitgeist] No valid cache found");
  return null;
}

// ============================================================================
// Default Fallback
// ============================================================================

function getDefaultSuggestions(): string[] {
  return [
    "What are the steps to link a product to a master in AOMA?",
    "What new features are in the latest AOMA release?",
    "What is the quality check process for videos submitted to AOMA?",
    "What permissions do I need for the Unified Submission Tool?",
    "What's the difference between Full Master, Side, and Track Linking?",
    "What are the different asset types in AOMA?"
  ];
}

function getDefaultCache(): ZeitgeistCache {
  const now = new Date().toISOString();
  return {
    suggestions: getDefaultSuggestions(),
    allTopics: getDefaultSuggestions().map((q, i) => ({
      id: `default-${i}`,
      question: q,
      rawScore: 0.5,
      frequency: 1,
      recencyWeight: 0.5,
      trend: 'stable' as const,
      hasGoodAnswer: true,
      answerConfidence: 0.7,
      sources: [],
      lastSeen: now,
      category: 'mixed' as const
    })),
    generatedAt: now,
    dataRange: '48h',
    version: 1,
    stats: {
      rlhfCount: 0,
      jiraCount: 0,
      testFailureCount: 0,
      topicsGenerated: 6,
      topicsValidated: 6
    }
  };
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Get top 6 suggestions for the chat page
 */
export async function getSuggestions(): Promise<string[]> {
  try {
    const cache = await loadFromCache();
    if (cache && cache.suggestions.length > 0) {
      return cache.suggestions;
    }
    return getDefaultSuggestions();
  } catch (err) {
    console.error("[Zeitgeist] getSuggestions failed:", err);
    return getDefaultSuggestions();
  }
}

/**
 * Get all topics for the manager dashboard
 */
export async function getTrendingTopics(): Promise<ZeitgeistTopic[]> {
  try {
    const cache = await loadFromCache();
    if (cache && cache.allTopics.length > 0) {
      return cache.allTopics;
    }
    return getDefaultCache().allTopics;
  } catch (err) {
    console.error("[Zeitgeist] getTrendingTopics failed:", err);
    return getDefaultCache().allTopics;
  }
}

/**
 * Refresh the zeitgeist cache
 * Called manually or by cron job
 */
export async function refreshZeitgeist(): Promise<ZeitgeistRefreshResult> {
  console.log("[Zeitgeist] Starting refresh...");
  const startTime = Date.now();

  try {
    // Load previous cache for trend calculation
    const previousCache = await loadFromCache();
    const previousScores = previousCache?.previousScores;

    // Collect signals from all sources
    const [rlhfSignals, jiraSignals, testSignals] = await Promise.all([
      collectRlhfSignals(48),      // Last 48 hours
      collectJiraSignals(7),        // Last 7 days
      collectTestFailureSignals(7)  // Last 7 days
    ]);

    // Generate topics
    let topics = generateTopicsFromSignals(rlhfSignals, jiraSignals, testSignals);

    // If no topics, use defaults
    if (topics.length === 0) {
      console.log("[Zeitgeist] No signals found, using defaults");
      const defaultCache = getDefaultCache();
      await saveToCache(defaultCache);
      return {
        success: true,
        cache: defaultCache,
        topicsAnalyzed: 0,
        topicsWithAnswers: 0,
        sourceBreakdown: { rlhf: 0, jira: 0, test: 0 },
        topQuestions: defaultCache.suggestions,
        duration: Date.now() - startTime
      };
    }

    // KB Validation - verify we have good answers for each topic
    topics = await validateKBCoverage(topics);

    // Recalculate scores with confidence factor and re-sort
    topics = topics.map(t => ({
      ...t,
      rawScore: recalculateScoreWithConfidence(t)
    }));
    topics.sort((a, b) => b.rawScore - a.rawScore);

    // Apply trend calculation based on previous scores (Task 7)
    topics = applyTrends(topics, previousScores);
    console.log(`[Zeitgeist] Trend calculation applied: ${topics.filter(t => t.trend === 'rising').length} rising, ${topics.filter(t => t.trend === 'falling').length} falling`);

    // Chat suggestions: ONLY topics where KB can answer well
    // RLHF signals (negative feedback) stay in allTopics for manager dashboard
    // but should NOT appear as chat suggestions - we don't want to suggest
    // questions we're bad at answering
    const topicsWithGoodAnswers = topics.filter(t => t.hasGoodAnswer);

    // Only suggest topics we can answer well - no backfill with bad topics
    const suggestionTopics = topicsWithGoodAnswers.slice(0, 6);

    const validatedCount = topics.filter(t => t.hasGoodAnswer).length;

    // Build score map for next refresh cycle (Task 7)
    const currentScores = buildScoreMap(topics);

    // Build cache
    const cache: ZeitgeistCache = {
      suggestions: suggestionTopics.map(t => t.question),
      allTopics: topics,
      generatedAt: new Date().toISOString(),
      dataRange: '48h',
      version: 1,
      stats: {
        rlhfCount: rlhfSignals.length,
        jiraCount: jiraSignals.length,
        testFailureCount: testSignals.length,
        topicsGenerated: topics.length,
        topicsValidated: validatedCount
      },
      previousScores: currentScores  // Store for next trend calculation
    };

    // Save to cache
    await saveToCache(cache);

    const duration = Date.now() - startTime;
    console.log(`[Zeitgeist] Refresh complete in ${duration}ms`);
    console.log(`[Zeitgeist] Generated ${topics.length} topics, top 6:`);
    cache.suggestions.forEach((s, i) => console.log(`  ${i + 1}. ${s}`));

    return {
      success: true,
      cache,
      topicsAnalyzed: topics.length,
      topicsWithAnswers: validatedCount,
      sourceBreakdown: {
        rlhf: rlhfSignals.length,
        jira: jiraSignals.length,
        test: testSignals.length
      },
      topQuestions: cache.suggestions,
      duration
    };
  } catch (err) {
    console.error("[Zeitgeist] Refresh failed:", err);
    return {
      success: false,
      cache: null,
      error: err instanceof Error ? err.message : 'Unknown error',
      topicsAnalyzed: 0,
      topicsWithAnswers: 0,
      sourceBreakdown: { rlhf: 0, jira: 0, test: 0 },
      topQuestions: [],
      duration: Date.now() - startTime
    };
  }
}

/**
 * Get cache stats for monitoring
 */
export async function getZeitgeistStats(): Promise<ZeitgeistCache['stats'] | null> {
  try {
    const cache = await loadFromCache();
    return cache?.stats || null;
  } catch {
    return null;
  }
}

/**
 * Get comprehensive stats for trending dashboard
 */
export interface ZeitgeistStatsResponse {
  totalTopics: number;
  withGoodAnswers: number;
  lastRefresh: string | null;
  sourceBreakdown: {
    rlhf: number;
    jira: number;
    test: number;
  };
  cacheStatus: 'fresh' | 'stale' | 'empty';
}

export async function getStats(): Promise<ZeitgeistStatsResponse> {
  try {
    const cache = await loadFromCache();

    if (!cache) {
      return {
        totalTopics: 0,
        withGoodAnswers: 0,
        lastRefresh: null,
        sourceBreakdown: { rlhf: 0, jira: 0, test: 0 },
        cacheStatus: 'empty'
      };
    }

    // Calculate cache staleness (12 hour TTL)
    const cacheAge = Date.now() - new Date(cache.generatedAt).getTime();
    const cacheStatus: 'fresh' | 'stale' | 'empty' = cacheAge < CACHE_TTL_MS ? 'fresh' : 'stale';

    return {
      totalTopics: cache.allTopics?.length || 0,
      withGoodAnswers: cache.allTopics?.filter(t => t.hasGoodAnswer).length || 0,
      lastRefresh: cache.generatedAt,
      sourceBreakdown: {
        rlhf: cache.stats?.rlhfCount || 0,
        jira: cache.stats?.jiraCount || 0,
        test: cache.stats?.testFailureCount || 0
      },
      cacheStatus
    };
  } catch (err) {
    console.error("[Zeitgeist] Error getting stats:", err);
    return {
      totalTopics: 0,
      withGoodAnswers: 0,
      lastRefresh: null,
      sourceBreakdown: { rlhf: 0, jira: 0, test: 0 },
      cacheStatus: 'empty'
    };
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

class ZeitgeistServiceClass {
  private static instance: ZeitgeistServiceClass;

  private constructor() {}

  static getInstance(): ZeitgeistServiceClass {
    if (!ZeitgeistServiceClass.instance) {
      ZeitgeistServiceClass.instance = new ZeitgeistServiceClass();
    }
    return ZeitgeistServiceClass.instance;
  }

  getSuggestions = getSuggestions;
  getTrendingTopics = getTrendingTopics;
  refresh = refreshZeitgeist;
  getStats = getZeitgeistStats;
}

export const zeitgeistService = ZeitgeistServiceClass.getInstance();
