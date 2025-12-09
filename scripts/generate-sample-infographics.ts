#!/usr/bin/env npx tsx
/**
 * Generate sample infographics for demo
 */

import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

dotenv.config({ path: ".env.local" });

import { generateInfographic, type InfographicType } from "../src/services/infographicService";

const SAMPLES = [
  {
    name: "comparison",
    question: "What's the difference between Full Master, Side, and Track Linking?",
    type: "comparison" as InfographicType,
    answer: `There are three types of master linking in AOMA:

**Full Master Linking:**
- Links the entire product to a single master
- Used for standard albums and singles
- One-to-one relationship
- Most common type

**Side Linking:**
- Links a product to multiple masters
- Used for vinyl records with A-side and B-side
- Each side references a different master
- Legacy format support

**Track Linking:**
- Links individual tracks to separate masters
- Used for compilations and various artist albums
- Most granular level of linking
- Required for complex releases`,
  },
  {
    name: "hierarchy",
    question: "What are the different asset types in AOMA?",
    type: "hierarchy" as InfographicType,
    answer: `AOMA supports the following asset types in a hierarchy:

**Masters** (Top Level)
- Sound Recordings
- Music Videos
- Audiovisual Content

**Products** (Mid Level)
- Albums (Full Length, EP, Single)
- Bundles
- Videos

**Components** (Detail Level)
- Tracks
- Video Clips
- Artwork

**Metadata** (Supporting)
- Contributors (Artists, Producers, Writers)
- Rights Information
- Release Data
- Territory Info`,
  },
];

async function main() {
  const tmpDir = path.join(process.cwd(), "tmp");
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
  }

  for (const sample of SAMPLES) {
    console.log(`\nGenerating ${sample.type} infographic: "${sample.question}"...`);

    const result = await generateInfographic({
      question: sample.question,
      answer: sample.answer,
      type: sample.type,
    });

    if (result.success && result.imageData) {
      const outputPath = path.join(tmpDir, `sample-${sample.name}-${Date.now()}.png`);
      const buffer = Buffer.from(result.imageData, "base64");
      fs.writeFileSync(outputPath, buffer);
      console.log(`  Saved: ${outputPath}`);
      console.log(`  Time: ${result.generationTimeMs}ms`);
    } else {
      console.log(`  Failed: ${result.error}`);
    }
  }
}

main().catch(console.error);
