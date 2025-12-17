/**
 * Intent Classifier Service
 * 
 * Uses Gemini Flash to intelligently route queries to relevant data sources
 * BEFORE hitting the vector store. This prevents noise from irrelevant tables
 * and dramatically improves response quality.
 * 
 * Part of RAG Pipeline Optimization - Stage 1
 * 
 * Problem Solved:
 * - Fan-out to all tables introduces noise
 * - Vector similarity scores aren't calibrated across source types
 * - More data = more noise = worse responses
 * 
 * Solution:
 * - Classify query intent with fast LLM call (~50-100ms)
 * - Only query relevant source types
 * - Reduce candidates from 200+ to 50-100 focused results
 */

import { generateObject } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { z } from 'zod/v3';

// Source types available in siam_vectors table
export const SOURCE_TYPES = [
  'knowledge',    // AOMA technical docs, architecture, specs
  'jira',         // Tickets, bugs, features, sprint status
  'git',          // SOURCE CODE files (Angular components, services, modules) + commits, PRs
  'email',        // Outlook communications, stakeholder messages
  'firecrawl',    // Web-crawled documentation
  'metrics',      // System metrics, performance data
] as const;

export type SourceType = typeof SOURCE_TYPES[number];

// Query type classification
export const QUERY_TYPES = [
  'technical',      // Architecture, code, implementation details
  'status',         // Project status, ticket updates, sprint progress
  'communication',  // Stakeholder info, decisions, meeting notes
  'procedural',     // How-to, workflows, processes
  'troubleshooting', // Errors, bugs, debugging
  'general',        // General questions, unclear intent
] as const;

export type QueryType = typeof QUERY_TYPES[number];

// Intent classification result
export const IntentSchema = z.object({
  relevantSources: z.array(z.enum(SOURCE_TYPES))
    .describe('Data sources relevant to answering this query. Order by relevance.'),
  queryType: z.enum(QUERY_TYPES)
    .describe('The type of query being asked'),
  confidence: z.number().min(0).max(1)
    .describe('Confidence in this classification (0-1)'),
  reasoning: z.string()
    .describe('Brief explanation of why these sources were selected'),
  suggestedKeywords: z.array(z.string()).optional()
    .describe('Keywords to boost in vector search'),
});

export type IntentClassification = z.infer<typeof IntentSchema>;

// Mapping of query types to likely source types (used as hints)
const QUERY_TYPE_SOURCE_HINTS: Record<QueryType, SourceType[]> = {
  technical: ['knowledge', 'firecrawl', 'git'],
  status: ['jira', 'email'],
  communication: ['email', 'jira'],
  procedural: ['knowledge', 'firecrawl'],
  troubleshooting: ['jira', 'knowledge', 'git'],
  general: ['knowledge', 'jira', 'firecrawl'],
};

// Cache for repeated queries (in-memory, short TTL)
const classificationCache = new Map<string, { result: IntentClassification; timestamp: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Classify query intent and determine relevant data sources
 * 
 * @param query - The user's question
 * @param options - Optional configuration
 * @returns Intent classification with relevant sources
 */
export async function classifyIntent(
  query: string,
  options: {
    skipCache?: boolean;
    fallbackSources?: SourceType[];
  } = {}
): Promise<IntentClassification> {
  const startTime = performance.now();
  const cacheKey = query.toLowerCase().trim();
  
  // Check cache first
  if (!options.skipCache) {
    const cached = classificationCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL_MS) {
      console.log(`🎯 [Intent] Cache hit (${(performance.now() - startTime).toFixed(0)}ms)`);
      return cached.result;
    }
  }

  try {
    // Initialize Gemini provider
    const google = createGoogleGenerativeAI({
      apiKey: process.env.GOOGLE_API_KEY!,
    });

    const { object } = await generateObject({
      model: google('gemini-2.0-flash'),
      schema: IntentSchema,
      prompt: buildClassificationPrompt(query),
      temperature: 0.1, // Low temperature for consistent classification
    });

    const result = object as IntentClassification;
    
    // Validate result has at least one source
    if (!result.relevantSources || result.relevantSources.length === 0) {
      console.warn('[Intent] No sources returned, using fallback');
      result.relevantSources = options.fallbackSources || ['knowledge', 'jira'];
    }

    // Cache the result
    classificationCache.set(cacheKey, { result, timestamp: Date.now() });

    const duration = performance.now() - startTime;
    console.log(`🎯 [Intent] Classified in ${duration.toFixed(0)}ms:`, {
      queryType: result.queryType,
      sources: result.relevantSources,
      confidence: (result.confidence * 100).toFixed(0) + '%',
    });

    return result;

  } catch (error) {
    console.error('[Intent] Classification failed:', error);
    
    // Fallback to heuristic classification
    return heuristicClassify(query, options.fallbackSources);
  }
}

