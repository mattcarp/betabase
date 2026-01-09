"use client";

import React from "react";
import { ThemeProvider } from "../contexts/ThemeContext";

interface ClientProvidersProps {
  children: React.ReactNode;
}

/**
 * Client-side providers - uses ThemeProvider directly
 */
export function ClientProviders({ children }: ClientProvidersProps) {
  return <ThemeProvider defaultTheme="mac">{children}</ThemeProvider>;
}
