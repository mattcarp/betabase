/**
 * Deep Dive: Perfect Demo Scenario
 * 
 * Focusing on the "Asset Upload Sorting Failed" scenario (ITSM-55968)
 * to create a polished, real-world demo example
 * 
 * Run with: infisical run --env=dev -- npx tsx scripts/deep-dive-scenario.ts
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function main() {
  console.log(`
╔═══════════════════════════════════════════════════════════════════╗
║  🔬 DEEP DIVE: "Asset Upload Sorting Failed" Scenario              ║
║  Creating a polished demo example                                  ║
╚═══════════════════════════════════════════════════════════════════╝
  `);

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // Get the full JIRA ticket
  console.log('📋 Fetching full JIRA ticket details...\n');
  
  const { data: jiraTickets } = await supabase
    .from('siam_vectors')
    .select('*')
    .eq('source_type', 'jira')
    .ilike('content', '%upload%failed%')
    .limit(10);

  console.log(`Found ${jiraTickets?.length || 0} tickets about upload failures:\n`);
  
  jiraTickets?.forEach((ticket, i) => {
    console.log(`${'─'.repeat(60)}`);
    console.log(`📌 Ticket ${i + 1}: ${ticket.source_id}`);
    console.log(`${'─'.repeat(60)}`);
    console.log(`\nFull Content:\n${ticket.content}\n`);
    console.log(`\nMetadata:`, JSON.stringify(ticket.metadata, null, 2));
  });

  // Get the related code with full details
  console.log(`\n\n${'═'.repeat(60)}`);
  console.log('📂 Fetching related code...\n');
  
  const { data: uploadCode } = await supabase
    .from('siam_vectors')
    .select('*')
    .eq('source_type', 'git')
    .or('content.ilike.%upload%,content.ilike.%failed%,content.ilike.%error%')
    .limit(20);

  console.log(`Found ${uploadCode?.length || 0} code chunks related to uploads:\n`);

  // Focus on the most relevant code files
  const relevantFiles = uploadCode?.filter(c => {
    const path = c.metadata?.file_path || '';
    return path.includes('upload') || 
           path.includes('ust-') || 
           (c.metadata?.functions || []).some((f: string) => 
             f.toLowerCase().includes('upload') || 
             f.toLowerCase().includes('failed')
           );
  });

  console.log(`Filtered to ${relevantFiles?.length || 0} directly relevant chunks:\n`);

  relevantFiles?.slice(0, 5).forEach((chunk, i) => {
    console.log(`${'─'.repeat(60)}`);
    console.log(`📄 Code ${i + 1}: ${chunk.metadata?.file_path}`);
    console.log(`   Lines: ${chunk.metadata?.line_range}`);
    console.log(`   Functions: ${(chunk.metadata?.functions || []).join(', ')}`);
    console.log(`${'─'.repeat(60)}`);
    console.log(`\n${chunk.content?.substring(0, 800)}\n`);
  });

  // Search for specific state management patterns
  console.log(`\n\n${'═'.repeat(60)}`);
  console.log('🔍 Looking for state management patterns...\n');

  const { data: stateCode } = await supabase
    .from('siam_vectors')
    .select('*')
    .eq('source_type', 'git')
    .ilike('metadata->>file_path', '%reducers%')
    .limit(20);

  const statePatterns = stateCode?.filter(c => 
    c.content?.includes('Failed') || 
    c.content?.includes('Error') ||
    c.content?.includes('status')
  );

  console.log(`Found ${statePatterns?.length || 0} state patterns with error handling:\n`);

  statePatterns?.slice(0, 3).forEach((chunk, i) => {
    console.log(`${'─'.repeat(60)}`);
    console.log(`📄 ${chunk.metadata?.file_path} (lines ${chunk.metadata?.line_range})`);
    console.log(`${'─'.repeat(60)}`);
    
    // Find error-related code snippets
    const content = chunk.content || '';
    const lines = content.split('\n');
    const errorLines = lines.filter((l: string) => 
      l.includes('Failed') || l.includes('Error') || l.includes('error')
    );
    
    if (errorLines.length > 0) {
      console.log('\nError handling patterns found:');
      errorLines.slice(0, 5).forEach((line: string) => {
        console.log(`  → ${line.trim()}`);
      });
    }
    console.log('');
  });

  // Generate the polished demo script
  console.log(`
${'═'.repeat(70)}
${'═'.repeat(70)}

🎬 POLISHED DEMO SCRIPT
${'═'.repeat(70)}

SETUP: You know there's a JIRA ticket about asset upload failures.
       The audience doesn't know this yet.

${'─'.repeat(70)}
STEP 1: USER DESCRIBES THE PROBLEM
${'─'.repeat(70)}

USER: "Hey, I'm having trouble uploading assets. I keep getting an 
      'Asset Upload Sorting Failed' error. Any idea what's going on?"

${'─'.repeat(70)}
STEP 2: AI RESPONSE (With Hidden Code Knowledge)
${'─'.repeat(70)}

AI: "I can help with that! Let me check our knowledge base...

     📋 I found a related ticket: ITSM-55968
        Title: 'Asset Status [518647] : 000026433003 - Asset Upload Sorting Failed'
        
     This is a known issue that's been documented. Based on what I can see:
     
     🔍 Root Cause: 
     This typically happens in the Unified Submission Tool (UST) when 
     the upload state machine encounters an unexpected sequence of events.
     The upload reducer expects assets to be sorted before processing, 
     but sometimes the sorting step fails to complete.
     
     💡 Possible Fixes:
     1. Try refreshing the page and re-uploading
     2. Ensure your files are named consistently (no special characters)
     3. If uploading multiple files, try smaller batches
     
     Would you like me to show you where this is handled in the code?"

${'─'.repeat(70)}
STEP 3: USER ASKS FOR CODE (Optional)
${'─'.repeat(70)}

USER: "Yeah, show me the code."

AI: "The upload handling is in the UST state management:

\`\`\`typescript
// File: src/app/module-unified-submission-tool/shared/store/reducers/ust-cc-ttml.reducers.ts
// Lines: 96-183

// The handleAssetUploadIdList function manages upload state transitions
function handleAssetUploadIdList(state, action) {
  // ... upload ID tracking logic
}

// When sorting fails, it triggers this state update:
updateUploadIdList(state, { uploadStatus: 'SORTING_FAILED' })
\`\`\`

     The issue occurs when the upload ID list can't be properly sorted 
     before processing begins."

${'═'.repeat(70)}
KEY POINTS FOR DEMO
${'═'.repeat(70)}

1. ✅ AI found the JIRA ticket automatically
2. ✅ AI explained the root cause in plain English
3. ✅ AI gave actionable fixes (no code needed)
4. ✅ AI offered to show code only when asked
5. ✅ Code is revealed with file path and line numbers

${'═'.repeat(70)}
  `);

  // Save this to a file for the demo
  const demoScript = `# Demo Script: Hidden Code Knowledge

## Scenario: Asset Upload Sorting Failed

### Setup
- We have a JIRA ticket (ITSM-55968) about upload failures
- We have indexed the Angular UI code
- The audience doesn't know about either

### User Question
> "I'm having trouble uploading assets. I keep getting an 'Asset Upload Sorting Failed' error. Any idea what's going on?"

### AI Response (With Hidden Code Knowledge)
> I can help with that! I found a related ticket: **ITSM-55968**
> 
> This is a known issue in the Unified Submission Tool (UST). The upload state machine expects assets to be sorted before processing, but sometimes the sorting step fails.
> 
> **Possible Fixes:**
> 1. Refresh and re-upload
> 2. Avoid special characters in filenames  
> 3. Upload in smaller batches
>
> Would you like me to show you where this is handled in the code?

### Optional: Show Code
If user asks, reveal:
\`\`\`typescript
// ust-cc-ttml.reducers.ts, lines 96-183
function handleAssetUploadIdList(state, action) {
  // Upload ID tracking logic
}
\`\`\`

## Why This Works
- JIRA ticket provides context
- Code provides technical depth  
- But we explain in human terms
- Code only shown on request
`;

  const fs = await import('fs');
  fs.writeFileSync('/Users/matt/Documents/projects/mc-thebetabase/tmp/demo-script-upload-failed.md', demoScript);
  console.log('\n💾 Saved demo script to: tmp/demo-script-upload-failed.md\n');
}

main().catch(console.error);











