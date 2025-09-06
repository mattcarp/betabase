/**
 * React Hook for Topic Extraction
 *
 * Provides easy integration of topic extraction service with React components.
 * Handles real-time updates, caching, and UI state management.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import {
  topicExtractionService,
  ExtractedTopic,
  TopicCluster,
  Document,
  DocumentType,
  ProcessingOptions,
} from "../services/topicExtractionService";

interface UseTopicExtractionState {
  // Topics
  topics: ExtractedTopic[];
  documentTopics: Map<string, ExtractedTopic[]>;
  trendingTopics: ExtractedTopic[];

  // Clusters
  clusters: TopicCluster[];

  // UI State
  isProcessing: boolean;
  isLoading: boolean;
  error: string | null;

  // Statistics
  totalTopics: number;
  totalDocuments: number;
  lastUpdated: Date | null;
}

interface UseTopicExtractionActions {
  // Document processing
  processDocument: (
    content: string,
    metadata?: {
      title?: string;
      type?: DocumentType;
      source?: string;
    },
    options?: ProcessingOptions,
  ) => Promise<ExtractedTopic[]>;

  processBatch: (
    documents: Array<{
      content: string;
      title?: string;
      type?: DocumentType;
      metadata?: Record<string, any>;
    }>,
    options?: ProcessingOptions,
  ) => Promise<void>;

  // Topic operations
  searchTopics: (query: string, limit?: number) => ExtractedTopic[];
  getDocumentTopics: (documentId: string) => ExtractedTopic[];
  findRelatedDocuments: (topicTerm: string, limit?: number) => Document[];

  // Cluster operations
  getClusters: () => TopicCluster[];
  getClusterByTopic: (topicTerm: string) => TopicCluster | undefined;

  // Utility
  clearCache: () => void;
  refreshTrendingTopics: () => void;
  exportTopics: () => string;
  importTopics: (jsonData: string) => boolean;
}

export function useTopicExtraction(): [
  UseTopicExtractionState,
  UseTopicExtractionActions,
] {
  const [state, setState] = useState<UseTopicExtractionState>({
    topics: [],
    documentTopics: new Map(),
    trendingTopics: [],
    clusters: [],
    isProcessing: false,
    isLoading: false,
    error: null,
    totalTopics: 0,
    totalDocuments: 0,
    lastUpdated: null,
  });

  const processingQueue = useRef<Set<string>>(new Set());

  // Initialize service listeners
  useEffect(() => {
    const handleTopicsExtracted = ({ documentId, topics }: any) => {
      setState((prev) => {
        const newDocumentTopics = new Map(prev.documentTopics);
        newDocumentTopics.set(documentId, topics);

        // Update all topics list
        const allTopics = Array.from(newDocumentTopics.values()).flat();

        return {
          ...prev,
          documentTopics: newDocumentTopics,
          topics: allTopics,
          totalTopics: allTopics.length,
          totalDocuments: newDocumentTopics.size,
          lastUpdated: new Date(),
        };
      });
    };

    const handleClusteringComplete = (clusters: TopicCluster[]) => {
      setState((prev) => ({
        ...prev,
        clusters,
        lastUpdated: new Date(),
      }));
    };

    const handleError = ({ message, error }: any) => {
      setState((prev) => ({
        ...prev,
        error: message || "An error occurred during topic extraction",
        isProcessing: false,
      }));
      console.error("Topic extraction error:", error);
    };

    // Subscribe to service events
    topicExtractionService.on("topicsExtracted", handleTopicsExtracted);
    topicExtractionService.on("clusteringComplete", handleClusteringComplete);
    topicExtractionService.on("error", handleError);

    // Load trending topics on mount
    const trending = topicExtractionService.getTrendingTopics(10);
    setState((prev) => ({ ...prev, trendingTopics: trending }));

    return () => {
      topicExtractionService.off("topicsExtracted", handleTopicsExtracted);
      topicExtractionService.off(
        "clusteringComplete",
        handleClusteringComplete,
      );
      topicExtractionService.off("error", handleError);
    };
  }, []);

  // Process a single document
  const processDocument = useCallback(
    async (
      content: string,
      metadata?: {
        title?: string;
        type?: DocumentType;
        source?: string;
      },
      options?: ProcessingOptions,
    ): Promise<ExtractedTopic[]> => {
      const documentId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Check if already processing
      if (processingQueue.current.has(documentId)) {
        return [];
      }

      processingQueue.current.add(documentId);
      setState((prev) => ({ ...prev, isProcessing: true, error: null }));

      try {
        const document: Document = {
          id: documentId,
          content,
          title: metadata?.title,
          type: metadata?.type || "user_upload",
          metadata: metadata,
          timestamp: new Date(),
          source: metadata?.source,
        };

        const topics = await topicExtractionService.processDocument(
          document,
          options,
        );

        // Refresh trending topics
        const trending = topicExtractionService.getTrendingTopics(10);
        setState((prev) => ({ ...prev, trendingTopics: trending }));

        return topics;
      } catch (error) {
        console.error("Error processing document:", error);
        setState((prev) => ({
          ...prev,
          error: "Failed to process document",
        }));
        return [];
      } finally {
        processingQueue.current.delete(documentId);
        setState((prev) => ({ ...prev, isProcessing: false }));
      }
    },
    [],
  );

  // Process multiple documents
  const processBatch = useCallback(
    async (
      documents: Array<{
        content: string;
        title?: string;
        type?: DocumentType;
        metadata?: Record<string, any>;
      }>,
      options?: ProcessingOptions,
    ): Promise<void> => {
      setState((prev) => ({ ...prev, isProcessing: true, error: null }));

      try {
        const docs: Document[] = documents.map((doc, index) => ({
          id: `batch_${Date.now()}_${index}`,
          content: doc.content,
          title: doc.title,
          type: doc.type || "user_upload",
          metadata: doc.metadata,
          timestamp: new Date(),
          source: doc.metadata?.source,
        }));

        await topicExtractionService.processBatch(docs, options);

        // Refresh trending topics
        const trending = topicExtractionService.getTrendingTopics(10);
        setState((prev) => ({ ...prev, trendingTopics: trending }));
      } catch (error) {
        console.error("Error processing batch:", error);
        setState((prev) => ({
          ...prev,
          error: "Failed to process documents",
        }));
      } finally {
        setState((prev) => ({ ...prev, isProcessing: false }));
      }
    },
    [],
  );

  // Search topics
  const searchTopics = useCallback(
    (query: string, limit: number = 10): ExtractedTopic[] => {
      return topicExtractionService.searchTopics(query, limit);
    },
    [],
  );

  // Get topics for a specific document
  const getDocumentTopics = useCallback(
    (documentId: string): ExtractedTopic[] => {
      return topicExtractionService.getDocumentTopics(documentId);
    },
    [],
  );

  // Find related documents
  const findRelatedDocuments = useCallback(
    (topicTerm: string, limit: number = 10): Document[] => {
      return topicExtractionService.findRelatedDocuments(topicTerm, limit);
    },
    [],
  );

  // Get all clusters
  const getClusters = useCallback((): TopicCluster[] => {
    return topicExtractionService.getClusters();
  }, []);

  // Get cluster by topic
  const getClusterByTopic = useCallback(
    (topicTerm: string): TopicCluster | undefined => {
      const clusters = topicExtractionService.getClusters();
      return clusters.find((cluster) =>
        cluster.topics.some((topic) =>
          topic.term.toLowerCase().includes(topicTerm.toLowerCase()),
        ),
      );
    },
    [],
  );

  // Clear cache
  const clearCache = useCallback((): void => {
    topicExtractionService.clearCache();
    setState((prev) => ({
      ...prev,
      topics: [],
      documentTopics: new Map(),
      trendingTopics: [],
      clusters: [],
      totalTopics: 0,
      totalDocuments: 0,
      lastUpdated: null,
    }));
  }, []);

  // Refresh trending topics
  const refreshTrendingTopics = useCallback((): void => {
    const trending = topicExtractionService.getTrendingTopics(10);
    setState((prev) => ({ ...prev, trendingTopics: trending }));
  }, []);

  // Export topics
  const exportTopics = useCallback((): string => {
    return topicExtractionService.exportTopics();
  }, []);

  // Import topics
  const importTopics = useCallback((jsonData: string): boolean => {
    try {
      topicExtractionService.importTopics(jsonData);

      // Refresh state
      const allClusters = topicExtractionService.getClusters();
      const trending = topicExtractionService.getTrendingTopics(10);

      setState((prev) => ({
        ...prev,
        clusters: allClusters,
        trendingTopics: trending,
        lastUpdated: new Date(),
      }));

      return true;
    } catch (error) {
      console.error("Error importing topics:", error);
      setState((prev) => ({
        ...prev,
        error: "Failed to import topics",
      }));
      return false;
    }
  }, []);

  const actions: UseTopicExtractionActions = {
    processDocument,
    processBatch,
    searchTopics,
    getDocumentTopics,
    findRelatedDocuments,
    getClusters,
    getClusterByTopic,
    clearCache,
    refreshTrendingTopics,
    exportTopics,
    importTopics,
  };

  return [state, actions];
}

/**
 * Hook for integrating topic extraction with chat messages
 */
