"use client";

import React from "react";
import { ThemeProvider } from "@/contexts/ThemeContext";

interface ClientProvidersProps {
  children: React.ReactNode;
}

/**
 * Client-side providers - uses ThemeProvider directly
 * The ThemeProvider handles its own SSR safety
 */
export function ClientProviders({ children }: ClientProvidersProps) {
  return <ThemeProvider defaultTheme="mac">{children}</ThemeProvider>;
}
