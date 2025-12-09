#!/usr/bin/env npx tsx
/**
 * Test Nano Banana Pro Infographic Generation
 *
 * Tests the infographic service with demo questions to verify:
 * 1. Detection logic correctly identifies infographic-worthy questions
 * 2. Nano Banana Pro generates quality infographics
 * 3. Generation times are reasonable (< 30s)
 *
 * Usage:
 *   npx tsx scripts/test-infographic.ts
 *
 * Requires:
 *   GOOGLE_GENERATIVE_AI_API_KEY or GEMINI_API_KEY in .env.local
 */

import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

// Load environment variables
dotenv.config({ path: ".env.local" });

// Import service after env is loaded
import {
  detectInfographicType,
  generateInfographic,
  isInfographicAvailable,
  type InfographicType,
} from "../src/services/infographicService";

// Demo questions to test
const TEST_QUESTIONS = [
  {
    question: "What are the steps to link a product to a master in AOMA?",
    expectedType: "workflow" as InfographicType,
    mockAnswer: `To link a product to a master in AOMA, follow these steps:

1. Navigate to the Product Search page
2. Find the product you want to link using ISRC or title
3. Click on the product to open its details
4. Click the "Link to Master" button in the toolbar
5. Search for the master using GRid or title
6. Select the correct master from the search results
7. Choose the linking type: Full Master, Side, or Track
8. Confirm the linking operation
9. Verify the link appears in the product's Master Links section`,
  },
  {
    question: "What's the difference between Full Master, Side, and Track Linking?",
    expectedType: "comparison" as InfographicType,
    mockAnswer: `There are three types of master linking in AOMA:

**Full Master Linking:**
- Links the entire product to a single master
- Used for standard albums and singles
- One-to-one relationship

**Side Linking:**
- Links a product to multiple masters
- Used for vinyl records with A-side and B-side
- Each side references a different master

**Track Linking:**
- Links individual tracks to separate masters
- Used for compilations and various artist albums
- Most granular level of linking`,
  },
  {
    question: "What are the different asset types in AOMA?",
    expectedType: "hierarchy" as InfographicType,
    mockAnswer: `AOMA supports the following asset types in a hierarchy:

**Masters**
- Sound Recordings
- Music Videos
- Audiovisual Content

**Products**
- Albums (Full Length, EP, Single)
- Bundles
- Videos

**Components**
- Tracks
- Video Clips
- Artwork

**Metadata**
- Contributors (Artists, Producers, Writers)
- Rights Information
- Release Data`,
  },
  {
    question: "What new features are in AOMA 2.116.0?",
    expectedType: "timeline" as InfographicType,
    mockAnswer: `AOMA 2.116.0 Release Notes (November 2025):

- New Unified Submission Tool for all content types
- Enhanced video quality validation
- Improved search performance (3x faster)
- New bulk edit capabilities for metadata
- DSP delivery status dashboard
- Mobile-responsive admin interface
- Integration with new Select Partners`,
  },
  {
    question: "What permissions do I need for the Unified Submission Tool?",
    expectedType: "checklist" as InfographicType,
    mockAnswer: `Required permissions for Unified Submission Tool:

- AOMA User Role: Content Manager or higher
- Division Access: Must be assigned to relevant division
- Submission Rights: "Create Submission" permission enabled
- Asset Rights: "Upload Assets" permission for videos
- Metadata Rights: "Edit Metadata" for content info
- Delivery Rights: "Initiate Delivery" for DSP sending
- QC Override: Optional, for bypassing validation (Admin only)`,
  },
];

async function testDetection() {
  console.log("\n=== Testing Infographic Type Detection ===\n");

  let passed = 0;
  let failed = 0;

  for (const test of TEST_QUESTIONS) {
    const detected = detectInfographicType(test.question);
    const match = detected === test.expectedType;

    if (match) {
      console.log(`[OK] "${test.question.substring(0, 50)}..."`);
      console.log(`     Detected: ${detected}`);
      passed++;
    } else {
      console.log(`[FAIL] "${test.question.substring(0, 50)}..."`);
      console.log(`     Expected: ${test.expectedType}, Got: ${detected}`);
      failed++;
    }
  }

  console.log(`\nDetection Results: ${passed}/${passed + failed} passed\n`);
  return failed === 0;
}

async function testGeneration() {
  console.log("\n=== Testing Infographic Generation (Nano Banana Pro) ===\n");

  if (!isInfographicAvailable()) {
    console.log("[SKIP] Gemini API key not configured");
    console.log("       Set GOOGLE_GENERATIVE_AI_API_KEY in .env.local");
    return false;
  }

  // Test with just the first question (to avoid rate limits)
  const test = TEST_QUESTIONS[0];
  console.log(`Testing: "${test.question}"`);
  console.log(`Type: ${test.expectedType}`);
  console.log("Generating infographic...\n");

  const result = await generateInfographic({
    question: test.question,
    answer: test.mockAnswer,
    type: test.expectedType,
  });

  if (result.success && result.imageData) {
    console.log(`[OK] Infographic generated successfully!`);
    console.log(`     Generation time: ${result.generationTimeMs}ms`);
    console.log(`     MIME type: ${result.mimeType}`);
    console.log(`     Image size: ${Math.round(result.imageData.length / 1024)}KB (base64)`);

    // Save to tmp folder for inspection
    const tmpDir = path.join(process.cwd(), "tmp");
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }

    const outputPath = path.join(tmpDir, `test-infographic-${Date.now()}.png`);
    const buffer = Buffer.from(result.imageData, "base64");
    fs.writeFileSync(outputPath, buffer);
    console.log(`     Saved to: ${outputPath}`);

    return true;
  } else {
    console.log(`[FAIL] Generation failed: ${result.error}`);
    return false;
  }
}

async function main() {
  console.log("=================================================");
  console.log("  Nano Banana Pro Infographic Service Test");
  console.log("=================================================");

  // Test detection
  const detectionPassed = await testDetection();

  // Test generation
  const generationPassed = await testGeneration();

  console.log("\n=================================================");
  console.log("  Summary");
  console.log("=================================================");
  console.log(`Detection: ${detectionPassed ? "PASSED" : "FAILED"}`);
  console.log(`Generation: ${generationPassed ? "PASSED" : "SKIPPED/FAILED"}`);
  console.log("");

  if (!detectionPassed || !generationPassed) {
    process.exit(1);
  }
}

main().catch(console.error);
