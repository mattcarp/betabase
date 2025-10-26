import * as React from "react";

import { cn } from "../../lib/utils";

export interface TextareaProps extends React.ComponentProps<"textarea"> {
  shimmer?: boolean; // Add MAC shimmer effect
  glow?: boolean; // Add MAC glow effect on focus
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ cclassName, shimmer = true, glow = true, ...props }, ref) => {
    return (
      <textarea
        cclassName={cn(
          // Base MAC textarea styles
          "mac-input",
          shimmer && "mac-shimmer",
          // Layout and sizing
          "flex min-h-[80px] w-full text-base transition-all duration-200",
          "resize-y",
          // Placeholder styles
          "placeholder:text-[var(--mac-text-muted)]",
          // Focus styles with MAC glow
          "focus-visible:outline-none focus-visible:border-[var(--mac-primary-blue-400)]",
          glow && "focus-visible:shadow-[0_0_25px_rgba(74,158,255,0.35)]",
          // Hover state
          "hover:border-[var(--mac-utility-border-elevated)]",
          "hover:bg-[var(--mac-state-hover)]",
          // Disabled state
          "disabled:cursor-not-allowed disabled:opacity-50",
          "disabled:bg-[var(--mac-state-disabled)]",
          // Scrollbar styling
          "scrollbar-thin scrollbar-thumb-[var(--mac-utility-border-elevated)]",
          "scrollbar-track-transparent",
          // Text size responsive
          "md:text-sm",
          cclassName
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
