/**
 * Topic Extraction Service
 *
 * Provides intelligent topic extraction from various content types including:
 * - AOMA documentation (technical docs, support notes, release notes)
 * - Jira tickets and issues
 * - Chat conversations
 * - Uploaded documents
 *
 * Uses TF-IDF (Term Frequency-Inverse Document Frequency) algorithm
 * for identifying important topics and clustering related content.
 */

import { EventEmitter } from "events";

// Types for topic extraction
export interface ExtractedTopic {
  id: string;
  term: string;
  score: number; // TF-IDF score
  frequency: number; // Raw frequency in document
  category?: TopicCategory;
  relatedTerms: string[];
  documentIds: string[]; // Documents containing this topic
  lastUpdated: Date;
  trend?: "rising" | "stable" | "declining";
}

export interface TopicCluster {
  id: string;
  name: string;
  topics: ExtractedTopic[];
  centroid: number[]; // Vector representation
  documentCount: number;
  confidence: number;
  metadata?: {
    jiraTickets?: string[];
    releaseNotes?: string[];
    supportDocs?: string[];
  };
}

export interface Document {
  id: string;
  content: string;
  title?: string;
  type: DocumentType;
  metadata?: Record<string, any>;
  timestamp: Date;
  source?: string;
}

export type DocumentType =
  | "technical_doc"
  | "support_note"
  | "release_note"
  | "jira_ticket"
  | "chat_message"
  | "user_upload"
  | "workflow_doc";

export type TopicCategory =
  | "technical"
  | "process"
  | "error"
  | "feature"
  | "integration"
  | "performance"
  | "security";

interface TFIDFResult {
  term: string;
  tfidf: number;
  tf: number;
  idf: number;
}

interface ProcessingOptions {
  minTermLength?: number;
  maxTerms?: number;
  minScore?: number;
  includeNgrams?: boolean;
  ngramSize?: number;
  customStopWords?: string[];
}

export class TopicExtractionService extends EventEmitter {
  private documents: Map<string, Document> = new Map();
  private termDocumentFrequency: Map<string, Set<string>> = new Map();
  private documentTermFrequency: Map<string, Map<string, number>> = new Map();
  private topicCache: Map<string, ExtractedTopic[]> = new Map();
  private clusters: TopicCluster[] = [];
  private stopWords: Set<string>;
  private readonly DEFAULT_STOP_WORDS = new Set([
    "the",
    "is",
    "at",
    "which",
    "on",
    "and",
    "a",
    "an",
    "as",
    "are",
    "was",
    "were",
    "been",
    "be",
    "have",
    "has",
    "had",
    "do",
    "does",
    "did",
    "will",
    "would",
    "could",
    "should",
    "may",
    "might",
    "must",
    "can",
    "this",
    "that",
    "these",
    "those",
    "i",
    "you",
    "he",
    "she",
    "it",
    "we",
    "they",
    "what",
    "which",
    "who",
    "when",
    "where",
    "why",
    "how",
    "all",
    "each",
    "every",
    "both",
    "few",
    "more",
    "most",
    "other",
    "some",
    "such",
    "no",
    "nor",
    "not",
    "only",
    "own",
    "same",
    "so",
    "than",
    "too",
    "very",
    "just",
    "in",
    "of",
    "to",
    "for",
    "with",
    "from",
    "about",
    "into",
    "through",
    "during",
    "before",
    "after",
  ]);

  // Domain-specific important terms for AOMA
  private readonly DOMAIN_TERMS = new Set([
    "aoma",
    "asset",
    "offering",
    "audio",
    "submission",
    "aspera",
    "glacier",
    "s3",
    "aws",
    "carma",
    "jira",
    "workflow",
    "ingestion",
    "archive",
    "metadata",
    "validation",
    "error",
    "deployment",
    "lambda",
    "api",
    "endpoint",
    "authentication",
    "authorization",
  ]);

  constructor() {
    super();
    this.stopWords = new Set(this.DEFAULT_STOP_WORDS);
    this.initializeService();
  }

  private initializeService(): void {
    // Emit ready event when service is initialized
    this.emit("ready");
  }

