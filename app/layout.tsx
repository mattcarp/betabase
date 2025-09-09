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
      <body suppressHydrationWarning>
        <CustomElementGuard />
        {children}
      </body>
    </html>
  );
}
