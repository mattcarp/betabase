/**
 * Session State Manager
 * 
 * Manages conversation history and reinforcement context for context-aware retrieval
 * Part of the Advanced RLHF RAG Implementation - Phase 3
 */

export interface RLHFFeedback {
  type: "thumbs_up" | "thumbs_down" | "rating" | "correction" | "detailed";
  value: any;
  timestamp: string;
}

export interface ConversationTurn {
  query: string;
  retrievedDocs: string[]; // Document IDs
  response: string;
  feedback?: RLHFFeedback;
  timestamp: string;
}

export interface ReinforcementContext {
  successfulDocIds: string[]; // Docs that led to positive feedback
  failedDocIds: string[]; // Docs that led to negative feedback
  topicWeights: Record<string, number>; // Learned topic preferences
  sourceTypePreferences: Record<string, number>; // Preferred source types
}

export interface SessionMetadata {
  organization: string;
  division: string;
  app_under_test: string;
  userEmail?: string;
  startedAt: string;
  lastActivityAt: string;
}

export interface ConversationSession {
  sessionId: string;
  history: ConversationTurn[];
  reinforcementContext: ReinforcementContext;
  metadata: SessionMetadata;
}

export class SessionStateManager {
  private sessions: Map<string, ConversationSession> = new Map();
  private readonly maxHistoryLength = 10; // Keep last 10 turns
  private readonly sessionTTL = 1000 * 60 * 60 * 2; // 2 hours

  /**
   * Create a new session
   */
  createSession(
    sessionId: string,
    metadata: SessionMetadata
  ): ConversationSession {
    const session: ConversationSession = {
      sessionId,
      history: [],
      reinforcementContext: {
        successfulDocIds: [],
        failedDocIds: [],
        topicWeights: {},
        sourceTypePreferences: {},
      },
      metadata: {
        ...metadata,
        startedAt: new Date().toISOString(),
        lastActivityAt: new Date().toISOString(),
      },
    };

    this.sessions.set(sessionId, session);
    return session;
  }

  /**
   * Get session by ID, create if doesn't exist
   */
  getOrCreateSession(
    sessionId: string,
    metadata: SessionMetadata
  ): ConversationSession {
    if (this.sessions.has(sessionId)) {
      return this.sessions.get(sessionId)!;
    }
    return this.createSession(sessionId, metadata);
  }

  /**
   * Add a conversation turn to the session
   */
  addTurn(
    sessionId: string,
    turn: ConversationTurn
  ): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    // Add turn to history
    session.history.push(turn);

    // Trim history if too long
    if (session.history.length > this.maxHistoryLength) {
      session.history = session.history.slice(-this.maxHistoryLength);
    }

    // Update last activity
    session.metadata.lastActivityAt = new Date().toISOString();

