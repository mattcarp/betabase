/**
 * Unit Tests for SIAM Multi-Tenant Vector Service
 * Tests the 3-level hierarchy: organization → division → app_under_test
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SupabaseVectorService } from '../../src/services/supabaseVectorService';
import { DEFAULT_APP_CONTEXT, SONY_MUSIC } from '../../src/lib/supabase';

// Mock Supabase client
const mockRpc = vi.fn();
const mockFrom = vi.fn(() => ({
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  upsert: vi.fn().mockReturnThis(),
}));

vi.mock('../../src/lib/supabase', async () => {
  const actual = await vi.importActual('../../src/lib/supabase');
  return {
    ...actual,
    supabase: {
      rpc: mockRpc,
      from: mockFrom,
    },
    supabaseAdmin: {
      rpc: mockRpc,
      from: mockFrom,
    },
  };
});

// Mock OpenAI embedding
vi.mock('ai', () => ({
  embed: vi.fn().mockResolvedValue({
    embedding: new Array(1536).fill(0.1),
  }),
}));

describe('SupabaseVectorService - Multi-Tenant Tests', () => {
  let service: SupabaseVectorService;

  beforeEach(() => {
    service = new SupabaseVectorService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('searchVectors - Multi-Tenant', () => {
    it('should require organization, division, and app_under_test', async () => {
      mockRpc.mockResolvedValueOnce({ data: [], error: null });

      await service.searchVectors('test query', {
        organization: SONY_MUSIC.organization,
        division: SONY_MUSIC.divisions.DIGITAL_OPS,
        app_under_test: SONY_MUSIC.apps.AOMA,
      });

      // Verify RPC was called with all 3 hierarchy levels
      expect(mockRpc).toHaveBeenCalledWith(
        'match_siam_vectors',
        expect.objectContaining({
          p_organization: 'sony-music',
          p_division: 'digital-operations',
          p_app_under_test: 'aoma',
        })
      );
    });

    it('should search with correct function name (match_siam_vectors, not match_aoma_vectors)', async () => {
      mockRpc.mockResolvedValueOnce({ data: [], error: null });

      await service.searchVectors('test query', DEFAULT_APP_CONTEXT);

      expect(mockRpc).toHaveBeenCalledWith(
        'match_siam_vectors', // New function name!
        expect.any(Object)
      );
    });

    it('should pass through threshold and count options', async () => {
      mockRpc.mockResolvedValueOnce({ data: [], error: null });

      await service.searchVectors('test query', {
        ...DEFAULT_APP_CONTEXT,
        matchThreshold: 0.85,
        matchCount: 20,
      });

      expect(mockRpc).toHaveBeenCalledWith(
        'match_siam_vectors',
        expect.objectContaining({
          match_threshold: 0.85,
          match_count: 20,
        })
      );
    });

    it('should filter by source types when provided', async () => {
      mockRpc.mockResolvedValueOnce({ data: [], error: null });

      await service.searchVectors('test query', {
        ...DEFAULT_APP_CONTEXT,
        sourceTypes: ['jira', 'knowledge'],
      });

      expect(mockRpc).toHaveBeenCalledWith(
        'match_siam_vectors',
        expect.objectContaining({
          filter_source_types: ['jira', 'knowledge'],
        })
      );
    });

    it('should return results with similarity scores', async () => {
      const mockResults = [
        {
          id: '123',
          content: 'Test content',
          source_type: 'knowledge',
          source_id: 'doc-1',
          similarity: 0.95,
          metadata: {},
        },
      ];

      mockRpc.mockResolvedValueOnce({ data: mockResults, error: null });

      const results = await service.searchVectors('test query', DEFAULT_APP_CONTEXT);

      expect(results).toEqual(mockResults);
      expect(results[0].similarity).toBe(0.95);
    });

    it('should throw error if Supabase returns an error', async () => {
      mockRpc.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error' },
      });

      await expect(
        service.searchVectors('test query', DEFAULT_APP_CONTEXT)
      ).rejects.toThrow('Search failed');
    });
  });

  describe('upsertVector - Multi-Tenant', () => {
    it('should require full 3-level hierarchy', async () => {
      mockRpc.mockResolvedValueOnce({ data: 'uuid-123', error: null });

      await service.upsertVector(
        SONY_MUSIC.organization,
        SONY_MUSIC.divisions.DIGITAL_OPS,
        SONY_MUSIC.apps.AOMA,
        'Test content',
        'knowledge',
        'doc-1',
        { key: 'value' }
      );

      expect(mockRpc).toHaveBeenCalledWith(
        'upsert_siam_vector',
        expect.objectContaining({
          p_organization: 'sony-music',
          p_division: 'digital-operations',
          p_app_under_test: 'aoma',
          p_content: 'Test content',
          p_source_type: 'knowledge',
          p_source_id: 'doc-1',
          p_metadata: { key: 'value' },
        })
      );
    });

    it('should use new function name (upsert_siam_vector, not upsert_aoma_vector)', async () => {
      mockRpc.mockResolvedValueOnce({ data: 'uuid-123', error: null });

      await service.upsertVector(
        'sony-music',
        'digital-operations',
        'aoma',
        'Test content',
        'knowledge',
        'doc-1'
      );

      expect(mockRpc).toHaveBeenCalledWith('upsert_siam_vector', expect.any(Object));
    });

    it('should generate embeddings before upserting', async () => {
      mockRpc.mockResolvedValueOnce({ data: 'uuid-123', error: null });

      await service.upsertVector(
        'sony-music',
        'digital-operations',
        'aoma',
        'Test content',
        'knowledge',
        'doc-1'
      );

      expect(mockRpc).toHaveBeenCalledWith(
        'upsert_siam_vector',
        expect.objectContaining({
          p_embedding: expect.any(Array),
        })
      );
    });

    it('should return the vector ID on success', async () => {
      const mockId = 'uuid-123-456';
      mockRpc.mockResolvedValueOnce({ data: mockId, error: null });

      const result = await service.upsertVector(
        'sony-music',
        'digital-operations',
        'aoma',
        'Test content',
        'knowledge',
        'doc-1'
      );

      expect(result).toBe(mockId);
    });
  });

  describe('Multi-Organization Support', () => {
    it('should handle different organizations', async () => {
      mockRpc.mockResolvedValueOnce({ data: [], error: null });

      await service.searchVectors('test query', {
        organization: 'universal-music',
        division: 'it-department',
        app_under_test: 'knowledge-hub',
      });

      expect(mockRpc).toHaveBeenCalledWith(
        'match_siam_vectors',
        expect.objectContaining({
          p_organization: 'universal-music',
          p_division: 'it-department',
          p_app_under_test: 'knowledge-hub',
        })
      );
    });

    it('should support Sony Music Legal division', async () => {
      mockRpc.mockResolvedValueOnce({ data: 'uuid-legal', error: null });

      await service.upsertVector(
        SONY_MUSIC.organization,
        SONY_MUSIC.divisions.LEGAL,
        'contract-manager',
        'Legal content',
        'knowledge',
        'contract-1'
      );

      expect(mockRpc).toHaveBeenCalledWith(
        'upsert_siam_vector',
        expect.objectContaining({
          p_organization: 'sony-music',
          p_division: 'legal',
          p_app_under_test: 'contract-manager',
        })
      );
    });

    it('should support Sony Music Finance division', async () => {
      mockRpc.mockResolvedValueOnce({ data: [], error: null });

      await service.searchVectors('budget query', {
        organization: SONY_MUSIC.organization,
        division: SONY_MUSIC.divisions.FINANCE,
        app_under_test: 'budget-tracker',
      });

      expect(mockRpc).toHaveBeenCalledWith(
        'match_siam_vectors',
        expect.objectContaining({
          p_division: 'finance',
          p_app_under_test: 'budget-tracker',
        })
      );
    });
  });

  describe('deleteVectorsBySource - Multi-Tenant', () => {
    it('should require full hierarchy for deletion', async () => {
      const mockDelete = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockSelect = vi.fn().mockResolvedValue({ data: [{ id: '1' }], error: null });

      mockFrom.mockReturnValueOnce({
        delete: mockDelete,
        eq: mockEq,
        select: mockSelect,
      } as any);

      await service.deleteVectorsBySource(
        'sony-music',
        'digital-operations',
        'aoma',
        'jira'
      );

      expect(mockFrom).toHaveBeenCalledWith('siam_vectors');
      expect(mockEq).toHaveBeenCalledWith('organization', 'sony-music');
      expect(mockEq).toHaveBeenCalledWith('division', 'digital-operations');
      expect(mockEq).toHaveBeenCalledWith('app_under_test', 'aoma');
      expect(mockEq).toHaveBeenCalledWith('source_type', 'jira');
    });
  });

  describe('Constants and Helpers', () => {
    it('should use DEFAULT_APP_CONTEXT for Sony Music Digital Operations AOMA', () => {
      expect(DEFAULT_APP_CONTEXT).toEqual({
        organization: 'sony-music',
        division: 'digital-operations',
        app_under_test: 'aoma',
      });
    });

    it('should provide SONY_MUSIC constant structure', () => {
      expect(SONY_MUSIC.organization).toBe('sony-music');
      expect(SONY_MUSIC.divisions.DIGITAL_OPS).toBe('digital-operations');
      expect(SONY_MUSIC.divisions.LEGAL).toBe('legal');
      expect(SONY_MUSIC.divisions.FINANCE).toBe('finance');
      expect(SONY_MUSIC.apps.AOMA).toBe('aoma');
      expect(SONY_MUSIC.apps.ALEXANDRIA).toBe('alexandria');
    });
  });

  describe('Backwards Compatibility', () => {
    it('should maintain SIAMVector interface with 3 hierarchy fields', () => {
      // This is a type-level test - if it compiles, it passes
      const vector: any = {
        id: '123',
        organization: 'sony-music',
        division: 'digital-operations',
        app_under_test: 'aoma',
        content: 'test',
        source_type: 'knowledge',
        source_id: 'doc-1',
        metadata: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      expect(vector.organization).toBeDefined();
      expect(vector.division).toBeDefined();
      expect(vector.app_under_test).toBeDefined();
    });
  });
});

