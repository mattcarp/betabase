/**
 * Semantic Self-Healing Page Helper
 *
 * Provides intelligent selector recovery based on semantic similarity.
 * When a selector fails, it analyzes the page for semantically equivalent elements.
 */

import { Page, Locator } from '@playwright/test';

// Common abbreviation mappings for semantic matching
const SEMANTIC_EQUIVALENTS: Record<string, string[]> = {
  button: ['btn', 'button', 'submit', 'action'],
  btn: ['button', 'btn', 'submit', 'action'],
  input: ['field', 'input', 'textbox', 'entry'],
  field: ['input', 'field', 'textbox', 'entry'],
  username: ['user', 'username', 'email', 'login', 'userid'],
  user: ['username', 'user', 'email', 'login', 'userid'],
  password: ['pass', 'password', 'pwd', 'secret'],
  pass: ['password', 'pass', 'pwd', 'secret'],
  login: ['signin', 'login', 'auth', 'authenticate', 'logon'],
  signin: ['login', 'signin', 'sign-in', 'auth', 'authenticate'],
  submit: ['send', 'submit', 'go', 'confirm', 'ok'],
  sso: ['oauth', 'sso', 'microsoft', 'google', 'social'],
  forgot: ['reset', 'forgot', 'recover', 'forgotten'],
};

// Calculate Levenshtein distance between two strings
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

// Calculate semantic similarity between two selector identifiers
function calculateSemanticSimilarity(
  original: string,
  candidate: string
): { score: number; reasoning: string } {
  const origLower = original.toLowerCase();
  const candLower = candidate.toLowerCase();

  // Exact match
  if (origLower === candLower) {
    return { score: 1.0, reasoning: 'Exact match' };
  }

  // Extract meaningful parts (split on common delimiters)
  const origParts = origLower.split(/[-_]/);
  const candParts = candLower.split(/[-_]/);

  let matchedParts = 0;
  let semanticMatches: string[] = [];
  let reasons: string[] = [];

  for (const origPart of origParts) {
    for (const candPart of candParts) {
      // Direct part match
      if (origPart === candPart) {
        matchedParts++;
        reasons.push(`"${origPart}" = "${candPart}" (exact)`);
        continue;
      }

      // Check semantic equivalents
      const origEquivalents = SEMANTIC_EQUIVALENTS[origPart] || [];
      const candEquivalents = SEMANTIC_EQUIVALENTS[candPart] || [];

      if (origEquivalents.includes(candPart) || candEquivalents.includes(origPart)) {
        matchedParts += 0.9; // High score for semantic equivalence
        semanticMatches.push(`"${origPart}" ~ "${candPart}"`);
        reasons.push(`"${origPart}" is semantically equivalent to "${candPart}"`);
        continue;
      }

      // Calculate string similarity for fuzzy matching
      const maxLen = Math.max(origPart.length, candPart.length);
      if (maxLen > 0) {
        const distance = levenshteinDistance(origPart, candPart);
        const similarity = 1 - distance / maxLen;

        if (similarity > 0.7) {
          matchedParts += similarity * 0.7;
          reasons.push(
            `"${origPart}" similar to "${candPart}" (${(similarity * 100).toFixed(0)}% string similarity)`
          );
        }
      }
    }
  }

  // Calculate overall score
  const totalParts = Math.max(origParts.length, candParts.length);
  const score = Math.min(1.0, matchedParts / totalParts);

  // Build reasoning string
  let reasoning = '';
  if (semanticMatches.length > 0) {
    reasoning = `Semantic equivalence detected: ${semanticMatches.join(', ')}. `;
  }
  if (reasons.length > 0) {
    reasoning += reasons.join('; ');
  }

  return { score, reasoning };
}

export interface HealingContext {
  context?: string; // What the element is for
  expectedRole?: string; // button, textbox, etc.
  expectedAction?: string; // What action is being performed
}

export interface HealingResult {
  healed: boolean;
  originalSelector: string;
  newSelector: string | null;
  confidence: number;
  reasoning: string;
  candidates?: CandidateMatch[];
}

interface CandidateMatch {
  selector: string;
  testId: string;
  score: number;
  reasoning: string;
}

export class SemanticSelfHealingPage {
  constructor(private page: Page) {}

  /**
   * Extract the test-id value from a selector
   */
  private extractTestId(selector: string): string | null {
    const match = selector.match(/\[data-test-id="([^"]+)"\]/);
    return match ? match[1] : null;
  }

  /**
   * Find all elements with data-test-id attributes on the page
   */
  private async findAllTestIdElements(): Promise<
    { testId: string; element: Locator; tagName: string }[]
  > {
    const elements = await this.page.locator('[data-test-id]').all();
    const results = [];

    for (const element of elements) {
      const testId = await element.getAttribute('data-test-id');
      const tagName = await element.evaluate((el) => el.tagName.toLowerCase());
      if (testId) {
        results.push({ testId, element, tagName });
      }
    }

    return results;
  }

