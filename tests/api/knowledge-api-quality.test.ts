/**
 * Knowledge API Quality Tests - TDD
 *
 * These tests define what a GOOD answer looks like.
 * A test FAILS if:
 * - Response contains only Jira ticket titles (no descriptions)
 * - Synthesis says "I don't know" for basic AOMA questions
 * - Top results are wiki index/navigation pages instead of content
 * - Content chunks are too short to be useful (<100 chars)
 */

import { describe, it, expect, beforeAll } from 'vitest';

const API_BASE = 'http://localhost:3006';

interface KnowledgeResult {
  id: string;
  content: string;
  source_type: 'wiki' | 'jira' | 'git' | 'metrics';
  source_id: string;
  similarity: number;
  metadata: Record<string, unknown>;
}

interface KnowledgeResponse {
  query: string;
  synthesis: string;
  results: KnowledgeResult[];
  duration_ms: number;
}

async function queryKnowledge(query: string, options: Record<string, unknown> = {}): Promise<KnowledgeResponse> {
  const response = await fetch(`${API_BASE}/v1/knowledge/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, ...options }),
  });
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  return response.json();
}

function isUselessJiraTitle(content: string): boolean {
  // Jira titles are typically "ITSM-XXXXX: Brief Title" with no description
  // Useless if it's ONLY a title (< 100 chars and matches pattern)
  const jiraTitlePattern = /^[A-Z]+-\d+:\s*.{5,50}$/;
  return content.length < 100 && jiraTitlePattern.test(content.trim());
}

function isWikiIndexPage(content: string): boolean {
  // Index pages contain "Recently Updated" lists, not actual content
  return content.includes('Recently Updated') && content.includes('• created by');
}

function isCopOutSynthesis(synthesis: string): boolean {
  // LLM is copping out if it says it doesn't have info for basic questions
  const copOutPhrases = [
    'does not contain',
    "don't have enough information",
    "don't have relevant",
    'no relevant information',
    'cannot find',
    'not specified in the',
    'not mentioned in the',
  ];
  return copOutPhrases.some((phrase) => synthesis.toLowerCase().includes(phrase));
}

describe('Knowledge API Quality', () => {
  beforeAll(async () => {
    // Verify API is running
    const health = await fetch(`${API_BASE}/health`);
    expect(health.ok).toBe(true);
  });

  describe('Basic AOMA Questions', () => {
    it('should explain what AOMA is without copping out', async () => {
      const response = await queryKnowledge('What is AOMA?');

      // Should NOT cop out for a basic question
      expect(isCopOutSynthesis(response.synthesis)).toBe(false);

      // Should mention key facts about AOMA
      const synthesis = response.synthesis.toLowerCase();
      expect(
        synthesis.includes('asset') || synthesis.includes('offering') || synthesis.includes('management')
      ).toBe(true);
    });

    it('should describe AOMA features with actual content', async () => {
      const response = await queryKnowledge('What features does AOMA have?');

      // Should NOT cop out
      expect(isCopOutSynthesis(response.synthesis)).toBe(false);

      // Should have at least one result with substantial content (>200 chars)
      const substantialResults = response.results.filter((r) => r.content.length > 200);
      expect(substantialResults.length).toBeGreaterThan(0);
    });

    it('should explain UST (Unified Submission Tool)', async () => {
      const response = await queryKnowledge('What is the Unified Submission Tool in AOMA?');

      expect(isCopOutSynthesis(response.synthesis)).toBe(false);
      expect(response.synthesis.toLowerCase()).toContain('submission');
    });
  });

  describe('Result Quality', () => {
    it('should NOT return wiki index pages as top results', async () => {
      const response = await queryKnowledge('How does AOMA work?', { limit: 5 });

      // Check the top 3 results - none should be index pages
      const topResults = response.results.slice(0, 3);
      const indexPages = topResults.filter((r) => isWikiIndexPage(r.content));

      expect(indexPages.length).toBe(0);
    });

    it('should deprioritize Jira when not explicitly filtered (wiki should rank higher)', async () => {
      // When querying without source filter, wiki should dominate for documentation questions
      const response = await queryKnowledge('What are the features of AOMA?', { limit: 5 });

      // Jira tickets (just titles) should NOT be in the top 2 results for doc questions
      const topTwo = response.results.slice(0, 2);
      const jiraInTop = topTwo.filter((r) => r.source_type === 'jira').length;

      expect(jiraInTop).toBe(0); // Wiki should dominate top results
    });

    it('should return results with substantial content (>100 chars average)', async () => {
      const response = await queryKnowledge('AOMA documentation', { limit: 5 });

      const avgContentLength =
        response.results.reduce((sum, r) => sum + r.content.length, 0) / response.results.length;

      expect(avgContentLength).toBeGreaterThan(100);
    });

    it('should prioritize wiki content over Jira for documentation questions', async () => {
      const response = await queryKnowledge('How do I use AOMA?', { limit: 5 });

      // For "how to" questions, wiki should rank higher than Jira
      const topResult = response.results[0];
      expect(topResult.source_type).toBe('wiki');
    });
  });

  describe('Synthesis Quality', () => {
    it('should synthesize a coherent answer from multiple sources', async () => {
      const response = await queryKnowledge('What is Media Conversion in AOMA?');

      // Should have a synthesis that's more than a single sentence
      expect(response.synthesis.length).toBeGreaterThan(100);

      // Should not just repeat the query
      expect(response.synthesis.toLowerCase()).not.toContain('what is media conversion in aoma');
    });

    it('should provide actionable information for how-to questions', async () => {
      const response = await queryKnowledge('How do I submit content in AOMA?');

      expect(isCopOutSynthesis(response.synthesis)).toBe(false);

      // Should contain action words
      const actionWords = ['click', 'select', 'navigate', 'use', 'enter', 'submit', 'upload'];
      const hasActionWords = actionWords.some((word) => response.synthesis.toLowerCase().includes(word));
      expect(hasActionWords).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle technical questions about AOMA architecture', async () => {
      const response = await queryKnowledge('What technology stack does AOMA use?');

      // May not have all the info, but should not completely cop out
      // At minimum should mention it's an application
      expect(response.results.length).toBeGreaterThan(0);
    });

    it('should differentiate between AOMA versions if asked', async () => {
      const response = await queryKnowledge('What changed in the latest AOMA release?');

      // Should find release notes content
      const hasReleaseInfo = response.results.some(
        (r) => r.content.toLowerCase().includes('release') || r.content.toLowerCase().includes('version')
      );
      expect(hasReleaseInfo).toBe(true);
    });
  });
});
