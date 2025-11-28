/**
 * Demo Enhancements for Chat Pillar
 *
 * These components make the impressive RAG features more visible
 * for the ~90 second chat segment in the demo video.
 *
 * Philosophy: Don't rewrite - just make the impressive parts more visible.
 */

// 1. Inline Source Cards - prominent attribution while AI responds
export { SourceCard } from "./SourceCard";

// 2. Confidence Badges - show system self-awareness
export { ConfidenceBadge } from "./ConfidenceBadge";

// 3. RAG Context Viewer - let technical folks see under the hood
export { RAGContextViewer } from "./RAGContextViewer";

// 4. Hero Metrics Strip - display "45,399 vectors" at a glance
export { HeroMetricsStrip } from "./HeroMetricsStrip";

// 5. Demo Mode - pre-loaded queries for smooth recording
export { DemoMode, useDemoMode } from "./DemoMode";

// 6. Background Diagram Offer - non-blocking "Would you like a diagram?" UX
export { DiagramOffer, useDiagramOffer } from "./DiagramOffer";
