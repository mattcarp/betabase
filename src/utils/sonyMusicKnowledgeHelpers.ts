const SONY_JIRA_BASE = (
  process.env.JIRA_BASE_URL || "https://jira.smedigitalapps.com/jira"
).replace(/\/$/, "");
const SONY_CONFLUENCE_BASE = (
  process.env.CONFLUENCE_BASE_URL || "https://wiki.smedigitalapps.com"
).replace(/\/$/, "");
const AOMA_STAGE_BASE = (process.env.AOMA_STAGE_URL || "https://aoma-stage.smcdp-de.net").replace(
  /\/$/,
  ""
);

export function buildJiraIssueUrl(issueKey: string): string {
  return `${SONY_JIRA_BASE}/browse/${issueKey}`;
}

export function normalizeConfluenceUrl(pathOrUrl: string): string {
  try {
    const url = new URL(pathOrUrl, SONY_CONFLUENCE_BASE);
    return url.toString();
  } catch {
    const path = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
    return `${SONY_CONFLUENCE_BASE}${path}`;
  }
}

export function isAomaContent(text: string): boolean {
  const hay = (text || "").toLowerCase();
  return [
    "aoma",
    "asset management",
    "digital asset",
    "metadata",
    "workflow",
    "media batch converter",
  ].some((k) => hay.includes(k));
}

export function isUsmContent(text: string): boolean {
  const hay = (text || "").toLowerCase();
  return ["usm", "universal service management"].some((k) => hay.includes(k));
}

export function classifyProject(text: string): "AOMA" | "USM" | "TECH" | "API" | "UNKNOWN" {
  const hay = (text || "").toLowerCase();
  if (hay.includes("aoma")) return "AOMA";
  if (hay.includes("usm")) return "USM";
  if (hay.includes("api")) return "API";
  if (hay.includes("tech") || hay.includes("infrastructure")) return "TECH";
  return "UNKNOWN";
}

export function buildAomaStageUrl(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  try {
    const url = new URL(p, AOMA_STAGE_BASE);
    return url.toString();
  } catch {
    return `${AOMA_STAGE_BASE}${p}`;
  }
}

export function sonyTagsFromText(text: string): string[] {
  const tags = new Set<string>();
  if (isAomaContent(text)) tags.add("AOMA");
  if (isUsmContent(text)) tags.add("USM");
  if ((text || "").toLowerCase().includes("sony")) tags.add("SONY_MUSIC");
  return Array.from(tags);
}

export default {
  buildJiraIssueUrl,
  normalizeConfluenceUrl,
  buildAomaStageUrl,
  classifyProject,
  isAomaContent,
  isUsmContent,
  sonyTagsFromText,
};
