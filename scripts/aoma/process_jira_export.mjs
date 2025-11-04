#!/usr/bin/env node

/**
 * Process JIRA ITSM Export CSV
 * Extract valuable training data from support tickets
 */

import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '../..');

const INPUT_FILE = path.join(projectRoot, 'data/aoma-export.csv');
const OUTPUT_DIR = path.join(projectRoot, 'docs/aoma/training-data');
const OUTPUT_JSON = path.join(OUTPUT_DIR, 'jira-tickets-processed.json');
const OUTPUT_MD = path.join(OUTPUT_DIR, 'jira-tickets-summary.md');

console.log('📊 JIRA ITSM Export Processor\n');
console.log('════════════════════════════════════════════════════════════════════\n');

// Read and parse CSV
console.log('📖 Reading CSV file...');
const csvContent = fs.readFileSync(INPUT_FILE, 'utf-8');

console.log('🔍 Parsing CSV data...');
const records = parse(csvContent, {
  columns: true,
  skip_empty_lines: true,
  relax_column_count: true,
  trim: true
});

console.log(`   ✅ Parsed ${records.length.toLocaleString()} tickets\n`);

// Extract and structure relevant data
console.log('🔬 Extracting training data...');

const processedTickets = records
  .map((record, index) => {
    // Extract key fields
    const ticket = {
      id: record['Issue key'],
      type: record['Issue Type'],
      status: record['Status'],
      priority: record['Priority'],
      summary: record['Summary'],
      description: record['Description'],
      created: record['Created'],
      resolved: record['Resolved'],
      resolution: record['Resolution'],
      
      // Custom AOMA fields
      aomaTeam: record['Custom field (AOMA Team)'],
      application: record['Custom field (Application)'],
      environment: record['Custom field (Environment)'],
      assetType: record['Custom field (Asset Type)'],
      
      // Get all comments (there are multiple comment columns)
      comments: []
    };
    
    // Extract comments from multiple comment columns
    for (let i = 433; i <= 464; i++) {
      const commentKey = `Comment`;
      if (record[commentKey]) {
        ticket.comments.push(record[commentKey]);
      }
    }
    
    // Filter out tickets without meaningful data
    if (!ticket.summary && !ticket.description) {
      return null;
    }
    
    return ticket;
  })
  .filter(t => t !== null);

console.log(`   ✅ Extracted ${processedTickets.length.toLocaleString()} valid tickets\n`);

// Categorize tickets by type
console.log('📂 Categorizing tickets...');

const categories = {
  total: processedTickets.length,
  byStatus: {},
  byType: {},
  byPriority: {},
  aomaSpecific: 0,
  withComments: 0,
  resolved: 0
};

processedTickets.forEach(ticket => {
  // Count by status
  categories.byStatus[ticket.status] = (categories.byStatus[ticket.status] || 0) + 1;
  
  // Count by type
  categories.byType[ticket.type] = (categories.byType[ticket.type] || 0) + 1;
  
  // Count by priority
  categories.byPriority[ticket.priority] = (categories.byPriority[ticket.priority] || 0) + 1;
  
  // Count AOMA-specific
  if (ticket.aomaTeam || ticket.summary?.toLowerCase().includes('aoma') || 
      ticket.description?.toLowerCase().includes('aoma')) {
    categories.aomaSpecific++;
  }
  
  // Count with comments
  if (ticket.comments.length > 0) {
    categories.withComments++;
  }
  
  // Count resolved
  if (ticket.resolved) {
    categories.resolved++;
  }
});

console.log(`   ✅ Categorization complete\n`);

// Create output directory
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// Save processed data
console.log('💾 Saving processed data...');
fs.writeFileSync(OUTPUT_JSON, JSON.stringify(processedTickets, null, 2));
console.log(`   ✅ Saved to ${path.relative(projectRoot, OUTPUT_JSON)}\n`);

// Generate summary markdown
console.log('📝 Generating summary report...');

