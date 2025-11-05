/**
 * SIAM Supabase Vector Service
 * 
 * Handles multi-tenant vector operations for SIAM's testing platform.
 * 
 * CRITICAL DISTINCTION:
 * - SIAM = Our app (this testing/knowledge platform)
 * - AOMA/Alexandria/Confluence = Apps under test
 * 
 * This is where the MAGIC happens! ⚡
 */

import {
  supabase as publicSupabase,
  supabaseAdmin,
  SIAMVector,
  VectorSearchResult,
  handleSupabaseError,
} from "../lib/supabase";
import { openai } from "@ai-sdk/openai";
import { embed } from "ai";
import { getGeminiEmbeddingService } from "./geminiEmbeddingService";

export type EmbeddingProvider = "openai" | "gemini";

export class SupabaseVectorService {
  private embeddingProvider: EmbeddingProvider;
  
  constructor(embeddingProvider: EmbeddingProvider = "gemini") {
    this.embeddingProvider = embeddingProvider;
  }

  /**
   * Generate embeddings using configured provider (Gemini by default)
   * - OpenAI: text-embedding-3-small (1536 dimensions)
   * - Gemini: text-embedding-004 (768 dimensions)
   */
  async generateEmbedding(text: string): Promise<number[]> {
    if (this.embeddingProvider === "gemini") {
      const geminiService = getGeminiEmbeddingService();
      return await geminiService.generateEmbedding(text);
    } else {
      // Fallback to OpenAI
      try {
        const { embedding } = await embed({
          model: openai.embedding("text-embedding-3-small"),
          value: text,
        });

        return embedding;
      } catch (error) {
        console.error("Failed to generate OpenAI embedding:", error);
        throw new Error("OpenAI embedding generation failed");
      }
    }
  }

  /**
   * Search vectors using similarity search (Multi-tenant: requires org/division/app)
   * THIS IS THE FAST PART! Sub-second queries! 🚀
   * 
   * Now supports both OpenAI and Gemini embeddings!
   */
  async searchVectors(
    query: string,
    options: {
      organization: string;
      division: string;
      app_under_test: string;
      matchThreshold?: number;
      matchCount?: number;
      sourceTypes?: string[];
      useGemini?: boolean; // If true, use Gemini embeddings
    }
  ): Promise<VectorSearchResult[]> {
    const { 
      organization,
      division,
      app_under_test,
      matchThreshold = 0.50, 
      matchCount = 10, 
      sourceTypes = null,
      useGemini = true // Default to Gemini
    } = options;

    try {
      // Generate embedding for the query using configured provider
      const embeddingStart = performance.now();
      const originalProvider = this.embeddingProvider;
      this.embeddingProvider = useGemini ? "gemini" : "openai";
      const queryEmbedding = await this.generateEmbedding(query);
      this.embeddingProvider = originalProvider;
      const embeddingTime = performance.now() - embeddingStart;
      console.log(`⏱️  Embedding generation (${useGemini ? 'Gemini' : 'OpenAI'}): ${embeddingTime.toFixed(0)}ms`);

      // Use admin client for RPC (grants require authenticated/service role)
      const rpcClient = supabaseAdmin ?? publicSupabase;
      if (!rpcClient) {
        throw new Error("Supabase client is not initialized");
      }

      // Choose appropriate RPC function based on embedding type
      const rpcFunction = useGemini ? "match_siam_vectors_gemini" : "match_siam_vectors";

      const vectorSearchStart = performance.now();
      const { data, error } = await rpcClient.rpc(rpcFunction, {
        p_organization: organization,
        p_division: division,
        p_app_under_test: app_under_test,
        query_embedding: queryEmbedding,
        match_threshold: matchThreshold,
        match_count: matchCount,
        filter_source_types: sourceTypes,
      });
      const vectorSearchTime = performance.now() - vectorSearchStart;
      console.log(`⏱️  Vector search (DB query): ${vectorSearchTime.toFixed(0)}ms`);
      console.log(`🏢 Searching: ${organization}/${division}/${app_under_test}`);

      if (error) {
        console.error('❌ Vector search error:', error);
        throw error;
      }

      // Log detailed results for debugging
      const results = data || [];
      console.log(`📊 Vector search results: ${results.length} matches`);
      if (results.length > 0) {
        const topResult = results[0];
        console.log(`   Best match: ${(topResult.similarity * 100).toFixed(1)}% similarity`);
        console.log(`   Content preview: "${topResult.content?.substring(0, 100)}..."`);
        console.log(`   All similarities: [${results.map((r: any) => (r.similarity * 100).toFixed(1) + '%').join(', ')}]`);
      } else {
        console.log(`   ⚠️  No results above threshold (${matchThreshold * 100}%)`);
      }

      return results;
    } catch (error) {
      console.error("Vector search failed:", error);
      throw new Error(`Search failed: ${handleSupabaseError(error)}`);
    }
  }

