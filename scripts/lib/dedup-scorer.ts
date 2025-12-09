/**
 * Deduplication Scorer Module
 *
 * Scores vectors for deduplication decisions based on:
 * - Recency (30%): Newer content scores higher
 * - Information Density (40%): More content scores higher
 * - Source Authority (30%): Authoritative sources score higher
 *
 * Prevents the "Disneyland effect" - content overweighting in RAG.
 */

export interface VectorRecord {
  id: string;
  content: string;
  source_type: string;
  source_id: string;
  created_at: string | Date;
  updated_at?: string | Date;
  metadata?: {
    title?: string;
    author?: string;
    page_count?: number;
    [key: string]: unknown;
  };
}

export interface ScoredVector {
  vector: VectorRecord;
  score: number;
  breakdown: {
    recency: number;
    density: number;
    authority: number;
  };
}

export interface DeduplicationDecision {
  action: "IMPORT" | "SKIP" | "SUPERSEDE" | "REVIEW";
  reason: string;
  newContent: {
    filename: string;
    score: number;
    breakdown: { recency: number; density: number; authority: number };
  };
  existingMatch?: {
    id: string;
    source_id: string;
    similarity: number;
    score: number;
    breakdown: { recency: number; density: number; authority: number };
  };
}

/**
 * Source authority rankings (0-100)
 * Higher = more authoritative
 */
export const SOURCE_AUTHORITY: Record<string, number> = {
  // Official documentation sources
  pdf: 100,
  "official-doc": 100,

  // Internal knowledge bases
  confluence: 75,
  wiki: 75,
  sharepoint: 70,

  // Crawled/scraped content
  firecrawl: 50,
  crawled: 50,
  "crawled-ui": 50,

  // User-generated content
  jira: 40,
  ticket: 40,
  email: 25,

  // Demo/sample data
  knowledge: 10,
  demo: 10,
  sample: 5,
};

/**
 * Get authority score for a source type (0-1 normalized)
 */
export function getAuthorityScore(sourceType: string): number {
  const normalizedType = sourceType.toLowerCase().replace(/_/g, "-");
  const authority = SOURCE_AUTHORITY[normalizedType] ?? 50; // Default to 50 for unknown
  return authority / 100;
}

/**
 * Calculate recency score (0-1)
 * Based on days since a reference date (2020-01-01)
 */
export function getRecencyScore(date: Date | string): number {
  const referenceDate = new Date("2020-01-01");
  const maxDate = new Date(); // Today
  const targetDate = new Date(date);

  // Days since reference
  const daysSinceRef =
    (targetDate.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24);
  const maxDays =
    (maxDate.getTime() - referenceDate.getTime()) / (1000 * 60 * 60 * 24);

  // Normalize to 0-1
  return Math.max(0, Math.min(1, daysSinceRef / maxDays));
}

/**
 * Calculate information density score (0-1)
 * Based on content length relative to max expected length
 */
export function getDensityScore(
  contentLength: number,
  maxLength: number = 100000
): number {
  // Use log scale to prevent huge documents from dominating
  const logLength = Math.log(contentLength + 1);
  const logMax = Math.log(maxLength + 1);
  return Math.min(1, logLength / logMax);
}

/**
 * Calculate overall deduplication score
 *
 * score = (0.3 * recency) + (0.4 * density) + (0.3 * authority)
 */
export function calculateDedupScore(
  contentLength: number,
  date: Date | string,
  sourceType: string
): { score: number; breakdown: { recency: number; density: number; authority: number } } {
  const recency = getRecencyScore(date);
  const density = getDensityScore(contentLength);
  const authority = getAuthorityScore(sourceType);

  const score = 0.3 * recency + 0.4 * density + 0.3 * authority;

  return {
    score,
    breakdown: { recency, density, authority },
  };
}

/**
 * Score an existing vector record
 */
export function scoreVector(vector: VectorRecord): ScoredVector {
  const date = vector.updated_at || vector.created_at;
  const contentLength = vector.content?.length || 0;

  const { score, breakdown } = calculateDedupScore(
    contentLength,
    date,
    vector.source_type
  );

  return {
    vector,
    score,
    breakdown,
  };
}

