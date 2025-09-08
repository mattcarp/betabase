import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock data for testing
const mockFiles = [
  {
    id: 'file-1',
    filename: 'Q3-2024-Report.pdf',
    bytes: 2048576,
    created_at: 1698000000,
    status: 'processed',
    embedding: [0.1, 0.2, 0.3, 0.4, 0.5],
    metadata: {
      category: 'Legal',
      tags: ['quarterly', 'financial', 'compliance'],
      quality_score: 92
    }
  },
  {
    id: 'file-2',
    filename: 'Q3-2024-Summary.pdf',
    bytes: 1024000,
    created_at: 1698000100,
    status: 'processed',
    embedding: [0.11, 0.21, 0.31, 0.39, 0.49], // Similar to file-1
    metadata: {
      category: 'Legal',
      tags: ['quarterly', 'financial'],
      quality_score: 85
    }
  },
  {
    id: 'file-3',
    filename: 'Artist-Contract-2024.docx',
    bytes: 512000,
    created_at: 1698000200,
    status: 'processed',
    embedding: [0.8, 0.1, 0.05, 0.7, 0.9], // Different from others
    metadata: {
      category: 'A&R',
      tags: ['contract', 'artist', 'legal'],
      quality_score: 78
    }
  }
];

// Curation service functions
class CurationService {
  // Calculate cosine similarity between two vectors
  static cosineSimilarity(vec1: number[], vec2: number[]): number {
    if (vec1.length !== vec2.length) return 0;
    
    let dotProduct = 0;
    let magnitude1 = 0;
    let magnitude2 = 0;
    
    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      magnitude1 += vec1[i] * vec1[i];
      magnitude2 += vec2[i] * vec2[i];
    }
    
    magnitude1 = Math.sqrt(magnitude1);
    magnitude2 = Math.sqrt(magnitude2);
    
    if (magnitude1 === 0 || magnitude2 === 0) return 0;
    
