"use client";

import React from "react";
import { ThemeProvider } from "@/contexts/ThemeContext";

interface ClientProvidersProps {
  children: React.ReactNode;
}

/**
 * Actual client-side providers that use React hooks
 * This component is dynamically imported with ssr: false
 */
export function ClientProviders({ children }: ClientProvidersProps) {
  return <ThemeProvider defaultTheme="mac">{children}</ThemeProvider>;
}