export function useChatTopicExtraction() {
  const [topicState, topicActions] = useTopicExtraction();
  const [chatTopics, setChatTopics] = useState<ExtractedTopic[]>([]);
  const messageCache = useRef<Map<string, ExtractedTopic[]>>(new Map());

  const extractTopicsFromMessage = useCallback(
    async (
      messageContent: string,
      messageId: string,
    ): Promise<ExtractedTopic[]> => {
      // Check cache first
      if (messageCache.current.has(messageId)) {
        return messageCache.current.get(messageId)!;
      }

      // Extract topics from message
      const topics = await topicActions.processDocument(
        messageContent,
        {
          type: "chat_message",
          source: "chat",
        },
        {
          maxTerms: 5, // Fewer topics for chat messages
          minScore: 0.2, // Higher threshold for relevance
          includeNgrams: false, // Single words only for chat
        },
      );

      // Cache results
      messageCache.current.set(messageId, topics);

      // Update chat topics
      setChatTopics((prev) => {
        const newTopics = [...prev, ...topics];
        // Keep only unique topics by term
        const uniqueTopics = Array.from(
          new Map(newTopics.map((t) => [t.term, t])).values(),
        );
        return uniqueTopics.slice(0, 20); // Limit to 20 most recent
      });

      return topics;
    },
    [topicActions],
  );

  const findRelatedContent = useCallback(
    (topics: ExtractedTopic[]): Document[] => {
      const allRelated: Document[] = [];
      const seen = new Set<string>();

      for (const topic of topics) {
        const related = topicActions.findRelatedDocuments(topic.term, 5);
        for (const doc of related) {
          if (!seen.has(doc.id)) {
            seen.add(doc.id);
            allRelated.push(doc);
          }
        }
      }

      return allRelated.slice(0, 10); // Top 10 related documents
    },
    [topicActions],
  );

  return {
    ...topicState,
    chatTopics,
    extractTopicsFromMessage,
    findRelatedContent,
    clearMessageCache: () => messageCache.current.clear(),
  };
}

