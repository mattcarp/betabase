/**
 * Test Script: Hidden Code Knowledge Examples
 * 
 * This script queries the chat API to find real examples where:
 * 1. JIRA tickets describe user problems/errors
 * 2. Indexed code can explain the root cause
 * 3. The AI translates code knowledge into user-friendly answers
 * 
 * Run with: infisical run --env=dev -- npx tsx scripts/test-hidden-code-knowledge.ts
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

interface VectorResult {
  id: string;
  source_type: string;
  source_id: string;
  content: string;
  metadata: Record<string, any>;
  similarity?: number;
}

async function main() {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║  🔍 Hidden Code Knowledge - Real Example Finder                 ║
║  Finding cases where indexed code explains user problems        ║
╚════════════════════════════════════════════════════════════════╝
  `);

  // Initialize Supabase client directly
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // Step 1: Find JIRA tickets about errors/bugs
  console.log('\n📋 STEP 1: Finding JIRA tickets with errors/issues...\n');
  
  const { data: jiraTickets, error: jiraError } = await supabase
    .from('siam_vectors')
    .select('id, source_type, source_id, content, metadata')
    .eq('source_type', 'jira')
    .or('content.ilike.%error%,content.ilike.%bug%,content.ilike.%fails%,content.ilike.%broken%,content.ilike.%issue%')
    .limit(15);

  if (jiraError) {
    console.error('❌ Error fetching JIRA tickets:', jiraError.message);
  } else {
    console.log(`Found ${jiraTickets?.length || 0} JIRA tickets mentioning errors/bugs:\n`);
    jiraTickets?.forEach((ticket, i) => {
      const title = ticket.metadata?.title || ticket.source_id;
      const status = ticket.metadata?.status || 'unknown';
      const preview = ticket.content?.substring(0, 150).replace(/\n/g, ' ') + '...';
      console.log(`  ${i + 1}. [${status}] ${title}`);
      console.log(`     ${preview}\n`);
    });
  }

  // Step 2: Find indexed code files
  console.log('\n📂 STEP 2: Checking indexed code files...\n');
  
  const { data: codeFiles, error: codeError } = await supabase
    .from('siam_vectors')
    .select('id, source_id, content, metadata')
    .eq('source_type', 'git')
    .limit(20);

  if (codeError) {
    console.error('❌ Error fetching code:', codeError.message);
  } else {
    console.log(`Found ${codeFiles?.length || 0} indexed code chunks:\n`);
    
    // Group by file
    const fileGroups: Record<string, number> = {};
    codeFiles?.forEach(chunk => {
      const filePath = chunk.metadata?.file_path || 'unknown';
      fileGroups[filePath] = (fileGroups[filePath] || 0) + 1;
    });
    
    Object.entries(fileGroups).slice(0, 10).forEach(([path, count]) => {
      console.log(`  📄 ${path} (${count} chunks)`);
    });
  }

  // Step 3: Find specific patterns where code could help explain issues
  console.log('\n\n🔗 STEP 3: Cross-referencing JIRA + Code for real examples...\n');
  
  // Pattern 1: Look for validation errors in JIRA
  const { data: validationIssues } = await supabase
    .from('siam_vectors')
    .select('id, source_id, content, metadata')
    .eq('source_type', 'jira')
    .or('content.ilike.%validation%,content.ilike.%invalid%,content.ilike.%format%')
    .limit(5);

  if (validationIssues && validationIssues.length > 0) {
    console.log('🎯 Found validation-related issues:\n');
    validationIssues.forEach((issue, i) => {
      console.log(`  ${i + 1}. ${issue.metadata?.title || issue.source_id}`);
      console.log(`     ${issue.content?.substring(0, 200).replace(/\n/g, ' ')}...\n`);
    });
  }

  // Pattern 2: Look for error handling code
  const { data: errorHandlers } = await supabase
    .from('siam_vectors')
    .select('id, source_id, content, metadata')
    .eq('source_type', 'git')
    .or('content.ilike.%throw new Error%,content.ilike.%catch%,content.ilike.%error%')
    .limit(10);

  if (errorHandlers && errorHandlers.length > 0) {
    console.log('🎯 Found error handling code:\n');
    errorHandlers.forEach((chunk, i) => {
      const file = chunk.metadata?.file_path || 'unknown';
      const lines = chunk.metadata?.line_range || '?';
      const funcs = chunk.metadata?.functions?.slice(0, 3).join(', ') || 'N/A';
      console.log(`  ${i + 1}. ${file} (lines ${lines})`);
      console.log(`     Functions: ${funcs}`);
      console.log(`     Preview: ${chunk.content?.substring(0, 150).replace(/\n/g, ' ')}...\n`);
    });
  }

  // Step 4: Look for specific component mentions
  console.log('\n\n📊 STEP 4: Looking for component-specific issues...\n');

  // Find Angular components in code
  const { data: components } = await supabase
    .from('siam_vectors')
    .select('id, metadata')
    .eq('source_type', 'git')
    .limit(100);

  const componentNames = new Set<string>();
  components?.forEach(c => {
    const classes = c.metadata?.classes || [];
    classes.forEach((cls: string) => {
      if (cls.includes('Component') || cls.includes('Service')) {
        componentNames.add(cls);
      }
    });
  });

  console.log(`Found ${componentNames.size} Angular components/services:\n`);
  Array.from(componentNames).slice(0, 15).forEach(name => {
    console.log(`  • ${name}`);
  });

  // Step 5: Generate real example scenarios
  console.log('\n\n✨ STEP 5: Generating Real Examples for Demo...\n');
  console.log('=' . repeat(60) + '\n');

  // Check if we have enough data to create meaningful examples
  const hasJira = (jiraTickets?.length || 0) > 0;
  const hasCode = (codeFiles?.length || 0) > 0;

  if (hasJira && hasCode) {
    console.log('✅ We have both JIRA tickets and indexed code!\n');
    console.log('Based on the data found, here are potential real examples:\n');

    // Create example based on actual data
    if (validationIssues && validationIssues.length > 0) {
      console.log('📌 EXAMPLE 1: Validation Error');
      console.log('─'.repeat(40));
      console.log('Real JIRA ticket:', validationIssues[0].metadata?.title || validationIssues[0].source_id);
      console.log('\nWithout Code Knowledge:');
      console.log('  "Check that your input matches the expected format."');
      console.log('\nWith Hidden Code Knowledge:');
      console.log('  "Based on the validation rules in the system, [specific rule from code].');
      console.log('   The error triggers when [specific condition]. Try [specific fix]."\n');
    }

    if (errorHandlers && errorHandlers.length > 0) {
      const handler = errorHandlers[0];
      console.log('📌 EXAMPLE 2: Error Handling');
      console.log('─'.repeat(40));
      console.log('Code file:', handler.metadata?.file_path);
      console.log('Lines:', handler.metadata?.line_range);
      console.log('\nWithout Code Knowledge:');
      console.log('  "An error occurred. Please try again or contact support."');
      console.log('\nWith Hidden Code Knowledge:');
      console.log('  "This error happens in the [component name] when [condition].');
      console.log('   The system expects [requirement]. Here\'s how to fix it: [steps]."\n');
    }

  } else {
    console.log('⚠️  Limited data found. Summary:');
    console.log(`   JIRA tickets: ${jiraTickets?.length || 0}`);
    console.log(`   Code chunks: ${codeFiles?.length || 0}`);
    console.log('\nTo get more examples, ensure both JIRA and code are indexed.');
  }

  // Step 6: Test through the actual chat API
  console.log('\n\n🧪 STEP 6: Testing through Chat API...\n');
  
  const testQueries = [
    "What types of validation errors can occur when linking products in AOMA?",
    "How does the system handle errors during asset upload?",
    "What happens when a user enters an invalid product ID?",
  ];

  for (const query of testQueries) {
    console.log(`\n📝 Query: "${query}"\n`);
    
    try {
      const response = await fetch('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: query }],
          model: 'gemini-2.0-flash',
          temperature: 0.3,
          mode: 'full',
        }),
      });

      if (response.ok) {
        // For streaming responses, we need to read the stream
        const reader = response.body?.getReader();
        let fullResponse = '';
        
        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = new TextDecoder().decode(value);
            fullResponse += chunk;
          }
          
          // Extract text content from SSE stream
          const textMatches = fullResponse.match(/0:"([^"]+)"/g);
          if (textMatches) {
            const text = textMatches.map(m => m.slice(3, -1)).join('');
            console.log('Response preview:', text.substring(0, 500) + '...');
          } else {
            console.log('Raw response length:', fullResponse.length, 'chars');
          }
        }
      } else {
        console.log('❌ API error:', response.status, response.statusText);
      }
    } catch (error: any) {
      console.log('❌ Request failed:', error.message);
    }
  }

  console.log(`
╔════════════════════════════════════════════════════════════════╗
║  ✅ Test Complete!                                              ║
║  Review the examples above for real before/after scenarios      ║
╚════════════════════════════════════════════════════════════════╝
  `);
}

main().catch(console.error);








