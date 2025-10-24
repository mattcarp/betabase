import type { Metadata } from "next";
import React from "react";
import { CustomElementGuard } from "../src/components/CustomElementGuard";
import { ClientErrorBoundary } from "../src/components/ClientErrorBoundary";
import { ClientWebVitals } from "../src/components/ClientWebVitals";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Betabase",
  description: "AI-Powered Intelligence Platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preload" as="image" href="/betabase-logo.webp" fetchPriority="high" />
      </head>
      <body suppressHydrationWarning>
        <CustomElementGuard />
        <ClientWebVitals />
        <ClientErrorBoundary>{children}</ClientErrorBoundary>
      </body>
    </html>
  );
}
