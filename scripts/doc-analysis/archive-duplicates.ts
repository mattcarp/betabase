#!/usr/bin/env ts-node
/**
 * Archive System - Safely moves duplicate documents to .archive/ with Git tracking
 * Only processes external scraped content (aoma_crawl/, confluence/, jira/)
 */

import * as fs from 'fs'
import * as path from 'path'
import { execSync } from 'child_process'

interface DuplicateCluster {
  type: 'exact' | 'near-duplicate' | 'similar'
  similarity: number
  original: string
  duplicates: string[]
  action: 'delete_duplicates' | 'consolidate' | 'review'
  reason: string
}

interface DeduplicationReport {
  exact_duplicates: DuplicateCluster[]
  similar_documents: DuplicateCluster[]
  outdated_documents: Array<{
    file: string
    newer_version?: string
    action: string
    reason: string
  }>
}

interface ArchiveResult {
  archived: string[]
  skipped: string[]
  errors: Array<{ file: string; error: string }>
}

class ArchiveSystem {
  private archiveDir: string
  private dryRun: boolean

  constructor(archiveDir: string = '.archive', dryRun: boolean = false) {
    this.archiveDir = archiveDir
    this.dryRun = dryRun
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
   * Ensure archive directory exists
   */
  private ensureArchiveDir(subdir?: string): string {
    const targetDir = subdir
      ? path.join(this.archiveDir, subdir)
      : this.archiveDir

    if (!this.dryRun && !fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true })
    }

