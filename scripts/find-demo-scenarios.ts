/**
 * Find Perfect Demo Scenarios
 * 
 * Looking for: JIRA tickets about UI issues where we have matching code
 * that can explain the root cause
 * 
 * Run with: infisical run --env=dev -- npx tsx scripts/find-demo-scenarios.ts
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

interface DemoScenario {
  jiraTicket: {
    id: string;
    title: string;
    content: string;
    sourceId: string;
  };
  matchingCode: {
    filePath: string;
    lineRange: string;
    functions: string[];
    preview: string;
  }[];
  demoScript: {
    userQuestion: string;
    withoutCodeKnowledge: string;
    withCodeKnowledge: string;
  };
}

async function main() {
  console.log(`
╔═══════════════════════════════════════════════════════════════════╗
║  🎬 DEMO SCENARIO FINDER                                           ║
║  Finding JIRA tickets + matching code for perfect demo examples    ║
╚═══════════════════════════════════════════════════════════════════╝
  `);

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  // Keywords that indicate UI issues (things in Angular frontend)
  const uiKeywords = [
    'display', 'show', 'button', 'click', 'modal', 'form', 'input',
    'dropdown', 'select', 'table', 'list', 'view', 'screen', 'page',
    'UI', 'interface', 'layout', 'component', 'dialog', 'popup',
    'upload', 'download', 'submission', 'export', 'import'
  ];

  // Step 1: Get ALL JIRA tickets to analyze
  console.log('📋 Loading all JIRA tickets...\n');
  
  const { data: allJira, error: jiraErr } = await supabase
    .from('siam_vectors')
    .select('id, source_id, content, metadata')
    .eq('source_type', 'jira')
    .limit(100);

  if (jiraErr) {
    console.error('Error:', jiraErr.message);
    return;
  }

  console.log(`Found ${allJira?.length || 0} JIRA tickets total\n`);

  // Step 2: Get ALL indexed code
  console.log('📂 Loading all indexed code...\n');
  
  const { data: allCode, error: codeErr } = await supabase
    .from('siam_vectors')
    .select('id, source_id, content, metadata')
    .eq('source_type', 'git')
    .limit(500);

  if (codeErr) {
    console.error('Error:', codeErr.message);
    return;
  }

  console.log(`Found ${allCode?.length || 0} code chunks total\n`);

  // Build a map of code by component/feature
  const codeByFeature: Record<string, typeof allCode> = {};
  const componentNames: string[] = [];

  allCode?.forEach(chunk => {
    const filePath = chunk.metadata?.file_path || '';
    const classes = chunk.metadata?.classes || [];
    const functions = chunk.metadata?.functions || [];
    
    // Extract feature from path (e.g., "ust" from "module-unified-submission-tool")
    const pathMatch = filePath.match(/module-([^/]+)/);
    const feature = pathMatch ? pathMatch[1] : 'shared';
    
    if (!codeByFeature[feature]) codeByFeature[feature] = [];
    codeByFeature[feature].push(chunk);
    
    classes.forEach((c: string) => componentNames.push(c));
  });

  console.log('📊 Code organized by feature:\n');
  Object.entries(codeByFeature).forEach(([feature, chunks]) => {
    console.log(`  • ${feature}: ${chunks.length} chunks`);
  });

  // Step 3: Find JIRA tickets that mention UI-related terms AND features we have code for
  console.log('\n\n🔗 Finding matches between JIRA and code...\n');

  const features = Object.keys(codeByFeature);
  const scenarios: DemoScenario[] = [];

  // Keywords to look for in JIRA that match our code
  const codeFeatureKeywords: Record<string, string[]> = {
    'unified-submission-tool': ['upload', 'submission', 'UST', 'asset', 'aspera', 'TTML', 'CC', 'closed caption', 'dolby', 'atmos', 'quad', 'metadata'],
    'product': ['product', 'linking', 'track', 'master', 'cover', 'preview', 'video'],
    'shared': ['downtime', 'notification', 'page', 'dialog', 'modal'],
  };

  for (const ticket of allJira || []) {
    const content = (ticket.content || '').toLowerCase();
    const title = (ticket.metadata?.title || ticket.source_id).toLowerCase();
    const combined = content + ' ' + title;

    // Check if this is a UI-related issue
    const isUIRelated = uiKeywords.some(kw => combined.includes(kw.toLowerCase()));
    
    // Find which feature this might relate to
    let matchedFeature: string | null = null;
    let matchingKeywords: string[] = [];

    for (const [feature, keywords] of Object.entries(codeFeatureKeywords)) {
      const matches = keywords.filter(kw => combined.includes(kw.toLowerCase()));
      if (matches.length > 0) {
        matchedFeature = feature;
        matchingKeywords = matches;
        break;
      }
    }

    if (matchedFeature && codeByFeature[matchedFeature]) {
      // We have a potential match!
      const relatedCode = codeByFeature[matchedFeature].slice(0, 3);
      
      scenarios.push({
        jiraTicket: {
          id: ticket.id,
          title: ticket.metadata?.title || ticket.source_id,
          content: ticket.content?.substring(0, 500) || '',
          sourceId: ticket.source_id,
        },
        matchingCode: relatedCode.map(c => ({
          filePath: c.metadata?.file_path || 'unknown',
          lineRange: c.metadata?.line_range || '?',
          functions: c.metadata?.functions || [],
          preview: c.content?.substring(0, 200) || '',
        })),
        demoScript: {
          userQuestion: `I'm having an issue with ${matchingKeywords.join(', ')} in AOMA. ${ticket.metadata?.title || ''}`,
          withoutCodeKnowledge: 'I can see you\'re experiencing an issue. Let me check if there are any known problems...',
          withCodeKnowledge: `I found a related ticket: ${ticket.source_id}. Looking at the codebase, this appears to be handled in the ${matchedFeature} module. The relevant code is in [file] which handles [specific function].`,
        },
      });
    }
  }

  console.log(`\n✨ Found ${scenarios.length} potential demo scenarios!\n`);
  console.log('=' . repeat(70) + '\n');

  // Output the top scenarios
  scenarios.slice(0, 5).forEach((scenario, i) => {
    console.log(`\n${'═'.repeat(70)}`);
    console.log(`📌 SCENARIO ${i + 1}: ${scenario.jiraTicket.sourceId}`);
    console.log('═'.repeat(70));
    
    console.log(`\n📋 JIRA Ticket: ${scenario.jiraTicket.title}`);
    console.log(`\n📝 Description:\n${scenario.jiraTicket.content.substring(0, 300)}...`);
    
    console.log(`\n📂 Related Code Files:`);
    scenario.matchingCode.forEach(code => {
      console.log(`   • ${code.filePath} (lines ${code.lineRange})`);
      console.log(`     Functions: ${code.functions.slice(0, 3).join(', ') || 'N/A'}`);
    });

    console.log(`\n🎬 DEMO SCRIPT:`);
    console.log(`\n   USER: "${scenario.demoScript.userQuestion}"`);
    console.log(`\n   ❌ WITHOUT CODE KNOWLEDGE:`);
    console.log(`   "${scenario.demoScript.withoutCodeKnowledge}"`);
    console.log(`\n   ✅ WITH CODE KNOWLEDGE:`);
    console.log(`   "${scenario.demoScript.withCodeKnowledge}"`);
  });

  // Output a summary table
  console.log(`\n\n${'═'.repeat(70)}`);
  console.log('📊 SCENARIO SUMMARY TABLE');
  console.log('═'.repeat(70));
  console.log(`\n| # | JIRA ID | Keywords | Code Feature | Files |`);
  console.log(`|---|---------|----------|--------------|-------|`);
  
  scenarios.slice(0, 10).forEach((s, i) => {
    const jiraId = s.jiraTicket.sourceId.padEnd(15);
    const files = s.matchingCode.length;
    console.log(`| ${i + 1} | ${jiraId} | ${s.matchingCode[0]?.filePath?.split('/').pop() || 'N/A'} | ${files} files |`);
  });

  // Save to file for reference
  const outputPath = '/Users/matt/Documents/projects/mc-thebetabase/tmp/demo-scenarios.json';
  const fs = await import('fs');
  fs.writeFileSync(outputPath, JSON.stringify(scenarios.slice(0, 10), null, 2));
  console.log(`\n\n💾 Saved top 10 scenarios to: ${outputPath}`);

  console.log(`
╔═══════════════════════════════════════════════════════════════════╗
║  ✅ Research Complete!                                             ║
║  Review scenarios above for demo-ready examples                    ║
╚═══════════════════════════════════════════════════════════════════╝
  `);
}

main().catch(console.error);






