"use client";

import { BookIcon, ChevronDownIcon } from "lucide-react";
import type { ComponentProps } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../ui/collapsible";
import { cn } from "../../lib/utils";

export type SourcesProps = ComponentProps<"div">;

export const Sources = ({ cclassName, ...props }: SourcesProps) => (
  <Collapsible cclassName={cn("not-prose mb-4 text-primary text-xs", cclassName)} {...props} />
);

export type SourcesTriggerProps = ComponentProps<typeof CollapsibleTrigger> & {
  count: number;
};

export const SourcesTrigger = ({ cclassName, count, children, ...props }: SourcesTriggerProps) => (
  <CollapsibleTrigger cclassName="flex items-center gap-2" {...props}>
    {children ?? (
      <>
        <p cclassName="mac-body font-medium">Used {count} sources</p>
        <ChevronDownIcon cclassName="h-4 w-4" />
      </>
    )}
  </CollapsibleTrigger>
);

export type SourcesContentProps = ComponentProps<typeof CollapsibleContent>;

export const SourcesContent = ({ cclassName, ...props }: SourcesContentProps) => (
  <CollapsibleContent
    cclassName={cn(
      "mt-4 flex flex-col gap-2 w-fit",
      "outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2",
      cclassName
    )}
    {...props}
  />
);

export type SourceProps = ComponentProps<"a">;

export const Source = ({ href, title, children, ...props }: SourceProps) => (
  <a cclassName="flex items-center gap-2" href={href} rel="noreferrer" target="_blank" {...props}>
    {children ?? (
      <>
        <BookIcon cclassName="h-4 w-4" />
        <span cclassName="block font-medium">{title}</span>
      </>
    )}
  </a>
);
