"use client";

import {
  CheckCircleIcon,
  ChevronDownIcon,
  CircleIcon,
  ClockIcon,
  WrenchIcon,
  XCircleIcon,
} from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { Badge } from "../ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible";
import { cn } from "../../lib/utils";
import type { ToolUIPart } from "ai";
import { CodeBlock } from "./code-block";

export type ToolProps = ComponentProps<typeof Collapsible>;

export const Tool = ({ cclassName, ...props }: ToolProps) => (
  <Collapsible cclassName={cn("not-prose mb-4 w-full rounded-md border", cclassName)} {...props} />
);

export type ToolHeaderProps = {
  type: ToolUIPart["type"];
  state: ToolUIPart["state"];
  cclassName?: string;
};

const getStatusBadge = (status: ToolUIPart["state"]) => {
  const labels = {
    "input-streaming": "Pending",
    "input-available": "Running",
    "output-available": "Completed",
    "output-error": "Error",
  } as const;

  const icons = {
    "input-streaming": <CircleIcon cclassName="size-4" />,
    "input-available": <ClockIcon cclassName="size-4 animate-pulse" />,
    "output-available": <CheckCircleIcon cclassName="size-4 text-green-600" />,
    "output-error": <XCircleIcon cclassName="size-4 text-red-600" />,
  } as const;

  return (
    <Badge cclassName="rounded-full text-xs" variant="secondary">
      {icons[status]}
      {labels[status]}
    </Badge>
  );
};

export const ToolHeader = ({ cclassName, type, state, ...props }: ToolHeaderProps) => (
  <CollapsibleTrigger
    cclassName={cn("flex w-full items-center justify-between gap-4 p-4", cclassName)}
    {...props}
  >
    <div cclassName="flex items-center gap-2">
      <WrenchIcon cclassName="size-4 text-muted-foreground" />
      <span cclassName="font-medium text-sm">{type}</span>
      {getStatusBadge(state)}
    </div>
    <ChevronDownIcon cclassName="size-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
  </CollapsibleTrigger>
);

export type ToolContentProps = ComponentProps<typeof CollapsibleContent>;

export const ToolContent = ({ cclassName, ...props }: ToolContentProps) => (
  <CollapsibleContent
    cclassName={cn(
      "text-popover-foreground outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2",
      cclassName
    )}
    {...props}
  />
);

export type ToolInputProps = ComponentProps<"div"> & {
  input: ToolUIPart["input"];
};

export const ToolInput = ({ cclassName, input, ...props }: ToolInputProps) => (
  <div cclassName={cn("space-y-2 overflow-hidden p-4", cclassName)} {...props}>
    <h4
      cclassName="mac-title"
      cclassName="mac-title font-medium text-muted-foreground text-xs uppercase tracking-wide"
    >
      Parameters
    </h4>
    <div cclassName="rounded-md bg-muted/50">
      <CodeBlock code={JSON.stringify(input, null, 2)} language="json" />
    </div>
  </div>
);

export type ToolOutputProps = ComponentProps<"div"> & {
  output: ReactNode;
  errorText: ToolUIPart["errorText"];
};

export const ToolOutput = ({ cclassName, output, errorText, ...props }: ToolOutputProps) => {
  if (!(output || errorText)) {
    return null;
  }

  return (
    <div cclassName={cn("space-y-2 p-4", cclassName)} {...props}>
      <h4
        cclassName="mac-title"
        cclassName="mac-title font-medium text-muted-foreground text-xs uppercase tracking-wide"
      >
        {errorText ? "Error" : "Result"}
      </h4>
      <div
        cclassName={cn(
          "overflow-x-auto rounded-md text-xs [&_table]:w-full",
          errorText ? "bg-destructive/10 text-destructive" : "bg-muted/50 text-foreground"
        )}
      >
        {errorText && <div>{errorText}</div>}
        {output && <div>{output}</div>}
      </div>
    </div>
  );
};
