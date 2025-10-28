/**
 * Supabase Client for AOMA Vector Store
 * YOLO Migration - Making queries BLAZING FAST! 🚀
 */

import { createClient } from "@supabase/supabase-js";

// Re-export functions from root lib/supabase for compatibility
export {
  upsertWikiDocument,
  upsertJiraTicket,
  upsertJiraTicketEmbedding,
  upsertCrawlerDocument,
  storeFirecrawlData,
  getFirecrawlAnalysis,
  searchFirecrawlData,
  validateSonyMusicContent,
} from "../../lib/supabase";

// Get environment variables with validation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Check if using placeholder values
const isPlaceholder =
  supabaseUrl?.includes("placeholder") || supabaseAnonKey?.includes("placeholder");

if (!supabaseUrl || !supabaseAnonKey || isPlaceholder) {
  console.warn("⚠️  Supabase not configured - vector search features disabled:", {
    url: !!supabaseUrl && !isPlaceholder,
    key: !!supabaseAnonKey && !isPlaceholder,
  });
  // Don't throw error - just log a warning and use placeholder values
  // API routes will handle missing Supabase gracefully at runtime
}

// Create a single supabase client for interacting with your database
// Use placeholder values during build if env vars are missing
const url = supabaseUrl || "https://placeholder.supabase.co";
const key = supabaseAnonKey || "placeholder-key";

export const supabase = createClient(url, key, {
  auth: {
    persistSession: false, // We're not using auth for vector operations
  },
});

// Admin client with service role key (for write operations)
// Only use this server-side!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
export const supabaseAdmin = supabaseServiceKey
  ? createClient(url, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : null;

// Type definitions for our vector store
export interface AOMAVector {
  id: string;
  content: string;
  embedding?: number[];
  source_type: "knowledge" | "jira" | "git" | "email" | "metrics" | "openai_import";
  source_id: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface VectorSearchResult extends AOMAVector {
  similarity: number;
}

export interface MigrationStatus {
  id: string;
  source_type: string;
  total_count: number;
  migrated_count: number;
  status: "pending" | "in_progress" | "completed" | "failed";
  error_message?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
}

// Helper function to handle Supabase errors - EXPORTED for use in services
export function handleSupabaseError(error: any): string {
  if (error?.message) {
    return error.message;
  }
  if (error?.details) {
    return error.details;
  }
  return "Unknown Supabase error occurred";
}

// Export types for use in other services
export type { SupabaseClient } from "@supabase/supabase-js";
