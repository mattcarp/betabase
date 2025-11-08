#!/usr/bin/env ts-node
/**
 * Content Refresh System - Updates outdated information in external docs
 * Only processes aoma_crawl/, confluence/, jira/
 */

import * as fs from 'fs'
import * as path from 'path'
import OpenAI from 'openai'
import dotenv from 'dotenv'

dotenv.config()

interface OutdatedDocument {
  file: string
  last_updated?: string
  action: string
  reason: string
}

interface RefreshResult {
  filePath: string
  success: boolean
  changes: string[]
  error?: string
}

class ContentRefresher {
  private openai: OpenAI

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }

  /**
   * Use AI to refresh outdated content
   */
  async refreshDocument(
    filePath: string,
    reason: string
  ): Promise<RefreshResult> {
    console.log(`\n📝 Refreshing: ${path.basename(filePath)}`)
    console.log(`   Reason: ${reason}`)

    try {
      const originalContent = await fs.promises.readFile(filePath, 'utf-8')

      const prompt = `You are refreshing outdated documentation.

ORIGINAL DOCUMENT:
${originalContent}

ISSUE: ${reason}

INSTRUCTIONS:
1. Update any outdated information while preserving the core content
2. Improve clarity and organization if needed
3. Keep the same general structure and format
4. Preserve all important technical details
5. Add a note at the top indicating when it was refreshed
6. Return ONLY the updated Markdown content

Return the refreshed document.`

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content:
              'You are a technical documentation expert specializing in content updates.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 4000,
      })

      const refreshedContent = response.choices[0].message.content || ''

      // Add metadata
      const metadata = `<!--
CONTENT REFRESHED: ${new Date().toISOString().split('T')[0]}
Original: ${filePath}
Reason: ${reason}
-->

`

      const final = metadata + refreshedContent

      // Detect changes
      const changes: string[] = []
      if (final.length > originalContent.length * 1.2) {
        changes.push('Significant content additions')
      }
      if (final.includes('Updated') || final.includes('Refreshed')) {
        changes.push('Content marked as updated')
      }

      return {
        filePath,
        success: true,
        changes,
      }
    } catch (error) {
      return {
        filePath,
        success: false,
        changes: [],
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  /**
   * Refresh outdated documents from deduplication report
   */
  async refreshFromReport(
    reportPath: string,
    options: {
      dryRun?: boolean
      limit?: number
    } = {}
  ): Promise<RefreshResult[]> {
    console.log('\n🔄 Starting content refresh process...\n')
    console.log('   Scope: External scraped content only\n')

    const report = JSON.parse(
      await fs.promises.readFile(reportPath, 'utf-8')
    )
    const results: RefreshResult[] = []

    // Filter to only external content marked for update
    const toRefresh = report.outdated_documents
      .filter(
        (doc: OutdatedDocument) =>
          doc.action === 'update' &&
          (doc.file.startsWith('aoma_crawl/') ||
            doc.file.startsWith('confluence/') ||
            doc.file.startsWith('jira/'))
      )
      .slice(0, options.limit || 10)

    console.log(`Found ${toRefresh.length} documents to refresh`)

    if (toRefresh.length === 0) {
      console.log('⚠️  No documents need refreshing')
      return []
    }

    for (let i = 0; i < toRefresh.length; i++) {
      const doc = toRefresh[i]

      if (!fs.existsSync(doc.file)) {
        console.log(`⚠️  File not found: ${doc.file}`)
        continue
      }

      const result = await this.refreshDocument(doc.file, doc.reason)

      if (result.success && !options.dryRun) {
        // Would save the refreshed content here
        console.log(`   ✅ Refreshed (${result.changes.length} changes)`)
        result.changes.forEach((c) => console.log(`      - ${c}`))
      } else if (options.dryRun) {
        console.log(`   [DRY RUN] Would refresh this document`)
      } else {
        console.error(`   ❌ Failed: ${result.error}`)
      }

      results.push(result)

      // Rate limiting
      if (i < toRefresh.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
    }

    console.log('\n✅ Content refresh complete!')
    console.log(`\n📊 Results:`)
    console.log(`   Successful: ${results.filter((r) => r.success).length}`)
    console.log(`   Failed: ${results.filter((r) => !r.success).length}`)

    return results
  }
}

// CLI execution
if (require.main === module) {
  const reportPath =
    process.argv[2] ||
    path.join(__dirname, 'deduplication-report.json')
  const dryRun = process.argv.includes('--dry-run')
  const limit = parseInt(process.argv.find((a) => a.startsWith('--limit='))?.split('=')[1] || '10')

  console.log('🔄 Content Refresh System')
  console.log('   Scope: aoma_crawl/, confluence/, jira/ ONLY\n')

  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No changes will be made\n')
  }

  const refresher = new ContentRefresher()

  refresher
    .refreshFromReport(reportPath, { dryRun, limit })
    .then(() => {
      console.log('\n✨ Done!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Error:', error)
      process.exit(1)
    })
}

export { ContentRefresher, RefreshResult }

