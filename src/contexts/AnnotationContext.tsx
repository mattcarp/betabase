"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { Annotation, AnnotationSession, AnnotationType } from "../types/annotations";

interface AnnotationContextType {
  annotations: Annotation[];
  currentTool: AnnotationType | null;
  isDrawing: boolean;
  addAnnotation: (annotation: Annotation) => void;
  updateAnnotation: (id: string, updates: Partial<Annotation>) => void;
  deleteAnnotation: (id: string) => void;
  setCurrentTool: (tool: AnnotationType | null) => void;
  setIsDrawing: (isDrawing: boolean) => void;
  clearAnnotations: () => void;
  getAnnotationsByTimestamp: (timestamp: number) => Annotation[];
  saveSession: () => void;
  loadSession: () => void;
}

const AnnotationContext = createContext<AnnotationContextType | undefined>(undefined);

const STORAGE_KEY = "siam-annotation-session";

export const AnnotationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [currentTool, setCurrentTool] = useState<AnnotationType | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Load session from localStorage on mount
  useEffect(() => {
    loadSession();
  }, []);

  // Auto-save on changes
  useEffect(() => {
    if (annotations.length > 0) {
      saveSession();
    }
  }, [annotations]);

  const addAnnotation = useCallback((annotation: Annotation) => {
    setAnnotations((prev) => [...prev, annotation]);
  }, []);

  const updateAnnotation = useCallback((id: string, updates: Partial<Annotation>) => {
    setAnnotations((prev) =>
      prev.map((ann) =>
        ann.id === id
          ? {
              ...ann,
              ...updates,
              updatedAt: new Date(),
            }
          : ann
      )
    );
  }, []);

  const deleteAnnotation = useCallback((id: string) => {
    setAnnotations((prev) => prev.filter((ann) => ann.id !== id));
  }, []);

  const clearAnnotations = useCallback(() => {
    setAnnotations([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const getAnnotationsByTimestamp = useCallback(
    (timestamp: number) => {
      return annotations.filter((ann) => Math.abs(ann.timestamp - timestamp) < 1000);
    },
    [annotations]
  );

  const saveSession = useCallback(() => {
    const session: AnnotationSession = {
      sessionId: `session-${Date.now()}`,
      annotations,
      createdAt: new Date(),
      lastModified: new Date(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  }, [annotations]);

  const loadSession = useCallback(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const session: AnnotationSession = JSON.parse(stored);
        setAnnotations(
          session.annotations.map((ann) => ({
            ...ann,
            createdAt: new Date(ann.createdAt),
            updatedAt: ann.updatedAt ? new Date(ann.updatedAt) : undefined,
          }))
        );
      }
    } catch (error) {
      console.error("Failed to load annotation session:", error);
    }
  }, []);

  return (
    <AnnotationContext.Provider
      value={{
        annotations,
        currentTool,
        isDrawing,
        addAnnotation,
        updateAnnotation,
        deleteAnnotation,
        setCurrentTool,
        setIsDrawing,
        clearAnnotations,
        getAnnotationsByTimestamp,
        saveSession,
        loadSession,
      }}
    >
      {children}
    </AnnotationContext.Provider>
  );
};

export const useAnnotations = () => {
  const context = useContext(AnnotationContext);
  if (!context) {
    throw new Error("useAnnotations must be used within an AnnotationProvider");
  }
  return context;
};
