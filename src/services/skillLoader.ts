/**
 * Skill Loader Service
 * 
 * Dynamically loads instruction "skills" based on query intent.
 * This prevents bloating the system prompt with instructions that
 * aren't relevant to the current query.
 * 
 * Part of Dynamic Prompt Injection - Phase 2
 * 
 * Token Savings:
 * - Base personality: ~200 tokens (always loaded)
 * - Each skill: ~300-800 tokens (loaded only when needed)
 * - Total system prompt: ~500-1500 tokens vs ~4000-5000
 */

import { readFileSync } from 'fs';
import { join } from 'path';

// Type definitions (previously from intentClassifier, now local since intent classifier was removed)
export type SourceType = 'knowledge' | 'jira' | 'git' | 'email' | 'firecrawl' | 'metrics';
export type QueryType = 'technical' | 'status' | 'communication' | 'procedural' | 'troubleshooting' | 'general';

// Skill definitions with their triggers and file paths
export interface SkillDefinition {
  id: string;
  name: string;
  fileName: string;
  triggerPatterns: RegExp[];  // Regex patterns that trigger this skill
  queryTypes: QueryType[];     // Query types that benefit from this skill
  sourceTypes: SourceType[];   // Source types that suggest this skill
  priority: number;            // Higher = loaded first (for ordering in prompt)
  estimatedTokens: number;     // Approximate token count
}

export const SKILL_DEFINITIONS: SkillDefinition[] = [
  {
    id: 'base-personality',
    name: 'Base Personality',
    fileName: 'base-personality.md',
    triggerPatterns: [], // Always loaded
    queryTypes: [],      // Always loaded regardless of type
    sourceTypes: [],     // Always loaded regardless of sources
    priority: 100,       // Highest priority - always first
    estimatedTokens: 200,
  },
  {
    id: 'cdtext-parsing',
    name: 'CDTEXT Parsing',
    fileName: 'cdtext-parsing.md',
    triggerPatterns: [
      /cdtext/i,
      /cd.?text/i,
      /hex\s*dump/i,
      /binary.*parse/i,
      /0x8[0-9a-f]/i,  // CDTEXT pack type bytes
      /\b[0-9a-f]{36,}\b/i, // Long hex strings (potential CDTEXT data)
    ],
    queryTypes: ['technical'],
    sourceTypes: [],
    priority: 50,
    estimatedTokens: 800,
  },
  {
    id: 'code-formatting',
    name: 'Code Formatting',
    fileName: 'code-formatting.md',
    triggerPatterns: [
      /show.*code/i,
      /implementation/i,
      /source\s*code/i,
      /where.*code/i,
      /which\s*file/i,
      /code\s*snippet/i,
      /generate.*code/i,
      /write.*code/i,
    ],
    queryTypes: ['technical'],
    sourceTypes: ['git'],
    priority: 60,
    estimatedTokens: 400,
  },
  {
    id: 'troubleshooting',
    name: 'Troubleshooting',
    fileName: 'troubleshooting.md',
    triggerPatterns: [
      /error/i,
      /failed/i,
      /not\s*working/i,
      /debug/i,
      /issue/i,
      /bug/i,
      /broken/i,
      /fix/i,
      /500\s*(error)?/i,
      /exception/i,
      /problem/i,        // Added: common troubleshooting keyword
      /timeout/i,        // Added: timeout issues
      /timing\s*out/i,   // Added: timing out variations
      /stuck/i,          // Added: stuck processes
      /slow/i,           // Added: performance issues
      /hanging/i,        // Added: hanging processes
    ],
    queryTypes: ['troubleshooting'],
    sourceTypes: ['jira'],
    priority: 70,
    estimatedTokens: 500,
  },
  {
    id: 'jira-analysis',
    name: 'Jira Analysis',
    fileName: 'jira-analysis.md',
    triggerPatterns: [
      /jira/i,
      /ticket/i,
      /sprint/i,
      /backlog/i,
      /epic/i,
      /story/i,
      /aoma-\d+/i,  // AOMA ticket pattern
    ],
    queryTypes: ['status'],
    sourceTypes: ['jira'],
    priority: 55,
    estimatedTokens: 300,
  },
  {
    id: 'demo-mode',
    name: 'Demo Mode',
    fileName: 'demo-mode.md',
    triggerPatterns: [
      /recording.*demo/i,
      /demo\s*mode/i,
      /presentation/i,
      /infographic/i,
      /format.*nicely/i,
    ],
    queryTypes: [],
    sourceTypes: [],
    priority: 90, // High priority - affects overall tone
    estimatedTokens: 150,
  },
];

// Cache for loaded skill content
const skillContentCache = new Map<string, string>();

/**
 * Get the skills directory path
 */
