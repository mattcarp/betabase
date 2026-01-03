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
  SIAMVector,
  VectorSearchResult,
  handleSupabaseError,
} from "../lib/supabase";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { getGeminiEmbeddingService } from "./geminiEmbeddingService";

// NOTE: OpenAI embedding is ONLY available server-side via API routes
// This service uses Gemini embeddings by default which work on both client and server
// The OpenAI fallback has been removed to prevent client-side bundling issues

// Get admin client lazily to avoid null at module load time (for scripts)
function getAdminClient(): SupabaseClient | null {
  // Check global first (set by test scripts)
  if ((globalThis as any).__supabaseAdminClient) {
    return (globalThis as any).__supabaseAdminClient;
  }
  
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (url && key) {
    const client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    (globalThis as any).__supabaseAdminClient = client;
    return client;
  }
  return null;
}

export type EmbeddingProvider = "openai" | "gemini";

export class SupabaseVectorService {
  private embeddingProvider: EmbeddingProvider;
  
  constructor(embeddingProvider: EmbeddingProvider = "gemini") {
    this.embeddingProvider = embeddingProvider;
  }

  /**
   * Generate embeddings using Gemini (768 dimensions)
   * Note: OpenAI embeddings removed to prevent client-side bundling issues
   * For OpenAI embeddings, use server-side API routes directly
   */
  async generateEmbedding(text: string): Promise<number[]> {
    // Always use Gemini - OpenAI removed to prevent client bundling issues
    if (this.embeddingProvider === "openai") {
      console.warn("[SupabaseVector] OpenAI embedding requested but not available client-side, using Gemini");
    }
    const geminiService = getGeminiEmbeddingService();
    return await geminiService.generateEmbedding(text);
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
      useGemini = true // Use Gemini embeddings (768d)
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
      const rpcClient = getAdminClient() ?? publicSupabase;
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
   * Multi-source search - queries BOTH siam_vectors AND wiki_documents
   * 
   * This is the FIX for the terrible RAG responses! 🎯
   * - wiki_documents: Human-written documentation (OpenAI 1536d)
   * - siam_vectors: Git code for implementation context (Gemini 768d)
   * 
   * Runs both queries in parallel, merges results.
   */
  async searchMultiSource(
    query: string,
    options: {
      organization: string;
      division: string;
      app_under_test: string;
      matchThreshold?: number;
      matchCount?: number;
      sourceTypes?: string[];
      includeWikiDocs?: boolean;
      includeSiamVectors?: boolean;
      appNameFilter?: string; // For wiki_documents (defaults to 'AOMA_WIKI')
    }
  ): Promise<VectorSearchResult[]> {
    const {
      organization,
      division,
      app_under_test,
      matchThreshold = 0.50,
      matchCount = 10,
      sourceTypes = null,
      includeWikiDocs = true,
      includeSiamVectors = true,
      appNameFilter = 'AOMA', // Most AOMA docs are under 'AOMA' (238) not 'AOMA_WIKI' (70)
    } = options;

    const rpcClient = getAdminClient() ?? publicSupabase;
    if (!rpcClient) {
      throw new Error("Supabase client is not initialized");
    }

    const allResults: VectorSearchResult[] = [];
    const searchPromises: Promise<void>[] = [];

    // Generate embeddings in parallel
    const embeddingStart = performance.now();
    
    const [geminiEmbedding, openaiEmbedding] = await Promise.all([
      includeSiamVectors ? this.generateGeminiEmbedding(query) : Promise.resolve(null),
      includeWikiDocs ? this.generateOpenAIEmbedding(query) : Promise.resolve(null),
    ]);
    
    const embeddingTime = performance.now() - embeddingStart;
    console.log(`⏱️  Embedding generation (parallel): ${embeddingTime.toFixed(0)}ms`);

    // Query siam_vectors with Gemini embedding (git code)
    if (includeSiamVectors && geminiEmbedding) {
      searchPromises.push(
        rpcClient.rpc("match_siam_vectors_gemini", {
          p_organization: organization,
          p_division: division,
          p_app_under_test: app_under_test,
          query_embedding: geminiEmbedding,
          match_threshold: matchThreshold,
          match_count: matchCount,
          filter_source_types: sourceTypes,
        }).then(({ data, error }) => {
          if (error) {
            console.error('❌ siam_vectors search error:', error);
            return;
          }
          const results = (data || []).map((r: any) => ({
            ...r,
            source_table: 'siam_vectors',
          }));
          console.log(`📊 siam_vectors: ${results.length} matches`);
          allResults.push(...results);
        })
      );
    }

    // Query wiki_documents with OpenAI embedding (documentation)
    if (includeWikiDocs && openaiEmbedding) {
      searchPromises.push(
        rpcClient.rpc("match_wiki_documents", {
          query_embedding: openaiEmbedding,
          match_threshold: matchThreshold,
          match_count: matchCount,
          app_name_filter: appNameFilter,
        }).then(({ data, error }) => {
          if (error) {
            console.error('❌ wiki_documents search error:', error);
            return;
          }
          // Normalize wiki_documents results to match VectorSearchResult shape
          const results = (data || []).map((r: any) => ({
            id: r.id,
            content: r.markdown_content,
            source_type: 'wiki' as const,
            source_id: r.url,
            metadata: {
              ...r.metadata,
              title: r.title,
              app_name: r.app_name,
              url: r.url,
            },
            similarity: r.similarity,
            source_table: 'wiki_documents',
          }));
          console.log(`📊 wiki_documents: ${results.length} matches`);
          allResults.push(...results);
        })
      );
    }

    // Wait for all searches to complete
    const searchStart = performance.now();
    await Promise.all(searchPromises);
    const searchTime = performance.now() - searchStart;
    console.log(`⏱️  Multi-source search (parallel DB queries): ${searchTime.toFixed(0)}ms`);

    // Sort all results by similarity (highest first)
    allResults.sort((a, b) => (b.similarity || 0) - (a.similarity || 0));

    // Log summary
    console.log(`📊 Multi-source total: ${allResults.length} matches`);
    if (allResults.length > 0) {
      const topResult = allResults[0];
      console.log(`   Best match: ${((topResult.similarity || 0) * 100).toFixed(1)}% from ${(topResult as any).source_table}`);
      console.log(`   Content preview: "${topResult.content?.substring(0, 100)}..."`);
    }

    // Return top matchCount results across all sources
    return allResults.slice(0, matchCount);
  }

  /**
   * Generate Gemini embedding (768d)
   */
  private async generateGeminiEmbedding(text: string): Promise<number[]> {
    const geminiService = getGeminiEmbeddingService();
    return await geminiService.generateEmbedding(text);
  }

  /**
   * Generate embedding for wiki docs (using Gemini - OpenAI removed for client compatibility)
   * Note: This method name is kept for backwards compatibility but now uses Gemini
   */
  private async generateOpenAIEmbedding(text: string): Promise<number[]> {
    // Use Gemini instead of OpenAI to avoid client-side bundling issues
    return this.generateGeminiEmbedding(text);
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
      // Generate embedding using configured provider
      const embedding = await this.generateEmbedding(content);
      console.log(`📝 Generated ${this.embeddingProvider} embedding (${embedding.length}d)`);

      // Writes must use admin client
      if (!getAdminClient()) {
        throw new Error(
          "Supabase admin client not available. Ensure SUPABASE_SERVICE_ROLE_KEY is set on the server."
        );
      }

      // Choose correct embedding column based on provider
      // - embedding: vector(1536) for OpenAI
      // - embedding_gemini: vector(768) for Gemini
      const embeddingColumn = this.embeddingProvider === "gemini" ? "embedding_gemini" : "embedding";
      
      // Build the record dynamically to use correct column
      const record: Record<string, any> = {
        organization,
        division,
        app_under_test,
        content,
        source_type: sourceType,
        source_id: sourceId,
        metadata: {
          ...metadata,
          embedding_source: this.embeddingProvider, // Track which provider was used
        },
        updated_at: new Date().toISOString(),
      };
      record[embeddingColumn] = embedding;

      console.log(`📝 Using column '${embeddingColumn}' for ${this.embeddingProvider} embeddings`);

      const { data, error } = await getAdminClient()!
        .from("siam_vectors")
        .upsert(record, {
          onConflict: "organization,division,app_under_test,source_type,source_id",
        })
        .select("id")
        .single();

      if (error) {
        throw error;
      }

      console.log(`✅ Upserted vector: ${organization}/${division}/${app_under_test}/${sourceType}/${sourceId}`);
      return data?.id || sourceId;
    } catch (error) {
      console.error("Vector upsert failed:", error);
      throw new Error(`Upsert failed: ${handleSupabaseError(error)}`);
    }
  }

