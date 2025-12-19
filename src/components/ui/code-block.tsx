"use client";

import { JSX, useEffect, useState } from "react";
import { codeToHast, type BundledLanguage, type BundledTheme } from "shiki";
import { toJsxRuntime } from "hast-util-to-jsx-runtime";
import { Fragment } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import { cn } from "@/lib/utils";

interface CodeBlockProps {
  code: string;
  language?: BundledLanguage;
  theme?: BundledTheme;
  showLineNumbers?: boolean;
  className?: string;
  filename?: string;
}

export function CodeBlock({
  code,
  language = "typescript",
  theme = "tokyo-night",
  showLineNumbers = false,
  className,
  filename,
}: CodeBlockProps) {
  const [rendered, setRendered] = useState<JSX.Element | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function highlight() {
      setIsLoading(true);
      try {
        const hast = await codeToHast(code.trim(), {
          lang: language,
          theme,
        });

        const element = toJsxRuntime(hast, {
          Fragment,
          jsx,
          jsxs,
          components: {
            pre: ({ className: preClass, ...props }) => (
              <pre
                className={cn(
                  "overflow-x-auto rounded-lg p-4 text-sm",
                  showLineNumbers && "pl-0",
                  preClass
                )}
                {...props}
              />
            ),
            code: ({ className: codeClass, ...props }) => (
              <code
                className={cn(
                  "font-mono",
                  showLineNumbers && "[counter-reset:line]",
                  codeClass
                )}
                {...props}
              />
            ),
            span: ({ className: spanClass, children, ...props }) => {
              // Handle line spans for line numbers
              if (spanClass?.includes("line") && showLineNumbers) {
                return (
                  <span
                    className={cn(
                      "before:content-[counter(line)] before:mr-6 before:inline-block before:w-4 before:text-right before:text-zinc-500 before:select-none [counter-increment:line]",
                      "pl-4",
                      spanClass
                    )}
                    {...props}
                  >
                    {children}
                  </span>
                );
              }
              return (
                <span className={spanClass} {...props}>
                  {children}
                </span>
              );
            },
          },
        }) as JSX.Element;

        setRendered(element);
      } catch (error) {
        console.error("Shiki highlighting error:", error);
        // Fallback to plain code
        setRendered(
          <pre className="overflow-x-auto rounded-lg bg-zinc-900 p-4 text-sm">
            <code className="font-mono text-zinc-100">{code}</code>
          </pre>
        );
      } finally {
        setIsLoading(false);
      }
    }

    highlight();
  }, [code, language, theme, showLineNumbers]);

  if (isLoading) {
    return (
      <div
        className={cn(
          "animate-pulse rounded-lg bg-zinc-900 p-4",
          className
        )}
      >
        <div className="h-4 w-3/4 rounded bg-zinc-800" />
        <div className="mt-2 h-4 w-1/2 rounded bg-zinc-800" />
        <div className="mt-2 h-4 w-2/3 rounded bg-zinc-800" />
      </div>
    );
  }

  return (
    <div className={cn("group relative", className)}>
      {filename && (
        <div className="flex items-center gap-2 rounded-t-lg border-b border-zinc-700 bg-zinc-800 px-4 py-2 text-xs text-zinc-400">
          <FileIcon className="h-3.5 w-3.5" />
          <span className="font-mono">{filename}</span>
        </div>
      )}
      <div className={cn(filename && "rounded-t-none [&>pre]:rounded-t-none")}>
        {rendered}
      </div>
      <CopyButton code={code} />
    </div>
  );
}

// Copy button component
function CopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className={cn(
        "absolute right-2 top-2 rounded-md p-2 text-zinc-400 opacity-0 transition-all",
        "hover:bg-zinc-700 hover:text-zinc-100",
        "group-hover:opacity-100",
        "focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-zinc-500"
      )}
      aria-label={copied ? "Copied!" : "Copy code"}
    >
      {copied ? (
        <CheckIcon className="h-4 w-4 text-green-400" />
      ) : (
        <CopyIcon className="h-4 w-4" />
      )}
    </button>
  );
}

// Minimal icons (no external dependency)
function CopyIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function FileIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
    </svg>
  );
}
