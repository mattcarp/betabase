#!/usr/bin/env node
/**
 * Generate realistic DDP test fixtures
 *
 * Creates DDPID, DDPMS, and DDPPQ files that match the DDP specification
 * for testing the DDP parser.
 */

const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = __dirname;

// Helper to pad a string to exact length
function pad(str, len, char = ' ') {
  return (str + char.repeat(len)).substring(0, len);
}

// Helper to pad number with zeros
function padNum(num, len) {
  return String(num).padStart(len, '0');
}

/**
 * Generate DDPID file (128 bytes)
 * Fields based on DDP 2.00 spec:
 * - ddpid: 0-7 (8 bytes) "DDP ID  "
 * - upc: 8-20 (13 bytes) UPC/EAN barcode
 * - mss: 21-28 (8 bytes) Master start sector
 * - msl: 29-36 (8 bytes) Master sector length
 * - med: 37 (1 byte) Medium type
 * - mid: 38-85 (48 bytes) Master ID
 * - bk: 86 (1 byte) Block info
 * - type: 87-88 (2 bytes) Disc type
 * - nside: 89 (1 byte) Number of sides
 * - side: 90 (1 byte) Side number
 * - nlayer: 91 (1 byte) Number of layers
 * - layer: 92 (1 byte) Layer number
 * - reserved: 93-94 (2 bytes)
 * - txt: 95-127 (33 bytes) Text info
 */
function generateDDPID() {
  const buffer = Buffer.alloc(128, ' ');

  buffer.write('DDP ID  ', 0, 8, 'ascii');           // ddpid
  buffer.write('0886446672632', 8, 13, 'ascii');     // upc - real-looking UPC
  buffer.write('00000000', 21, 8, 'ascii');          // mss
  buffer.write('00350000', 29, 8, 'ascii');          // msl
  buffer.write('C', 37, 1, 'ascii');                 // med - CD
  buffer.write('Test Album Master - 2024', 38, 48, 'ascii'); // mid
  buffer.write('1', 86, 1, 'ascii');                 // bk
  buffer.write('CD', 87, 2, 'ascii');                // type
  buffer.write('1', 89, 1, 'ascii');                 // nside
  buffer.write('1', 90, 1, 'ascii');                 // side
  buffer.write('1', 91, 1, 'ascii');                 // nlayer
  buffer.write('1', 92, 1, 'ascii');                 // layer
  buffer.write('  ', 93, 2, 'ascii');                // reserved
  buffer.write('Generated for testing', 95, 33, 'ascii'); // txt

  return buffer;
}

/**
 * Generate DDPMS file (128-byte blocks per entry)
 * Creates a 5-track album for testing
 */
function generateDDPMS() {
  const tracks = [
    { name: 'AUDIO001.DAT', type: 'DA', trackNum: 1, sectors: 15000, isrc: 'USRC11234567' },
    { name: 'AUDIO002.DAT', type: 'DA', trackNum: 2, sectors: 18000, isrc: 'USRC11234568' },
    { name: 'AUDIO003.DAT', type: 'DA', trackNum: 3, sectors: 12000, isrc: 'USRC11234569' },
    { name: 'AUDIO004.DAT', type: 'DA', trackNum: 4, sectors: 21000, isrc: 'USRC11234570' },
    { name: 'AUDIO005.DAT', type: 'DA', trackNum: 5, sectors: 16000, isrc: 'USRC11234571' },
  ];

  const buffer = Buffer.alloc(128 * tracks.length, ' ');
  let sectorOffset = 0;

  tracks.forEach((track, i) => {
    const offset = i * 128;

    // Build the 128-byte block according to DDPMS spec
    buffer.write('DDP2', offset + 0, 4, 'ascii');              // mpv (0-3)
    buffer.write('  ', offset + 4, 2, 'ascii');                // dst (4-5)
    buffer.write(padNum(sectorOffset, 8), offset + 6, 8, 'ascii'); // dsp (6-13)
    buffer.write(padNum(track.sectors, 8), offset + 14, 8, 'ascii'); // dsl (14-21)
    buffer.write(padNum(0, 8), offset + 22, 8, 'ascii');       // dss (22-29)
    buffer.write('        ', offset + 30, 8, 'ascii');         // sub (30-37)
    buffer.write(track.type, offset + 38, 2, 'ascii');         // cdm (38-39)
    buffer.write(' ', offset + 40, 1, 'ascii');                // ssm (40)
    buffer.write(' ', offset + 41, 1, 'ascii');                // scr (41)
    buffer.write('0000', offset + 42, 4, 'ascii');             // pre1 (42-45)
    buffer.write('0000', offset + 46, 4, 'ascii');             // pre2 (46-49)
    buffer.write('0000', offset + 50, 4, 'ascii');             // pst (50-53)
    buffer.write('A', offset + 54, 1, 'ascii');                // med (54)
    buffer.write(padNum(track.trackNum, 2), offset + 55, 2, 'ascii'); // trk (55-56)
    buffer.write('01', offset + 57, 2, 'ascii');               // idx (57-58)
    buffer.write(track.isrc, offset + 59, 12, 'ascii');        // isrc (59-70)
    buffer.write('   ', offset + 71, 3, 'ascii');              // siz (71-73)
    buffer.write(pad(track.name, 17), offset + 74, 17, 'ascii'); // dsi (74-90)

    sectorOffset += track.sectors;
  });

  return buffer;
}

