/**
 * Motiff MCP Bridge Service
 *
 * Creates a Model Context Protocol server that bridges between Motiff's design API
 * and SIAM's development environment. This service:
 * 1. Connects to Motiff's design data API
 * 2. Processes design frames into component definitions
 * 3. Generates React components for Storybook
 * 4. Manages design-to-code synchronization
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import { ComponentGenerator as BaseComponentGenerator } from "../tools/component-generator.js";

// Types for Motiff design data
interface MotiffFrame {
  id: string;
  name: string;
  htmlContent: string;
  styles: DesignStyles;
  assets: DesignAssets;
  metadata: FrameMetadata;
}

interface DesignStyles {
  colors: Record<string, string>;
  typography: Typography[];
  spacing: Record<string, string>;
  components: ComponentStyle[];
}

interface DesignAssets {
  images: ImageAsset[];
  icons: IconAsset[];
  fonts: FontAsset[];
}

interface FrameMetadata {
  width: number;
  height: number;
  createdAt: string;
  updatedAt: string;
  version: string;
}

interface ComponentDefinition {
  name: string;
  props: ComponentProps;
  structure: ComponentStructure;
  styles: ComponentStyles;
  assets: ComponentAssets;
}

// Schema definitions for MCP tools
const DesignFrameSchema = z.object({
  frameUrl: z.string().url(),
  componentName: z.string().optional(),
  outputPath: z.string().optional(),
});

const GenerateComponentSchema = z.object({
  frameId: z.string(),
  componentName: z.string(),
  includeStory: z.boolean().default(true),
  includeTests: z.boolean().default(true),
});

const SyncDesignSchema = z.object({
  frameId: z.string(),
  forceUpdate: z.boolean().default(false),
});

export class MotiffMCPBridge {
  private server: McpServer;
  private transport!: StdioServerTransport | StreamableHTTPServerTransport;
  private motiffAPI: MotiffAPI;

  constructor() {
    this.server = new McpServer(
      {
        name: "motiff-design-bridge",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
          resources: {},
        },
      }
    );

    // Initialize Motiff API with configuration
    const apiKey = process.env.MOTIFF_API_KEY || "";
    const baseUrl = process.env.MOTIFF_API_BASE_URL || "https://api.motiff.com";
    this.motiffAPI = new MotiffAPI(apiKey, baseUrl);

    this.registerTools();
    this.registerResources();
  }

  private registerTools() {
    // Tool: Import Design Frame
    this.server.setRequestHandler(
      { method: "tools/call", params: { name: "import-design-frame" } },
      async (request) => {
        const { frameUrl, componentName, outputPath } = DesignFrameSchema.parse(
          request.params.arguments
        );

        try {
          const frameData = await this.motiffAPI.getFrameData(frameUrl);
          const component = await this.processDesignFrame(frameData, componentName);
          const result = await this.generateComponent(component, outputPath);

          return {
            content: [
              {
                type: "text",
                text: `Successfully imported design frame "${frameData.name}" as React component.`,
              },
              {
                type: "text",
                text: `Generated files:\n${result.files.map((f) => `- ${f.path}`).join("\n")}`,
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `Error importing design frame: ${error.message}`,
              },
            ],
            isError: true,
          };
        }
      }
    );

    // Tool: Generate Component from Design
    this.server.setRequestHandler(
      { method: "tools/call", params: { name: "generate-component" } },
      async (request) => {
        const { frameId, componentName, includeStory, includeTests } =
          GenerateComponentSchema.parse(request.params.arguments);

        try {
          const frameData = await this.motiffAPI.getFrameById(frameId);
          const componentDef = await this.processDesignFrame(frameData, componentName);

          const generator = new ComponentGenerator();
          const result = await generator.generateComponent(componentDef, {
            includeStory,
            includeTests,
          });

          return {
            content: [
              {
                type: "text",
                text: `Generated React component "${componentName}" from Motiff design.`,
              },
              {
                type: "text",
                text: `Component files:\n${result.files.map((f) => `- ${f.path}`).join("\n")}`,
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `Error generating component: ${error.message}`,
              },
            ],
            isError: true,
          };
        }
      }
    );

    // Tool: Sync Design Changes
    this.server.setRequestHandler(
      { method: "tools/call", params: { name: "sync-design" } },
      async (request) => {
        const { frameId, forceUpdate } = SyncDesignSchema.parse(request.params.arguments);

        try {
          const syncResult = await this.syncDesignChanges(frameId, forceUpdate);

          return {
            content: [
              {
                type: "text",
                text: `Design sync completed for frame ${frameId}.`,
              },
              {
                type: "text",
                text: `Changes detected: ${syncResult.changes.length}`,
              },
              {
                type: "text",
                text: `Files updated: ${syncResult.updatedFiles.length}`,
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `Error syncing design: ${error.message}`,
              },
            ],
            isError: true,
          };
        }
      }
    );
  }

  private registerResources() {
    // Resource: Design Frames List
    this.server.setRequestHandler(
      { method: "resources/read", params: { uri: "motiff://frames" } },
      async () => {
        try {
          const frames = await this.motiffAPI.listFrames();

          return {
            contents: [
              {
                uri: "motiff://frames",
                mimeType: "application/json",
                text: JSON.stringify(frames, null, 2),
              },
            ],
          };
        } catch (error) {
          throw new Error(`Failed to fetch frames: ${error.message}`);
        }
      }
    );

    // Resource: Design System Tokens
    this.server.setRequestHandler(
      { method: "resources/read", params: { uri: "motiff://design-tokens" } },
      async () => {
        try {
          const tokens = await this.motiffAPI.getDesignTokens();

          return {
            contents: [
              {
                uri: "motiff://design-tokens",
                mimeType: "application/json",
                text: JSON.stringify(tokens, null, 2),
              },
            ],
          };
        } catch (error) {
          throw new Error(`Failed to fetch design tokens: ${error.message}`);
        }
      }
    );
  }

  private async processDesignFrame(
    frameData: MotiffFrame,
    componentName?: string
  ): Promise<ComponentDefinition> {
    const processor = new DesignProcessor();
    return await processor.processFrame(frameData, componentName);
  }

  private async generateComponent(
    definition: ComponentDefinition,
    outputPath?: string
  ): Promise<GenerationResult> {
    const generator = new ComponentGenerator();
    return await generator.generateComponent(definition, { outputPath });
  }

  private async syncDesignChanges(frameId: string, forceUpdate: boolean): Promise<SyncResult> {
    const syncer = new DesignSyncer();
    return await syncer.syncFrame(frameId, { forceUpdate });
  }

  async startServer(transport: "stdio" | "http" = "stdio", port = 3000) {
    if (transport === "stdio") {
      this.transport = new StdioServerTransport();
    } else {
      this.transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => crypto.randomUUID(),
      });
    }

    await this.server.connect(this.transport);

    if (transport === "stdio") {
      console.log("Motiff MCP Bridge server started on stdio");
    } else {
      console.log(`Motiff MCP Bridge server started on port ${port}`);
    }
  }

  async stop() {
    await this.server.close();
    await this.transport.close();
  }
}

// Supporting classes
class MotiffAPI {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, baseUrl: string = "https://api.motiff.com") {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  async getFrameData(frameUrl: string): Promise<MotiffFrame> {
    try {
      const frameId = this.extractFrameId(frameUrl);
      const response = await fetch(`${this.baseUrl}/v1/frames/${frameId}`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch frame data: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        id: data.id,
        name: data.name,
        html: data.html || "",
        metadata: {
          width: data.width || 0,
          height: data.height || 0,
          createdAt: data.created_at || new Date().toISOString(),
          updatedAt: data.updated_at || new Date().toISOString(),
          version: data.version || "1.0.0",
        },
      };
    } catch (error) {
      console.error("Error fetching frame data:", error);
      throw error;
    }
  }

  async getFrameById(frameId: string): Promise<MotiffFrame> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/frames/${frameId}`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch frame: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        id: data.id,
        name: data.name,
        html: data.html || "",
        metadata: {
          width: data.width || 0,
          height: data.height || 0,
          createdAt: data.created_at || new Date().toISOString(),
          updatedAt: data.updated_at || new Date().toISOString(),
          version: data.version || "1.0.0",
        },
      };
    } catch (error) {
      console.error("Error fetching frame by ID:", error);
      throw error;
    }
  }

  async listFrames(): Promise<MotiffFrame[]> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/frames`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to list frames: ${response.statusText}`);
      }

      const data = await response.json();
      return (
        data.frames?.map((frame: any) => ({
          id: frame.id,
          name: frame.name,
          html: frame.html || "",
          metadata: {
            width: frame.width || 0,
            height: frame.height || 0,
            createdAt: frame.created_at || new Date().toISOString(),
            updatedAt: frame.updated_at || new Date().toISOString(),
            version: frame.version || "1.0.0",
          },
        })) || []
      );
    } catch (error) {
      console.error("Error listing frames:", error);
      return [];
    }
  }

  async getDesignTokens(): Promise<DesignTokens> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/design-tokens`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch design tokens: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        colors: data.colors || {},
        typography: data.typography || {},
        spacing: data.spacing || {},
        shadows: data.shadows || {},
        borderRadius: data.borderRadius || {},
      };
    } catch (error) {
      console.error("Error fetching design tokens:", error);
      return {
        colors: {},
        typography: {},
        spacing: {},
        shadows: {},
        borderRadius: {},
      };
    }
  }

  async exportFrameAsHTML(frameUrl: string): Promise<string> {
    try {
      const frameId = this.extractFrameId(frameUrl);
      const response = await fetch(`${this.baseUrl}/v1/frames/${frameId}/export/html`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          format: "html",
          options: {
            includeStyles: true,
            useRelativeUnits: false,
            optimizeForLLM: true,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to export frame as HTML: ${response.statusText}`);
      }

      const data = await response.json();
      return data.html || "";
    } catch (error) {
      console.error("Error exporting frame as HTML:", error);
      throw error;
    }
  }

  private extractFrameId(frameUrl: string): string {
    // Extract frame ID from Motiff URL
    // Example: https://motiff.com/design/project/frame/12345
    const urlParts = frameUrl.split("/");
    const frameIndex = urlParts.indexOf("frame");
    if (frameIndex !== -1 && frameIndex < urlParts.length - 1) {
      return urlParts[frameIndex + 1];
    }

    // Fallback: try to extract from hash or query params
    const url = new URL(frameUrl);
    const hashParams = new URLSearchParams(url.hash.slice(1));
    const frameId = hashParams.get("frame") || url.searchParams.get("frame");

    if (!frameId) {
      throw new Error(`Could not extract frame ID from URL: ${frameUrl}`);
    }

    return frameId;
  }
}

class DesignProcessor {
  async processFrame(frameData: MotiffFrame, componentName?: string): Promise<ComponentDefinition> {
    try {
      const name = componentName || this.generateComponentName(frameData.name);
      const htmlContent = frameData.html;

      // Parse HTML to extract structure and styles
      const { structure, styles, assets } = this.parseHTML(htmlContent);

      // Extract props from the structure
      const props = this.extractProps(structure);

      return {
        name,
        props,
        structure,
        styles,
        assets,
      };
    } catch (error) {
      console.error("Error processing frame:", error);
      throw error;
    }
  }

  private generateComponentName(frameName: string): string {
    // Convert frame name to PascalCase component name
    return frameName
      .replace(/[^a-zA-Z0-9\s]/g, "")
      .split(/\s+/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join("");
  }

  private parseHTML(html: string): {
    structure: ComponentStructure;
    styles: ComponentStyles;
    assets: ComponentAssets;
  } {
    // Create a simple HTML parser using DOM
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const body = doc.body;

    // Extract structure
    const structure = this.extractStructure(body);

    // Extract styles
    const styles = this.extractStyles(doc);

    // Extract assets
    const assets = this.extractAssets(doc);

    return { structure, styles, assets };
  }

  private extractStructure(element: Element): ComponentStructure {
    const children: ComponentStructure[] = [];

    // Process child elements
    for (const child of element.children) {
      if (child.nodeType === Node.ELEMENT_NODE) {
        children.push(this.extractStructure(child));
      }
    }

    // Extract text content
    const textContent = Array.from(element.childNodes)
      .filter((node) => node.nodeType === Node.TEXT_NODE)
      .map((node) => node.textContent?.trim())
      .filter((text) => text && text.length > 0)
      .join(" ");

    return {
      tag: element.tagName.toLowerCase(),
      props: this.extractElementProps(element),
      children: children.length > 0 ? children : undefined,
      text: textContent || undefined,
    };
  }

  private extractElementProps(element: Element): Record<string, any> {
    const props: Record<string, any> = {};

    // Extract className
    if (element.className) {
      props.className = element.className;
    }

    // Extract common HTML attributes
    const attrs = ["id", "src", "alt", "href", "title", "placeholder", "value", "type"];
    for (const attr of attrs) {
      const value = element.getAttribute(attr);
      if (value) {
        props[attr] = value;
      }
    }

    // Extract style attribute
    if (element.getAttribute("style")) {
      props.style = element.getAttribute("style");
    }

    return props;
  }

  private extractStyles(doc: Document): ComponentStyles {
    const styles: ComponentStyles = {
      css: "",
      tailwind: {},
      cssModules: {},
    };

    // Extract inline styles from style tags
    const styleTags = doc.querySelectorAll("style");
    let cssContent = "";

    styleTags.forEach((styleTag) => {
      cssContent += styleTag.textContent || "";
    });

    styles.css = cssContent;

    // Convert CSS to Tailwind classes (simplified)
    styles.tailwind = this.convertCSSToTailwind(cssContent);

    return styles;
  }

  private extractAssets(doc: Document): ComponentAssets {
    const assets: ComponentAssets = {
      images: [],
      icons: [],
      fonts: [],
    };

    // Extract images
    const images = doc.querySelectorAll("img");
    images.forEach((img) => {
      const src = img.getAttribute("src");
      const alt = img.getAttribute("alt") || "";
      if (src) {
        assets.images.push({
          src,
          alt,
          width: img.getAttribute("width") || undefined,
          height: img.getAttribute("height") || undefined,
        });
      }
    });

    // Extract font references from CSS
    const fontFaceRegex = /@font-face\s*{[^}]*font-family:\s*['"]([^'"]+)['"][^}]*}/g;
    const cssContent = this.extractStyles(doc).css;
    let fontMatch;

    while ((fontMatch = fontFaceRegex.exec(cssContent)) !== null) {
      assets.fonts.push({
        family: fontMatch[1],
        src: "", // Extract from CSS if needed
      });
    }

    return assets;
  }

  private convertCSSToTailwind(css: string): Record<string, string> {
    const tailwindClasses: Record<string, string> = {};

    // Basic CSS to Tailwind conversion (simplified)
    const conversions = {
      "display: flex": "flex",
      "flex-direction: column": "flex-col",
      "flex-direction: row": "flex-row",
      "justify-content: center": "justify-center",
      "align-items: center": "items-center",
      "text-align: center": "text-center",
      "font-weight: bold": "font-bold",
      "font-weight: 600": "font-semibold",
      "margin: 0": "m-0",
      "padding: 0": "p-0",
    };

    Object.entries(conversions).forEach(([cssRule, tailwindClass]) => {
      if (css.includes(cssRule)) {
        tailwindClasses[cssRule] = tailwindClass;
      }
    });

    return tailwindClasses;
  }

  private extractProps(structure: ComponentStructure): ComponentProps {
    const props: ComponentProps = {};

    // Extract common props from structure
    this.findPropsInStructure(structure, props);

    return props;
  }

  private findPropsInStructure(structure: ComponentStructure, props: ComponentProps): void {
    // Look for dynamic content that should be props
    if (structure.text && structure.text.includes("{{")) {
      const propName = structure.text.match(/\{\{(\w+)\}\}/)?.[1];
      if (propName) {
        props[propName] = {
          type: "string",
          required: true,
          description: `Dynamic text content for ${propName}`,
        };
      }
    }

    // Look for image sources that should be props
    if (structure.props?.src && structure.tag === "img") {
      props.imageUrl = {
        type: "string",
        required: false,
        description: "Image source URL",
      };
    }

    // Recursively check children
    if (structure.children) {
      structure.children.forEach((child) => {
        this.findPropsInStructure(child, props);
      });
    }
  }
}

class ComponentGenerator extends BaseComponentGenerator {
  async generateComponent(
    definition: ComponentDefinition,
    options: GenerationOptions
  ): Promise<GenerationResult> {
    try {
      // Use the base generator to create the component files
      const result = await super.generateComponent(definition, options);

      return {
        files: result.files,
        errors: result.errors || [],
        warnings: result.warnings || [],
      };
    } catch (error) {
      console.error("Error generating component:", error);
      throw error;
    }
  }
}

class DesignSyncer {
  async syncFrame(frameId: string, options: SyncOptions): Promise<SyncResult> {
    // Implementation to sync design changes
    throw new Error("DesignSyncer.syncFrame not implemented");
  }
}

// Type definitions for supporting interfaces
interface GenerationOptions {
  outputPath?: string;
  includeStory?: boolean;
  includeTests?: boolean;
}

interface GenerationResult {
  files: GeneratedFile[];
  component: ComponentDefinition;
}

interface GeneratedFile {
  path: string;
  content: string;
  type: "component" | "story" | "test" | "types";
}

interface SyncOptions {
  forceUpdate: boolean;
}

interface SyncResult {
  changes: DesignChange[];
  updatedFiles: string[];
}

interface DesignChange {
  type: "style" | "structure" | "asset";
  property: string;
  oldValue: any;
  newValue: any;
}

interface DesignTokens {
  colors: Record<string, string>;
  typography: Typography[];
  spacing: Record<string, string>;
  shadows: Record<string, string>;
}

interface Typography {
  name: string;
  fontSize: string;
  fontWeight: string;
  lineHeight: string;
  letterSpacing: string;
}

interface ComponentStyle {
  selector: string;
  properties: Record<string, string>;
}

interface ComponentProps {
  [key: string]: {
    type: string;
    required: boolean;
    default?: any;
  };
}

interface ComponentStructure {
  type: string;
  props: Record<string, any>;
  children: ComponentStructure[];
}

interface ComponentStyles {
  tailwind: string[];
  css: string;
}

interface ComponentAssets {
  images: string[];
  icons: string[];
}

interface ImageAsset {
  id: string;
  url: string;
  alt: string;
  width: number;
  height: number;
}

interface IconAsset {
  id: string;
  name: string;
  svg: string;
}

interface FontAsset {
  family: string;
  weights: string[];
  url: string;
}

// Start the server if this file is run directly
if (require.main === module) {
  const bridge = new MotiffMCPBridge();
  bridge.startServer("stdio").catch(console.error);
}

export default MotiffMCPBridge;