  /**
   * Find the best semantic match for a broken selector
   */
  private async findSemanticMatch(
    originalSelector: string,
    context: HealingContext
  ): Promise<HealingResult> {
    const originalTestId = this.extractTestId(originalSelector);

    if (!originalTestId) {
      return {
        healed: false,
        originalSelector,
        newSelector: null,
        confidence: 0,
        reasoning: 'Could not extract test-id from original selector',
      };
    }

    console.log(`\n    [HEALING] Analyzing semantic alternatives for: "${originalTestId}"`);

    const allElements = await this.findAllTestIdElements();
    const candidates: CandidateMatch[] = [];

    for (const { testId, element, tagName } of allElements) {
      // Skip if element not visible
      if (!(await element.isVisible())) continue;

      // Calculate semantic similarity
      const { score, reasoning } = calculateSemanticSimilarity(originalTestId, testId);

      // Apply role bonus if expected role matches
      let adjustedScore = score;
      if (context.expectedRole) {
        const roleMatches =
          (context.expectedRole === 'button' && tagName === 'button') ||
          (context.expectedRole === 'textbox' && (tagName === 'input' || tagName === 'textarea'));

        if (roleMatches) {
          adjustedScore = Math.min(1.0, score + 0.1);
        }
      }

      if (adjustedScore > 0.3) {
        candidates.push({
          selector: `[data-test-id="${testId}"]`,
          testId,
          score: adjustedScore,
          reasoning,
        });
      }
    }

    // Sort by score descending
    candidates.sort((a, b) => b.score - a.score);

    // Log all candidates for transparency
    if (candidates.length > 0) {
      console.log(`    [HEALING] Found ${candidates.length} candidate(s):`);
      candidates.forEach((c, i) => {
        console.log(
          `              ${i + 1}. "${c.testId}" (${(c.score * 100).toFixed(1)}% confidence)`
        );
        console.log(`                 Reason: ${c.reasoning}`);
      });
    }

    const bestMatch = candidates[0];

    if (bestMatch && bestMatch.score >= 0.6) {
      console.log(`\n    [HEALING] Selected: "${bestMatch.testId}"`);
      console.log(`              Confidence: ${(bestMatch.score * 100).toFixed(1)}%`);
      console.log(`              Reasoning: ${bestMatch.reasoning}`);

      return {
        healed: true,
        originalSelector,
        newSelector: bestMatch.selector,
        confidence: bestMatch.score,
        reasoning: bestMatch.reasoning,
        candidates,
      };
    }

    return {
      healed: false,
      originalSelector,
      newSelector: null,
      confidence: bestMatch?.score || 0,
      reasoning: 'No suitable semantic match found (confidence threshold: 60%)',
      candidates,
    };
  }

  /**
   * Click with semantic self-healing
   */
  async clickWithHealing(
    selector: string,
    context: HealingContext = {}
  ): Promise<HealingResult> {
    // First, try the original selector
    try {
      const element = this.page.locator(selector);
      if (await element.isVisible({ timeout: 1000 })) {
        await element.click();
        return {
          healed: false,
          originalSelector: selector,
          newSelector: selector,
          confidence: 1.0,
          reasoning: 'Original selector worked',
        };
      }
    } catch {
      // Selector failed, proceed to healing
    }

    console.log(`    [HEALING] Original selector failed: ${selector}`);

    // Attempt semantic healing
    const result = await this.findSemanticMatch(selector, context);

    if (result.healed && result.newSelector) {
      // Try the healed selector
      try {
        await this.page.locator(result.newSelector).click();
        console.log(`    [HEALING] Successfully clicked with healed selector`);
        return result;
      } catch (error) {
        return {
          ...result,
          healed: false,
          reasoning: `Healing found match but click failed: ${error}`,
        };
      }
    }

    return result;
  }

  /**
   * Fill input with semantic self-healing
   */
  async fillWithHealing(
    selector: string,
    value: string,
    context: HealingContext = {}
  ): Promise<HealingResult> {
    // First, try the original selector
    try {
      const element = this.page.locator(selector);
      if (await element.isVisible({ timeout: 1000 })) {
        await element.fill(value);
        return {
          healed: false,
          originalSelector: selector,
          newSelector: selector,
          confidence: 1.0,
          reasoning: 'Original selector worked',
        };
      }
    } catch {
      // Selector failed, proceed to healing
    }

    console.log(`    [HEALING] Original selector failed: ${selector}`);

    // Attempt semantic healing
    const result = await this.findSemanticMatch(selector, {
      ...context,
      expectedRole: context.expectedRole || 'textbox',
    });

    if (result.healed && result.newSelector) {
      try {
        await this.page.locator(result.newSelector).fill(value);
        console.log(`    [HEALING] Successfully filled with healed selector`);
        return result;
      } catch (error) {
        return {
          ...result,
          healed: false,
          reasoning: `Healing found match but fill failed: ${error}`,
        };
      }
    }

    return result;
  }
}
