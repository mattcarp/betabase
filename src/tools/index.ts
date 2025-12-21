/**
 * SIAM Tools Index
 * 
 * Export all tools for use with AI SDK's streamText/generateText.
 * 
 * Usage:
 * ```typescript
 * import { siamTools } from '@/tools';
 * 
 * const result = streamText({
 *   model: google('gemini-2.0-flash'),
 *   tools: siamTools,
 *   maxSteps: 5,
 * });
 * ```
 */

export { cdtextTool } from './cdtext';
export { musicbrainzLookupTool } from './musicbrainz';

// Future tools:
// export { searchKnowledgeTool } from './searchKnowledge';
// export { searchJiraTool } from './searchJira';
// export { searchCodeTool } from './searchCode';

// Convenience export of all tools as an object
import { cdtextTool } from './cdtext';
import { musicbrainzLookupTool } from './musicbrainz';

export const siamTools = {
  parseCdtext: cdtextTool,
  lookupMusicbrainz: musicbrainzLookupTool,
  // searchKnowledge: searchKnowledgeTool,
  // searchJira: searchJiraTool,
  // searchCode: searchCodeTool,
};
