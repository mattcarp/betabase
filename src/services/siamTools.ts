/**
 * SIAM AI SDK Tools
 * 
 * These tools let the LLM decide when and how to search,
 * replacing manual keyword-based orchestration.
 * 
 * The model calls these tools as needed based on the user's question.
 * This is more accurate than regex/keyword matching.
 */

import { tool } from 'ai';
import { z } from 'zod';
import { getSupabaseVectorService } from './supabaseVectorService';
import { DEFAULT_APP_CONTEXT } from '@/lib/supabase';
import type { VectorSearchResult } from '@/lib/supabase';

// Import the existing CDTEXT tool (it's already well-implemented!)
import { cdtextTool } from '@/tools/cdtext';

// ============================================
// Tool 1: Search Knowledge Base
// ============================================
export const searchKnowledge = tool({
  description: `Search the AOMA knowledge base for documentation, guides, how-tos, and general information about the Asset and Offering Management Application. Use this for questions about:
    - What is AOMA / how does X work
    - Documentation and guides
    - Best practices and workflows
    - General product information`,
  parameters: z.object({
    query: z.string().describe('The search query - be specific about what information you need'),
    maxResults: z.number().optional().default(5).describe('Maximum number of results to return'),
  }),
  execute: async ({ query, maxResults = 5 }) => {
    console.log(`🔧 [Tool: searchKnowledge] Query: "${query}"`);

    const vectorService = getSupabaseVectorService();
    // Search ALL relevant sources including jira (where AOMA info often lives)
    const results = await vectorService.searchVectors(query, {
      ...DEFAULT_APP_CONTEXT,
      matchThreshold: 0.40, // Lower threshold to catch more relevant results
      matchCount: maxResults,
      sourceTypes: ['knowledge', 'firecrawl', 'confluence', 'jira'],
    });

    if (!results || results.length === 0) {
      return { found: false, message: 'No relevant documentation found.' };
    }

    return {
      found: true,
      count: results.length,
      results: results.map(r => ({
        content: r.content,
        title: r.metadata?.title || 'Knowledge Base',
        source: r.source_type,
        relevance: Math.round(r.similarity * 100),
      })),
    };
  },
});

// ============================================
// Tool 2: Search Jira Tickets
// ============================================
export const searchJira = tool({
  description: `Search Jira tickets for bugs, features, tasks, and project status. Use this for questions about:
    - Bug reports and issues
    - Feature requests
    - Sprint/project status
    - Specific ticket details (e.g., AOMA-1234)
    - Work in progress`,
  parameters: z.object({
    query: z.string().describe('Search query for Jira tickets'),
    ticketKey: z.string().optional().describe('Specific ticket key like AOMA-1234 or UST-567'),
    maxResults: z.number().optional().default(10).describe('Maximum tickets to return'),
  }),
  execute: async ({ query, ticketKey, maxResults = 10 }) => {
    console.log(`🔧 [Tool: searchJira] Query: "${query}", Ticket: ${ticketKey || 'none'}`);
    
    const vectorService = getSupabaseVectorService();
    
    // If specific ticket requested, search for that exact key
    const searchQuery = ticketKey ? `${ticketKey} ${query}` : query;
    
    const results = await vectorService.searchVectors(searchQuery, {
      ...DEFAULT_APP_CONTEXT,
      matchThreshold: 0.45,
      matchCount: maxResults,
      sourceTypes: ['jira'],
    });

    if (!results || results.length === 0) {
      return { found: false, message: 'No matching Jira tickets found.' };
    }

    return {
      found: true,
      count: results.length,
      tickets: results.map(r => ({
        key: r.metadata?.ticket_key || r.source_id,
        summary: r.metadata?.summary || r.content.substring(0, 200),
        status: r.metadata?.status,
        priority: r.metadata?.priority,
        assignee: r.metadata?.assignee,
        content: r.content,
        relevance: Math.round(r.similarity * 100),
      })),
    };
  },
});

