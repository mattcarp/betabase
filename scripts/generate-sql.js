#!/usr/bin/env node
/**
 * Generate SQL file for AOMA UI Content
 */

const fs = require('fs');

const data = JSON.parse(fs.readFileSync('/Users/matt/Documents/projects/mc-thebetabase/data/aoma-ui-content.json', 'utf-8'));

const sql = [
  '-- AOMA UI Content for User Help',
  '-- Generated: ' + new Date().toISOString(),
  '-- Total records: ' + data.total_items,
  '',
  'CREATE TABLE IF NOT EXISTS aoma_ui_content (',
  '  id SERIAL PRIMARY KEY,',
  '  organization TEXT DEFAULT \'sony-music\',',
  '  division TEXT DEFAULT \'digital-operations\',',
  '  app_under_test TEXT DEFAULT \'aoma\',',
  '  source_type TEXT,',
  '  source_url TEXT,',
  '  content TEXT,',
  '  component TEXT,',
  '  module TEXT,',
  '  content_type TEXT,',
  '  created_at TIMESTAMPTZ DEFAULT NOW()',
  ');',
  ''
];

for (const item of data.content) {
  const content = item.text.replace(/'/g, "''");
  const component = item.component.replace(/'/g, "''");
  const module = item.module.replace(/'/g, "''");
  sql.push(`INSERT INTO aoma_ui_content (source_type, source_url, content, component, module, content_type) VALUES ('${item.type}', '${item.source_file}', '${content}', '${component}', '${module}', '${item.type}');`);
}

fs.writeFileSync('/Users/matt/Documents/projects/mc-thebetabase/data/aoma-ui-content.sql', sql.join('\n'));
console.log('SQL file created with', data.total_items, 'records');
