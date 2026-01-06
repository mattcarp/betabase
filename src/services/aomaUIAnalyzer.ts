/*
  AOMA UI Analyzer Service (deduplicated)

  - Single analyzer entrypoint: aomaUIAnalyzer.analyze(url, htmlOrPayload)
  - Accepts raw HTML or a Firecrawl-style DOM payload
  - Returns fields used by storage and embedding pipeline
*/

export interface UIElementDescriptor {
  type: string;
  text?: string;
  id?: string;
  classes?: string[];
  href?: string;
  name?: string;
  ariaLabel?: string;
  role?: string;
  selectors: {
    css?: string;
    xpath?: string;
    dataTestId?: string;
    alternatives?: string[];
  };
}

export interface UIAnalysisOutput {
  title?: string;
  elements: Record<string, any>;
  selectors: Record<string, any>;
  navigationPaths: string[];
  testableFeatures: string[];
  userFlows: Record<string, any>;
  summary: string;
}

function safeText(s: string | null | undefined): string | undefined {
  if (!s) return undefined;
  const t = s.trim().replace(/\s+/g, " ");
  return t.length ? t : undefined;
}

export class AomaUIAnalyzer {
  analyze(url: string, htmlOrPayload: unknown): UIAnalysisOutput {
    if (typeof htmlOrPayload === "string") {
      return this.analyzeFromHtml(url, htmlOrPayload);
    }
    return this.analyzeFromPayload(url, htmlOrPayload);
  }

  private analyzeFromHtml(url: string, html: string): UIAnalysisOutput {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    const title = safeText(doc.title || undefined);
    const htmlStr = doc.documentElement?.outerHTML || html;

    // Simple extraction heuristics (mirrors prior inline helper)
    const elements: Record<string, any> = {};
    const selectors: Record<string, any> = {};
    const navigationPaths: string[] = [];
    const testableFeatures: string[] = [];
    const userFlows: Record<string, any> = {};

    const buttonMatches = htmlStr.match(/<button className="mac-button"[^>]*>.*?<\/button>/gi) || [];
    elements.buttons = buttonMatches.map((btn: string) => {
      const text = btn.replace(/<[^>]*>/g, "").trim();
      const id = btn.match(/id="([^"]+)"/)?.[1];
      const className = btn.match(/class="([^"]+)"/)?.[1];
      return { text, id, className };
    });

    const linkMatches = htmlStr.match(/<a[^>]*href="([^"]+)"[^>]*>.*?<\/a>/gi) || [];
    navigationPaths.push(
      ...linkMatches
        .map((link: string) => {
          const href = link.match(/href="([^"]+)"/)?.[1] || "";
          return href;
        })
        .filter(Boolean)
    );

    const formMatches = htmlStr.match(/<form[^>]*>.*?<\/form>/gis) || [];
    elements.forms = formMatches.length;

    const inputMatches = htmlStr.match(/<input className="mac-input"[^>]*>/gi) || [];
    elements.inputs = inputMatches.map((input: string) => {
      const type = input.match(/type="([^"]+)"/)?.[1] || "text";
      const name = input.match(/name="([^"]+)"/)?.[1];
      const id = input.match(/id="([^"]+)"/)?.[1];
      return { type, name, id };
    });

    if (elements.buttons?.length > 0) testableFeatures.push("button_clicks");
    if (elements.forms > 0) testableFeatures.push("form_submission");
    if (elements.inputs?.length > 0) testableFeatures.push("text_input");
    if (navigationPaths.length > 0) testableFeatures.push("navigation");

    const summary = [
      `Title: ${title || url}`,
      `Buttons: ${elements.buttons?.length || 0}`,
      `Forms: ${elements.forms || 0}`,
      `Inputs: ${elements.inputs?.length || 0}`,
      `Links: ${navigationPaths.length}`,
    ].join(" | ");

    return {
      title,
      elements,
      selectors,
      navigationPaths: [...new Set(navigationPaths)],
      testableFeatures,
      userFlows,
      summary,
    };
  }

  private analyzeFromPayload(url: string, payload: unknown): UIAnalysisOutput {
    const doc: any = payload || {};
    const title = (doc.title as string) || undefined;

    const elements: Record<string, any> = {};
    const selectors: Record<string, any> = {};
    const navigationPaths: string[] = [];
    const testableFeatures: string[] = [];
    const userFlows: Record<string, any> = {};

    const nodes: any[] = Array.isArray(doc.nodes) ? doc.nodes : [];
    const buttonElements: any[] = [];
    const inputElements: any[] = [];
    let formCount = 0;
    for (const n of nodes) {
      const tag = (n.tagName as string)?.toLowerCase?.() ?? "";
      const role = typeof n.role === "string" ? n.role : undefined;
      if (tag === "button" || role === "button")
        buttonElements.push({ text: n.text, id: n.id, classList: n.classList });
      if (tag === "input") inputElements.push({ type: n.type, name: n.name, id: n.id });
      if (tag === "form") formCount += 1;
      const href = typeof n.href === "string" ? n.href : undefined;
      if ((tag === "a" || role === "link") && href) navigationPaths.push(href);
    }
    elements.buttons = buttonElements;
    elements.inputs = inputElements;
    elements.forms = formCount;

    if (buttonElements.length > 0) testableFeatures.push("button_clicks");
    if (formCount > 0) testableFeatures.push("form_submission");
    if (inputElements.length > 0) testableFeatures.push("text_input");
    if (navigationPaths.length > 0) testableFeatures.push("navigation");

    const summary = [
      `Title: ${title || url}`,
      `Buttons: ${buttonElements.length}`,
      `Forms: ${formCount}`,
      `Inputs: ${inputElements.length}`,
      `Links: ${navigationPaths.length}`,
    ].join(" | ");

    return {
      title,
      elements,
      selectors,
      navigationPaths: [...new Set(navigationPaths)],
      testableFeatures,
      userFlows,
      summary,
    };
  }
}

export const aomaUIAnalyzer = new AomaUIAnalyzer();
