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
    const results = await vectorService.searchVectors(query, {
      ...DEFAULT_APP_CONTEXT,
      matchThreshold: 0.50,
      matchCount: maxResults,
      sourceTypes: ['knowledge', 'firecrawl', 'confluence'],
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
export const getApplicationERD = tool({
  description: `Returns the multi-tenant hierarchy diagram for The Betabase/SIAM application.
  Use this when the user asks about:
  - The ERD for this application
  - Multi-tenant architecture
  - Organization structure
  - How tenancy works`,
  parameters: z.object({}),
  execute: async () => {
    console.log(`🔧 [Tool: getApplicationERD] Returning multi-tenant hierarchy`);

    return {
      title: "Multi-Tenant Hierarchy",
      description: "3-level tenant structure showing organizations, divisions, and applications",
      mermaidDiagram: `erDiagram
    ORGANIZATION ||--o{ DIVISION : "has many"
    DIVISION ||--o{ APPLICATION : "has many"

    ORGANIZATION {
        string name PK "e.g., sony-music"
        string description
    }

    DIVISION {
        string name PK "e.g., digital-operations"
        string organization FK
        string description
    }

    APPLICATION {
        string name PK "e.g., aoma, usm, dam"
        string organization FK
        string division FK
        string description
    }`,
      explanation: "Each organization can have multiple divisions. Each division can have multiple applications. All data is isolated by this 3-level hierarchy.",
      exampleHierarchy: {
        organization: "sony-music",
        divisions: [
          {
            name: "digital-operations",
            applications: ["aoma", "usm", "dam"]
          },
          {
            name: "label-services",
            applications: ["crm", "royalties"]
          }
        ]
      }
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
  getApplicationERD,
};

// Type for tool results (useful for client-side)
export type SIAMToolName = keyof typeof siamTools;
