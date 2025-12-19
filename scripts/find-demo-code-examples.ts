/**
 * Find code examples that can be shown in the demo
 * Looking for: upload handling, error states, sorting logic
 * 
 * Run with: infisical run --env=dev -- npx tsx scripts/find-demo-code-examples.ts
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function main() {
  console.log('🔍 Finding Code Examples for Demo\n');
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // Search for code related to upload sorting/failures
  const searchTerms = [
    { term: 'upload.*sort', description: 'Upload sorting logic' },
    { term: 'upload.*failed|failed.*upload', description: 'Upload failure handling' },
    { term: 'AssetUpload', description: 'Asset upload components' },
    { term: 'sorting.*error|error.*sorting', description: 'Sorting error handling' },
    { term: 'handleAssetUpload', description: 'Upload handlers' },
  ];

  for (const { term, description } of searchTerms) {
    console.log(`\n${'═'.repeat(60)}`);
    console.log(`🔎 Searching: ${description}`);
    console.log(`   Pattern: ${term}`);
    console.log('═'.repeat(60));

    const { data: codeChunks } = await supabase
      .from('siam_vectors')
      .select('id, source_id, content, metadata')
      .eq('source_type', 'git')
      .or(`content.ilike.%${term.replace(/\.\*/g, '%')}%`)
      .limit(5);

    if (codeChunks && codeChunks.length > 0) {
      console.log(`\n✅ Found ${codeChunks.length} code chunks:\n`);
      
      codeChunks.forEach((chunk, i) => {
        const filePath = chunk.metadata?.file_path || 'unknown';
        const lineRange = chunk.metadata?.line_range || '?';
        const functions = chunk.metadata?.functions || [];
        
        console.log(`${i + 1}. 📄 ${filePath}`);
        console.log(`   Lines: ${lineRange}`);
        console.log(`   Functions: ${functions.join(', ') || 'N/A'}`);
        console.log(`   Preview:`);
        
        // Show a nice code preview
        const codePreview = chunk.content?.substring(0, 400) || '';
        const lines = codePreview.split('\n').slice(0, 10);
        lines.forEach(line => {
          console.log(`   │ ${line}`);
        });
        console.log(`   └─ ... (${chunk.content?.length || 0} chars total)\n`);
      });
    } else {
      console.log(`   ❌ No code found for this pattern`);
    }
  }

  // Now specifically look for the UST reducers we know exist
  console.log(`\n\n${'═'.repeat(60)}`);
  console.log('🎯 BEST CODE EXAMPLES FOR DEMO');
  console.log('═'.repeat(60));

  const { data: bestExamples } = await supabase
    .from('siam_vectors')
    .select('id, source_id, content, metadata')
    .eq('source_type', 'git')
    .or('metadata->>file_path.ilike.%ust-%.reducers%,metadata->>file_path.ilike.%upload%')
    .limit(10);

  console.log(`\nFound ${bestExamples?.length || 0} reducer/upload files:\n`);

  // Group by file
  const byFile: Record<string, any[]> = {};
  bestExamples?.forEach(chunk => {
    const file = chunk.metadata?.file_path || 'unknown';
    if (!byFile[file]) byFile[file] = [];
    byFile[file].push(chunk);
  });

  Object.entries(byFile).forEach(([file, chunks]) => {
    console.log(`\n📁 ${file}`);
    chunks.forEach(chunk => {
      console.log(`   • Lines ${chunk.metadata?.line_range}: ${(chunk.metadata?.functions || []).join(', ') || 'N/A'}`);
    });
  });

  // Show one complete example with nice formatting
  console.log(`\n\n${'═'.repeat(60)}`);
  console.log('📝 COMPLETE CODE EXAMPLE (for demo)');
  console.log('═'.repeat(60));

  const { data: completeExample } = await supabase
    .from('siam_vectors')
    .select('*')
    .eq('source_type', 'git')
    .ilike('metadata->>file_path', '%ust-dolby.reducers%')
    .limit(1)
    .single();

  if (completeExample) {
    const file = completeExample.metadata?.file_path;
    const lines = completeExample.metadata?.line_range;
    const startLine = completeExample.metadata?.start_line || parseInt(lines?.split('-')[0]) || 1;
    
    console.log(`\n📄 File: ${file}`);
    console.log(`📍 Lines: ${lines}`);
    console.log(`🔧 Functions: ${(completeExample.metadata?.functions || []).join(', ')}`);
    console.log(`\n${'─'.repeat(60)}`);
    
    // Format code with line numbers
    const codeLines = completeExample.content?.split('\n') || [];
    codeLines.slice(0, 30).forEach((line: string, i: number) => {
      const lineNum = (startLine + i).toString().padStart(4, ' ');
      console.log(`${lineNum} │ ${line}`);
    });
    
    if (codeLines.length > 30) {
      console.log(`     │ ... (${codeLines.length - 30} more lines)`);
    }
    console.log('─'.repeat(60));
  }

  console.log('\n✅ Demo code examples search complete!');
}

main().catch(console.error);









