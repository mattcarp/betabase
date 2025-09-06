"use client";

import React from "react";
import type { ComponentProps, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export interface ActionItem {
  label: string;
  onClick: () => void;
  icon?: ReactNode;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  tooltip?: string;
}

export type ActionsProps = ComponentProps<"div"> & {
  actions?: ActionItem[];
};

export const Actions = ({ className, children, actions, ...props }: ActionsProps) => {
  if (actions && actions.length > 0) {
    return (
      <div className={cn("flex flex-col gap-1", className)} {...props}>
        {actions.map((action, index) => (
          <Button
            key={index}
            onClick={action.onClick}
            variant={action.variant || "ghost"}
            size="sm"
            className={cn(
              "justify-start text-xs h-7 px-2 py-1",
              "mac-button-ghost hover:bg-mac-state-hover",
              action.variant === "destructive" && "text-red-400 hover:text-red-300 hover:bg-red-950/20"
            )}
          >
            {action.icon && <span className="mr-2">{action.icon}</span>}
            <span>{action.label}</span>
          </Button>
        ))}
      </div>
    );
  }
  
  return (
    <div className={cn("flex items-center gap-1", className)} {...props}>
      {children}
    </div>
  );
};

export type ActionProps = ComponentProps<typeof Button> & {
  tooltip?: string;
  label?: string;
};

export const Action = ({
  tooltip,
  children,
  label,
  className,
  variant = "ghost",
  size = "sm",
  ...props
}: ActionProps) => {
  const button = (
    <Button
      className={cn(
        "size-9 p-1.5 text-muted-foreground hover:text-foreground",
        className,
      )}
      size={size}
      type="button"
      variant={variant}
      {...props}
    >
      {children}
      <span className="sr-only">{label || tooltip}</span>
    </Button>
  );

  if (tooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent>
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return button;
};
