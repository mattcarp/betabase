#!/usr/bin/env npx tsx
/**
 * CLI Script to Index Code Repositories
 * 
 * Indexes source code files into the vector store for RAG retrieval.
 * Supports Angular/TypeScript/JavaScript projects.
 * 
 * Usage:
 *   npx tsx scripts/index-code-repos.ts
 *   npx tsx scripts/index-code-repos.ts --files-only
 *   npx tsx scripts/index-code-repos.ts --commits-only
 *   npx tsx scripts/index-code-repos.ts --repo "/path/to/repo"
 * 
 * Environment Variables:
 *   GIT_FRONTEND_REPO_PATH - Path to frontend repo
 *   GIT_BACKEND_REPO_PATH - Path to backend repo  
 *   GIT_ADDITIONAL_REPOS - Comma-separated additional repo paths
 */

import { config } from 'dotenv';
import path from 'path';

// Load environment variables
config({ path: path.resolve(process.cwd(), '.env.local') });
config({ path: path.resolve(process.cwd(), '.env') });

import { getMultiRepoIndexer } from '../src/services/multiRepoIndexer';
import { scanRepository, getDefaultIndexingConfig } from '../src/utils/gitIndexingHelpers';

interface CliOptions {
  includeFiles: boolean;
  includeCommits: boolean;
  specificRepo?: string;
  dryRun: boolean;
}

function parseArgs(): CliOptions {
  const args = process.argv.slice(2);
  const options: CliOptions = {
    includeFiles: true,
    includeCommits: true,
    dryRun: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--files-only') {
      options.includeCommits = false;
    } else if (arg === '--commits-only') {
      options.includeFiles = false;
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--repo' && args[i + 1]) {
      options.specificRepo = args[++i];
    } else if (arg === '--help' || arg === '-h') {
      console.log(`
📂 Code Repository Indexer
==========================

Indexes source code files into the vector store for RAG retrieval.

Usage:
  npx tsx scripts/index-code-repos.ts [options]

Options:
  --files-only     Index only source code files (skip commits)
  --commits-only   Index only git commits (skip files)
  --repo <path>    Index a specific repository path
  --dry-run        Show what would be indexed without actually indexing
  --help, -h       Show this help message

Environment Variables:
  GIT_FRONTEND_REPO_PATH   Path to frontend repository
  GIT_BACKEND_REPO_PATH    Path to backend repository
  GIT_ADDITIONAL_REPOS     Comma-separated list of additional repos

Examples:
  npx tsx scripts/index-code-repos.ts
  npx tsx scripts/index-code-repos.ts --files-only --dry-run
  npx tsx scripts/index-code-repos.ts --repo "/path/to/my/repo"
`);
      process.exit(0);
    }
  }

  return options;
}

async function showDryRun(repoPath: string) {
  console.log(`\n📂 Scanning: ${repoPath}`);
  
  const config = getDefaultIndexingConfig();
  console.log(`   Extensions: ${config.includeExtensions.join(', ')}`);
  console.log(`   Exclude: ${config.excludePatterns.join(', ')}`);
  console.log(`   Max file size: ${(config.maxFileSizeBytes / 1024).toFixed(0)}KB`);
  
  const files = await scanRepository(repoPath, config);
  
  console.log(`\n   📊 Found ${files.length} files to index:`);
  
  // Group by extension
  const byExt: Record<string, number> = {};
  for (const file of files) {
    const ext = path.extname(file.relativePath) || 'no-ext';
    byExt[ext] = (byExt[ext] || 0) + 1;
  }
  
  for (const [ext, count] of Object.entries(byExt).sort((a, b) => b[1] - a[1])) {
    console.log(`      ${ext}: ${count} files`);
  }
  
  // Show sample files
  console.log(`\n   📄 Sample files:`);
  for (const file of files.slice(0, 10)) {
    const sizeKb = (file.sizeBytes / 1024).toFixed(1);
    console.log(`      ${file.relativePath} (${sizeKb}KB)`);
  }
  if (files.length > 10) {
    console.log(`      ... and ${files.length - 10} more`);
  }
  
  return files.length;
}

