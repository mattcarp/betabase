/**
 * CDTEXT Parser Test
 * 
 * Run with: npx ts-node src/tools/cdtext.test.ts
 * Or: npx tsx src/tools/cdtext.test.ts
 */

import { parseCdtext } from './cdtext';

// Sample CDTEXT data (Eros Ramazzotti style - from your earlier sessions)
const sampleHex = `
80 00 00 00 45 72 6F 73 20 52 61 6D 61 7A 7A 6F 00 00
80 00 01 00 74 74 69 00 00 00 00 00 00 00 00 00 00 00
81 00 00 00 45 72 6F 73 20 52 61 6D 61 7A 7A 6F 00 00
81 00 01 00 74 74 69 00 00 00 00 00 00 00 00 00 00 00
80 01 00 00 4C 27 4F 6D 62 72 61 20 44 65 6C 20 00 00
80 01 01 00 47 69 67 61 6E 74 65 00 00 00 00 00 00 00
81 01 00 00 45 72 6F 73 20 52 61 6D 61 7A 7A 6F 00 00
81 01 01 00 74 74 69 00 00 00 00 00 00 00 00 00 00 00
80 02 00 00 53 74 65 6C 6C 61 20 47 65 6D 65 6C 00 00
80 02 01 00 6C 61 00 00 00 00 00 00 00 00 00 00 00 00
81 02 00 00 45 72 6F 73 20 52 61 6D 61 7A 7A 6F 00 00
81 02 01 00 74 74 69 00 00 00 00 00 00 00 00 00 00 00
`;

console.log('='.repeat(60));
console.log('CDTEXT Parser Test');
console.log('='.repeat(60));
console.log();

const result = parseCdtext(sampleHex);

if (result.success) {
  console.log(`✅ Parsing successful!`);
  console.log();
  console.log(`Album: "${result.albumTitle}" by ${result.albumArtist}`);
  console.log(`Tracks: ${result.trackCount}`);
  console.log(`Encoding: ${result.encoding}`);
  console.log(`Raw packs parsed: ${result.rawPackCount}`);
  console.log();
  
  console.log('Track Listing:');
  console.log('-'.repeat(40));
  
  for (const track of result.tracks) {
    console.log(`${track.trackLabel}:`);
    for (const [field, value] of Object.entries(track.fields)) {
      if (value) {
        console.log(`  ${field}: ${value}`);
      }
    }
  }
  
  if (result.warnings.length > 0) {
    console.log();
    console.log('Warnings:');
    for (const warning of result.warnings) {
      console.log(`  ⚠️  ${warning}`);
    }
  }
} else {
  console.log(`❌ Parsing failed!`);
  console.log(`Errors: ${result.warnings.join(', ')}`);
}

console.log();
console.log('='.repeat(60));
console.log('Test complete');
console.log('='.repeat(60));