    // Update reinforcement context if feedback exists
    if (turn.feedback) {
      this.updateReinforcementContext(sessionId, turn);
    }
  }

  /**
   * Update reinforcement context based on feedback
   */
  private updateReinforcementContext(
    sessionId: string,
    turn: ConversationTurn
  ): void {
    const session = this.sessions.get(sessionId);
    if (!session || !turn.feedback) return;

    const { feedback, retrievedDocs } = turn;
    const { reinforcementContext } = session;

    // Determine if feedback was positive or negative
    const isPositive = this.isFeedbackPositive(feedback);

    if (isPositive) {
      // Add to successful docs (avoid duplicates)
      retrievedDocs.forEach(docId => {
        if (!reinforcementContext.successfulDocIds.includes(docId)) {
          reinforcementContext.successfulDocIds.push(docId);
        }
        // Remove from failed if it was there
        reinforcementContext.failedDocIds = reinforcementContext.failedDocIds.filter(
          id => id !== docId
        );
      });
    } else {
      // Add to failed docs
      retrievedDocs.forEach(docId => {
        if (!reinforcementContext.failedDocIds.includes(docId)) {
          reinforcementContext.failedDocIds.push(docId);
        }
        // Remove from successful if it was there
        reinforcementContext.successfulDocIds = reinforcementContext.successfulDocIds.filter(
          id => id !== docId
        );
      });
    }

    // Extract topics from query and update weights
    const topics = this.extractTopics(turn.query);
    topics.forEach(topic => {
      const currentWeight = reinforcementContext.topicWeights[topic] || 0;
      // Increase weight for topics with positive feedback
      reinforcementContext.topicWeights[topic] = isPositive
        ? currentWeight + 0.1
        : Math.max(0, currentWeight - 0.05);
    });
  }

  /**
   * Determine if feedback is positive
   */
  private isFeedbackPositive(feedback: RLHFFeedback): boolean {
    switch (feedback.type) {
      case "thumbs_up":
        return true;
      case "thumbs_down":
        return false;
      case "rating":
        return (feedback.value?.score || 0) >= 4;
      case "correction":
        return false; // Correction implies something was wrong
      case "detailed":
        // Check if detailed feedback contains positive indicators
        return (feedback.value?.sentiment || "neutral") === "positive";
      default:
        return false;
    }
  }

  /**
   * Extract topics from query text
   */
  private extractTopics(query: string): string[] {
    // Simple keyword extraction
    // In production, this could use NLP or LLM-based topic extraction
    const keywords = query
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 4) // Only words > 4 chars
      .filter(word => !this.isStopWord(word));
    
    return [...new Set(keywords)]; // Remove duplicates
  }

  /**
   * Simple stop word check
   */
  private isStopWord(word: string): boolean {
    const stopWords = new Set([
      "about", "above", "after", "again", "against", "all", "also", "among",
      "another", "any", "are", "as", "at", "be", "because", "been", "before",
      "being", "below", "between", "both", "but", "by", "can", "could", "did",
      "do", "does", "doing", "down", "during", "each", "few", "for", "from",
      "further", "had", "has", "have", "having", "here", "how", "if", "in",
      "into", "is", "it", "its", "more", "most", "no", "nor", "not", "now",
      "of", "on", "once", "only", "or", "other", "our", "out", "over", "own",
      "same", "should", "so", "some", "such", "than", "that", "the", "their",
      "them", "then", "there", "these", "they", "this", "those", "through",
      "to", "too", "under", "until", "up", "very", "was", "we", "were", "what",
      "when", "where", "which", "while", "who", "why", "will", "with", "would",
    ]);
    return stopWords.has(word);
  }

  /**
   * Get session by ID
   */
  getSession(sessionId: string): ConversationSession | null {
    return this.sessions.get(sessionId) || null;
  }

  /**
   * Get recent history for a session
   */
  getRecentHistory(sessionId: string, count: number = 5): ConversationTurn[] {
    const session = this.sessions.get(sessionId);
    if (!session) return [];
    
    return session.history.slice(-count);
  }

  /**
   * Get reinforcement context for a session
   */
  getReinforcementContext(sessionId: string): ReinforcementContext | null {
    const session = this.sessions.get(sessionId);
    return session ? session.reinforcementContext : null;
  }

  /**
   * Clean up expired sessions
   */
  cleanupExpiredSessions(): void {
    const now = Date.now();
    const expiredSessions: string[] = [];

    this.sessions.forEach((session, sessionId) => {
      const lastActivity = new Date(session.metadata.lastActivityAt).getTime();
      if (now - lastActivity > this.sessionTTL) {
        expiredSessions.push(sessionId);
      }
    });

    expiredSessions.forEach(sessionId => {
      this.sessions.delete(sessionId);
      console.log(`🧹 Cleaned up expired session: ${sessionId}`);
    });

    if (expiredSessions.length > 0) {
      console.log(`🧹 Cleaned up ${expiredSessions.length} expired sessions`);
    }
  }

  /**
   * Delete a specific session
   */
  deleteSession(sessionId: string): boolean {
    return this.sessions.delete(sessionId);
  }

  /**
   * Get all active sessions
   */
  getAllSessions(): ConversationSession[] {
    return Array.from(this.sessions.values());
  }

  /**
   * Add a query to history (start of turn)
   */
  async addToHistory(sessionId: string, data: { query: string; timestamp: string; userId?: string }): Promise<void> {
    this.getOrCreateSession(sessionId, {
      organization: 'sony-music',
      division: 'mso',
      app_under_test: 'siam',
      userEmail: data.userId,
      startedAt: data.timestamp,
      lastActivityAt: data.timestamp
    });
  }

  /**
   * Record a successful retrieval
   */
  async recordSuccessfulRetrieval(sessionId: string, data: { query: string; documents: any[]; confidence: number }): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session) {
      console.log(`[SessionStateManager] Recorded retrieval for ${sessionId}: ${data.documents.length} docs, confidence ${data.confidence}`);
    }
  }

  /**
   * Get session count
   */
  getSessionCount(): number {
    return this.sessions.size;
  }
}

// Singleton instance
let sessionStateManager: SessionStateManager | null = null;

export function getSessionStateManager(): SessionStateManager {
  if (!sessionStateManager) {
    sessionStateManager = new SessionStateManager();
    
    // Set up periodic cleanup (every 30 minutes)
    setInterval(() => {
      sessionStateManager?.cleanupExpiredSessions();
    }, 1000 * 60 * 30);
  }
  return sessionStateManager;
}

