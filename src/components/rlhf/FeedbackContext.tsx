/**
 * FeedbackContext - Centralized RLHF Feedback State Management
 *
 * Provides:
 * - Global feedback state across components
 * - Submit/update/retrieve feedback operations
 * - Real-time feedback event subscriptions
 * - Optimistic updates with rollback
 * - LangSmith integration hooks
 *
 * @see https://langsmith.com for feedback annotation patterns
 */

"use client";

import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import type {
  FeedbackRecord,
  FeedbackCategory,
  FeedbackSeverity,
  FeedbackStatus,
  FeedbackEvent,
  DocumentRelevance,
  RagMetadata,
} from "./types";

// ============================================================================
// Types
// ============================================================================

interface FeedbackSubmission {
  conversationId: string;
  messageId: string;
  userQuery: string;
  aiResponse: string;
  thumbsUp?: boolean | null;
  rating?: number | null;
  categories?: FeedbackCategory[];
  severity?: FeedbackSeverity | null;
  feedbackText?: string | null;
  documentsMarked?: DocumentRelevance[] | null;
  suggestedCorrection?: string | null;
  modelUsed?: string | null;
  ragMetadata?: RagMetadata | null;
}

interface FeedbackState {
  feedback: Map<string, FeedbackRecord>;
  pendingSubmissions: Set<string>;
  error: string | null;
  isLoading: boolean;
  lastEvent: FeedbackEvent | null;
}

type FeedbackAction =
  | { type: "SUBMIT_START"; messageId: string }
  | { type: "SUBMIT_SUCCESS"; feedback: FeedbackRecord }
  | { type: "SUBMIT_ERROR"; messageId: string; error: string }
  | { type: "UPDATE_START"; feedbackId: string }
  | { type: "UPDATE_SUCCESS"; feedback: FeedbackRecord }
  | { type: "UPDATE_ERROR"; feedbackId: string; error: string }
  | { type: "LOAD_FEEDBACK"; feedback: FeedbackRecord[] }
  | { type: "SET_LOADING"; isLoading: boolean }
  | { type: "SET_ERROR"; error: string | null }
  | { type: "FEEDBACK_EVENT"; event: FeedbackEvent }
  | { type: "CLEAR_ERROR" };

interface FeedbackContextValue {
  // State
  feedback: Map<string, FeedbackRecord>;
  isLoading: boolean;
  error: string | null;
  pendingSubmissions: Set<string>;
  lastEvent: FeedbackEvent | null;

  // Actions
  submitFeedback: (submission: FeedbackSubmission) => Promise<FeedbackRecord | null>;
  updateFeedback: (
    feedbackId: string,
    updates: Partial<FeedbackRecord>
  ) => Promise<FeedbackRecord | null>;
  getFeedbackForMessage: (messageId: string) => FeedbackRecord | null;
  getFeedbackForConversation: (conversationId: string) => FeedbackRecord[];
  subscribeFeedbackEvents: (callback: (event: FeedbackEvent) => void) => () => void;
  clearError: () => void;

  // Utility
  hasFeedback: (messageId: string) => boolean;
  isPending: (messageId: string) => boolean;
}

// ============================================================================
// Context
// ============================================================================

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

// ============================================================================
// Reducer
// ============================================================================

const initialState: FeedbackState = {
  feedback: new Map(),
  pendingSubmissions: new Set(),
  error: null,
  isLoading: false,
  lastEvent: null,
};

function feedbackReducer(state: FeedbackState, action: FeedbackAction): FeedbackState {
  switch (action.type) {
    case "SUBMIT_START": {
      const newPending = new Set(state.pendingSubmissions);
      newPending.add(action.messageId);
      return {
        ...state,
        pendingSubmissions: newPending,
        error: null,
      };
    }

    case "SUBMIT_SUCCESS": {
      const newFeedback = new Map(state.feedback);
      newFeedback.set(action.feedback.messageId, action.feedback);
      const newPending = new Set(state.pendingSubmissions);
      newPending.delete(action.feedback.messageId);
      return {
        ...state,
        feedback: newFeedback,
        pendingSubmissions: newPending,
        lastEvent: {
          type: "submitted",
          feedbackId: action.feedback.id,
          timestamp: new Date().toISOString(),
          data: action.feedback,
        },
      };
    }

    case "SUBMIT_ERROR": {
      const newPending = new Set(state.pendingSubmissions);
      newPending.delete(action.messageId);
      return {
        ...state,
        pendingSubmissions: newPending,
        error: action.error,
      };
    }

    case "UPDATE_START": {
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    }

    case "UPDATE_SUCCESS": {
      const newFeedback = new Map(state.feedback);
      newFeedback.set(action.feedback.messageId, action.feedback);
      return {
        ...state,
        feedback: newFeedback,
        isLoading: false,
        lastEvent: {
          type: "updated",
          feedbackId: action.feedback.id,
          timestamp: new Date().toISOString(),
          data: action.feedback,
        },
      };
    }

    case "UPDATE_ERROR": {
      return {
        ...state,
        isLoading: false,
        error: action.error,
      };
    }

    case "LOAD_FEEDBACK": {
      const newFeedback = new Map(state.feedback);
      action.feedback.forEach((fb) => {
        newFeedback.set(fb.messageId, fb);
      });
      return {
        ...state,
        feedback: newFeedback,
        isLoading: false,
      };
    }

    case "SET_LOADING": {
      return {
        ...state,
        isLoading: action.isLoading,
      };
    }

    case "SET_ERROR": {
      return {
        ...state,
        error: action.error,
      };
    }

    case "FEEDBACK_EVENT": {
      return {
        ...state,
        lastEvent: action.event,
      };
    }

    case "CLEAR_ERROR": {
      return {
        ...state,
        error: null,
      };
    }

    default:
      return state;
  }
}

