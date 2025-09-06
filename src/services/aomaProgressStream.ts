/**
 * AOMA Progress Stream Service
 * Provides real-time, honest progress updates for AOMA queries
 * Shows exactly which services are being queried and their status
 */

export interface AOMAProgressUpdate {
  type: 'start' | 'service_start' | 'service_complete' | 'service_error' | 'complete' | 'cache_hit';
  service?: string;
  message: string;
  timestamp: number;
  duration?: number;
  resultCount?: number;
  cached?: boolean;
  sources?: AOMASource[];
}

export interface AOMASource {
  type: 'knowledge_base' | 'jira' | 'git' | 'outlook' | 'system';
  title: string;
  url?: string;
  description?: string;
  relevance?: number;
  timestamp?: string;
}

export class AOMAProgressStream {
  private updates: AOMAProgressUpdate[] = [];
  private startTime: number = 0;
  private serviceTimings: Map<string, number> = new Map();
  private sources: AOMASource[] = [];
  
  /**
   * Start tracking a new query
   */
  startQuery(query: string): void {
    this.updates = [];
    this.startTime = Date.now();
    this.serviceTimings.clear();
    this.sources = [];
    
    this.addUpdate({
      type: 'start',
      message: `🔍 Analyzing query: "${query.substring(0, 50)}..."`,
      timestamp: Date.now()
    });
  }
  
  /**
   * Record a cache hit
   */
  recordCacheHit(service: string): void {
    this.addUpdate({
      type: 'cache_hit',
      service,
      message: `⚡ Found cached results for ${this.formatServiceName(service)}`,
      timestamp: Date.now(),
      cached: true
    });
  }
  
  /**
   * Record the start of a service call
   */
  startService(service: string): void {
    this.serviceTimings.set(service, Date.now());
    
    this.addUpdate({
      type: 'service_start',
      service,
      message: `⏳ Querying ${this.formatServiceName(service)}...`,
      timestamp: Date.now()
    });
  }
  
  /**
   * Record successful service completion
   */
  completeService(service: string, resultCount?: number, sources?: AOMASource[]): void {
    const startTime = this.serviceTimings.get(service);
    const duration = startTime ? Date.now() - startTime : 0;
    
    if (sources) {
      this.sources.push(...sources);
    }
    
    this.addUpdate({
      type: 'service_complete',
      service,
      message: `✅ ${this.formatServiceName(service)} completed (${this.formatDuration(duration)})${resultCount ? ` - ${resultCount} results found` : ''}`,
      timestamp: Date.now(),
      duration,
      resultCount,
      sources
    });
  }
  
  /**
   * Record service error
   */
  errorService(service: string, error: string): void {
    const startTime = this.serviceTimings.get(service);
    const duration = startTime ? Date.now() - startTime : 0;
    
    this.addUpdate({
      type: 'service_error',
      service,
      message: `❌ ${this.formatServiceName(service)} failed: ${error}`,
      timestamp: Date.now(),
      duration
    });
  }
  
  /**
   * Mark query as complete
   */
  completeQuery(): void {
    const totalDuration = Date.now() - this.startTime;
    
    this.addUpdate({
      type: 'complete',
      message: `✨ Query complete in ${this.formatDuration(totalDuration)}`,
      timestamp: Date.now(),
      duration: totalDuration,
      sources: this.sources
    });
  }
  
  /**
   * Get all updates for streaming
   */
  getUpdates(): AOMAProgressUpdate[] {
    return [...this.updates];
  }
  
  /**
   * Get the latest update
   */
  getLatestUpdate(): AOMAProgressUpdate | null {
    return this.updates[this.updates.length - 1] || null;
  }
  
  /**
   * Get all collected sources
   */
  getSources(): AOMASource[] {
    return [...this.sources];
  }
  
  /**
   * Create a formatted summary of the query progress
   */
  getSummary(): string {
    const serviceUpdates = this.updates.filter(u => 
      u.type === 'service_complete' || u.type === 'service_error'
    );
    
    const summary = serviceUpdates.map(update => {
      if (update.type === 'service_complete') {
        return `✅ ${update.service}: ${update.duration}ms${update.resultCount ? ` (${update.resultCount} results)` : ''}`;
      } else {
        return `❌ ${update.service}: Failed`;
      }
    }).join('\n');
    
    const totalDuration = Date.now() - this.startTime;
    
    return `${summary}\n⏱️ Total: ${this.formatDuration(totalDuration)}`;
  }
  
  /**
   * Add an update to the stream
   */
  private addUpdate(update: AOMAProgressUpdate): void {
    this.updates.push(update);
  }
  
  /**
   * Format service name for display
   */
  private formatServiceName(service: string): string {
    const nameMap: Record<string, string> = {
      'query_aoma_knowledge': '📚 AOMA Knowledge Base',
      'search_jira_tickets': '🎫 Jira Tickets',
      'get_jira_ticket_count': '📊 Jira Ticket Count',
      'search_git_commits': '💾 Git History',
      'search_code_files': '📁 Code Files',
      'search_outlook_emails': '📧 Outlook Emails',
      'analyze_development_context': '🔍 Development Context',
      'get_system_health': '💚 System Health'
    };
    
    return nameMap[service] || service;
  }
  
  /**
   * Format duration for display
   */
  private formatDuration(ms: number): string {
    if (ms < 1000) {
      return `${ms}ms`;
    } else if (ms < 60000) {
      return `${(ms / 1000).toFixed(1)}s`;
    } else {
      return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
    }
  }
}

// Export singleton for use across the application
export const aomaProgressStream = new AOMAProgressStream();