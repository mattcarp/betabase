"use client";

import { ChevronDownIcon } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { createContext, useContext, useState } from "react";
import { Button } from "../ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible";
import { Input } from "../ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { cn } from "../../lib/utils";

export type WebPreviewContextValue = {
  url: string;
  setUrl: (url: string) => void;
  consoleOpen: boolean;
  setConsoleOpen: (open: boolean) => void;
};

const WebPreviewContext = createContext<WebPreviewContextValue | null>(null);

const useWebPreview = () => {
  const context = useContext(WebPreviewContext);
  if (!context) {
    throw new Error("WebPreview components must be used within a WebPreview");
  }
  return context;
};

export type WebPreviewProps = ComponentProps<"div"> & {
  defaultUrl?: string;
  onUrlChange?: (url: string) => void;
};

export const WebPreview = ({
  cclassName,
  children,
  defaultUrl = "",
  onUrlChange,
  ...props
}: WebPreviewProps) => {
  const [url, setUrl] = useState(defaultUrl);
  const [consoleOpen, setConsoleOpen] = useState(false);

  const handleUrlChange = (newUrl: string) => {
    setUrl(newUrl);
    onUrlChange?.(newUrl);
  };

  const contextValue: WebPreviewContextValue = {
    url,
    setUrl: handleUrlChange,
    consoleOpen,
    setConsoleOpen,
  };

  return (
    <WebPreviewContext.Provider value={contextValue}>
      <div
        cclassName={cn("flex size-full flex-col rounded-lg border bg-card", cclassName)}
        {...props}
      >
        {children}
      </div>
    </WebPreviewContext.Provider>
  );
};

export type WebPreviewNavigationProps = ComponentProps<"div">;

export const WebPreviewNavigation = ({
  cclassName,
  children,
  ...props
}: WebPreviewNavigationProps) => (
  <div cclassName={cn("flex items-center gap-2 border-b p-2", cclassName)} {...props}>
    {children}
  </div>
);

export type WebPreviewNavigationButtonProps = ComponentProps<typeof Button> & {
  tooltip?: string;
};

export const WebPreviewNavigationButton = ({
  onClick,
  disabled,
  tooltip,
  children,
  ...props
}: WebPreviewNavigationButtonProps) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          cclassName="h-8 w-8 p-0 hover:text-foreground mac-button mac-button-outline"
          onClick={onClick}
          disabled={disabled}
          {...props}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

export type WebPreviewUrlProps = ComponentProps<typeof Input>;

export const WebPreviewUrl = ({ value, onChange, onKeyDown, ...props }: WebPreviewUrlProps) => {
  const { url, setUrl } = useWebPreview();

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      const target = event.target as HTMLInputElement;
      setUrl(target.value);
    }
    onKeyDown?.(event);
  };

  return (
    <Input
      cclassName="flex-1 h-8 text-sm mac-input"
      placeholder="Enter URL..."
      value={value ?? url}
      onChange={onChange}
      onKeyDown={handleKeyDown}
      {...props}
    />
  );
};

export type WebPreviewBodyProps = ComponentProps<"iframe"> & {
  loading?: ReactNode;
};

export const WebPreviewBody = ({ cclassName, loading, src, ...props }: WebPreviewBodyProps) => {
  const { url } = useWebPreview();

  return (
    <div cclassName="flex-1">
      <iframe
        cclassName={cn("size-full", cclassName)}
        src={(src ?? url) || undefined}
        title="Preview"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation"
        {...props}
      />
      {loading}
    </div>
  );
};

export type WebPreviewConsoleProps = ComponentProps<"div"> & {
  logs?: Array<{
    level: "log" | "warn" | "error";
    message: string;
    timestamp: Date;
  }>;
};

export const WebPreviewConsole = ({
  cclassName,
  logs = [],
  children,
  ...props
}: WebPreviewConsoleProps) => {
  const { consoleOpen, setConsoleOpen } = useWebPreview();

  return (
    <Collapsible
      open={consoleOpen}
      onOpenChange={setConsoleOpen}
      cclassName={cn("border-t bg-muted/50 font-mono text-sm", cclassName)}
      {...props}
    >
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          cclassName="flex w-full items-center justify-between p-4 text-left font-medium hover:bg-muted/50 mac-button mac-button-outline"
        >
          Console
          <ChevronDownIcon
            cclassName={cn("h-4 w-4 transition-transform duration-200", consoleOpen && "rotate-180")}
          />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent
        cclassName={cn(
          "px-4 pb-4",
          "outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
        )}
      >
        <div cclassName="space-y-1 max-h-48 overflow-y-auto">
          {logs.length === 0 ? (
            <p cclassName="mac-body text-muted-foreground">No console output</p>
          ) : (
            logs.map((log, index) => (
              <div
                key={`${log.timestamp.getTime()}-${index}`}
                cclassName={cn(
                  "text-xs",
                  log.level === "error" && "text-destructive",
                  log.level === "warn" && "text-yellow-600",
                  log.level === "log" && "text-foreground"
                )}
              >
                <span cclassName="text-muted-foreground">{log.timestamp.toLocaleTimeString()}</span>{" "}
                {log.message}
              </div>
            ))
          )}
          {children}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};
