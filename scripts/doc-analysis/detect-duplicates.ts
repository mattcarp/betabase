#!/usr/bin/env ts-node
/**
 * Duplicate Detection - Finds exact, near-duplicate, and similar documents
 * Uses file hashes and embedding cosine similarity
 */

import * as fs from 'fs'
import * as path from 'path'

interface DocumentMetadata {
  path: string
  relativePath: string
  type: string
  size: number
  modified: Date
  hash: string
}

interface ParsedDocument {
  filePath: string
  relativePath: string
  success: boolean
  title: string
  content: { text: string }
  embedding?: number[]
}

interface DuplicateCluster {
  type: 'exact' | 'near-duplicate' | 'similar'
  similarity: number
  original: string
  duplicates: string[]
  action: 'delete_duplicates' | 'consolidate' | 'review'
  reason: string
}

interface OutdatedDocument {
  file: string
  last_updated?: string
  newer_version?: string
  action: 'archive' | 'update' | 'review'
  reason: string
}

interface DeduplicationReport {
  scanDate: string
  totalDocuments: number
  exact_duplicates: DuplicateCluster[]
  similar_documents: DuplicateCluster[]
  outdated_documents: OutdatedDocument[]
  statistics: {
    exact_duplicate_count: number
    similar_cluster_count: number
    outdated_count: number
    potential_savings: number
  }
}

class DuplicateDetector {
  /**
   * Calculate cosine similarity between two embedding vectors
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0

    let dotProduct = 0
    let normA = 0
    let normB = 0

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i]
      normA += a[i] * a[i]
      normB += b[i] * b[i]
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
  }

  /**
   * Find exact duplicates by file hash
   */
  findExactDuplicates(
    documents: DocumentMetadata[]
  ): DuplicateCluster[] {
    console.log('\n🔍 Finding exact duplicates...')

    const hashGroups = new Map<string, DocumentMetadata[]>()

    // Group by hash
    for (const doc of documents) {
      const group = hashGroups.get(doc.hash) || []
      group.push(doc)
      hashGroups.set(doc.hash, group)
    }

    // Find groups with duplicates
    const clusters: DuplicateCluster[] = []

    for (const [hash, group] of hashGroups) {
      if (group.length > 1) {
        // Sort by modification date (oldest first = original)
        group.sort((a, b) => a.modified.getTime() - b.modified.getTime())

        clusters.push({
          type: 'exact',
          similarity: 1.0,
          original: group[0].relativePath,
          duplicates: group.slice(1).map((d) => d.relativePath),
          action: 'delete_duplicates',
          reason: 'Identical file content (same SHA-256 hash)',
        })
      }
    }

    console.log(`   Found ${clusters.length} exact duplicate clusters`)

    return clusters
  }

  /**
   * Find similar documents by embedding similarity
   */
  findSimilarDocuments(
    documents: ParsedDocument[],
    threshold: number = 0.85
  ): DuplicateCluster[] {
    console.log(`\n🔍 Finding similar documents (threshold: ${threshold})...`)

    const clusters: DuplicateCluster[] = []
    const processed = new Set<string>()

    // Only process documents with embeddings
    const docsWithEmbeddings = documents.filter(
      (d) => d.success && d.embedding && d.embedding.length > 0
    )

    console.log(`   Analyzing ${docsWithEmbeddings.length} documents with embeddings`)

    for (let i = 0; i < docsWithEmbeddings.length; i++) {
      const docA = docsWithEmbeddings[i]

      if (processed.has(docA.relativePath)) continue

      const similar: Array<{ path: string; similarity: number }> = []

      for (let j = i + 1; j < docsWithEmbeddings.length; j++) {
        const docB = docsWithEmbeddings[j]

        if (processed.has(docB.relativePath)) continue

        const similarity = this.cosineSimilarity(
          docA.embedding!,
          docB.embedding!
        )

        if (similarity >= threshold) {
          similar.push({
            path: docB.relativePath,
            similarity,
          })
          processed.add(docB.relativePath)
        }
      }

      if (similar.length > 0) {
        // Determine action based on similarity
        const avgSimilarity =
          similar.reduce((sum, s) => sum + s.similarity, 0) / similar.length

        const action: 'delete_duplicates' | 'consolidate' | 'review' =
          avgSimilarity >= 0.95
            ? 'delete_duplicates'
            : avgSimilarity >= 0.85
              ? 'consolidate'
              : 'review'

        clusters.push({
          type: avgSimilarity >= 0.95 ? 'near-duplicate' : 'similar',
          similarity: avgSimilarity,
          original: docA.relativePath,
          duplicates: similar.map((s) => s.path),
          action,
          reason:
            avgSimilarity >= 0.95
              ? 'Nearly identical content (95%+ similarity)'
              : 'Similar content that could be consolidated',
        })

        processed.add(docA.relativePath)
      }
    }

    console.log(`   Found ${clusters.length} similar document clusters`)

    return clusters
  }

