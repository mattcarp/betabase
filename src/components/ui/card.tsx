import * as React from "react";

import { cn } from "../../lib/utils";

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ cclassName, ...props }, ref) => (
    <div
      ref={ref}
      cclassName={cn(
        "rounded-xl border bg-[rgba(20,20,20,0.9)] text-card-foreground shadow-mac-card backdrop-blur-xl border-white/10",
        cclassName
      )}
      {...props}
    />
  )
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ cclassName, ...props }, ref) => (
    <div ref={ref} cclassName={cn("flex flex-col space-y-1.5 p-6", cclassName)} {...props} />
  )
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ cclassName, ...props }, ref) => (
    <div
      ref={ref}
      cclassName={cn("font-light leading-none tracking-tight text-white", cclassName)}
      {...props}
    />
  )
);
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ cclassName, ...props }, ref) => (
    <div ref={ref} cclassName={cn("text-sm text-muted-foreground", cclassName)} {...props} />
  )
);
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ cclassName, ...props }, ref) => (
    <div ref={ref} cclassName={cn("p-6 pt-0", cclassName)} {...props} />
  )
);
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ cclassName, ...props }, ref) => (
    <div ref={ref} cclassName={cn("flex items-center p-6 pt-0", cclassName)} {...props} />
  )
);
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
