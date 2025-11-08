#!/usr/bin/env ts-node
/**
 * Docling Parser Integration - Parses documents and generates embeddings
 * Uses Python bridge for Docling + OpenAI for semantic analysis
 */

import * as fs from 'fs'
import * as path from 'path'
import { spawn } from 'child_process'
import OpenAI from 'openai'
import dotenv from 'dotenv'

dotenv.config()

interface ParsedDocument {
  filePath: string
  relativePath: string
  success: boolean
  title: string
  content: {
    text: string
    headings: Array<{ level: number; text: string }>
    sections: Array<{ heading: string; content: string }>
  }
  metadata: {
    pages?: number
    has_tables?: boolean
    has_images?: boolean
  }
  stats: {
    char_count: number
    word_count: number
  }
  embedding?: number[]
  error?: string
}

interface ParsedDocumentDatabase {
  parseDate: string
  totalDocuments: number
  successfulParsed: number
  failedParsed: number
  documents: ParsedDocument[]
}

class DoclingParser {
  private openai: OpenAI
  private pythonBridge: string
  private venvPath: string

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
    this.pythonBridge = path.join(__dirname, 'docling-bridge.py')
    this.venvPath = path.join(process.cwd(), '.venv')
  }

  /**
   * Parse document using Docling Python bridge
   */
  async parseDocument(filePath: string): Promise<ParsedDocument> {
    console.log(`📄 Parsing: ${path.basename(filePath)}`)

    try {
      // Check if file is Markdown (skip Docling for MD, just read directly)
      if (path.extname(filePath).toLowerCase() === '.md') {
        return await this.parseMarkdownDirect(filePath)
      }

      // Use Docling for other formats
      const result = await this.callDoclingBridge(filePath)

      if (!result.success) {
        return {
          filePath,
          relativePath: path.relative(process.cwd(), filePath),
          success: false,
          title: path.basename(filePath),
          content: { text: '', headings: [], sections: [] },
          metadata: {},
          stats: { char_count: 0, word_count: 0 },
          error: result.error,
        }
      }

      return {
        ...result,
        relativePath: path.relative(process.cwd(), filePath),
      }
    } catch (error) {
      console.error(`   ❌ Error parsing ${filePath}:`, error)
      return {
        filePath,
        relativePath: path.relative(process.cwd(), filePath),
        success: false,
        title: path.basename(filePath),
        content: { text: '', headings: [], sections: [] },
        metadata: {},
        stats: { char_count: 0, word_count: 0 },
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  /**
   * Parse Markdown files directly (faster than Docling)
   */
  private async parseMarkdownDirect(filePath: string): Promise<ParsedDocument> {
    const content = await fs.promises.readFile(filePath, 'utf-8')
    const lines = content.split('\n')

    // Extract headings
    const headings: Array<{ level: number; text: string }> = []
    const sections: Array<{ heading: string; content: string }> = []
    let currentSection = { heading: 'Introduction', content: '' }

    for (const line of lines) {
      if (line.startsWith('#')) {
        // Save previous section
        if (currentSection.content.trim()) {
          sections.push({ ...currentSection })
        }

        // Parse heading
        const level = line.match(/^#+/)?.[0].length || 1
        const text = line.replace(/^#+\s*/, '').trim()
        headings.push({ level, text })

        // Start new section
        currentSection = { heading: text, content: '' }
      } else {
        currentSection.content += line + '\n'
      }
    }

    // Add last section
    if (currentSection.content.trim()) {
      sections.push(currentSection)
    }

    // Extract title (first heading or filename)
    const title =
      headings.length > 0 ? headings[0].text : path.basename(filePath, '.md')

    return {
      filePath,
      relativePath: path.relative(process.cwd(), filePath),
      success: true,
      title,
      content: {
        text: content,
        headings,
        sections,
      },
      metadata: {},
      stats: {
        char_count: content.length,
        word_count: content.split(/\s+/).length,
      },
    }
  }

  /**
   * Call Python Docling bridge
   */
  private async callDoclingBridge(filePath: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const pythonExec = path.join(this.venvPath, 'bin', 'python3')
      const process = spawn(pythonExec, [this.pythonBridge, filePath])

      let stdout = ''
      let stderr = ''

      process.stdout.on('data', (data) => {
        stdout += data.toString()
      })

      process.stderr.on('data', (data) => {
        stderr += data.toString()
      })

      process.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Docling bridge failed: ${stderr}`))
          return
        }

        try {
          const result = JSON.parse(stdout)
          resolve(result)
        } catch (error) {
          reject(new Error(`Failed to parse Docling output: ${error}`))
        }
      })
    })
  }

  /**
   * Generate OpenAI embedding for document
   */
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      // Truncate text to ~8000 tokens (OpenAI limit)
      const truncated = text.substring(0, 32000)

      const response = await this.openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: truncated,
      })

      return response.data[0].embedding
    } catch (error) {
      console.error('   ⚠️  Embedding generation failed:', error)
      return []
    }
  }

  /**
   * Parse multiple documents and generate embeddings
   */
  async parseDocuments(
    filePaths: string[],
    options: {
      generateEmbeddings?: boolean
      outputFile?: string
    } = {}
  ): Promise<ParsedDocumentDatabase> {
    console.log(`\n🔄 Parsing ${filePaths.length} documents...\n`)

    const documents: ParsedDocument[] = []
    let successCount = 0
    let failCount = 0

    for (let i = 0; i < filePaths.length; i++) {
      const filePath = filePaths[i]
      console.log(`[${i + 1}/${filePaths.length}]`)

      const parsed = await this.parseDocument(filePath)

      if (parsed.success) {
        successCount++

        // Generate embedding if requested
        if (options.generateEmbeddings && parsed.content.text) {
          console.log('   🧠 Generating embedding...')
          parsed.embedding = await this.generateEmbedding(parsed.content.text)
        }
      } else {
        failCount++
      }

      documents.push(parsed)

      // Rate limiting for OpenAI API
      if (options.generateEmbeddings && i < filePaths.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 100))
      }
    }

    console.log(`\n✅ Parsing complete!`)
    console.log(`   Success: ${successCount}`)
    console.log(`   Failed: ${failCount}`)

    const database: ParsedDocumentDatabase = {
      parseDate: new Date().toISOString(),
      totalDocuments: filePaths.length,
      successfulParsed: successCount,
      failedParsed: failCount,
      documents,
    }

    // Save to file if requested
    if (options.outputFile) {
      await fs.promises.writeFile(
        options.outputFile,
        JSON.stringify(database, null, 2),
        'utf-8'
      )
      console.log(`\n💾 Saved to: ${options.outputFile}`)
    }

    return database
  }
}

// CLI execution
if (require.main === module) {
  const inventoryFile =
    process.argv[2] ||
    path.join(__dirname, 'document-inventory.json')
  const outputFile =
    process.argv[3] ||
    path.join(__dirname, 'parsed-documents.json')
  const generateEmbeddings = process.argv.includes('--embeddings')

  ;(async () => {
    try {
      // Load document inventory
      const inventory = JSON.parse(
        await fs.promises.readFile(inventoryFile, 'utf-8')
      )

      // Filter to only MD files for initial run (faster)
      const mdFiles = inventory.documents
        .filter((doc: any) => doc.type === 'md')
        .map((doc: any) => doc.path)
        .slice(0, 50) // Limit to 50 for testing

      console.log(`📚 Processing ${mdFiles.length} markdown files...`)
      if (generateEmbeddings) {
        console.log(`🧠 Embeddings will be generated (using OpenAI API)`)
      }

      const parser = new DoclingParser()
      await parser.parseDocuments(mdFiles, {
        generateEmbeddings,
        outputFile,
      })

      console.log(`\n✨ Done!`)
    } catch (error) {
      console.error('❌ Error:', error)
      process.exit(1)
    }
  })()
}

export { DoclingParser }
export type { ParsedDocument, ParsedDocumentDatabase }


