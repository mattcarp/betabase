/**
 * AOMA Content Aggregator Service
 *
 * Queries the AOMA MCP server for various content sources and aggregates them
 * into a prioritized daily digest with relevance scoring.
 */

export interface DigestItem {
  id: string;
  title: string;
  description: string;
  content: string;
  url?: string;
  source: "knowledge-base" | "jira" | "confluence" | "trending-tags";
  score: number;
  timestamp: Date;
  tags: string[];
  metadata: {
    author?: string;
    project?: string;
    priority?: "low" | "medium" | "high" | "critical";
    confidence?: number;
  };
}

interface KnowledgeBaseDelta {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
  tags: string[];
  author: string;
  changeType: "added" | "updated" | "deleted";
}

interface JiraUpdate {
  id: string;
  key: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  project: string;
  updatedAt: string;
  assignee?: string;
  labels: string[];
}

interface ConfluenceUpdate {
  id: string;
  title: string;
  content: string;
  spaceKey: string;
  updatedAt: string;
  author: string;
  labels: string[];
  url: string;
}

interface TrendingTag {
  tag: string;
  count: number;
  trend: "rising" | "stable" | "declining";
  relatedItems: Array<{
    id: string;
    title: string;
    source: string;
  }>;
}

export interface AomaContentAggregatorConfig {
  serverUrl: string;
  rpcUrl: string;
  healthUrl: string;
  enableAutoQuery: boolean;
  queryTimeout: number;
  maxItems: number;
  keywords: string[];
  scoringWeights: {
    keyword: number;
    freshness: number;
    priority: number;
    tags: number;
  };
}

export class AomaContentAggregator {
  private config: AomaContentAggregatorConfig;
  private healthyStatus = false;
  private lastHealthCheck = 0;
  private readonly HEALTH_CHECK_INTERVAL = 30000; // 30 seconds

  // High-priority keywords for enhanced scoring
  private readonly HIGH_PRIORITY_KEYWORDS = [
    "critical",
    "urgent",
    "security",
    "production",
    "outage",
    "performance",
    "bug",
    "vulnerability",
    "release",
    "deployment",
  ];

  constructor(config?: Partial<AomaContentAggregatorConfig>) {
    // Handle import.meta.env availability (not available in Node.js tests)
    const getEnvVar = (
      key: string,
      defaultValue: string | boolean | number
    ): string | boolean | number => {
      try {
        return process.env[`NEXT_PUBLIC_${key}`] ?? process.env[key] ?? defaultValue;
      } catch {
        return defaultValue;
      }
    };

    this.config = {
      serverUrl: getEnvVar(
        "NEXT_PUBLIC_AOMA_MESH_SERVER_URL",
        "https://luminous-dedication-production.up.railway.app"
      ) as string,
      rpcUrl: getEnvVar(
        "NEXT_PUBLIC_AOMA_MESH_RPC_URL",
        "https://luminous-dedication-production.up.railway.app/rpc"
      ) as string,
      healthUrl: getEnvVar(
        "NEXT_PUBLIC_AOMA_MESH_HEALTH_URL",
        "https://luminous-dedication-production.up.railway.app/health"
      ) as string,
      enableAutoQuery: getEnvVar("NEXT_PUBLIC_ENABLE_MCP_INTEGRATION", true) !== "false",
      queryTimeout: 10000,
      maxItems: 50,
      keywords: [
        "aoma",
        "asset management",
        "digital asset",
        "workflow",
        "metadata",
        "sony music",
        "universal service management",
        "usm",
        "content delivery",
        "api",
        "integration",
        "authentication",
        "performance",
      ],
      scoringWeights: {
        keyword: 0.3,
        freshness: 0.4,
        priority: 0.2,
        tags: 0.1,
      },
      ...config,
    };

    // Start health monitoring if enabled
    if (this.config.enableAutoQuery) {
      this.startHealthMonitoring();
    }
  }