  /**
   * Upsert a vector (insert or update) - Multi-tenant version
   */
  async upsertVector(
    organization: string,
    division: string,
    app_under_test: string,
    content: string,
    sourceType: SIAMVector["source_type"],
    sourceId: string,
    metadata: Record<string, any> = {}
  ): Promise<string> {
    try {
      // Generate embedding
      const embedding = await this.generateEmbedding(content);

      // Writes/RPC must use admin client
      if (!supabaseAdmin) {
        throw new Error(
          "Supabase admin client not available. Ensure SUPABASE_SERVICE_ROLE_KEY is set on the server."
        );
      }

      const { data, error } = await supabaseAdmin.rpc("upsert_siam_vector", {
        p_organization: organization,
        p_division: division,
        p_app_under_test: app_under_test,
        p_content: content,
        p_embedding: embedding,
        p_source_type: sourceType,
        p_source_id: sourceId,
        p_metadata: metadata,
      });

      if (error) {
        throw error;
      }

      console.log(`✅ Upserted vector: ${organization}/${division}/${app_under_test}/${sourceType}/${sourceId}`);
      return data;
    } catch (error) {
      console.error("Vector upsert failed:", error);
      throw new Error(`Upsert failed: ${handleSupabaseError(error)}`);
    }
  }

  /**
   * Batch upsert vectors (for migration) - Multi-tenant version
   */
  async batchUpsertVectors(
    organization: string,
    division: string,
    app_under_test: string,
    vectors: Array<{
      content: string;
      sourceType: SIAMVector["source_type"];
      sourceId: string;
      metadata?: Record<string, any>;
    }>
  ): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    console.log(`🔄 Batch upserting ${vectors.length} vectors for ${organization}/${division}/${app_under_test}`);

    // Process in batches to avoid overwhelming the API
    const batchSize = Math.max(1, parseInt(process.env.VECTOR_BATCH_SIZE || "5", 10));
    for (let i = 0; i < vectors.length; i += batchSize) {
      const batch = vectors.slice(i, i + batchSize);

      const promises = batch.map(async (vector) => {
        try {
          await this.upsertVector(
            organization,
            division,
            app_under_test,
            vector.content,
            vector.sourceType,
            vector.sourceId,
            vector.metadata || {}
          );
          success++;
        } catch (error) {
          console.error(`Failed to upsert vector ${vector.sourceId}:`, error);
          failed++;
        }
      });

      await Promise.all(promises);

      // Log progress
      console.log(
        `Migration progress: ${success + failed}/${vectors.length} (${success} success, ${failed} failed)`
      );
    }