  /**
   * Find outdated documents by pattern matching
   */
  findOutdatedDocuments(
    documents: DocumentMetadata[]
  ): OutdatedDocument[] {
    console.log('\n🔍 Finding outdated documents...')

    const outdated: OutdatedDocument[] = []
    const filesByBasename = new Map<string, DocumentMetadata[]>()

    // Group files by base name pattern
    for (const doc of documents) {
      const basename = path.basename(doc.relativePath)
      const basePattern = basename
        .replace(/[-_\s]?\d+\.md$/, '.md') // Remove trailing numbers
        .replace(/[-_\s]?v?\d+(\.\d+)*\.md$/, '.md') // Remove versions
        .replace(/[-_\s]?(draft|wip|old|backup|copy)\.md$/i, '.md')

      const group = filesByBasename.get(basePattern) || []
      group.push(doc)
      filesByBasename.set(basePattern, group)
    }

    // Find version patterns
    for (const [pattern, group] of filesByBasename) {
      if (group.length > 1) {
        // Sort by modification date
        group.sort((a, b) => b.modified.getTime() - a.modified.getTime())

        const newest = group[0]

        for (let i = 1; i < group.length; i++) {
          const older = group[i]
          const basename = path.basename(older.relativePath)

          // Check for obvious outdated patterns
          if (
            basename.match(/[-_\s]?2\.md$/i) || // " 2.md"
            basename.match(/[-_\s]?old\.md$/i) ||
            basename.match(/[-_\s]?backup\.md$/i) ||
            basename.match(/[-_\s]?draft\.md$/i) ||
            basename.match(/[-_\s]?wip\.md$/i) ||
            basename.match(/[-_\s]?copy\.md$/i)
          ) {
            outdated.push({
              file: older.relativePath,
              last_updated: older.modified.toISOString().split('T')[0],
              newer_version: newest.relativePath,
              action: 'archive',
              reason: `Appears to be outdated version of ${path.basename(newest.relativePath)}`,
            })
          }
        }
      }
    }

    // Find COMPLETE vs STATUS pattern
    const statusDocs = documents.filter((d) =>
      d.relativePath.match(/-STATUS\.md$/i)
    )
    const completeDocs = documents.filter((d) =>
      d.relativePath.match(/-COMPLETE\.md$/i)
    )

    for (const status of statusDocs) {
      const baseName = status.relativePath.replace(/-STATUS\.md$/i, '')
      const complete = completeDocs.find((c) =>
        c.relativePath.startsWith(baseName)
      )

      if (complete && complete.modified > status.modified) {
        outdated.push({
          file: status.relativePath,
          last_updated: status.modified.toISOString().split('T')[0],
          newer_version: complete.relativePath,
          action: 'archive',
          reason: 'Superseded by COMPLETE version',
        })
      }
    }

    console.log(`   Found ${outdated.length} potentially outdated documents`)

    return outdated
  }

  /**
   * Run full deduplication analysis
   */
  async analyze(options: {
    inventoryFile: string
    parsedFile?: string
    outputFile: string
  }): Promise<DeduplicationReport> {
    console.log('🔍 Starting deduplication analysis...\n')

    // Load inventory
    const inventory = JSON.parse(
      await fs.promises.readFile(options.inventoryFile, 'utf-8')
    )
    const documents: DocumentMetadata[] = inventory.documents.map((d: any) => ({
      ...d,
      modified: new Date(d.modified),
    }))

    console.log(`📚 Analyzing ${documents.length} documents`)

    // Find exact duplicates
    const exactDuplicates = this.findExactDuplicates(documents)

    // Find similar documents (if embeddings available)
    let similarDocuments: DuplicateCluster[] = []
    if (options.parsedFile && fs.existsSync(options.parsedFile)) {
      const parsed = JSON.parse(
        await fs.promises.readFile(options.parsedFile, 'utf-8')
      )
      similarDocuments = this.findSimilarDocuments(parsed.documents, 0.85)
    } else {
      console.log('\n⚠️  No parsed documents file found, skipping similarity analysis')
    }

    // Find outdated documents
    const outdatedDocuments = this.findOutdatedDocuments(documents)

    // Calculate statistics
    const exactDupCount = exactDuplicates.reduce(
      (sum, c) => sum + c.duplicates.length,
      0
    )
    const similarCount = similarDocuments.reduce(
      (sum, c) => sum + c.duplicates.length,
      0
    )

    const report: DeduplicationReport = {
      scanDate: new Date().toISOString(),
      totalDocuments: documents.length,
      exact_duplicates: exactDuplicates,
      similar_documents: similarDocuments,
      outdated_documents: outdatedDocuments,
      statistics: {
        exact_duplicate_count: exactDupCount,
        similar_cluster_count: similarDocuments.length,
        outdated_count: outdatedDocuments.length,
        potential_savings:
          exactDupCount + similarCount + outdatedDocuments.length,
      },
    }

    // Save report
    await fs.promises.writeFile(
      options.outputFile,
      JSON.stringify(report, null, 2),
      'utf-8'
    )

    console.log('\n✅ Analysis complete!')
    console.log(`\n📊 Results:`)
    console.log(`   Exact duplicates: ${exactDupCount} files`)
    console.log(`   Similar clusters: ${similarDocuments.length}`)
    console.log(`   Outdated documents: ${outdatedDocuments.length}`)
    console.log(`   Potential savings: ${report.statistics.potential_savings} files`)
    console.log(`\n💾 Report saved to: ${options.outputFile}`)

    return report
  }
}

// CLI execution
if (require.main === module) {
  const inventoryFile =
    process.argv[2] ||
    path.join(__dirname, 'document-inventory.json')
  const parsedFile = process.argv[3] || path.join(__dirname, 'parsed-documents.json')
  const outputFile =
    process.argv[4] ||
    path.join(__dirname, 'deduplication-report.json')

  const detector = new DuplicateDetector()
  detector
    .analyze({ inventoryFile, parsedFile, outputFile })
    .then(() => {
      console.log('\n✨ Done!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Error:', error)
      process.exit(1)
    })
}

export { DuplicateDetector, DuplicateCluster, DeduplicationReport }


