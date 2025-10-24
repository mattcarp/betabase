/**
 * Git Commit Vectorization Service
 * Extracts git history and vectorizes commits into Supabase
 * Part of the unified AOMA vector store architecture
 */

import { execSync } from "child_process";
import path from "path";
import { getSupabaseVectorService } from "./supabaseVectorService";

export interface GitCommit {
  hash: string;
  author: string;
  authorEmail: string;
  date: string;
  message: string;
  files: string[];
  insertions: number;
  deletions: number;
  branch?: string;
}

export interface GitVectorizationResult {
  totalCommits: number;
  successfulVectorizations: number;
  failedVectorizations: number;
  errors: Array<{ commitHash: string; error: string }>;
  duration: number;
}

export class GitVectorService {
  private vectorService;

  constructor() {
    this.vectorService = getSupabaseVectorService();
  }

  /**
   * Delegate multi-repo indexing to MultiRepoIndexer while keeping backward compatibility.
   */
  async vectorizeReposFromEnv(options: { includeCommits?: boolean; includeFiles?: boolean } = {}) {
    const { getMultiRepoIndexer } = await import("./multiRepoIndexer");
    const indexer = getMultiRepoIndexer();
    return indexer.indexAll(options);
  }

  /**
   * Extract git commits from repository
   */
  async extractGitCommits(
    repositoryPath: string = process.cwd(),
    options: {
      maxCommits?: number;
      since?: string; // ISO date string or relative like "1 month ago"
      branch?: string;
    } = {}
  ): Promise<GitCommit[]> {
    const { maxCommits = 1000, since, branch = "HEAD" } = options;

    try {
      // Build git log command
      // Use %x1f (unit separator) to avoid delimiter collisions in commit messages
      let gitCommand = `git -C "${repositoryPath}" log ${branch} --pretty=format:%x1f%H%x1f%an%x1f%ae%x1f%aI%x1f%s --numstat`;

      if (maxCommits > 0) {
        gitCommand += ` -n ${maxCommits}`;
      }

      if (since) {
        gitCommand += ` --since="${since}"`;
      }

      const gitOutput = execSync(gitCommand, { encoding: "utf8" });

      return this.parseGitOutput(gitOutput, repositoryPath);
    } catch (error) {
      console.error(`Failed to extract git commits from ${repositoryPath}:`, error);
      throw new Error(`Git extraction failed: ${error}`);
    }
  }

  /**
   * Parse git log output into structured commit objects
   */
  private parseGitOutput(gitOutput: string, repositoryPath: string): GitCommit[] {
    const commits: GitCommit[] = [];
    const lines = gitOutput.trim().split("\n");

    let currentCommit: Partial<GitCommit> | null = null;

    for (const line of lines) {
      if (line.includes("\u001F")) {
        // This is a commit header line
        if (currentCommit) {
          commits.push(currentCommit as GitCommit);
        }
        const parts = line.split("\u001F").filter(Boolean);
        if (parts.length < 6) continue;
        const [, hash, author, authorEmail, date, message] = parts;
        currentCommit = {
          hash,
          author,
          authorEmail,
          date,
          message,
          files: [],
          insertions: 0,
          deletions: 0,
        };
      } else if (currentCommit && line.trim()) {
        // This is a file change line (insertions, deletions, filename)
        const parts = line.trim().split("\t");
        if (parts.length === 3) {
          const [insertions, deletions, filename] = parts;
          currentCommit.files!.push(filename);
          currentCommit.insertions! += parseInt(insertions) || 0;
          currentCommit.deletions! += parseInt(deletions) || 0;
        }
      }
    }

    // Don't forget the last commit
    if (currentCommit) {
      commits.push(currentCommit as GitCommit);
    }

    // Add branch information
    try {
      const currentBranch = execSync(`git -C "${repositoryPath}" branch --show-current`, {
        encoding: "utf8",
      }).trim();
      commits.forEach((commit) => (commit.branch = currentBranch));
    } catch (error) {
      console.warn("Could not determine current branch:", error);
    }

    return commits;
  }

  /**
   * Create searchable content from git commit data
   */
  private createCommitContent(commit: GitCommit): string {
    const filesContext =
      commit.files.length > 0
        ? `\nFiles modified: ${commit.files.slice(0, 10).join(", ")}${commit.files.length > 10 ? "..." : ""}`
        : "";

    const statsContext = `\nChanges: +${commit.insertions} -${commit.deletions}`;

    return `${commit.message}${filesContext}${statsContext}

Author: ${commit.author} (${commit.authorEmail})
Date: ${commit.date}
Branch: ${commit.branch || "unknown"}
Commit: ${commit.hash}`;
  }

  /**
   * Create metadata object for git commit
   */
  private createCommitMetadata(
    commit: GitCommit,
    repositoryPath: string,
    repositoryTag: string
  ): Record<string, any> {
    return {
      hash: commit.hash,
      author: commit.author,
      authorEmail: commit.authorEmail,
      date: commit.date,
      message: commit.message,
      branch: commit.branch,
      fileCount: commit.files.length,
      insertions: commit.insertions,
      deletions: commit.deletions,
      files: commit.files.slice(0, 20), // Limit files in metadata to prevent size issues
      vectorizedAt: new Date().toISOString(),
      repo_path: repositoryPath,
      repository: repositoryTag,
    };
  }

