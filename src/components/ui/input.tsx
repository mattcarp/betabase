import * as React from "react";

import { cn } from "@/lib/utils";

export interface InputProps extends React.ComponentProps<"input"> {
  glow?: boolean;  // Add MAC glow effect on focus
  error?: boolean; // Indicate error state
  helperText?: string; // Helper text for additional context
  label?: string; // Accessible label for screen readers
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, glow = true, error, helperText, label, id, ...props }, ref) => {
    // Generate IDs for accessibility
    const inputId = id || React.useId();
    const helperId = helperText ? `${inputId}-helper` : undefined;
    const errorId = error && helperText ? `${inputId}-error` : undefined;
    
    return (
      <>
        <input
          id={inputId}
          type={type}
          className={cn(
            // Base MAC input styles
            "mac-input",
            // Additional shadcn-compatible styles
            "flex h-10 w-full text-base transition-all duration-200",
            // File input styles
            "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-[var(--mac-text-primary)]",
            // Placeholder styles
            "placeholder:text-[var(--mac-text-muted)]",
            // Focus styles with MAC design
            "focus-visible:outline-none focus-visible:border-[var(--mac-primary-blue-400)]",
            glow && "focus-visible:shadow-[0_0_20px_rgba(74,158,255,0.3)]",
            // Error state
            error && "border-red-500/50 focus-visible:border-red-400 focus-visible:shadow-[0_0_20px_rgba(239,68,68,0.2)]",
            // Disabled state
            "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-[var(--mac-state-disabled)]",
            // Text size responsive
            "md:text-sm",
            className,
          )}
          ref={ref}
          // Enhanced ARIA attributes
          aria-invalid={error ? "true" : undefined}
          aria-describedby={cn(
            helperId,
            errorId,
            props["aria-describedby"]
          )}
          aria-label={label || props["aria-label"]}
          aria-required={props.required ? "true" : undefined}
          {...props}
        />
        {helperText && (
          <span
            id={errorId || helperId}
            className={cn(
              "mt-1 text-xs",
              error ? "text-red-400" : "text-[var(--mac-text-muted)]"
            )}
            role={error ? "alert" : undefined}
          >
            {helperText}
          </span>
        )}
      </>
    );
  },
);
Input.displayName = "Input";

export { Input };