  /**
   * Process a document and extract topics using TF-IDF
   */
  public async processDocument(
    document: Document,
    options: ProcessingOptions = {},
  ): Promise<ExtractedTopic[]> {
    const {
      minTermLength = 3,
      maxTerms = 20,
      minScore = 0.1,
      includeNgrams = true,
      ngramSize = 2,
      customStopWords = [],
    } = options;

    // Add custom stop words if provided
    customStopWords.forEach((word) => this.stopWords.add(word.toLowerCase()));

    // Store document
    this.documents.set(document.id, document);

    // Tokenize and clean content
    const tokens = this.tokenize(document.content);
    const terms = this.extractTerms(
      tokens,
      minTermLength,
      includeNgrams,
      ngramSize,
    );

    // Calculate term frequencies for this document
    const termFrequencies = this.calculateTermFrequency(terms);
    this.documentTermFrequency.set(document.id, termFrequencies);

    // Update global term-document frequency
    this.updateTermDocumentFrequency(document.id, termFrequencies);

    // Calculate TF-IDF scores
    const tfidfResults = this.calculateTFIDF(document.id);

    // Convert to ExtractedTopic format
    const topics = this.convertToTopics(
      tfidfResults,
      document,
      minScore,
      maxTerms,
    );

    // Cache the results
    this.topicCache.set(document.id, topics);

    // Emit event for real-time updates
    this.emit("topicsExtracted", { documentId: document.id, topics });

    return topics;
  }

  /**
   * Process multiple documents in batch
   */
  public async processBatch(
    documents: Document[],
    options: ProcessingOptions = {},
  ): Promise<Map<string, ExtractedTopic[]>> {
    const results = new Map<string, ExtractedTopic[]>();

    // Process all documents first to build corpus statistics
    for (const doc of documents) {
      await this.processDocument(doc, options);
    }

    // Recalculate TF-IDF with complete corpus
    for (const doc of documents) {
      const tfidfResults = this.calculateTFIDF(doc.id);
      const topics = this.convertToTopics(
        tfidfResults,
        doc,
        options.minScore || 0.1,
        options.maxTerms || 20,
      );
      results.set(doc.id, topics);
      this.topicCache.set(doc.id, topics);
    }

    // Perform clustering on extracted topics
    await this.clusterTopics();

    return results;
  }

  /**
   * Tokenize content into words
   */
  private tokenize(content: string): string[] {
    // Convert to lowercase and split by non-word characters
    return content
      .toLowerCase()
      .replace(/[^\w\s-]/g, " ")
      .split(/\s+/)
      .filter((token) => token.length > 0);
  }

  /**
   * Extract terms from tokens (including n-grams if specified)
   */
  private extractTerms(
    tokens: string[],
    minLength: number,
    includeNgrams: boolean,
    ngramSize: number,
  ): string[] {
    const terms: string[] = [];

    // Single terms
    for (const token of tokens) {
      if (token.length >= minLength && !this.stopWords.has(token)) {
        terms.push(token);
      }
    }

    // N-grams
    if (includeNgrams && ngramSize > 1) {
      for (let i = 0; i <= tokens.length - ngramSize; i++) {
        const ngram = tokens.slice(i, i + ngramSize);
        // Filter out n-grams that contain only stop words
        const validTokens = ngram.filter((t) => !this.stopWords.has(t));
        if (validTokens.length > 0) {
          const ngramTerm = ngram.join(" ");
          terms.push(ngramTerm);
        }
      }
    }

    return terms;
  }

  /**
   * Calculate term frequency for a document
   */
  private calculateTermFrequency(terms: string[]): Map<string, number> {
    const frequencies = new Map<string, number>();

    for (const term of terms) {
      frequencies.set(term, (frequencies.get(term) || 0) + 1);
    }

    // Normalize by document length (to handle different document sizes)
    const maxFreq = Math.max(...frequencies.values());
    for (const [term, freq] of frequencies) {
      frequencies.set(term, freq / maxFreq);
    }

    return frequencies;
  }

