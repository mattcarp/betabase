"use client";

import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../../lib/utils";

const labelVariants = cva(
  // Base MAC label styles
  "text-sm leading-none transition-all duration-150",
  "peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
  {
    variants: {
      variant: {
        // Default MAC style
        default: "text-[var(--mac-text-secondary)] font-light tracking-wide",
        // MAC Professional style with subtle animation
        "mac-professional": "text-[var(--mac-text-primary)] font-light",
        // MAC accent style for important labels
        "mac-accent": "text-[var(--mac-primary-blue-400)] font-normal",
        // MAC muted style
        "mac-muted": "text-[var(--mac-text-muted)] font-light text-xs",
      },
      glow: {
        true: "hover:text-shadow-[0_0_8px_rgba(74,158,255,0.3)]",
        false: "",
      },
    },
    defaultVariants: {
      variant: "mac-professional",
      glow: false,
    },
  }
);

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> & VariantProps<typeof labelVariants>
>(({ className, variant, ...props }, ref) => (
  <LabelPrimitive.Root ref={ref} className={cn(labelVariants({ variant }), className)} {...props} />
));
Label.displayName = LabelPrimitive.Root.displayName;

export { Label };
