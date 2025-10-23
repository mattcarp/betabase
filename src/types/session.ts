/**
 * Session Types for TestSprite Playback Sessions
 */

export type SessionStatus = "in-progress" | "completed" | "has-issues";

export interface Session {
  id: string;
  name: string;
  aut: string; // Application Under Test
  duration: number; // in seconds
  interactionCount: number;
  testerName: string;
  date: Date;
  status: SessionStatus;
  thumbnailUrl?: string;
  notes?: string;
  tags?: string[];
}

export interface SessionFilters {
  dateRange?: {
    start: Date;
    end: Date;
  };
  tester?: string;
  aut?: string;
  status?: SessionStatus;
  searchQuery?: string;
}
