/**
 * Session Timeline Types
 * Data structures for captured user interactions during test sessions
 */

export type InteractionType =
  | "click"
  | "type"
  | "navigate"
  | "scroll"
  | "hover"
  | "select"
  | "submit"
  | "error"
  | "assertion"
  | "screenshot"
  | "network";

export type InteractionStatus = "success" | "warning" | "error" | "info";

export interface SessionInteraction {
  id: string;
  type: InteractionType;
  timestamp: number;
  description: string;
  elementDescription?: string;
  selector?: string;
  value?: string;
  url?: string;
  status: InteractionStatus;
  duration?: number;
  thumbnail?: string; // Base64 or URL to screenshot thumbnail
  metadata?: {
    xpath?: string;
    tagName?: string;
    classList?: string[];
    innerText?: string;
    attributes?: Record<string, string>;
  };
  networkData?: {
    method: string;
    url: string;
    statusCode: number;
    duration: number;
    size: string;
    headers?: Record<string, string>;
  };
  error?: {
    message: string;
    stack?: string;
  };
}

export interface SessionTimelineFilter {
  types?: InteractionType[];
  statuses?: InteractionStatus[];
  searchQuery?: string;
  timeRange?: {
    start: number;
    end: number;
  };
}

export interface SessionTimelineProps {
  interactions: SessionInteraction[];
  currentInteractionId?: string;
  onInteractionClick?: (interaction: SessionInteraction) => void;
  onFilterChange?: (filter: SessionTimelineFilter) => void;
  cclassName?: string;
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export interface SessionTimelineState {
  filter: SessionTimelineFilter;
  searchQuery: string;
  isExpanded: boolean;
  width: number;
  selectedInteractionId?: string;
}
