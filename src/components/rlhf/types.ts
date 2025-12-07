/**
 * RLHF Type Definitions
 *
 * Comprehensive types for the RLHF feedback system
 * supporting DPO training, curator workflows, and analytics
 */

/**
 * Categories for classifying feedback
 * Aligned with common RLHF annotation schemes
 */
export type FeedbackCategory =
  | "accuracy" // Factual correctness
  | "relevance" // How relevant the response is to the query
  | "completeness" // Whether all aspects were addressed
  | "clarity" // How clear and understandable
  | "helpfulness" // Overall usefulness
  | "safety" // Harmful or inappropriate content
  | "formatting" // Code blocks, markdown, structure
  | "citations" // Source attribution quality
  | "tone" // Professional, appropriate tone
  | "other"; // Catch-all

/**
 * Severity levels for issues identified
 */
export type FeedbackSeverity =
  | "critical" // Major factual error, safety issue
  | "major" // Significant issue affecting quality
  | "minor" // Small improvement opportunity
  | "suggestion"; // Nice-to-have enhancement

/**
 * Status of feedback in the curation workflow
 */
export type FeedbackStatus =
  | "pending" // Awaiting curator review
  | "reviewing" // Currently being reviewed
  | "approved" // Accepted for training
  | "rejected" // Not suitable for training
  | "needs_revision" // Requires additional annotation
  | "exported"; // Already exported for training

/**
 * Detailed feedback data structure
 */
export interface FeedbackRecord {
  id: string;
  conversationId: string;
  messageId: string;
  userQuery: string;
  aiResponse: string;

  // Basic feedback
  thumbsUp: boolean | null;
  rating: number | null; // 1-5 scale

  // Detailed feedback
  categories: FeedbackCategory[];
  severity: FeedbackSeverity | null;
  feedbackText: string | null;

  // Document relevance marking (for RAG)
  documentsMarked: DocumentRelevance[] | null;

  // Correction data (for DPO)
  suggestedCorrection: string | null;
  preferredResponse: string | null; // For A/B comparison

  // Metadata
  userEmail: string | null;
  sessionId: string | null;
  modelUsed: string | null;
  ragMetadata: RagMetadata | null;

  // Workflow
  status: FeedbackStatus;
  curatorId: string | null;
  curatorNotes: string | null;
  reviewedAt: string | null;

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

/**
 * Document relevance marking for RAG feedback
 */
export interface DocumentRelevance {
  documentId: string;
  title: string;
  snippet: string;
  relevant: boolean;
  relevanceScore: number | null; // 0-1
  notes: string | null;
}

/**
 * RAG metadata captured with feedback
 */
export interface RagMetadata {
  strategy: string;
  documentsUsed: number;
  confidence: number;
  timeMs: number;
  reranked: boolean;
  agentSteps: string[] | null;
}

/**
 * Item in the curator annotation queue
 */
export interface AnnotationQueueItem {
  id: string;
  feedback: FeedbackRecord;
  priority: number; // Higher = more urgent
  assignedTo: string | null;
  queueName: string;
  addedAt: string;
  dueBy: string | null;
  tags: string[];
}

/**
 * Action taken by a curator
 */
export interface CuratorAction {
  id: string;
  feedbackId: string;
  curatorId: string;
  action: "approve" | "reject" | "request_revision" | "add_correction" | "merge" | "split";
  notes: string | null;
  timestamp: string;
}

/**
 * Comparison data for A/B testing (DPO)
 */
export interface ComparisonPair {
  id: string;
  query: string;
  responseA: string;
  responseB: string;
  modelA: string;
  modelB: string;
  preferredResponse: "A" | "B" | "tie" | null;
  reason: string | null;
  annotatorId: string | null;
  createdAt: string;
}

/**
 * Aggregated feedback metrics
 */
export interface FeedbackMetrics {
  totalFeedback: number;
  positiveRate: number;
  averageRating: number;
  categoryBreakdown: Record<FeedbackCategory, number>;
  severityBreakdown: Record<FeedbackSeverity, number>;
  trendsLastDays: number[];
  curatorApprovalRate: number;
  avgReviewTimeHours: number;
}

/**
 * Training data export format (DPO-compatible)
 */
export interface DPOTrainingExample {
  prompt: string;
  chosen: string;
  rejected: string;
  metadata: {
    feedbackId: string;
    categories: FeedbackCategory[];
    curatorApproved: boolean;
    confidence: number;
  };
}

/**
 * Event emitted when feedback is submitted
 */
export interface FeedbackEvent {
  type: "submitted" | "updated" | "approved" | "rejected" | "exported";
  feedbackId: string;
  timestamp: string;
  data: Partial<FeedbackRecord>;
}
