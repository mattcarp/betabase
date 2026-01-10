import type { Metadata } from "next";
import React, { Suspense } from "react";
import { Inter } from "next/font/google";
import "./globals.css";
import { WebVitalsReporter } from "@/components/performance/WebVitalsReporter";

// Inter font - MAC Design System primary typeface
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
  weight: ["100", "200", "300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "The Betabase",
  description: "AI-Powered Intelligence Platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="mac" suppressHydrationWarning className={`${inter.variable} font-sans`}>
      <head>
        {/* Theme initialization - runs before React hydration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
(function() {
  try {
    var theme = localStorage.getItem('siam-theme-preference') || 'mac';
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'light') {
      document.body.classList.remove('dark');
    }
  } catch (e) {}
})();
`,
          }}
        />
        {/* Custom elements guard */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
(function() {
  if (typeof window !== 'undefined' && window.customElements) {
    var originalDefine = window.customElements.define;
    window.customElements.define = function(name, constructor, options) {
      if (window.customElements.get(name)) {
        return;
      }
      try {
        originalDefine.call(window.customElements, name, constructor, options);
      } catch (e) {
        if (e.name !== 'NotSupportedError' && !(e.message && e.message.includes('already been defined'))) {
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
      <body className="dark font-sans antialiased" suppressHydrationWarning>
        <WebVitalsReporter />
        {children}
      </body>
    </html>
  );
}