function getSkillsDir(): string {
  // In Next.js, we need to handle both dev and production paths
  // Try src/skills first (dev), then .next/server/skills (prod)
  const possiblePaths = [
    join(process.cwd(), 'src', 'skills'),
    join(process.cwd(), '.next', 'server', 'skills'),
    join(__dirname, 'skills'),
  ];
  
  return possiblePaths[0]; // Default to src/skills
}

/**
 * Load a skill's content from file
 */
function loadSkillContent(skill: SkillDefinition): string {
  // Check cache first
  const cached = skillContentCache.get(skill.id);
  if (cached) return cached;
  
  try {
    const skillPath = join(getSkillsDir(), skill.fileName);
    const content = readFileSync(skillPath, 'utf-8');
    skillContentCache.set(skill.id, content);
    return content;
  } catch (error) {
    console.warn(`[SkillLoader] Failed to load skill ${skill.id}:`, error);
    return '';
  }
}

/**
 * Determine which skills are relevant for a query
 */
export function identifyRelevantSkills(
  query: string,
  options?: {
    queryType?: QueryType;
    sourceTypes?: SourceType[];
    forceSkills?: string[];  // Skill IDs to always include
  }
): SkillDefinition[] {
  const relevantSkills: SkillDefinition[] = [];
  const seenIds = new Set<string>();
  
  // Always include base personality
  const baseSkill = SKILL_DEFINITIONS.find(s => s.id === 'base-personality');
  if (baseSkill) {
    relevantSkills.push(baseSkill);
    seenIds.add(baseSkill.id);
  }
  
  // Add forced skills
  if (options?.forceSkills) {
    for (const skillId of options.forceSkills) {
      const skill = SKILL_DEFINITIONS.find(s => s.id === skillId);
      if (skill && !seenIds.has(skill.id)) {
        relevantSkills.push(skill);
        seenIds.add(skill.id);
      }
    }
  }
  
  // Check each skill's triggers
  for (const skill of SKILL_DEFINITIONS) {
    if (seenIds.has(skill.id)) continue;
    
    let shouldInclude = false;
    
    // Check regex patterns against query
    for (const pattern of skill.triggerPatterns) {
      if (pattern.test(query)) {
        shouldInclude = true;
        break;
      }
    }
    
    // Check query type match
    if (!shouldInclude && options?.queryType && skill.queryTypes.includes(options.queryType)) {
      shouldInclude = true;
    }
    
    // Check source type match
    if (!shouldInclude && options?.sourceTypes) {
      for (const sourceType of options.sourceTypes) {
        if (skill.sourceTypes.includes(sourceType)) {
          shouldInclude = true;
          break;
        }
      }
    }
    
    if (shouldInclude) {
      relevantSkills.push(skill);
      seenIds.add(skill.id);
    }
  }
  
  // Sort by priority (descending)
  relevantSkills.sort((a, b) => b.priority - a.priority);
  
  return relevantSkills;
}

/**
 * Build a dynamic system prompt by loading only relevant skills
 */
export function buildDynamicPrompt(
  query: string,
  options?: {
    queryType?: QueryType;
    sourceTypes?: SourceType[];
    forceSkills?: string[];
    aomaContext?: string;  // RAG context to inject
  }
): { prompt: string; skills: string[]; estimatedTokens: number } {
  const relevantSkills = identifyRelevantSkills(query, options);
  
  // Load skill content
  const skillContents: string[] = [];
  let totalTokens = 0;
  
  for (const skill of relevantSkills) {
    const content = loadSkillContent(skill);
    if (content) {
      skillContents.push(content);
      totalTokens += skill.estimatedTokens;
    }
  }
  
  // Build the prompt
  let prompt = skillContents.join('\n\n---\n\n');
  
  // Inject AOMA context if provided
  if (options?.aomaContext) {
    prompt += `\n\n**YOUR KNOWLEDGE:**\n${options.aomaContext}`;
    totalTokens += Math.ceil(options.aomaContext.length / 4); // Rough token estimate
  }
  
  console.log(`[SkillLoader] Loaded ${relevantSkills.length} skills (~${totalTokens} tokens):`, 
    relevantSkills.map(s => s.id));
  
  return {
    prompt,
    skills: relevantSkills.map(s => s.id),
    estimatedTokens: totalTokens,
  };
}

/**
 * Clear the skill content cache (for development/testing)
 */
export function clearSkillCache(): void {
  skillContentCache.clear();
  console.log('[SkillLoader] Cache cleared');
}

/**
 * Get skill statistics
 */
export function getSkillStats(): {
  totalSkills: number;
  totalPossibleTokens: number;
  cachedSkills: number;
} {
  return {
    totalSkills: SKILL_DEFINITIONS.length,
    totalPossibleTokens: SKILL_DEFINITIONS.reduce((sum, s) => sum + s.estimatedTokens, 0),
    cachedSkills: skillContentCache.size,
  };
}
