
import { getSupabaseVectorService } from '../src/services/supabaseVectorService';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function seedAomaKnowledge() {
  console.log('🌱 Seeding AOMA Knowledge Base...');
  
  const vectorService = getSupabaseVectorService();
  
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
      await vectorService.upsertVector(
        'sony-music',
        'digital-operations',
        'aoma',
        doc.content,
        'knowledge',
        doc.sourceId,
        doc.metadata
      );
      console.log(`✅ Upserted: ${doc.sourceId}`);
    } catch (error) {
      console.error(`❌ Failed to upsert ${doc.sourceId}:`, error);
    }
  }
  
  console.log('✨ Seeding complete!');
}

seedAomaKnowledge().catch(console.error);