  /**
   * Update global term-document frequency mapping
   */
  private updateTermDocumentFrequency(
    documentId: string,
    termFrequencies: Map<string, number>,
  ): void {
    for (const term of termFrequencies.keys()) {
      if (!this.termDocumentFrequency.has(term)) {
        this.termDocumentFrequency.set(term, new Set());
      }
      this.termDocumentFrequency.get(term)!.add(documentId);
    }
  }

  /**
   * Calculate TF-IDF scores for a document
   */
  private calculateTFIDF(documentId: string): TFIDFResult[] {
    const results: TFIDFResult[] = [];
    const termFreqs = this.documentTermFrequency.get(documentId);

    if (!termFreqs) return results;

    const totalDocs = this.documents.size;

    for (const [term, tf] of termFreqs) {
      // Calculate IDF (Inverse Document Frequency)
      const docsWithTerm = this.termDocumentFrequency.get(term)?.size || 0;
      const idf = Math.log(totalDocs / (1 + docsWithTerm));

      // Calculate TF-IDF
      const tfidf = tf * idf;

      // Boost domain-specific terms
      const boostedScore = this.DOMAIN_TERMS.has(term) ? tfidf * 1.5 : tfidf;

      results.push({
        term,
        tfidf: boostedScore,
        tf,
        idf,
      });
    }

    // Sort by TF-IDF score
    results.sort((a, b) => b.tfidf - a.tfidf);

    return results;
  }

  /**
   * Convert TF-IDF results to ExtractedTopic format
   */
  private convertToTopics(
    tfidfResults: TFIDFResult[],
    document: Document,
    minScore: number,
    maxTerms: number,
  ): ExtractedTopic[] {
    const topics: ExtractedTopic[] = [];
    const termFreqs = this.documentTermFrequency.get(document.id);

    for (let i = 0; i < Math.min(tfidfResults.length, maxTerms); i++) {
      const result = tfidfResults[i];

      if (result.tfidf < minScore) break;

      const documentIds = Array.from(
        this.termDocumentFrequency.get(result.term) || new Set(),
      );

      topics.push({
        id: `topic_${document.id}_${i}`,
        term: result.term,
        score: result.tfidf,
        frequency: termFreqs?.get(result.term) || 0,
        category: this.categorizeTopicTerm(result.term),
        relatedTerms: this.findRelatedTerms(result.term, tfidfResults),
        documentIds,
        lastUpdated: new Date(),
        trend: this.calculateTrend(result.term),
      });
    }

    return topics;
  }

  /**
   * Categorize a topic term based on patterns and keywords
   */
  private categorizeTopicTerm(term: string): TopicCategory {
    const lowerTerm = term.toLowerCase();

    if (
      lowerTerm.includes("error") ||
      lowerTerm.includes("fail") ||
      lowerTerm.includes("issue") ||
      lowerTerm.includes("bug")
    ) {
      return "error";
    }
    if (
      lowerTerm.includes("api") ||
      lowerTerm.includes("endpoint") ||
      lowerTerm.includes("integration")
    ) {
      return "integration";
    }
    if (
      lowerTerm.includes("performance") ||
      lowerTerm.includes("speed") ||
      lowerTerm.includes("optimization")
    ) {
      return "performance";
    }
    if (
      lowerTerm.includes("security") ||
      lowerTerm.includes("auth") ||
      lowerTerm.includes("permission")
    ) {
      return "security";
    }
    if (
      lowerTerm.includes("feature") ||
      lowerTerm.includes("enhancement") ||
      lowerTerm.includes("new")
    ) {
      return "feature";
    }
    if (
      lowerTerm.includes("process") ||
      lowerTerm.includes("workflow") ||
      lowerTerm.includes("procedure")
    ) {
      return "process";
    }

    return "technical";
  }

