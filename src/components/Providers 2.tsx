"use client";

import React from "react";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ClientErrorBoundary } from "./ClientErrorBoundary";

interface ProvidersProps {
  children: React.ReactNode;
}

/**
 * Client-side Providers wrapper
 * Wraps all client-side context providers in a single component
 * that can be safely imported into the root layout.
 */
export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider defaultTheme="mac">
      <ClientErrorBoundary>{children}</ClientErrorBoundary>
    </ThemeProvider>
  );
}
