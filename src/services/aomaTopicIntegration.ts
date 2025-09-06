/**
 * AOMA Knowledge Base Topic Integration
 *
 * Connects the topic extraction service with the AOMA knowledge base,
 * processing documents from the vector store and MCP server.
 */

import {
  topicExtractionService,
  Document,
  DocumentType,
} from "./topicExtractionService";
import { VectorStoreService } from "./vectorStoreService";

interface AOMADocument {
  id: string;
  filename: string;
  content?: string;
  metadata?: {
    type?: string;
    source?: string;
    jiraTicket?: string;
    releaseVersion?: string;
    createdAt?: Date;
  };
}

export class AOMATopicIntegration {
  private vectorStore: VectorStoreService;
  private processedDocuments: Set<string> = new Set();
  private isInitialized: boolean = false;

  constructor() {
    // Initialize with the AOMA vector store
    const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY || "";
    const vectorStoreId = "vs_wJF8HgBFrYtdNaXUbUC2nfM"; // AOMA vector store ID

    this.vectorStore = new VectorStoreService(apiKey, vectorStoreId);
  }

  /**
   * Initialize the integration and process existing documents
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log("Initializing AOMA Topic Integration...");

      // Process sample AOMA documents (in production, would fetch from vector store)
      await this.processSampleDocuments();

      // Query AOMA knowledge base for initial content
      await this.queryAndProcessAOMAContent();

      this.isInitialized = true;
      console.log("AOMA Topic Integration initialized successfully");
    } catch (error) {
      console.error("Failed to initialize AOMA Topic Integration:", error);
      throw error;
    }
  }

  /**
   * Process sample AOMA documents for demonstration
   */
  private async processSampleDocuments(): Promise<void> {
    const sampleDocuments: AOMADocument[] = [
      {
        id: "aoma_doc_1",
        filename: "Archive_AudioMasterSubmissionGuidelines_v1.0.pdf",
        content: `Audio Master Submission Guidelines for AOMA
        
        File Naming Conventions:
        - Use consistent naming patterns for audio assets
        - Include version numbers in filenames
        - Avoid special characters except underscores and hyphens
        
        Audio Asset Types:
        - Multitrack sessions: Full recording sessions with individual tracks
        - Mix passes: Stereo or multichannel mixdowns
        - Stems: Grouped tracks for flexible mixing
        - Masters: Final processed audio ready for distribution
        
        Folder Structure for Archiving:
        - Project root folder with artist and album name
        - Subfolders for sessions, mixes, stems, and masters
        - Include metadata files in JSON or XML format
        
        Quality Requirements:
        - Minimum 24-bit, 48kHz for archival
        - Preserve original sample rates when possible
        - Include checksums for data integrity
        
        Integration with AOMA:
        - Upload via Aspera for large files
        - Use web interface for metadata entry
        - Automated validation checks file formats and naming`,
        metadata: {
          type: "technical_doc",
          source: "AOMA Documentation",
          createdAt: new Date("2024-01-15"),
        },
      },
      {
        id: "aoma_doc_2",
        filename: "AOMA_Digital_Archiving_Overview.pdf",
        content: `AOMA Digital Archiving System Overview
        
        Architecture:
        - AWS S3 for active storage with instant access
        - AWS Glacier for long-term archival storage
        - Redundant backups across multiple regions
        - CloudFront CDN for global distribution
        
        Storage Mechanisms:
        - Tiered storage based on access patterns
        - Automatic migration to Glacier after 90 days
        - Intelligent tiering for cost optimization
        - Metadata stored in PostgreSQL database
        
        Operational Benefits:
        - 99.999999999% durability for archived assets
        - Reduced storage costs through intelligent tiering
        - Global accessibility through web interface
        - Automated backup and disaster recovery
        
        Integration Points:
        - CARMA for contract management
        - Jira for issue tracking and workflows
        - Sony Ci for collaborative editing
        - Internal APIs for third-party integrations`,
        metadata: {
          type: "technical_doc",
          source: "AOMA Documentation",
          createdAt: new Date("2024-02-01"),
        },
      },
      {
        id: "aoma_doc_3",
        filename: "AOMA_Support_Notes.pdf",
        content: `AOMA Support Notes and Troubleshooting Guide
        
        Common Issues and Solutions:
        
        1. Aspera Upload Failures:
        - Check network connectivity and firewall settings
        - Verify Aspera client version compatibility
        - Ensure sufficient disk space on target
        - Contact support if error persists
        
        2. Metadata Validation Errors:
        - Review required fields in submission form
        - Check date formats (YYYY-MM-DD)
        - Verify ISRC codes are properly formatted
        - Ensure all artist names match database
        
        3. Batch Processing Issues:
        - Maximum batch size is 100 items
        - Use CSV template for bulk uploads
        - Validate data before submission
        - Monitor job status in dashboard
        
        4. Search and Retrieval Problems:
        - Use exact match for asset IDs
        - Apply filters to narrow results
        - Check user permissions for restricted content
        - Clear browser cache if interface issues occur
        
        Integration with CARMA:
        - Contracts automatically linked to assets
        - Rights management synchronized
        - Royalty tracking enabled
        - Audit trail maintained`,
        metadata: {
          type: "support_note",
          source: "AOMA Support",
          createdAt: new Date("2024-03-10"),
        },
      },
      {
        id: "aoma_doc_4",
        filename: "AOMA_Release_Notes_v8.5.pdf",
        content: `AOMA Release Notes - Version 8.5
        
        New Features:
        - Enhanced Lambda integration for serverless processing
        - Improved MCP server connectivity for AI agents
        - New bulk export functionality to Sony Ci
        - Advanced search with natural language queries
        
        Bug Fixes:
        - Fixed timeout issues with large file uploads
        - Resolved metadata sync errors with CARMA
        - Corrected timezone handling in reports
        - Fixed pagination in search results
        
        Performance Improvements:
        - 50% faster search response times
        - Reduced Lambda cold start latency
        - Optimized database queries for reports
        - Improved caching for frequently accessed assets
        
        Known Issues:
        - Occasional delays in Glacier retrieval
        - Unicode characters in filenames may cause issues
        - Batch processing limited to 100 items
        
        Upcoming Features:
        - AI-powered auto-tagging
        - Enhanced workflow automation
        - Mobile application for field recording
        - Integration with ElevenLabs for transcription`,
        metadata: {
          type: "release_note",
          source: "AOMA Development",
          releaseVersion: "8.5",
          createdAt: new Date("2024-08-12"),
        },
      },
      {
        id: "aoma_jira_1",
        filename: "JIRA-AOMA-2451.json",
        content: `Jira Ticket: AOMA-2451
        Title: Aspera upload fails for files over 10GB
        
        Description:
        Users report that Aspera uploads fail consistently when attempting to upload audio files larger than 10GB. The error message shows "Connection timeout" after approximately 30 minutes.
        
        Steps to Reproduce:
        1. Select audio file larger than 10GB
        2. Initiate Aspera upload through AOMA interface
        3. Wait for upload to progress
        4. Observe timeout error at ~30 minute mark
        
        Expected Result:
        Large files should upload successfully regardless of size
        
        Actual Result:
        Upload fails with timeout error
        
        Environment:
        - AOMA Version: 8.4.2
        - Aspera Client: 3.9.6
        - Browser: Chrome 120
        - OS: macOS 14.2
        
        Resolution:
        Increased Lambda timeout to 15 minutes and implemented chunked upload for files over 5GB. Fix deployed in version 8.5.`,
        metadata: {
          type: "jira_ticket",
          source: "Jira",
          jiraTicket: "AOMA-2451",
          createdAt: new Date("2024-07-20"),
        },
      },
    ];

    // Process each document
    for (const doc of sampleDocuments) {
      if (this.processedDocuments.has(doc.id)) continue;

      const document: Document = {
        id: doc.id,
        content: doc.content || "",
        title: doc.filename,
        type: this.mapDocumentType(doc.metadata?.type),
        metadata: doc.metadata,
        timestamp: doc.metadata?.createdAt || new Date(),
        source: doc.metadata?.source || "AOMA",
      };

      await topicExtractionService.processDocument(document, {
        minTermLength: 3,
        maxTerms: 15,
        minScore: 0.15,
        includeNgrams: true,
        ngramSize: 2,
      });

      this.processedDocuments.add(doc.id);
    }

    // Trigger clustering after processing all documents
    await topicExtractionService["clusterTopics"]();
  }

