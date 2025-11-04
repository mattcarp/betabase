/**
 * REAL Integration Test - Multi-Tenant Vector Store
 * 
 * Tests the actual Supabase database with real RPC calls.
 * NO MOCKS - If Supabase isn't configured, tests FAIL HONESTLY.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { supabase, supabaseAdmin, DEFAULT_APP_CONTEXT, SONY_MUSIC } from '../../src/lib/supabase';
import { SupabaseVectorService } from '../../src/services/supabaseVectorService';

const isIntegrationTest = !!process.env.INTEGRATION_TESTS;

describe.skipIf(!isIntegrationTest)('Multi-Tenant Vector Store - REAL Integration Tests', () => {
  let service: SupabaseVectorService;

  beforeAll(() => {
    // Check if Supabase is configured
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key || url.includes('placeholder') || key.includes('placeholder')) {
      throw new Error(
        '❌ Supabase not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env\n' +
        'Cannot run integration tests without real database connection.'
      );
    }

    service = new SupabaseVectorService();
  });

  describe('Database Schema Verification', () => {
    it('should verify siam_vectors table exists with multi-tenant columns', async () => {
      // Query the table structure
      const { data, error } = await supabase
        .from('siam_vectors')
        .select('organization, division, app_under_test')
        .limit(0); // Don't return rows, just verify columns exist

      if (error) {
        throw new Error(
          `❌ siam_vectors table not found or columns missing.\n` +
          `Error: ${error.message}\n` +
          `Did the migration run successfully?`
        );
      }

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    it('should verify RPC functions exist', async () => {
      const testEmbedding = new Array(1536).fill(0.1);

      // Test match_siam_vectors function exists
      const { error } = await supabase.rpc('match_siam_vectors', {
        p_organization: 'test-org',
        p_division: 'test-div',
        p_app_under_test: 'test-app',
        query_embedding: testEmbedding,
        match_threshold: 0.5,
        match_count: 1,
      });

      // Function should exist (even if no results)
      if (error && !error.message.includes('no rows')) {
        throw new Error(
          `❌ match_siam_vectors function not found.\n` +
          `Error: ${error.message}\n` +
          `Did the migration run successfully?`
        );
      }

      expect(error).toBeNull();
    });
  });

  describe('Multi-Tenant Data Operations', () => {
    const testOrg = 'test-org-' + Date.now();
    const testDiv = 'test-division';
    const testApp = 'test-app';
    const testContent = 'This is a test vector for multi-tenant validation';

    it('should upsert a vector with full 3-level hierarchy', async () => {
      const vectorId = await service.upsertVector(
        testOrg,
        testDiv,
        testApp,
        testContent,
        'knowledge',
        'test-doc-1',
        { test: true }
      );

      expect(vectorId).toBeDefined();
      expect(typeof vectorId).toBe('string');
    });

    it('should search vectors within the correct tenant', async () => {
      // Search in the test org/div/app
      const results = await service.searchVectors('test vector validation', {
        organization: testOrg,
        division: testDiv,
        app_under_test: testApp,
        matchThreshold: 0.1, // Low threshold to ensure we find it
        matchCount: 5,
      });

      expect(Array.isArray(results)).toBe(true);
      
      // Should find the vector we just inserted
      const found = results.find(r => r.source_id === 'test-doc-1');
      expect(found).toBeDefined();
      expect(found?.organization).toBe(testOrg);
      expect(found?.division).toBe(testDiv);
      expect(found?.app_under_test).toBe(testApp);
    });

    it('should NOT find vectors from different tenants', async () => {
      // Search in a DIFFERENT org/div/app
      const results = await service.searchVectors('test vector validation', {
        organization: 'different-org',
        division: testDiv,
        app_under_test: testApp,
        matchThreshold: 0.1,
        matchCount: 10,
      });

      // Should NOT find the test vector (different organization)
      const found = results.find(r => r.source_id === 'test-doc-1');
      expect(found).toBeUndefined();
    });

    it('should delete vectors by source within correct tenant', async () => {
      const deleted = await service.deleteVectorsBySource(
        testOrg,
        testDiv,
        testApp,
        'knowledge',
        'test-doc-1'
      );

      expect(deleted).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Default Context Constants', () => {
    it('should use DEFAULT_APP_CONTEXT correctly', () => {
      expect(DEFAULT_APP_CONTEXT.organization).toBe('sony-music');
      expect(DEFAULT_APP_CONTEXT.division).toBe('digital-operations');
      expect(DEFAULT_APP_CONTEXT.app_under_test).toBe('aoma');
    });

    it('should have SONY_MUSIC constant structure', () => {
      expect(SONY_MUSIC.organization).toBe('sony-music');
      expect(SONY_MUSIC.divisions.DIGITAL_OPS).toBe('digital-operations');
      expect(SONY_MUSIC.apps.AOMA).toBe('aoma');
    });
  });
});

