import type { Metadata } from "next";
import React from "react";
import { ClientLayout } from "../src/components/ClientLayout";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Betabase",
  description: "AI-Powered Intelligence Platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="/styles/motiff-glassmorphism.css" />
        <link rel="stylesheet" href="/styles/mac-design-system.css" />
        <link rel="stylesheet" href="/styles/theme-transitions.css" />
      </head>
      <body suppressHydrationWarning>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