/**
 * Hook for topic visualization components
 */
export function useTopicVisualization() {
  const [topicState] = useTopicExtraction();

  const getTopicCloud = useCallback((): Array<{
    text: string;
    value: number;
  }> => {
    return topicState.topics
      .slice(0, 50) // Top 50 topics
      .map((topic) => ({
        text: topic.term,
        value: topic.score * 100, // Scale for visualization
      }));
  }, [topicState.topics]);

  const getTopicNetwork = useCallback((): {
    nodes: Array<{ id: string; label: string; value: number }>;
    edges: Array<{ from: string; to: string; value: number }>;
  } => {
    const nodes: Array<{ id: string; label: string; value: number }> = [];
    const edges: Array<{ from: string; to: string; value: number }> = [];
    const addedNodes = new Set<string>();

    for (const cluster of topicState.clusters) {
      for (const topic of cluster.topics) {
        if (!addedNodes.has(topic.term)) {
          nodes.push({
            id: topic.term,
            label: topic.term,
            value: topic.score,
          });
          addedNodes.add(topic.term);
        }

        // Add edges for related terms
        for (const related of topic.relatedTerms) {
          if (!addedNodes.has(related)) {
            nodes.push({
              id: related,
              label: related,
              value: 0.5, // Lower value for related terms
            });
            addedNodes.add(related);
          }

          edges.push({
            from: topic.term,
            to: related,
            value: 0.5,
          });
        }
      }
    }

    return { nodes, edges };
  }, [topicState.clusters]);

  const getTopicTimeline = useCallback((): Array<{
    date: Date;
    topics: ExtractedTopic[];
    count: number;
  }> => {
    // Group topics by date (would need actual timestamp data in production)
    const timeline: Map<string, ExtractedTopic[]> = new Map();

    for (const topics of topicState.documentTopics.values()) {
      for (const topic of topics) {
        const dateKey = topic.lastUpdated.toDateString();
        if (!timeline.has(dateKey)) {
          timeline.set(dateKey, []);
        }
        timeline.get(dateKey)!.push(topic);
      }
    }

    return Array.from(timeline.entries())
      .map(([dateStr, topics]) => ({
        date: new Date(dateStr),
        topics,
        count: topics.length,
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [topicState.documentTopics]);

  return {
    getTopicCloud,
    getTopicNetwork,
    getTopicTimeline,
    clusters: topicState.clusters,
    trendingTopics: topicState.trendingTopics,
  };
}