  /**
   * Find related terms based on co-occurrence
   */
  private findRelatedTerms(
    term: string,
    allTerms: TFIDFResult[],
    maxRelated: number = 5,
  ): string[] {
    const related: string[] = [];

    // Find terms that often appear in same documents
    const termDocs = this.termDocumentFrequency.get(term) || new Set();

    for (const result of allTerms) {
      if (result.term === term) continue;

      const otherDocs =
        this.termDocumentFrequency.get(result.term) || new Set();
      const intersection = new Set(
        [...termDocs].filter((x) => otherDocs.has(x)),
      );

      // Calculate Jaccard similarity
      const union = new Set([...termDocs, ...otherDocs]);
      const similarity = intersection.size / union.size;

      if (similarity > 0.3) {
        // Threshold for relatedness
        related.push(result.term);
        if (related.length >= maxRelated) break;
      }
    }

    return related;
  }

  /**
   * Calculate trend for a topic (would need historical data in production)
   */
  private calculateTrend(term: string): "rising" | "stable" | "declining" {
    // Simplified implementation - in production, would track term frequency over time
    const recentDocs = Array.from(this.documents.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 10);

    let recentCount = 0;
    let olderCount = 0;

    recentDocs.forEach((doc, index) => {
      const terms = this.documentTermFrequency.get(doc.id);
      if (terms?.has(term)) {
        if (index < 5) recentCount++;
        else olderCount++;
      }
    });

    if (recentCount > olderCount * 1.5) return "rising";
    if (recentCount < olderCount * 0.5) return "declining";
    return "stable";
  }

  /**
   * Cluster topics using simple k-means-like algorithm
   */
  private async clusterTopics(): Promise<TopicCluster[]> {
    const allTopics: ExtractedTopic[] = [];

    // Collect all topics
    for (const topics of this.topicCache.values()) {
      allTopics.push(...topics);
    }

    // Group similar topics
    const clusters: Map<string, TopicCluster> = new Map();

    for (const topic of allTopics) {
      // Find or create cluster based on term similarity
      let foundCluster = false;

      for (const [clusterId, cluster] of clusters) {
        // Check if topic belongs to this cluster
        const similarity = this.calculateTermSimilarity(
          topic.term,
          cluster.topics.map((t) => t.term),
        );

        if (similarity > 0.5) {
          cluster.topics.push(topic);
          cluster.documentCount = new Set(
            cluster.topics.flatMap((t) => t.documentIds),
          ).size;
          foundCluster = true;
          break;
        }
      }

      // Create new cluster if no match found
      if (!foundCluster) {
        const clusterId = `cluster_${clusters.size}`;
        clusters.set(clusterId, {
          id: clusterId,
          name: this.generateClusterName([topic]),
          topics: [topic],
          centroid: [], // Would calculate vector representation in production
          documentCount: topic.documentIds.length,
          confidence: topic.score,
          metadata: this.extractClusterMetadata([topic]),
        });
      }
    }

    this.clusters = Array.from(clusters.values());
    this.emit("clusteringComplete", this.clusters);

    return this.clusters;
  }

  /**
   * Calculate similarity between a term and a list of terms
   */
  private calculateTermSimilarity(term: string, terms: string[]): number {
    if (terms.length === 0) return 0;

    // Simple approach: check for substring matches or common words
    let maxSimilarity = 0;

    for (const otherTerm of terms) {
      let similarity = 0;

      // Exact match
      if (term === otherTerm) {
        similarity = 1;
      }
      // Substring match
      else if (term.includes(otherTerm) || otherTerm.includes(term)) {
        similarity = 0.7;
      }
      // Common words
      else {
        const words1 = term.split(/[\s-_]/);
        const words2 = otherTerm.split(/[\s-_]/);
        const common = words1.filter((w) => words2.includes(w));
        similarity = common.length / Math.max(words1.length, words2.length);
      }

      maxSimilarity = Math.max(maxSimilarity, similarity);
    }

    return maxSimilarity;
  }