  /**
   * Query AOMA knowledge base via MCP and process content
   */
  private async queryAndProcessAOMAContent(): Promise<void> {
    try {
      // This would normally query the MCP server
      // For now, we'll use the sample data processed above
      console.log("AOMA content processed for topic extraction");

      // In production, would do:
      // const response = await fetch('/api/aoma/query', {
      //   method: 'POST',
      //   body: JSON.stringify({ query: 'get all documents' })
      // });
      // const documents = await response.json();
      // await this.processDocuments(documents);
    } catch (error) {
      console.error("Error querying AOMA content:", error);
    }
  }

  /**
   * Map document type string to DocumentType enum
   */
  private mapDocumentType(type?: string): DocumentType {
    if (!type) return "technical_doc";

    const typeMap: Record<string, DocumentType> = {
      technical_doc: "technical_doc",
      support_note: "support_note",
      release_note: "release_note",
      jira_ticket: "jira_ticket",
      workflow_doc: "workflow_doc",
    };

    return typeMap[type] || "technical_doc";
  }

  /**
   * Process new document uploaded through UI
   */
  async processUploadedDocument(
    file: File,
    additionalMetadata?: Record<string, any>,
  ): Promise<void> {
    try {
      // Read file content
      const content = await this.readFileContent(file);

      const document: Document = {
        id: `upload_${Date.now()}_${file.name}`,
        content,
        title: file.name,
        type: "user_upload",
        metadata: {
          ...additionalMetadata,
          originalName: file.name,
          size: file.size,
          uploadedAt: new Date(),
        },
        timestamp: new Date(),
        source: "User Upload",
      };

      // Process with topic extraction
      await topicExtractionService.processDocument(document, {
        minTermLength: 3,
        maxTerms: 20,
        minScore: 0.1,
        includeNgrams: true,
      });

      // Upload to vector store if API key is available
      if (process.env.NEXT_PUBLIC_OPENAI_API_KEY) {
        await this.vectorStore.uploadFile(file);
      }
    } catch (error) {
      console.error("Error processing uploaded document:", error);
      throw error;
    }
  }

