"use client";

import { CheckIcon, CopyIcon } from "lucide-react";
import type { ComponentProps, HTMLAttributes, ReactNode } from "react";
import { createContext, useContext, useState } from "react";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";

type CodeBlockContextType = {
  code: string;
};

const CodeBlockContext = createContext<CodeBlockContextType>({
  code: "",
});

export type CodeBlockProps = HTMLAttributes<HTMLDivElement> & {
  code: string;
  language: string;
  showLineNumbers?: boolean;
  children?: ReactNode;
};

export const CodeBlock = ({
  code,
  language,
  showLineNumbers = false,
  className,
  children,
  ...props
}: CodeBlockProps) => (
  <CodeBlockContext.Provider value={{ code }}>
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-md border bg-background text-foreground",
        className
      )}
      {...props}
    >
      <div className="relative">
        {/* Simple code display without syntax highlighting */}
        <pre className="overflow-x-auto p-4 text-sm">
          <code className="font-mono" data-language={language}>
            {showLineNumbers
              ? code.split("\n").map((line, i) => (
                  <div key={i} className="table-row">
                    <span className="table-cell pr-4 text-muted-foreground select-none">
                      {i + 1}
                    </span>
                    <span className="table-cell">{line}</span>
                  </div>
                ))
              : code}
          </code>
        </pre>
        {children && (
          <div className="absolute right-2 top-2 flex items-center gap-2">{children}</div>
        )}
      </div>
    </div>
  </CodeBlockContext.Provider>
);

export type CodeBlockCopyButtonProps = ComponentProps<typeof Button> & {
  onCopy?: () => void;
  onError?: (error: Error) => void;
  timeout?: number;
};

export const CodeBlockCopyButton = ({
  onCopy,
  onError,
  timeout = 2000,
  children,
  className,
  ...props
}: CodeBlockCopyButtonProps) => {
  const [isCopied, setIsCopied] = useState(false);
  const { code } = useContext(CodeBlockContext);

  const copyToClipboard = async () => {
    if (typeof window === "undefined" || !navigator.clipboard.writeText) {
      onError?.(new Error("Clipboard API not available"));
      return;
    }

    try {
      await navigator.clipboard.writeText(code);
      setIsCopied(true);
      onCopy?.();
      setTimeout(() => setIsCopied(false), timeout);
    } catch (error) {
      onError?.(error as Error);
    }
  };

  const Icon = isCopied ? CheckIcon : CopyIcon;

  return (
    <Button
      className={cn("mac-button mac-button-outline", "shrink-0", className)}
      onClick={copyToClipboard}
      size="icon"
      variant="ghost"
      className="mac-button mac-button-outline"
      {...props}
    >
      {children ?? <Icon size={14} />}
    </Button>
  );
};