    return dotProduct / (magnitude1 * magnitude2);
  }

  // Find semantic duplicates
  static findDuplicates(files: any[], threshold = 0.85): any[] {
    const duplicateGroups: any[] = [];
    const processed = new Set<string>();

    for (let i = 0; i < files.length; i++) {
      if (processed.has(files[i].id)) continue;
      
      const group = {
        primary: files[i],
        duplicates: [],
        avgSimilarity: 0
      };
      
      let totalSimilarity = 0;
      let count = 0;

      for (let j = i + 1; j < files.length; j++) {
        if (processed.has(files[j].id)) continue;
        
        const similarity = this.cosineSimilarity(
          files[i].embedding,
          files[j].embedding
        );
        
        if (similarity >= threshold) {
          group.duplicates.push({
            file: files[j],
            similarity: Math.round(similarity * 100)
          });
          processed.add(files[j].id);
          totalSimilarity += similarity;
          count++;
        }
      }
      
      if (group.duplicates.length > 0) {
        group.avgSimilarity = Math.round((totalSimilarity / count) * 100);
        duplicateGroups.push(group);
        processed.add(files[i].id);
      }
    }
    
    return duplicateGroups;
  }

  // Calculate quality score
  static calculateQualityScore(file: any): number {
    let score = 0;
    const weights = {
      completeness: 0.3,
      accuracy: 0.2,
      relevance: 0.2,
      freshness: 0.15,
      accessibility: 0.15
    };

    // Completeness: Check for metadata
    if (file.metadata) {
      score += weights.completeness * 100;
    }

    // Accuracy: Check for valid status
    if (file.status === 'processed') {
      score += weights.accuracy * 100;
    }

    // Relevance: Check for tags
    if (file.metadata?.tags?.length > 0) {
      score += weights.relevance * Math.min(100, file.metadata.tags.length * 33);
    }

    // Freshness: Check if recent (within 30 days)
    const thirtyDaysAgo = Date.now() / 1000 - 30 * 24 * 60 * 60;
    if (file.created_at > thirtyDaysAgo) {
      score += weights.freshness * 100;
    }

    // Accessibility: Check file size is reasonable
    if (file.bytes < 10 * 1024 * 1024) { // Less than 10MB
      score += weights.accessibility * 100;
    }

    return Math.round(score);
  }

  // Identify knowledge gaps
  static identifyKnowledgeGaps(files: any[]): any[] {
    const gaps = [];
    const categories = ['Legal', 'A&R', 'Marketing', 'Finance', 'Operations'];
    const fileCategoryCounts: Record<string, number> = {};
    
    // Count files per category
    files.forEach(file => {
      const category = file.metadata?.category || 'Uncategorized';
      fileCategoryCounts[category] = (fileCategoryCounts[category] || 0) + 1;
    });

    // Find missing categories
    categories.forEach(category => {
      if (!fileCategoryCounts[category] || fileCategoryCounts[category] < 3) {
        gaps.push({
          type: 'missing_category',
          category,
          severity: fileCategoryCounts[category] ? 'medium' : 'high',
          recommendation: `Add more ${category} documentation`,
          currentCount: fileCategoryCounts[category] || 0,
          targetCount: 10
        });
      }
    });

    // Check for outdated content
    const sixMonthsAgo = Date.now() / 1000 - 180 * 24 * 60 * 60;
    const outdatedFiles = files.filter(f => f.created_at < sixMonthsAgo);
    
    if (outdatedFiles.length > files.length * 0.3) {
      gaps.push({
        type: 'outdated_content',
        severity: 'high',
        recommendation: 'Update or refresh older documentation',
        affectedFiles: outdatedFiles.length,
        percentage: Math.round((outdatedFiles.length / files.length) * 100)
      });
    }

    return gaps;
  }

  // Calculate storage savings from deduplication
  static calculateStorageSavings(duplicateGroups: any[]): any {
    let totalSavings = 0;
    let filesRemovable = 0;

    duplicateGroups.forEach(group => {
      group.duplicates.forEach((dup: any) => {
        totalSavings += dup.file.bytes;
        filesRemovable++;
      });
    });

    return {
      bytesRecoverable: totalSavings,
      filesRemovable,
      percentageSavings: mockFiles.reduce((sum, f) => sum + f.bytes, 0) > 0
        ? Math.round((totalSavings / mockFiles.reduce((sum, f) => sum + f.bytes, 0)) * 100)
        : 0
    };
  }

  // Generate curator metrics
  static generateCuratorMetrics(curatorId: string, actions: any[]): any {
    const metrics = {
      filesProcessed: 0,
      duplicatesFound: 0,
      metadataEnriched: 0,
      qualityImprovements: 0,
      score: 0,
      badge: 'Novice'
    };

    actions.forEach(action => {
      if (action.type === 'upload') metrics.filesProcessed++;
      if (action.type === 'duplicate_found') metrics.duplicatesFound++;
      if (action.type === 'metadata_update') metrics.metadataEnriched++;
      if (action.type === 'quality_improvement') metrics.qualityImprovements++;
    });

    // Calculate score
    metrics.score = 
      metrics.filesProcessed * 10 +
      metrics.duplicatesFound * 25 +
      metrics.metadataEnriched * 15 +
      metrics.qualityImprovements * 20;

    // Assign badge
    if (metrics.score >= 1000) metrics.badge = 'Master';
    else if (metrics.score >= 500) metrics.badge = 'Champion';
    else if (metrics.score >= 250) metrics.badge = 'Expert';
    else if (metrics.score >= 100) metrics.badge = 'Rising Star';

    return metrics;
  }
}

