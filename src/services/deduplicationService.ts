/**
 * SIAM Deduplication Service for Multi-Tenant Vector Store
 *
 * CRITICAL DISTINCTION:
 * - SIAM = Our app (this testing/knowledge platform)
 * - AOMA/Alexandria/etc = Apps under test
 *
 * Deduplication operates WITHIN each tenant context (organization/division/app_under_test).
 * Duplicates are checked per tenant, not globally.
 *
 * Handles:
 * - Content hash deduplication
 * - Semantic similarity deduplication
 * - URL normalization
 * - Cross-source deduplication (within tenant)
 */

import crypto from "crypto";
import { supabase, DEFAULT_APP_CONTEXT } from "@/lib/supabase";
// import { openai } from "@ai-sdk/openai";
// import { embed } from "ai";

export interface DedupConfig {
  // Content hash threshold (0 = exact match only)
  contentHashMatch?: boolean;

  // Semantic similarity threshold (0-1, default 0.95 = 95% similar)
  semanticThreshold?: number;

  // Check across all source types or just within same source
  crossSource?: boolean;

  // URL normalization (removes query params, trailing slashes)
  normalizeUrls?: boolean;
}

export interface DedupResult {
  isDuplicate: boolean;
  existingId?: string;
  existingSourceType?: string;
  existingSourceId?: string;
  matchType?: "exact_hash" | "semantic" | "url" | "source_id";
  similarity?: number;
  shouldUpdate?: boolean; // If content is newer/better
}

export class DeduplicationService {
  /**
   * Check if content is a duplicate before inserting (within tenant context)
   * Deduplication is scoped to organization/division/app_under_test
   */
  async checkDuplicate(
    content: string,
    sourceType: string,
    sourceId: string,
    options: {
      organization: string;
      division: string;
      app_under_test: string;
      url?: string;
      embedding?: number[];
      config?: DedupConfig;
    }
  ): Promise<DedupResult> {
    const { organization, division, app_under_test, url, embedding, config = {} } = options;
    
    const {
      contentHashMatch = true,
      semanticThreshold = 0.95,
      crossSource = false,
      normalizeUrls = true,
    } = config;

    console.log(`🔍 Checking duplicates in: ${organization}/${division}/${app_under_test}`);

    // 1. Check source_id first (fastest check)
    const sourceIdCheck = await this.checkBySourceId(
      sourceType,
      sourceId,
      organization,
      division,
      app_under_test
    );
    if (sourceIdCheck.isDuplicate) {
      return {
        ...sourceIdCheck,
        shouldUpdate: true, // Source ID match means we should UPDATE
      };
    }

    // 2. Check content hash (very fast)
    if (contentHashMatch) {
      const contentHash = this.generateContentHash(content);
      const hashCheck = await this.checkByContentHash(
        contentHash,
        organization,
        division,
        app_under_test,
        crossSource ? undefined : sourceType
      );
      if (hashCheck.isDuplicate) {
        return hashCheck;
      }
    }

    // 3. Check URL if provided (fast)
    if (url && normalizeUrls) {
      const normalizedUrl = this.normalizeUrl(url);
      const urlCheck = await this.checkByUrl(
        normalizedUrl,
        organization,
        division,
        app_under_test,
        crossSource ? undefined : sourceType
      );
      if (urlCheck.isDuplicate) {
        return urlCheck;
      }
    }

    // 4. Check semantic similarity (slower, only if embedding provided)
    if (embedding && semanticThreshold) {
      const semanticCheck = await this.checkBySemantic(
        embedding,
        semanticThreshold,
        organization,
        division,
        app_under_test,
        crossSource ? undefined : sourceType
      );
      if (semanticCheck.isDuplicate) {
        return semanticCheck;
      }
    }

    // Not a duplicate
    return { isDuplicate: false };
  }

  /**
   * Check by source_type + source_id (UNIQUE constraint check within tenant)
   */
  private async checkBySourceId(
    sourceType: string,
    sourceId: string,
    organization: string,
    division: string,
    app_under_test: string
  ): Promise<DedupResult> {
    try {
      const { data, error } = await supabase
        .from("siam_vectors")
        .select("id, source_type, source_id, created_at")
        .eq("organization", organization)
        .eq("division", division)
        .eq("app_under_test", app_under_test)
        .eq("source_type", sourceType)
        .eq("source_id", sourceId)
        .single();

      if (error || !data) {
        return { isDuplicate: false };
      }

      return {
        isDuplicate: true,
        existingId: data.id,
        existingSourceType: data.source_type,
        existingSourceId: data.source_id,
        matchType: "source_id",
      };
    } catch {
      return { isDuplicate: false };
    }
  }

  /**
   * Check by content hash (within tenant)
   */
  private async checkByContentHash(
    contentHash: string,
    organization: string,
    division: string,
    app_under_test: string,
    sourceType?: string
  ): Promise<DedupResult> {
    try {
      let query = supabase
        .from("siam_vectors")
        .select("id, source_type, source_id, metadata")
        .eq("organization", organization)
        .eq("division", division)
        .eq("app_under_test", app_under_test)
        .eq("metadata->>content_hash", contentHash);

      if (sourceType) {
        query = query.eq("source_type", sourceType);
      }

      const { data, error } = await query.limit(1).single();

      if (error || !data) {
        return { isDuplicate: false };
      }

      return {
        isDuplicate: true,
        existingId: data.id,
        existingSourceType: data.source_type,
        existingSourceId: data.source_id,
        matchType: "exact_hash",
      };
    } catch {
      return { isDuplicate: false };
    }
  }

