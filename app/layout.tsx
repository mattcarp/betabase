import type { Metadata } from "next";
import React from "react";
import { CustomElementGuard } from "../src/components/CustomElementGuard";
import { ClientErrorBoundary } from "../src/components/ClientErrorBoundary";
import { ClientWebVitals } from "../src/components/ClientWebVitals";
import { ThemeProvider } from "../src/contexts/ThemeContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Betabase",
  description: "AI-Powered Intelligence Platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preload" as="image" href="/betabase-logo.webp" />
        <link rel="stylesheet" href="/styles/motiff-glassmorphism.css" />
        <link rel="stylesheet" href="/styles/mac-design-system.css" />
        <link rel="stylesheet" href="/styles/theme-transitions.css" />
      </head>
      <body suppressHydrationWarning>
        <CustomElementGuard />
        <ClientWebVitals />
        <ThemeProvider defaultTheme="mac">
          <ClientErrorBoundary>{children}</ClientErrorBoundary>
        </ThemeProvider>
      </body>
    </html>
  );
}
