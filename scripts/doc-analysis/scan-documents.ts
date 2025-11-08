#!/usr/bin/env ts-node
/**
 * Document Scanner - Recursively scans project for documents
 * Generates inventory of all MD, JSON, TXT files with metadata
 */

import * as fs from 'fs'
import * as path from 'path'
import * as crypto from 'crypto'

interface DocumentMetadata {
  path: string
  relativePath: string
  type: 'md' | 'json' | 'txt' | 'other'
  size: number
  modified: Date
  hash: string
}

interface ScanOptions {
  baseDir: string
  excludeDirs: string[]
  includeExtensions: string[]
  outputFile?: string
}

class DocumentScanner {
  private documents: DocumentMetadata[] = []
  private options: ScanOptions

  constructor(options: Partial<ScanOptions> = {}) {
    this.options = {
      baseDir: options.baseDir || process.cwd(),
      excludeDirs: options.excludeDirs || [
        'node_modules',
        '.git',
        '.next',
        'playwright-report',
        'test-results',
        '.venv',
        '__pycache__',
        'dist',
        'build',
        '.turbo',
      ],
      includeExtensions: options.includeExtensions || ['.md', '.json', '.txt'],
      outputFile: options.outputFile,
    }
  }

  /**
   * Scan directory recursively
   */
  async scan(): Promise<DocumentMetadata[]> {
    console.log(`🔍 Scanning documents in: ${this.options.baseDir}`)
    console.log(`📁 Excluding directories: ${this.options.excludeDirs.join(', ')}`)
    console.log(
      `📄 Including extensions: ${this.options.includeExtensions.join(', ')}\n`
    )

    await this.scanDirectory(this.options.baseDir)

    console.log(`\n✅ Scan complete: Found ${this.documents.length} documents`)
    this.printSummary()

    if (this.options.outputFile) {
      await this.saveResults()
    }

    return this.documents
  }

  /**
   * Recursively scan directory
   */
  private async scanDirectory(dirPath: string): Promise<void> {
    try {
      const entries = await fs.promises.readdir(dirPath, { withFileTypes: true })

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name)

        if (entry.isDirectory()) {
          // Skip excluded directories
          if (this.shouldExcludeDirectory(entry.name)) {
            continue
          }
          await this.scanDirectory(fullPath)
        } else if (entry.isFile()) {
          // Process file
          if (this.shouldIncludeFile(entry.name)) {
            await this.processFile(fullPath)
          }
        }
      }
    } catch (error) {
      console.error(`Error scanning directory ${dirPath}:`, error)
    }
  }

  /**
   * Check if directory should be excluded
   */
  private shouldExcludeDirectory(dirName: string): boolean {
    return this.options.excludeDirs.some(
      (excluded) => dirName === excluded || dirName.startsWith('.')
    )
  }

  /**
   * Check if file should be included
   */
  private shouldIncludeFile(fileName: string): boolean {
    const ext = path.extname(fileName).toLowerCase()
    return this.options.includeExtensions.includes(ext)
  }

  /**
   * Process individual file
   */
  private async processFile(filePath: string): Promise<void> {
    try {
      const stats = await fs.promises.stat(filePath)
      const content = await fs.promises.readFile(filePath)
      const hash = crypto.createHash('sha256').update(content).digest('hex')

      const ext = path.extname(filePath).toLowerCase()
      let type: 'md' | 'json' | 'txt' | 'other' = 'other'
      if (ext === '.md') type = 'md'
      else if (ext === '.json') type = 'json'
      else if (ext === '.txt') type = 'txt'

      const metadata: DocumentMetadata = {
        path: filePath,
        relativePath: path.relative(this.options.baseDir, filePath),
        type,
        size: stats.size,
        modified: stats.mtime,
        hash,
      }

      this.documents.push(metadata)
    } catch (error) {
      console.error(`Error processing file ${filePath}:`, error)
    }
  }

  /**
   * Print summary statistics
   */
  private printSummary(): void {
    const byType = this.documents.reduce(
      (acc, doc) => {
        acc[doc.type] = (acc[doc.type] || 0) + 1
        return acc
      },
      {} as Record<string, number>
    )

    const totalSize = this.documents.reduce((sum, doc) => sum + doc.size, 0)
    const sizeMB = (totalSize / (1024 * 1024)).toFixed(2)

    console.log('\n📊 Summary:')
    console.log(`   Total documents: ${this.documents.length}`)
    console.log(`   Total size: ${sizeMB} MB`)
    console.log('\n   By type:')
    Object.entries(byType)
      .sort((a, b) => b[1] - a[1])
      .forEach(([type, count]) => {
        console.log(`      ${type.padEnd(6)}: ${count}`)
      })
  }

  /**
   * Save results to JSON file
   */
  private async saveResults(): Promise<void> {
    const output = {
      scanDate: new Date().toISOString(),
      baseDir: this.options.baseDir,
      totalDocuments: this.documents.length,
      totalSize: this.documents.reduce((sum, doc) => sum + doc.size, 0),
      documents: this.documents,
    }

    await fs.promises.writeFile(
      this.options.outputFile!,
      JSON.stringify(output, null, 2),
      'utf-8'
    )

    console.log(`\n💾 Results saved to: ${this.options.outputFile}`)
  }
}

// CLI execution
if (require.main === module) {
  const baseDir = process.argv[2] || process.cwd()
  const outputFile = process.argv[3] || path.join(baseDir, 'scripts/doc-analysis/document-inventory.json')

  const scanner = new DocumentScanner({
    baseDir,
    outputFile,
  })

  scanner
    .scan()
    .then(() => {
      console.log('\n✨ Document scanning complete!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Error during scan:', error)
      process.exit(1)
    })
}

export { DocumentScanner, DocumentMetadata, ScanOptions }