  /**
   * Query the AOMA MCP server using the established pattern
   */
  private async queryMcp(toolName: string, args: any): Promise<any> {
    try {
      const response = await fetch(this.config.rpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(this.config.queryTimeout),
        body: JSON.stringify({
          method: "tools/call",
          params: {
            name: toolName,
            arguments: args,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`MCP query failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(`AOMA MCP error: ${data.error.message}`);
      }

      if (!data.result?.content?.[0]?.text) {
        return null;
      }

      return JSON.parse(data.result.content[0].text);
    } catch (error) {
      console.error(`AOMA MCP query failed for ${toolName}:`, error);
      return null;
    }
  }

  /**
   * Query latest knowledge-base deltas
   */
  private async queryKnowledgeBaseDeltas(): Promise<KnowledgeBaseDelta[]> {
    const result = await this.queryMcp("get_knowledge_base_deltas", {
      sinceHours: 24,
      maxResults: this.config.maxItems,
    });

    return result?.deltas || [];
  }

  /**
   * Query Jira/Confluence tech updates
   */
  private async queryJiraConfluenceUpdates(): Promise<{
    jira: JiraUpdate[];
    confluence: ConfluenceUpdate[];
  }> {
    const [jiraResult, confluenceResult] = await Promise.all([
      this.queryMcp("get_jira_tech_updates", {
        sinceHours: 24,
        projects: ["AOMA", "USM", "TECH", "API"],
        baseUrl: "https://jira.smedigitalapps.com/jira",
        maxResults: this.config.maxItems,
      }),
      this.queryMcp("get_confluence_tech_updates", {
        sinceHours: 24,
        spaces: ["AOMA", "USM", "TECH", "API", "RELEASE"],
        baseUrl: "https://wiki.smedigitalapps.com",
        maxResults: this.config.maxItems,
      }),
    ]);

    return {
      jira: jiraResult?.updates || [],
      confluence: confluenceResult?.updates || [],
    };
  }

  /**
   * Query trending tags
   */
  private async queryTrendingTags(): Promise<TrendingTag[]> {
    const result = await this.queryMcp("get_trending_tags", {
      timeframe: "24h",
      minCount: 3,
      maxResults: 20,
    });

    return result?.trendingTags || [];
  }

  /**
   * Calculate relevance score for an item
   */
  private calculateRelevanceScore(item: any, source: DigestItem["source"]): number {
    let score = 0;
    const weights = this.config.scoringWeights;

    // Keyword matching score
    const text = `${item.title} ${item.description || item.content || ""}`.toLowerCase();
    const keywordMatches = this.config.keywords.filter((keyword) =>
      text.includes(keyword.toLowerCase())
    ).length;
    const highPriorityMatches = this.HIGH_PRIORITY_KEYWORDS.filter((keyword) =>
      text.includes(keyword.toLowerCase())
    ).length;

    const keywordScore = keywordMatches / this.config.keywords.length + highPriorityMatches * 0.5; // Bonus for high-priority keywords
    score += keywordScore * weights.keyword;

    // Freshness score (recent content gets higher score)
    const updatedAt = new Date(item.updatedAt || item.timestamp || Date.now());
    const hoursSinceUpdate = (Date.now() - updatedAt.getTime()) / (1000 * 60 * 60);
    const freshnessScore = Math.max(0, 1 - hoursSinceUpdate / 24); // Decay over 24 hours
    score += freshnessScore * weights.freshness;

    // Priority score (for Jira items)
    if (item.priority) {
      const priorityMap = { critical: 1, high: 0.8, medium: 0.5, low: 0.2 };
      const priorityScore =
        priorityMap[item.priority.toLowerCase() as keyof typeof priorityMap] || 0;
      score += priorityScore * weights.priority;
    }

    // Tags score (more relevant tags = higher score)
    if (item.tags || item.labels) {
      const tags = item.tags || item.labels || [];
      const relevantTags = tags.filter((tag: string) =>
        this.config.keywords.some((keyword) => tag.toLowerCase().includes(keyword.toLowerCase()))
      );
      const tagsScore = relevantTags.length / Math.max(tags.length, 1);
      score += tagsScore * weights.tags;
    }

    return Math.min(score, 1); // Cap at 1.0
  }

  /**
   * Convert various content types to DigestItem format
   */
  private convertToDigestItem(item: any, source: DigestItem["source"]): DigestItem {
    const baseItem = {
      id: item.id || item.key || `${source}-${Date.now()}`,
      source,
      timestamp: new Date(item.updatedAt || item.timestamp || Date.now()),
      tags: item.tags || item.labels || [],
      metadata: {},
    };

    switch (source) {
      case "knowledge-base":
        return {
          ...baseItem,
          title: item.title,
          description: `Knowledge base ${item.changeType}: ${item.title}`,
          content: item.content,
          score: this.calculateRelevanceScore(item, source),
          metadata: {
            author: item.author,
            confidence: 0.9, // High confidence for knowledge base
          },
        };

      case "jira":
        return {
          ...baseItem,
          title: `[${item.key}] ${item.title}`,
          description: item.description,
          content: item.description,
          url: `${this.config.serverUrl}/browse/${item.key}`,
          score: this.calculateRelevanceScore(item, source),
          metadata: {
            project: item.project,
            priority: item.priority?.toLowerCase() as any,
            confidence: 0.8,
          },
        };

      case "confluence":
        return {
          ...baseItem,
          title: item.title,
          description: `Updated in ${item.spaceKey}: ${item.title}`,
          content: item.content,
          url: item.url,
          score: this.calculateRelevanceScore(item, source),
          metadata: {
            author: item.author,
            project: item.spaceKey,
            confidence: 0.7,
          },
        };

      case "trending-tags":
        return {
          ...baseItem,
          title: `Trending: #${item.tag}`,
          description: `Tag trending ${item.trend} with ${item.count} mentions`,
          content: `Trending tag: ${item.tag} (${item.trend}, ${item.count} mentions)`,
          score: this.calculateRelevanceScore(item, source),
          tags: [item.tag],
          metadata: {
            confidence: 0.6,
          },
        };

      default:
        throw new Error(`Unknown source type: ${source}`);
    }
  }

  /**
   * Check health status of the AOMA MCP server
   */
  async checkHealth(): Promise<{
    healthy: boolean;
    details?: any;
    responseTime?: number;
  }> {
    try {
      const startTime = performance.now();

      const response = await fetch(this.config.healthUrl, {
        method: "GET",
        signal: AbortSignal.timeout(5000),
      });

      const responseTime = performance.now() - startTime;

      if (!response.ok) {
        return { healthy: false, responseTime };
      }

      const healthData = await response.json();
      const healthy = healthData.status === "healthy";

      this.healthyStatus = healthy;
      this.lastHealthCheck = Date.now();

      return {
        healthy,
        details: healthData,
        responseTime: Math.round(responseTime),
      };
    } catch (error) {
      this.healthyStatus = false;
      console.error("AOMA health check failed:", error);
      return { healthy: false };
    }
  }

  /**
   * Start periodic health monitoring
   */
  private startHealthMonitoring(): void {
    // Initial health check
    this.checkHealth();

    // Periodic health checks
    setInterval(() => {
      this.checkHealth();
    }, this.HEALTH_CHECK_INTERVAL);
  }
}

// Example configuration
const aggregatorConfig: AomaContentAggregatorConfig = {
  serverUrl: "https://example.com",
  rpcUrl: "https://example.com/rpc",
  healthUrl: "https://example.com/health",
  enableAutoQuery: false,
  queryTimeout: 5000,
  maxItems: 100,
  keywords: ["example", "test"],
  scoringWeights: { keyword: 0.4, freshness: 0.3, priority: 0.2, tags: 0.1 },
};

export const aomaContentAggregator = new AomaContentAggregator(aggregatorConfig);

// Exports are already handled above
