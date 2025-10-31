/**
 * Result Merger Service
 * Intelligently combines and deduplicates results from multiple vector stores
 * (Supabase pgvector and OpenAI Assistant)
 */

import { VectorSearchResult } from "../lib/supabase";

export interface UnifiedResult {
  content: string;
  source_type: string;
  source_id: string;
  similarity: number;
  source: 'supabase' | 'openai';
  metadata: Record<string, any>;
  created_at?: string;
  url?: string;
}

export interface MergeOptions {
  maxResults?: number;
  dedupeThreshold?: number; // Similarity threshold for considering two results as duplicates
  balanceSources?: boolean; // Ensure balanced representation from both sources
  minSupabaseResults?: number; // Minimum results from Supabase if available
  minOpenAIResults?: number; // Minimum results from OpenAI if available
}

export class ResultMerger {
  /**
   * Merge results from Supabase and OpenAI sources
   * - Converts both to unified format
   * - Ranks by similarity score
   * - Deduplicates similar content
   * - Ensures balanced source representation
   */
  mergeResults(
    supabaseResults: VectorSearchResult[],
    openaiResults: any[],
    options: MergeOptions = {}
  ): UnifiedResult[] {
    const {
      maxResults = 10,
      dedupeThreshold = 0.85, // If two results are 85%+ similar in content, consider them duplicates
      balanceSources = true,
      minSupabaseResults = 2,
      minOpenAIResults = 2
    } = options;

    // Convert both sources to unified format
    const supabaseUnified = this.convertSupabaseResults(supabaseResults);
    const openaiUnified = this.convertOpenAIResults(openaiResults);

    console.log(`📊 ResultMerger: ${supabaseUnified.length} Supabase + ${openaiUnified.length} OpenAI results`);

    // Combine all results
    const allResults = [...supabaseUnified, ...openaiUnified];
    
    if (supabaseUnified.length > 0) {
      console.log(`🔍 After spread: supabaseUnified[0] content length: ${supabaseUnified[0]?.content?.length || 0}`);
      console.log(`🔍 After spread: allResults[0] content length: ${allResults[0]?.content?.length || 0}`);
    }

    if (allResults.length === 0) {
      console.log('⚠️ ResultMerger: No results to merge');
      return [];
    }

    // Sort by similarity score (highest first)
    allResults.sort((a, b) => (b.similarity || 0) - (a.similarity || 0));
    
    if (allResults.length > 0) {
      console.log(`🔍 After sort: allResults[0] content length: ${allResults[0]?.content?.length || 0}`);
    }

    // Deduplicate based on content similarity
    const deduped = this.deduplicateResults(allResults, dedupeThreshold);
    console.log(`🔄 ResultMerger: Deduplicated ${allResults.length} → ${deduped.length} results`);
    if (deduped.length > 0) {
      console.log(`🔍 After dedupe: First result content length: ${deduped[0]?.content?.length || 0}`);
    }

    // Balance source representation if requested
    let balanced = deduped;
    if (balanceSources && supabaseUnified.length > 0 && openaiUnified.length > 0) {
      balanced = this.balanceSourceRepresentation(
        deduped,
        maxResults,
        minSupabaseResults,
        minOpenAIResults
      );
      console.log(`⚖️ ResultMerger: Balanced to ${balanced.length} results`);
      if (balanced.length > 0) {
        console.log(`🔍 After balance: First result content length: ${balanced[0]?.content?.length || 0}`);
      }
    }

    // Return top N results
    const final = balanced.slice(0, maxResults);
    
    console.log(`✅ ResultMerger: Returning ${final.length} merged results`);
    console.log(`   Sources: ${final.filter(r => r.source === 'supabase').length} Supabase, ${final.filter(r => r.source === 'openai').length} OpenAI`);
    if (final.length > 0) {
      console.log(`🔍 Final[0] content length: ${final[0]?.content?.length || 0}`);
    }
    
    return final;
  }

  /**
   * Convert Supabase vector search results to unified format
   */
  private convertSupabaseResults(results: VectorSearchResult[]): UnifiedResult[] {
    const converted = results.map(r => ({
      content: r.content || '',
      source_type: r.source_type || 'unknown',
      source_id: r.source_id || '',
      similarity: r.similarity || 0,
      source: 'supabase' as const,
      metadata: r.metadata || {},
      created_at: r.created_at,
      url: r.url
    }));
    
    if (converted.length > 0) {
      console.log(`🔍 convertSupabaseResults: First result has ${converted[0].content?.length || 0} chars`);
    }
    
    return converted;
  }

  /**
   * Convert OpenAI Assistant results to unified format
   */
  private convertOpenAIResults(results: any[]): UnifiedResult[] {
    if (!Array.isArray(results)) {
      console.warn('⚠️ ResultMerger: OpenAI results is not an array:', typeof results);
      return [];
    }

    const converted = results
      .filter(r => r && typeof r === 'object')
      .map(r => ({
        content: r.content || r.text || r.response || '',
        source_type: r.source_type || r.type || 'knowledge',
        source_id: r.source_id || r.id || r.file_id || 'openai',
        similarity: r.similarity || r.score || r.confidence || 0.8, // Default to 0.8 if no score
        source: 'openai' as const,
        metadata: {
          ...r.metadata,
          title: r.title || r.metadata?.title,
          source: r.source || r.metadata?.source
        },
        created_at: r.created_at || r.timestamp,
        url: r.url || r.metadata?.url
      }))
      .filter(r => r.content && r.content.trim().length > 0); // Remove results with no content
    
    if (converted.length > 0) {
      console.log(`🔍 convertOpenAIResults: First result has ${converted[0].content?.length || 0} chars, similarity ${converted[0].similarity}`);
    }
    
    return converted;
  }

