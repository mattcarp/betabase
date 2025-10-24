// Lightweight helpers for Confluence content processing

export function storageToMarkdown(storageHtml: string): string {
  if (!storageHtml) return "";
  // Remove scripts/styles
  let html = storageHtml
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "");
  // Replace common block elements with newlines
  html = html.replace(/\s*<\/(p|div|h[1-6]|li|ul|ol|br|hr)>\s*/gi, "\n");
  // Bold/italic/underline
  html = html.replace(/<b>([\s\S]*?)<\/b>/gi, "**$1**");
  html = html.replace(/<strong>([\s\S]*?)<\/strong>/gi, "**$1**");
  html = html.replace(/<i>([\s\S]*?)<\/i>/gi, "*$1*");
  html = html.replace(/<em>([\s\S]*?)<\/em>/gi, "*$1*");
  // Headers
  html = html.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, "# $1\n\n");
  html = html.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, "## $1\n\n");
  html = html.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, "### $1\n\n");
  html = html.replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, "#### $1\n\n");
  html = html.replace(/<h5[^>]*>([\s\S]*?)<\/h5>/gi, "##### $1\n\n");
  html = html.replace(/<h6[^>]*>([\s\S]*?)<\/h6>/gi, "###### $1\n\n");
  // Links
  html = html.replace(/<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, "[$2]($1)");
  // Images
  html = html.replace(/<img[^>]*src="([^"]+)"[^>]*alt="([^"]*)"[^>]*\/>/gi, "![$2]($1)");
  // List items
  html = html.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, "- $1\n");
  // Strip remaining tags
  html = html.replace(/<[^>]+>/g, "");
  // Collapse excessive blank lines
  const markdown = html.replace(/\n{3,}/g, "\n\n").trim();
  return markdown;
}

export function extractLabels(metadata: any): string[] {
  const results = metadata?.labels?.results;
  if (!Array.isArray(results)) return [];
  return results.map((r: any) => r?.name).filter(Boolean);
}

export function buildPageUrl(baseUrl: string, pageId: string | number): string {
  const base = (baseUrl || "").replace(/\/$/, "");
  return `${base}/wiki/pages/${pageId}`;
}

export function buildSourceId(
  pageId: string | number,
  version?: { number?: number } | number
): string {
  const ver = typeof version === "number" ? version : (version?.number ?? 1);
  return `${pageId}-${ver}`;
}

export function normalizeLinks(markdown: string, baseUrl: string): string {
  if (!markdown) return "";
  const base = (baseUrl || "").replace(/\/$/, "");
  // Normalize Confluence relative links like (/wiki/...) or (/spaces/...)
  return markdown
    .replace(/\]\((\/wiki[^\)]*)\)/g, (_, path) => `](${base}${path})`)
    .replace(/\]\((\/spaces[^\)]*)\)/g, (_, path) => `](${base}${path})`);
}

const confluenceHelpers = {
  storageToMarkdown,
  extractLabels,
  buildPageUrl,
  buildSourceId,
  normalizeLinks,
};

export default confluenceHelpers;
