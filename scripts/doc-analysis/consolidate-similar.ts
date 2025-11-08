#!/usr/bin/env ts-node
/**
 * AI-Powered Consolidation - Merges similar documents into comprehensive versions
 * Only processes external scraped content (aoma_crawl/, confluence/, jira/)
 */

import * as fs from 'fs'
import * as path from 'path'
import OpenAI from 'openai'
import dotenv from 'dotenv'

dotenv.config()

interface DuplicateCluster {
  type: 'exact' | 'near-duplicate' | 'similar'
  similarity: number
  original: string
  duplicates: string[]
  action: 'delete_duplicates' | 'consolidate' | 'review'
  reason: string
}

interface ConsolidatedDocument {
  outputPath: string
  sourceFiles: string[]
  consolidationReason: string
  success: boolean
  error?: string
}

class DocumentConsolidator {
  private openai: OpenAI

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }

  /**
   * Check if file is in allowed external content directories
   */
  private isExternalContent(filePath: string): boolean {
    return (
      filePath.startsWith('aoma_crawl/') ||
      filePath.startsWith('confluence/') ||
      filePath.startsWith('jira/')
    )
  }

  /**
   * Use AI to consolidate multiple similar documents
   */
  async consolidateDocuments(
    files: string[],
    reason: string
  ): Promise<string> {
    console.log(`   🧠 AI consolidation of ${files.length} documents...`)

    // Read all source files
    const contents = await Promise.all(
      files.map(async (file) => {
        const content = await fs.promises.readFile(file, 'utf-8')
        return {
          file: path.basename(file),
          content,
        }
      })
    )

    // Prepare prompt for AI
    const prompt = `You are consolidating multiple similar documents into one comprehensive document.

REASON FOR CONSOLIDATION: ${reason}

SOURCE DOCUMENTS:
${contents.map((c, i) => `
=== DOCUMENT ${i + 1}: ${c.file} ===
${c.content}
`).join('\n')}

INSTRUCTIONS:
1. Create a single, comprehensive document that merges all the information
2. Remove redundancies while preserving all unique information
3. Organize content logically with clear headings
4. Preserve all important details, examples, and technical information
5. Add a header noting this is a consolidated document
6. Use Markdown format
7. Keep the tone professional and technical

Return ONLY the consolidated Markdown content, no explanations.`

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content:
              'You are a technical documentation expert specializing in consolidating similar documents.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 4000,
      })

      const consolidated = response.choices[0].message.content || ''

      // Add metadata header
      const metadata = `<!--
CONSOLIDATED DOCUMENT
Generated: ${new Date().toISOString()}
Source Files: ${files.join(', ')}
Reason: ${reason}
-->

`

      return metadata + consolidated
    } catch (error) {
      throw new Error(`AI consolidation failed: ${error}`)
    }
  }

  /**
   * Consolidate similar document clusters from report
   */
  async consolidateFromReport(
    reportPath: string,
    parsedDocsPath: string,
    options: {
      dryRun?: boolean
      outputDir?: string
    } = {}
  ): Promise<ConsolidatedDocument[]> {
    console.log('\n🔄 Starting consolidation process...\n')
    console.log('   Scope: External scraped content only\n')

    const report = JSON.parse(
      await fs.promises.readFile(reportPath, 'utf-8')
    )
    const results: ConsolidatedDocument[] = []

    // Find clusters marked for consolidation
    const consolidationClusters = report.similar_documents.filter(
      (c: DuplicateCluster) => c.action === 'consolidate'
    )

    console.log(
      `Found ${consolidationClusters.length} clusters to consolidate\n`
    )

    for (let i = 0; i < consolidationClusters.length; i++) {
      const cluster = consolidationClusters[i]
      const allFiles = [cluster.original, ...cluster.duplicates]

      // Safety check: only consolidate external content
      const externalFiles = allFiles.filter((f) =>
        this.isExternalContent(f)
      )

      if (externalFiles.length === 0) {
        console.log(
          `⚠️  Cluster ${i + 1}: No external content files, skipping`
        )
        continue
      }

      if (externalFiles.length !== allFiles.length) {
        console.log(
          `⚠️  Cluster ${i + 1}: Filtered out ${allFiles.length - externalFiles.length} internal files`
        )
      }

      console.log(`\n📄 Cluster ${i + 1}/${consolidationClusters.length}`)
      console.log(`   Files: ${externalFiles.map((f) => path.basename(f)).join(', ')}`)
      console.log(
        `   Similarity: ${Math.round(cluster.similarity * 100)}%`
      )

      try {
        // Consolidate with AI
        const consolidated = await this.consolidateDocuments(
          externalFiles,
          cluster.reason
        )

        // Determine output path
        const outputDir = options.outputDir || path.dirname(cluster.original)
        const baseName = path.basename(
          cluster.original,
          path.extname(cluster.original)
        )
        const outputPath = path.join(
          outputDir,
          `${baseName}-consolidated.md`
        )

        if (!options.dryRun) {
          // Ensure output directory exists
          if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true })
          }

          // Write consolidated document
          await fs.promises.writeFile(outputPath, consolidated, 'utf-8')
          console.log(`   ✅ Saved to: ${outputPath}`)
        } else {
          console.log(`   [DRY RUN] Would save to: ${outputPath}`)
        }

        results.push({
          outputPath,
          sourceFiles: externalFiles,
          consolidationReason: cluster.reason,
          success: true,
        })
      } catch (error) {
        console.error(`   ❌ Error: ${error}`)
        results.push({
          outputPath: '',
          sourceFiles: externalFiles,
          consolidationReason: cluster.reason,
          success: false,
          error: error instanceof Error ? error.message : String(error),
        })
      }

      // Rate limiting
      if (i < consolidationClusters.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
    }

    console.log('\n✅ Consolidation complete!')
    console.log(`\n📊 Results:`)
    console.log(
      `   Successful: ${results.filter((r) => r.success).length}`
    )
    console.log(`   Failed: ${results.filter((r) => !r.success).length}`)

    return results
  }
}

// CLI execution
if (require.main === module) {
  const reportPath =
    process.argv[2] ||
    path.join(__dirname, 'deduplication-report.json')
  const parsedDocsPath =
    process.argv[3] ||
    path.join(__dirname, 'parsed-documents.json')
  const dryRun = process.argv.includes('--dry-run')

  console.log('🔄 AI-Powered Document Consolidation')
  console.log('   Scope: aoma_crawl/, confluence/, jira/ ONLY\n')

  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No files will be created\n')
  }

  const consolidator = new DocumentConsolidator()

  consolidator
    .consolidateFromReport(reportPath, parsedDocsPath, { dryRun })
    .then(() => {
      console.log('\n✨ Done!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Error:', error)
      process.exit(1)
    })
}

export { DocumentConsolidator, ConsolidatedDocument }