  /**
   * Check by normalized URL (within tenant)
   */
  private async checkByUrl(
    normalizedUrl: string,
    organization: string,
    division: string,
    app_under_test: string,
    sourceType?: string
  ): Promise<DedupResult> {
    try {
      let query = supabase
        .from("siam_vectors")
        .select("id, source_type, source_id, metadata")
        .eq("organization", organization)
        .eq("division", division)
        .eq("app_under_test", app_under_test)
        .eq("metadata->>url", normalizedUrl);

      if (sourceType) {
        query = query.eq("source_type", sourceType);
      }

      const { data, error } = await query.limit(1).single();

      if (error || !data) {
        return { isDuplicate: false };
      }

      return {
        isDuplicate: true,
        existingId: data.id,
        existingSourceType: data.source_type,
        existingSourceId: data.source_id,
        matchType: "url",
      };
    } catch {
      return { isDuplicate: false };
    }
  }

  /**
   * Check by semantic similarity using vector search (within tenant)
   */
  private async checkBySemantic(
    embedding: number[],
    threshold: number,
    organization: string,
    division: string,
    app_under_test: string,
    sourceType?: string
  ): Promise<DedupResult> {
    try {
      const { data, error } = await supabase.rpc("match_siam_vectors", {
        p_organization: organization,
        p_division: division,
        p_app_under_test: app_under_test,
        query_embedding: embedding,
        match_threshold: threshold,
        match_count: 1,
        filter_source_types: sourceType ? [sourceType] : null,
      });

      if (error || !data || data.length === 0) {
        return { isDuplicate: false };
      }

      const match = data[0];

      return {
        isDuplicate: true,
        existingId: match.id,
        existingSourceType: match.source_type,
        existingSourceId: match.source_id,
        matchType: "semantic",
        similarity: match.similarity,
      };
    } catch {
      return { isDuplicate: false };
    }
  }

  /**
   * Generate MD5 content hash
   */
  generateContentHash(content: string): string {
    return crypto.createHash("md5").update(content.trim()).digest("hex");
  }

  /**
   * Normalize URL for comparison
   */
  normalizeUrl(url: string): string {
    try {
      const parsed = new URL(url);
      // Remove query params and hash
      parsed.search = "";
      parsed.hash = "";
      // Remove trailing slash
      let pathname = parsed.pathname;
      if (pathname.endsWith("/") && pathname.length > 1) {
        pathname = pathname.slice(0, -1);
      }
      parsed.pathname = pathname;
      return parsed.toString();
    } catch {
      // If URL parsing fails, just normalize string
      return url
        .toLowerCase()
        .replace(/[?#].*$/, "")
        .replace(/\/$/, "");
    }
  }

  /**
   * Batch deduplication check for existing vectors (within tenant)
   * Returns IDs of duplicates to remove
   */
  async findDuplicatesInDatabase(
    options: {
      organization: string;
      division: string;
      app_under_test: string;
      sourceType?: string;
      semanticThreshold?: number;
      keepNewest?: boolean;
    }
  ): Promise<{
    duplicates: Array<{
      keepId: string;
      removeIds: string[];
      reason: string;
    }>;
    totalDuplicates: number;
  }> {
    const { organization, division, app_under_test, sourceType, semanticThreshold = 0.95, keepNewest = true } = options;

    console.log(`🔍 Finding duplicates in: ${organization}/${division}/${app_under_test}`);

    const duplicates: Array<{
      keepId: string;
      removeIds: string[];
      reason: string;
    }> = [];

    // Get all vectors within tenant
    let query = supabase
      .from("siam_vectors")
      .select("id, content, source_type, source_id, metadata, created_at, embedding")
      .eq("organization", organization)
      .eq("division", division)
      .eq("app_under_test", app_under_test);

    if (sourceType) {
      query = query.eq("source_type", sourceType);
    }

    const { data: vectors, error } = await query;

    if (error || !vectors) {
      return { duplicates: [], totalDuplicates: 0 };
    }

    // Group by content hash
    const hashGroups = new Map<string, typeof vectors>();
    vectors.forEach((vector) => {
      const hash = this.generateContentHash(vector.content);
      if (!hashGroups.has(hash)) {
        hashGroups.set(hash, []);
      }
      hashGroups.get(hash)!.push(vector);
    });

    // Find duplicates within each hash group
    hashGroups.forEach((group) => {
      if (group.length > 1) {
        // Sort by created_at
        const sorted = group.sort(
          (a, b) =>
            new Date(keepNewest ? b.created_at : a.created_at).getTime() -
            new Date(keepNewest ? a.created_at : b.created_at).getTime()
        );

        duplicates.push({
          keepId: sorted[0].id,
          removeIds: sorted.slice(1).map((v) => v.id),
          reason: "exact_content_match",
        });
      }
    });

    const totalDuplicates = duplicates.reduce((sum, dup) => sum + dup.removeIds.length, 0);

    return { duplicates, totalDuplicates };
  }

  /**
   * Remove duplicates from database
   */
  async removeDuplicates(duplicateIds: string[]): Promise<{ removed: number; errors: number }> {
    let removed = 0;
    let errors = 0;

    console.log(`🗑️  Removing ${duplicateIds.length} duplicates...`);

    // Delete in batches of 100
    for (let i = 0; i < duplicateIds.length; i += 100) {
      const batch = duplicateIds.slice(i, i + 100);

      const { error } = await supabase.from("siam_vectors").delete().in("id", batch);

      if (error) {
        errors += batch.length;
        console.error("Failed to delete batch:", error);
      } else {
        removed += batch.length;
      }
    }

    return { removed, errors };
  }
}

// Singleton instance
let instance: DeduplicationService | null = null;

export function getDeduplicationService(): DeduplicationService {
  if (!instance) {
    instance = new DeduplicationService();
  }
  return instance;
}

export default DeduplicationService;