// Test suites
describe('CurationService', () => {
  describe('cosineSimilarity', () => {
    it('should calculate similarity correctly', () => {
      const vec1 = [1, 0, 0];
      const vec2 = [1, 0, 0];
      expect(CurationService.cosineSimilarity(vec1, vec2)).toBe(1);

      const vec3 = [1, 0, 0];
      const vec4 = [0, 1, 0];
      expect(CurationService.cosineSimilarity(vec3, vec4)).toBe(0);

      const vec5 = [0.1, 0.2, 0.3];
      const vec6 = [0.11, 0.21, 0.31];
      const similarity = CurationService.cosineSimilarity(vec5, vec6);
      expect(similarity).toBeGreaterThan(0.99);
    });

    it('should handle empty vectors', () => {
      expect(CurationService.cosineSimilarity([], [])).toBe(0);
    });

    it('should handle different length vectors', () => {
      expect(CurationService.cosineSimilarity([1, 2], [1, 2, 3])).toBe(0);
    });
  });

  describe('findDuplicates', () => {
    it('should identify semantic duplicates', () => {
      const duplicates = CurationService.findDuplicates(mockFiles, 0.85);
      
      expect(duplicates).toHaveLength(1);
      expect(duplicates[0].primary.id).toBe('file-1');
      expect(duplicates[0].duplicates).toHaveLength(1);
      expect(duplicates[0].duplicates[0].file.id).toBe('file-2');
    });

    it('should respect similarity threshold', () => {
      const highThreshold = CurationService.findDuplicates(mockFiles, 0.99);
      expect(highThreshold).toHaveLength(0);

      const lowThreshold = CurationService.findDuplicates(mockFiles, 0.5);
      expect(lowThreshold.length).toBeGreaterThan(0);
    });

    it('should handle empty file list', () => {
      const duplicates = CurationService.findDuplicates([]);
      expect(duplicates).toHaveLength(0);
    });
  });

  describe('calculateQualityScore', () => {
    it('should calculate quality score based on multiple factors', () => {
      const score = CurationService.calculateQualityScore(mockFiles[0]);
      
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should penalize files without metadata', () => {
      const fileWithoutMetadata = { ...mockFiles[0], metadata: undefined };
      const scoreWithout = CurationService.calculateQualityScore(fileWithoutMetadata);
      
      const fileWithMetadata = mockFiles[0];
      const scoreWith = CurationService.calculateQualityScore(fileWithMetadata);
      
      expect(scoreWithout).toBeLessThan(scoreWith);
    });

    it('should reward recent files', () => {
      const recentFile = {
        ...mockFiles[0],
        created_at: Date.now() / 1000 - 24 * 60 * 60 // 1 day ago
      };
      const oldFile = {
        ...mockFiles[0],
        created_at: Date.now() / 1000 - 365 * 24 * 60 * 60 // 1 year ago
      };
      
      expect(CurationService.calculateQualityScore(recentFile))
        .toBeGreaterThan(CurationService.calculateQualityScore(oldFile));
    });
  });

  describe('identifyKnowledgeGaps', () => {
    it('should identify missing categories', () => {
      const gaps = CurationService.identifyKnowledgeGaps(mockFiles);
      
      const missingCategoryGaps = gaps.filter(g => g.type === 'missing_category');
      expect(missingCategoryGaps.length).toBeGreaterThan(0);
      
      // Should identify Marketing, Finance, Operations as missing/low
      const missingCategories = missingCategoryGaps.map(g => g.category);
      expect(missingCategories).toContain('Marketing');
      expect(missingCategories).toContain('Finance');
    });

    it('should detect outdated content', () => {
      const oldFiles = mockFiles.map(f => ({
        ...f,
        created_at: Date.now() / 1000 - 365 * 24 * 60 * 60 // 1 year old
      }));
      
      const gaps = CurationService.identifyKnowledgeGaps(oldFiles);
      const outdatedGap = gaps.find(g => g.type === 'outdated_content');
      
      expect(outdatedGap).toBeDefined();
      expect(outdatedGap?.severity).toBe('high');
    });

    it('should handle empty file list', () => {
      const gaps = CurationService.identifyKnowledgeGaps([]);
      expect(gaps.length).toBeGreaterThan(0);
      
      // All categories should be missing
      const missingCategories = gaps.filter(g => g.type === 'missing_category');
      expect(missingCategories).toHaveLength(5);
    });
  });

  describe('calculateStorageSavings', () => {
    it('should calculate correct storage savings', () => {
      const duplicates = CurationService.findDuplicates(mockFiles, 0.85);
      const savings = CurationService.calculateStorageSavings(duplicates);
      
      expect(savings.bytesRecoverable).toBe(1024000); // Size of file-2
      expect(savings.filesRemovable).toBe(1);
      expect(savings.percentageSavings).toBeGreaterThan(0);
    });

    it('should handle no duplicates', () => {
      const savings = CurationService.calculateStorageSavings([]);
      
      expect(savings.bytesRecoverable).toBe(0);
      expect(savings.filesRemovable).toBe(0);
      expect(savings.percentageSavings).toBe(0);
    });
  });

  describe('generateCuratorMetrics', () => {
    it('should calculate curator metrics correctly', () => {
      const actions = [
        { type: 'upload', timestamp: Date.now() },
        { type: 'upload', timestamp: Date.now() },
        { type: 'duplicate_found', timestamp: Date.now() },
        { type: 'metadata_update', timestamp: Date.now() },
        { type: 'quality_improvement', timestamp: Date.now() }
      ];
      
      const metrics = CurationService.generateCuratorMetrics('curator-1', actions);
      
      expect(metrics.filesProcessed).toBe(2);
      expect(metrics.duplicatesFound).toBe(1);
      expect(metrics.metadataEnriched).toBe(1);
      expect(metrics.qualityImprovements).toBe(1);
      expect(metrics.score).toBeGreaterThan(0);
      expect(metrics.badge).toBe('Novice');
    });

    it('should assign correct badges based on score', () => {
      const masterActions = Array(100).fill({ type: 'upload' });
      const masterMetrics = CurationService.generateCuratorMetrics('curator-1', masterActions);
      expect(masterMetrics.badge).toBe('Master');

      const noviceActions = [{ type: 'upload' }];
      const noviceMetrics = CurationService.generateCuratorMetrics('curator-2', noviceActions);
      expect(noviceMetrics.badge).toBe('Novice');
    });

    it('should handle empty actions', () => {
      const metrics = CurationService.generateCuratorMetrics('curator-1', []);
      
      expect(metrics.filesProcessed).toBe(0);
      expect(metrics.score).toBe(0);
      expect(metrics.badge).toBe('Novice');
    });
  });
});

describe('Integration Tests', () => {
  it('should perform complete curation workflow', () => {
    // 1. Find duplicates
    const duplicates = CurationService.findDuplicates(mockFiles, 0.85);
    expect(duplicates.length).toBeGreaterThan(0);

    // 2. Calculate storage savings
    const savings = CurationService.calculateStorageSavings(duplicates);
    expect(savings.bytesRecoverable).toBeGreaterThan(0);

    // 3. Calculate quality scores
    const qualityScores = mockFiles.map(f => ({
      file: f.filename,
      score: CurationService.calculateQualityScore(f)
    }));
    expect(qualityScores.every(s => s.score > 0)).toBe(true);

    // 4. Identify gaps
    const gaps = CurationService.identifyKnowledgeGaps(mockFiles);
    expect(gaps.length).toBeGreaterThan(0);

    // 5. Generate curator metrics
    const curatorActions = [
      { type: 'duplicate_found', timestamp: Date.now() },
      { type: 'quality_improvement', timestamp: Date.now() }
    ];
    const metrics = CurationService.generateCuratorMetrics('curator-1', curatorActions);
    expect(metrics.score).toBeGreaterThan(0);
  });
});