// ============================================
// Tool 3: Search Codebase
// ============================================
export const searchCode = tool({
  description: `Search the AOMA codebase for implementations, functions, components, and file locations. Use this for questions about:
    - Where is X implemented
    - How does the code handle Y
    - Which file contains Z
    - Show me the reducer/component/service for X
    - Code architecture questions`,
  parameters: z.object({
    query: z.string().describe('What to search for in the code'),
    filePattern: z.string().optional().describe('File pattern like "*.reducer.ts" or "*.service.ts"'),
    maxResults: z.number().optional().default(5).describe('Maximum code snippets to return'),
  }),
  execute: async ({ query, filePattern, maxResults = 5 }) => {
    console.log(`🔧 [Tool: searchCode] Query: "${query}", Pattern: ${filePattern || 'any'}`);
    
    const vectorService = getSupabaseVectorService();
    
    // Enhance query with Angular/ngrx terms for better code matching
    let enhancedQuery = query;
    if (query.toLowerCase().includes('reducer')) {
      enhancedQuery = `ngrx reducer createReducer on ${query}`;
    } else if (query.toLowerCase().includes('component')) {
      enhancedQuery = `angular component @Component ${query}`;
    } else if (query.toLowerCase().includes('service')) {
      enhancedQuery = `angular service @Injectable ${query}`;
    }
    
    const results = await vectorService.searchVectors(enhancedQuery, {
      ...DEFAULT_APP_CONTEXT,
      matchThreshold: 0.40, // Lower threshold for code (embeddings vary more)
      matchCount: maxResults,
      sourceTypes: ['code', 'git'],
    });

    if (!results || results.length === 0) {
      return { found: false, message: 'No matching code found.' };
    }

    return {
      found: true,
      count: results.length,
      files: results.map(r => ({
        filePath: r.metadata?.file_path || r.source_id,
        content: r.content,
        language: r.metadata?.language || 'typescript',
        lines: r.metadata?.line_start && r.metadata?.line_end 
          ? `${r.metadata.line_start}-${r.metadata.line_end}` 
          : undefined,
        relevance: Math.round(r.similarity * 100),
      })),
    };
  },
});

// ============================================
// Tool 4: Search Git Commits
// ============================================
export const searchCommits = tool({
  description: `Search Git commit history for changes, who changed what, and when. Use this for questions about:
    - Recent changes to X
    - Who modified Y
    - When was Z changed
    - Commit history for a feature`,
  parameters: z.object({
    query: z.string().describe('What changes to search for'),
    author: z.string().optional().describe('Filter by commit author'),
    maxResults: z.number().optional().default(10).describe('Maximum commits to return'),
  }),
  execute: async ({ query, author, maxResults = 10 }) => {
    console.log(`🔧 [Tool: searchCommits] Query: "${query}", Author: ${author || 'any'}`);
    
    const vectorService = getSupabaseVectorService();
    
    const searchQuery = author ? `${query} author:${author}` : query;
    
    const results = await vectorService.searchVectors(searchQuery, {
      ...DEFAULT_APP_CONTEXT,
      matchThreshold: 0.45,
      matchCount: maxResults,
      sourceTypes: ['git'],
    });

    if (!results || results.length === 0) {
      return { found: false, message: 'No matching commits found.' };
    }

    return {
      found: true,
      count: results.length,
      commits: results.map(r => ({
        sha: r.metadata?.sha?.substring(0, 7),
        message: r.metadata?.message || r.content.substring(0, 200),
        author: r.metadata?.author,
        date: r.metadata?.date || r.created_at,
        relevance: Math.round(r.similarity * 100),
      })),
    };
  },
});

// ============================================
// Tool 5: Parse CDTEXT (Using existing implementation)
// ============================================
// Re-export the existing well-implemented CDTEXT tool
export const parseCdtext = cdtextTool;

