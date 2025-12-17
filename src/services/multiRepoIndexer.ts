import path from "path";
import fs from "fs/promises";
import pLimit from "p-limit";
import { getSupabaseVectorService } from "./supabaseVectorService";
import { getCodeStructureAnalyzer } from "./codeStructureAnalyzer";
import {
  normalizeRepoName,
  scanRepository,
  getDefaultIndexingConfig,
} from "../utils/gitIndexingHelpers";
import { getGitVectorService } from "./gitVectorService";

export interface IndexSummary {
  repository: string;
  repoPath: string;
  filesIndexed: number;
  chunksUpserted: number;
}

export class MultiRepoIndexer {
  private vectorService = getSupabaseVectorService();
  private analyzer = getCodeStructureAnalyzer();

  discoverRepositories(): string[] {
    const repos: string[] = [];
    const front = process.env.GIT_FRONTEND_REPO_PATH?.trim();
    const back = process.env.GIT_BACKEND_REPO_PATH?.trim();
    const additional = (process.env.GIT_ADDITIONAL_REPOS || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (front) repos.push(front);
    if (back) repos.push(back);
    repos.push(...additional);
    // Ensure unique
    return Array.from(new Set(repos.map((p) => path.resolve(p))));
  }

  async indexRepository(repoPath: string): Promise<IndexSummary> {
    const tag = normalizeRepoName(repoPath);
    const config = getDefaultIndexingConfig();
    const files = await scanRepository(repoPath, config);

    // Simple caching by file mtime to skip unchanged files across runs
    const cacheFile = path.resolve(process.cwd(), "tmp/git-index-cache.json");
    let cache: Record<string, number> = {};
    try {
      const raw = await fs.readFile(cacheFile, "utf8");
      cache = JSON.parse(raw);
    } catch {}
    const keyOf = (rel: string) => `${tag}:${rel}`;
    const changedFiles = files.filter((f) => cache[keyOf(f.relativePath)] !== f.mtimeMs);
    const batchSize = Math.max(
      1,
      parseInt(process.env.VECTOR_FILE_BATCH_SIZE || process.env.VECTOR_BATCH_SIZE || "100", 10)
    );
    const fileConcurrency = Math.max(1, parseInt(process.env.VECTOR_FILE_CONCURRENCY || "4", 10));
    const limit = pLimit(fileConcurrency);

    let totalChunks = 0;
    let migrated = 0;
    await this.vectorService.updateMigrationStatus(`git:${tag}`, "in_progress", {
      totalCount: changedFiles.length,
      migratedCount: 0,
    });

    console.log(`📂 Processing ${changedFiles.length} files in batches of ${batchSize}...`);
    
    for (let i = 0; i < changedFiles.length; i += batchSize) {
      const batchFiles = changedFiles.slice(i, i + batchSize);
      const batchNum = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(changedFiles.length / batchSize);
      console.log(`   Batch ${batchNum}/${totalBatches}: Processing ${batchFiles.length} files...`);

      const analyses = await Promise.all(
        batchFiles.map((file) =>
          limit(() =>
            this.analyzer.analyzeFile(repoPath, file.absolutePath, file.relativePath, tag)
          )
        )
      );
      const vectors = analyses.filter(Boolean).flatMap((a) => {
        const chunks = (a as any)?.chunks;
        if (!chunks || !Array.isArray(chunks)) {
          console.warn(`⚠️  Skipping file with no chunks: ${(a as any)?.relativePath || 'unknown'}`);
          return [];
        }
        totalChunks += chunks.length;
        return chunks as Array<{
          content: string;
          sourceType: "git";
          sourceId: string;
          metadata: Record<string, any>;
        }>;
      });

      if (vectors.length > 0) {
        const res = await this.vectorService.batchUpsertVectors(vectors);
        migrated += res.success;
        // Update cache entries for successfully processed files
        for (const f of batchFiles) {
          cache[keyOf(f.relativePath)] = f.mtimeMs;
        }
      }

      await this.vectorService.updateMigrationStatus(`git:${tag}`, "in_progress", {
        totalCount: changedFiles.length,
        migratedCount: Math.min(changedFiles.length, i + batchFiles.length),
      });
    }

    await this.vectorService.updateMigrationStatus(`git:${tag}`, "completed", {
      totalCount: changedFiles.length,
      migratedCount: changedFiles.length,
    });

    // Persist cache
    try {
      await fs.mkdir(path.dirname(cacheFile), { recursive: true });
      await fs.writeFile(cacheFile, JSON.stringify(cache, null, 2), "utf8");
    } catch {}

    return {
      repository: tag,
      repoPath: path.resolve(repoPath),
      filesIndexed: changedFiles.length,
      chunksUpserted: migrated,
    };
  }

  async indexCommits(repoPath: string) {
    const git = getGitVectorService();
    const tag = normalizeRepoName(repoPath);
    return git.vectorizeRepository(repoPath, {
      maxCommits: parseInt(process.env.GIT_MAX_COMMITS || "500", 10),
      since: process.env.GIT_SINCE || "6 months ago",
      branch: process.env.GIT_BRANCH || "HEAD",
      skipExisting: (process.env.GIT_SKIP_EXISTING || "false").toLowerCase() === "true",
      repositoryTag: tag,
    });
  }

  async indexAll({ includeCommits = true, includeFiles = true } = {}) {
    const repos = this.discoverRepositories();
    if (repos.length === 0) {
      throw new Error(
        "No repositories configured. Set GIT_FRONTEND_REPO_PATH/GIT_BACKEND_REPO_PATH or GIT_ADDITIONAL_REPOS."
      );
    }

    const summaries: IndexSummary[] = [];
    const errors: Array<{ repo: string; error: string }> = [];

    const globalLimit = pLimit(
      Math.max(1, parseInt(process.env.GIT_GLOBAL_CONCURRENCY || "2", 10))
    );
    await Promise.all(
      repos.map((repo) =>
        globalLimit(async () => {
          try {
            if (includeFiles) {
              const summary = await this.indexRepository(repo);
              summaries.push(summary);
            }
            if (includeCommits) {
              await this.indexCommits(repo);
            }
          } catch (e: any) {
            errors.push({ repo, error: e?.message || String(e) });
          }
        })
      )
    );

    return { summaries, errors };
  }
}

let multiIndexerInstance: MultiRepoIndexer | null = null;
export function getMultiRepoIndexer(): MultiRepoIndexer {
  if (!multiIndexerInstance) multiIndexerInstance = new MultiRepoIndexer();
  return multiIndexerInstance;
}

export default MultiRepoIndexer;