/**
 * Build the classification prompt
 */
function buildClassificationPrompt(query: string): string {
  return `You are a query router for an enterprise knowledge base. Analyze the user's query and determine which data sources are most relevant for answering it.

**Available Data Sources:**
- **knowledge**: Technical documentation, architecture specs, system requirements, API docs, user guides
- **jira**: Tickets, bugs, feature requests, sprint status, project tracking, issues
- **git**: ACTUAL SOURCE CODE (Angular components, services, modules, TypeScript files), plus commits and pull requests. Use this when the user asks about implementation details, where something is in the code, or how a feature works technically.
- **email**: Stakeholder communications, meeting notes, decisions, announcements
- **firecrawl**: Web-crawled documentation from external sources
- **metrics**: System performance data, usage statistics, monitoring data

**User Query:**
"${query}"

**Instructions:**
1. Identify the PRIMARY intent of the query
2. Select ONLY sources that would meaningfully contribute (1-3 sources typically)
3. Order sources by relevance (most relevant first)
4. If the query is clearly about project status → prioritize jira, email
5. If the query is about how something works → prioritize knowledge, then git for implementation details
6. If the query mentions specific tickets or bugs → include jira
7. If the query asks about code, implementation, "where in the code", or technical details → INCLUDE git (contains actual source code)
8. If answering requires understanding how something is actually built → include git as supporting context
9. NEVER include all sources - that defeats the purpose of routing
10. Be conservative - fewer relevant sources is better than many marginally relevant ones

Provide your classification:`;
}

/**
 * Fallback heuristic classification when LLM fails
 */
function heuristicClassify(
  query: string,
  fallbackSources?: SourceType[]
): IntentClassification {
  const q = query.toLowerCase();
  
  // Keyword-based detection
  const detected: SourceType[] = [];
  
  // Status/project management keywords
  if (/\b(status|sprint|ticket|bug|issue|jira|backlog|epic|story)\b/.test(q)) {
    detected.push('jira');
  }
  
  // Technical/documentation keywords
  if (/\b(how|what is|architecture|api|endpoint|function|component|documentation|docs)\b/.test(q)) {
    detected.push('knowledge', 'firecrawl');
  }
  
  // Code-related keywords (now includes actual source code)
  if (/\b(code|commit|pr|pull request|merge|git|branch|implementation|component|service|module|typescript|angular|function|class|method|where.*code|in the code)\b/.test(q)) {
    detected.push('git');
  }
  
  // Communication keywords
  if (/\b(email|meeting|stakeholder|decision|announced|communicated)\b/.test(q)) {
    detected.push('email');
  }
  
  // Metrics keywords
  if (/\b(metric|performance|usage|monitoring|dashboard|analytics)\b/.test(q)) {
    detected.push('metrics');
  }
  
  // Default if nothing detected
  const relevantSources = detected.length > 0 
    ? [...new Set(detected)] as SourceType[]
    : (fallbackSources || ['knowledge', 'jira']);
  
  // Determine query type
  let queryType: QueryType = 'general';
  if (/\b(status|progress|sprint)\b/.test(q)) queryType = 'status';
  else if (/\b(how|what|where|architecture)\b/.test(q)) queryType = 'technical';
  else if (/\b(error|bug|issue|fix|debug)\b/.test(q)) queryType = 'troubleshooting';
  else if (/\b(process|workflow|steps)\b/.test(q)) queryType = 'procedural';
  
  console.log(`🎯 [Intent] Heuristic fallback: ${relevantSources.join(', ')}`);
  
  return {
    relevantSources,
    queryType,
    confidence: 0.5, // Lower confidence for heuristic
    reasoning: 'Fallback heuristic classification based on keywords',
  };
}

/**
 * Get source type descriptions for logging/debugging
 */
export function describeSourceType(source: SourceType): string {
  const descriptions: Record<SourceType, string> = {
    knowledge: 'Technical docs & architecture',
    jira: 'Tickets & project tracking',
    git: 'Source code (Angular), commits & PRs',
    email: 'Communications & decisions',
    firecrawl: 'External documentation',
    metrics: 'Performance data',
  };
  return descriptions[source] || source;
}

/**
 * Clear the classification cache (for testing)
 */
export function clearIntentCache(): void {
  classificationCache.clear();
  console.log('[Intent] Cache cleared');
}

/**
 * Get cache statistics
 */
export function getIntentCacheStats(): { size: number; oldestMs: number | null } {
  let oldest: number | null = null;
  classificationCache.forEach((entry) => {
    if (oldest === null || entry.timestamp < oldest) {
      oldest = entry.timestamp;
    }
  });
  return {
    size: classificationCache.size,
    oldestMs: oldest ? Date.now() - oldest : null,
  };
}

// Export the hints for testing
export { QUERY_TYPE_SOURCE_HINTS };