  /**
   * Generate a human-readable name for a cluster
   */
  private generateClusterName(topics: ExtractedTopic[]): string {
    // Use the most common/highest scoring term as cluster name
    const topTopic = topics.sort((a, b) => b.score - a.score)[0];
    return topTopic.term
      .split(/[\s-_]/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  /**
   * Extract metadata for a cluster
   */
  private extractClusterMetadata(topics: ExtractedTopic[]): any {
    const metadata: any = {
      jiraTickets: [],
      releaseNotes: [],
      supportDocs: [],
    };

    for (const topic of topics) {
      for (const docId of topic.documentIds) {
        const doc = this.documents.get(docId);
        if (!doc) continue;

        switch (doc.type) {
          case "jira_ticket":
            if (doc.metadata?.ticketId) {
              metadata.jiraTickets.push(doc.metadata.ticketId);
            }
            break;
          case "release_note":
            if (doc.title) {
              metadata.releaseNotes.push(doc.title);
            }
            break;
          case "support_note":
          case "technical_doc":
            if (doc.title) {
              metadata.supportDocs.push(doc.title);
            }
            break;
        }
      }
    }

    // Remove duplicates
    metadata.jiraTickets = [...new Set(metadata.jiraTickets)];
    metadata.releaseNotes = [...new Set(metadata.releaseNotes)];
    metadata.supportDocs = [...new Set(metadata.supportDocs)];

    return metadata;
  }

  /**
   * Search for topics across all documents
   */
  public searchTopics(query: string, limit: number = 10): ExtractedTopic[] {
    const results: ExtractedTopic[] = [];
    const queryLower = query.toLowerCase();

    for (const topics of this.topicCache.values()) {
      for (const topic of topics) {
        if (
          topic.term.toLowerCase().includes(queryLower) ||
          topic.relatedTerms.some((t) => t.toLowerCase().includes(queryLower))
        ) {
          results.push(topic);
        }
      }
    }

    // Sort by relevance and limit
    return results.sort((a, b) => b.score - a.score).slice(0, limit);
  }

  /**
   * Get trending topics
   */
  public getTrendingTopics(limit: number = 10): ExtractedTopic[] {
    const allTopics: ExtractedTopic[] = [];

    for (const topics of this.topicCache.values()) {
      allTopics.push(...topics.filter((t) => t.trend === "rising"));
    }

    return allTopics.sort((a, b) => b.score - a.score).slice(0, limit);
  }

  /**
   * Get topics for a specific document
   */
  public getDocumentTopics(documentId: string): ExtractedTopic[] {
    return this.topicCache.get(documentId) || [];
  }

  /**
   * Get all clusters
   */
  public getClusters(): TopicCluster[] {
    return this.clusters;
  }

  /**
   * Find documents related to a topic
   */
  public findRelatedDocuments(
    topicTerm: string,
    limit: number = 10,
  ): Document[] {
    const termLower = topicTerm.toLowerCase();
    const relatedDocs: Array<{ doc: Document; score: number }> = [];

    for (const [docId, doc] of this.documents) {
      const topics = this.topicCache.get(docId) || [];
      let score = 0;

      for (const topic of topics) {
        if (topic.term.toLowerCase().includes(termLower)) {
          score += topic.score;
        } else if (
          topic.relatedTerms.some((t) => t.toLowerCase().includes(termLower))
        ) {
          score += topic.score * 0.5; // Lower weight for related terms
        }
      }

      if (score > 0) {
        relatedDocs.push({ doc, score });
      }
    }

    return relatedDocs
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((item) => item.doc);
  }

  /**
   * Clear all cached data
   */
  public clearCache(): void {
    this.topicCache.clear();
    this.clusters = [];
    this.emit("cacheCleared");
  }

  /**
   * Export topics as JSON for persistence
   */
  public exportTopics(): string {
    return JSON.stringify(
      {
        topics: Array.from(this.topicCache.entries()),
        clusters: this.clusters,
        timestamp: new Date().toISOString(),
      },
      null,
      2,
    );
  }

  /**
   * Import previously exported topics
   */
  public importTopics(jsonData: string): void {
    try {
      const data = JSON.parse(jsonData);

      // Restore topics
      if (data.topics) {
        this.topicCache.clear();
        for (const [docId, topics] of data.topics) {
          this.topicCache.set(docId, topics);
        }
      }

      // Restore clusters
      if (data.clusters) {
        this.clusters = data.clusters;
      }

      this.emit("topicsImported", { timestamp: data.timestamp });
    } catch (error) {
      this.emit("error", { message: "Failed to import topics", error });
    }
  }
}

// Singleton instance
export const topicExtractionService = new TopicExtractionService();
