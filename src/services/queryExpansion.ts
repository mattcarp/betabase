/**
 * Query Expansion Service
 *
 * Expands user queries to improve RAG retrieval by:
 * 1. Expanding acronyms to their full forms
 * 2. Adding semantic variations
 * 3. Including common synonyms
 *
 * This is the #1 highest-impact RAG improvement (2-4 hours implementation).
 * Can boost relevant retrievals by 30-50%.
 */

// Sony Music domain acronyms
const ACRONYM_EXPANSIONS: Record<string, string[]> = {
  // Core Sony Music systems
  'aoma': ['Asset and Offering Management Application', 'AOMA platform', 'AOMA system'],
  'siam': ['Sony Intelligent Assistant for Music', 'SIAM chatbot', 'SIAM assistant'],
  'dam': ['Digital Asset Management', 'DAM system', 'digital asset manager'],
  'usm': ['Unified Session Manager', 'USM service', 'session management'],
  'mc': ['Media Conversion', 'MC workflow', 'media conversion process'],

  // Music industry standards
  'isrc': ['International Standard Recording Code', 'ISRC code', 'recording identifier'],
  'upc': ['Universal Product Code', 'UPC barcode', 'product barcode'],
  'ddex': ['Digital Data Exchange', 'DDEX standard', 'music metadata exchange'],
  'ddp': ['Disc Description Protocol', 'DDP master', 'CD master format'],
  'cdtext': ['CD-TEXT', 'compact disc text', 'CD metadata'],

  // Technical terms
  'api': ['Application Programming Interface', 'API endpoint', 'REST API'],
  'mcp': ['Model Context Protocol', 'MCP server', 'MCP integration'],
  'rag': ['Retrieval Augmented Generation', 'RAG pipeline', 'retrieval system'],
  'llm': ['Large Language Model', 'language model', 'AI model'],
  'sso': ['Single Sign-On', 'SSO authentication', 'federated login'],
  'jwt': ['JSON Web Token', 'JWT authentication', 'bearer token'],

  // Sony Music specific
  'orchard': ['The Orchard', 'Orchard distribution', 'Orchard platform'],
  'awal': ['AWAL', 'Artists Without A Label', 'AWAL distribution'],
};

// Semantic variations for common query patterns
const SEMANTIC_EXPANSIONS: Record<string, string[]> = {
  'what is': ['explain', 'define', 'describe', 'overview of'],
  'how to': ['how do I', 'steps to', 'guide for', 'tutorial'],
  'why': ['reason for', 'purpose of', 'explanation for'],
  'where': ['location of', 'find', 'locate'],
  'error': ['issue', 'problem', 'bug', 'failure', 'not working'],
  'fix': ['resolve', 'solve', 'repair', 'debug'],
};

export interface QueryExpansionResult {
  originalQuery: string;
  expandedQuery: string;
  expansions: {
    type: 'acronym' | 'semantic' | 'synonym';
    original: string;
    expanded: string;
  }[];
  wasExpanded: boolean;
}

/**
 * Expand a query by replacing acronyms and adding semantic variations
 */
export function expandQuery(query: string): QueryExpansionResult {
  const expansions: QueryExpansionResult['expansions'] = [];
  let expandedQuery = query;

  // Expand acronyms (case-insensitive)
  const queryLower = query.toLowerCase();

  for (const [acronym, fullForms] of Object.entries(ACRONYM_EXPANSIONS)) {
    // Match whole words only using word boundaries
    const regex = new RegExp(`\\b${acronym}\\b`, 'gi');

    if (regex.test(queryLower)) {
      // Add the primary expansion to the query
      const primaryExpansion = fullForms[0];

      // Check if the full form isn't already in the query
      if (!queryLower.includes(primaryExpansion.toLowerCase())) {
        // Append expansion in parentheses for context
        expandedQuery = expandedQuery.replace(
          regex,
          (match) => `${match} (${primaryExpansion})`
        );

        expansions.push({
          type: 'acronym',
          original: acronym.toUpperCase(),
          expanded: primaryExpansion,
        });
      }
    }
  }

  // Add semantic variations for question patterns
  for (const [pattern, variations] of Object.entries(SEMANTIC_EXPANSIONS)) {
    if (queryLower.startsWith(pattern)) {
      // Don't modify the query, but log that we could expand
      // This is useful for multi-query strategies
      expansions.push({
        type: 'semantic',
        original: pattern,
        expanded: variations[0],
      });
    }
  }

  return {
    originalQuery: query,
    expandedQuery,
    expansions,
    wasExpanded: expansions.length > 0,
  };
}

/**
 * Generate multiple query variations for multi-query retrieval
 * Returns the original + expanded versions for broader search
 */
export function generateQueryVariations(query: string, maxVariations: number = 3): string[] {
  const variations: string[] = [query];
  const expansion = expandQuery(query);

  // Add expanded query if different
  if (expansion.wasExpanded && expansion.expandedQuery !== query) {
    variations.push(expansion.expandedQuery);
  }

  // Add semantic variations
  const queryLower = query.toLowerCase();
  for (const [pattern, alts] of Object.entries(SEMANTIC_EXPANSIONS)) {
    if (queryLower.startsWith(pattern) && variations.length < maxVariations) {
      const variation = query.replace(new RegExp(`^${pattern}`, 'i'), alts[0]);
      if (!variations.includes(variation)) {
        variations.push(variation);
      }
    }
  }

  // Add "features capabilities overview" suffix for "what is" queries
  if (queryLower.startsWith('what is') && variations.length < maxVariations) {
    const enhancedQuery = `${query} features capabilities overview`;
    variations.push(enhancedQuery);
  }

  return variations.slice(0, maxVariations);
}

/**
 * Check if a query likely needs expansion (has unexpanded acronyms)
 */
export function needsExpansion(query: string): boolean {
  const queryLower = query.toLowerCase();

  for (const acronym of Object.keys(ACRONYM_EXPANSIONS)) {
    const regex = new RegExp(`\\b${acronym}\\b`, 'i');
    if (regex.test(queryLower)) {
      // Check if the full form is NOT already present
      const fullForm = ACRONYM_EXPANSIONS[acronym][0].toLowerCase();
      if (!queryLower.includes(fullForm)) {
        return true;
      }
    }
  }

  return false;
}

// Export acronyms for external use (e.g., grounding prompts)
export const DOMAIN_ACRONYMS = ACRONYM_EXPANSIONS;