async function main() {
  const options = parseArgs();
  
  console.log(`
╔════════════════════════════════════════════════════════════╗
║  📂 Code Repository Indexer                                ║
║  Indexing source code into vector store for RAG            ║
╚════════════════════════════════════════════════════════════╝
`);

  const indexer = getMultiRepoIndexer();
  
  // Determine repos to index
  let repos: string[] = [];
  if (options.specificRepo) {
    repos = [options.specificRepo];
  } else {
    repos = indexer.discoverRepositories();
  }
  
  if (repos.length === 0) {
    console.error(`
❌ No repositories configured!

Set one of these environment variables in .env.local:
  GIT_FRONTEND_REPO_PATH="/path/to/frontend/repo"
  GIT_BACKEND_REPO_PATH="/path/to/backend/repo"
  GIT_ADDITIONAL_REPOS="/path/to/repo1,/path/to/repo2"

Or specify a repo directly:
  npx tsx scripts/index-code-repos.ts --repo "/path/to/repo"
`);
    process.exit(1);
  }
  
  console.log(`🔍 Found ${repos.length} repository(ies) to index:`);
  for (const repo of repos) {
    console.log(`   • ${repo}`);
  }
  
  console.log(`\n⚙️  Options:`);
  console.log(`   Include files: ${options.includeFiles ? '✅' : '❌'}`);
  console.log(`   Include commits: ${options.includeCommits ? '✅' : '❌'}`);
  console.log(`   Dry run: ${options.dryRun ? '✅' : '❌'}`);
  
  if (options.dryRun) {
    console.log(`\n🔍 DRY RUN - Scanning without indexing...\n`);
    let totalFiles = 0;
    for (const repo of repos) {
      totalFiles += await showDryRun(repo);
    }
    console.log(`\n✅ Dry run complete. Would index ${totalFiles} files total.`);
    console.log(`\n   Run without --dry-run to actually index.`);
    return;
  }
  
  // Actually run the indexer
  console.log(`\n🚀 Starting indexing...\n`);
  const startTime = Date.now();
  
  try {
    if (options.specificRepo) {
      // Index specific repo
      if (options.includeFiles) {
        console.log(`📂 Indexing files from: ${options.specificRepo}`);
        const summary = await indexer.indexRepository(options.specificRepo);
        console.log(`   ✅ Indexed ${summary.filesIndexed} files, ${summary.chunksUpserted} chunks`);
      }
      if (options.includeCommits) {
        console.log(`📝 Indexing commits from: ${options.specificRepo}`);
        await indexer.indexCommits(options.specificRepo);
        console.log(`   ✅ Commits indexed`);
      }
    } else {
      // Index all configured repos
      const result = await indexer.indexAll({
        includeCommits: options.includeCommits,
        includeFiles: options.includeFiles,
      });
      
      console.log(`\n📊 Results:`);
      for (const summary of result.summaries) {
        console.log(`   ${summary.repository}: ${summary.filesIndexed} files, ${summary.chunksUpserted} chunks`);
      }
      
      if (result.errors.length > 0) {
        console.log(`\n⚠️  Errors:`);
        for (const err of result.errors) {
          console.log(`   ${err.repo}: ${err.error}`);
        }
      }
    }
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n✅ Indexing complete in ${duration}s`);
    console.log(`\n💡 The AI can now search your code! Try asking:`);
    console.log(`   "Where is the product linking logic in the code?"`);
    console.log(`   "Show me the MasterDetailsComponent implementation"`);
    
  } catch (error: any) {
    console.error(`\n❌ Indexing failed: ${error.message}`);
    process.exit(1);
  }
}

main().catch(console.error);








