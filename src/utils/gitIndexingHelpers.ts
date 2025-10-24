// import fs from "fs";
import fsp from "fs/promises";
import path from "path";

export interface IndexingConfig {
  includeExtensions: string[];
  excludePatterns: string[];
  maxFileSizeBytes: number;
  includeReadme: boolean;
}

export interface DiscoveredFile {
  absolutePath: string;
  relativePath: string;
  sizeBytes: number;
  mtimeMs: number;
}

export function getDefaultIndexingConfig(): IndexingConfig {
  const ext = (process.env.GIT_FILE_EXTENSIONS || ".ts,.js,.tsx,.jsx,.md,.json,.yml,.yaml")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const exclude = (process.env.GIT_EXCLUDE_PATTERNS || "node_modules,dist,build,.git,.next")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const maxSize = parseInt(process.env.GIT_MAX_FILE_SIZE || "102400", 10);
  const includeReadme = (process.env.GIT_INCLUDE_README || "true").toLowerCase() === "true";
  return {
    includeExtensions: ext,
    excludePatterns: exclude,
    maxFileSizeBytes: Number.isFinite(maxSize) ? maxSize : 102400,
    includeReadme,
  };
}

export function pathMatchesExclude(relativePath: string, excludePatterns: string[]): boolean {
  const lower = relativePath.replace(/\\/g, "/").toLowerCase();
  return excludePatterns.some((pattern) => lower.includes(pattern.toLowerCase()));
}

export function hasAllowedExtension(filePath: string, includeExtensions: string[]): boolean {
  const ext = path.extname(filePath).toLowerCase();
  return includeExtensions.includes(ext);
}

export async function isBinaryFile(filePath: string): Promise<boolean> {
  // Heuristic: read first 1KB and check for non-text bytes
  try {
    const fd = await fsp.open(filePath, "r");
    const buffer = Buffer.alloc(1024);
    const { bytesRead } = await fd.read(buffer, 0, 1024, 0);
    await fd.close();
    for (let i = 0; i < bytesRead; i++) {
      const byte = buffer[i];
      if (byte === 0) return true; // null byte
    }
    return false;
  } catch {
    return true;
  }
}

export async function scanRepository(
  repoRoot: string,
  config: IndexingConfig = getDefaultIndexingConfig()
): Promise<DiscoveredFile[]> {
  const results: DiscoveredFile[] = [];
  const root = path.resolve(repoRoot);

  async function walk(currentDir: string) {
    const entries = await fsp.readdir(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const abs = path.join(currentDir, entry.name);
      const rel = path.relative(root, abs);

      if (pathMatchesExclude(rel, config.excludePatterns)) continue;

      if (entry.isDirectory()) {
        await walk(abs);
        continue;
      }

      if (!hasAllowedExtension(abs, config.includeExtensions)) {
        // Allow READMEs regardless of extension when enabled
        const base = path.basename(abs).toLowerCase();
        if (!(config.includeReadme && base.startsWith("readme"))) continue;
      }

      try {
        const stat = await fsp.stat(abs);
        if (!stat.isFile()) continue;
        if (stat.size > config.maxFileSizeBytes) continue;
        if (await isBinaryFile(abs)) continue;

        results.push({
          absolutePath: abs,
          relativePath: rel,
          sizeBytes: stat.size,
          mtimeMs: stat.mtimeMs,
        });
      } catch {
        // skip unreadable entries
      }
    }
  }

  await walk(root);
  return results;
}

export async function readTextFileSafe(filePath: string): Promise<string | null> {
  try {
    const content = await fsp.readFile(filePath, "utf8");
    return content;
  } catch {
    return null;
  }
}

export function chunkContent(content: string, maxChars = 3000, overlap = 200): string[] {
  if (content.length <= maxChars) return [content];
  const chunks: string[] = [];
  let start = 0;
  while (start < content.length) {
    const end = Math.min(start + maxChars, content.length);
    chunks.push(content.slice(start, end));
    if (end === content.length) break;
    start = end - overlap;
    if (start < 0) start = 0;
  }
  return chunks;
}

export function classifyFile(relativePath: string): string {
  const p = relativePath.replace(/\\/g, "/").toLowerCase();
  if (p.includes("/app/") || p.includes("/pages/")) return "page";
  if (p.includes("/components/")) return "component";
  if (p.includes("/hooks/")) return "hook";
  if (p.includes("/lib/") || p.includes("/utils/")) return "utility";
  if (p.endsWith(".md")) return "documentation";
  if (p.endsWith(".json") || p.endsWith(".yml") || p.endsWith(".yaml")) return "config";
  return "source";
}

export function normalizeRepoName(repoPath: string): string {
  return path.basename(path.resolve(repoPath));
}
