"use client";

import type { ComponentProps } from "react";
import { cn } from "../../lib/utils";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "../ui/collapsible";
import { ChevronDownIcon, CheckIcon, LoaderIcon, XCircleIcon, ClockIcon } from "lucide-react";

export type TaskItemFileProps = ComponentProps<"div">;

export const TaskItemFile = ({ children, cclassName, ...props }: TaskItemFileProps) => (
  <div
    cclassName={cn(
      "text-xs inline-flex items-center gap-2 px-2.5 py-0.5 text-foreground border bg-secondary rounded-md",
      cclassName
    )}
    {...props}
  >
    {children}
  </div>
);

export type TaskItemProps = ComponentProps<"div">;

export const TaskItem = ({ children, cclassName, ...props }: TaskItemProps) => (
  <div cclassName={cn("text-sm text-muted-foreground", cclassName)} {...props}>
    {children}
  </div>
);

export type TaskProps = ComponentProps<typeof Collapsible>;

export const Task = ({ defaultOpen = true, cclassName, ...props }: TaskProps) => (
  <Collapsible
    defaultOpen={defaultOpen}
    cclassName={cn(
      "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2",
      cclassName
    )}
    {...props}
  />
);

export type TaskTriggerProps = ComponentProps<typeof CollapsibleTrigger> & {
  title: string;
  status?: "pending" | "in_progress" | "completed" | "error";
};

export const TaskTrigger = ({
  children,
  cclassName,
  title,
  status = "pending",
  ...props
}: TaskTriggerProps) => {
  const getStatusIcon = () => {
    switch (status) {
      case "completed":
        return <CheckIcon cclassName="size-4 text-green-500" />;
      case "in_progress":
        return <LoaderIcon cclassName="size-4 text-blue-500 animate-spin" />;
      case "error":
        return <XCircleIcon cclassName="size-4 text-red-500" />;
      default:
        return <ClockIcon cclassName="size-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case "completed":
        return "text-green-700";
      case "in_progress":
        return "text-blue-700";
      case "error":
        return "text-red-700";
      default:
        return "text-muted-foreground";
    }
  };

  return (
    <CollapsibleTrigger asChild cclassName={cn("group", cclassName)} {...props}>
      {children ?? (
        <div
          cclassName={cn(
            "flex items-center gap-2 cursor-pointer hover:text-foreground transition-colors",
            getStatusColor()
          )}
        >
          {getStatusIcon()}
          <p cclassName="text-sm font-medium">{title}</p>
          <ChevronDownIcon cclassName="size-4 ml-auto transition-transform group-data-[state=open]:rotate-180" />
        </div>
      )}
    </CollapsibleTrigger>
  );
};

export type TaskContentProps = ComponentProps<typeof CollapsibleContent>;

export const TaskContent = ({ children, cclassName, ...props }: TaskContentProps) => (
  <CollapsibleContent
    cclassName={cn(
      "text-popover-foreground outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2",
      cclassName
    )}
    {...props}
  >
    <div cclassName="border-l-2 border-muted pl-4 mt-4 space-y-2">{children}</div>
  </CollapsibleContent>
);