  /**
   * Vectorize a single git commit
   */
  async vectorizeCommit(
    commit: GitCommit,
    repositoryPath: string,
    repositoryTag: string
  ): Promise<string> {
    const content = this.createCommitContent(commit);
    const metadata = this.createCommitMetadata(commit, repositoryPath, repositoryTag);
    const sourceId = `${repositoryTag}:${commit.hash}`;

    return await this.vectorService.upsertVector(content, "git", sourceId, metadata);
  }

  /**
   * Vectorize multiple commits in batches
   */
  async vectorizeCommits(
    commits: GitCommit[],
    repositoryPath: string,
    repositoryTag: string
  ): Promise<GitVectorizationResult> {
    const startTime = Date.now();
    const errors: Array<{ commitHash: string; error: string }> = [];

    console.log(`🚀 Starting vectorization of ${commits.length} git commits...`);

    // Update migration status
    await this.vectorService.updateMigrationStatus(`git:${repositoryTag}`, "in_progress", {
      totalCount: commits.length,
      migratedCount: 0,
    });

    // Prepare vectors for batch processing
    const vectors = commits.map((commit) => ({
      content: this.createCommitContent(commit),
      sourceType: "git" as const,
      sourceId: `${repositoryTag}:${commit.hash}`,
      metadata: this.createCommitMetadata(commit, repositoryPath, repositoryTag),
    }));

    // Use the existing batch upsert functionality
    const result = await this.vectorService.batchUpsertVectors(vectors);

    const duration = Date.now() - startTime;

    // Update final migration status
    const status = result.failed === 0 ? "completed" : "failed";
    await this.vectorService.updateMigrationStatus(`git:${repositoryTag}`, status, {
      totalCount: commits.length,
      migratedCount: result.success,
    });

    console.log(
      `✅ Git vectorization complete! ${result.success}/${commits.length} commits vectorized in ${(duration / 1000).toFixed(2)}s`
    );

    return {
      totalCommits: commits.length,
      successfulVectorizations: result.success,
      failedVectorizations: result.failed,
      errors: [], // Errors are handled internally by the batch process
      duration,
    };
  }

  /**
   * Vectorize git commits from a repository with options
   */
  async vectorizeRepository(
    repositoryPath: string = process.cwd(),
    options: {
      maxCommits?: number;
      since?: string;
      branch?: string;
      skipExisting?: boolean;
      repositoryTag?: string;
    } = {}
  ): Promise<GitVectorizationResult> {
    console.log(`📂 Processing git repository: ${repositoryPath}`);
    const repositoryTag = options.repositoryTag || path.basename(repositoryPath);

    // Extract commits
    const commits = await this.extractGitCommits(repositoryPath, options);

    if (commits.length === 0) {
      console.log("⚠️  No commits found to vectorize");
      return {
        totalCommits: 0,
        successfulVectorizations: 0,
        failedVectorizations: 0,
        errors: [],
        duration: 0,
      };
    }

    // Filter out existing commits if requested
    const commitsToProcess = commits;
    if (options.skipExisting) {
      console.log("🔍 Checking for existing commits...");
      // This would require a method to check existing vectors, which we could add
      // For now, we'll process all commits
    }

    // Vectorize the commits
    return await this.vectorizeCommits(commitsToProcess, repositoryPath, repositoryTag);
  }

  /**
   * Search vectorized git commits
   */
  async searchCommits(
    query: string,
    options: {
      matchThreshold?: number;
      matchCount?: number;
      author?: string;
      since?: string;
      branch?: string;
    } = {}
  ) {
    const { matchThreshold = 0.78, matchCount = 10 } = options;

    // Search with git source type filter
    const results = await this.vectorService.searchVectors(query, {
      matchThreshold,
      matchCount,
      sourceTypes: ["git"],
    });

    // Additional filtering by metadata if specified
    let filteredResults = results;

    if (options.author) {
      filteredResults = filteredResults.filter(
        (result) =>
          result.metadata?.author?.toLowerCase().includes(options.author!.toLowerCase()) ||
          result.metadata?.authorEmail?.toLowerCase().includes(options.author!.toLowerCase())
      );
    }

    if (options.since) {
      const sinceDate = new Date(options.since);
      filteredResults = filteredResults.filter(
        (result) => result.metadata?.date && new Date(result.metadata.date) >= sinceDate
      );
    }

    if (options.branch) {
      filteredResults = filteredResults.filter(
        (result) => result.metadata?.branch === options.branch
      );
    }

    return filteredResults;
  }

  /**
   * Get statistics about vectorized git commits
   */
  async getGitVectorStats() {
    // Use existing vector stats with git filter
    const allStats = await this.vectorService.getVectorStats();

    // Filter for git-specific stats
    return allStats?.filter((stat: any) => stat.source_type === "git") || [];
  }

  /**
   * Set up real-time commit monitoring (webhook or polling)
   * This could be extended to watch for new commits and auto-vectorize
   */
  async setupRealtimeMonitoring(repositoryPath: string = process.cwd()) {
    console.log("🔄 Real-time git monitoring not yet implemented");
    console.log("💡 Consider setting up git hooks or polling for new commits");
    // Future implementation could use:
    // - Git hooks (post-commit, post-receive)
    // - File system watching
    // - Periodic polling
    return false;
  }
}

// Export singleton instance
let gitVectorServiceInstance: GitVectorService | null = null;

export function getGitVectorService(): GitVectorService {
  if (!gitVectorServiceInstance) {
    gitVectorServiceInstance = new GitVectorService();
  }
  return gitVectorServiceInstance;
}

export default GitVectorService;
