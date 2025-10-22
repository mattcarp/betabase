import path from "path";
import { chunkContent, classifyFile, readTextFileSafe } from "@/src/utils/gitIndexingHelpers";

export interface AnalyzedChunk {
  content: string;
  sourceType: "git";
  sourceId: string;
  metadata: Record<string, any>;
}

export interface FileAnalysisResult {
  filePath: string;
  relativePath: string;
  chunks: AnalyzedChunk[];
  summary: string;
}

export class CodeStructureAnalyzer {
  analyzeImportsExports(source: string): { imports: string[]; exports: string[] } {
    const importRegex = /import\s+[^;]+?from\s+['"]([^'"]+)['"]/g;
    const sideEffectImportRegex = /import\s+['"]([^'"]+)['"]/g;
    const exportNamedListRegex = /export\s*\{\s*([^}]+)\s*\}/g;
    const exportFromRegex = /export\s*\{[^}]*\}\s*from\s*['"]([^'"]+)['"]/g;
    const exportAllFromRegex = /export\s*\*\s*from\s*['"]([^'"]+)['"]/g;
    const exportRegex =
      /export\s+(?:default\s+)?(?:class|function|const|let|var|interface|type)\s+([A-Za-z0-9_]+)/g;
    const imports = new Set<string>();
    const exports = new Set<string>();

    let match: RegExpExecArray | null;
    while ((match = importRegex.exec(source))) {
      imports.add(match[1]);
    }
    while ((match = sideEffectImportRegex.exec(source))) {
      imports.add(match[1]);
    }
    while ((match = exportFromRegex.exec(source))) {
      imports.add(match[1]);
    }
    while ((match = exportAllFromRegex.exec(source))) {
      imports.add(match[1]);
    }
    while ((match = exportRegex.exec(source))) {
      exports.add(match[1]);
    }
    while ((match = exportNamedListRegex.exec(source))) {
      const names = match[1]
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .map((s) => s.replace(/\sas\s+\w+$/, ""));
      names.forEach((n) => exports.add(n));
    }
    return { imports: Array.from(imports), exports: Array.from(exports) };
  }

  analyzeFunctionsClasses(source: string): { functions: string[]; classes: string[] } {
    const fnRegex = /function\s+([A-Za-z0-9_]+)/g;
    const arrowFnRegex = /const\s+([A-Za-z0-9_]+)\s*=\s*\(/g;
    const classRegex = /class\s+([A-Za-z0-9_]+)/g;
    const functions = new Set<string>();
    const classes = new Set<string>();

    let match: RegExpExecArray | null;
    while ((match = fnRegex.exec(source))) functions.add(match[1]);
    while ((match = arrowFnRegex.exec(source))) functions.add(match[1]);
    while ((match = classRegex.exec(source))) classes.add(match[1]);
    return { functions: Array.from(functions), classes: Array.from(classes) };
  }

  buildSummary(
    relativePath: string,
    language: string,
    imports: string[],
    exports: string[],
    functions: string[],
    classes: string[]
  ): string {
    return [
      `File: ${relativePath}`,
      `Language: ${language}`,
      imports.length ? `Imports: ${imports.slice(0, 10).join(", ")}` : "Imports: none",
      exports.length ? `Exports: ${exports.join(", ")}` : "Exports: none",
      functions.length ? `Functions: ${functions.slice(0, 10).join(", ")}` : "Functions: none",
      classes.length ? `Classes: ${classes.join(", ")}` : "Classes: none",
    ].join("\n");
  }

  detectLanguage(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    if (ext === ".ts" || ext === ".tsx") return "TypeScript";
    if (ext === ".js" || ext === ".jsx") return "JavaScript";
    if (ext === ".md") return "Markdown";
    if (ext === ".json") return "JSON";
    if (ext === ".yml" || ext === ".yaml") return "YAML";
    return ext.replace(".", "").toUpperCase() || "Unknown";
  }

  async analyzeFile(
    repoRoot: string,
    absolutePath: string,
    relativePath: string,
    repositoryTag: string
  ): Promise<FileAnalysisResult | null> {
    const content = await readTextFileSafe(absolutePath);
    if (!content) return null;

    const { imports, exports } = this.analyzeImportsExports(content);
    const { functions, classes } = this.analyzeFunctionsClasses(content);
    const language = this.detectLanguage(absolutePath);
    const classification = classifyFile(relativePath);
    const summary = this.buildSummary(relativePath, language, imports, exports, functions, classes);

    const linesOfCode = content.split(/\r?\n/).length;
    const dependencyCount = imports.length;

    const chunks = chunkContent(content).map((chunk, idx) => {
      const sourceId = `${repositoryTag}:${relativePath}#${idx}`;
      const metadata = {
        repository: repositoryTag,
        repo_path: repoRoot,
        file_path: relativePath,
        language,
        classification,
        imports,
        exports,
        functions,
        classes,
        chunk_index: idx,
        summary,
        loc: linesOfCode,
        dependency_count: dependencyCount,
        vectorizedAt: new Date().toISOString(),
      };
      return { content: chunk, sourceType: "git" as const, sourceId, metadata };
    });

    return { filePath: absolutePath, relativePath, chunks, summary };
  }
}

let analyzerInstance: CodeStructureAnalyzer | null = null;
export function getCodeStructureAnalyzer(): CodeStructureAnalyzer {
  if (!analyzerInstance) analyzerInstance = new CodeStructureAnalyzer();
  return analyzerInstance;
}

export default CodeStructureAnalyzer;
