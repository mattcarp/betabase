#!/usr/bin/env ts-node
/**
 * Master Index Generator - Creates hierarchical index of external knowledge base
 * Only indexes aoma_crawl/, confluence/, jira/
 */

import * as fs from 'fs'
import * as path from 'path'

interface ParsedDocument {
  filePath: string
  relativePath: string
  title: string
  content: {
    text: string
    headings: Array<{ level: number; text: string }>
  }
  stats: {
    word_count: number
  }
}

interface TopicCluster {
  topic: string
  description: string
  documents: string[]
  suggestedPath: string
}

class IndexGenerator {
  /**
   * Generate master index markdown
   */
  async generateIndex(options: {
    parsedDocsPath: string
    reorganizationPath?: string
    outputPath: string
  }): Promise<void> {
    console.log('\n📚 Generating master index...\n')
    console.log('   Scope: External scraped content only\n')

    // Load parsed documents
    const parsed = JSON.parse(
      await fs.promises.readFile(options.parsedDocsPath, 'utf-8')
    )

    // Filter to only external content
    const externalDocs: ParsedDocument[] = parsed.documents.filter(
      (doc: ParsedDocument) =>
        doc.relativePath.startsWith('aoma_crawl/') ||
        doc.relativePath.startsWith('confluence/') ||
        doc.relativePath.startsWith('jira/')
    )

    console.log(`Found ${externalDocs.length} external documents to index`)

    if (externalDocs.length === 0) {
      console.log('⚠️  No external documents to index')
      return
    }

    // Load reorganization plan if available
    let topics: TopicCluster[] = []
    if (
      options.reorganizationPath &&
      fs.existsSync(options.reorganizationPath)
    ) {
      const reorg = JSON.parse(
        await fs.promises.readFile(options.reorganizationPath, 'utf-8')
      )
      topics = reorg.topicClusters || []
      console.log(`Using ${topics.length} topics from reorganization plan`)
    }

    // Generate index content
    let indexContent = `# External Knowledge Base Index

> **Generated:** ${new Date().toISOString().split('T')[0]}
> **Total Documents:** ${externalDocs.length}
> **Sources:** AOMA, Confluence, JIRA

---

## 📊 Quick Stats

- **AOMA Pages:** ${externalDocs.filter((d) => d.relativePath.startsWith('aoma_crawl/')).length}
- **Confluence:** ${externalDocs.filter((d) => d.relativePath.startsWith('confluence/')).length}
- **JIRA:** ${externalDocs.filter((d) => d.relativePath.startsWith('jira/')).length}
- **Total Words:** ${externalDocs.reduce((sum, d) => sum + d.stats.word_count, 0).toLocaleString()}

---

`

    // Add topic-based index if available
    if (topics.length > 0) {
      indexContent += `## 📑 By Topic\n\n`

      for (const topic of topics) {
        indexContent += `### ${topic.topic}\n\n`
        indexContent += `${topic.description}\n\n`

        for (const docPath of topic.documents) {
          const doc = externalDocs.find((d) => d.relativePath === docPath)
          if (doc) {
            indexContent += `- [${doc.title}](${doc.relativePath})\n`
          }
        }

        indexContent += `\n`
      }
    }

    // Add source-based index
    indexContent += `## 📁 By Source\n\n`

    // AOMA
    const aomaDocs = externalDocs.filter((d) =>
      d.relativePath.startsWith('aoma_crawl/')
    )
    if (aomaDocs.length > 0) {
      indexContent += `### AOMA Pages (${aomaDocs.length})\n\n`
      aomaDocs
        .sort((a, b) => a.title.localeCompare(b.title))
        .forEach((doc) => {
          indexContent += `- [${doc.title}](${doc.relativePath})\n`
        })
      indexContent += `\n`
    }

    // Confluence
    const confluenceDocs = externalDocs.filter((d) =>
      d.relativePath.startsWith('confluence/')
    )
    if (confluenceDocs.length > 0) {
      indexContent += `### Confluence (${confluenceDocs.length})\n\n`
      confluenceDocs
        .sort((a, b) => a.title.localeCompare(b.title))
        .forEach((doc) => {
          indexContent += `- [${doc.title}](${doc.relativePath})\n`
        })
      indexContent += `\n`
    }

    // JIRA
    const jiraDocs = externalDocs.filter((d) =>
      d.relativePath.startsWith('jira/')
    )
    if (jiraDocs.length > 0) {
      indexContent += `### JIRA (${jiraDocs.length})\n\n`
      jiraDocs
        .sort((a, b) => a.title.localeCompare(b.title))
        .forEach((doc) => {
          indexContent += `- [${doc.title}](${doc.relativePath})\n`
        })
      indexContent += `\n`
    }

    // Add alphabetical index
    indexContent += `## 🔤 Alphabetical Index\n\n`

    const sorted = [...externalDocs].sort((a, b) =>
      a.title.localeCompare(b.title)
    )

    let currentLetter = ''
    sorted.forEach((doc) => {
      const firstLetter = doc.title[0].toUpperCase()
      if (firstLetter !== currentLetter) {
        currentLetter = firstLetter
        indexContent += `\n### ${currentLetter}\n\n`
      }
      indexContent += `- [${doc.title}](${doc.relativePath})\n`
    })

    // Add metadata
    indexContent += `\n---

## 📝 Index Metadata

- **Last Updated:** ${new Date().toISOString()}
- **Generator:** Docling Deduplication System
- **Scope:** External knowledge base content only
- **Excluded:** Internal SIAM project documentation

`

    // Save index
    await fs.promises.writeFile(options.outputPath, indexContent, 'utf-8')

    console.log(`\n✅ Master index generated!`)
    console.log(`   Saved to: ${options.outputPath}`)
    console.log(`   ${externalDocs.length} documents indexed`)
  }
}

// CLI execution
if (require.main === module) {
  const parsedDocsPath =
    process.argv[2] ||
    path.join(__dirname, 'parsed-documents.json')
  const reorganizationPath =
    process.argv[3] ||
    path.join(__dirname, 'reorganization-plan.json')
  const outputPath =
    process.argv[4] ||
    path.join(process.cwd(), 'knowledge-base/INDEX.md')

  console.log('📚 Master Index Generator')
  console.log('   Scope: aoma_crawl/, confluence/, jira/ ONLY\n')

  const generator = new IndexGenerator()

  generator
    .generateIndex({
      parsedDocsPath,
      reorganizationPath: fs.existsSync(reorganizationPath)
        ? reorganizationPath
        : undefined,
      outputPath,
    })
    .then(() => {
      console.log('\n✨ Done!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Error:', error)
      process.exit(1)
    })
}

export { IndexGenerator }

