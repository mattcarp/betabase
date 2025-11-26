import { getGeminiEmbeddingService } from '../src/services/geminiEmbeddingService';
import { Client } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function seedAomaKnowledgeDirect() {
  console.log('🌱 Seeding AOMA Knowledge Base (Direct DB)...');
  
  const client = new Client({
    connectionString: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'
  });
  
  await client.connect();
  
  const geminiService = getGeminiEmbeddingService();
  
  const documents = [
    {
      content: "AOMA (AI-Orchestrated Multi-Agent) is the core architecture of the SIAM platform. It coordinates specialized agents (like Fiona for QA, Leo for Code, etc.) to solve complex tasks. AOMA uses a mesh network topology to allow agents to communicate and collaborate dynamically.",
      sourceId: "aoma-def-1",
      metadata: { title: "What is AOMA?", category: "architecture" }
    },
    {
      content: "SIAM (Sony Intelligent Agent Manager) is the testing and knowledge management platform that uses AOMA. It provides tools for RLHF (Reinforcement Learning from Human Feedback), vector search, and automated testing.",
      sourceId: "siam-def-1",
      metadata: { title: "What is SIAM?", category: "overview" }
    },
    {
      content: "The 'Fix' tab in SIAM allows developers to debug AI responses, view the retrieval pipeline, and apply quick fixes to the knowledge base. It includes a Response Debugger and a Test Generator.",
      sourceId: "fix-tab-1",
      metadata: { title: "Fix Tab Functionality", category: "ui" }
    }
  ];

  for (const doc of documents) {
    try {
      console.log(`Processing: ${doc.metadata.title}`);
      const embedding = await geminiService.generateEmbedding(doc.content);
      
      const result = await client.query(
        `SELECT upsert_siam_vector_gemini($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          'sony-music',
          'digital-operations',
          'aoma',
          doc.content,
          `[${embedding.join(',')}]`,
          'knowledge',
          doc.sourceId,
          JSON.stringify(doc.metadata)
        ]
      );
      console.log(`✅ Upserted: ${doc.sourceId} (ID: ${result.rows[0].upsert_siam_vector_gemini})`);
    } catch (error) {
      console.error(`❌ Failed to upsert ${doc.sourceId}:`, error);
    }
  }
  
  await client.end();
  console.log('✨ Seeding complete!');
}

seedAomaKnowledgeDirect().catch(console.error);
