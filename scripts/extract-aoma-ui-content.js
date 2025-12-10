#!/usr/bin/env node
/**
 * AOMA UI Content Extractor
 * 
 * Extracts user-facing content from AOMA-UI HTML templates:
 * - Tooltips (matTooltip)
 * - Placeholders
 * - Labels and text
 * - Error messages
 * - Help text
 * 
 * Output: JSON file ready for Supabase ingestion
 */

const fs = require('fs');
const path = require('path');

const AOMA_UI_SRC = '/Users/matt/Documents/projects/aoma-ui/src';
const OUTPUT_FILE = '/Users/matt/Documents/projects/mc-thebetabase/data/aoma-ui-content.json';

function extractContent(htmlContent, filePath) {
  const content = [];
  const componentName = path.basename(filePath, '.component.html');
  const modulePath = path.dirname(filePath).split('/').slice(-3).join('/');
  
  // Extract matTooltip values
  const tooltipMatches = htmlContent.matchAll(/matTooltip="([^"]+)"/g);
  for (const match of tooltipMatches) {
    content.push({
      type: 'tooltip',
      text: match[1],
      component: componentName,
      module: modulePath,
      source_file: filePath
    });
  }
  
  // Extract placeholders
  const placeholderMatches = htmlContent.matchAll(/placeholder="([^"]+)"/g);
  for (const match of placeholderMatches) {
    content.push({
      type: 'placeholder',
      text: match[1],
      component: componentName,
      module: modulePath,
      source_file: filePath
    });
  }
  
  // Extract button/label text (capitalized text in elements)
  const labelMatches = htmlContent.matchAll(/>([A-Z][A-Za-z\s]{3,40})</g);
  for (const match of labelMatches) {
    const text = match[1].trim();
    if (text && !text.includes('{{') && text.length > 3) {
      content.push({
        type: 'label',
        text: text,
        component: componentName,
        module: modulePath,
        source_file: filePath
      });
    }
  }
  
  // Extract title attributes
  const titleMatches = htmlContent.matchAll(/title="([^"]+)"/g);
  for (const match of titleMatches) {
    if (!match[1].includes('{{')) {
      content.push({
        type: 'title',
        text: match[1],
        component: componentName,
        module: modulePath,
        source_file: filePath
      });
    }
  }
  
  return content;
}

function findHtmlFiles(dir) {
  const files = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      files.push(...findHtmlFiles(fullPath));
    } else if (item.name.endsWith('.html')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

function main() {
  console.log('AOMA UI Content Extractor');
  console.log('=========================\n');
  
  const htmlFiles = findHtmlFiles(AOMA_UI_SRC);
  console.log(`Found ${htmlFiles.length} HTML files\n`);
  
  const allContent = [];
  
  for (const file of htmlFiles) {
    try {
      const content = fs.readFileSync(file, 'utf-8');
      const extracted = extractContent(content, file);
      allContent.push(...extracted);
    } catch (e) {
      console.error(`Error processing ${file}: ${e.message}`);
    }
  }
  
  // Deduplicate by text
  const uniqueContent = [];
  const seen = new Set();
  
  for (const item of allContent) {
    const key = `${item.type}:${item.text}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueContent.push(item);
    }
  }
  
  console.log(`Extracted ${allContent.length} items`);
  console.log(`Unique items: ${uniqueContent.length}`);
  
  // Group by type
  const byType = {};
  for (const item of uniqueContent) {
    byType[item.type] = (byType[item.type] || 0) + 1;
  }
  console.log('\nBy type:', byType);
  
  // Ensure output directory exists
  const outputDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Write output
  const output = {
    extracted_at: new Date().toISOString(),
    source: 'aoma-ui',
    total_files: htmlFiles.length,
    total_items: uniqueContent.length,
    by_type: byType,
    content: uniqueContent
  };
  
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
  console.log(`\nOutput written to: ${OUTPUT_FILE}`);
}

main();