    return { success, failed };
  }

  /**
   * Get vector stats for monitoring (multi-tenant)
   */
  async getVectorStats(
    organization?: string,
    division?: string,
    app_under_test?: string
  ): Promise<any> {
    try {
      // Safe read: prefer public client, fallback to admin
      const readClient = publicSupabase ?? supabaseAdmin;
      if (!readClient) {
        throw new Error("Supabase client is not initialized");
      }

      let query = readClient.from("siam_vector_stats").select("*");
      
      // Apply filters if provided
      if (organization) query = query.eq("organization", organization);
      if (division) query = query.eq("division", division);
      if (app_under_test) query = query.eq("app_under_test", app_under_test);

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error("Failed to get vector stats:", error);
      throw new Error(`Stats retrieval failed: ${handleSupabaseError(error)}`);
    }
  }

  /**
   * Delete vectors by source (multi-tenant)
   */
  async deleteVectorsBySource(
    organization: string,
    division: string,
    app_under_test: string,
    sourceType: string,
    sourceId?: string
  ): Promise<number> {
    try {
      // Deletions must use admin client
      if (!supabaseAdmin) {
        throw new Error(
          "Supabase admin client not available. Ensure SUPABASE_SERVICE_ROLE_KEY is set on the server."
        );
      }

      let query = supabaseAdmin
        .from("siam_vectors")
        .delete()
        .eq("organization", organization)
        .eq("division", division)
        .eq("app_under_test", app_under_test)
        .eq("source_type", sourceType);

      if (sourceId) {
        query = query.eq("source_id", sourceId);
      }

      const { data, error } = await query.select("id");

      if (error) {
        throw error;
      }

      const count = data?.length || 0;
      console.log(`🗑️  Deleted ${count} vectors from ${organization}/${division}/${app_under_test}/${sourceType}`);
      return count;
    } catch (error) {
      console.error("Failed to delete vectors:", error);
      throw new Error(`Delete failed: ${handleSupabaseError(error)}`);
    }
  }

  /**
   * Get migration status (multi-tenant)
   */
  async getMigrationStatus(
    organization?: string,
    division?: string,
    app_under_test?: string
  ): Promise<any> {
    try {
      // Safe read: prefer public client, fallback to admin
      const readClient = publicSupabase ?? supabaseAdmin;
      if (!readClient) {
        throw new Error("Supabase client is not initialized");
      }

      let query = readClient
        .from("siam_migration_status")
        .select("*")
        .order("created_at", { ascending: false });

      // Apply filters if provided
      if (organization) query = query.eq("organization", organization);
      if (division) query = query.eq("division", division);
      if (app_under_test) query = query.eq("app_under_test", app_under_test);

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error("Failed to get migration status:", error);
      throw new Error(`Status retrieval failed: ${handleSupabaseError(error)}`);
    }
  }

  /**
   * Update migration status (multi-tenant)
   */
  async updateMigrationStatus(
    organization: string,
    division: string,
    app_under_test: string,
    sourceType: string,
    status: "pending" | "in_progress" | "completed" | "failed",
    details: {
      totalCount?: number;
      migratedCount?: number;
      errorMessage?: string;
    } = {}
  ): Promise<void> {
    try {
      const updateData: any = {
        organization,
        division,
        app_under_test,
        source_type: sourceType,
        status,
        total_count: details.totalCount,
        migrated_count: details.migratedCount,
        error_message: details.errorMessage,
      };

      if (status === "in_progress" && !details.errorMessage) {
        updateData.started_at = new Date().toISOString();
      } else if (status === "completed" || status === "failed") {
        updateData.completed_at = new Date().toISOString();
      }

      if (!supabaseAdmin) {
        throw new Error(
          "Supabase admin client not available. Ensure SUPABASE_SERVICE_ROLE_KEY is set on the server."
        );
      }

      const { error } = await supabaseAdmin.from("siam_migration_status").upsert(updateData, {
        onConflict: "organization,division,app_under_test,source_type",
      });

      if (error) {
        throw error;
      }

      console.log(`📊 Migration status updated: ${organization}/${division}/${app_under_test}/${sourceType} → ${status}`);
    } catch (error) {
      console.error("Failed to update migration status:", error);
      // Don't throw here - we don't want to break migration due to status update failure
    }
  }
}

// Singleton instance
let instance: SupabaseVectorService | null = null;

export function getSupabaseVectorService(): SupabaseVectorService {
  if (!instance) {
    instance = new SupabaseVectorService();
  }
  return instance;
}

export default SupabaseVectorService;
