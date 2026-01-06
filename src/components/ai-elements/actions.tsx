"use client";

import React from "react";
import type { ComponentProps, ReactNode } from "react";
import { Button } from "../ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { cn } from "../../lib/utils";

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
      <div className={cn("flex flex-col gap-2", className)} {...props}>
        {actions.map((action, index) => (
          <Button
            key={index}
            onClick={action.onClick}
            variant={action.variant || "ghost"}
            size="sm"
            className={cn(
              "justify-start text-xs h-8 px-2 py-2.5 font-light gap-3",
              "mac-button-ghost hover:bg-mac-state-hover",
              "transition-all duration-150 ease-out",
              "text-mac-text-secondary hover:text-mac-text-primary",
              "border border-transparent hover:border-mac-border/20",
              "bg-transparent",
              action.variant === "destructive" &&
                "text-red-400/80 hover:text-red-400 hover:bg-red-950/20 hover:border-red-900/20"
            )}
          >
            {action.icon && <span className="opacity-70 shrink-0">{action.icon}</span>}
            <span>{action.label}</span>
          </Button>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2", className)} {...props}>
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
  size = "icon",
  ...props
}: ActionProps) => {
  const button = (
    <Button
      className={cn(
        "mac-button mac-button-primary",
        "!h-8 !w-8 !p-0 text-primary hover:text-primary/80 shrink-0",
        className
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