/**
 * Compare new content against an existing match and decide action
 *
 * @param newFilename - Filename of new PDF
 * @param newContentLength - Character length of new content
 * @param newDate - Creation/modification date of new content
 * @param existingVector - Existing vector match from database
 * @param similarity - Cosine similarity score (0-1)
 * @param thresholds - Decision thresholds
 */
export function makeDeduplicationDecision(
  newFilename: string,
  newContentLength: number,
  newDate: Date,
  existingVector: VectorRecord | null,
  similarity: number,
  thresholds: {
    similarityThreshold?: number;
    scoreDifferenceThreshold?: number;
  } = {}
): DeduplicationDecision {
  const { similarityThreshold = 0.85, scoreDifferenceThreshold = 0.1 } =
    thresholds;

  // Score new content (PDFs are authoritative)
  const newScoreData = calculateDedupScore(newContentLength, newDate, "pdf");

  // No existing match - definitely import
  if (!existingVector || similarity < similarityThreshold) {
    return {
      action: "IMPORT",
      reason: "No similar content found in existing vectors",
      newContent: {
        filename: newFilename,
        score: newScoreData.score,
        breakdown: newScoreData.breakdown,
      },
    };
  }

  // Score existing vector
  const existingScored = scoreVector(existingVector);

  // Calculate score difference
  const scoreDiff = newScoreData.score - existingScored.score;

  let action: DeduplicationDecision["action"];
  let reason: string;

  if (scoreDiff > scoreDifferenceThreshold) {
    // New content is significantly better
    action = "SUPERSEDE";
    reason = `New content scores higher (${newScoreData.score.toFixed(3)} vs ${existingScored.score.toFixed(3)}). ` +
      `New is ${scoreDiff > 0.2 ? "much " : ""}more recent/dense/authoritative.`;
  } else if (scoreDiff < -scoreDifferenceThreshold) {
    // Existing content is significantly better
    action = "SKIP";
    reason = `Existing content scores higher (${existingScored.score.toFixed(3)} vs ${newScoreData.score.toFixed(3)}). ` +
      `Existing is ${scoreDiff < -0.2 ? "much " : ""}more recent/dense/authoritative.`;
  } else {
    // Too close to call automatically
    action = "REVIEW";
    reason = `Scores are similar (new: ${newScoreData.score.toFixed(3)}, existing: ${existingScored.score.toFixed(3)}). ` +
      `Manual review recommended for similarity ${(similarity * 100).toFixed(1)}%.`;
  }

  return {
    action,
    reason,
    newContent: {
      filename: newFilename,
      score: newScoreData.score,
      breakdown: newScoreData.breakdown,
    },
    existingMatch: {
      id: existingVector.id,
      source_id: existingVector.source_id,
      similarity,
      score: existingScored.score,
      breakdown: existingScored.breakdown,
    },
  };
}

/**
 * Format a decision for human-readable output
 */
export function formatDecision(decision: DeduplicationDecision): string {
  const actionIcon = {
    IMPORT: "[+]",
    SKIP: "[-]",
    SUPERSEDE: "[^]",
    REVIEW: "[?]",
  }[decision.action];

  let output = `${actionIcon} ${decision.action}: ${decision.newContent.filename}\n`;
  output += `    Score: ${decision.newContent.score.toFixed(3)} `;
  output += `(R:${decision.newContent.breakdown.recency.toFixed(2)} `;
  output += `D:${decision.newContent.breakdown.density.toFixed(2)} `;
  output += `A:${decision.newContent.breakdown.authority.toFixed(2)})\n`;

  if (decision.existingMatch) {
    output += `    Match: ${decision.existingMatch.source_id} `;
    output += `(similarity: ${(decision.existingMatch.similarity * 100).toFixed(1)}%)\n`;
    output += `    Existing Score: ${decision.existingMatch.score.toFixed(3)} `;
    output += `(R:${decision.existingMatch.breakdown.recency.toFixed(2)} `;
    output += `D:${decision.existingMatch.breakdown.density.toFixed(2)} `;
    output += `A:${decision.existingMatch.breakdown.authority.toFixed(2)})\n`;
  }

  output += `    Reason: ${decision.reason}`;

  return output;
}