// ============================================
// Tool 6: Get Ticket Count
// ============================================
export const getTicketCount = tool({
  description: `Get the count of Jira tickets matching certain criteria. Use this for questions like:
    - How many open bugs are there?
    - Count of tickets in the current sprint
    - Number of issues assigned to X`,
  parameters: z.object({
    query: z.string().describe('What to count'),
    status: z.enum(['open', 'closed', 'in_progress', 'any']).optional().default('any'),
  }),
  execute: async ({ query, status = 'any' }) => {
    console.log(`🔧 [Tool: getTicketCount] Query: "${query}", Status: ${status}`);
    
    const vectorService = getSupabaseVectorService();
    
    // Search with higher count to get approximate total
    const results = await vectorService.searchVectors(query, {
      ...DEFAULT_APP_CONTEXT,
      matchThreshold: 0.40,
      matchCount: 50, // Get more to count
      sourceTypes: ['jira'],
    });

    // Filter by status if specified
    let filtered = results || [];
    if (status !== 'any' && filtered.length > 0) {
      filtered = filtered.filter(r => {
        const ticketStatus = (r.metadata?.status || '').toLowerCase();
        switch (status) {
          case 'open': return ['open', 'to do', 'new', 'backlog'].includes(ticketStatus);
          case 'closed': return ['done', 'closed', 'resolved'].includes(ticketStatus);
          case 'in_progress': return ['in progress', 'in review', 'testing'].includes(ticketStatus);
          default: return true;
        }
      });
    }

    return {
      count: filtered.length,
      query,
      status,
      note: filtered.length >= 50 ? 'Count may be approximate (>50 results)' : undefined,
    };
  },
});

// ============================================
// Tool 7: Get Application ERD
// ============================================
export const getMultiTenantERD = tool({
  description: `Returns the multi-tenant hierarchy diagram (3 tables: Organization, Division, Application).
  Use this when the user asks about:
  - ERD / entity relationship diagram
  - Multi-tenant architecture / hierarchy
  - Tenant structure
  - Organization/division/application relationships

  IMPORTANT: After calling this tool, you MUST:
  1. Render the mermaidDiagram field as a Mermaid code block (use \`\`\`mermaid)
  2. Explain the structure using the explanation field
  3. Tell the user they can say "make it fancier" to see an enhanced NanoBanana Pro version`,
  parameters: z.object({}),
  execute: async () => {
    console.log(`🔧 [Tool: getMultiTenantERD] Returning multi-tenant hierarchy`);

    return {
      title: "Multi-Tenant Hierarchy",
      description: "3-level tenant structure showing organizations, divisions, and applications",
      mermaidDiagram: `erDiagram
    ORGANIZATION ||--o{ DIVISION : "has many"
    DIVISION ||--o{ APPLICATION : "has many"

    ORGANIZATION {
        string name PK "sony-music, smej, sony-pictures"
        string description
    }

    DIVISION {
        string name PK "digital-operations"
        string organization FK "sony-music"
        string description
    }

    APPLICATION {
        string name PK "aoma, media-conversion, promo"
        string organization FK "sony-music"
        string division FK "digital-operations"
        string description
    }`,
      explanation: "Multiple organizations supported (sony-music, smej, sony-pictures). Each organization can have multiple divisions. Each division can have multiple applications. Example shown for sony-music only.",
      exampleHierarchy: {
        organizations: ["sony-music", "smej", "sony-pictures"],
        "sony-music": {
          divisions: [
            {
              name: "digital-operations",
              applications: ["aoma", "media-conversion", "promo"]
            }
          ]
        },
        "smej": {
          note: "Separate organization (Sony Music Japan) - no details shown"
        },
        "sony-pictures": {
          note: "Separate organization - no details shown"
        }
      },
      nanoBananaProPrompt: `Create a professional multi-tenant architecture infographic in a sketchy, hand-drawn style with soft pastel colors.

LAYOUT (horizontal flow, left to right):

**TIER 1 - ORGANIZATION LEVEL** (top banner, 3 organizations)
- Left: "SONY MUSIC" in a cloud shape with music note icon, briefcase icon
- Center: "SMEJ" in a cloud shape with globe icon
  - Has "..." below it (no further details)
- Right: "SONY PICTURES" in a cloud shape with film/camera icon
  - Has "..." below it (no further details)
- Between all orgs: dotted lines with lock icons and red X marks, labeled "ISOLATED DATA DOMAIN"

**TIER 2 - DIVISION LEVEL** (middle section, ONLY under Sony Music)
One rounded rectangle:
- "DIGITAL OPERATIONS" - gear icon, cloud icon, people collaborating icon
  - Action words around it: MANAGE, PROCESS, DATA FLOW, UTILIZE, EXECUTE

**TIER 3 - APPLICATION LEVEL** (bottom, only under Digital Operations)
Three rounded rectangles in a row:
1. "AOMA" - rocket icon, database icon
   - Subtitle: "Advanced Operations Management App"
   - Action words: ANALYZE, MONITOR, CONTROL
2. "MEDIA CONVERSION" - video/audio icon, transform arrows
   - Subtitle: "Asset Format Converter"
   - Action words: CONVERT, PROCESS, TRANSCODE
3. "PROMO" - megaphone icon, calendar icon
   - Subtitle: "Promotional Campaign Manager"
   - Action words: SCHEDULE, TRACK, OPTIMIZE

STYLE:
- Soft blue background for entire diagram
- Cream/beige color for application boxes (Tier 3)
- Light gray for division boxes (Tier 2)
- White/light clouds for organization boxes (Tier 1)
- Dotted connector lines between levels (only from Sony Music downward)
- Red X marks showing data isolation between organizations
- Lock icons for security/isolation
- Small stick figure people icons
- Sketchy/hand-drawn line style throughout
- Clean, professional but friendly aesthetic
- Title at top: "MULTI-TENANT ENTERPRISE ARCHITECTURE"

IMPORTANT: Only Sony Music has divisions and applications below it. SMEJ and Sony Pictures stand alone with no connections downward.`
    };
  },
});

