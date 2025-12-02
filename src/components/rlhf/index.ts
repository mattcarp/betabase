/**
 * RLHF (Reinforcement Learning from Human Feedback) Components
 *
 * State-of-the-art HITL (Human-in-the-Loop) feedback collection system
 * implementing best practices from:
 * - LangSmith annotation workflows
 * - DPO (Direct Preference Optimization) data collection patterns
 * - OpenAI/Anthropic feedback UI patterns
 *
 * Components:
 * - FeedbackModal: Rich feedback collection with categories and comments
 * - ComparisonPanel: Side-by-side A/B response comparison for DPO
 * - FeedbackImpactLive: Real-time visualization of feedback impact
 * - CuratorWorkspace: Queue-based annotation workflow for curators
 * - FeedbackAnalytics: Dashboard showing trends and insights
 * - FeedbackBadge: Inline feedback indicator on messages
 *
 * @module rlhf
 */

export { FeedbackModal, type FeedbackData } from "./FeedbackModal";
export { ComparisonPanel, type ComparisonData } from "./ComparisonPanel";
export { FeedbackImpactLive } from "./FeedbackImpactLive";
export { CuratorWorkspace } from "./CuratorWorkspace";
export { CuratorWorkspaceContainer } from "./CuratorWorkspaceContainer";
export { FeedbackAnalytics } from "./FeedbackAnalytics";
export { FeedbackBadge, type FeedbackBadgeData } from "./FeedbackBadge";
export {
  useFeedback,
  useQuickFeedback,
  useDetailedFeedback,
  useFeedbackEvents,
  FeedbackProvider,
} from "./FeedbackContext";
export type {
  FeedbackCategory,
  FeedbackSeverity,
  FeedbackStatus,
  FeedbackRecord,
  FeedbackMetrics,
  FeedbackEvent,
  AnnotationQueueItem,
  CuratorAction,
  ComparisonPair,
  DPOTrainingExample,
  DocumentRelevance,
  RagMetadata,
} from "./types";
