/**
 * Trace Statistics Module
 *
 * Extracts quality metrics from trace data:
 * - Similarity scores for retriever traces
 * - Citation usage from response metadata
 * - Conversation depth and session metrics
 */

export interface SimilarityStats {
  avg: number | null;
  min: number | null;
  max: number | null;
  count: number;
  lowSimilarityCount: number; // < 0.7
}

export interface CitationStats {
  totalCitations: number;
  responsesWithCitations: number;
  totalResponses: number;
  avgCitationsPerResponse: number;
}

export interface ConversationStats {
  totalSessions: number;
  totalMessages: number;
  avgMessagesPerSession: number;
}

/**
 * Extract similarity score statistics from retriever traces
 */
export function calculateSimilarityStats(traces: any[]): SimilarityStats {
  const scores: number[] = [];

  for (const trace of traces) {
    if (trace.runType === "retriever" && trace.metadata?.similarityScores) {
      const traceScores = trace.metadata.similarityScores.filter((s: any) => s != null);
      scores.push(...traceScores);
    }
  }

  if (scores.length === 0) {
    return {
      avg: null,
      min: null,
      max: null,
      count: 0,
      lowSimilarityCount: 0,
    };
  }

  const avg = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  const min = Math.min(...scores);
  const max = Math.max(...scores);
  const lowSimilarityCount = scores.filter(s => s < 0.7).length;

  return {
    avg,
    min,
    max,
    count: scores.length,
    lowSimilarityCount,
  };
}

/**
 * Extract citation usage statistics from LLM traces
 *
 * Citations can be in:
 * - outputs.citations (array of citation objects)
 * - outputs.text or outputs.content (count <citation> tags or [n] markers)
 */
export function calculateCitationStats(traces: any[]): CitationStats {
  let totalCitations = 0;
  let responsesWithCitations = 0;
  let totalResponses = 0;

  for (const trace of traces) {
    if (trace.runType !== "llm" || !trace.outputs) {
      continue;
    }

    totalResponses++;
    let citationCount = 0;

    // Check for explicit citations array
    if (trace.outputs.citations && Array.isArray(trace.outputs.citations)) {
      citationCount = trace.outputs.citations.length;
    } else {
      // Count citation markers in text
      const text = trace.outputs.text || trace.outputs.content || "";
      if (typeof text === "string") {
        // Count [n] style citations
        const bracketCitations = (text.match(/\[\d+\]/g) || []).length;
        // Count <citation> tags
        const tagCitations = (text.match(/<citation[^>]*>/g) || []).length;
        citationCount = Math.max(bracketCitations, tagCitations);
      }
    }

    totalCitations += citationCount;
    if (citationCount > 0) {
      responsesWithCitations++;
    }
  }

  const avgCitationsPerResponse = totalResponses > 0
    ? totalCitations / totalResponses
    : 0;

  return {
    totalCitations,
    responsesWithCitations,
    totalResponses,
    avgCitationsPerResponse,
  };
}

/**
 * Calculate conversation depth metrics
 *
 * Sessions are identified by unique session IDs in trace metadata.
 * Messages are counted from trace metadata or inferred from trace count.
 */
export function calculateConversationStats(traces: any[]): ConversationStats {
  const sessionMap = new Map<string, number>();

  for (const trace of traces) {
    // Extract session ID from metadata
    const sessionId =
      trace.metadata?.sessionId ||
      trace.metadata?.session_id ||
      trace.metadata?.conversationId ||
      "unknown";

    // Increment message count for this session
    const currentCount = sessionMap.get(sessionId) || 0;
    sessionMap.set(sessionId, currentCount + 1);
  }

  const totalSessions = sessionMap.size;
  const totalMessages = Array.from(sessionMap.values()).reduce((sum, count) => sum + count, 0);
  const avgMessagesPerSession = totalSessions > 0
    ? totalMessages / totalSessions
    : 0;

  return {
    totalSessions,
    totalMessages,
    avgMessagesPerSession,
  };
}

/**
 * Get all quality statistics from traces
 */
export function getQualityStatistics(traces: any[]): {
  similarity: SimilarityStats;
  citations: CitationStats;
  conversations: ConversationStats;
} {
  return {
    similarity: calculateSimilarityStats(traces),
    citations: calculateCitationStats(traces),
    conversations: calculateConversationStats(traces),
  };
}
