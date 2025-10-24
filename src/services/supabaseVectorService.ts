/**
 * Supabase Vector Service
 * Handles all vector operations for the AOMA unified store
 * This is where the MAGIC happens! ⚡
 */

import {
  supabase as publicSupabase,
  supabaseAdmin,
  AOMAVector,
  VectorSearchResult,
  handleSupabaseError,
} from "../../lib/supabase";
import { openai } from "@ai-sdk/openai";
import { embed } from "ai";

export class SupabaseVectorService {
  constructor() {
    // No longer need to store OpenAI client
  }

  /**
   * Generate embeddings using OpenAI's text-embedding-3-small (via Vercel AI SDK)
   */
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const { embedding } = await embed({
        model: openai.embedding("text-embedding-3-small"),
        value: text,
      });

      return embedding;
    } catch (error) {
      console.error("Failed to generate embedding:", error);
      throw new Error("Embedding generation failed");
    }
  }

  /**
   * Search vectors using similarity search
   * THIS IS THE FAST PART! Sub-second queries! 🚀
   */
  async searchVectors(
    query: string,
    options: {
      matchThreshold?: number;
      matchCount?: number;
      sourceTypes?: string[];
    } = {}
  ): Promise<VectorSearchResult[]> {
    const { matchThreshold = 0.78, matchCount = 10, sourceTypes = null } = options;

    try {
      // Generate embedding for the query
      const queryEmbedding = await this.generateEmbedding(query);

      // Use admin client for RPC (grants require authenticated/service role)
      const rpcClient = supabaseAdmin ?? publicSupabase;
      if (!rpcClient) {
        throw new Error("Supabase client is not initialized");
      }

      const { data, error } = await rpcClient.rpc("match_aoma_vectors", {
        query_embedding: queryEmbedding,
        match_threshold: matchThreshold,
        match_count: matchCount,
        filter_source_types: sourceTypes,
      });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error("Vector search failed:", error);
      throw new Error(`Search failed: ${handleSupabaseError(error)}`);
    }
  }

  /**
   * Upsert a vector (insert or update)
   */
  async upsertVector(
    content: string,
    sourceType: AOMAVector["source_type"],
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

      const { data, error } = await supabaseAdmin.rpc("upsert_aoma_vector", {
        p_content: content,
        p_embedding: embedding,
        p_source_type: sourceType,
        p_source_id: sourceId,
        p_metadata: metadata,
      });

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error("Vector upsert failed:", error);
      throw new Error(`Upsert failed: ${handleSupabaseError(error)}`);
    }
  }

  /**
   * Batch upsert vectors (for migration)
   */
  async batchUpsertVectors(
    vectors: Array<{
      content: string;
      sourceType: AOMAVector["source_type"];
      sourceId: string;
      metadata?: Record<string, any>;
    }>
  ): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    // Process in batches to avoid overwhelming the API
    const batchSize = Math.max(1, parseInt(process.env.VECTOR_BATCH_SIZE || "5", 10));
    for (let i = 0; i < vectors.length; i += batchSize) {
      const batch = vectors.slice(i, i + batchSize);

      const promises = batch.map(async (vector) => {
        try {
          await this.upsertVector(
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
   * Get vector stats for monitoring
   */
  async getVectorStats(): Promise<any> {
    try {
      // Safe read: prefer public client, fallback to admin
      const readClient = publicSupabase ?? supabaseAdmin;
      if (!readClient) {
        throw new Error("Supabase client is not initialized");
      }

      const { data, error } = await readClient.from("aoma_vector_stats").select("*");

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
   * Delete vectors by source
   */
  async deleteVectorsBySource(sourceType: string, sourceId?: string): Promise<number> {
    try {
      // Deletions must use admin client
      if (!supabaseAdmin) {
        throw new Error(
          "Supabase admin client not available. Ensure SUPABASE_SERVICE_ROLE_KEY is set on the server."
        );
      }

      let query = supabaseAdmin.from("aoma_unified_vectors").delete().eq("source_type", sourceType);

      if (sourceId) {
        query = query.eq("source_id", sourceId);
      }

      const { data, error } = await query.select("id");

      if (error) {
        throw error;
      }

      return data?.length || 0;
    } catch (error) {
      console.error("Failed to delete vectors:", error);
      throw new Error(`Delete failed: ${handleSupabaseError(error)}`);
    }
  }

  /**
   * Get migration status
   */
  async getMigrationStatus(): Promise<any> {
    try {
      // Safe read: prefer public client, fallback to admin
      const readClient = publicSupabase ?? supabaseAdmin;
      if (!readClient) {
        throw new Error("Supabase client is not initialized");
      }

      const { data, error } = await readClient
        .from("aoma_migration_status")
        .select("*")
        .order("created_at", { ascending: false });

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
   * Update migration status
   */
  async updateMigrationStatus(
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
        source_type: sourceType,
        status,
        ...details,
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

      const { error } = await supabaseAdmin.from("aoma_migration_status").upsert(updateData, {
        onConflict: "source_type",
      });

      if (error) {
        throw error;
      }
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