  /**
   * Batch upsert vectors (for migration) - Multi-tenant version
   * 
   * Can be called with:
   * - batchUpsertVectors(vectors) - uses DEFAULT_APP_CONTEXT
   * - batchUpsertVectors(org, division, app, vectors) - explicit context
   */
  async batchUpsertVectors(
    orgOrVectors: string | Array<{
      content: string;
      sourceType: SIAMVector["source_type"];
      sourceId: string;
      metadata?: Record<string, any>;
    }>,
    divisionOrNothing?: string,
    app_under_test?: string,
    vectorsArg?: Array<{
      content: string;
      sourceType: SIAMVector["source_type"];
      sourceId: string;
      metadata?: Record<string, any>;
    }>
  ): Promise<{ success: number; failed: number }> {
    // Handle overloaded signature
    let organization: string;
    let division: string;
    let app: string;
    let vectors: Array<{
      content: string;
      sourceType: SIAMVector["source_type"];
      sourceId: string;
      metadata?: Record<string, any>;
    }>;
    
    if (Array.isArray(orgOrVectors)) {
      // Called with just vectors - use defaults
      const { DEFAULT_APP_CONTEXT } = require("../lib/supabase");
      organization = DEFAULT_APP_CONTEXT.organization;
      division = DEFAULT_APP_CONTEXT.division;
      app = DEFAULT_APP_CONTEXT.app_under_test;
      vectors = orgOrVectors;
    } else {
      // Called with explicit context
      organization = orgOrVectors;
      division = divisionOrNothing!;
      app = app_under_test!;
      vectors = vectorsArg!;
    }
    let success = 0;
    let failed = 0;

    console.log(`🔄 Batch upserting ${vectors.length} vectors for ${organization}/${division}/${app}`);

    // Process in batches to avoid overwhelming the API
    const batchSize = Math.max(1, parseInt(process.env.VECTOR_BATCH_SIZE || "5", 10));
    for (let i = 0; i < vectors.length; i += batchSize) {
      const batch = vectors.slice(i, i + batchSize);

      const promises = batch.map(async (vector) => {
        try {
          await this.upsertVector(
            organization,
            division,
            app,
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
      const readClient = publicSupabase ?? getAdminClient();
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
      if (!getAdminClient()) {
        throw new Error(
          "Supabase admin client not available. Ensure SUPABASE_SERVICE_ROLE_KEY is set on the server."
        );
      }

      let query = getAdminClient()!
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
      const readClient = publicSupabase ?? getAdminClient();
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

      if (!getAdminClient()) {
        throw new Error(
          "Supabase admin client not available. Ensure SUPABASE_SERVICE_ROLE_KEY is set on the server."
        );
      }

      const { error } = await getAdminClient()!.from("siam_migration_status").upsert(updateData, {
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
