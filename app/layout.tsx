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
        {/* Critical: Inline script to guard custom elements BEFORE any other scripts load */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
(function() {
  if (typeof window !== 'undefined' && window.customElements) {
    var originalDefine = window.customElements.define;
    window.customElements.define = function(name, constructor, options) {
      if (window.customElements.get(name)) {
        console.info("Custom element '" + name + "' already defined, skipping re-registration");
        return;
      }
      try {
        originalDefine.call(window.customElements, name, constructor, options);
      } catch (e) {
        if (e.name === 'NotSupportedError' || (e.message && e.message.includes('already been defined'))) {
          console.info("Prevented duplicate registration of custom element '" + name + "'");
        } else {
          throw e;
        }
      }
    };
  }
})();
`,
          }}
        />
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
