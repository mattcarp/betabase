/**
 * useSupabaseClient - Hook for Supabase client in React components
 * 
 * This replaces the deprecated createClientComponentClient from @supabase/auth-helpers-nextjs
 * Uses the singleton client from lib/supabase.ts
 */

'use client';

import { useMemo } from 'react';
import { supabase } from '../../lib/supabase';

export function useSupabaseClient() {
  return useMemo(() => {
    if (!supabase) {
      throw new Error('Supabase client not initialized. Check environment variables.');
    }
    return supabase;
  }, []);
}

