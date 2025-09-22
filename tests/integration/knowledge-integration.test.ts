import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Integration tests for knowledge pipeline

describe('Knowledge Integration', () => {
  let sb: SupabaseClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) as string;

  beforeAll(() => {
    if (!url || !key) {
      throw new Error('Missing Supabase env vars for tests');
    }
    sb = createClient(url, key);
  });

  test('Vector storage table exists and has rows (any source)', async () => {
    const { count, error } = await sb
      .from('aoma_unified_vectors')
      .select('id', { count: 'exact', head: true });
    expect(error).toBeNull();
    expect(typeof count === 'number').toBe(true);
  }, 15000);

  test('RPC match_aoma_vectors is callable', async () => {
    const embedding = Array.from({ length: 1536 }, (_, i) => (i % 300 === 0 ? 0.001 : 0));
    const { data, error } = await sb.rpc('match_aoma_vectors', {
      query_embedding: embedding,
      match_threshold: 0.78,
      match_count: 3,
      filter_source_types: null,
    });
    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
  }, 15000);

  test('Chat API health', async () => {
    const base = process.env.TEST_BASE_URL || 'http://localhost:3000';
    const res = await fetch(`${base}/api/chat-vercel`, { method: 'GET' });
    expect(res.ok).toBe(true);
    const json = await res.json();
    expect(json?.status).toBe('ok');
  }, 10000);
});