/**
 * Generate DDPPQ file (64-byte blocks)
 * Creates PQ subcodes for timing information
 */
function generateDDPPQ() {
  // 5 tracks with index 00 (pause) and index 01 (start) for each, plus lead-out
  const entries = [];

  // Track times (in frames, where 75 frames = 1 second)
  const trackTimes = [
    { track: 1, index00: { min: 0, sec: 0, frm: 0 }, index01: { min: 0, sec: 2, frm: 0 } },
    { track: 1, index01: { min: 3, sec: 20, frm: 0 } }, // End of track 1
    { track: 2, index00: { min: 3, sec: 20, frm: 0 }, index01: { min: 3, sec: 22, frm: 0 } },
    { track: 2, index01: { min: 7, sec: 10, frm: 0 } },
    { track: 3, index00: { min: 7, sec: 10, frm: 0 }, index01: { min: 7, sec: 12, frm: 0 } },
    { track: 3, index01: { min: 10, sec: 5, frm: 0 } },
    { track: 4, index00: { min: 10, sec: 5, frm: 0 }, index01: { min: 10, sec: 7, frm: 0 } },
    { track: 4, index01: { min: 15, sec: 30, frm: 0 } },
    { track: 5, index00: { min: 15, sec: 30, frm: 0 }, index01: { min: 15, sec: 32, frm: 0 } },
    { track: 5, index01: { min: 19, sec: 45, frm: 0 } },
    { track: 'AA', index01: { min: 19, sec: 45, frm: 0 } }, // Lead-out
  ];

  // Create proper PQ entries for each track
  const pqEntries = [
    // Track 1 - index 00 (pause before)
    { trk: '01', idx: '00', min: '00', sec: '00', frm: '00', isrc: 'USRC11234567' },
    // Track 1 - index 01 (track start)
    { trk: '01', idx: '01', min: '00', sec: '02', frm: '00', isrc: 'USRC11234567' },
    // Track 2 - index 00
    { trk: '02', idx: '00', min: '03', sec: '20', frm: '00', isrc: 'USRC11234568' },
    // Track 2 - index 01
    { trk: '02', idx: '01', min: '03', sec: '22', frm: '00', isrc: 'USRC11234568' },
    // Track 3 - index 00
    { trk: '03', idx: '00', min: '07', sec: '10', frm: '00', isrc: 'USRC11234569' },
    // Track 3 - index 01
    { trk: '03', idx: '01', min: '07', sec: '12', frm: '00', isrc: 'USRC11234569' },
    // Track 4 - index 00
    { trk: '04', idx: '00', min: '10', sec: '05', frm: '00', isrc: 'USRC11234570' },
    // Track 4 - index 01
    { trk: '04', idx: '01', min: '10', sec: '07', frm: '00', isrc: 'USRC11234570' },
    // Track 5 - index 00
    { trk: '05', idx: '00', min: '15', sec: '30', frm: '00', isrc: 'USRC11234571' },
    // Track 5 - index 01
    { trk: '05', idx: '01', min: '15', sec: '32', frm: '00', isrc: 'USRC11234571' },
    // Lead-out (track AA)
    { trk: 'AA', idx: '01', min: '19', sec: '45', frm: '00', isrc: '' },
  ];

  const buffer = Buffer.alloc(64 * pqEntries.length, ' ');

  pqEntries.forEach((entry, i) => {
    const offset = i * 64;

    // Build the 64-byte block according to DDPPQ spec
    buffer.write('PQ01', offset + 0, 4, 'ascii');         // spv (0-3)
    buffer.write(entry.trk, offset + 4, 2, 'ascii');      // trk (4-5)
    buffer.write(entry.idx, offset + 6, 2, 'ascii');      // idx (6-7)
    buffer.write('00', offset + 8, 2, 'ascii');           // hrs (8-9)
    buffer.write(entry.min, offset + 10, 2, 'ascii');     // min (10-11)
    buffer.write(entry.sec, offset + 12, 2, 'ascii');     // sec (12-13)
    buffer.write(entry.frm, offset + 14, 2, 'ascii');     // frm (14-15)
    buffer.write('00', offset + 16, 2, 'ascii');          // cb1 (16-17)
    buffer.write('00', offset + 18, 2, 'ascii');          // cb2 (18-19)
    buffer.write(pad(entry.isrc, 12), offset + 20, 12, 'ascii'); // isrc (20-31)
    buffer.write('0886446672632', offset + 32, 13, 'ascii'); // upc (32-44)
    buffer.write(pad('', 19), offset + 45, 19, 'ascii');  // txt (45-63)
  });

  return buffer;
}

// Generate all files
console.log('Generating DDP test fixtures...');

fs.writeFileSync(path.join(OUTPUT_DIR, 'DDPID'), generateDDPID());
console.log('  Created DDPID (128 bytes)');

fs.writeFileSync(path.join(OUTPUT_DIR, 'DDPMS'), generateDDPMS());
console.log('  Created DDPMS (5 tracks, 640 bytes)');

fs.writeFileSync(path.join(OUTPUT_DIR, 'DDPPQ'), generateDDPPQ());
console.log('  Created DDPPQ (11 entries, 704 bytes)');

console.log('Done! DDP fixtures created in:', OUTPUT_DIR);