// ============================================
// Tool 8: Asset Ingestion Workflow
// ============================================
export const getAssetIngestionWorkflow = tool({
  description: `Returns the AOMA asset ingestion workflow diagram.
  Use this when the user asks about:
  - Asset ingestion workflow
  - How assets are ingested
  - The flow of data into AOMA
  - "show me a diagram of the AOMA asset ingestion workflow"

  IMPORTANT: After calling this tool, you MUST:
  1. Render the mermaidDiagram field as a Mermaid code block
  2. Explain the workflow using the explanation field`,
  parameters: z.object({}),
  execute: async () => {
    console.log(`🔧 [Tool: getAssetIngestionWorkflow] Returning workflow diagram`);
    return {
      title: "AOMA Asset Ingestion Workflow",
      mermaidDiagram: `graph TD
    User[User] -->|Uploads DDP| UploadZone[Upload Zone]
    UploadZone -->|Trigger| IngestionService[Ingestion Service]
    IngestionService -->|Validate| Validation{Valid?}
    Validation -->|No| Reject[Reject & Notify]
    Validation -->|Yes| Parse[Parse Metadata]
    Parse -->|Extract| CDText[CD-TEXT]
    Parse -->|Extract| ISRC[ISRC Codes]
    CDText --> DB[(AOMA Database)]
    ISRC --> DB
    DB -->|Index| VectorDB[(Vector Store)]
    VectorDB -->|Ready| Search[Searchable]`,
      explanation: "The ingestion process starts with a user upload. The system validates the DDP file, parses metadata (CD-TEXT, ISRC), stores it in the relational database, and indexes it in the vector store for AI retrieval."
    };
  },
});

// ============================================
// Export all tools as a single object
// ============================================
export const siamTools = {
  searchKnowledge,
  searchJira,
  searchCode,
  searchCommits,
  parseCdtext,
  getTicketCount,
  getMultiTenantERD,
  getAssetIngestionWorkflow,
};

// Type for tool results (useful for client-side)
export type SIAMToolName = keyof typeof siamTools;
