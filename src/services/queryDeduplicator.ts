/**
 * Query Deduplication Service
 * 
 * Prevents redundant parallel queries from multiple users/tabs
 * If the same query is already in-flight, returns the existing promise
 */

class QueryDeduplicator {
  private inflightQueries = new Map<string, Promise<any>>();
  private queryCount = 0;
  private dedupeCount = 0;

  /**
   * Deduplicate a query execution
   * @param key - Unique key for the query (e.g., hash of query + params)
   * @param fn - Function to execute if query is not in-flight
   * @returns Promise with query result
   */
  async dedupe<T>(key: string, fn: () => Promise<T>): Promise<T> {
    this.queryCount++;
    
    // If same query is already in flight, return that promise
    if (this.inflightQueries.has(key)) {
      this.dedupeCount++;
      const dedupeRate = ((this.dedupeCount / this.queryCount) * 100).toFixed(1);
      console.log(`🔄 Deduping query: ${key.substring(0, 50)}... (${dedupeRate}% dedupe rate)`);
      return this.inflightQueries.get(key) as Promise<T>;
    }
    
    // Start new query
    const promise = fn().finally(() => {
      // Clean up after completion
      this.inflightQueries.delete(key);
    });
    
    this.inflightQueries.set(key, promise);
    return promise;
  }

  /**
   * Clear all in-flight queries (useful for testing/cleanup)
   */
  clear(): void {
    this.inflightQueries.clear();
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      totalQueries: this.queryCount,
      dedupedQueries: this.dedupeCount,
      dedupeRate: this.queryCount > 0 ? (this.dedupeCount / this.queryCount) * 100 : 0,
      currentInflight: this.inflightQueries.size,
    };
  }
}

// Singleton instance
let instance: QueryDeduplicator | null = null;

export function getQueryDeduplicator(): QueryDeduplicator {
  if (!instance) {
    instance = new QueryDeduplicator();
  }
  return instance;
}

export { QueryDeduplicator };

