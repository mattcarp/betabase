/**
 * DDP Components
 *
 * Components for uploading and displaying DDP (Disc Description Protocol) masters.
 */

export { DDPDisplay } from './DDPDisplay';
export { DDPUploader } from './DDPUploader';

// Re-export types
export type { ParsedDDP, DDPTrack, DDPDetectionResult } from '@/types/ddp';
export type { MusicBrainzLookupResult, MusicBrainzRelease } from '@/services/musicBrainz';

// Re-export hook
export { useDDPParser } from '@/hooks/useDDPParser';
