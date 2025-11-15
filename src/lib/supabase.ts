/**
 * Supabase Client for SIAM Multi-Tenant Vector Store
 * 
 * CRITICAL DISTINCTION:
 * - SIAM = Our app (the testing/knowledge management platform)
 * - AOMA = App Under Test (one of potentially many apps we can test)
 * - Alexandria, Confluence, etc. = Other apps we may test in the future
 * 
 * All vector operations require specifying which app_under_test we're working with.
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

export const isSupabaseConfigured =
  Boolean(supabaseUrl) && Boolean(supabaseAnonKey) && !isPlaceholder;

if (!isSupabaseConfigured) {
  console.warn("⚠️  Supabase not configured - vector search features disabled:", {
    url: !!supabaseUrl && !isPlaceholder,
    key: !!supabaseAnonKey && !isPlaceholder,
    hint:
      "Load secrets via Infisical (e.g., `infisical run --env=dev -- pnpm dev`) or export them to .env.local.",
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

// Type definitions for SIAM's multi-tenant vector store (3-level hierarchy)
export interface SIAMVector {
  id: string;
  organization: string;    // 'sony-music', etc.
  division: string;        // 'digital-operations', 'legal', 'finance', etc.
  app_under_test: string;  // 'aoma', 'alexandria', 'confluence', etc.
  content: string;
  embedding?: number[];
  source_type: "knowledge" | "jira" | "git" | "email" | "metrics" | "openai_import" | "cache" | "firecrawl";
  source_id: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface VectorSearchResult extends SIAMVector {
  similarity: number;
}

// Legacy type alias for backward compatibility (deprecated)
/** @deprecated Use SIAMVector instead. AOMA is the app under test, not our app. */
export type AOMAVector = SIAMVector;

export interface MigrationStatus {
  id: string;
  organization: string;    // Which organization's data is being migrated
  division: string;        // Which division's data is being migrated
  app_under_test: string;  // Which app's data is being migrated
  source_type: string;
  total_count: number;
  migrated_count: number;
  status: "pending" | "in_progress" | "completed" | "failed";
  error_message?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
}

// Constants for Sony Music structure (for use throughout the app)
export const SONY_MUSIC = {
  organization: 'sony-music',
  divisions: {
    DIGITAL_OPS: 'digital-operations',
    LEGAL: 'legal',
    FINANCE: 'finance',
  },
  apps: {
    AOMA: 'aoma',
    ALEXANDRIA: 'alexandria',
  },
} as const;

// Type-safe helper to get full hierarchy for Sony Music Digital Operations / AOMA
export const DEFAULT_APP_CONTEXT = {
  organization: SONY_MUSIC.organization,
  division: SONY_MUSIC.divisions.DIGITAL_OPS,
  app_under_test: SONY_MUSIC.apps.AOMA,
} as const;

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
