#!/usr/bin/env ts-node
/**
 * Topic-Based Reorganization - Organizes external scraped docs by topic
 * Only processes aoma_crawl/, confluence/, jira/
 */

import * as fs from 'fs'
import * as path from 'path'
import OpenAI from 'openai'
import dotenv from 'dotenv'

dotenv.config()

interface ParsedDocument {
  filePath: string
  relativePath: string
  title: string
  content: { text: string }
}

interface TopicCluster {
  topic: string
  description: string
  documents: string[]
  suggestedPath: string
}

class DocumentReorganizer {
  private openai: OpenAI

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }

  /**
   * Analyze documents and suggest topic-based organization
   */
  async analyzeTopic(documents: ParsedDocument[]): Promise<TopicCluster[]> {
    console.log(`\n🔍 Analyzing ${documents.length} documents for topics...\n`)

    // Create document summaries for AI
    const summaries = documents
      .map((doc, i) => {
        const excerpt = doc.content.text.substring(0, 500)
        return `${i + 1}. ${doc.title} (${path.basename(doc.relativePath)})\n   ${excerpt}...`
      })
      .join('\n\n')

    const prompt = `Analyze these documents from an external knowledge base and group them into logical topics.

DOCUMENTS:
${summaries}

Return a JSON array of topic clusters with this structure:
[
  {
    "topic": "Topic Name",
    "description": "Brief description",
    "documents": [1, 3, 5], // Document numbers
    "suggestedPath": "knowledge-base/topic-name"
  }
]

Guidelines:
- Create 3-7 broad topic categories
- Each document should belong to exactly one topic
- Use clear, descriptive topic names
- Suggested paths should be kebab-case
- Topics should be based on content themes, not file types`

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content:
              'You are a knowledge organization expert. Return only valid JSON.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      })

      const result = JSON.parse(
        response.choices[0].message.content || '{}'
      )
      const clusters: TopicCluster[] = result.clusters || []

      // Map document numbers back to file paths
      return clusters.map((cluster) => ({
        ...cluster,
        documents: cluster.documents.map(
          (num: number) => documents[num - 1].relativePath
        ),
      }))
    } catch (error) {
      console.error('❌ AI topic analysis failed:', error)
      return []
    }
  }

  /**
   * Generate reorganization plan (doesn't move files, just shows plan)
   */
  async generateReorgPlan(
    parsedDocsPath: string,
    outputPath: string
  ): Promise<TopicCluster[]> {
    console.log('📋 Generating reorganization plan...\n')
    console.log('   Scope: External scraped content only\n')

    // Load parsed documents
    const parsed = JSON.parse(
      await fs.promises.readFile(parsedDocsPath, 'utf-8')
    )

    // Filter to only external content
    const externalDocs = parsed.documents.filter(
      (doc: ParsedDocument) =>
        doc.relativePath.startsWith('aoma_crawl/') ||
        doc.relativePath.startsWith('confluence/') ||
        doc.relativePath.startsWith('jira/')
    )

    console.log(`Found ${externalDocs.length} external documents to organize`)

    if (externalDocs.length === 0) {
      console.log('⚠️  No external documents to reorganize')
      return []
    }

    // Analyze topics
    const clusters = await this.analyzeTopic(externalDocs)

    console.log(`\n✅ Identified ${clusters.length} topic clusters`)

    // Save reorganization plan
    const plan = {
      generatedAt: new Date().toISOString(),
      totalDocuments: externalDocs.length,
      topicClusters: clusters,
      moveCommands: clusters.flatMap((cluster) =>
        cluster.documents.map((doc) => ({
          from: doc,
          to: path.join(cluster.suggestedPath, path.basename(doc)),
        }))
      ),
    }

    await fs.promises.writeFile(
      outputPath,
      JSON.stringify(plan, null, 2),
      'utf-8'
    )

    console.log(`\n💾 Plan saved to: ${outputPath}`)
    console.log('\n📊 Topic Summary:')
    clusters.forEach((cluster) => {
      console.log(`\n   ${cluster.topic} (${cluster.documents.length} docs)`)
      console.log(`   ${cluster.description}`)
      console.log(`   → ${cluster.suggestedPath}`)
    })

    return clusters
  }
}

// CLI execution
if (require.main === module) {
  const parsedDocsPath =
    process.argv[2] ||
    path.join(__dirname, 'parsed-documents.json')
  const outputPath =
    process.argv[3] ||
    path.join(__dirname, 'reorganization-plan.json')

  console.log('📁 Topic-Based Reorganization')
  console.log('   Scope: aoma_crawl/, confluence/, jira/ ONLY\n')

  const reorganizer = new DocumentReorganizer()

  reorganizer
    .generateReorgPlan(parsedDocsPath, outputPath)
    .then(() => {
      console.log('\n✨ Done!')
      console.log('\n💡 Review the plan before applying changes')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Error:', error)
      process.exit(1)
    })
}

export { DocumentReorganizer, TopicCluster }

