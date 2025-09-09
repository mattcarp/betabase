import React from "react";
import type { Metadata } from "next";
import "./globals.css";
import { CustomElementGuard } from "../src/components/CustomElementGuard";

export const metadata: Metadata = {
  title: "The Betabase",
  description: "AI-Powered Intelligence Platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="/styles/motiff-glassmorphism.css" />
        <link rel="stylesheet" href="/styles/mac-design-system.css" />
      </head>
      <body suppressHydrationWarning>
        <CustomElementGuard />
        {children}
      </body>
    </html>
  );
}
