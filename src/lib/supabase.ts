/**
 * Supabase Client for AOMA Vector Store
 * YOLO Migration - Making queries BLAZING FAST! 🚀
 */

import { createClient } from "@supabase/supabase-js";

// Get environment variables with validation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Check if using placeholder values
const isPlaceholder =
  supabaseUrl?.includes("placeholder") || supabaseAnonKey?.includes("placeholder");

// Lazy initialization to avoid build-time errors
let _supabase: ReturnType<typeof createClient> | null = null;
let _supabaseAdmin: ReturnType<typeof createClient> | null = null;

function getSupabase() {
  if (!_supabase) {
    if (!supabaseUrl || !supabaseAnonKey || isPlaceholder) {
      console.warn("⚠️  Supabase not configured - vector search features disabled:", {
        url: !!supabaseUrl && !isPlaceholder,
        key: !!supabaseAnonKey && !isPlaceholder,
      });
      return null;
    }
    _supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false, // We're not using auth for vector operations
      },
    });
  }
  return _supabase;
}

function getSupabaseAdmin() {
  if (!_supabaseAdmin) {
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (supabaseServiceKey && supabaseUrl && !isPlaceholder) {
      _supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
    }
  }
  return _supabaseAdmin;
}

// Export clients with lazy initialization
export const supabase = getSupabase();
export const supabaseAdmin = getSupabaseAdmin();

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