  /**
   * Deduplicate results based on content similarity
   * Uses simple character overlap ratio for efficiency
   */
  private deduplicateResults(
    results: UnifiedResult[],
    threshold: number
  ): UnifiedResult[] {
    const deduplicated: UnifiedResult[] = [];
    
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      
      if (i === 0) {
        console.log(`🔍 Dedupe input[0] content length: ${result?.content?.length || 0}`);
      }
      
      // Check if this result is too similar to any already-selected result
      const isDuplicate = deduplicated.some(existing => {
        const similarity = this.calculateContentSimilarity(
          result.content,
          existing.content
        );
        return similarity >= threshold;
      });

      if (!isDuplicate) {
        deduplicated.push(result);
        if (deduplicated.length === 1) {
          console.log(`🔍 Dedupe: Pushed first result, content length: ${result?.content?.length || 0}`);
        }
      } else {
        console.log(`🔄 Skipping duplicate result (${result.similarity?.toFixed(2)} similarity)`);
      }
    }

    return deduplicated;
  }

  /**
   * Calculate simple content similarity ratio (0-1)
   * Uses character overlap for efficiency
   */
  private calculateContentSimilarity(content1: string, content2: string): number {
    if (!content1 || !content2) return 0;

    // Normalize: lowercase and remove extra whitespace
    const norm1 = content1.toLowerCase().replace(/\s+/g, ' ').trim();
    const norm2 = content2.toLowerCase().replace(/\s+/g, ' ').trim();

    if (norm1 === norm2) return 1;

    // Simple character overlap ratio
    const shorter = norm1.length < norm2.length ? norm1 : norm2;
    const longer = norm1.length >= norm2.length ? norm1 : norm2;

    // Check if shorter string is substring of longer
    if (longer.includes(shorter)) {
      return shorter.length / longer.length;
    }

    // Count matching character positions (simple but effective)
    const minLength = Math.min(norm1.length, norm2.length);
    let matches = 0;
    for (let i = 0; i < minLength; i++) {
      if (norm1[i] === norm2[i]) matches++;
    }

    return matches / Math.max(norm1.length, norm2.length);
  }

  /**
   * Ensure balanced representation from both sources
   * Prioritizes highest similarity scores while maintaining source diversity
   */
  private balanceSourceRepresentation(
    results: UnifiedResult[],
    maxResults: number,
    minSupabase: number,
    minOpenAI: number
  ): UnifiedResult[] {
    const supabaseResults = results.filter(r => r.source === 'supabase');
    const openaiResults = results.filter(r => r.source === 'openai');

    console.log(`⚖️ Balancing: ${supabaseResults.length} Supabase, ${openaiResults.length} OpenAI`);

    // If we have enough of both, interleave them
    if (supabaseResults.length >= minSupabase && openaiResults.length >= minOpenAI) {
      return this.interleaveResults(supabaseResults, openaiResults, maxResults);
    }

    // If one source is missing or insufficient, just return top N by similarity
    if (supabaseResults.length < minSupabase || openaiResults.length < minOpenAI) {
      console.log('⚠️ Insufficient results from one source, using similarity-based ranking');
      return results.slice(0, maxResults);
    }

    // Default: return top results sorted by similarity
    return results.slice(0, maxResults);
  }

  /**
   * Interleave results from two sources to ensure diversity
   * Alternates between sources while respecting similarity scores
   */
  private interleaveResults(
    source1: UnifiedResult[],
    source2: UnifiedResult[],
    maxResults: number
  ): UnifiedResult[] {
    const interleaved: UnifiedResult[] = [];
    let i1 = 0;
    let i2 = 0;

    while (interleaved.length < maxResults && (i1 < source1.length || i2 < source2.length)) {
      // Add from source1
      if (i1 < source1.length) {
        interleaved.push(source1[i1]);
        i1++;
      }

      // Add from source2 (if we still have room)
      if (interleaved.length < maxResults && i2 < source2.length) {
        interleaved.push(source2[i2]);
        i2++;
      }
    }

    return interleaved;
  }

  /**
   * Format merged results for display/logging
   */
  formatResults(results: UnifiedResult[]): string {
    return results
      .map((r, i) => {
        const sourceIcon = r.source === 'supabase' ? '📊' : '🤖';
        const simPercent = ((r.similarity || 0) * 100).toFixed(1);
        return `${i + 1}. ${sourceIcon} [${r.source_type}] (${simPercent}% match)\n   ${r.content.substring(0, 150)}...`;
      })
      .join('\n\n');
  }
}

// Singleton instance
let instance: ResultMerger | null = null;

export function getResultMerger(): ResultMerger {
  if (!instance) {
    instance = new ResultMerger();
  }
  return instance;
}

export default ResultMerger;