  /**
   * Read file content as text
   */
  private async readFileContent(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const content = e.target?.result as string;
        resolve(content);
      };

      reader.onerror = (error) => {
        reject(error);
      };

      reader.readAsText(file);
    });
  }

  /**
   * Search AOMA knowledge base with topic enhancement
   */
  async searchWithTopics(query: string): Promise<{
    documents: Document[];
    topics: any[];
    clusters: any[];
  }> {
    // Find relevant topics
    const topics = topicExtractionService.searchTopics(query, 10);

    // Find related documents
    const documents: Document[] = [];
    const seen = new Set<string>();

    for (const topic of topics) {
      const related = topicExtractionService.findRelatedDocuments(
        topic.term,
        5,
      );
      for (const doc of related) {
        if (!seen.has(doc.id)) {
          seen.add(doc.id);
          documents.push(doc);
        }
      }
    }

    // Get relevant clusters
    const clusters = topics
      .map((topic) => {
        const cluster = topicExtractionService
          .getClusters()
          .find((c) => c.topics.some((t) => t.term === topic.term));
        return cluster;
      })
      .filter(Boolean);

    return {
      documents: documents.slice(0, 10),
      topics,
      clusters: Array.from(new Set(clusters)),
    };
  }

  /**
   * Get topic statistics for dashboard
   */
  getTopicStatistics(): {
    totalTopics: number;
    totalClusters: number;
    trendingTopics: any[];
    topCategories: Array<{ category: string; count: number }>;
  } {
    const allTopics = topicExtractionService.searchTopics("", 1000);
    const clusters = topicExtractionService.getClusters();
    const trending = topicExtractionService.getTrendingTopics(5);

    // Count topics by category
    const categoryCount = new Map<string, number>();
    for (const topic of allTopics) {
      const category = topic.category || "uncategorized";
      categoryCount.set(category, (categoryCount.get(category) || 0) + 1);
    }

    const topCategories = Array.from(categoryCount.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalTopics: allTopics.length,
      totalClusters: clusters.length,
      trendingTopics: trending,
      topCategories,
    };
  }

  /**
   * Export topic data for persistence
   */
  exportTopicData(): string {
    return topicExtractionService.exportTopics();
  }

  /**
   * Import previously exported topic data
   */
  importTopicData(jsonData: string): void {
    topicExtractionService.importTopics(jsonData);
  }
}

// Singleton instance
export const aomaTopicIntegration = new AOMATopicIntegration();

// Auto-initialize when imported
if (typeof window !== "undefined") {
  aomaTopicIntegration.initialize().catch(console.error);
}