    return targetDir
  }

  /**
   * Archive a single file with Git tracking
   */
  async archiveFile(
    filePath: string,
    reason: string,
    metadata?: any
  ): Promise<boolean> {
    // Safety check: only archive external content
    if (!this.isExternalContent(filePath)) {
      console.log(`   ⚠️  SKIPPED (not external content): ${filePath}`)
      return false
    }

    if (!fs.existsSync(filePath)) {
      console.log(`   ⚠️  File not found: ${filePath}`)
      return false
    }

    // Determine archive path (preserve directory structure)
    const timestamp = new Date().toISOString().split('T')[0]
    const archiveSubdir = path.dirname(filePath)
    const basename = path.basename(filePath)
    const archivePath = path.join(
      this.archiveDir,
      archiveSubdir,
      `${basename}.${timestamp}.archived`
    )

    console.log(`   📦 Archiving: ${filePath}`)
    console.log(`      → ${archivePath}`)
    console.log(`      Reason: ${reason}`)

    if (this.dryRun) {
      console.log(`      [DRY RUN - no changes made]`)
      return true
    }

    try {
      // Ensure archive subdirectory exists
      this.ensureArchiveDir(archiveSubdir)

      // Copy file to archive with metadata
      const content = await fs.promises.readFile(filePath, 'utf-8')
      const archivedContent = `<!--
ARCHIVED: ${timestamp}
ORIGINAL PATH: ${filePath}
REASON: ${reason}
${metadata ? `METADATA: ${JSON.stringify(metadata, null, 2)}` : ''}
-->

${content}
`
      await fs.promises.writeFile(archivePath, archivedContent, 'utf-8')

      // Git operations
      try {
        // Git add the archived file
        execSync(`git add "${archivePath}"`, { stdio: 'pipe' })

        // Git remove the original
        execSync(`git rm "${filePath}"`, { stdio: 'pipe' })

        console.log(`      ✅ Archived successfully`)
      } catch (gitError) {
        console.log(`      ⚠️  Git operation warning (continuing anyway)`)
        // If git fails, still do filesystem operations
        await fs.promises.unlink(filePath)
      }

      return true
    } catch (error) {
      console.error(`      ❌ Error archiving: ${error}`)
      return false
    }
  }

  /**
   * Archive all duplicates from deduplication report
   */
  async archiveFromReport(
    reportPath: string,
    options: {
      exactOnly?: boolean
      autoApprove?: boolean
    } = {}
  ): Promise<ArchiveResult> {
    console.log('\n📦 Starting archive process...\n')

    const report: DeduplicationReport = JSON.parse(
      await fs.promises.readFile(reportPath, 'utf-8')
    )

    const result: ArchiveResult = {
      archived: [],
      skipped: [],
      errors: [],
    }

    // Archive exact duplicates
    console.log('🔍 Processing exact duplicates...\n')
    for (const cluster of report.exact_duplicates) {
      if (cluster.action === 'delete_duplicates') {
        for (const dupFile of cluster.duplicates) {
          // Safety check
          if (!this.isExternalContent(dupFile)) {
            result.skipped.push(dupFile)
            continue
          }

          const success = await this.archiveFile(
            dupFile,
            `Exact duplicate of ${cluster.original}`,
            {
              original: cluster.original,
              similarity: cluster.similarity,
              type: 'exact_duplicate',
            }
          )

          if (success) {
            result.archived.push(dupFile)
          } else {
            result.errors.push({ file: dupFile, error: 'Archive failed' })
          }
        }
      }
    }

    // Archive near-duplicates if requested
    if (!options.exactOnly) {
      console.log('\n🔍 Processing near-duplicates (95%+ similarity)...\n')
      for (const cluster of report.similar_documents) {
        if (
          cluster.type === 'near-duplicate' &&
          cluster.action === 'delete_duplicates'
        ) {
          for (const dupFile of cluster.duplicates) {
            if (!this.isExternalContent(dupFile)) {
              result.skipped.push(dupFile)
              continue
            }

            const success = await this.archiveFile(
              dupFile,
              `Near-duplicate of ${cluster.original} (${Math.round(cluster.similarity * 100)}% similar)`,
              {
                original: cluster.original,
                similarity: cluster.similarity,
                type: 'near_duplicate',
              }
            )

            if (success) {
              result.archived.push(dupFile)
            } else {
              result.errors.push({ file: dupFile, error: 'Archive failed' })
            }
          }
        }
      }
    }

    // Archive outdated documents
    console.log('\n🔍 Processing outdated documents...\n')
    for (const outdated of report.outdated_documents) {
      if (outdated.action === 'archive') {
        if (!this.isExternalContent(outdated.file)) {
          result.skipped.push(outdated.file)
          continue
        }

        const success = await this.archiveFile(
          outdated.file,
          outdated.reason,
          {
            newer_version: outdated.newer_version,
            type: 'outdated',
          }
        )

        if (success) {
          result.archived.push(outdated.file)
        } else {
          result.errors.push({ file: outdated.file, error: 'Archive failed' })
        }
      }
    }

    console.log('\n✅ Archive process complete!')
    console.log(`\n📊 Results:`)
    console.log(`   Archived: ${result.archived.length} files`)
    console.log(`   Skipped: ${result.skipped.length} files`)
    console.log(`   Errors: ${result.errors.length}`)

    if (result.skipped.length > 0) {
      console.log(`\n⚠️  Skipped files (not external content):`)
      result.skipped.forEach((f) => console.log(`   - ${f}`))
    }

    return result
  }

  /**
   * Rollback archived files
   */
  async rollback(archivedFiles: string[]): Promise<void> {
    console.log('\n⏮️  Rolling back archived files...\n')

    for (const originalPath of archivedFiles) {
      const timestamp = new Date().toISOString().split('T')[0]
      const archiveSubdir = path.dirname(originalPath)
      const basename = path.basename(originalPath)
      const archivePath = path.join(
        this.archiveDir,
        archiveSubdir,
        `${basename}.${timestamp}.archived`
      )

      if (!fs.existsSync(archivePath)) {
        console.log(`   ⚠️  Archive not found: ${archivePath}`)
        continue
      }

      console.log(`   🔄 Restoring: ${originalPath}`)

      try {
        // Extract original content (remove metadata header)
        const archivedContent = await fs.promises.readFile(
          archivePath,
          'utf-8'
        )
        const content = archivedContent.replace(/^<!--[\s\S]*?-->\n\n/, '')

        // Restore original file
        await fs.promises.writeFile(originalPath, content, 'utf-8')

        // Git operations
        try {
          execSync(`git add "${originalPath}"`, { stdio: 'pipe' })
          execSync(`git rm "${archivePath}"`, { stdio: 'pipe' })
        } catch (gitError) {
          console.log(`   ⚠️  Git warning (continuing anyway)`)
          // If git fails, still do filesystem cleanup
          await fs.promises.unlink(archivePath)
        }

        console.log(`      ✅ Restored successfully`)
      } catch (error) {
        console.error(`      ❌ Rollback error: ${error}`)
      }
    }

    console.log('\n✅ Rollback complete!')
  }
}

// CLI execution
if (require.main === module) {
  const reportPath =
    process.argv[2] ||
    path.join(__dirname, 'deduplication-report.json')
  const dryRun = process.argv.includes('--dry-run')
  const exactOnly = process.argv.includes('--exact-only')

  console.log('📦 Archive System for External Scraped Content')
  console.log('   Scope: aoma_crawl/, confluence/, jira/ ONLY\n')

  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No changes will be made\n')
  }

  const archiver = new ArchiveSystem('.archive', dryRun)

  archiver
    .archiveFromReport(reportPath, { exactOnly })
    .then((result) => {
      console.log('\n✨ Done!')

      if (!dryRun && result.archived.length > 0) {
        console.log('\n💡 To commit changes:')
        console.log('   git commit -m "chore: archive duplicate external docs"')
        console.log('\n💡 To rollback (if needed):')
        console.log(
          '   npx ts-node scripts/doc-analysis/archive-duplicates.ts --rollback'
        )
      }

      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Error:', error)
      process.exit(1)
    })
}

export { ArchiveSystem, ArchiveResult }

