/**
 * Supabase Client for AOMA Vector Store
 * YOLO Migration - Making queries BLAZING FAST! 🚀
 */

import { createClient } from "@supabase/supabase-js";

// Get environment variables with validation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase environment variables:", {
    url: !!supabaseUrl,
    key: !!supabaseAnonKey,
  });
  throw new Error(
    "Missing required Supabase environment variables. Please check your .env.local file.",
  );
}

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // We're not using auth for vector operations
  },
});

// Type definitions for our vector store
export interface AOMAVector {
  id: string;
  content: string;
  embedding?: number[];
  source_type:
    | "knowledge"
    | "jira"
    | "git"
    | "email"
    | "metrics"
    | "openai_import";
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
