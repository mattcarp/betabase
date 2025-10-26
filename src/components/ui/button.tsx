import * as React from "react";
import { Slot } from "@radix-ui/react-slot";

import { cn } from "../../lib/utils";

// MAC Design System Button variant mapping
type ButtonVariant = "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
type ButtonSize = "default" | "sm" | "lg" | "icon";

// Helper function to get MAC classes for button variants
const getButtonClasses = (
  variant: ButtonVariant = "default",
  size: ButtonSize = "default"
): string => {
  // Base MAC button styles (removed gap-2 to prevent spacing issues)
  const baseClasses =
    "mac-button inline-flex items-center justify-center whitespace-nowrap text-sm font-light transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0";

  // Variant-specific MAC classes
  const variantClasses: Record<ButtonVariant, string> = {
    default: "mac-button-primary shadow-lg hover:shadow-xl hover:scale-[1.02]",
    destructive:
      "bg-red-950/80 border border-red-500/50 text-red-100 hover:bg-red-900/90 hover:border-red-400 shadow-sm rounded-[0.5rem]",
    outline: "mac-button-outline hover:scale-[1.01]",
    secondary: "mac-button-secondary shadow-md hover:shadow-lg",
    ghost:
      "bg-transparent border-transparent hover:bg-zinc-800/50 hover:border-zinc-700 rounded-md",
    link: "text-[var(--mac-primary-blue-400)] p-0 bg-transparent border-transparent underline-offset-4 hover:underline hover:text-[var(--mac-primary-blue-600)]",
  };

  // Size-specific classes
  const sizeClasses: Record<ButtonSize, string> = {
    default: "h-9 px-4 py-2",
    sm: "h-8 rounded-md px-4 text-xs",
    lg: "h-10 rounded-md px-8",
    icon: "h-8 w-8 p-0",
  };

  return cn(baseClasses, variantClasses[variant], sizeClasses[size]);
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  asChild?: boolean;
  glow?: boolean; // Add MAC glow effect
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ cclassName, variant = "default", size = "default", glow, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    // Get MAC classes for the button
    const buttonClasses = getButtonClasses(variant, size);

    // Add optional MAC effects
    const effectClasses = cn(glow && "mac-glow");

    return <Comp cclassName={cn(buttonClasses, effectClasses, cclassName)} ref={ref} {...props} />;
  }
);
Button.displayName = "Button";

// Export a compatibility function for components still using buttonVariants
const buttonVariants = (props?: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  cclassName?: string;
}) => {
  if (!props) return getButtonClasses();
  return getButtonClasses(props.variant, props.size);
};

export { Button, buttonVariants };
