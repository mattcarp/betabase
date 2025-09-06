import React from "react";
import type { Metadata } from "next";
import "../src/index.css";
import { CustomElementGuard } from "@/components/CustomElementGuard";

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