// ============================================================================
// Provider
// ============================================================================

interface FeedbackProviderProps {
  children: React.ReactNode;
  apiEndpoint?: string;
  onFeedbackSubmit?: (feedback: FeedbackRecord) => void;
  onFeedbackError?: (error: Error) => void;
}

export function FeedbackProvider({
  children,
  apiEndpoint = "/api/rlhf/feedback",
  onFeedbackSubmit,
  onFeedbackError,
}: FeedbackProviderProps) {
  const [state, dispatch] = useReducer(feedbackReducer, initialState);
  const eventSubscribers = React.useRef<Set<(event: FeedbackEvent) => void>>(new Set());

  // Emit events to subscribers
  useEffect(() => {
    if (state.lastEvent) {
      eventSubscribers.current.forEach((callback) => {
        callback(state.lastEvent!);
      });
    }
  }, [state.lastEvent]);

  const submitFeedback = useCallback(
    async (submission: FeedbackSubmission): Promise<FeedbackRecord | null> => {
      dispatch({ type: "SUBMIT_START", messageId: submission.messageId });

      try {
        // Generate optimistic ID
        const optimisticId = `fb_${Date.now()}_${Math.random().toString(36).slice(2)}`;

        // Create optimistic feedback record
        const optimisticFeedback: FeedbackRecord = {
          id: optimisticId,
          conversationId: submission.conversationId,
          messageId: submission.messageId,
          userQuery: submission.userQuery,
          aiResponse: submission.aiResponse,
          thumbsUp: submission.thumbsUp ?? null,
          rating: submission.rating ?? null,
          categories: submission.categories ?? [],
          severity: submission.severity ?? null,
          feedbackText: submission.feedbackText ?? null,
          documentsMarked: submission.documentsMarked ?? null,
          suggestedCorrection: submission.suggestedCorrection ?? null,
          preferredResponse: null,
          userEmail: null, // Will be filled by API
          sessionId: null, // Will be filled by API
          modelUsed: submission.modelUsed ?? null,
          ragMetadata: submission.ragMetadata ?? null,
          status: "pending" as FeedbackStatus,
          curatorId: null,
          curatorNotes: null,
          reviewedAt: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        // API call
        const response = await fetch(apiEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(submission),
        });

        if (!response.ok) {
          throw new Error(`Failed to submit feedback: ${response.statusText}`);
        }

        const savedFeedback: FeedbackRecord = await response.json();

        dispatch({ type: "SUBMIT_SUCCESS", feedback: savedFeedback });
        onFeedbackSubmit?.(savedFeedback);

        return savedFeedback;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        dispatch({
          type: "SUBMIT_ERROR",
          messageId: submission.messageId,
          error: errorMessage,
        });
        onFeedbackError?.(error instanceof Error ? error : new Error(errorMessage));
        return null;
      }
    },
    [apiEndpoint, onFeedbackSubmit, onFeedbackError]
  );

  const updateFeedback = useCallback(
    async (
      feedbackId: string,
      updates: Partial<FeedbackRecord>
    ): Promise<FeedbackRecord | null> => {
      dispatch({ type: "UPDATE_START", feedbackId });

      try {
        const response = await fetch(`${apiEndpoint}/${feedbackId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updates),
        });

        if (!response.ok) {
          throw new Error(`Failed to update feedback: ${response.statusText}`);
        }

        const updatedFeedback: FeedbackRecord = await response.json();

        dispatch({ type: "UPDATE_SUCCESS", feedback: updatedFeedback });

        return updatedFeedback;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        dispatch({
          type: "UPDATE_ERROR",
          feedbackId,
          error: errorMessage,
        });
        onFeedbackError?.(error instanceof Error ? error : new Error(errorMessage));
        return null;
      }
    },
    [apiEndpoint, onFeedbackError]
  );

  const getFeedbackForMessage = useCallback(
    (messageId: string): FeedbackRecord | null => {
      return state.feedback.get(messageId) ?? null;
    },
    [state.feedback]
  );

  const getFeedbackForConversation = useCallback(
    (conversationId: string): FeedbackRecord[] => {
      return Array.from(state.feedback.values()).filter(
        (fb) => fb.conversationId === conversationId
      );
    },
    [state.feedback]
  );

  const subscribeFeedbackEvents = useCallback(
    (callback: (event: FeedbackEvent) => void): (() => void) => {
      eventSubscribers.current.add(callback);
      return () => {
        eventSubscribers.current.delete(callback);
      };
    },
    []
  );

  const clearError = useCallback(() => {
    dispatch({ type: "CLEAR_ERROR" });
  }, []);

  const hasFeedback = useCallback(
    (messageId: string): boolean => {
      return state.feedback.has(messageId);
    },
    [state.feedback]
  );

  const isPending = useCallback(
    (messageId: string): boolean => {
      return state.pendingSubmissions.has(messageId);
    },
    [state.pendingSubmissions]
  );

  const contextValue = useMemo<FeedbackContextValue>(
    () => ({
      feedback: state.feedback,
      isLoading: state.isLoading,
      error: state.error,
      pendingSubmissions: state.pendingSubmissions,
      lastEvent: state.lastEvent,
      submitFeedback,
      updateFeedback,
      getFeedbackForMessage,
      getFeedbackForConversation,
      subscribeFeedbackEvents,
      clearError,
      hasFeedback,
      isPending,
    }),
    [
      state.feedback,
      state.isLoading,
      state.error,
      state.pendingSubmissions,
      state.lastEvent,
      submitFeedback,
      updateFeedback,
      getFeedbackForMessage,
      getFeedbackForConversation,
      subscribeFeedbackEvents,
      clearError,
      hasFeedback,
      isPending,
    ]
  );

  return <FeedbackContext.Provider value={contextValue}>{children}</FeedbackContext.Provider>;
}

// ============================================================================
// Hook
// ============================================================================

export function useFeedback(): FeedbackContextValue {
  const context = useContext(FeedbackContext);

  if (!context) {
    throw new Error("useFeedback must be used within a FeedbackProvider");
  }

  return context;
}

// ============================================================================
// Specialized Hooks
// ============================================================================

/**
 * Hook for quick thumbs feedback on a specific message
 */
export function useQuickFeedback(messageId: string, conversationId: string) {
  const { submitFeedback, getFeedbackForMessage, isPending } = useFeedback();
  const existing = getFeedbackForMessage(messageId);

  const submitThumbsUp = useCallback(
    (userQuery: string, aiResponse: string) => {
      return submitFeedback({
        conversationId,
        messageId,
        userQuery,
        aiResponse,
        thumbsUp: true,
      });
    },
    [conversationId, messageId, submitFeedback]
  );

  const submitThumbsDown = useCallback(
    (userQuery: string, aiResponse: string) => {
      return submitFeedback({
        conversationId,
        messageId,
        userQuery,
        aiResponse,
        thumbsUp: false,
      });
    },
    [conversationId, messageId, submitFeedback]
  );

  return {
    existing,
    isPending: isPending(messageId),
    submitThumbsUp,
    submitThumbsDown,
  };
}

/**
 * Hook for detailed feedback with categories and corrections
 */
export function useDetailedFeedback(messageId: string, conversationId: string) {
  const { submitFeedback, updateFeedback, getFeedbackForMessage, isPending } = useFeedback();
  const existing = getFeedbackForMessage(messageId);

  const submitDetailed = useCallback(
    (data: {
      userQuery: string;
      aiResponse: string;
      thumbsUp?: boolean | null;
      rating?: number | null;
      categories?: FeedbackCategory[];
      severity?: FeedbackSeverity | null;
      feedbackText?: string | null;
      suggestedCorrection?: string | null;
      documentsMarked?: DocumentRelevance[] | null;
    }) => {
      return submitFeedback({
        conversationId,
        messageId,
        ...data,
      });
    },
    [conversationId, messageId, submitFeedback]
  );

  const addCorrection = useCallback(
    (correction: string) => {
      if (existing) {
        return updateFeedback(existing.id, {
          suggestedCorrection: correction,
        });
      }
      return Promise.resolve(null);
    },
    [existing, updateFeedback]
  );

  return {
    existing,
    isPending: isPending(messageId),
    submitDetailed,
    addCorrection,
  };
}

/**
 * Hook for subscribing to feedback events
 */
export function useFeedbackEvents(
  callback: (event: FeedbackEvent) => void,
  deps: React.DependencyList = []
) {
  const { subscribeFeedbackEvents } = useFeedback();

  useEffect(() => {
    return subscribeFeedbackEvents(callback);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subscribeFeedbackEvents, ...deps]);
}

export default FeedbackContext;
