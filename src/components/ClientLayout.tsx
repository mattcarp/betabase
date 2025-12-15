"use client";

import { CustomElementGuard } from "./CustomElementGuard";
import { ClientWebVitals } from "./ClientWebVitals";
import { ThemeProvider } from "../contexts/ThemeContext";

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <CustomElementGuard />
      <ClientWebVitals />
      {children}
    </ThemeProvider>
  );
}
