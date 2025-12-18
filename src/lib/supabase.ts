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

// Re-export everything from root lib/supabase to avoid duplicate clients
// This prevents the "Multiple GoTrueClient instances" warning
export {
  supabase,
  supabaseAdmin,
  upsertWikiDocument,
  upsertJiraTicket,
  upsertJiraTicketEmbedding,
  upsertCrawlerDocument,
  storeFirecrawlData,
  getFirecrawlAnalysis,
  searchFirecrawlData,
  validateSonyMusicContent,
  handleSupabaseError,
} from "../../lib/supabase";

// Type definitions for SIAM's multi-tenant vector store (3-level hierarchy)
export interface SIAMVector {
  id: string;
  organization: string; // 'sony-music', etc.
  division: string; // 'digital-operations', 'legal', 'finance', etc.
  app_under_test: string; // 'aoma', 'alexandria', 'confluence', etc.
  content: string;
  embedding?: number[];
  source_type:
    | "knowledge"
    | "jira"
    | "git"
    | "email"
    | "metrics"
    | "openai_import"
    | "cache"
    | "firecrawl";
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
  organization: string; // Which organization's data is being migrated
  division: string; // Which division's data is being migrated
  app_under_test: string; // Which app's data is being migrated
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
  organization: "sony-music",
  divisions: {
    DIGITAL_OPS: "digital-operations",
    LEGAL: "legal",
    FINANCE: "finance",
  },
  apps: {
    AOMA: "aoma",
    ALEXANDRIA: "alexandria",
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
