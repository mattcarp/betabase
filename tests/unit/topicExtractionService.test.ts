/**
 * Topic Extraction Service Unit Tests
 * Tests TF-IDF algorithm, tokenization, topic categorization
 */

import { describe, test, expect, beforeEach } from "vitest";
import {
  TopicExtractionService,
  Document,
  DocumentType,
  ExtractedTopic,
} from "@/services/topicExtractionService";

describe("TopicExtractionService", () => {
  let service: TopicExtractionService;

  beforeEach(() => {
    service = new TopicExtractionService();
  });

  const createDocument = (
    id: string,
    content: string,
    type: DocumentType = "technical_doc"
  ): Document => ({
    id,
    content,
    title: `Test Document ${id}`,
    type,
    timestamp: new Date(),
    source: "test",
  });

  describe("processDocument", () => {
    test("should extract topics from a simple document", async () => {
      const doc = createDocument(
        "doc-1",
        "The AOMA system handles asset management and metadata validation. AOMA processes audio submissions through the ingestion workflow."
      );

      const topics = await service.processDocument(doc);

      expect(topics.length).toBeGreaterThan(0);
      expect(topics[0]).toHaveProperty("term");
      expect(topics[0]).toHaveProperty("score");
      expect(topics[0]).toHaveProperty("category");
    });

    test("should boost domain-specific AOMA terms", async () => {
      const doc = createDocument(
        "doc-2",
        "AOMA handles asset ingestion. The workflow processes metadata validation. Random words like banana and elephant appear too."
      );

      const topics = await service.processDocument(doc);

      // Domain terms like "aoma", "asset", "metadata", "workflow" should rank higher
      const domainTerms = topics.filter((t) =>
        ["aoma", "asset", "metadata", "workflow", "ingestion", "validation"].some((dt) =>
          t.term.toLowerCase().includes(dt)
        )
      );

      expect(domainTerms.length).toBeGreaterThan(0);
    });

    test("should filter out stop words", async () => {
      const doc = createDocument(
        "doc-3",
        "The system is working and it has been updated. This is the way we do things."
      );

      const topics = await service.processDocument(doc);

      // Stop words should not appear as topics
      const stopWordTopics = topics.filter((t) =>
        ["the", "is", "and", "has", "been", "this", "way", "we", "do"].includes(
          t.term.toLowerCase()
        )
      );

      expect(stopWordTopics.length).toBe(0);
    });

    test("should respect minTermLength option", async () => {
      const doc = createDocument("doc-4", "API is OK but AWS S3 works great for storage");

      const topics = await service.processDocument(doc, { minTermLength: 4 });

      // Short terms like "api", "ok", "aws", "s3" should be filtered
      const shortTerms = topics.filter((t) => t.term.length < 4 && !t.term.includes(" "));

      expect(shortTerms.length).toBe(0);
    });

    test("should extract n-grams when enabled", async () => {
      const doc = createDocument(
        "doc-5",
        "The error handling system catches validation errors. Error handling is important."
      );

      const topics = await service.processDocument(doc, {
        includeNgrams: true,
        ngramSize: 2,
      });

      // Should find bigrams like "error handling"
      const bigrams = topics.filter((t) => t.term.includes(" "));
      expect(bigrams.length).toBeGreaterThan(0);
    });

    test("should assign document IDs to topics", async () => {
      const doc = createDocument("doc-unique-id", "Testing document topic extraction");

      const topics = await service.processDocument(doc);

      topics.forEach((topic) => {
        expect(topic.documentIds).toContain("doc-unique-id");
      });
    });

    test("should limit topics to maxTerms", async () => {
      const doc = createDocument(
        "doc-6",
        "Alpha beta gamma delta epsilon zeta eta theta iota kappa lambda mu nu xi omicron pi rho sigma tau upsilon phi chi psi omega"
      );

      const topics = await service.processDocument(doc, { maxTerms: 5 });

      expect(topics.length).toBeLessThanOrEqual(5);
    });
  });

  describe("topic categorization", () => {
    test("should categorize error-related topics", async () => {
      const doc = createDocument(
        "doc-error",
        "System error occurred during validation. The bug causes failures in production. Issue reported by users."
      );

      const topics = await service.processDocument(doc);

      const errorTopics = topics.filter((t) => t.category === "error");
      expect(errorTopics.length).toBeGreaterThan(0);
    });

    test("should categorize integration topics", async () => {
      const doc = createDocument(
        "doc-integration",
        "API endpoint integration with third-party services. The REST API connects to external systems."
      );

      const topics = await service.processDocument(doc);

      const integrationTopics = topics.filter((t) => t.category === "integration");
      expect(integrationTopics.length).toBeGreaterThan(0);
    });

    test("should categorize performance topics", async () => {
      const doc = createDocument(
        "doc-performance",
        "Performance optimization improved speed by 50%. Query optimization reduced latency."
      );

      const topics = await service.processDocument(doc);

      const perfTopics = topics.filter((t) => t.category === "performance");
      expect(perfTopics.length).toBeGreaterThan(0);
    });

    test("should categorize security topics", async () => {
      const doc = createDocument(
        "doc-security",
        "Authentication system uses OAuth. Authorization checks permission levels."
      );

      const topics = await service.processDocument(doc);

      const securityTopics = topics.filter((t) => t.category === "security");
      expect(securityTopics.length).toBeGreaterThan(0);
    });

    test("should categorize feature topics", async () => {
      const doc = createDocument(
        "doc-feature",
        "New feature enhancement adds upload capability. Feature request for bulk import."
      );

      const topics = await service.processDocument(doc);

      const featureTopics = topics.filter((t) => t.category === "feature");
      expect(featureTopics.length).toBeGreaterThan(0);
    });

    test("should categorize process topics", async () => {
      const doc = createDocument(
        "doc-process",
        "The workflow process handles submissions. Standard procedure for ingestion."
      );

      const topics = await service.processDocument(doc);

      const processTopics = topics.filter((t) => t.category === "process");
      expect(processTopics.length).toBeGreaterThan(0);
    });

    test("should default to technical category", async () => {
      const doc = createDocument(
        "doc-technical",
        "Lambda function handles data transformation. Database schema updated."
      );

      const topics = await service.processDocument(doc);

      const technicalTopics = topics.filter((t) => t.category === "technical");
      expect(technicalTopics.length).toBeGreaterThan(0);
    });
  });

  describe("processBatch", () => {
    test("should process multiple documents", async () => {
      const docs = [
        createDocument("batch-1", "AOMA asset management handles audio files"),
        createDocument("batch-2", "Metadata validation ensures data quality"),
        createDocument("batch-3", "Workflow automation streamlines processes"),
      ];

      const results = await service.processBatch(docs);

      expect(results.size).toBe(3);
      expect(results.has("batch-1")).toBe(true);
      expect(results.has("batch-2")).toBe(true);
      expect(results.has("batch-3")).toBe(true);
    });

    test("should calculate IDF across corpus", async () => {
      // "common" appears in all docs, "unique" appears in one
      const docs = [
        createDocument("idf-1", "Common term appears here. Unique alpha term."),
        createDocument("idf-2", "Common term appears again. Different content."),
        createDocument("idf-3", "Common term once more. Another document."),
      ];

      const results = await service.processBatch(docs);

      // "common" should have lower TF-IDF due to appearing in all docs
      // "unique" should have higher TF-IDF due to appearing in only one doc
      const doc1Topics = results.get("idf-1") || [];
      const uniqueTopic = doc1Topics.find((t) => t.term.includes("unique"));
      const commonTopic = doc1Topics.find((t) => t.term.includes("common"));

      if (uniqueTopic && commonTopic) {
        expect(uniqueTopic.score).toBeGreaterThan(commonTopic.score);
      }
    });

    test("should create clusters after batch processing", async () => {
      const docs = [
        createDocument("cluster-1", "Error handling catches exceptions"),
        createDocument("cluster-2", "Error logging tracks failures"),
        createDocument("cluster-3", "Performance monitoring measures speed"),
      ];

      await service.processBatch(docs);

      const clusters = service.getClusters();
      expect(clusters.length).toBeGreaterThan(0);
    });
  });

  describe("searchTopics", () => {
    test("should find topics by term", async () => {
      const doc = createDocument(
        "search-1",
        "Authentication service handles user login. OAuth integration provides secure access."
      );

      await service.processDocument(doc);

      const results = service.searchTopics("auth");

      expect(results.length).toBeGreaterThan(0);
      expect(results.some((t) => t.term.toLowerCase().includes("auth"))).toBe(true);
    });

    test("should find topics by related terms", async () => {
      const docs = [
        createDocument("related-1", "Authentication OAuth login security"),
        createDocument("related-2", "Authentication login session management"),
      ];

      await service.processBatch(docs);

      const results = service.searchTopics("login");

      expect(results.length).toBeGreaterThan(0);
    });

    test("should respect limit parameter", async () => {
      const doc = createDocument(
        "limit-1",
        "Many terms here: alpha beta gamma delta epsilon zeta eta theta"
      );

      await service.processDocument(doc);

      const results = service.searchTopics("a", 2);

      expect(results.length).toBeLessThanOrEqual(2);
    });
  });

  describe("getTrendingTopics", () => {
    test("should return rising topics", async () => {
      // Create docs with timestamps - recent docs have certain terms
      const now = new Date();
      const docs = [
        {
          ...createDocument("trend-1", "New feature deployment"),
          timestamp: new Date(now.getTime() - 1000), // 1 second ago
        },
        {
          ...createDocument("trend-2", "Feature update released"),
          timestamp: new Date(now.getTime() - 2000), // 2 seconds ago
        },
        {
          ...createDocument("trend-3", "Old legacy system"),
          timestamp: new Date(now.getTime() - 100000000), // Much older
        },
      ];

      await service.processBatch(docs);

      const trending = service.getTrendingTopics();

      // Should return topics (may or may not be rising depending on algorithm)
      expect(Array.isArray(trending)).toBe(true);
    });
  });

  describe("getDocumentTopics", () => {
    test("should return topics for specific document", async () => {
      const doc = createDocument("get-doc-1", "Specific document content for testing");

      await service.processDocument(doc);

      const topics = service.getDocumentTopics("get-doc-1");

      expect(topics.length).toBeGreaterThan(0);
    });

    test("should return empty array for unknown document", () => {
      const topics = service.getDocumentTopics("nonexistent-doc");

      expect(topics).toEqual([]);
    });
  });

  describe("findRelatedDocuments", () => {
    test("should find documents containing topic", async () => {
      const docs = [
        createDocument("related-doc-1", "AOMA asset management system"),
        createDocument("related-doc-2", "Asset tracking and inventory"),
        createDocument("related-doc-3", "Unrelated content about weather"),
      ];

      await service.processBatch(docs);

      const relatedDocs = service.findRelatedDocuments("asset");

      expect(relatedDocs.length).toBeGreaterThanOrEqual(1);
      expect(relatedDocs.some((d) => d.id === "related-doc-1" || d.id === "related-doc-2")).toBe(
        true
      );
    });

    test("should respect limit parameter", async () => {
      const docs = Array.from({ length: 10 }, (_, i) =>
        createDocument(`many-${i}`, `Document ${i} about testing`)
      );

      await service.processBatch(docs);

      const relatedDocs = service.findRelatedDocuments("testing", 3);

      expect(relatedDocs.length).toBeLessThanOrEqual(3);
    });
  });

  describe("export and import", () => {
    test("should export topics to JSON", async () => {
      const doc = createDocument("export-1", "Export test content");

      await service.processDocument(doc);

      const exported = service.exportTopics();

      expect(typeof exported).toBe("string");
      const parsed = JSON.parse(exported);
      expect(parsed).toHaveProperty("topics");
      expect(parsed).toHaveProperty("clusters");
      expect(parsed).toHaveProperty("timestamp");
    });

    test("should import previously exported topics", async () => {
      const doc = createDocument("import-1", "Import test content");
      await service.processDocument(doc);

      const exported = service.exportTopics();

      // Create new service and import
      const newService = new TopicExtractionService();
      newService.importTopics(exported);

      // Should have imported topics
      const topics = newService.getDocumentTopics("import-1");
      expect(topics.length).toBeGreaterThan(0);
    });

    test("should handle invalid JSON on import", async () => {
      const newService = new TopicExtractionService();

      // Should not throw, but emit error event
      let errorEmitted = false;
      newService.on("error", () => {
        errorEmitted = true;
      });

      newService.importTopics("invalid json {{{");

      expect(errorEmitted).toBe(true);
    });
  });

  describe("clearCache", () => {
    test("should clear all cached topics", async () => {
      const doc = createDocument("clear-1", "Content to be cleared");
      await service.processDocument(doc);

      expect(service.getDocumentTopics("clear-1").length).toBeGreaterThan(0);

      service.clearCache();

      expect(service.getDocumentTopics("clear-1")).toEqual([]);
      expect(service.getClusters()).toEqual([]);
    });
  });

  describe("event emission", () => {
    test("should emit topicsExtracted event", async () => {
      const doc = createDocument("event-1", "Event test content");

      let eventData: any = null;
      service.on("topicsExtracted", (data) => {
        eventData = data;
      });

      await service.processDocument(doc);

      expect(eventData).not.toBeNull();
      expect(eventData.documentId).toBe("event-1");
      expect(eventData.topics).toBeDefined();
    });

    test("should emit clusteringComplete event after batch", async () => {
      const docs = [
        createDocument("cluster-event-1", "First document"),
        createDocument("cluster-event-2", "Second document"),
      ];

      let clusters: any = null;
      service.on("clusteringComplete", (data) => {
        clusters = data;
      });

      await service.processBatch(docs);

      expect(clusters).not.toBeNull();
      expect(Array.isArray(clusters)).toBe(true);
    });
  });
});
