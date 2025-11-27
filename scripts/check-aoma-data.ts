
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAoma() {
  console.log('Checking for "AOMA" in retrieval_reinforcement...');
  
  const { data, error } = await supabase
    .from('retrieval_reinforcement')
    .select('*')
    .ilike('content', '%AOMA%');

  if (error) {
    console.error('Error querying database:', error);
    return;
  }

  console.log(`Found ${data.length} entries matching "AOMA":`);
  data.forEach(entry => {
    console.log(`- [${entry.category}] ${entry.content.substring(0, 100)}...`);
  });

  if (data.length === 0) {
    console.log('No entries found. Seeding AOMA definition...');
    await seedAoma();
  }
}

async function seedAoma() {
  const aomaDefinition = {
    content: "AOMA (AI-Orchestrated Multi-Agent) is the core architecture of the SIAM platform. It coordinates specialized agents (like Fiona for QA, Leo for Code, etc.) to solve complex tasks. AOMA uses a mesh network topology to allow agents to communicate and collaborate dynamically.",
    category: "architecture",
    embedding: [], // We can't generate embeddings here easily without OpenAI, but we can insert the text
    metadata: {
      source: "system-definition",
      importance: "high"
    }
  };

  const { error } = await supabase
    .from('retrieval_reinforcement')
    .insert(aomaDefinition);

  if (error) {
    console.error('Error seeding AOMA:', error);
  } else {
    console.log('Successfully seeded AOMA definition.');
  }
}

checkAoma();
