"use client";

import React from "react";
import dynamic from "next/dynamic";

interface ProvidersProps {
  children: React.ReactNode;
}

// Dynamically import the actual providers with ssr: false
const ClientProviders = dynamic(
  () => import("./ClientProviders").then((mod) => mod.ClientProviders),
  { ssr: false }
);

/**
 * Client-side Providers wrapper
 * Uses next/dynamic with ssr:false to completely avoid SSR issues
 */
export function Providers({ children }: ProvidersProps) {
  return <ClientProviders>{children}</ClientProviders>;
}