const md = `# JIRA ITSM Support Tickets - Analysis Report

**Generated:** ${new Date().toISOString()}
**Source:** Sony Music JIRA ITSM Export
**Date Range:** ${records[0]['Created']} to ${records[records.length - 1]['Created']}

---

## 📊 Overview

- **Total Tickets:** ${categories.total.toLocaleString()}
- **AOMA-Related:** ${categories.aomaSpecific.toLocaleString()} (${((categories.aomaSpecific / categories.total) * 100).toFixed(1)}%)
- **With Comments:** ${categories.withComments.toLocaleString()} (${((categories.withComments / categories.total) * 100).toFixed(1)}%)
- **Resolved:** ${categories.resolved.toLocaleString()} (${((categories.resolved / categories.total) * 100).toFixed(1)}%)

---

## 📈 Breakdown by Status

${Object.entries(categories.byStatus)
  .sort((a, b) => b[1] - a[1])
  .map(([status, count]) => 
    `- **${status || 'Unknown'}:** ${count.toLocaleString()} (${((count / categories.total) * 100).toFixed(1)}%)`
  )
  .join('\n')}

---

## 📋 Breakdown by Type

${Object.entries(categories.byType)
  .sort((a, b) => b[1] - a[1])
  .map(([type, count]) => 
    `- **${type || 'Unknown'}:** ${count.toLocaleString()} (${((count / categories.total) * 100).toFixed(1)}%)`
  )
  .join('\n')}

---

## ⚡ Breakdown by Priority

${Object.entries(categories.byPriority)
  .sort((a, b) => b[1] - a[1])
  .map(([priority, count]) => 
    `- **${priority || 'Unknown'}:** ${count.toLocaleString()} (${((count / categories.total) * 100).toFixed(1)}%)`
  )
  .join('\n')}

---

## 🎯 Top 50 AOMA-Specific Issues (Sample)

${processedTickets
  .filter(t => t.aomaTeam || t.summary?.toLowerCase().includes('aoma') || 
              t.description?.toLowerCase().includes('aoma'))
  .slice(0, 50)
  .map((ticket, i) => `
### ${i + 1}. ${ticket.summary} [${ticket.id}]

- **Type:** ${ticket.type}
- **Status:** ${ticket.status}
- **Priority:** ${ticket.priority}
- **Created:** ${ticket.created}
${ticket.resolved ? `- **Resolved:** ${ticket.resolved}` : ''}
${ticket.aomaTeam ? `- **AOMA Team:** ${ticket.aomaTeam}` : ''}

${ticket.description ? `**Description:**\n${ticket.description.substring(0, 300)}${ticket.description.length > 300 ? '...' : ''}\n` : ''}
${ticket.comments.length > 0 ? `\n**Comments:** ${ticket.comments.length} comment(s)\n` : ''}
---
`)
  .join('\n')}

---

## 📁 Output Files

- **Processed JSON:** \`${path.relative(projectRoot, OUTPUT_JSON)}\`
- **Summary Report:** \`${path.relative(projectRoot, OUTPUT_MD)}\`

---

## 🚀 Next Steps

1. **Review the sample issues above** to understand common support patterns
2. **Use processed JSON** to train embeddings for semantic search
3. **Extract Q&A pairs** from resolved tickets with comments
4. **Identify common pain points** and improve documentation
5. **Build FAQ** from frequently occurring issues

---

*Generated by JIRA ITSM Export Processor*
`;

fs.writeFileSync(OUTPUT_MD, md);
console.log(`   ✅ Saved to ${path.relative(projectRoot, OUTPUT_MD)}\n`);

// Print summary
console.log('════════════════════════════════════════════════════════════════════');
console.log('✨ Processing Complete!\n');
console.log('📊 Summary:');
console.log(`   • Total tickets: ${categories.total.toLocaleString()}`);
console.log(`   • AOMA-related: ${categories.aomaSpecific.toLocaleString()}`);
console.log(`   • With resolution: ${categories.resolved.toLocaleString()}`);
console.log(`   • With comments: ${categories.withComments.toLocaleString()}`);
console.log('\n💡 Files created:');
console.log(`   • ${path.relative(projectRoot, OUTPUT_JSON)}`);
console.log(`   • ${path.relative(projectRoot, OUTPUT_MD)}`);
console.log('\n🎯 Next: Review the summary report and extract Q&A training data');
console.log('════════════════════════════════════════════════════════════════════\n');

