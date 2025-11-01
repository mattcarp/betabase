#!/usr/bin/env node

/**
 * List all files in OpenAI Assistant's Vector Store
 * 
 * Purpose: Inventory the ~150 AOMA docs in OpenAI to understand their origin
 * Output: JSON file with complete file list and metadata
 */

const OpenAI = require("openai");
const fs = require("fs");
const path = require("path");

require("dotenv").config({ path: ".env.local" });
require("dotenv").config({ path: ".env" });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const ASSISTANT_ID = "asst_VvOHL1c4S6YapYKun4mY29fM";

async function listVectorStoreFiles() {
  console.log("🔍 Querying OpenAI Assistant Vector Store...\n");
  console.log(`📋 Assistant ID: ${ASSISTANT_ID}\n`);

  try {
    // Step 1: Get assistant details
    console.log("1️⃣ Retrieving assistant...");
    const assistant = await openai.beta.assistants.retrieve(ASSISTANT_ID);
    console.log(`   ✅ Assistant Name: ${assistant.name}`);
    console.log(`   ✅ Model: ${assistant.model}`);
    console.log(`   ✅ Tools: ${assistant.tools.map(t => t.type).join(", ")}`);

    // Step 2: Get vector store ID
    const vectorStoreIds = assistant.tool_resources?.file_search?.vector_store_ids || [];
    
    if (vectorStoreIds.length === 0) {
      console.log("\n❌ No vector stores attached to this assistant!");
      return;
    }

    console.log(`\n2️⃣ Found ${vectorStoreIds.length} vector store(s):`);
    vectorStoreIds.forEach((id, idx) => {
      console.log(`   ${idx + 1}. ${id}`);
    });

    // Step 3: List files from each vector store
    const allFiles = [];

    for (const vectorStoreId of vectorStoreIds) {
      console.log(`\n3️⃣ Listing files from vector store: ${vectorStoreId}`);
      
      try {
        const vectorStore = await openai.beta.vectorStores.retrieve(vectorStoreId);
        console.log(`   ✅ Vector Store Name: ${vectorStore.name}`);
        console.log(`   ✅ File Count: ${vectorStore.file_counts.total}`);
        console.log(`   ✅ Status: ${vectorStore.status}`);
        console.log(`   ✅ Created: ${new Date(vectorStore.created_at * 1000).toISOString()}`);

        // List all files in this vector store
        let hasMore = true;
        let after = undefined;
        let fileCount = 0;

        while (hasMore) {
          const filesPage = await openai.beta.vectorStores.files.list(vectorStoreId, {
            limit: 100,
            after: after,
          });

          for (const file of filesPage.data) {
            fileCount++;
            
            // Get full file details
            try {
              const fileDetails = await openai.files.retrieve(file.id);
              
              const fileInfo = {
                vectorStoreId,
                fileId: file.id,
                fileName: fileDetails.filename,
                purpose: fileDetails.purpose,
                bytes: fileDetails.bytes,
                createdAt: new Date(fileDetails.created_at * 1000).toISOString(),
                status: file.status,
                lastError: file.last_error,
              };

              allFiles.push(fileInfo);

              console.log(`   📄 [${fileCount}] ${fileDetails.filename} (${(fileDetails.bytes / 1024).toFixed(1)} KB)`);
            } catch (error) {
              console.error(`   ❌ Failed to get details for file ${file.id}:`, error.message);
              allFiles.push({
                vectorStoreId,
                fileId: file.id,
                fileName: "Unknown (details fetch failed)",
                error: error.message,
              });
            }
          }

          hasMore = filesPage.has_more;
          after = filesPage.data[filesPage.data.length - 1]?.id;
        }

        console.log(`\n   ✅ Total files listed: ${fileCount}`);
      } catch (error) {
        console.error(`   ❌ Failed to list files from ${vectorStoreId}:`, error.message);
      }
    }

    // Step 4: Analyze and categorize
    console.log(`\n4️⃣ Analyzing ${allFiles.length} files...\n`);

    const analysis = {
      totalFiles: allFiles.length,
      totalSize: allFiles.reduce((sum, f) => sum + (f.bytes || 0), 0),
      byExtension: {},
      byPurpose: {},
      byVectorStore: {},
      files: allFiles,
    };

    // Group by file extension
    allFiles.forEach(file => {
      const ext = path.extname(file.fileName || "").toLowerCase() || "no-extension";
      analysis.byExtension[ext] = (analysis.byExtension[ext] || 0) + 1;
    });

    // Group by purpose
    allFiles.forEach(file => {
      const purpose = file.purpose || "unknown";
      analysis.byPurpose[purpose] = (analysis.byPurpose[purpose] || 0) + 1;
    });

    // Group by vector store
    allFiles.forEach(file => {
      const vs = file.vectorStoreId || "unknown";
      analysis.byVectorStore[vs] = (analysis.byVectorStore[vs] || 0) + 1;
    });

    // Print analysis
    console.log("📊 ANALYSIS SUMMARY");
    console.log("═".repeat(70));
    console.log(`\n📈 Total Files: ${analysis.totalFiles}`);
    console.log(`📦 Total Size: ${(analysis.totalSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`📅 Date Range: ${getDateRange(allFiles)}`);

    console.log(`\n📁 By File Extension:`);
    Object.entries(analysis.byExtension)
      .sort((a, b) => b[1] - a[1])
      .forEach(([ext, count]) => {
        console.log(`   ${ext.padEnd(15)}: ${count} files`);
      });

    console.log(`\n🎯 By Purpose:`);
    Object.entries(analysis.byPurpose).forEach(([purpose, count]) => {
      console.log(`   ${purpose.padEnd(15)}: ${count} files`);
    });

    console.log(`\n📦 By Vector Store:`);
    Object.entries(analysis.byVectorStore).forEach(([vsId, count]) => {
      console.log(`   ${vsId.substring(0, 20)}...: ${count} files`);
    });

    // Step 5: Export to file
    const outputPath = path.join(__dirname, "../docs/openai-vector-store-inventory.json");
    fs.writeFileSync(outputPath, JSON.stringify(analysis, null, 2));
    
    console.log(`\n✅ Full inventory exported to:`);
    console.log(`   ${outputPath}`);

    // Also create a human-readable summary
    const summaryPath = path.join(__dirname, "../docs/openai-vector-store-summary.md");
    const summaryMd = generateSummaryMarkdown(analysis);
    fs.writeFileSync(summaryPath, summaryMd);
    
    console.log(`   ${summaryPath}`);
    console.log("\n" + "═".repeat(70) + "\n");

    return analysis;
  } catch (error) {
    console.error("\n❌ Failed to list vector store files:", error);
    throw error;
  }
}

function getDateRange(files) {
  if (files.length === 0) return "N/A";
  
  const dates = files
    .map(f => f.createdAt)
    .filter(Boolean)
    .sort();
  
  if (dates.length === 0) return "N/A";
  
  const earliest = dates[0];
  const latest = dates[dates.length - 1];
  
  if (earliest === latest) return earliest;
  return `${earliest.split('T')[0]} to ${latest.split('T')[0]}`;
}

function generateSummaryMarkdown(analysis) {
  return `# OpenAI Vector Store Inventory Summary

**Generated**: ${new Date().toISOString()}  
**Total Files**: ${analysis.totalFiles}  
**Total Size**: ${(analysis.totalSize / 1024 / 1024).toFixed(2)} MB  

---

## File Distribution

### By Extension
${Object.entries(analysis.byExtension)
  .sort((a, b) => b[1] - a[1])
  .map(([ext, count]) => `- **${ext}**: ${count} files`)
  .join("\n")}

### By Purpose
${Object.entries(analysis.byPurpose)
  .map(([purpose, count]) => `- **${purpose}**: ${count} files`)
  .join("\n")}

### By Vector Store
${Object.entries(analysis.byVectorStore)
  .map(([vsId, count]) => `- **${vsId}**: ${count} files`)
  .join("\n")}

---

## All Files

${analysis.files.map((file, idx) => {
  return `### ${idx + 1}. ${file.fileName || "Unknown"}
- **File ID**: \`${file.fileId}\`
- **Size**: ${file.bytes ? (file.bytes / 1024).toFixed(1) + " KB" : "Unknown"}
- **Created**: ${file.createdAt || "Unknown"}
- **Status**: ${file.status || "Unknown"}
${file.lastError ? `- **Error**: ${JSON.stringify(file.lastError)}` : ""}
`;
}).join("\n")}

---

**Raw JSON**: See \`openai-vector-store-inventory.json\`
`;
}

// Run if called directly
if (require.main === module) {
  listVectorStoreFiles()
    .then(() => {
      console.log("✨ Inventory complete!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Inventory failed:", error);
      process.exit(1);
    });
}

module.exports = { listVectorStoreFiles };

